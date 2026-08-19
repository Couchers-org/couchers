import hashlib
import os
from collections.abc import Generator
from dataclasses import replace
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any
from unittest.mock import patch

import pytest
from sqlalchemy import Connection, Engine
from sqlalchemy.sql import text

# Set up environment variables before any couchers imports (they trigger config loading)
prometheus_multiproc_dir = TemporaryDirectory()
os.environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name

# Default for running with a database from docker-compose.test.yml.
DEFAULT_DATABASE_CONNECTION_STRING = (
    "postgresql://postgres:06b3890acd2c235c41be0bbfe22f1b386a04bf02eedf8c977486355616be2aa1@localhost:6544/testdb"
)


def _test_database_name() -> str:
    """
    The database this run owns, which it drops and rebuilds at the start of the session.

    The name comes from where this file sits on disk, so suites running side by side out of
    different checkouts can share one postgres without destroying each other's database. It's
    printed in the pytest header. Set TEST_DB_NAME to run two suites out of the same checkout.
    """
    if name := os.environ.get("TEST_DB_NAME"):
        return name
    return "testdb_" + hashlib.blake2b(str(Path(__file__).resolve()).encode(), digest_size=4).hexdigest()


TEST_DB_NAME = _test_database_name()

# The environment says which postgres to talk to; the database name within it is always ours, so
# pointing DATABASE_CONNECTION_STRING at a real database can't get that database dropped.
_dsn = os.environ.get("DATABASE_CONNECTION_STRING", DEFAULT_DATABASE_CONNECTION_STRING)
os.environ["DATABASE_CONNECTION_STRING"] = _dsn.rsplit("/", 1)[0] + "/" + TEST_DB_NAME

from couchers import experimentation  # noqa: E402
from couchers.config import config  # noqa: E402
from couchers.db import _get_base_engine  # noqa: E402
from couchers.models import Base  # noqa: E402
from couchers.rate_limits.definitions import RATE_LIMIT_DEFINITIONS  # noqa: E402
from tests.fixtures import query_log  # noqa: E402
from tests.fixtures.db import (  # noqa: E402
    autocommit_engine,
    create_schema_from_models,
    generate_user,
    populate_testing_resources,
)
from tests.fixtures.misc import EmailCollector, Moderator, PushCollector  # noqa: E402
from tests.fixtures.timewarp import (  # noqa: E402
    FROZEN_TEST_TIME,
    MOCK_SEARCH_PATH,
    FrozenTimewarp,
    Timewarp,
    create_mock_clock,
    install_timewarp,
)

QUERY_LOG_DIR = Path(__file__).resolve().parents[2] / "test_artifacts" / "queries"


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption(
        "--query-log",
        action="store_true",
        help="record every SQL query, grouped by test and by the RPC that issued it, into test_artifacts/queries",
    )


def pytest_configure(config: pytest.Config) -> None:
    if config.getoption("--query-log"):
        query_log.enable(_get_base_engine())


def pytest_report_header() -> str:
    return f"test database: {TEST_DB_NAME}"


def pytest_sessionfinish(session: pytest.Session) -> None:
    if session.config.getoption("--query-log"):
        print(f"\nquery log written to {query_log.dump(QUERY_LOG_DIR)}")


@pytest.fixture(autouse=True)
def _record_queries_for_test(request: pytest.FixtureRequest) -> Generator[None]:
    """Attributes every query to the running test. Cheap no-op unless --query-log is on."""
    if not request.config.getoption("--query-log"):
        yield
        return
    query_log.set_current_test(request.node.nodeid)
    yield
    query_log.set_current_test(None)


@pytest.fixture(scope="session")
def postgres_engine() -> Generator[Engine]:
    """
    SQLAlchemy engine connected to "postgres" database.
    """
    postgres_dsn = config.DATABASE_CONNECTION_STRING.rsplit("/", 1)[0] + "/postgres"

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
    SQLAlchemy engine connected to this run's test database.
    """
    dsn = config.DATABASE_CONNECTION_STRING
    with autocommit_engine(dsn) as engine:
        yield engine


@pytest.fixture(scope="session")
def testdb_conn(testdb_engine: Engine) -> Generator[Connection]:
    """
    Connection to the test database for truncating tables between tests.
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

    postgres_conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME} WITH (FORCE)"))
    postgres_conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))

    # A column DEFAULT resolves now() once, when the column is created, and stores the function
    # identity forever after; later search_path changes don't reach it. So mock.now() has to
    # already shadow pg_catalog.now() on every connection before any DDL runs, which means
    # setting this at the database level here, ahead of the first connect. The mock schema
    # doesn't exist yet, which postgres tolerates in a search_path.
    postgres_conn.execute(text(f"ALTER DATABASE {TEST_DB_NAME} SET search_path = {MOCK_SEARCH_PATH}"))

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
        create_mock_clock(conn)

        create_schema_from_models(testdb_engine)
        populate_testing_resources(conn)


