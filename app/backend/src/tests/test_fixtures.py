import os
from concurrent import futures
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from unittest.mock import patch

import grpc
import pytest
from sqlalchemy.orm import close_all_sessions
from sqlalchemy.sql import or_, text

from couchers.config import config
from couchers.constants import GUIDELINES_VERSION, TOS_VERSION
from couchers.crypto import random_hex
from couchers.db import _get_base_engine, session_scope
from couchers.descriptor_pool import get_descriptor_pool
from couchers.interceptors import AuthValidatorInterceptor, SessionInterceptor, _try_get_and_update_user_details
from couchers.jobs.worker import process_job
from couchers.models import (
    Base,
    FriendRelationship,
    FriendStatus,
    HostingStatus,
    Language,
    LanguageAbility,
    LanguageFluency,
    MeetupStatus,
    Region,
    RegionLived,
    RegionVisited,
    Upload,
    User,
    UserBlock,
    UserSession,
)
from couchers.servicers.account import Account, Iris
from couchers.servicers.admin import Admin
from couchers.servicers.api import API
from couchers.servicers.auth import Auth, create_session
from couchers.servicers.blocking import Blocking
from couchers.servicers.bugs import Bugs
from couchers.servicers.communities import Communities
from couchers.servicers.conversations import Conversations
from couchers.servicers.discussions import Discussions
from couchers.servicers.donations import Donations, Stripe
from couchers.servicers.events import Events
from couchers.servicers.groups import Groups
from couchers.servicers.jail import Jail
from couchers.servicers.media import Media, get_media_auth_interceptor
from couchers.servicers.notifications import Notifications
from couchers.servicers.pages import Pages
from couchers.servicers.references import References
from couchers.servicers.reporting import Reporting
from couchers.servicers.requests import Requests
from couchers.servicers.resources import Resources
from couchers.servicers.search import Search
from couchers.servicers.threads import Threads
from couchers.sql import couchers_select as select
from couchers.utils import create_coordinate, now
from proto import (
    account_pb2_grpc,
    admin_pb2_grpc,
    annotations_pb2,
    api_pb2_grpc,
    auth_pb2_grpc,
    blocking_pb2_grpc,
    bugs_pb2_grpc,
    communities_pb2_grpc,
    conversations_pb2_grpc,
    discussions_pb2_grpc,
    donations_pb2_grpc,
    events_pb2_grpc,
    groups_pb2_grpc,
    iris_pb2_grpc,
    jail_pb2_grpc,
    media_pb2_grpc,
    notifications_pb2_grpc,
    pages_pb2_grpc,
    references_pb2_grpc,
    reporting_pb2_grpc,
    requests_pb2_grpc,
    resources_pb2_grpc,
    search_pb2_grpc,
    stripe_pb2_grpc,
    threads_pb2_grpc,
)


def drop_all():
    """drop everything currently in the database"""
    with session_scope() as session:
        # postgis is required for all the Geographic Information System (GIS) stuff
        # pg_trgm is required for trigram based search
        # btree_gist is required for gist-based exclusion constraints
        session.execute(
            text(
                "DROP SCHEMA IF EXISTS public CASCADE;"
                "DROP SCHEMA IF EXISTS logging CASCADE;"
                "DROP EXTENSION IF EXISTS postgis CASCADE;"
                "CREATE SCHEMA public;"
                "CREATE SCHEMA logging;"
                "CREATE EXTENSION postgis;"
                "CREATE EXTENSION pg_trgm;"
                "CREATE EXTENSION btree_gist;"
            )
        )

    # this resets the database connection pool, which caches some stuff postgres-side about objects and will otherwise
    # sometimes error out with "ERROR:  no spatial operator found for 'st_contains': opfamily 203699 type 203585"
    # and similar errors
    _get_base_engine().dispose()

    close_all_sessions()


def create_schema_from_models():
    """
    Create everything from the current models, not incrementally
    through migrations.
    """

    # create the slugify function
    functions = Path(__file__).parent / "slugify.sql"
    with open(functions) as f, session_scope() as session:
        session.execute(text(f.read()))

    Base.metadata.create_all(_get_base_engine())


