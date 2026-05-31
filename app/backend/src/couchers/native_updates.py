"""
Native app update decisions for CheckNativeStatus. See OTA-plan.md.
"""

import enum
import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from babel.dates import format_timedelta

from couchers.context import CouchersContext
from couchers.i18n import LocalizationContext

logger = logging.getLogger(__name__)


DEFAULT_OTA_WARN_DAYS = 21
DEFAULT_OTA_BLOCK_DAYS = 28
DEFAULT_STORE_WARN_DAYS = 70
DEFAULT_STORE_BLOCK_DAYS = 91

# Static enough that a flag is not worth it.
STORE_URLS: dict[str, str] = {
    "ios": "https://apps.apple.com/us/app/couchers-org/id6623776751",
    "android": "https://play.google.com/store/apps/details?id=org.couchers.android",
}


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
    # already on it to move.
    if banned and info.is_ota_launch:
        return NativeUpdateDecision(action=UpdateAction.ota, severity=Severity.block, act_by=now)

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


def store_url_for(platform: str) -> str:
    return STORE_URLS.get(platform, "")


def native_update_message(
    localization: LocalizationContext,
    decision: NativeUpdateDecision,
    *,
    platform: str,
    now: datetime,
) -> tuple[str, str]:
    """Returns (message, link_text) for a non-`none` decision. Empty strings otherwise."""
    if decision.severity == Severity.none or decision.action not in (UpdateAction.ota, UpdateAction.store):
        return "", ""

    action_key = "store" if decision.action == UpdateAction.store else "ota"
    sev_key = "block" if decision.severity == Severity.block else "warn"

    subs: dict[str, str | int] = {}
    if decision.action == UpdateAction.store:
        store_name_key = (
            f"native_update.store_name_{platform}" if platform in STORE_URLS else "native_update.store_name_ios"
        )
        subs["store_name"] = localization.localize_string(store_name_key)

    if sev_key == "warn" and decision.act_by is not None and decision.act_by > now:
        subs["time_left"] = format_timedelta(decision.act_by - now, locale=localization.babel_locale)

    preamble = localization.localize_string("native_update.preamble")
    body = localization.localize_string(f"native_update.{action_key}.{sev_key}", substitutions=subs)
    message = f"{preamble} {body}"

    if decision.action == UpdateAction.store:
        link_text = localization.localize_string(
            "native_update.store_link_text", substitutions={"store_name": subs["store_name"]}
        )
    else:
        link_text = localization.localize_string("native_update.ota_link_text")

    return message, link_text
