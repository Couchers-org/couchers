from concurrent import futures
from contextlib import contextmanager
from datetime import date

import grpc
import pytest
from couchers.crypto import hash_password
from couchers.db import session_scope
from couchers.interceptors import intercept_server
from couchers.models import Base, User
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from pb import api_pb2, api_pb2_grpc, auth_pb2, auth_pb2_grpc
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


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

def generate_user(temp_db_session, user):
    """
    Create a new user, return session token
    """
    auth = Auth(temp_db_session)

    password = f"{user}'s password"
    with session_scope(temp_db_session) as session:
        session.add(User(
            username=user,
            email=f"{user}@dev.couchers.org",
            hashed_password=hash_password(password),
            name=user.capitalize(),
            city="Testing city",
            verification=0.5,
            community_standing=0.5,
            birthdate=date(year=2000, month=1, day=1),
            gender="N/A",
            languages="",
            occupation="Tester",
            about_me="I test things",
            about_place="My place has a lot of testing paraphenelia",
            countries_visited="",
            countries_lived="",
        ))

        session.commit()

    return auth.Authenticate(auth_pb2.AuthReq(user=user, password=password), "Dummy context").token

@contextmanager
def api_session(temp_db_session, token):
    """
    Create a fresh API for testing, uses the token for auth
    """
    auth_interceptor = Auth(temp_db_session).get_auth_interceptor()

    server = grpc.server(futures.ThreadPoolExecutor(1))
    server = intercept_server(server, auth_interceptor)
    port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
    servicer = API(temp_db_session)
    api_pb2_grpc.add_APIServicer_to_server(servicer, server)
    server.start()

    call_creds = grpc.access_token_call_credentials(token)
    comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

    with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
        yield api_pb2_grpc.APIStub(channel)

    server.stop(None)

def test_ping(temp_db_session):
    token = generate_user(temp_db_session, "tester")

    with api_session(temp_db_session, token) as api:
        print(api.Ping(api_pb2.PingReq()))