def populate_testing_resources(session):
    """
    Testing version of couchers.resources.copy_resources_to_database
    """
    regions = [
        ("AUS", "Australia"),
        ("CAN", "Canada"),
        ("CHE", "Switzerland"),
        ("CUB", "Cuba"),
        ("CXR", "Christmas Island"),
        ("CZE", "Czechia"),
        ("DEU", "Germany"),
        ("EGY", "Egypt"),
        ("ESP", "Spain"),
        ("EST", "Estonia"),
        ("FIN", "Finland"),
        ("FRA", "France"),
        ("GBR", "United Kingdom"),
        ("GEO", "Georgia"),
        ("GHA", "Ghana"),
        ("GRC", "Greece"),
        ("HKG", "Hong Kong"),
        ("IRL", "Ireland"),
        ("ISR", "Israel"),
        ("ITA", "Italy"),
        ("JPN", "Japan"),
        ("LAO", "Laos"),
        ("MEX", "Mexico"),
        ("MMR", "Myanmar"),
        ("NAM", "Namibia"),
        ("NLD", "Netherlands"),
        ("NZL", "New Zealand"),
        ("POL", "Poland"),
        ("PRK", "North Korea"),
        ("REU", "Réunion"),
        ("SGP", "Singapore"),
        ("SWE", "Sweden"),
        ("THA", "Thailand"),
        ("TUR", "Turkey"),
        ("TWN", "Taiwan"),
        ("USA", "United States"),
        ("VNM", "Vietnam"),
    ]

    languages = [
        ("arb", "Arabic (Standard)"),
        ("deu", "German"),
        ("eng", "English"),
        ("fin", "Finnish"),
        ("fra", "French"),
        ("heb", "Hebrew"),
        ("hun", "Hungarian"),
        ("jpn", "Japanese"),
        ("pol", "Polish"),
        ("swe", "Swedish"),
        ("cmn", "Chinese (Mandarin)"),
    ]

    with open(Path(__file__).parent / ".." / ".." / "resources" / "timezone_areas.sql-fake", "r") as f:
        tz_sql = f.read()

    for code, name in regions:
        session.add(Region(code=code, name=name))

    for code, name in languages:
        session.add(Language(code=code, name=name))

    session.execute(text(tz_sql))


def recreate_database():
    """
    Connect to a running Postgres database, build it using metadata.create_all()
    """

    # running in non-UTC catches some timezone errors
    os.environ["TZ"] = "America/New_York"

    # drop everything currently in the database
    drop_all()

    # create everything from the current models, not incrementally through migrations
    create_schema_from_models()

    with session_scope() as session:
        populate_testing_resources(session)


@pytest.fixture()
def db():
    """
    Pytest fixture to connect to a running Postgres database and build it using metadata.create_all()
    """

    recreate_database()


def generate_user(*, delete_user=False, complete_profile=True, **kwargs):
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
            "hosting_status": HostingStatus.cant_host,
            "meetup_status": MeetupStatus.open_to_meetup,
            "city": "Testing city",
            "hometown": "Test hometown",
            "community_standing": 0.5,
            "birthdate": date(year=2000, month=1, day=1),
            "gender": "N/A",
            "pronouns": "",
            "occupation": "Tester",
            "education": "UST(esting)",
            "about_me": "I test things",
            "my_travels": "Places",
            "things_i_like": "Code",
            "about_place": "My place has a lot of testing paraphenelia",
            "additional_information": "I can be a bit testy",
            # you need to make sure to update this logic to make sure the user is jailed/not on request
            "accepted_tos": TOS_VERSION,
            "accepted_community_guidelines": GUIDELINES_VERSION,
            "geom": create_coordinate(40.7108, -73.9740),
            "geom_radius": 100,
            "onboarding_emails_sent": 1,
            "last_onboarding_email_sent": now(),
            "has_donated": True,
        }

        for key, value in kwargs.items():
            user_opts[key] = value

        user = User(**user_opts)
        session.add(user)
        session.flush()

        session.add(RegionVisited(user_id=user.id, region_code="CHE"))
        session.add(RegionVisited(user_id=user.id, region_code="REU"))
        session.add(RegionVisited(user_id=user.id, region_code="FIN"))

        session.add(RegionLived(user_id=user.id, region_code="ESP"))
        session.add(RegionLived(user_id=user.id, region_code="FRA"))
        session.add(RegionLived(user_id=user.id, region_code="EST"))

        session.add(LanguageAbility(user_id=user.id, language_code="fin", fluency=LanguageFluency.fluent))
        session.add(LanguageAbility(user_id=user.id, language_code="fra", fluency=LanguageFluency.beginner))

        # this expires the user, so now it's "dirty"
        session.commit()

        class _DummyContext:
            def invocation_metadata(self):
                return {}

        token, _ = create_session(_DummyContext(), session, user, False, set_cookie=False)

        # deleted user aborts session creation, hence this follows and necessitates a second commit
        if delete_user:
            user.is_deleted = True

        user.recommendation_score = 1e10 - user.id

        if complete_profile:
            key = random_hex(32)
            filename = random_hex(32) + ".jpg"
            session.add(
                Upload(
                    key=key,
                    filename=filename,
                    creator_user_id=user.id,
                )
            )
            session.flush()
            user.avatar_key = key
            user.about_me = "I have a complete profile!\n" * 20

        session.commit()

        assert user.has_completed_profile == complete_profile

        # refresh it, undoes the expiry
        session.refresh(user)

        # this loads the user's timezone info which is lazy loaded, otherwise we'll get issues if we try to refer to it
        user.timezone  # noqa: B018

        # allows detaches the user from the session, allowing its use outside this session
        session.expunge(user)

    return user, token


