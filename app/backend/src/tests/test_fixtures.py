import os
import re
from collections.abc import Generator, Sequence
from concurrent import futures
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any
from unittest.mock import patch

import grpc
import pytest
from grpc._server import _validate_generic_rpc_handlers
from sqlalchemy import Connection, Engine, create_engine, select, update
from sqlalchemy.orm import Session
from sqlalchemy.sql import or_, text

from couchers.config import config
from couchers.constants import GUIDELINES_VERSION, TOS_VERSION
from couchers.context import make_interactive_context
from couchers.crypto import random_hex
from couchers.db import _get_base_engine, session_scope
from couchers.descriptor_pool import get_descriptor_pool
from couchers.interceptors import (
    CouchersMiddlewareInterceptor,
    UserAuthInfo,
    _try_get_and_update_user_details,
)
from couchers.jobs.worker import process_job
from couchers.models import (
    Base,
    FriendRelationship,
    FriendStatus,
    HostingStatus,
    LanguageAbility,
    LanguageFluency,
    MeetupStatus,
    ModerationUserList,
    PassportSex,
    PhotoGallery,
    RegionLived,
    RegionVisited,
    StrongVerificationAttempt,
    StrongVerificationAttemptStatus,
    Upload,
    User,
    UserBlock,
    UserSession,
)
from couchers.notifications.push import PushNotificationContent
from couchers.proto import (
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
    editor_pb2_grpc,
    events_pb2_grpc,
    galleries_pb2_grpc,
    gis_pb2_grpc,
    groups_pb2_grpc,
    iris_pb2_grpc,
    jail_pb2_grpc,
    media_pb2_grpc,
    moderation_pb2,
    moderation_pb2_grpc,
    notifications_pb2_grpc,
    pages_pb2_grpc,
    postal_verification_pb2_grpc,
    public_pb2_grpc,
    references_pb2_grpc,
    reporting_pb2_grpc,
    requests_pb2_grpc,
    resources_pb2_grpc,
    search_pb2_grpc,
    stripe_pb2_grpc,
    threads_pb2_grpc,
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
from couchers.servicers.editor import Editor
from couchers.servicers.events import Events
from couchers.servicers.galleries import Galleries
from couchers.servicers.gis import GIS
from couchers.servicers.groups import Groups
from couchers.servicers.jail import Jail
from couchers.servicers.media import Media, get_media_auth_interceptor
from couchers.servicers.moderation import Moderation
from couchers.servicers.notifications import Notifications
from couchers.servicers.pages import Pages
from couchers.servicers.postal_verification import PostalVerification
from couchers.servicers.public import Public
from couchers.servicers.references import References
from couchers.servicers.reporting import Reporting
from couchers.servicers.requests import Requests
from couchers.servicers.resources import Resources
from couchers.servicers.search import Search
from couchers.servicers.threads import Threads
from couchers.utils import create_coordinate, now


def create_schema_from_models(engine: Engine | None = None) -> None:
    """
    Create everything from the current models, not incrementally
    through migrations.
    """
    if engine is None:
        engine = _get_base_engine()

    # create sql functions (these are created in migrations otherwise)
    functions = Path(__file__).parent / "sql_functions.sql"
    with open(functions) as f, engine.connect() as conn:
        conn.execute(text(f.read()))
        conn.commit()

    Base.metadata.create_all(engine)


def populate_testing_resources(conn: Connection) -> None:
    """
    Testing version of couchers.resources.copy_resources_to_database
    """
    conn.execute(
        text("""
        INSERT INTO regions (code, name) VALUES
        ('AUS', 'Australia'),
        ('CAN', 'Canada'),
        ('CHE', 'Switzerland'),
        ('CUB', 'Cuba'),
        ('CXR', 'Christmas Island'),
        ('CZE', 'Czechia'),
        ('DEU', 'Germany'),
        ('EGY', 'Egypt'),
        ('ESP', 'Spain'),
        ('EST', 'Estonia'),
        ('FIN', 'Finland'),
        ('FRA', 'France'),
        ('GBR', 'United Kingdom'),
        ('GEO', 'Georgia'),
        ('GHA', 'Ghana'),
        ('GRC', 'Greece'),
        ('HKG', 'Hong Kong'),
        ('IRL', 'Ireland'),
        ('ISR', 'Israel'),
        ('ITA', 'Italy'),
        ('JPN', 'Japan'),
        ('LAO', 'Laos'),
        ('MEX', 'Mexico'),
        ('MMR', 'Myanmar'),
        ('NAM', 'Namibia'),
        ('NLD', 'Netherlands'),
        ('NZL', 'New Zealand'),
        ('POL', 'Poland'),
        ('PRK', 'North Korea'),
        ('REU', 'Réunion'),
        ('SGP', 'Singapore'),
        ('SWE', 'Sweden'),
        ('THA', 'Thailand'),
        ('TUR', 'Turkey'),
        ('TWN', 'Taiwan'),
        ('USA', 'United States'),
        ('VNM', 'Vietnam');
    """)
    )

    # Insert languages as textual SQL
    conn.execute(
        text("""
        INSERT INTO languages (code, name) VALUES
        ('arb', 'Arabic (Standard)'),
        ('deu', 'German'),
        ('eng', 'English'),
        ('fin', 'Finnish'),
        ('fra', 'French'),
        ('heb', 'Hebrew'),
        ('hun', 'Hungarian'),
        ('jpn', 'Japanese'),
        ('pol', 'Polish'),
        ('swe', 'Swedish'),
        ('cmn', 'Chinese (Mandarin)')
    """)
    )

    with open(Path(__file__).parent / ".." / ".." / "resources" / "timezone_areas.sql-fake", "r") as f:
        tz_sql = f.read()

    conn.execute(text(tz_sql))


def drop_database() -> None:
    with session_scope() as session:
        # postgis is required for all the Geographic Information System (GIS) stuff
        # pg_trgm is required for trigram-based search
        # btree_gist is required for gist-based exclusion constraints
        session.execute(
            text(
                "DROP SCHEMA IF EXISTS public CASCADE;"
                "DROP SCHEMA IF EXISTS logging CASCADE;"
                "DROP EXTENSION IF EXISTS postgis CASCADE;"
                "CREATE SCHEMA IF NOT EXISTS public;"
                "CREATE SCHEMA IF NOT EXISTS logging;"
                "CREATE EXTENSION postgis;"
                "CREATE EXTENSION pg_trgm;"
                "CREATE EXTENSION btree_gist;"
            )
        )


@contextmanager
def autocommit_engine(url: str):
    """
    An engine that executes every statement in a transaction. Mainly needed
    because CREATE/DROP DATABASE cannot be executed any other way.
    """
    engine = create_engine(
        url,
        isolation_level="AUTOCOMMIT",
    )
    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def postgres_engine() -> Generator[Engine]:
    """
    SQLAlchemy engine connected to "postgres" database.
    """
    dsn = config["DATABASE_CONNECTION_STRING"]
    if not dsn.endswith("/testdb"):
        raise RuntimeError(f"DATABASE_CONNECTION_STRING must point to /testdb, but was {dsn}")

    postgres_dsn = re.sub(r"/testdb$", "/postgres", dsn)

    with autocommit_engine(postgres_dsn) as engine:
        yield engine


@pytest.fixture(scope="session")
def postgres_conn(postgres_engine: Engine) -> Generator[Connection]:
    """
    Acquiring a connection takes time, so we cache it.
    """
    with postgres_engine.connect() as conn:
        yield conn


@pytest.fixture(scope="session")
def template_db(postgres_conn: Connection) -> str:
    """
    Creates a template database with all the extensions, tables,
    and static data (languages, regions.) This is done only once: then
    we copy this template for every test. It's much faster than creating
    a database without a template or deleting data from all tables between
    tests. The tables are created from SQLA metadata, not by running the
    migrations - again, for speed.
    """
    # running in non-UTC catches some timezone errors
    os.environ["TZ"] = "America/New_York"

    name = "couchers_template"

    postgres_conn.execute(text(f"DROP DATABASE IF EXISTS {name}"))
    postgres_conn.execute(text(f"CREATE DATABASE {name}"))

    template_dsn = re.sub(
        r"/testdb$",
        f"/{name}",
        config["DATABASE_CONNECTION_STRING"],
    )

    with autocommit_engine(template_dsn) as engine:
        with engine.connect() as conn:
            conn.execute(
                text(
                    "CREATE SCHEMA logging;"
                    "CREATE EXTENSION IF NOT EXISTS postgis;"
                    "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
                    "CREATE EXTENSION IF NOT EXISTS btree_gist;"
                )
            )

            create_schema_from_models(engine)
            populate_testing_resources(conn)

    return name


@pytest.fixture
def db(template_db: str, postgres_conn: Connection) -> None:
    """
    Creates a fresh database for a test by copying a template. The template has
    the migrations applied and is populated with static data (regions, languages, etc.)
    """
    postgres_conn.execute(text("DROP DATABASE IF EXISTS testdb WITH (FORCE)"))
    postgres_conn.execute(text(f"CREATE DATABASE testdb WITH TEMPLATE {template_db}"))


@pytest.fixture(scope="class")
def db_class(template_db: str, postgres_conn: Connection) -> None:
    """
    The same as above, but with a different scope. Used in test_communities.py.
    """
    postgres_conn.execute(text("DROP DATABASE IF EXISTS testdb WITH (FORCE)"))
    postgres_conn.execute(text(f"CREATE DATABASE testdb WITH TEMPLATE {template_db}"))


class _MockCouchersContext:
    @property
    def headers(self):
        return {}


def generate_user(
    *,
    delete_user=False,
    complete_profile=True,
    strong_verification=False,
    regions_visited: Sequence[str] = (),
    regions_lived: Sequence[str] = (),
    language_abilities: Sequence[tuple[str, LanguageFluency]] = (),
    **kwargs: Any,
) -> tuple[User, str]:
    """
    Create a new user, return session token

    The user is detached from any session, and you can access its static attributes, but you can't modify it

    Use this most of the time
    """
    with session_scope() as session:
        # Ensure superusers are also editors (DB constraint)
        if kwargs.get("is_superuser") and "is_editor" not in kwargs:
            kwargs["is_editor"] = True

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
            "gender": "Woman",
            "pronouns": "",
            "occupation": "Tester",
            "education": "UST(esting)",
            "about_me": "I test things",
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
            "last_donated": now(),
        } | kwargs

        user = User(**user_opts)
        session.add(user)
        session.flush()

        # Create a profile gallery for the user and link it
        profile_gallery = PhotoGallery(owner_user_id=user.id)
        session.add(profile_gallery)
        session.flush()
        user.profile_gallery_id = profile_gallery.id

        for region in regions_visited:
            session.add(RegionVisited(user_id=user.id, region_code=region))

        for region in regions_lived:
            session.add(RegionLived(user_id=user.id, region_code=region))

        for lang, fluency in language_abilities:
            session.add(LanguageAbility(user_id=user.id, language_code=lang, fluency=fluency))

        # this expires the user, so now it's "dirty"
        token, _ = create_session(_MockCouchersContext(), session, user, False, set_cookie=False)

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

        if strong_verification:
            attempt = StrongVerificationAttempt(
                verification_attempt_token=f"verification_attempt_token_{user.id}",
                user_id=user.id,
                status=StrongVerificationAttemptStatus.succeeded,
                has_full_data=True,
                passport_encrypted_data=b"not real",
                passport_date_of_birth=user.birthdate,
                passport_sex={"Woman": PassportSex.female, "Man": PassportSex.male}.get(
                    user.gender, PassportSex.unspecified
                ),
                has_minimal_data=True,
                passport_expiry_date=date.today() + timedelta(days=10),
                passport_nationality="UTO",
                passport_last_three_document_chars=f"{user.id:03}",
                iris_token=f"iris_token_{user.id}",
                iris_session_id=user.id,
            )
            session.add(attempt)
            session.flush()
            assert attempt.has_strong_verification(user)

        session.commit()

        assert user.has_completed_profile == complete_profile

        # refresh it, undoes the expiry
        session.refresh(user)

        # this loads the user's timezone info which is lazy loaded, otherwise we'll get issues if we try to refer to it
        user.timezone  # noqa: B018

        # allows detaches the user from the session, allowing its use outside this session
        session.expunge(user)

    return user, token


