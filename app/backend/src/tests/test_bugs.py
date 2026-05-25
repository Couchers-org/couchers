import json
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import grpc
import pytest
from google.protobuf import empty_pb2, timestamp_pb2
from sqlalchemy import select

from couchers.config import config
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models.logging import EventLog, EventSource
from couchers.proto import bugs_pb2
from couchers.proto.google.api import httpbody_pb2
from couchers.servicers.bugs import _fetch_signed_manifest
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import bugs_session, real_bugs_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_bugs_disabled():
    with bugs_session() as bugs, pytest.raises(grpc.RpcError) as e:
        bugs.ReportBug(
            bugs_pb2.ReportBugReq(
                subject="subject",
                description="description",
                results="results",
                frontend_version="frontend_version",
                user_agent="user_agent",
                page="page",
            )
        )
    assert e.value.code() == grpc.StatusCode.UNAVAILABLE


def test_bugs(db):
    with bugs_session() as bugs:

        def dud_post(url, auth, json):
            assert url == "https://api.github.com/repos/org/repo/issues"
            assert auth == ("user", "token")

            expected_body = f"""
# subject
## Description
description

## Results
results

## Diagnostics
**Backend version**: `{config["VERSION"]}`
**Frontend version**: `frontend_version`
**User Agent**: `user_agent`
**Locale**: `en`
**Screen resolution**: 1920x1080
**Page**: page
**User**: <not logged in>""".strip()

            assert json == {
                "title": "subject",
                "body": expected_body,
                "labels": ["bug tool", "bug: triage needed"],
            }

            class _PostReturn:
                status_code = 201

                def json(self):
                    return {"number": 11}

            return _PostReturn()

        new_config = config.copy()
        new_config["BUG_TOOL_ENABLED"] = True

        with patch("couchers.servicers.bugs.config", new_config):
            with patch("couchers.servicers.bugs.requests.post", dud_post):
                res = bugs.ReportBug(
                    bugs_pb2.ReportBugReq(
                        subject="subject",
                        description="description",
                        results="results",
                        frontend_version="frontend_version",
                        user_agent="user_agent",
                        screen_resolution=bugs_pb2.ScreenResolution(width=1920, height=1080),
                        page="page",
                    )
                )

    assert res.bug_id == "#11"
    assert res.bug_url == "https://github.com/org/repo/issues/11"


def test_bugs_with_user(db):
    user, token = generate_user(username="testing_user")

    with bugs_session(token) as bugs:

        def dud_post(url, auth, json):
            assert url == "https://api.github.com/repos/org/repo/issues"
            assert auth == ("user", "token")

            expected_body = f"""
# subject
## Description
description

## Results
results

## Diagnostics
**Backend version**: `{config["VERSION"]}`
**Frontend version**: `frontend_version`
**User Agent**: `user_agent`
**Locale**: `en`
**Screen resolution**: 390x844
**Page**: page
**User**: [@testing_user](http://localhost:3000/user/testing_user) (1)""".strip()

            assert json == {
                "title": "subject",
                "body": expected_body,
                "labels": ["bug tool", "bug: triage needed"],
            }

            class _PostReturn:
                status_code = 201

                def json(self):
                    return {"number": 11}

            return _PostReturn()

        new_config = config.copy()
        new_config["BUG_TOOL_ENABLED"] = True

        with patch("couchers.servicers.bugs.config", new_config):
            with patch("couchers.servicers.bugs.requests.post", dud_post):
                res = bugs.ReportBug(
                    bugs_pb2.ReportBugReq(
                        subject="subject",
                        description="description",
                        results="results",
                        frontend_version="frontend_version",
                        user_agent="user_agent",
                        screen_resolution=bugs_pb2.ScreenResolution(width=390, height=844),
                        page="page",
                    )
                )

    assert res.bug_id == "#11"
    assert res.bug_url == "https://github.com/org/repo/issues/11"


