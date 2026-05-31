import json
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

import grpc
import pytest
from google.protobuf import empty_pb2, timestamp_pb2
from sqlalchemy import func, select

from couchers.config import config
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models import OTAPackage, OTAPlatform
from couchers.models.logging import EventLog, EventSource, ExperimentExposure, ExposureSource
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
**User**: <not logged in> / `test_sofa_co`""".strip()

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
**User**: [@testing_user](http://localhost:3000/user/testing_user) (1) / `test_sofa_co`""".strip()

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


def test_check_native_status_anonymous(db):
    with bugs_session() as bugs:
        res = bugs.CheckNativeStatus(
            bugs_pb2.CheckNativeStatusReq(
                debug_json=json.dumps({"app_version": "1.1.20", "platform": "ios", "user_state": "logged_out"})
            )
        )

    # No build timestamps reported -> no clock runs -> no update asked for.
    assert res.update_info.action == bugs_pb2.NATIVE_UPDATE_ACTION_NONE
    assert res.update_info.required is False


def test_check_native_status_authenticated(db):
    _, token = generate_user()

    with bugs_session(token) as bugs:
        res = bugs.CheckNativeStatus(
            bugs_pb2.CheckNativeStatusReq(debug_json=json.dumps({"platform": "android", "user_state": "authenticated"}))
        )

    assert res.update_info.action == bugs_pb2.NATIVE_UPDATE_ACTION_NONE
    assert res.update_info.required is False


def test_check_native_status_blocks_expired_binary(db):
    # A native binary older than the (default 91-day) store window -> required store update, blocking.
    embedded_created_at = (datetime.now(UTC) - timedelta(days=120)).isoformat()
    with bugs_session() as bugs:
        res = bugs.CheckNativeStatus(
            bugs_pb2.CheckNativeStatusReq(
                debug_json=json.dumps({"platform": "ios", "embeddedCreatedAt": embedded_created_at})
            )
        )

    assert res.update_info.action == bugs_pb2.NATIVE_UPDATE_ACTION_STORE
    assert res.update_info.required is True
    assert res.update_info.act_by.ToDatetime(tzinfo=UTC) <= datetime.now(UTC)


def _multipart_part_json(body, name):
    """Extract and parse the JSON body of a named part from a multipart/mixed body."""
    marker = f'name="{name}"'
    start = body.index("\r\n\r\n", body.index(marker)) + 4
    end = body.index("\r\n--", start)
    return json.loads(body[start:end])


_OTA_CDN_ROOT = "https://cdn.testing.invalid/native/ota"
_CDN_CONTENT_TYPE = "multipart/mixed; boundary=COUCHERS_OTA_BOUNDARY"


class _FakeCDNResponse:
    # Echoes the requested URL back as the body so tests can assert which version was fetched and that
    # the bytes are served verbatim — standing in for the pre-signed manifest the CDN holds.
    def __init__(self, url):
        self.headers = {"content-type": _CDN_CONTENT_TYPE}
        self.content = url.encode()

    def raise_for_status(self):
        pass


def _patch_cdn():
    return patch("couchers.servicers.bugs.requests.get", side_effect=lambda url, timeout=None: _FakeCDNResponse(url))


def _add_ota_package(*, platform, fingerprint, version, created_at, banned=False):
    with session_scope() as session:
        creator, _ = generate_user()
        package = OTAPackage(
            creator_user_id=creator.id,
            platform=platform,
            fingerprint=fingerprint,
            version=version,
            manifest_created_at=created_at,
            manifest_id=f"id-{version}",
            banned_at=created_at if banned else None,
        )
        session.add(package)
        session.flush()


def test_native_update_manifest_serves_matching_package(db, feature_flags):
    feature_flags.set("native_ota_cdn_root", _OTA_CDN_ROOT)
    _fetch_signed_manifest.cache_clear()
    _add_ota_package(
        platform=OTAPlatform.ios,
        fingerprint="ios-fingerprint",
        version="v1.3.1.aaaa",
        created_at=datetime(2026, 5, 31, tzinfo=UTC),
    )
    with _patch_cdn():
        with real_bugs_session() as (bugs, metadata_interceptor):
            res = bugs.GetNativeUpdateManifest(
                httpbody_pb2.HttpBody(),
                metadata=(("expo-platform", "ios"), ("expo-runtime-version", "ios-fingerprint")),
            )

    # the signed bytes are fetched from the CDN under the package's version and served verbatim
    assert res.content_type == _CDN_CONTENT_TYPE
    assert res.data.decode() == f"{_OTA_CDN_ROOT}/v1.3.1.aaaa/ios/manifest"
    # the client requires these response headers or it rejects the manifest
    assert metadata_interceptor.latest_headers["expo-protocol-version"] == "1"
    assert metadata_interceptor.latest_headers["expo-sfv-version"] == "0"


