from datetime import UTC, datetime, timedelta
from typing import Any, cast

from google.protobuf.timestamp_pb2 import Timestamp

from couchers.context import CouchersContext
from couchers.native_updates import (
    DEFAULT_OTA_BLOCK_DAYS,
    DEFAULT_OTA_WARN_DAYS,
    DEFAULT_STORE_BLOCK_DAYS,
    DEFAULT_STORE_WARN_DAYS,
    NativeClientInfo,
    Severity,
    UpdateAction,
    client_info_from_request,
    decide_native_update,
)
from couchers.proto import bugs_pb2

NOW = datetime(2026, 5, 31, 12, 0, tzinfo=UTC)


class _FakeContext:
    def __init__(self, flags: dict[str, Any] | None = None) -> None:
        self._flags = flags or {}

    def get_integer_value(self, key: str, default: int) -> int:
        return int(self._flags.get(key, default))


def _days_ago(days: float) -> datetime:
    return NOW - timedelta(days=days)


def _decide(
    info: NativeClientInfo,
    flags: dict[str, Any] | None = None,
    *,
    banned: bool = False,
):
    context = cast(CouchersContext, _FakeContext(flags))
    return decide_native_update(context, info, NOW, banned=banned)


def _ts(dt: datetime) -> Timestamp:
    out = Timestamp()
    out.FromDatetime(dt)
    return out


def test_client_info_from_full_proto():
    req = bugs_pb2.CheckNativeStatusReq(
        platform="ios",
        runtime_version="ios-fingerprint",
        update_id="abc-123",
        launch_source="ota",
        created_at=_ts(datetime(2026, 5, 1, tzinfo=UTC)),
        embedded_created_at=_ts(datetime(2026, 1, 1, tzinfo=UTC)),
    )
    info = client_info_from_request(req)
    assert info.platform == "ios"
    assert info.runtime_version == "ios-fingerprint"
    assert info.update_id == "abc-123"
    assert info.is_ota_launch is True
    assert info.bundle_created_at == datetime(2026, 5, 1, tzinfo=UTC)
    assert info.binary_created_at == datetime(2026, 1, 1, tzinfo=UTC)


def test_client_info_embedded_launch_source():
    req = bugs_pb2.CheckNativeStatusReq(
        platform="android", launch_source="embedded", is_embedded_launch=True, update_id="none"
    )
    info = client_info_from_request(req)
    assert info.is_ota_launch is False
    # "none" is the placeholder for absent updateId on the client.
    assert info.update_id is None


def test_client_info_defaults_when_request_empty():
    info = client_info_from_request(bugs_pb2.CheckNativeStatusReq())
    assert info == NativeClientInfo()


def test_no_timestamps_means_no_update():
    decision = _decide(NativeClientInfo(platform="ios"))
    assert decision.action == UpdateAction.none
    assert decision.severity == Severity.none


def test_fresh_binary_no_update():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(10))
    assert _decide(info).severity == Severity.none


def test_binary_between_warn_and_block_is_store_warn():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(DEFAULT_STORE_WARN_DAYS + 1))
    decision = _decide(info)
    assert decision.action == UpdateAction.store
    assert decision.severity == Severity.warn
    assert decision.act_by is not None and decision.act_by > NOW


def test_binary_past_block_is_store_block():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(DEFAULT_STORE_BLOCK_DAYS + 5))
    decision = _decide(info)
    assert decision.action == UpdateAction.store
    assert decision.severity == Severity.block
    assert decision.act_by is not None and decision.act_by <= NOW


def test_ota_between_warn_and_block_is_ota_warn():
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        binary_created_at=_days_ago(5),
        bundle_created_at=_days_ago(DEFAULT_OTA_WARN_DAYS + 1),
    )
    decision = _decide(info)
    assert decision.action == UpdateAction.ota
    assert decision.severity == Severity.warn
    assert decision.act_by is not None and decision.act_by > NOW


def test_ota_past_block_is_ota_block():
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        binary_created_at=_days_ago(5),
        bundle_created_at=_days_ago(DEFAULT_OTA_BLOCK_DAYS + 2),
    )
    decision = _decide(info)
    assert decision.action == UpdateAction.ota
    assert decision.severity == Severity.block


def test_ota_clock_ignored_when_not_running_ota():
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=False,
        binary_created_at=_days_ago(5),
        bundle_created_at=_days_ago(DEFAULT_OTA_BLOCK_DAYS + 100),
    )
    assert _decide(info).severity == Severity.none


def test_binary_warn_but_ota_block_resolves_to_ota_block():
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        binary_created_at=_days_ago(DEFAULT_STORE_WARN_DAYS + 1),
        bundle_created_at=_days_ago(DEFAULT_OTA_BLOCK_DAYS + 2),
    )
    decision = _decide(info)
    assert decision.action == UpdateAction.ota
    assert decision.severity == Severity.block


def test_store_precedence_when_severities_tie():
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        binary_created_at=_days_ago(DEFAULT_STORE_BLOCK_DAYS + 1),
        bundle_created_at=_days_ago(DEFAULT_OTA_BLOCK_DAYS + 1),
    )
    assert _decide(info).action == UpdateAction.store


def test_binary_block_beats_ota_warn():
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        binary_created_at=_days_ago(DEFAULT_STORE_BLOCK_DAYS + 1),
        bundle_created_at=_days_ago(DEFAULT_OTA_WARN_DAYS + 1),
    )
    assert _decide(info).action == UpdateAction.store


def test_warn_days_drive_warn_threshold():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(8))
    decision = _decide(info, flags={"native_store_warn_days": 7, "native_store_block_days": 30})
    assert decision.severity == Severity.warn


def test_block_days_drive_block_threshold():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(10))
    decision = _decide(info, flags={"native_store_warn_days": 5, "native_store_block_days": 7})
    assert decision.action == UpdateAction.store
    assert decision.severity == Severity.block


def test_zero_block_disables_clock():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(1000))
    assert _decide(info, flags={"native_store_block_days": 0}).severity == Severity.none


def test_banned_bundle_on_ota_launch_forces_block():
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        update_id="abc",
        binary_created_at=_days_ago(5),
        bundle_created_at=_days_ago(1),
    )
    decision = _decide(info, banned=True)
    assert decision.action == UpdateAction.ota
    assert decision.severity == Severity.block
    # Unset deadline = block-now per the proto contract; avoids clock-skew flipping into warn.
    assert decision.act_by is None


def test_banned_ignored_when_not_an_ota_launch():
    info = NativeClientInfo(platform="ios", is_ota_launch=False, binary_created_at=_days_ago(5))
    assert _decide(info, banned=True).severity == Severity.none