def get_user_id_and_token(session: Session, username: str) -> tuple[int, str]:
    user_id = session.execute(select(User).where(User.username == username)).scalar_one().id
    token = session.execute(select(UserSession).where(UserSession.user_id == user_id)).scalar_one().token
    return user_id, token


def make_friends(user1: User, user2: User) -> None:
    with session_scope() as session:
        friend_relationship = FriendRelationship(
            from_user_id=user1.id,
            to_user_id=user2.id,
            status=FriendStatus.accepted,
        )
        session.add(friend_relationship)


def make_user_block(user1: User, user2: User) -> None:
    with session_scope() as session:
        user_block = UserBlock(
            blocking_user_id=user1.id,
            blocked_user_id=user2.id,
        )
        session.add(user_block)


def make_user_invisible(user_id: int) -> None:
    with session_scope() as session:
        session.execute(update(User).where(User.id == user_id).values(is_banned=True))


# This doubles as get_FriendRequest, since a friend request is just a pending friend relationship
def get_friend_relationship(user1: User, user2: User) -> FriendRelationship:
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


def add_users_to_new_moderation_list(users: list[User]) -> int:
    """Group users as duplicated accounts"""
    with session_scope() as session:
        moderation_user_list = ModerationUserList()
        session.add(moderation_user_list)
        session.flush()
        for user in users:
            refreshed_user = session.get(User, user.id)
            moderation_user_list.users.append(refreshed_user)
        return moderation_user_list.id