def test_bugs_fails_on_network_error(db):
    with bugs_session() as bugs:

        def dud_post(url, auth, json):
            class _PostReturn:
                status_code = 400

            return _PostReturn()

        new_config = config.copy()
        new_config["BUG_TOOL_ENABLED"] = True

        with patch("couchers.servicers.bugs.config", new_config):
            with patch("couchers.servicers.bugs.requests.post", dud_post):
                with pytest.raises(grpc.RpcError) as e:
                    res = bugs.ReportBug(
                        bugs_pb2.ReportBugReq(
                            subject="subject",
                            description="description",
                            results="results",
                            frontend_version="frontend_version",
                            user_agent="user_agent",
                            page="page",
                        )
                    )
                assert e.value.code() == grpc.StatusCode.INTERNAL


def test_version():
    with bugs_session() as bugs:
        res = bugs.Version(empty_pb2.Empty())
        assert res.version == "testing_version"


def test_status(db):
    for _ in range(5):
        generate_user()

    with bugs_session() as bugs:
        nonce = random_hex()
        res = bugs.Status(bugs_pb2.StatusReq(nonce=nonce))
        assert res.nonce == nonce
        assert res.version == "testing_version"
        assert res.coucher_count == 5


def test_GetDescriptors():
    with bugs_session() as bugs:
        res = bugs.GetDescriptors(empty_pb2.Empty())
        # test we got something roughly binary back
        assert res.content_type == "application/octet-stream"
        assert len(res.data) > 2**12


def _get_events(session, event_type=None):
    stmt = select(EventLog).order_by(EventLog.id)
    if event_type:
        stmt = stmt.where(EventLog.event_type == event_type)
    return session.execute(stmt).scalars().all()


def test_report_diagnostics_anonymous(db):
    with bugs_session() as bugs:
        bugs.ReportDiagnostics(
            bugs_pb2.ReportDiagnosticsReq(
                frontend_version="1.2.3",
                infos=[
                    bugs_pb2.DiagnosticInfo(
                        tag="page.viewed",
                        properties_json='{"path": "/"}',
                        value=1,
                    ),
                    bugs_pb2.DiagnosticInfo(
                        tag="session.started",
                        properties_json='{"referrer": "google.com"}',
                        value=1,
                    ),
                ],
            )
        )

    with session_scope() as session:
        events = _get_events(session)
        assert len(events) == 2

        e0 = events[0]
        assert e0.event_type == "page.viewed"
        assert e0.properties == {"path": "/"}
        assert e0.user_id is None
        assert e0.source == EventSource.frontend
        assert e0.value == 1
        assert e0.version == "1.2.3"

        e1 = events[1]
        assert e1.event_type == "session.started"
        assert e1.properties == {"referrer": "google.com"}
        assert e1.source == EventSource.frontend


def test_report_diagnostics_authenticated(db):
    user, token = generate_user()

    with bugs_session(token) as bugs:
        bugs.ReportDiagnostics(
            bugs_pb2.ReportDiagnosticsReq(
                frontend_version="1.2.3",
                infos=[
                    bugs_pb2.DiagnosticInfo(
                        tag="page.viewed",
                        properties_json='{"path": "/search"}',
                        value=1,
                    ),
                ],
            )
        )

    with session_scope() as session:
        events = _get_events(session)
        assert len(events) == 1
        assert events[0].user_id == user.id
        assert events[0].source == EventSource.frontend


def test_report_diagnostics_with_value(db):
    with bugs_session() as bugs:
        bugs.ReportDiagnostics(
            bugs_pb2.ReportDiagnosticsReq(
                frontend_version="1.2.3",
                infos=[
                    bugs_pb2.DiagnosticInfo(
                        tag="search.result_hovered",
                        properties_json='{"user_id": 5}',
                        value=1500.5,
                    ),
                ],
            )
        )

    with session_scope() as session:
        events = _get_events(session)
        assert len(events) == 1
        assert events[0].value == pytest.approx(1500.5)


