from concurrent import futures
from contextlib import contextmanager
from datetime import date, timedelta
from unittest.mock import patch

import grpc
import pytest
from sqlalchemy import create_engine
from sqlalchemy.event import listen, remove
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from couchers.config import config
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models import Base, FriendRelationship, FriendStatus, User
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


@pytest.fixture
def db():
    """
    Connect to a running Postgres database, and return the Session object.
    """
    engine = create_engine(config["DATABASE_CONNECTION_STRING"], poolclass=NullPool)

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    return sessionmaker(bind=engine)


def generate_user(db, username=None):
    """
    Create a new user, return session token
    """
    auth = Auth(db)

    with session_scope(db) as session:
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
        )

        session.add(user)

        # this expires the user, so now it's "dirty"
        session.commit()

        # refresh it, undoes the expiry
        session.refresh(user)
        # allows detaches the user from the session, allowing its use outside this session
        session.expunge(user)

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


class FakeRpcError(grpc.RpcError):
    def __init__(self, code, details):
        self._code = code
        self._details = details

    def code(self):
        return self._code

    def details(self):
        return self._details


class FakeChannel:
    def __init__(self, user_id=None):
        self.handlers = {}
        self.user_id = user_id

    def abort(self, code, details):
        raise FakeRpcError(code, details)

    def add_generic_rpc_handlers(self, generic_rpc_handlers):
        from grpc._server import _validate_generic_rpc_handlers

        _validate_generic_rpc_handlers(generic_rpc_handlers)

        self.handlers.update(generic_rpc_handlers[0]._method_handlers)

    def unary_unary(self, uri, request_serializer, response_deserializer):
        handler = self.handlers[uri]

        def fake_handler(request):
            # Do a full serialization cycle on the request and the
            # response to catch accidental use of unserializable data.
            request = handler.request_deserializer(request_serializer(request))

            response = handler.unary_unary(request, self)

            return response_deserializer(handler.response_serializer(response))

        return fake_handler


@contextmanager
def auth_api_session(db):
    """
    Create an Auth API for testing
    """
    channel = FakeChannel()
    auth_pb2_grpc.add_AuthServicer_to_server(Auth(db), channel)
    yield auth_pb2_grpc.AuthStub(channel)


@contextmanager
def api_session(db, token):
    """
    Create an API for testing, uses the token for auth
    """
    user_id = Auth(db).get_user_for_session_token(token)
    channel = FakeChannel(user_id=user_id)
    api_pb2_grpc.add_APIServicer_to_server(API(db), channel)
    yield api_pb2_grpc.APIStub(channel)


@contextmanager
def real_api_session(db, token):
    """
    Create an API for testing, using TCP sockets, uses the token for auth
    """
    auth_interceptor = Auth(db).get_auth_interceptor()

    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[auth_interceptor])
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
            server.stop(None).wait()


@contextmanager
def conversations_session(db, token):
    """
    Create a Conversations API for testing, uses the token for auth
    """
    user_id = Auth(db).get_user_for_session_token(token)
    channel = FakeChannel(user_id=user_id)
    conversations_pb2_grpc.add_ConversationsServicer_to_server(Conversations(db), channel)
    yield conversations_pb2_grpc.ConversationsStub(channel)


@contextmanager
def requests_session(db, token):
    """
    Create a Requests API for testing, uses the token for auth
    """
    auth_interceptor = Auth(db).get_auth_interceptor()
    user_id = Auth(db).get_user_for_session_token(token)
    channel = FakeChannel(user_id=user_id)
    requests_pb2_grpc.add_RequestsServicer_to_server(Requests(db), channel)
    yield requests_pb2_grpc.RequestsStub(channel)


@contextmanager
def bugs_session():
    channel = FakeChannel()
    bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), channel)
    yield bugs_pb2_grpc.BugsStub(channel)


@contextmanager
def media_session(db, bearer_token):
    """
    Create a fresh Media API for testing, uses the bearer token for media auth
    """
    media_auth_interceptor = get_media_auth_interceptor(bearer_token)

    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[media_auth_interceptor])
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
            server.stop(None).wait()


@pytest.fixture()
def testconfig():
    prevconfig = config.copy()
    config.clear()
    config.update(prevconfig)

    config["DEV"] = True
    config["VERSION"] = "testing_version"
    config["BASE_URL"] = "http://localhost:8080"
    config["ENABLE_EMAIL"] = False
    config["NOTIFICATION_EMAIL_ADDRESS"] = "notify@couchers.org.invalid"
    config["REPORTS_EMAIL_RECIPIENT"] = "reports@couchers.org.invalid"

    config["SMTP_HOST"] = "localhost"
    config["SMTP_PORT"] = 587
    config["SMTP_USERNAME"] = "username"
    config["SMTP_PASSWORD"] = "password"

    config["ENABLE_MEDIA"] = True
    config["MEDIA_SERVER_SECRET_KEY"] = bytes.fromhex(
        "91e29bbacc74fa7e23c5d5f34cca5015cb896e338a620003de94a502a461f4bc"
    )
    config["MEDIA_SERVER_BEARER_TOKEN"] = "c02d383897d3b82774ced09c9e17802164c37e7e105d8927553697bf4550e91e"
    config["MEDIA_SERVER_BASE_URL"] = "http://127.0.0.1:5000"

    config["BUG_TOOL_ENABLED"] = False
    config["BUG_TOOL_GITHUB_REPO"] = "user/repo"
    config["BUG_TOOL_GITHUB_USERNAME"] = "user"
    config["BUG_TOOL_GITHUB_TOKEN"] = "token"

    yield None

    config.clear()
    config.update(prevconfig)


@pytest.fixture()
def check_fd_leak():
    import psutil

    thisproc = psutil.Process()

    open_files_before_test = thisproc.num_fds()

    yield

    open_files_after_test = thisproc.num_fds()
    assert open_files_before_test == open_files_after_test
