"""
Native app update decisions for CheckNativeStatus.
"""

import enum
import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from couchers.context import CouchersContext

logger = logging.getLogger(__name__)


DEFAULT_OTA_WARN_DAYS = 21
DEFAULT_OTA_BLOCK_DAYS = 28
DEFAULT_STORE_WARN_DAYS = 70
DEFAULT_STORE_BLOCK_DAYS = 91


class Severity(enum.IntEnum):
    # Ordered by severity so max() picks the worst across the two clocks.
    none = 0
    warn = 1
    block = 2


class UpdateAction(enum.Enum):
    unspecified = enum.auto()
    none = enum.auto()
    ota = enum.auto()
    store = enum.auto()
    # Reserved for a future nuke path (delete and reinstall the app). Not produced by the current
    # decision logic — no signal feeds it.
    reinstall = enum.auto()


@dataclass(frozen=True)
class NativeClientInfo:
    platform: str = ""
    runtime_version: str = ""
    update_id: str | None = None
    is_ota_launch: bool = False
    binary_created_at: datetime | None = None
    bundle_created_at: datetime | None = None


@dataclass(frozen=True)
class NativeUpdateDecision:
    action: UpdateAction
    severity: Severity
    act_by: datetime | None


_NO_UPDATE = NativeUpdateDecision(action=UpdateAction.none, severity=Severity.none, act_by=None)


def _parse_iso(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed.replace(tzinfo=UTC) if parsed.tzinfo is None else parsed


def parse_client_info(debug_json: str) -> NativeClientInfo:
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


def _clock_state(age: timedelta, warn: timedelta, block: timedelta) -> Severity:
    if block <= timedelta(0):
        return Severity.none
    if age >= block:
        return Severity.block
    if warn > timedelta(0) and age >= warn:
        return Severity.warn
    return Severity.none


def decide_native_update(
    context: CouchersContext,
    info: NativeClientInfo,
    now: datetime,
    *,
    banned: bool = False,
) -> NativeUpdateDecision:
    # A device running a banned OTA bundle is blocked immediately, ahead of the age clocks. The
    # banned ban only stops new check-ins being served the bundle; this is what forces the devices
    # already on it to move. act_by is left unset: per the proto contract the client treats an
    # unset deadline as block-now, which avoids a tiny clock-skew window where a now-timestamp
    # would land slightly in the client's future and read as warn.
    if banned and info.is_ota_launch:
        return NativeUpdateDecision(action=UpdateAction.ota, severity=Severity.block, act_by=None)

    store_warn = timedelta(days=context.get_integer_value("native_store_warn_days", DEFAULT_STORE_WARN_DAYS))
    store_block = timedelta(days=context.get_integer_value("native_store_block_days", DEFAULT_STORE_BLOCK_DAYS))
    ota_warn = timedelta(days=context.get_integer_value("native_ota_warn_days", DEFAULT_OTA_WARN_DAYS))
    ota_block = timedelta(days=context.get_integer_value("native_ota_block_days", DEFAULT_OTA_BLOCK_DAYS))

    store_state = Severity.none
    store_deadline: datetime | None = None
    if info.binary_created_at is not None:
        store_deadline = info.binary_created_at + store_block
        store_state = _clock_state(now - info.binary_created_at, store_warn, store_block)

    ota_state = Severity.none
    ota_deadline: datetime | None = None
    if info.is_ota_launch and info.bundle_created_at is not None:
        ota_deadline = info.bundle_created_at + ota_block
        ota_state = _clock_state(now - info.bundle_created_at, ota_warn, ota_block)

    severity = Severity(max(store_state, ota_state))
    if severity == Severity.none:
        return _NO_UPDATE

    # Store precedence at equal severity: a failing binary cannot be rescued by an OTA.
    if store_state == severity:
        return NativeUpdateDecision(action=UpdateAction.store, severity=severity, act_by=store_deadline)
    return NativeUpdateDecision(action=UpdateAction.ota, severity=severity, act_by=ota_deadline)