class CookieMetadataPlugin(grpc.AuthMetadataPlugin):
    """
    Injects the right `cookie: couchers-sesh=...` header into the metadata
    """

    def __init__(self, token: str):
        self.token = token

    def __call__(self, context, callback) -> None:
        callback((("cookie", f"couchers-sesh={self.token}"),), None)


class _MetadataKeeperInterceptor(grpc.UnaryUnaryClientInterceptor):
    def __init__(self):
        self.latest_headers = {}

    def intercept_unary_unary(self, continuation, client_call_details, request):
        call = continuation(client_call_details, request)
        self.latest_headers = dict(call.initial_metadata())
        self.latest_header_raw = call.initial_metadata()
        return call


@contextmanager
def auth_api_session(
    grpc_channel_options=(),
) -> Generator[tuple[auth_pb2_grpc.AuthStub, grpc.UnaryUnaryClientInterceptor]]:
    """
    Create an Auth API for testing

    This needs to use the real server since it plays around with headers
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[CouchersMiddlewareInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        auth_pb2_grpc.add_AuthServicer_to_server(Auth(), server)
        server.start()

        try:
            with grpc.secure_channel(
                f"localhost:{port}", grpc.local_channel_credentials(), options=grpc_channel_options
            ) as channel:
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
    channel = FakeChannel(token)
    api_pb2_grpc.add_APIServicer_to_server(API(), channel)
    yield api_pb2_grpc.APIStub(channel)


@contextmanager
def real_api_session(token):
    """
    Create an API for testing, using TCP sockets, uses the token for auth
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[CouchersMiddlewareInterceptor()])
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
        server = grpc.server(executor, interceptors=[CouchersMiddlewareInterceptor()])
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
def real_editor_session(token):
    """
    Create an Editor service for testing, using TCP sockets, uses the token for auth
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[CouchersMiddlewareInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        editor_pb2_grpc.add_EditorServicer_to_server(Editor(), server)
        server.start()

        call_creds = grpc.metadata_call_credentials(CookieMetadataPlugin(token))
        comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

        try:
            with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
                yield editor_pb2_grpc.EditorStub(channel)
        finally:
            server.stop(None).wait()


@contextmanager
def real_moderation_session(token):
    """
    Create a Moderation service for testing, using TCP sockets, uses the token for auth
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[CouchersMiddlewareInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        moderation_pb2_grpc.add_ModerationServicer_to_server(Moderation(), server)
        server.start()

        call_creds = grpc.metadata_call_credentials(CookieMetadataPlugin(token))
        comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

        try:
            with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
                yield moderation_pb2_grpc.ModerationStub(channel)
        finally:
            server.stop(None).wait()


@contextmanager
def real_account_session(token: str):
    """
    Create a Account service for testing, using TCP sockets, uses the token for auth
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[CouchersMiddlewareInterceptor()])
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
def real_jail_session(token: str):
    """
    Create a Jail service for testing, using TCP sockets, uses the token for auth
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[CouchersMiddlewareInterceptor()])
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


