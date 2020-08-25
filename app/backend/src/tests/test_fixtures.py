from os import path
from concurrent import futures
from contextlib import contextmanager
from datetime import date, timedelta
from unittest.mock import patch

import grpc
import pytest
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models import (Base, FriendRelationship, FriendStatus, User)
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from couchers.servicers.bugs import Bugs
from couchers.servicers.conversations import Conversations
from couchers.servicers.media import Media, get_media_auth_interceptor
from couchers.servicers.requests import Requests
from pb import (
    api_pb2_grpc,
    auth_pb2,
    auth_pb2_grpc,
    bugs_pb2_grpc,
    conversations_pb2_grpc,
    media_pb2_grpc,
    requests_pb2_grpc,
)
from sqlalchemy import create_engine
from sqlalchemy.event import listen, remove
from sqlalchemy.orm import sessionmaker


@pytest.fixture
def db():
    """
    Create a temporary SQLite-backed database in memory, and return the Session object.
    """
    from sqlalchemy.pool import StaticPool

    # The elaborate arguments are needed to get multithreaded access
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool, echo=False)

    # from https://stackoverflow.com/questions/13712381/how-to-turn-on-pragma-foreign-keys-on-in-sqlalchemy-migration-script-or-conf
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    listen(engine, "connect", set_sqlite_pragma)

    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)


def generate_user(db, username=None):
    """
    Create a new user, return session token
    """
    auth = Auth(db)

    session = db()

    if not username:
        username = "test_user_" + random_hex(16)

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
        languages="Testing language 1|Testing language 2",
        occupation="Tester",
        about_me="I test things",
        about_place="My place has a lot of testing paraphenelia",
        countries_visited="Testing country",
        countries_lived="Wonderland",
        avatar_filename=path.abspath("../../../frontend/src/assets/logo.svg").replace("\\", "/"),
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


def generate_friend_relationship(db):
    from_user, api_token_from = generate_user(db)
    to_user, api_token_to = generate_user(db)

    friend_relationship = _generate_friend_relationship_object(from_user, to_user)

    return friend_relationship


def _generate_friend_relationship_object(from_user, to_user, status=FriendStatus.pending):
    friend_relationship = FriendRelationship(
        from_user=from_user,
        to_user=to_user,
        status=status
    )
    return friend_relationship


def make_friends(db, user1, user2):
    with session_scope(db) as session:
        friend_relationship = _generate_friend_relationship_object(user1, user2, FriendStatus.accepted)
        session.add(friend_relationship)


@contextmanager
def auth_api_session(db_session):
    """
    Create a fresh Auth API for testing

    TODO: investigate if there's a smarter way to stub out these tests?
    """
    auth = Auth(db_session)
    auth_server = grpc.server(futures.ThreadPoolExecutor(1))
    port = auth_server.add_insecure_port("localhost:0")
    auth_pb2_grpc.add_AuthServicer_to_server(auth, auth_server)
    auth_server.start()

    try:
        with grpc.insecure_channel(f"localhost:{port}") as channel:
            yield auth_pb2_grpc.AuthStub(channel)
    finally:
        auth_server.stop(None)


@contextmanager
def api_session(db, token):
    """
    Create a fresh API for testing, uses the token for auth
    """
    auth_interceptor = Auth(db).get_auth_interceptor()

    server = grpc.server(futures.ThreadPoolExecutor(1), interceptors=[auth_interceptor])
    port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
    servicer = API(db)
    api_pb2_grpc.add_APIServicer_to_server(servicer, server)
    server.start()

    call_creds = grpc.access_token_call_credentials(token)
    comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

    try:
        with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
            yield api_pb2_grpc.APIStub(channel)
    finally:
        server.stop(None)


@contextmanager
def conversations_session(db, token):
    """
    Create a fresh Conversations API for testing, uses the token for auth
    """
    auth_interceptor = Auth(db).get_auth_interceptor()

    server = grpc.server(futures.ThreadPoolExecutor(1), interceptors=[auth_interceptor])
    port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
    servicer = Conversations(db)
    conversations_pb2_grpc.add_ConversationsServicer_to_server(servicer, server)
    server.start()

    call_creds = grpc.access_token_call_credentials(token)
    comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

    try:
        with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
            yield conversations_pb2_grpc.ConversationsStub(channel)
    finally:
        server.stop(None)


@contextmanager
def requests_session(db, token):
    """
    Create a fresh Requests API for testing, uses the token for auth
    """
    auth_interceptor = Auth(db).get_auth_interceptor()

    server = grpc.server(futures.ThreadPoolExecutor(1), interceptors=[auth_interceptor])
    port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
    servicer = Requests(db)
    requests_pb2_grpc.add_RequestsServicer_to_server(servicer, server)
    server.start()

    call_creds = grpc.access_token_call_credentials(token)
    comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

    try:
        with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
            yield requests_pb2_grpc.RequestsStub(channel)
    finally:
        server.stop(None)


@contextmanager
def bugs_session():
    bugs_server = grpc.server(futures.ThreadPoolExecutor(1))
    port = bugs_server.add_insecure_port("localhost:0")
    bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), bugs_server)
    bugs_server.start()

    try:
        with grpc.insecure_channel(f"localhost:{port}") as channel:
            yield bugs_pb2_grpc.BugsStub(channel)
    finally:
        bugs_server.stop(None)


@contextmanager
def media_session(db, bearer_token):
    """
    Create a fresh Media API for testing, uses the bearer token for media auth
    """
    media_auth_interceptor = get_media_auth_interceptor(bearer_token)

    server = grpc.server(futures.ThreadPoolExecutor(1), interceptors=[media_auth_interceptor])
    port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
    servicer = Media(db)
    media_pb2_grpc.add_MediaServicer_to_server(servicer, server)
    server.start()

    call_creds = grpc.access_token_call_credentials(bearer_token)
    comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

    try:
        with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
            yield media_pb2_grpc.MediaStub(channel)
    finally:
        server.stop(None)


@contextmanager
def patch_message_time(time, add=0):
    def set_timestamp(mapper, connection, target):
        t = time + timedelta(seconds=add)
        target.time = t

    listen(Base, "before_insert", set_timestamp, propagate=True)
    listen(Base, "before_update", set_timestamp, propagate=True)
    try:
        yield
    finally:
        remove(Base, "before_insert", set_timestamp)
        remove(Base, "before_update", set_timestamp)


@contextmanager
def patch_joined_time(time, add=0):
    def set_timestamp(mapper, connection, target):
        t = time + timedelta(seconds=add)
        target.joined = t

    listen(Base, "before_insert", set_timestamp, propagate=True)
    listen(Base, "before_update", set_timestamp, propagate=True)
    try:
        yield
    finally:
        remove(Base, "before_insert", set_timestamp)
        remove(Base, "before_update", set_timestamp)


@contextmanager
def patch_left_time(time, add=0):
    def set_timestamp(mapper, connection, target):
        t = time + timedelta(seconds=add)
        target.left = t

    listen(Base, "before_insert", set_timestamp, propagate=True)
    listen(Base, "before_update", set_timestamp, propagate=True)
    try:
        yield
    finally:
        remove(Base, "before_insert", set_timestamp)
        remove(Base, "before_update", set_timestamp)
