from datetime import UTC, datetime
from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2, timestamp_pb2
from sqlalchemy import select

from couchers.config import config
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models.logging import EventLog, EventSource
from couchers.proto import bugs_pb2
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import bugs_session


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
            assert json == {
                "title": "subject",
                "body": (
                    "Subject: subject\nDescription:\ndescription\n\nResults:\nresults\n\nBackend version: "
                    + config.version
                    + "\nFrontend version: frontend_version\nUser Agent: user_agent\nScreen resolution: 1920x1080\nPage: page\nUser: <not logged in>"
                ),
                "labels": ["bug tool", "bug: triage needed"],
            }

            class _PostReturn:
                status_code = 201

                def json(self):
                    return {"number": 11}

            return _PostReturn()

        new_config = config.copy()
        new_config.bug_tool_enabled = True

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
            assert json == {
                "title": "subject",
                "body": (
                    "Subject: subject\nDescription:\ndescription\n\nResults:\nresults\n\nBackend version: "
                    + config.version
                    + "\nFrontend version: frontend_version\nUser Agent: user_agent\nScreen resolution: 390x844\nPage: page\nUser: [@testing_user](http://localhost:3000/user/testing_user) (1)"
                ),
                "labels": ["bug tool", "bug: triage needed"],
            }

            class _PostReturn:
                status_code = 201

                def json(self):
                    return {"number": 11}

            return _PostReturn()

        new_config = config.copy()
        new_config.bug_tool_enabled = True

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
        new_config.bug_tool_enabled = True

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