def test_report_diagnostics_with_occurred(db):
    ts = timestamp_pb2.Timestamp()
    ts.FromDatetime(datetime(2026, 1, 15, 10, 30, 0, tzinfo=UTC))

    with bugs_session() as bugs:
        bugs.ReportDiagnostics(
            bugs_pb2.ReportDiagnosticsReq(
                frontend_version="1.2.3",
                infos=[
                    bugs_pb2.DiagnosticInfo(
                        tag="page.viewed",
                        properties_json="{}",
                        value=1,
                        occurred=ts,
                    ),
                ],
            )
        )

    with session_scope() as session:
        events = _get_events(session)
        assert len(events) == 1
        assert events[0].occurred.year == 2026
        assert events[0].occurred.month == 1
        assert events[0].occurred.day == 15
        assert events[0].occurred.hour == 10
        assert events[0].occurred.minute == 30


def test_report_diagnostics_invalid_json(db):
    with bugs_session() as bugs, pytest.raises(grpc.RpcError) as e:
        bugs.ReportDiagnostics(
            bugs_pb2.ReportDiagnosticsReq(
                frontend_version="1.2.3",
                infos=[
                    bugs_pb2.DiagnosticInfo(
                        tag="page.viewed",
                        properties_json="not valid json{{{",
                        value=1,
                    ),
                ],
            )
        )
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT


def test_report_diagnostics_empty_batch(db):
    with bugs_session() as bugs:
        bugs.ReportDiagnostics(
            bugs_pb2.ReportDiagnosticsReq(
                frontend_version="1.2.3",
                infos=[],
            )
        )

    with session_scope() as session:
        events = _get_events(session)
        assert len(events) == 0


def test_report_diagnostics_too_many(db):
    infos = [bugs_pb2.DiagnosticInfo(tag=f"event.{i}", properties_json="{}", value=1) for i in range(101)]

    with bugs_session() as bugs, pytest.raises(grpc.RpcError) as e:
        bugs.ReportDiagnostics(
            bugs_pb2.ReportDiagnosticsReq(
                frontend_version="1.2.3",
                infos=infos,
            )
        )
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT


def test_report_diagnostics_frontend_version(db):
    with bugs_session() as bugs:
        bugs.ReportDiagnostics(
            bugs_pb2.ReportDiagnosticsReq(
                frontend_version="abc-def-123",
                infos=[
                    bugs_pb2.DiagnosticInfo(
                        tag="page.viewed",
                        properties_json="{}",
                        value=1,
                    ),
                ],
            )
        )

    with session_scope() as session:
        events = _get_events(session)
        assert len(events) == 1
        assert events[0].version == "abc-def-123"


def _multipart_part_json(body, name):
    """Extract and parse the JSON body of a named part from a multipart/mixed body."""
    marker = f'name="{name}"'
    start = body.index("\r\n\r\n", body.index(marker)) + 4
    end = body.index("\r\n--", start)
    return json.loads(body[start:end])


_OTA_RELEASES = {
    "ios": {"version": "v1.2.18355.fc38c23d", "runtime_version": "ios-fingerprint"},
    "android": {"version": "v1.2.18356.ab12cd34", "runtime_version": "android-fingerprint"},
}

# A stand-in for the pre-signed multipart body the CDN serves; the servicer must hand it back
# byte-for-byte, signature and all, so the test asserts on identity rather than on its contents.
_SIGNED_MANIFEST = b'--COUCHERS_OTA_BOUNDARY\r\ncontent-disposition: form-data; name="manifest"\r\nexpo-signature: sig="abc", keyid="main", alg="rsa-v1_5-sha256"\r\n\r\n{}\r\n--COUCHERS_OTA_BOUNDARY--\r\n'
_CDN_CONTENT_TYPE = "multipart/mixed; boundary=COUCHERS_OTA_BOUNDARY"


def _fake_cdn_response():
    response = MagicMock()
    response.headers = {"content-type": _CDN_CONTENT_TYPE}
    response.content = _SIGNED_MANIFEST
    response.raise_for_status = MagicMock()
    return response