def get_user_id_and_token(session, username):
    user_id = session.execute(select(User).where(User.username == username)).scalar_one().id
    token = session.execute(select(UserSession).where(UserSession.user_id == user_id)).scalar_one().token
    return user_id, token


def make_friends(user1, user2):
    with session_scope() as session:
        friend_relationship = FriendRelationship(
            from_user_id=user1.id,
            to_user_id=user2.id,
            status=FriendStatus.accepted,
        )
        session.add(friend_relationship)


def make_user_block(user1, user2):
    with session_scope() as session:
        user_block = UserBlock(
            blocking_user_id=user1.id,
            blocked_user_id=user2.id,
        )
        session.add(user_block)
        session.commit()


def make_user_invisible(user_id):
    with session_scope() as session:
        session.execute(select(User).where(User.id == user_id)).scalar_one().is_banned = True


# This doubles as get_FriendRequest, since a friend request is just a pending friend relationship
def get_friend_relationship(user1, user2):
    with session_scope() as session:
        friend_relationship = session.execute(
            select(FriendRelationship).where(
                or_(
                    (FriendRelationship.from_user_id == user1.id and FriendRelationship.to_user_id == user2.id),
                    (FriendRelationship.from_user_id == user2.id and FriendRelationship.to_user_id == user1.id),
                )
            )
        ).scalar_one_or_none()

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