@contextmanager
def gis_session(token):
    channel = FakeChannel(token)
    gis_pb2_grpc.add_GISServicer_to_server(GIS(), channel)
    yield gis_pb2_grpc.GISStub(channel)


@contextmanager
def public_session():
    channel = FakeChannel()
    public_pb2_grpc.add_PublicServicer_to_server(Public(), channel)
    yield public_pb2_grpc.PublicStub(channel)


class FakeRpcError(grpc.RpcError):
    def __init__(self, code, details):
        self._code = code
        self._details = details

    def code(self):
        return self._code

    def details(self):
        return self._details


def _check_user_perms(method: str, user_id: int, is_jailed: bool, is_editor: bool, is_superuser: bool) -> None:
    # method is of the form "/org.couchers.api.core.API/GetUser"
    _, service_name, method_name = method.split("/")

    service_options = get_descriptor_pool().FindServiceByName(service_name).GetOptions()
    auth_level = service_options.Extensions[annotations_pb2.auth_level]
    assert auth_level != annotations_pb2.AUTH_LEVEL_UNKNOWN
    assert auth_level in [
        annotations_pb2.AUTH_LEVEL_OPEN,
        annotations_pb2.AUTH_LEVEL_JAILED,
        annotations_pb2.AUTH_LEVEL_SECURE,
        annotations_pb2.AUTH_LEVEL_EDITOR,
        annotations_pb2.AUTH_LEVEL_ADMIN,
    ]

    if not user_id:
        assert auth_level == annotations_pb2.AUTH_LEVEL_OPEN
    else:
        assert not (auth_level == annotations_pb2.AUTH_LEVEL_ADMIN and not is_superuser), (
            "Non-superuser tried to call superuser API"
        )
        assert not (auth_level == annotations_pb2.AUTH_LEVEL_EDITOR and not is_editor), (
            "Non-editor tried to call editor API"
        )
        assert not (
            is_jailed and auth_level not in [annotations_pb2.AUTH_LEVEL_OPEN, annotations_pb2.AUTH_LEVEL_JAILED]
        ), "User is jailed but tried to call non-open/non-jailed API"


