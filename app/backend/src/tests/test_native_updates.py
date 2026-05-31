import json
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from couchers.context import CouchersContext
from couchers.i18n import LocalizationContext
from couchers.native_updates import (
    DEFAULT_OTA_BLOCK_DAYS,
    DEFAULT_OTA_WARN_DAYS,
    DEFAULT_STORE_BLOCK_DAYS,
    DEFAULT_STORE_WARN_DAYS,
    NativeClientInfo,
    Severity,
    UpdateAction,
    decide_native_update,
    native_update_message,
    parse_client_info,
    store_url_for,
)

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
    assert decision.act_by == NOW


def test_banned_ignored_when_not_an_ota_launch():
    info = NativeClientInfo(platform="ios", is_ota_launch=False, binary_created_at=_days_ago(5))
    assert _decide(info, banned=True).severity == Severity.none


def test_store_url_known_platform():
    assert store_url_for("ios").startswith("https://apps.apple.com")
    assert store_url_for("android").startswith("https://play.google.com")


def test_store_url_unknown_platform_empty():
    assert store_url_for("blackberry") == ""


def _localization() -> LocalizationContext:
    return LocalizationContext(locale="en", timezone=UTC)


def test_message_store_warn_has_store_name_and_time_left():
    decision = _decide(NativeClientInfo(platform="ios", binary_created_at=_days_ago(DEFAULT_STORE_WARN_DAYS + 1)))
    message, link_text = native_update_message(_localization(), decision, platform="ios", now=NOW)
    assert "App Store" in message
    assert "small volunteer team" in message
    # time_left got substituted (not just left as the placeholder).
    assert "{{" not in message
    assert "App Store" in link_text


def test_message_store_block_no_time_left():
    decision = _decide(NativeClientInfo(platform="ios", binary_created_at=_days_ago(DEFAULT_STORE_BLOCK_DAYS + 10)))
    message, _ = native_update_message(_localization(), decision, platform="ios", now=NOW)
    assert "App Store" in message
    assert "within" not in message


def test_message_ota_warn_says_button_below():
    decision = _decide(
        NativeClientInfo(
            platform="android",
            is_ota_launch=True,
            binary_created_at=_days_ago(5),
            bundle_created_at=_days_ago(DEFAULT_OTA_WARN_DAYS + 1),
        )
    )
    message, link_text = native_update_message(_localization(), decision, platform="android", now=NOW)
    assert "button below" in message
    assert link_text == "Update now"


def test_message_android_uses_play_store_name():
    decision = _decide(NativeClientInfo(platform="android", binary_created_at=_days_ago(DEFAULT_STORE_BLOCK_DAYS + 1)))
    message, link_text = native_update_message(_localization(), decision, platform="android", now=NOW)
    assert "Play Store" in message
    assert "Play Store" in link_text


def test_message_none_is_empty():
    decision = _decide(NativeClientInfo(platform="ios"))
    assert native_update_message(_localization(), decision, platform="ios", now=NOW) == ("", "")