_reset_sql: str | None = None


def _build_reset_sql(conn: Connection) -> str:
    """
    Builds the statement that empties every non-static table and rewinds every sequence they use.

    TRUNCATE would be the obvious way to do this, but it allocates a fresh relfilenode for each
    table, index, toast relation and sequence it touches, which here is ~600 files per call and
    costs the same whether the tables hold a million rows or none. DELETE with the foreign key
    triggers off reaches the same end state ~35x faster, and the tables are near-empty anyway.
    """
    tables = []
    for name in Base.metadata.tables.keys():
        if name in STATIC_TABLES:
            continue
        schema, _, table = name.rpartition(".")
        tables.append(f'{schema}."{table}"' if schema else f'"{table}"')

    sequences = conn.execute(
        text("""
            SELECT s.schemaname, s.sequencename, s.start_value, d.refobjid::regclass::text AS owner
            FROM pg_sequences s
            JOIN pg_class c ON c.relname = s.sequencename AND c.relnamespace = s.schemaname::regnamespace
            LEFT JOIN pg_depend d ON d.objid = c.oid AND d.deptype = 'a'
            WHERE s.schemaname IN ('public', 'logging')
        """)
    ).all()

    # The models have foreign key cycles, so there is no order the tables could be emptied in that
    # would satisfy the constraints; turning the triggers off sidesteps the ordering entirely.
    statements = ["SET session_replication_role = replica"]
    statements += [f"DELETE FROM {table}" for table in tables]
    statements.append("SET session_replication_role = DEFAULT")
    # setval to the sequence's own start value is what RESTART IDENTITY would have done, and it also
    # covers the standalone sequences (communities_seq, moderation_seq) that nothing owns.
    statements += [
        f"SELECT setval('{schema}.\"{sequence}\"', {start_value}, false)"
        for schema, sequence, start_value, owner in sequences
        if owner not in STATIC_TABLES
    ]
    return "; ".join(statements)


def _reset_non_static_tables(conn: Connection) -> None:
    """
    Empties all non-static tables and rewinds their sequences.
    Static tables (languages, timezone_areas, regions) are preserved.
    """
    global _reset_sql
    if _reset_sql is None:
        _reset_sql = _build_reset_sql(conn)
    # One roundtrip: psycopg sends a parameterless statement over the simple query protocol, which
    # takes the whole semicolon-separated batch.
    conn.exec_driver_sql(_reset_sql)


@pytest.fixture
def db(setup_testdb: None, testdb_conn: Connection) -> None:
    """
    Empties all non-static tables before each test.
    Static tables (languages, timezone_areas, regions) are preserved.
    """
    _reset_non_static_tables(testdb_conn)


@pytest.fixture(scope="class")
def db_class(setup_testdb: None, testdb_conn: Connection) -> None:
    """
    The same as above, but with a different scope. Used in test_communities.py.
    """
    _reset_non_static_tables(testdb_conn)


@pytest.fixture
def timewarp() -> Generator[Timewarp]:
    """
    Lets a test move the clock, which keeps running from wherever it's put; see Timewarp.

    Works without `db`, for a test that only reads the clock from python: nothing connects until
    something runs a query.
    """
    yield from install_timewarp(Timewarp())


@pytest.fixture
def frozen_timewarp() -> Generator[FrozenTimewarp]:
    """
    Like `timewarp`, but the clock is stopped dead at 2020-01-01 UTC and stays stopped wherever it's
    moved to, so both python and postgres read back exactly the instant the test asked for.
    """
    yield from install_timewarp(FrozenTimewarp(FROZEN_TEST_TIME))


# Production gates forced True so tests run as "everything enabled". Used by testconfig and the `flags`
# fixture; tests flip individual values via `flags`.
_TEST_FLAG_DEFAULTS: dict[str, Any] = {
    "test_growthbook_integration": True,
    "sms_enabled": True,
    "strong_verification_enabled": True,
    "log_native_ota_requests": True,
    "donations_enabled": True,
    "antibot_enabled": True,
    "postal_verification_enabled": True,
    "listmonk_enabled": True,
    "remove_removed_users_from_mailing_list_enabled": True,
    "notification_translations_enabled": True,
    "email_ics_attachments_enabled": True,
    "public_trips_enabled": True,
}