class MockGrpcContext:
    """
    Pure mock of grpc.ServicerContext for testing.
    """

    def __init__(self):
        self._initial_metadata = []
        self._invocation_metadata = []

    def abort(self, code, details):
        raise FakeRpcError(code, details)

    def invocation_metadata(self):
        return self._invocation_metadata

    def send_initial_metadata(self, metadata):
        self._initial_metadata.extend(metadata)


class FakeChannel:
    """
    Mock gRPC channel for testing that orchestrates context creation.

    This holds test state (token) and creates proper CouchersContext
    instances when handlers are invoked.
    """

    def __init__(self, token=None):
        self.handlers = {}
        self._token = token

    def add_generic_rpc_handlers(self, generic_rpc_handlers):
        _validate_generic_rpc_handlers(generic_rpc_handlers)
        self.handlers.update(generic_rpc_handlers[0]._method_handlers)

    def unary_unary(self, uri, request_serializer, response_deserializer):
        handler = self.handlers[uri]

        def fake_handler(request):
            auth_info: UserAuthInfo | None = None
            if self._token:
                auth_info = _try_get_and_update_user_details(
                    self._token, is_api_key=False, ip_address="127.0.0.1", user_agent="Testing User-Agent"
                )

            _check_user_perms(
                uri,
                auth_info.user_id if auth_info else None,
                auth_info.is_jailed if auth_info else None,
                auth_info.is_editor if auth_info else None,
                auth_info.is_superuser if auth_info else None,
            )

            # Do a full serialization cycle on the request and the
            # response to catch accidental use of unserializable data.
            request = handler.request_deserializer(request_serializer(request))

            with session_scope() as session:
                mock_grpc_ctx = MockGrpcContext()

                context = make_interactive_context(
                    grpc_context=mock_grpc_ctx,
                    user_id=auth_info.user_id if auth_info else None,
                    is_api_key=False,
                    token=self._token if auth_info else None,
                    ui_language_preference=auth_info.ui_language_preference if auth_info else None,
                )

                response = handler.unary_unary(request, context, session)

            return response_deserializer(handler.response_serializer(response))

        return fake_handler


@contextmanager
def conversations_session(token):
    """
    Create a Conversations API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    conversations_pb2_grpc.add_ConversationsServicer_to_server(Conversations(), channel)
    yield conversations_pb2_grpc.ConversationsStub(channel)


@contextmanager
def requests_session(token):
    """
    Create a Requests API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    requests_pb2_grpc.add_RequestsServicer_to_server(Requests(), channel)
    yield requests_pb2_grpc.RequestsStub(channel)


