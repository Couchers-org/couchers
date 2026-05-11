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

# Default for running with a database from docker-compose.test.yml.
if "DATABASE_CONNECTION_STRING" not in os.environ:  # pragma: no cover
    os.environ["DATABASE_CONNECTION_STRING"] = (
        "postgresql://postgres:06b3890acd2c235c41be0bbfe22f1b386a04bf02eedf8c977486355616be2aa1@localhost:6544/testdb"
    )

from couchers.config import config  # noqa: E402
from couchers.metrics import create_prometheus_server  # noqa: E402
from couchers.models import Base  # noqa: E402
from tests.fixtures.db import (  # noqa: E402
    autocommit_engine,
    create_schema_from_models,
    generate_user,
    populate_testing_resources,
)
from tests.fixtures.misc import Moderator, PushCollector  # noqa: E402


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
def testdb_engine() -> Generator[Engine]:
    """
    SQLAlchemy engine connected to "testdb" database.
    """
    dsn = config["DATABASE_CONNECTION_STRING"]
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
    config["MYPOSTCARD_API_KEY"] = "test-api-key"
    config["MYPOSTCARD_USERNAME"] = "test-username"
    config["MYPOSTCARD_PASSWORD"] = "test-password"
    config["MYPOSTCARD_PRODUCT_CODE"] = "J9GCU"
    config["MYPOSTCARD_CAMPAIGN_ID"] = "295"

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

    # Slack notifications disabled by default in tests
    config["SLACK_ENABLED"] = False
    config["SLACK_BOT_TOKEN"] = ""
    config["SLACK_DONATIONS_CHANNEL"] = ""
    config["SLACK_MERCH_CHANNEL"] = ""

    config["ENABLE_NOTIFICATION_TRANSLATIONS"] = False

    yield None

    config.clear()
    config.update(prevconfig)


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


@pytest.fixture(scope="session")
def prometheus_server():
    return create_prometheus_server(port=0)