@contextmanager
def auth_api_session(grpc_channel_options=()):
    """
    Create an Auth API for testing

    This needs to use the real server since it plays around with headers
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[AuthValidatorInterceptor(), SessionInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        auth_pb2_grpc.add_AuthServicer_to_server(Auth(), server)
        server.start()

        try:
            with grpc.secure_channel(
                f"localhost:{port}", grpc.local_channel_credentials(), options=grpc_channel_options
            ) as channel:

                class _MetadataKeeperInterceptor(grpc.UnaryUnaryClientInterceptor):
                    def __init__(self):
                        self.latest_headers = {}

                    def intercept_unary_unary(self, continuation, client_call_details, request):
                        call = continuation(client_call_details, request)
                        self.latest_headers = dict(call.initial_metadata())
                        self.latest_header_raw = call.initial_metadata()
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
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[AuthValidatorInterceptor(), SessionInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        api_pb2_grpc.add_APIServicer_to_server(API(), server)
        server.start()

        call_creds = grpc.metadata_call_credentials(CookieMetadataPlugin(token))
        comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

        try:
            with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
                yield api_pb2_grpc.APIStub(channel)
        finally:
            server.stop(None).wait()


@contextmanager
def real_admin_session(token):
    """
    Create a Admin service for testing, using TCP sockets, uses the token for auth
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[AuthValidatorInterceptor(), SessionInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        admin_pb2_grpc.add_AdminServicer_to_server(Admin(), server)
        server.start()

        call_creds = grpc.metadata_call_credentials(CookieMetadataPlugin(token))
        comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

        try:
            with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
                yield admin_pb2_grpc.AdminStub(channel)
        finally:
            server.stop(None).wait()


@contextmanager
def real_account_session(token):
    """
    Create a Account service for testing, using TCP sockets, uses the token for auth
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[AuthValidatorInterceptor(), SessionInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        account_pb2_grpc.add_AccountServicer_to_server(Account(), server)
        server.start()

        call_creds = grpc.metadata_call_credentials(CookieMetadataPlugin(token))
        comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

        try:
            with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
                yield account_pb2_grpc.AccountStub(channel)
        finally:
            server.stop(None).wait()


@contextmanager
def real_jail_session(token):
    """
    Create a Jail service for testing, using TCP sockets, uses the token for auth
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[AuthValidatorInterceptor(), SessionInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        jail_pb2_grpc.add_JailServicer_to_server(Jail(), server)
        server.start()

        call_creds = grpc.metadata_call_credentials(CookieMetadataPlugin(token))
        comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

        try:
            with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
                yield jail_pb2_grpc.JailStub(channel)
        finally:
            server.stop(None).wait()


class FakeRpcError(grpc.RpcError):
    def __init__(self, code, details):
        self._code = code
        self._details = details

    def code(self):
        return self._code

    def details(self):
        return self._details


def _check_user_perms(method, user_id, is_jailed, is_superuser, token_expiry):
    # method is of the form "/org.couchers.api.core.API/GetUser"
    _, service_name, method_name = method.split("/")

    service_options = get_descriptor_pool().FindServiceByName(service_name).GetOptions()
    auth_level = service_options.Extensions[annotations_pb2.auth_level]
    assert auth_level != annotations_pb2.AUTH_LEVEL_UNKNOWN
    assert auth_level in [
        annotations_pb2.AUTH_LEVEL_OPEN,
        annotations_pb2.AUTH_LEVEL_JAILED,
        annotations_pb2.AUTH_LEVEL_SECURE,
        annotations_pb2.AUTH_LEVEL_ADMIN,
    ]

    if not user_id:
        assert auth_level == annotations_pb2.AUTH_LEVEL_OPEN
    else:
        assert not (
            auth_level == annotations_pb2.AUTH_LEVEL_ADMIN and not is_superuser
        ), "Non-superuser tried to call superuser API"
        assert not (
            is_jailed and auth_level not in [annotations_pb2.AUTH_LEVEL_OPEN, annotations_pb2.AUTH_LEVEL_JAILED]
        ), "User is jailed but tried to call non-open/non-jailed API"


class FakeChannel:
    def __init__(self, user_id=None, is_jailed=None, is_superuser=None, token_expiry=None):
        self.handlers = {}
        self.user_id = user_id
        self._is_jailed = is_jailed
        self._is_superuser = is_superuser
        self._token_expiry = token_expiry

    def abort(self, code, details):
        raise FakeRpcError(code, details)

    def add_generic_rpc_handlers(self, generic_rpc_handlers):
        from grpc._server import _validate_generic_rpc_handlers

        _validate_generic_rpc_handlers(generic_rpc_handlers)

        self.handlers.update(generic_rpc_handlers[0]._method_handlers)

    def unary_unary(self, uri, request_serializer, response_deserializer):
        handler = self.handlers[uri]

        _check_user_perms(uri, self.user_id, self._is_jailed, self._is_superuser, self._token_expiry)

        def fake_handler(request):
            # Do a full serialization cycle on the request and the
            # response to catch accidental use of unserializable data.
            request = handler.request_deserializer(request_serializer(request))

            with session_scope() as session:
                response = handler.unary_unary(request, self, session)

            return response_deserializer(handler.response_serializer(response))

        return fake_handler


def fake_channel(token=None):
    if token:
        user_id, is_jailed, is_superuser, token_expiry = _try_get_and_update_user_details(
            token, is_api_key=False, ip_address="127.0.0.1", user_agent="Testing User-Agent"
        )
        return FakeChannel(user_id=user_id, is_jailed=is_jailed, is_superuser=is_superuser, token_expiry=token_expiry)
    return FakeChannel()


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
def threads_session(token):
    channel = fake_channel(token)
    threads_pb2_grpc.add_ThreadsServicer_to_server(Threads(), channel)
    yield threads_pb2_grpc.ThreadsStub(channel)


@contextmanager
def discussions_session(token):
    channel = fake_channel(token)
    discussions_pb2_grpc.add_DiscussionsServicer_to_server(Discussions(), channel)
    yield discussions_pb2_grpc.DiscussionsStub(channel)


@contextmanager
def donations_session(token):
    channel = fake_channel(token)
    donations_pb2_grpc.add_DonationsServicer_to_server(Donations(), channel)
    yield donations_pb2_grpc.DonationsStub(channel)


@contextmanager
def real_stripe_session():
    """
    Create a Stripe service for testing, using TCP sockets
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[AuthValidatorInterceptor(), SessionInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        stripe_pb2_grpc.add_StripeServicer_to_server(Stripe(), server)
        server.start()

        creds = grpc.local_channel_credentials()

        try:
            with grpc.secure_channel(f"localhost:{port}", creds) as channel:
                yield stripe_pb2_grpc.StripeStub(channel)
        finally:
            server.stop(None).wait()


@contextmanager
def real_iris_session():
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[AuthValidatorInterceptor(), SessionInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        iris_pb2_grpc.add_IrisServicer_to_server(Iris(), server)
        server.start()

        creds = grpc.local_channel_credentials()

        try:
            with grpc.secure_channel(f"localhost:{port}", creds) as channel:
                yield iris_pb2_grpc.IrisStub(channel)
        finally:
            server.stop(None).wait()


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
def blocking_session(token):
    channel = fake_channel(token)
    blocking_pb2_grpc.add_BlockingServicer_to_server(Blocking(), channel)
    yield blocking_pb2_grpc.BlockingStub(channel)


@contextmanager
def notifications_session(token):
    channel = fake_channel(token)
    notifications_pb2_grpc.add_NotificationsServicer_to_server(Notifications(), channel)
    yield notifications_pb2_grpc.NotificationsStub(channel)


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
def reporting_session(token):
    channel = fake_channel(token)
    reporting_pb2_grpc.add_ReportingServicer_to_server(Reporting(), channel)
    yield reporting_pb2_grpc.ReportingStub(channel)


@contextmanager
def events_session(token):
    channel = fake_channel(token)
    events_pb2_grpc.add_EventsServicer_to_server(Events(), channel)
    yield events_pb2_grpc.EventsStub(channel)


@contextmanager
def bugs_session(token=None):
    channel = fake_channel(token)
    bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), channel)
    yield bugs_pb2_grpc.BugsStub(channel)


@contextmanager
def resources_session():
    channel = fake_channel()
    resources_pb2_grpc.add_ResourcesServicer_to_server(Resources(), channel)
    yield resources_pb2_grpc.ResourcesStub(channel)


@contextmanager
def media_session(bearer_token):
    """
    Create a fresh Media API for testing, uses the bearer token for media auth
    """
    media_auth_interceptor = get_media_auth_interceptor(bearer_token)

    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[media_auth_interceptor, SessionInterceptor()])
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


@pytest.fixture(scope="class")
def testconfig():
    prevconfig = config.copy()
    config.clear()
    config.update(prevconfig)

    config["IN_TEST"] = True

    config["DEV"] = True
    config["SECRET"] = bytes.fromhex("448697d3886aec65830a1ea1497cdf804981e0c260d2f812cf2787c4ed1a262b")
    config["VERSION"] = "testing_version"
    config["BASE_URL"] = "http://localhost:3000"
    config["BACKEND_BASE_URL"] = "http://localhost:8888"
    config["CONSOLE_BASE_URL"] = "http://localhost:8888"
    config["COOKIE_DOMAIN"] = "localhost"

    config["ENABLE_SMS"] = False
    config["SMS_SENDER_ID"] = "invalid"

    config["ENABLE_EMAIL"] = False
    config["NOTIFICATION_EMAIL_SENDER"] = "Couchers.org"
    config["NOTIFICATION_EMAIL_ADDRESS"] = "notify@couchers.org.invalid"
    config["NOTIFICATION_PREFIX"] = "[TEST] "
    config["REPORTS_EMAIL_RECIPIENT"] = "reports@couchers.org.invalid"
    config["CONTRIBUTOR_FORM_EMAIL_RECIPIENT"] = "forms@couchers.org.invalid"
    config["MODS_EMAIL_RECIPIENT"] = "mods@couchers.org.invalid"

    config["ENABLE_DONATIONS"] = False
    config["STRIPE_API_KEY"] = ""
    config["STRIPE_WEBHOOK_SECRET"] = ""
    config["STRIPE_RECURRING_PRODUCT_ID"] = ""

    config["ENABLE_STRONG_VERIFICATION"] = False
    config["IRIS_ID_PUBKEY"] = ""
    config["IRIS_ID_SECRET"] = ""
    # corresponds to private key e6c2fbf3756b387bc09a458a7b85935718ef3eb1c2777ef41d335c9f6c0ab272
    config["VERIFICATION_DATA_PUBLIC_KEY"] = bytes.fromhex(
        "dd740a2b2a35bf05041a28257ea439b30f76f056f3698000b71e6470cd82275f"
    )

    config["SMTP_HOST"] = "localhost"
    config["SMTP_PORT"] = 587
    config["SMTP_USERNAME"] = "username"
    config["SMTP_PASSWORD"] = "password"

    config["ENABLE_MEDIA"] = True
    config["MEDIA_SERVER_SECRET_KEY"] = bytes.fromhex(
        "91e29bbacc74fa7e23c5d5f34cca5015cb896e338a620003de94a502a461f4bc"
    )
    config["MEDIA_SERVER_BEARER_TOKEN"] = "c02d383897d3b82774ced09c9e17802164c37e7e105d8927553697bf4550e91e"
    config["MEDIA_SERVER_BASE_URL"] = "http://localhost:5001"
    config["MEDIA_SERVER_UPLOAD_BASE_URL"] = "http://localhost:5001"

    config["BUG_TOOL_ENABLED"] = False
    config["BUG_TOOL_GITHUB_REPO"] = "org/repo"
    config["BUG_TOOL_GITHUB_USERNAME"] = "user"
    config["BUG_TOOL_GITHUB_TOKEN"] = "token"

    config["LISTMONK_ENABLED"] = False
    config["LISTMONK_BASE_URL"] = "https://localhost"
    config["LISTMONK_API_KEY"] = "..."
    config["LISTMONK_LIST_UUID"] = "..."

    config["PUSH_NOTIFICATIONS_ENABLED"] = True
    config["PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY"] = "uI1DCR4G1AdlmMlPfRLemMxrz9f3h4kvjfnI8K9WsVI"
    config["PUSH_NOTIFICATIONS_VAPID_SUBJECT"] = "mailto:testing@couchers.org.invalid"

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


def process_jobs():
    while process_job():
        pass


@contextmanager
def mock_notification_email():
    with patch("couchers.email._queue_email") as mock:
        yield mock
        process_jobs()


@dataclass
class EmailData:
    sender_name: str
    sender_email: str
    recipient: str
    subject: str
    plain: str
    html: str
    source_data: str
    list_unsubscribe_header: str


def email_fields(mock, call_ix=0):
    _, kw = mock.call_args_list[call_ix]
    return EmailData(
        sender_name=kw.get("sender_name"),
        sender_email=kw.get("sender_email"),
        recipient=kw.get("recipient"),
        subject=kw.get("subject"),
        plain=kw.get("plain"),
        html=kw.get("html"),
        source_data=kw.get("source_data"),
        list_unsubscribe_header=kw.get("list_unsubscribe_header"),
    )


@pytest.fixture
def push_collector():
    """
    See test_SendTestPushNotification for an example on how to use this fixture
    """

    class Push:
        """
        This allows nice access to the push info via e.g. push.title instead of push["title"]
        """

        def __init__(self, kwargs):
            self.kwargs = kwargs

        def __getattr__(self, attr):
            try:
                return self.kwargs[attr]
            except KeyError:
                raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{attr}'") from None

        def __repr__(self):
            kwargs_disp = ", ".join(f"'{key}'='{val}'" for key, val in self.kwargs.items())
            return f"Push({kwargs_disp})"

    class PushCollector:
        def __init__(self):
            # pairs of (user_id, push)
            self.pushes = []

        def by_user(self, user_id):
            return [kwargs for uid, kwargs in self.pushes if uid == user_id]

        def push_to_user(self, session, user_id, **kwargs):
            self.pushes.append((user_id, Push(kwargs=kwargs)))

        def assert_user_has_count(self, user_id, count):
            assert len(self.by_user(user_id)) == count

        def assert_user_push_matches_fields(self, user_id, ix=0, **kwargs):
            push = self.by_user(user_id)[ix]
            for kwarg in kwargs:
                assert kwarg in push.kwargs, f"Push notification {user_id=}, {ix=} missing field '{kwarg}'"
                assert (
                    push.kwargs[kwarg] == kwargs[kwarg]
                ), f"Push notification {user_id=}, {ix=} mismatch in field '{kwarg}', expected '{kwargs[kwarg]}' but got '{push.kwargs[kwarg]}'"

        def assert_user_has_single_matching(self, user_id, **kwargs):
            self.assert_user_has_count(user_id, 1)
            self.assert_user_push_matches_fields(user_id, ix=0, **kwargs)

    collector = PushCollector()

    with patch("couchers.notifications.push._push_to_user", collector.push_to_user):
        yield collector
