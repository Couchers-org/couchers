from unittest.mock import patch

import grpc
import pytest

from couchers.config import config
from proto import bugs_pb2
from tests.test_fixtures import bugs_session, db, generate_user, testconfig  # noqa


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
                    + config["VERSION"]
                    + "\nFrontend version: frontend_version\nUser Agent: user_agent\nPage: page\nUser: <not logged in>"
                ),
                "labels": ["bug tool"],
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
                    + config["VERSION"]
                    + "\nFrontend version: frontend_version\nUser Agent: user_agent\nPage: page\nUser: testing_user (1)"
                ),
                "labels": ["bug tool"],
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
