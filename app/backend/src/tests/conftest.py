import os
import re
from collections.abc import Generator
from tempfile import TemporaryDirectory
from unittest.mock import patch

import pytest
from sqlalchemy import Connection, Engine
from sqlalchemy.sql import text

# Set up environment variables before any couchers imports (they trigger config loading)
prometheus_multiproc_dir = TemporaryDirectory()
os.environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name

from couchers.config import Config  # noqa: E402
from couchers.models import Base  # noqa: E402
from tests.fixtures.db import (  # noqa: E402
    autocommit_engine,
    create_schema_from_models,
    generate_user,
    populate_testing_resources,
)
from tests.fixtures.misc import Moderator, PushCollector  # noqa: E402


# Default for running with a database from docker-compose.test.yml.
database_connection_string = os.environ.get(
    "DATABASE_CONNECTION_STRING",
    "postgresql://postgres:06b3890acd2c235c41be0bbfe22f1b386a04bf02eedf8c977486355616be2aa1@localhost:6544/testdb")


@pytest.fixture(scope="session")
def postgres_engine() -> Generator[Engine]:
    """
    SQLAlchemy engine connected to "postgres" database.
    """
    dsn = database_connection_string
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
def testdb_engine() -> Generator[Engine]:
    """
    SQLAlchemy engine connected to "testdb" database.
    """
    dsn = database_connection_string
    with autocommit_engine(dsn) as engine:
        yield engine


@pytest.fixture(scope="session")
def testdb_conn(testdb_engine: Engine) -> Generator[Connection]:
    """
    Connection to testdb for truncating tables between tests.
    """
    with testdb_engine.connect() as conn:
        yield conn


# Static tables that should not be truncated between tests
STATIC_TABLES = frozenset({"languages", "timezone_areas", "regions"})


@pytest.fixture(scope="session")
def setup_testdb(postgres_conn: Connection, testdb_engine: Engine) -> None:
    """
    Creates the test database with all the extensions, tables,
    and static data (languages, regions, timezones). This is done only once
    per session. Between tests, we truncate all non-static tables.
    """
    # running in non-UTC catches some timezone errors
    os.environ["TZ"] = "America/New_York"

    postgres_conn.execute(text("DROP DATABASE IF EXISTS testdb WITH (FORCE)"))
    postgres_conn.execute(text("CREATE DATABASE testdb"))

    with testdb_engine.connect() as conn:
        conn.execute(
            text(
                "CREATE SCHEMA logging;"
                "CREATE EXTENSION IF NOT EXISTS postgis;"
                "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
                "CREATE EXTENSION IF NOT EXISTS btree_gist;"
                "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
            )
        )

        create_schema_from_models(testdb_engine)
        populate_testing_resources(conn)


def _truncate_non_static_tables(conn: Connection) -> None:
    """
    Truncates all non-static tables.
    Static tables (languages, timezone_areas, regions) are preserved.
    """
    tables_to_truncate = []
    for name in Base.metadata.tables.keys():
        # Skip static tables
        if name in STATIC_TABLES:
            continue
        # Handle schema-qualified names (e.g., "logging.api_calls" -> logging."api_calls")
        if "." in name:
            schema, table = name.split(".", 1)
            tables_to_truncate.append(f'{schema}."{table}"')
        else:
            tables_to_truncate.append(f'"{name}"')
    if tables_to_truncate:
        conn.execute(text(f"TRUNCATE {', '.join(tables_to_truncate)} RESTART IDENTITY CASCADE"))

    # Reset standalone sequences, not owned by any table column
    # (RESTART IDENTITY only resets sequences owned by truncated columns)
    conn.execute(text("ALTER SEQUENCE communities_seq RESTART WITH 1"))
    conn.execute(text("ALTER SEQUENCE moderation_seq RESTART WITH 2000000"))


@pytest.fixture
def db(setup_testdb: None, testdb_conn: Connection) -> None:
    """
    Truncates all non-static tables before each test.
    Static tables (languages, timezone_areas, regions) are preserved.
    """
    _truncate_non_static_tables(testdb_conn)


@pytest.fixture(scope="class")
def db_class(setup_testdb: None, testdb_conn: Connection) -> None:
    """
    The same as above, but with a different scope. Used in test_communities.py.
    """
    _truncate_non_static_tables(testdb_conn)


