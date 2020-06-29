import grpc
import pytest
from couchers.models import Base
from couchers.servicers.auth import Auth
from pb import auth_pb2, auth_pb2_grpc
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from concurrent import futures

@pytest.fixture
def temp_db_session(tmp_path):
    """
    Create a temporary SQLite-backed database in a temp directory, and return the Session object.
    """
    db_path = tmp_path / "db.sqlite"
    engine = create_engine(f"sqlite:///{db_path}", echo=True)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)

    return Session

@pytest.fixture
def auth_api(temp_db_session):
    """
    Create a fresh Auth API for testing

    TODO: investigate if there's a smarter way to stub out these tests?
    """
    auth = Auth(temp_db_session)
    auth_server = grpc.server(futures.ThreadPoolExecutor(1))
    port = auth_server.add_insecure_port("localhost:0")
    auth_pb2_grpc.add_AuthServicer_to_server(auth, auth_server)
    auth_server.start()

    with grpc.insecure_channel(f"localhost:{port}") as channel:
        yield auth_pb2_grpc.AuthStub(channel)

    auth_server.stop(None)

def test_UsernameValid(auth_api):
    assert auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test")).valid
    assert not auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="")).valid