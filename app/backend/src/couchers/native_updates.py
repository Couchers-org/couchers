"""
Native app update decisions for CheckNativeStatus.
"""

import enum
import logging
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from couchers.context import CouchersContext
from couchers.proto import bugs_pb2

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


class UpdateCause(enum.Enum):
    unspecified = enum.auto()
    # Bundle or binary is past its support window — user is on an old version.
    age = enum.auto()
    # Currently-running bundle is banned — we shipped a buggy version.
    banned = enum.auto()


@dataclass(frozen=True)
class NativeClientInfo:
    platform: str = ""
    runtime_version: str = ""
    update_id: str | None = None
    is_ota_launch: bool = False
    binary_created_at: datetime | None = None
    bundle_created_at: datetime | None = None
    eas_client_id: uuid.UUID | None = None


def parse_optional_eas_client_id(value: str | None) -> uuid.UUID | None:
    if not value:
        return None
    try:
        return uuid.UUID(value)
    except ValueError:
        return None


@dataclass(frozen=True)
class NativeUpdateDecision:
    action: UpdateAction
    severity: Severity
    act_by: datetime | None
    cause: UpdateCause


_NO_UPDATE = NativeUpdateDecision(
    action=UpdateAction.none, severity=Severity.none, act_by=None, cause=UpdateCause.unspecified
)


def client_info_from_request(request: bugs_pb2.CheckNativeStatusReq) -> NativeClientInfo:
    update_id = request.update_id or None
    # "none" is the placeholder the client sends when expo-updates has no current updateId.
    if update_id == "none":
        update_id = None

    # launch_source is authoritative; is_embedded_launch is wire-level diagnostics only.
    is_ota_launch = request.launch_source == "ota"

    binary_created_at = (
        request.embedded_created_at.ToDatetime(tzinfo=UTC) if request.HasField("embedded_created_at") else None
    )
    bundle_created_at = request.created_at.ToDatetime(tzinfo=UTC) if request.HasField("created_at") else None

    return NativeClientInfo(
        platform=request.platform,
        runtime_version=request.runtime_version,
        update_id=update_id,
        is_ota_launch=is_ota_launch,
        binary_created_at=binary_created_at,
        bundle_created_at=bundle_created_at,
        eas_client_id=parse_optional_eas_client_id(request.eas_client_id),
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
        return NativeUpdateDecision(
            action=UpdateAction.ota, severity=Severity.block, act_by=None, cause=UpdateCause.banned
        )

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
        return NativeUpdateDecision(
            action=UpdateAction.store, severity=severity, act_by=store_deadline, cause=UpdateCause.age
        )
    return NativeUpdateDecision(action=UpdateAction.ota, severity=severity, act_by=ota_deadline, cause=UpdateCause.age)