@pytest.fixture(scope="class")
def testconfig():
    prevconfig = config.copy()
    prev_initialized = experimentation._initialized
    prev_load_local_flags = experimentation._load_local_flags

    config.IN_TEST = True

    config.DEV = True
    config.SECRET = bytes.fromhex("448697d3886aec65830a1ea1497cdf804981e0c260d2f812cf2787c4ed1a262b")
    config.VERSION = "testing_version"
    config.BASE_URL = "http://localhost:3000"
    config.BACKEND_BASE_URL = "http://localhost:8888"
    config.CONSOLE_BASE_URL = "http://localhost:8888"
    config.COOKIE_DOMAIN = "localhost"

    config.SMS_SENDER_ID = "invalid"

    config.ENABLE_EMAIL = False
    config.NOTIFICATION_EMAIL_SENDER = "Couchers.org"
    config.NOTIFICATION_EMAIL_ADDRESS = "notify@couchers.org.invalid"
    config.NOTIFICATION_PREFIX = "[TEST] "
    config.REPORTS_EMAIL_RECIPIENT = "reports@couchers.org.invalid"
    config.CONTRIBUTOR_FORM_EMAIL_RECIPIENT = "forms@couchers.org.invalid"
    config.MODS_EMAIL_RECIPIENT = "mods@couchers.org.invalid"

    config.STRIPE_API_KEY = ""
    config.STRIPE_WEBHOOK_SECRET = ""
    config.STRIPE_RECURRING_PRODUCT_ID = ""

    config.IRIS_ID_PUBKEY = ""
    config.IRIS_ID_SECRET = ""
    # corresponds to private key e6c2fbf3756b387bc09a458a7b85935718ef3eb1c2777ef41d335c9f6c0ab272
    config.VERIFICATION_DATA_PUBLIC_KEY = bytes.fromhex(
        "dd740a2b2a35bf05041a28257ea439b30f76f056f3698000b71e6470cd82275f"
    )

    config.MYPOSTCARD_API_KEY = "test-api-key"
    config.MYPOSTCARD_USERNAME = "test-username"
    config.MYPOSTCARD_PASSWORD = "test-password"
    config.MYPOSTCARD_PRODUCT_CODE = "J9GCU"
    config.MYPOSTCARD_CAMPAIGN_ID = "295"

    config.SMTP_HOST = "localhost"
    config.SMTP_PORT = 587
    config.SMTP_USERNAME = "username"
    config.SMTP_PASSWORD = "password"

    config.ENABLE_MEDIA = True
    config.MEDIA_SERVER_SECRET_KEY = bytes.fromhex("91e29bbacc74fa7e23c5d5f34cca5015cb896e338a620003de94a502a461f4bc")
    config.MEDIA_SERVER_BEARER_TOKEN = "c02d383897d3b82774ced09c9e17802164c37e7e105d8927553697bf4550e91e"
    config.MEDIA_SERVER_BASE_URL = "http://localhost:5001"
    config.MEDIA_SERVER_UPLOAD_BASE_URL = "http://localhost:5001"

    config.BUG_TOOL_ENABLED = False
    config.BUG_TOOL_GITHUB_REPO = "org/repo"
    config.BUG_TOOL_GITHUB_USERNAME = "user"
    config.BUG_TOOL_GITHUB_TOKEN = "token"

    config.SENTRY_FRONTEND_PROJECT_ID = "1234"

    config.LISTMONK_BASE_URL = "https://localhost"
    config.LISTMONK_API_USERNAME = "..."
    config.LISTMONK_API_KEY = "..."
    config.LISTMONK_LIST_ID = 3

    config.PUSH_NOTIFICATIONS_ENABLED = True
    config.PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY = "uI1DCR4G1AdlmMlPfRLemMxrz9f3h4kvjfnI8K9WsVI"
    config.PUSH_NOTIFICATIONS_VAPID_SUBJECT = "mailto:testing@couchers.org.invalid"

    config.ACTIVENESS_PROBES_ENABLED = True

    # File-override mode; gates forced True via the stubbed loader below. Tests needing GrowthBook use `feature_flags`.
    config.FEATURE_FLAGS_FILE_OVERRIDE_PATH = "feature-flags.dev.json"
    config.GROWTHBOOK_API_HOST = "https://cdn.growthbook.io"
    config.GROWTHBOOK_CLIENT_KEY = ""
    config.GROWTHBOOK_CACHE_PATH = ""
    experimentation._initialized = True
    experimentation._load_local_flags = lambda _path: _TEST_FLAG_DEFAULTS  # type: ignore[assignment]

    # Moderation auto-approval deadline - 0 disables, set in tests that need it
    config.MODERATION_AUTO_APPROVE_DEADLINE_SECONDS = 0
    # Bot user ID for automated moderation - will be set to a real user in tests that need it
    config.MODERATION_BOT_USER_ID = 1

    # Dev APIs disabled by default in tests
    config.ENABLE_DEV_APIS = False

    # Slack notifications disabled by default in tests
    config.SLACK_ENABLED = False
    config.SLACK_BOT_TOKEN = ""
    config.SLACK_DONATIONS_CHANNEL = ""
    config.SLACK_MERCH_CHANNEL = ""

    # Profiling disabled by default in tests
    config.PYROSCOPE_ENABLED = False
    config.PYROSCOPE_SERVER = "https://localhost"
    config.PYROSCOPE_AUTH_TOKEN = "token"

    # No Valkey by default, so rate limiting is disabled; tests that exercise it inject an in-memory store
    config.VALKEY_HOST = ""
    config.VALKEY_PORT = 6379
    config.RATE_LIMIT_IPV6_PREFIX = 64

    yield None

    config.copy_from(prevconfig)
    experimentation._initialized = prev_initialized
    experimentation._load_local_flags = prev_load_local_flags


