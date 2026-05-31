"""
Native app update decisions for CheckNativeStatus.

Evergreen: a build is supported for a fixed window from when it was created; past that,
the client must update. Two independent clocks apply:

  - the store window gates the native binary and is always in force, because a fresh OTA
    still runs on top of an old binary - no OTA can rescue a binary past its window;
  - the OTA window gates the JS bundle running on top, and only applies when the client is
    actually running an OTA.

Each clock is `none` below 75% of its window, `warn` from 75%, and `block` at 100%. The two
are resolved by severity first, then store precedence (a failing binary can only be fixed via
the store). The result maps onto NativeUpdateInfo: when actionable it is always `required` with
`act_by = created_at + window`, and the client turns a future deadline into a dismissible warning
and a past one into a hard block.

GrowthBook supplies policy only (support windows, channel, presentation), never release data.
Banning is enforced on the OTA-serving side (GetNativeUpdateManifest), not here.
"""

import enum
import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

from couchers.ota_registry import OtaRegistry, get_ota_registry

if TYPE_CHECKING:
    from couchers.context import CouchersContext

logger = logging.getLogger(__name__)


WARN_FRACTION = 0.75
DEFAULT_OTA_SUPPORT_DAYS = 28
DEFAULT_STORE_SUPPORT_DAYS = 91


class ClockState(enum.IntEnum):
    # Ordinal: ordered by severity so max() picks the worst across the two clocks.
    none = 0
    warn = 1
    block = 2


class UpdateAction(enum.Enum):
    none = enum.auto()
    ota = enum.auto()
    store = enum.auto()


@dataclass(frozen=True)
class NativeClientInfo:
    platform: str = ""
    runtime_version: str = ""
    update_id: str | None = None
    is_ota_launch: bool = False
    # Creation time of the native binary (store build); start of the store clock.
    binary_created_at: datetime | None = None
    # Creation time of the running JS bundle; start of the OTA clock when running an OTA.
    bundle_created_at: datetime | None = None


@dataclass(frozen=True)
class NativeUpdateDecision:
    action: UpdateAction
    required: bool
    act_by: datetime | None
    message: str
    link_url: str
    link_text: str


_NO_UPDATE = NativeUpdateDecision(
    action=UpdateAction.none, required=False, act_by=None, message="", link_url="", link_text=""
)


def _parse_iso(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    # Normalize to aware UTC so arithmetic against now() (aware) works.
    return parsed.replace(tzinfo=UTC) if parsed.tzinfo is None else parsed


def parse_client_info(debug_json: str) -> NativeClientInfo:
    """
    Best-effort parse of the mobile diagnostics payload. The exact wire format is not yet frozen
    (see OTA-plan.md); malformed input degrades to an empty info, which yields a NONE decision
    rather than raising.
    """
    try:
        raw = json.loads(debug_json)
    except json.JSONDecodeError, ValueError:
        logger.warning("CheckNativeStatus: could not parse debug_json")
        return NativeClientInfo()
    if not isinstance(raw, dict):
        return NativeClientInfo()

    update_id = raw.get("updateId") or None
    if update_id == "none":
        update_id = None

    if "launchSource" in raw:
        is_ota_launch = raw.get("launchSource") == "ota"
    elif "isEmbeddedLaunch" in raw:
        is_ota_launch = not bool(raw.get("isEmbeddedLaunch"))
    else:
        is_ota_launch = False

    return NativeClientInfo(
        platform=str(raw.get("platform") or ""),
        runtime_version=str(raw.get("runtimeVersion") or ""),
        update_id=update_id,
        is_ota_launch=is_ota_launch,
        binary_created_at=_parse_iso(raw.get("embeddedCreatedAt")),
        bundle_created_at=_parse_iso(raw.get("createdAt")),
    )


def _clock_state(age: timedelta, window: timedelta) -> ClockState:
    if window <= timedelta(0):
        return ClockState.none  # a window of zero disables the clock
    frac = age / window
    if frac >= 1.0:
        return ClockState.block
    if frac >= WARN_FRACTION:
        return ClockState.warn
    return ClockState.none


def _presentation(context: CouchersContext, platform: str, action: UpdateAction) -> tuple[str, str, str]:
    # Per-platform copy/links for the prompt, e.g.
    #   {"ios": {"store_url": ..., "store_message": ..., "store_link_text": ..., "ota_message": ...}}
    presentation: dict[str, Any] = context.get_object_value("native_update_presentation", {})
    entry = presentation.get(platform, {}) if isinstance(presentation, dict) else {}
    if not isinstance(entry, dict):
        entry = {}
    if action == UpdateAction.store:
        return (
            str(entry.get("store_message", "")),
            str(entry.get("store_url", "")),
            str(entry.get("store_link_text", "")),
        )
    # OTA: the client fetches and applies in-app, so there is no link.
    return str(entry.get("ota_message", "")), "", ""


def decide_native_update(
    context: CouchersContext,
    info: NativeClientInfo,
    now: datetime,
    registry: OtaRegistry | None = None,
) -> NativeUpdateDecision:
    registry = registry or get_ota_registry()

    store_window = timedelta(days=context.get_integer_value("native_store_support_days", DEFAULT_STORE_SUPPORT_DAYS))
    ota_window = timedelta(days=context.get_integer_value("native_ota_support_days", DEFAULT_OTA_SUPPORT_DAYS))

    # Store clock: the native binary, always in force.
    store_state = ClockState.none
    store_deadline: datetime | None = None
    if info.binary_created_at is not None:
        store_deadline = info.binary_created_at + store_window
        store_state = _clock_state(now - info.binary_created_at, store_window)

    # OTA clock: the JS bundle on top, only when one is running.
    ota_state = ClockState.none
    ota_deadline: datetime | None = None
    if info.is_ota_launch:
        # Prefer the registry's authoritative publish time; fall back to the client's report.
        bundle_created_at = info.bundle_created_at
        if info.update_id is not None:
            package = registry.get_package(platform=info.platform, update_id=info.update_id)
            if package is not None:
                bundle_created_at = package.created_at
        if bundle_created_at is not None:
            ota_deadline = bundle_created_at + ota_window
            ota_state = _clock_state(now - bundle_created_at, ota_window)

    severity = max(store_state, ota_state)
    if severity == ClockState.none:
        return _NO_UPDATE

    # Store precedence at equal severity: a failing binary can only be fixed via the store.
    if store_state == severity:
        action = UpdateAction.store
        deadline = store_deadline
    else:
        action = UpdateAction.ota
        deadline = ota_deadline

    message, link_url, link_text = _presentation(context, info.platform, action)
    return NativeUpdateDecision(
        action=action,
        required=True,
        act_by=deadline,
        message=message,
        link_url=link_url,
        link_text=link_text,
    )