@contextmanager
def threads_session(token):
    channel = FakeChannel(token)
    threads_pb2_grpc.add_ThreadsServicer_to_server(Threads(), channel)
    yield threads_pb2_grpc.ThreadsStub(channel)


@contextmanager
def discussions_session(token):
    channel = FakeChannel(token)
    discussions_pb2_grpc.add_DiscussionsServicer_to_server(Discussions(), channel)
    yield discussions_pb2_grpc.DiscussionsStub(channel)


@contextmanager
def donations_session(token):
    channel = FakeChannel(token)
    donations_pb2_grpc.add_DonationsServicer_to_server(Donations(), channel)
    yield donations_pb2_grpc.DonationsStub(channel)


@contextmanager
def real_stripe_session():
    """
    Create a Stripe service for testing, using TCP sockets
    """
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[CouchersMiddlewareInterceptor()])
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
        server = grpc.server(executor, interceptors=[CouchersMiddlewareInterceptor()])
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
    channel = FakeChannel(token)
    pages_pb2_grpc.add_PagesServicer_to_server(Pages(), channel)
    yield pages_pb2_grpc.PagesStub(channel)


@contextmanager
def communities_session(token):
    channel = FakeChannel(token)
    communities_pb2_grpc.add_CommunitiesServicer_to_server(Communities(), channel)
    yield communities_pb2_grpc.CommunitiesStub(channel)


@contextmanager
def groups_session(token):
    channel = FakeChannel(token)
    groups_pb2_grpc.add_GroupsServicer_to_server(Groups(), channel)
    yield groups_pb2_grpc.GroupsStub(channel)


@contextmanager
def blocking_session(token):
    channel = FakeChannel(token)
    blocking_pb2_grpc.add_BlockingServicer_to_server(Blocking(), channel)
    yield blocking_pb2_grpc.BlockingStub(channel)


@contextmanager
def notifications_session(token):
    channel = FakeChannel(token)
    notifications_pb2_grpc.add_NotificationsServicer_to_server(Notifications(), channel)
    yield notifications_pb2_grpc.NotificationsStub(channel)


@contextmanager
def account_session(token):
    """
    Create a Account API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    account_pb2_grpc.add_AccountServicer_to_server(Account(), channel)
    yield account_pb2_grpc.AccountStub(channel)


@contextmanager
def search_session(token):
    """
    Create a Search API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    search_pb2_grpc.add_SearchServicer_to_server(Search(), channel)
    yield search_pb2_grpc.SearchStub(channel)


@contextmanager
def references_session(token):
    """
    Create a References API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    references_pb2_grpc.add_ReferencesServicer_to_server(References(), channel)
    yield references_pb2_grpc.ReferencesStub(channel)


@contextmanager
def galleries_session(token):
    """
    Create a Galleries API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    galleries_pb2_grpc.add_GalleriesServicer_to_server(Galleries(), channel)
    yield galleries_pb2_grpc.GalleriesStub(channel)


@contextmanager
def reporting_session(token):
    channel = FakeChannel(token)
    reporting_pb2_grpc.add_ReportingServicer_to_server(Reporting(), channel)
    yield reporting_pb2_grpc.ReportingStub(channel)


@contextmanager
def events_session(token):
    channel = FakeChannel(token)
    events_pb2_grpc.add_EventsServicer_to_server(Events(), channel)
    yield events_pb2_grpc.EventsStub(channel)


@contextmanager
def postal_verification_session(token):
    channel = FakeChannel(token)
    postal_verification_pb2_grpc.add_PostalVerificationServicer_to_server(PostalVerification(), channel)
    yield postal_verification_pb2_grpc.PostalVerificationStub(channel)


@contextmanager
def bugs_session(token=None):
    channel = FakeChannel(token)
    bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), channel)
    yield bugs_pb2_grpc.BugsStub(channel)