def test_native_update_manifest_resolves_per_platform(db, feature_flags):
    feature_flags.set("native_ota_cdn_root", _OTA_CDN_ROOT)
    _fetch_signed_manifest.cache_clear()
    _add_ota_package(
        platform=OTAPlatform.ios,
        fingerprint="shared-fingerprint",
        version="v1.3.1.ios",
        created_at=datetime(2026, 5, 31, tzinfo=UTC),
    )
    _add_ota_package(
        platform=OTAPlatform.android,
        fingerprint="shared-fingerprint",
        version="v1.3.1.android",
        created_at=datetime(2026, 5, 31, tzinfo=UTC),
    )
    with _patch_cdn():
        with real_bugs_session() as (bugs, _metadata_interceptor):
            res = bugs.GetNativeUpdateManifest(
                httpbody_pb2.HttpBody(),
                metadata=(("expo-platform", "android"), ("expo-runtime-version", "shared-fingerprint")),
            )

    assert res.data.decode() == f"{_OTA_CDN_ROOT}/v1.3.1.android/android/manifest"


def test_native_update_manifest_serves_newest_by_created_at(db, feature_flags):
    feature_flags.set("native_ota_cdn_root", _OTA_CDN_ROOT)
    _fetch_signed_manifest.cache_clear()
    # the newer createdAt wins regardless of insertion order
    _add_ota_package(
        platform=OTAPlatform.ios,
        fingerprint="ios-fingerprint",
        version="v1.3.2.newer",
        created_at=datetime(2026, 5, 31, tzinfo=UTC),
    )
    _add_ota_package(
        platform=OTAPlatform.ios,
        fingerprint="ios-fingerprint",
        version="v1.3.1.older",
        created_at=datetime(2026, 5, 30, tzinfo=UTC),
    )
    with _patch_cdn():
        with real_bugs_session() as (bugs, _metadata_interceptor):
            res = bugs.GetNativeUpdateManifest(
                httpbody_pb2.HttpBody(),
                metadata=(("expo-platform", "ios"), ("expo-runtime-version", "ios-fingerprint")),
            )

    assert res.data.decode() == f"{_OTA_CDN_ROOT}/v1.3.2.newer/ios/manifest"


def test_native_update_manifest_banned_package_excluded(db, feature_flags):
    feature_flags.set("native_ota_cdn_root", _OTA_CDN_ROOT)
    _fetch_signed_manifest.cache_clear()
    _add_ota_package(
        platform=OTAPlatform.ios,
        fingerprint="ios-fingerprint",
        version="v1.3.1.good",
        created_at=datetime(2026, 5, 30, tzinfo=UTC),
    )
    _add_ota_package(
        platform=OTAPlatform.ios,
        fingerprint="ios-fingerprint",
        version="v1.3.2.bad",
        created_at=datetime(2026, 5, 31, tzinfo=UTC),
        banned=True,
    )
    with _patch_cdn():
        with real_bugs_session() as (bugs, _metadata_interceptor):
            res = bugs.GetNativeUpdateManifest(
                httpbody_pb2.HttpBody(),
                metadata=(("expo-platform", "ios"), ("expo-runtime-version", "ios-fingerprint")),
            )

    # the newest is banned, so new check-ins get the previous one (a re-stamp would supersede it)
    assert res.data.decode() == f"{_OTA_CDN_ROOT}/v1.3.1.good/ios/manifest"


def test_native_update_manifest_runtime_mismatch_returns_directive(db):
    _add_ota_package(
        platform=OTAPlatform.ios,
        fingerprint="ios-fingerprint",
        version="v1.3.1.aaaa",
        created_at=datetime(2026, 5, 31, tzinfo=UTC),
    )
    with _patch_cdn() as cdn_get:
        with real_bugs_session() as (bugs, _metadata_interceptor):
            res = bugs.GetNativeUpdateManifest(
                httpbody_pb2.HttpBody(),
                metadata=(("expo-platform", "ios"), ("expo-runtime-version", "some-other-fingerprint")),
            )

    assert _multipart_part_json(res.data.decode(), "directive") == {"type": "noUpdateAvailable"}
    # a mismatch must not even fetch — the manifest would be rejected on this build
    cdn_get.assert_not_called()


