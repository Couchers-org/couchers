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
    dsn = config.database_connection_string
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
    dsn = config.database_connection_string
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

    config.in_test = True

    config.dev = True
    config.secret = bytes.fromhex("448697d3886aec65830a1ea1497cdf804981e0c260d2f812cf2787c4ed1a262b")
    config.version = "testing_version"
    config.base_url = "http://localhost:3000"
    config.backend_base_url = "http://localhost:8888"
    config.console_base_url = "http://localhost:8888"
    config.cookie_domain = "localhost"

    config.enable_sms = False
    config.sms_sender_id = "invalid"

    config.enable_email = False
    config.notification_email_sender = "Couchers.org"
    config.notification_email_address = "notify@couchers.org.invalid"
    config.notification_prefix = "[TEST] "
    config.reports_email_recipient = "reports@couchers.org.invalid"
    config.contributor_form_email_recipient = "forms@couchers.org.invalid"
    config.mods_email_recipient = "mods@couchers.org.invalid"
    config.enable_email_ics_attachments = True

    config.enable_donations = False
    config.stripe_api_key = ""
    config.stripe_webhook_secret = ""
    config.stripe_recurring_product_id = ""

    config.enable_strong_verification = False
    config.iris_id_pubkey = ""
    config.iris_id_secret = ""
    # corresponds to private key e6c2fbf3756b387bc09a458a7b85935718ef3eb1c2777ef41d335c9f6c0ab272
    config.verification_data_public_key = bytes.fromhex(
        "dd740a2b2a35bf05041a28257ea439b30f76f056f3698000b71e6470cd82275f"
    )

    config.enable_postal_verification = False
    config.mypostcard_api_key = "test-api-key"
    config.mypostcard_username = "test-username"
    config.mypostcard_password = "test-password"
    config.mypostcard_product_code = "J9GCU"
    config.mypostcard_campaign_id = "295"

    config.smtp_host = "localhost"
    config.smtp_port = 587
    config.smtp_username = "username"
    config.smtp_password = "password"

    config.enable_media = True
    config.media_server_secret_key = bytes.fromhex(
        "91e29bbacc74fa7e23c5d5f34cca5015cb896e338a620003de94a502a461f4bc"
    )
    config.media_server_bearer_token = "c02d383897d3b82774ced09c9e17802164c37e7e105d8927553697bf4550e91e"
    config.media_server_base_url = "http://localhost:5001"
    config.media_server_upload_base_url = "http://localhost:5001"

    config.bug_tool_enabled = False
    config.bug_tool_github_repo = "org/repo"
    config.bug_tool_github_username = "user"
    config.bug_tool_github_token = "token"

    config.listmonk_enabled = False
    config.listmonk_base_url = "https://localhost"
    config.listmonk_api_username = "..."
    config.listmonk_api_key = "..."
    config.listmonk_list_id = 3

    config.push_notifications_enabled = True
    config.push_notifications_vapid_private_key = "uI1DCR4G1AdlmMlPfRLemMxrz9f3h4kvjfnI8K9WsVI"
    config.push_notifications_vapid_subject = "mailto:testing@couchers.org.invalid"

    config.activeness_probes_enabled = True

    config.recapthca_enabled = False
    config.recapthca_project_id = "..."
    config.recapthca_api_key = "..."
    config.recapthca_site_key = "..."

    config.experimentation_enabled = False
    config.experimentation_pass_all_gates = True
    config.statsig_server_secret_key = ""
    config.statsig_environment = "testing"

    # Moderation auto-approval deadline - 0 disables, set in tests that need it
    config.moderation_auto_approve_deadline_seconds = 0
    # Bot user ID for automated moderation - will be set to a real user in tests that need it
    config.moderation_bot_user_id = 1

    # Dev APIs disabled by default in tests
    config.enable_dev_apis = False

    # Slack notifications disabled by default in tests
    config.slack_enabled = False
    config.slack_bot_token = ""
    config.slack_donations_channel = ""
    config.slack_merch_channel = ""

    config.enable_notification_translations = False

    yield None

    config.set_from(prevconfig)


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
