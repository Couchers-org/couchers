from concurrent import futures
from contextlib import contextmanager

import grpc
import pytest
from couchers.servicers.bugs import Bugs
from google.protobuf import empty_pb2, wrappers_pb2
from pb import bugs_pb2, bugs_pb2_grpc

from tests.test_fixtures import api_session, db, generate_user, make_friends


@contextmanager
def bugs_session():
    bugs_server = grpc.server(futures.ThreadPoolExecutor(1))
    port = bugs_server.add_insecure_port("localhost:0")
    bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), bugs_server)
    bugs_server.start()

    with grpc.insecure_channel(f"localhost:{port}") as channel:
        yield bugs_pb2_grpc.BugsStub(channel)

    bugs_server.stop(None)

def test_bug_tool_disabled():
    with bugs_session() as bugs, pytest.raises(grpc.RpcError) as e:
        bugs.ReportBug(bugs_pb2.ReportBugReq(
            subject="subject",
            description="description",
            steps="steps",
            results="results",
            frontend_version="frontend_version",
            user_agent="user_agent",
            page="page",
            user_id=99,
        ))
    assert e.value.code() == grpc.StatusCode.UNAVAILABLE