def test_native_update_manifest_serves_cdn_manifest_verbatim(db, feature_flags):
    feature_flags.set("native_ota_bundles", _OTA_RELEASES)
    feature_flags.set("native_ota_cdn_root", "https://cdn.testing.invalid/native/ota")
    _fetch_signed_manifest.cache_clear()
    with patch("couchers.servicers.bugs.requests.get", return_value=_fake_cdn_response()) as mock_get:
        with real_bugs_session() as (bugs, metadata_interceptor):
            res = bugs.GetNativeUpdateManifest(
                httpbody_pb2.HttpBody(),
                metadata=(("expo-platform", "ios"), ("expo-runtime-version", "ios-fingerprint")),
            )

    # the signed manifest is forwarded untouched, content type and bytes
    assert res.content_type == _CDN_CONTENT_TYPE
    assert res.data == _SIGNED_MANIFEST
    # fetched from the live release's immutable per-platform CDN path
    mock_get.assert_called_once()
    assert mock_get.call_args.args[0] == "https://cdn.testing.invalid/native/ota/v1.2.18355.fc38c23d/ios/manifest"

    # the client requires these response headers or it rejects the manifest
    assert metadata_interceptor.latest_headers["expo-protocol-version"] == "1"
    assert metadata_interceptor.latest_headers["expo-sfv-version"] == "0"


def test_native_update_manifest_android(db, feature_flags):
    feature_flags.set("native_ota_bundles", _OTA_RELEASES)
    feature_flags.set("native_ota_cdn_root", "https://cdn.testing.invalid/native/ota")
    _fetch_signed_manifest.cache_clear()
    with patch("couchers.servicers.bugs.requests.get", return_value=_fake_cdn_response()) as mock_get:
        with real_bugs_session() as (bugs, _metadata_interceptor):
            bugs.GetNativeUpdateManifest(
                httpbody_pb2.HttpBody(),
                metadata=(("expo-platform", "android"), ("expo-runtime-version", "android-fingerprint")),
            )

    assert mock_get.call_args.args[0] == "https://cdn.testing.invalid/native/ota/v1.2.18356.ab12cd34/android/manifest"


def test_native_update_manifest_runtime_mismatch_returns_directive(db, feature_flags):
    feature_flags.set("native_ota_bundles", _OTA_RELEASES)
    _fetch_signed_manifest.cache_clear()
    # the live release targets a different build fingerprint than this client is running
    with patch("couchers.servicers.bugs.requests.get") as mock_get:
        with real_bugs_session() as (bugs, _metadata_interceptor):
            res = bugs.GetNativeUpdateManifest(
                httpbody_pb2.HttpBody(),
                metadata=(("expo-platform", "ios"), ("expo-runtime-version", "some-other-fingerprint")),
            )

    assert _multipart_part_json(res.data.decode(), "directive") == {"type": "noUpdateAvailable"}
    # a mismatch must not even fetch — the manifest would be rejected on this build
    mock_get.assert_not_called()


def test_native_update_manifest_without_runtime_version_returns_directive(db, feature_flags):
    feature_flags.set("native_ota_bundles", _OTA_RELEASES)
    with real_bugs_session() as (bugs, metadata_interceptor):
        res = bugs.GetNativeUpdateManifest(
            httpbody_pb2.HttpBody(),
            metadata=(("expo-platform", "ios"),),
        )

    body = res.data.decode()
    assert _multipart_part_json(body, "directive") == {"type": "noUpdateAvailable"}
    assert metadata_interceptor.latest_headers["expo-protocol-version"] == "1"


def test_native_update_manifest_unconfigured_platform_returns_directive(db, feature_flags):
    feature_flags.set("native_ota_bundles", {})
    with real_bugs_session() as (bugs, _metadata_interceptor):
        res = bugs.GetNativeUpdateManifest(
            httpbody_pb2.HttpBody(),
            metadata=(("expo-platform", "ios"), ("expo-runtime-version", "ios-fingerprint")),
        )

    assert _multipart_part_json(res.data.decode(), "directive") == {"type": "noUpdateAvailable"}
