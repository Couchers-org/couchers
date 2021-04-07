import os
from concurrent import futures
from contextlib import contextmanager
from datetime import date
from pathlib import Path
from unittest.mock import patch

import grpc
import pytest
from sqlalchemy import or_

from couchers.config import config
from couchers.crypto import random_hex
from couchers.db import apply_migrations, get_engine, session_scope
from couchers.models import Base, FriendRelationship, FriendStatus, User
from couchers.servicers.account import Account
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from couchers.servicers.bugs import Bugs
from couchers.servicers.communities import Communities
from couchers.servicers.conversations import Conversations
from couchers.servicers.discussions import Discussions
from couchers.servicers.groups import Groups
from couchers.servicers.jail import Jail
from couchers.servicers.media import Media, get_media_auth_interceptor
from couchers.servicers.pages import Pages
from couchers.servicers.references import References
from couchers.servicers.requests import Requests
from couchers.servicers.search import Search
from couchers.utils import create_coordinate
from pb import (
    account_pb2_grpc,
    api_pb2_grpc,
    auth_pb2_grpc,
    bugs_pb2_grpc,
    communities_pb2_grpc,
    conversations_pb2_grpc,
    discussions_pb2_grpc,
    groups_pb2_grpc,
    jail_pb2_grpc,
    media_pb2_grpc,
    pages_pb2_grpc,
    references_pb2_grpc,
    requests_pb2_grpc,
    search_pb2_grpc,
)


def db_impl(param):
    """
    Connect to a running Postgres database

    param tells whether the db should be built from alembic migrations or using metadata.create_all()
    """

    # running in non-UTC catches some timezone errors
    # os.environ["TZ"] = "Etc/UTC"
    os.environ["TZ"] = "America/New_York"

    # drop everything currently in the database
    with session_scope() as session:
        session.execute(
            "DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION postgis; CREATE EXTENSION pg_trgm;"
        )

    if param == "migrations":
        # rebuild it with alembic migrations
        apply_migrations()
    else:
        # create the slugify function
        functions = Path(__file__).parent / "slugify.sql"
        with open(functions) as f, session_scope() as session:
            session.execute(f.read())

        # create everything from the current models, not incrementally through migrations
        Base.metadata.create_all(get_engine())


@pytest.fixture(params=["migrations", "models"])
def db(request):
    """
    Pytest fixture to connect to a running Postgres database.

    request.param tells whether the db should be built from alembic migrations or using metadata.create_all()
    """

    db_impl(request.param)


def generate_user(*_, **kwargs):
    """
    Create a new user, return session token

    The user is detached from any session, and you can access its static attributes, but you can't modify it

    Use this most of the time
    """
    auth = Auth()

    with session_scope() as session:
        # default args
        username = "test_user_" + random_hex(16)
        user_opts = {
            "username": username,
            "email": f"{username}@dev.couchers.org",
            # password is just 'password'
            # this is hardcoded because the password is slow to hash (so would slow down tests otherwise)
            "hashed_password": b"$argon2id$v=19$m=65536,t=2,p=1$4cjGg1bRaZ10k+7XbIDmFg$tZG7JaLrkfyfO7cS233ocq7P8rf3znXR7SAfUt34kJg",
            "name": username.capitalize(),
            "city": "Testing city",
            "hometown": "Test hometown",
            "verification": 0.5,
            "community_standing": 0.5,
            "birthdate": date(year=2000, month=1, day=1),
            "gender": "N/A",
            "pronouns": "",
            "languages": "Testing language 1|Testing language 2",
            "occupation": "Tester",
            "education": "UST(esting)",
            "about_me": "I test things",
            "my_travels": "Places",
            "things_i_like": "Code",
            "about_place": "My place has a lot of testing paraphenelia",
            "countries_visited": "Testing country",
            "countries_lived": "Wonderland",
            "additional_information": "I can be a bit testy",
            # you need to make sure to update this logic to make sure the user is jailed/not on request
            "accepted_tos": 1,
            "geom": create_coordinate(40.7108, -73.9740),
            "geom_radius": 100,
        }

        for key, value in kwargs.items():
            user_opts[key] = value

        user = User(**user_opts)

        session.add(user)

        # this expires the user, so now it's "dirty"
        session.commit()

        class _DummyContext:
            def invocation_metadata(self):
                return {}

        token, _ = auth._create_session(_DummyContext(), session, user, False)

        # refresh it, undoes the expiry
        session.refresh(user)
        # allows detaches the user from the session, allowing its use outside this session
        session.expunge(user)

    return user, token


