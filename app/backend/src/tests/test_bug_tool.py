from unittest.mock import patch

import grpc
import pytest

from couchers.config import config
from pb import bugs_pb2
from tests.test_fixtures import bugs_session, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_bug_tool_disabled():
    with bugs_session() as bugs, pytest.raises(grpc.RpcError) as e:
        bugs.ReportBug(
            bugs_pb2.ReportBugReq(
                subject="subject",
                description="description",
                steps="steps",
                results="results",
                frontend_version="frontend_version",
                user_agent="user_agent",
                page="page",
                user_id=99,
            )
        )
    assert e.value.code() == grpc.StatusCode.UNAVAILABLE


def test_bug_tool():
    with bugs_session() as bugs:

        def dud_post(url, auth, json):
            assert url == "https://api.github.com/repos/user/repo/issues"
            assert auth == ("user", "token")
            assert json == {
                "title": "subject",
                "body": (
                    "Subject: subject\nDescription:\ndescription\n\nSteps:\nsteps\n\nResults:\nresults\n\nBackend version: "
                    + config["VERSION"]
                    + "\nFrontend version: frontend_version\nUser Agent: user_agent\nPage: page\nUser ID: 99"
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
                        steps="steps",
                        results="results",
                        frontend_version="frontend_version",
                        user_agent="user_agent",
                        page="page",
                        user_id=99,
                    )
                )

    assert res.report_identifier == "#11"


def test_bug_tool_fails_on_network_error():
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
                            steps="steps",
                            results="results",
                            frontend_version="frontend_version",
                            user_agent="user_agent",
                            page="page",
                            user_id=99,
                        )
                    )
                assert e.value.code() == grpc.StatusCode.INTERNAL
