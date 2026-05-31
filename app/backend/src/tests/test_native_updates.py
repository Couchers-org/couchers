import json
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from couchers.context import CouchersContext
from couchers.native_updates import (
    DEFAULT_OTA_SUPPORT_DAYS,
    DEFAULT_STORE_SUPPORT_DAYS,
    NativeClientInfo,
    UpdateAction,
    decide_native_update,
    parse_client_info,
)
from couchers.ota_registry import OtaPackage

NOW = datetime(2026, 5, 31, 12, 0, tzinfo=UTC)


class _FakeContext:
    """Minimal stand-in for CouchersContext's feature-flag accessors."""

    def __init__(self, flags: dict[str, Any] | None = None) -> None:
        self._flags = flags or {}

    def get_integer_value(self, key: str, default: int) -> int:
        return int(self._flags.get(key, default))

    def get_object_value(self, key: str, default: Any) -> Any:
        return self._flags.get(key, default)


class _FakeRegistry:
    def __init__(self, packages: dict[str, OtaPackage] | None = None) -> None:
        self._packages = packages or {}

    def get_package(self, *, platform: str, update_id: str) -> OtaPackage | None:
        return self._packages.get(update_id)


def _days_ago(days: float) -> datetime:
    return NOW - timedelta(days=days)


def _decide(info: NativeClientInfo, flags: dict[str, Any] | None = None, registry: _FakeRegistry | None = None):
    context = cast(CouchersContext, _FakeContext(flags))
    return decide_native_update(context, info, NOW, registry=registry or _FakeRegistry())


# --- parse_client_info ---


def test_parse_full_payload():
    info = parse_client_info(
        json.dumps(
            {
                "platform": "ios",
                "runtimeVersion": "ios-fingerprint",
                "updateId": "abc-123",
                "launchSource": "ota",
                "createdAt": "2026-05-01T00:00:00Z",
                "embeddedCreatedAt": "2026-01-01T00:00:00Z",
            }
        )
    )
    assert info.platform == "ios"
    assert info.runtime_version == "ios-fingerprint"
    assert info.update_id == "abc-123"
    assert info.is_ota_launch is True
    assert info.bundle_created_at == datetime(2026, 5, 1, tzinfo=UTC)
    assert info.binary_created_at == datetime(2026, 1, 1, tzinfo=UTC)


def test_parse_embedded_launch_from_is_embedded_launch():
    info = parse_client_info(json.dumps({"platform": "android", "isEmbeddedLaunch": True, "updateId": "none"}))
    assert info.is_ota_launch is False
    assert info.update_id is None


def test_parse_malformed_json_is_empty():
    info = parse_client_info("{not json")
    assert info == NativeClientInfo()


def test_parse_non_dict_is_empty():
    assert parse_client_info(json.dumps([1, 2, 3])) == NativeClientInfo()


# --- decide_native_update: store clock ---


def test_no_timestamps_means_no_update():
    assert _decide(NativeClientInfo(platform="ios")).action == UpdateAction.none


def test_fresh_binary_no_update():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(10))
    assert _decide(info).action == UpdateAction.none


def test_binary_in_warn_window_is_store_warn():
    # 80% of the 91-day store window -> warn, deadline still in the future.
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(DEFAULT_STORE_SUPPORT_DAYS * 0.8))
    decision = _decide(info)
    assert decision.action == UpdateAction.store
    assert decision.required is True
    assert decision.act_by > NOW


def test_binary_past_window_is_store_block():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(DEFAULT_STORE_SUPPORT_DAYS + 5))
    decision = _decide(info)
    assert decision.action == UpdateAction.store
    assert decision.required is True
    assert decision.act_by <= NOW  # past deadline -> client blocks


# --- decide_native_update: OTA clock ---


def test_ota_in_warn_window_is_ota_warn():
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        binary_created_at=_days_ago(5),
        bundle_created_at=_days_ago(DEFAULT_OTA_SUPPORT_DAYS * 0.8),
    )
    decision = _decide(info)
    assert decision.action == UpdateAction.ota
    assert decision.act_by > NOW
    assert decision.link_url == ""  # OTA applies in-app, no link


def test_ota_past_window_is_ota_block():
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        binary_created_at=_days_ago(5),
        bundle_created_at=_days_ago(DEFAULT_OTA_SUPPORT_DAYS + 2),
    )
    decision = _decide(info)
    assert decision.action == UpdateAction.ota
    assert decision.act_by <= NOW


def test_ota_clock_ignored_when_not_running_ota():
    # An expired bundle timestamp is irrelevant if the client is on the embedded binary.
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=False,
        binary_created_at=_days_ago(5),
        bundle_created_at=_days_ago(DEFAULT_OTA_SUPPORT_DAYS + 100),
    )
    assert _decide(info).action == UpdateAction.none


# --- decide_native_update: resolving the two clocks ---


def test_binary_warn_but_ota_block_resolves_to_ota_block():
    # Severity wins: a fully-expired OTA on a still-supported binary -> fetch fresh JS, not a
    # dismissible store warning.
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        binary_created_at=_days_ago(DEFAULT_STORE_SUPPORT_DAYS * 0.8),
        bundle_created_at=_days_ago(DEFAULT_OTA_SUPPORT_DAYS + 2),
    )
    decision = _decide(info)
    assert decision.action == UpdateAction.ota
    assert decision.act_by <= NOW


def test_binary_block_beats_ota_warn():
    # Store precedence: a dead binary can only be fixed via the store, regardless of OTA state.
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        binary_created_at=_days_ago(DEFAULT_STORE_SUPPORT_DAYS + 1),
        bundle_created_at=_days_ago(DEFAULT_OTA_SUPPORT_DAYS * 0.8),
    )
    assert _decide(info).action == UpdateAction.store


# --- policy + presentation ---


def test_windows_come_from_policy():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(10))
    # A 7-day store window makes a 10-day-old binary expired.
    decision = _decide(info, flags={"native_store_support_days": 7})
    assert decision.action == UpdateAction.store


def test_zero_window_disables_clock():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(1000))
    assert _decide(info, flags={"native_store_support_days": 0}).action == UpdateAction.none


def test_store_presentation_from_policy():
    info = NativeClientInfo(platform="ios", binary_created_at=_days_ago(DEFAULT_STORE_SUPPORT_DAYS + 1))
    flags = {
        "native_update_presentation": {
            "ios": {
                "store_url": "https://apps.apple.com/app/couchers",
                "store_message": "Time to update.",
                "store_link_text": "Update now",
            }
        }
    }
    decision = _decide(info, flags=flags)
    assert decision.link_url == "https://apps.apple.com/app/couchers"
    assert decision.message == "Time to update."
    assert decision.link_text == "Update now"


# --- registry seam ---


def test_registry_created_at_overrides_client():
    # Client claims a fresh bundle, but the registry's authoritative publish time is old -> block.
    info = NativeClientInfo(
        platform="ios",
        is_ota_launch=True,
        update_id="abc-123",
        binary_created_at=_days_ago(5),
        bundle_created_at=_days_ago(1),
    )
    registry = _FakeRegistry(
        {"abc-123": OtaPackage(update_id="abc-123", created_at=_days_ago(DEFAULT_OTA_SUPPORT_DAYS + 5))}
    )
    decision = _decide(info, registry=registry)
    assert decision.action == UpdateAction.ota
    assert decision.act_by <= NOW