def make_friends(user1, user2):
    with session_scope() as session:
        friend_relationship = FriendRelationship(
            from_user_id=user1.id,
            to_user_id=user2.id,
            status=FriendStatus.accepted,
        )
        session.add(friend_relationship)


# This doubles as get_FriendRequest, since a friend request is just a pending friend relationship
def get_FriendRelationship(user1, user2):
    with session_scope() as session:
        friend_relationship = (
            session.query(FriendRelationship)
            .filter(
                or_(
                    (FriendRelationship.from_user_id == user1.id and FriendRelationship.to_user_id == user2.id),
                    (FriendRelationship.from_user_id == user2.id and FriendRelationship.to_user_id == user1.id),
                )
            )
            .one_or_none()
        )

        session.expunge(friend_relationship)
        return friend_relationship


class CookieMetadataPlugin(grpc.AuthMetadataPlugin):
    """
    Injects the right `cookie: couchers-sesh=...` header into the metadata
    """

    def __init__(self, token):
        self.token = token

    def __call__(self, context, callback):
        callback((("cookie", f"couchers-sesh={self.token}"),), None)


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
def auth_api_session():
    """
    Create an Auth API for testing

    This needs to use the real server since it plays around with headers
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor)
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        auth_pb2_grpc.add_AuthServicer_to_server(Auth(), server)
        server.start()

        try:
            with grpc.secure_channel(f"localhost:{port}", grpc.local_channel_credentials()) as channel:

                class _MetadataKeeperInterceptor(grpc.UnaryUnaryClientInterceptor):
                    def __init__(self):
                        self.latest_headers = {}

                    def intercept_unary_unary(self, continuation, client_call_details, request):
                        call = continuation(client_call_details, request)
                        self.latest_headers = dict(call.initial_metadata())
                        return call

                metadata_interceptor = _MetadataKeeperInterceptor()
                channel = grpc.intercept_channel(channel, metadata_interceptor)
                yield auth_pb2_grpc.AuthStub(channel), metadata_interceptor
        finally:
            server.stop(None).wait()


@contextmanager
def api_session(token):
    """
    Create an API for testing, uses the token for auth
    """
    channel = fake_channel(token)
    api_pb2_grpc.add_APIServicer_to_server(API(), channel)
    yield api_pb2_grpc.APIStub(channel)


@contextmanager
def real_api_session(token):
    """
    Create an API for testing, using TCP sockets, uses the token for auth
    """
    auth_interceptor = Auth().get_auth_interceptor(allow_jailed=False)

    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[auth_interceptor])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        servicer = API()
        api_pb2_grpc.add_APIServicer_to_server(servicer, server)
        server.start()

        call_creds = grpc.metadata_call_credentials(CookieMetadataPlugin(token))
        comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

        try:
            with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
                yield api_pb2_grpc.APIStub(channel)
        finally:
            server.stop(None).wait()


@contextmanager
def real_jail_session(token):
    """
    Create a Jail service for testing, using TCP sockets, uses the token for auth
    """
    auth_interceptor = Auth().get_auth_interceptor(allow_jailed=True)

    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[auth_interceptor])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        servicer = Jail()
        jail_pb2_grpc.add_JailServicer_to_server(servicer, server)
        server.start()

        call_creds = grpc.metadata_call_credentials(CookieMetadataPlugin(token))
        comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

        try:
            with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
                yield jail_pb2_grpc.JailStub(channel)
        finally:
            server.stop(None).wait()


def fake_channel(token):
    user_id, jailed = Auth().get_session_for_token(token)
    return FakeChannel(user_id=user_id)


@contextmanager
def conversations_session(token):
    """
    Create a Conversations API for testing, uses the token for auth
    """
    channel = fake_channel(token)
    conversations_pb2_grpc.add_ConversationsServicer_to_server(Conversations(), channel)
    yield conversations_pb2_grpc.ConversationsStub(channel)


@contextmanager
def requests_session(token):
    """
    Create a Requests API for testing, uses the token for auth
    """
    channel = fake_channel(token)
    requests_pb2_grpc.add_RequestsServicer_to_server(Requests(), channel)
    yield requests_pb2_grpc.RequestsStub(channel)


@contextmanager
def discussions_session(token):
    channel = fake_channel(token)
    discussions_pb2_grpc.add_DiscussionsServicer_to_server(Discussions(), channel)
    yield discussions_pb2_grpc.DiscussionsStub(channel)


@contextmanager
def pages_session(token):
    channel = fake_channel(token)
    pages_pb2_grpc.add_PagesServicer_to_server(Pages(), channel)
    yield pages_pb2_grpc.PagesStub(channel)


@contextmanager
def communities_session(token):
    channel = fake_channel(token)
    communities_pb2_grpc.add_CommunitiesServicer_to_server(Communities(), channel)
    yield communities_pb2_grpc.CommunitiesStub(channel)


@contextmanager
def groups_session(token):
    channel = fake_channel(token)
    groups_pb2_grpc.add_GroupsServicer_to_server(Groups(), channel)
    yield groups_pb2_grpc.GroupsStub(channel)


@contextmanager
def account_session(token):
    """
    Create a Account API for testing, uses the token for auth
    """
    channel = fake_channel(token)
    account_pb2_grpc.add_AccountServicer_to_server(Account(), channel)
    yield account_pb2_grpc.AccountStub(channel)


@contextmanager
def search_session(token):
    """
    Create a Search API for testing, uses the token for auth
    """
    channel = fake_channel(token)
    search_pb2_grpc.add_SearchServicer_to_server(Search(), channel)
    yield search_pb2_grpc.SearchStub(channel)


@contextmanager
def references_session(token):
    """
    Create a References API for testing, uses the token for auth
    """
    channel = fake_channel(token)
    references_pb2_grpc.add_ReferencesServicer_to_server(References(), channel)
    yield references_pb2_grpc.ReferencesStub(channel)


@contextmanager
def bugs_session():
    channel = FakeChannel()
    bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), channel)
    yield bugs_pb2_grpc.BugsStub(channel)


@contextmanager
def media_session(bearer_token):
    """
    Create a fresh Media API for testing, uses the bearer token for media auth
    """
    media_auth_interceptor = get_media_auth_interceptor(bearer_token)

    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[media_auth_interceptor])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        servicer = Media()
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

    config["IN_TEST"] = True

    config["DEV"] = True
    config["VERSION"] = "testing_version"
    config["BASE_URL"] = "http://localhost:3000"
    config["COOKIE_DOMAIN"] = "localhost"
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


@pytest.fixture
def fast_passwords():
    # password hashing, by design, takes a lot of time, which slows down the tests. here we jump through some hoops to
    # make this fast by removing the hashing step

    def fast_hash(password: bytes) -> bytes:
        return b"fake hash:" + password

    def fast_verify(hashed: bytes, password: bytes) -> bool:
        return hashed == fast_hash(password)

    with patch("couchers.crypto.nacl.pwhash.verify", fast_verify):
        with patch("couchers.crypto.nacl.pwhash.str", fast_hash):
            yield