class Flags:
    """Test handle for setting feature flag values in file-override mode; see the `flags` fixture."""

    def __init__(self, values: dict[str, Any]) -> None:
        self._values = values

    def set_boolean(self, key: str, value: bool) -> None:
        self._values[key] = value

    def set_string(self, key: str, value: str) -> None:
        self._values[key] = value

    def set_integer(self, key: str, value: int) -> None:
        self._values[key] = value

    def set_float(self, key: str, value: float) -> None:
        self._values[key] = value

    def set_object(self, key: str, value: Any) -> None:
        self._values[key] = value


@pytest.fixture
def flags(monkeypatch) -> Flags:
    """
    Override feature flag values for a test (file-override mode).

    Starts from the test defaults (production gates on), so a test flips individual flags:

        def test_x(flags):
            flags.set_boolean("test_growthbook_integration", False)
    """
    values = dict(_TEST_FLAG_DEFAULTS)
    monkeypatch.setattr(experimentation, "_load_local_flags", lambda _path: values)
    monkeypatch.setitem(config, "FEATURE_FLAGS_FILE_OVERRIDE_PATH", "feature-flags.dev.json")
    return Flags(values)


class FeatureFlags:
    """Test handle for controlling feature flag values; see the `feature_flags` fixture."""

    def __init__(self, features: dict[str, Any]) -> None:
        self._features = features

    def set(self, key: str, value: Any) -> None:
        """Make `key` resolve to `value` for every user (logged in or anonymous)."""
        self._features[key] = {"defaultValue": value}

    def set_definition(self, key: str, definition: dict[str, Any]) -> None:
        """Set a raw GrowthBook feature definition, for exercising rollouts/experiments."""
        self._features[key] = definition


@pytest.fixture
def feature_flags(monkeypatch) -> FeatureFlags:
    """
    Enable GrowthBook-mode flag evaluation against an in-memory snapshot; tests set values by key.

    Usage:
        def test_x(db, feature_flags):
            feature_flags.set("my_flag", True)
            ...
    """
    features: dict[str, Any] = {}
    monkeypatch.setattr(experimentation, "_initialized", True)
    monkeypatch.setattr(experimentation, "_state", {"features": features, "savedGroups": {}})
    # Switch to GrowthBook mode (empty override path).
    monkeypatch.setitem(config, "FEATURE_FLAGS_FILE_OVERRIDE_PATH", "")
    return FeatureFlags(features)


@pytest.fixture
def low_rate_limits(monkeypatch) -> None:
    """
    Shrinks every rate limit so a test can walk past it in a handful of calls.

    The production limits run up to 150 actions, and a test that has to exceed one spends most of its
    time creating the users to act on. The tests read the limits out of the definitions, so they pick
    these up without knowing they've been lowered.
    """
    for action, definition in list(RATE_LIMIT_DEFINITIONS.items()):
        monkeypatch.setitem(RATE_LIMIT_DEFINITIONS, action, replace(definition, warning_limit=3, hard_limit=6))


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
def email_collector():
    """Captures emails and allows inspecting them."""

    with EmailCollector() as collector:
        yield collector


@pytest.fixture
def push_collector():
    """
    See test_SendTestPushNotification for an example on how to use this fixture
    """
    with PushCollector() as collector:
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
