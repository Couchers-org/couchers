from concurrent import futures
from contextlib import contextmanager
from datetime import date
from unittest.mock import patch

from google.protobuf import empty_pb2

import grpc
import pytest
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

def generate_user(temp_db_session, username):
    """
    Create a new user, return session token
    """
    auth = Auth(temp_db_session)

    session = temp_db_session()

    user = User(
        username=username,
        email=f"{username}@dev.couchers.org",
        # password is just 'password'
        # this is hardcoded because the password is slow to hash (so would slow down tests otherwise)
        hashed_password=b"$argon2id$v=19$m=65536,t=2,p=1$4cjGg1bRaZ10k+7XbIDmFg$tZG7JaLrkfyfO7cS233ocq7P8rf3znXR7SAfUt34kJg",
        name=username.capitalize(),
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
    )

    session.add(user)

    # this expires the user, so now it's "dirty"
    session.commit()

    # refresh it, undoes the expiry
    session.refresh(user)
    # allows detaches the user from the session, allowing its use outside this session
    session.expunge(user)

    session.close()

    with patch("couchers.servicers.auth.verify_password", lambda hashed, password: password == "password"):
        token = auth.Authenticate(auth_pb2.AuthReq(user=username, password="password"), "Dummy context").token

    return user, token

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
    user, token = generate_user(temp_db_session, "tester")

    with api_session(temp_db_session, token) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.user_id == user.id
        assert res.username == user.username
        assert res.name == user.name
        assert res.color == user.color

def test_SendFriendRequest(temp_db_session):
    user1, token1 = generate_user(temp_db_session, "user1")
    user2, token2 = generate_user(temp_db_session, "user2")

    # send friend request from user1 to user2
    with api_session(temp_db_session, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user2"))

        # check it went through
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user == "user2"

        assert len(res.sent) == 1
        assert len(res.received) == 0