@contextmanager
def resources_session():
    channel = FakeChannel()
    resources_pb2_grpc.add_ResourcesServicer_to_server(Resources(), channel)
    yield resources_pb2_grpc.ResourcesStub(channel)


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

    config["ENABLE_POSTAL_VERIFICATION"] = False

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
    config["LISTMONK_API_USERNAME"] = "..."
    config["LISTMONK_API_KEY"] = "..."
    config["LISTMONK_LIST_ID"] = 3

    config["PUSH_NOTIFICATIONS_ENABLED"] = True
    config["PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY"] = "uI1DCR4G1AdlmMlPfRLemMxrz9f3h4kvjfnI8K9WsVI"
    config["PUSH_NOTIFICATIONS_VAPID_SUBJECT"] = "mailto:testing@couchers.org.invalid"

    config["ACTIVENESS_PROBES_ENABLED"] = True

    config["RECAPTHCA_ENABLED"] = False
    config["RECAPTHCA_PROJECT_ID"] = "..."
    config["RECAPTHCA_API_KEY"] = "..."
    config["RECAPTHCA_SITE_KEY"] = "..."

    config["EXPERIMENTATION_ENABLED"] = False
    config["EXPERIMENTATION_PASS_ALL_GATES"] = True
    config["STATSIG_SERVER_SECRET_KEY"] = ""
    config["STATSIG_ENVIRONMENT"] = "testing"

    # Moderation auto-approval deadline - 0 disables, set in tests that need it
    config["MODERATION_AUTO_APPROVE_DEADLINE_SECONDS"] = 0
    # Bot user ID for automated moderation - will be set to a real user in tests that need it
    config["MODERATION_BOT_USER_ID"] = 1

    # Dev APIs disabled by default in tests
    config["ENABLE_DEV_APIS"] = False

    yield None

    config.clear()
    config.update(prevconfig)


def run_migration_test():
    return os.environ.get("RUN_MIGRATION_TEST", "false").lower() == "true"


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


@dataclass(frozen=True, slots=True, kw_only=True)
class Push:
    topic_action: str
    content: PushNotificationContent
    key: str | None = None
    ttl: int | None = None


class PushCollector:
    def __init__(self):
        # pairs of (user_id, push)
        self.pushes: list[tuple[int, Push]] = []

    def by_user(self, user_id: int) -> list[Push]:
        return [push for uid, push in self.pushes if uid == user_id]

    def push_to_user(self, session, user_id: int, **kwargs) -> None:
        self.pushes.append((user_id, Push(**kwargs)))

    def count_for_user(self, user_id: int) -> int:
        return len(self.by_user(user_id))

    def get_for_user(
        self,
        user_id: int,
        index: int | None = None,
    ) -> Push:
        pushes = self.by_user(user_id)
        if index is None:
            assert len(pushes) == 1, "Expected a single user notification"
            return pushes[0]
        return pushes[index]


@pytest.fixture
def push_collector():
    """
    See test_SendTestPushNotification for an example on how to use this fixture
    """
    collector = PushCollector()

    with patch("couchers.notifications.push._push_to_user", collector.push_to_user):
        yield collector


class Moderator:
    """
    A test fixture that provides a moderator user and methods to exercise the moderation API.

    Usage:
        def test_example(db, moderator):
            user, token = generate_user()
            # ... create a host request ...
            moderator.approve_host_request(host_request_id)
    """

    def __init__(self, user: User, token: str):
        self.user = user
        self.token = token

    def approve_host_request(self, host_request_id: int, reason: str = "Test approval") -> None:
        """
        Approve a host request using the moderation API.

        Args:
            host_request_id: The conversation_id of the host request
            reason: Optional reason for approval
        """
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
                    object_id=host_request_id,
                )
            )
            api.ModerateContent(
                moderation_pb2.ModerateContentReq(
                    moderation_state_id=state_res.moderation_state.moderation_state_id,
                    action=moderation_pb2.MODERATION_ACTION_APPROVE,
                    visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                    reason=reason,
                )
            )

    def approve_group_chat(self, group_chat_id: int, reason: str = "Test approval") -> None:
        """
        Approve a group chat using the moderation API.

        Args:
            group_chat_id: The conversation_id of the group chat
            reason: Optional reason for approval
        """
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT,
                    object_id=group_chat_id,
                )
            )
            api.ModerateContent(
                moderation_pb2.ModerateContentReq(
                    moderation_state_id=state_res.moderation_state.moderation_state_id,
                    action=moderation_pb2.MODERATION_ACTION_APPROVE,
                    visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                    reason=reason,
                )
            )


@pytest.fixture
def moderator():
    """
    Creates a moderator (superuser) and provides methods to exercise the moderation API.

    Usage:
        def test_example(db, moderator):
            # ... create a host request ...
            moderator.approve_host_request(host_request_id)
    """
    user, token = generate_user(is_superuser=True)
    yield Moderator(user, token)
