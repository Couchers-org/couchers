from concurrent import futures
from contextlib import contextmanager
from datetime import date
from unittest.mock import patch

import grpc
import pytest
from couchers.db import session_scope
from couchers.interceptors import intercept_server
from couchers.models import Base, FriendRelationship, FriendStatus, User
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from couchers.servicers.conversations import Conversations
from pb import api_pb2_grpc, auth_pb2, conversations_pb2_grpc
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


@pytest.fixture
def db(tmp_path):
    """
    Create a temporary SQLite-backed database in a temp directory, and return the Session object.
    """
    db_path = tmp_path / "db.sqlite"
    engine = create_engine(f"sqlite:///{db_path}", echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)

    return Session

def generate_user(db, username):
    """
    Create a new user, return session token
    """
    auth = Auth(db)

    session = db()

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

def make_friends(db, user1, user2):
    with session_scope(db) as session:
        friend_relationship = FriendRelationship(
            from_user_id=user1.id,
            to_user_id=user2.id,
            status=FriendStatus.accepted,
        )
        session.add(friend_relationship)

@contextmanager
def api_session(db, token):
    """
    Create a fresh API for testing, uses the token for auth
    """
    auth_interceptor = Auth(db).get_auth_interceptor()

    server = grpc.server(futures.ThreadPoolExecutor(1))
    server = intercept_server(server, auth_interceptor)
    port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
    servicer = API(db)
    api_pb2_grpc.add_APIServicer_to_server(servicer, server)
    server.start()

    call_creds = grpc.access_token_call_credentials(token)
    comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

    with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
        yield api_pb2_grpc.APIStub(channel)

    server.stop(None)

@contextmanager
def conversations_session(db, token):
    """
    Create a fresh Conversations API for testing, uses the token for auth
    """
    auth_interceptor = Auth(db).get_auth_interceptor()

    server = grpc.server(futures.ThreadPoolExecutor(1))
    server = intercept_server(server, auth_interceptor)
    port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
    servicer = Conversations(db)
    conversations_pb2_grpc.add_ConversationsServicer_to_server(servicer, server)
    server.start()

    call_creds = grpc.access_token_call_credentials(token)
    comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

    with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
        yield conversations_pb2_grpc.ConversationsStub(channel)

    server.stop(None)