@pytest.fixture(scope="class")
def testconfig():
    Config.current = Config(
        in_test=True,
        dev=True,
        secret=bytes.fromhex("448697d3886aec65830a1ea1497cdf804981e0c260d2f812cf2787c4ed1a262b"),
        version="testing_version",
        base_url="http://localhost:3000",
        backend_base_url="http://localhost:8888",
        console_base_url="http://localhost:8888",
        merch_shop_url="",
        database_connection_string=database_connection_string,
        cookie_domain="localhost",
        enable_sms=False,
        sms_sender_id="invalid",
        enable_email=False,
        notification_email_sender="Couchers.org",
        notification_email_address="notify@couchers.org.invalid",
        notification_prefix="[TEST] ",
        reports_email_recipient="reports@couchers.org.invalid",
        contributor_form_email_recipient="forms@couchers.org.invalid",
        mods_email_recipient="mods@couchers.org.invalid",
        add_dummy_data=False,
        enable_email_ics_attachments=True,
        enable_donations=False,
        stripe_api_key="",
        stripe_webhook_secret="",
        stripe_recurring_product_id="",
        enable_strong_verification=False,
        iris_id_pubkey="",
        iris_id_secret="",
        # corresponds to private key e6c2fbf3756b387bc09a458a7b85935718ef3eb1c2777ef41d335c9f6c0ab272
        verification_data_public_key=bytes.fromhex("dd740a2b2a35bf05041a28257ea439b30f76f056f3698000b71e6470cd82275f"),
        enable_postal_verification=False,
        mypostcard_api_key="test-api-key",
        mypostcard_username="test-username",
        mypostcard_password="test-password",
        mypostcard_product_code="J9GCU",
        mypostcard_campaign_id="295",
        smtp_host="localhost",
        smtp_port=587,
        smtp_username="username",
        smtp_password="password",
        enable_media=True,
        media_server_secret_key=bytes.fromhex("91e29bbacc74fa7e23c5d5f34cca5015cb896e338a620003de94a502a461f4bc"),
        media_server_bearer_token="c02d383897d3b82774ced09c9e17802164c37e7e105d8927553697bf4550e91e",
        media_server_base_url="http://localhost:5001",
        media_server_upload_base_url="http://localhost:5001",
        bug_tool_enabled=False,
        bug_tool_github_repo="org/repo",
        bug_tool_github_username="user",
        bug_tool_github_token="token",
        sentry_enabled=False,
        sentry_url="",
        listmonk_enabled=False,
        listmonk_base_url="https://localhost",
        listmonk_api_username="...",
        listmonk_api_key="...",
        listmonk_list_id=3,
        push_notifications_enabled=True,
        push_notifications_vapid_private_key="uI1DCR4G1AdlmMlPfRLemMxrz9f3h4kvjfnI8K9WsVI",
        push_notifications_vapid_subject="mailto:testing@couchers.org.invalid",
        activeness_probes_enabled=True,
        recapthca_enabled=False,
        recapthca_project_id="...",
        recapthca_api_key="...",
        recapthca_site_key="...",
        experimentation_enabled=False,
        experimentation_pass_all_gates=True,
        statsig_server_secret_key="",
        statsig_environment="testing",
        # Moderation auto-approval deadline - 0 disables, set in tests that need it
        moderation_auto_approve_deadline_seconds=0,
        # Bot user ID for automated moderation - will be set to a real user in tests that need it
        moderation_bot_user_id=1,
        # Dev APIs disabled by default in tests
        enable_dev_apis=False,
        # Slack notifications disabled by default in tests
        slack_enabled=False,
        slack_bot_token="",
        slack_donations_channel="",
        slack_merch_channel="",
        enable_notification_translations=False,
    )

    yield None

    Config.current = None  # type: ignore[assignment]


@pytest.fixture
def fast_passwords():
    # password hashing, by design, takes a lot of time, which slows down the tests.
    # here we jump through some hoops to make this fast by removing the hashing step

    def fast_hash(password: bytes) -> bytes:
        return b"fake hash:" + password

    def fast_verify(hashed: bytes, password: bytes) -> bool:
        return hashed == fast_hash(password)

    with patch("couchers.crypto.nacl.pwhash.verify", fast_verify):
        with patch("couchers.crypto.nacl.pwhash.str", fast_hash):
            yield


@pytest.fixture
def push_collector():
    """
    See test_SendTestPushNotification for an example on how to use this fixture
    """
    collector = PushCollector()

    with patch("couchers.notifications.push._push_to_user", collector.push_to_user):
        yield collector


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