def test_native_update_manifest_only_banned_package_returns_directive(db):
    _add_ota_package(
        platform=OTAPlatform.ios,
        fingerprint="ios-fingerprint",
        version="v1.3.1.aaaa",
        created_at=datetime(2026, 5, 31, tzinfo=UTC),
        banned=True,
    )
    with real_bugs_session() as (bugs, _metadata_interceptor):
        res = bugs.GetNativeUpdateManifest(
            httpbody_pb2.HttpBody(),
            metadata=(("expo-platform", "ios"), ("expo-runtime-version", "ios-fingerprint")),
        )

    assert _multipart_part_json(res.data.decode(), "directive") == {"type": "noUpdateAvailable"}


def test_native_update_manifest_without_runtime_version_returns_directive(db):
    _add_ota_package(
        platform=OTAPlatform.ios,
        fingerprint="ios-fingerprint",
        version="v1.3.1.aaaa",
        created_at=datetime(2026, 5, 31, tzinfo=UTC),
    )
    with real_bugs_session() as (bugs, metadata_interceptor):
        res = bugs.GetNativeUpdateManifest(
            httpbody_pb2.HttpBody(),
            metadata=(("expo-platform", "ios"),),
        )

    body = res.data.decode()
    assert _multipart_part_json(body, "directive") == {"type": "noUpdateAvailable"}
    assert metadata_interceptor.latest_headers["expo-protocol-version"] == "1"


def test_native_update_manifest_no_package_returns_directive(db):
    with real_bugs_session() as (bugs, _metadata_interceptor):
        res = bugs.GetNativeUpdateManifest(
            httpbody_pb2.HttpBody(),
            metadata=(("expo-platform", "ios"), ("expo-runtime-version", "ios-fingerprint")),
        )

    assert _multipart_part_json(res.data.decode(), "directive") == {"type": "noUpdateAvailable"}


def test_log_experiment_exposure(db):
    user, token = generate_user()

    with bugs_session(token) as bugs:
        bugs.LogExperimentExposure(
            bugs_pb2.LogExperimentExposureReq(
                experiment_key="my_experiment",
                experiment_name="My Experiment",
                variation_id=1,
                variation_key="treatment",
                variation_name="Treatment",
                hash_attribute="id",
                hash_value=str(user.id),
                feature_id="my_feature",
                in_experiment=True,
                bucket=0.5,
                hash_used=True,
                sticky_bucket_used=False,
            )
        )

    with session_scope() as session:
        exposure = session.execute(select(ExperimentExposure)).scalar_one()
        assert exposure.user_id == user.id
        assert exposure.experiment_key == "my_experiment"
        assert exposure.variation_id == 1
        assert exposure.source == ExposureSource.client
        assert exposure.data == {
            "experiment_name": "My Experiment",
            "variation_key": "treatment",
            "variation_name": "Treatment",
            "hash_attribute": "id",
            "hash_value": str(user.id),
            "bucket": 0.5,
            "in_experiment": True,
            "hash_used": True,
            "sticky_bucket_used": False,
            "feature_id": "my_feature",
        }


def test_log_experiment_exposure_deduped(db):
    user, token = generate_user()

    with bugs_session(token) as bugs:
        for _ in range(3):
            bugs.LogExperimentExposure(
                bugs_pb2.LogExperimentExposureReq(
                    experiment_key="my_experiment",
                    variation_id=1,
                    variation_key="treatment",
                    hash_attribute="id",
                    hash_value=str(user.id),
                )
            )

    with session_scope() as session:
        exposure = session.execute(select(ExperimentExposure)).scalar_one()
        # unset optional fields are stored as null, not a misleading 0/false
        assert exposure.data["bucket"] is None
        assert exposure.data["hash_used"] is None
        assert exposure.data["sticky_bucket_used"] is None


def test_log_experiment_exposure_anonymous_ignored(db):
    with bugs_session() as bugs:
        bugs.LogExperimentExposure(
            bugs_pb2.LogExperimentExposureReq(
                experiment_key="my_experiment",
                variation_id=1,
                variation_key="treatment",
                hash_attribute="id",
                hash_value="123",
            )
        )

    with session_scope() as session:
        count = session.execute(select(func.count()).select_from(ExperimentExposure)).scalar_one()
        assert count == 0
