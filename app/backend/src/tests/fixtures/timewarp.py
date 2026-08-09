from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from sqlalchemy import Connection, event, text

from couchers import utils
from couchers.db import _get_base_engine

FROZEN_TEST_TIME = datetime(2020, 1, 1, tzinfo=UTC)


class Clock:
    """
    What the `timewarp` and `frozen_timewarp` fixtures below have in common: a clock that python and
    postgres both read, and that a test moves with advance(timedelta(days=30)), negative to rewind.

    Whether it ticks is a property of the fixture the test asked for rather than something it can
    turn on and off partway through, so the two are separate clocks rather than one with a mode.
    Each puts the clock at an instant under its own name, run_from and freeze_at, so a call site
    says which kind of clock it's talking to.
    """

    def __init__(self) -> None:
        self._open_transactions: set[Connection] = set()

    def now(self) -> datetime:
        raise NotImplementedError

    def _db_settings(self) -> tuple[str, str]:
        """What postgres needs to read this same clock, as (mock.offset, mock.frozen_at)."""
        raise NotImplementedError

    def _refuse_mid_transaction(self) -> None:
        if self._open_transactions:
            raise RuntimeError(
                "can't move the clock while a transaction is open: postgres reads the clock as it "
                "was at transaction start, so this would silently do nothing until the next one. "
                "Move the clock outside the session_scope block."
            )


class Timewarp(Clock):
    """
    A clock that keeps running, displaced from the real one by an offset. Each side applies that
    offset to its own clock, so the two stay as (im)perfectly aligned as they normally are, and
    run_from lands within a hair of the instant asked for rather than exactly on it. Postgres also
    still reports transaction start time, so a long transaction sees its own start rather than a
    later advance.
    """

    def __init__(self) -> None:
        super().__init__()
        self.offset = timedelta()

    def now(self) -> datetime:
        return datetime.now(tz=UTC) + self.offset

    def run_from(self, when: datetime) -> None:
        """Sets the clock to `when` and lets it tick on from there."""
        _check_aware(when)
        self._refuse_mid_transaction()
        self.offset = when - datetime.now(tz=UTC)

    def advance(self, delta: timedelta) -> None:
        """Moves the clock forwards, or backwards if delta is negative."""
        self._refuse_mid_transaction()
        self.offset += delta

    def _db_settings(self) -> tuple[str, str]:
        return _as_interval(self.offset), ""


class FrozenTimewarp(Clock):
    """
    A clock stopped dead at one instant, so both sides read back exactly that rather than ticking on
    from there. freeze_at and advance move it to another standstill.
    """

    def __init__(self, at: datetime) -> None:
        super().__init__()
        _check_aware(at)
        # utils.now() is UTC-aware everywhere else, and callers do read the tzinfo off it
        self.frozen_at = at.astimezone(UTC)

    def now(self) -> datetime:
        return self.frozen_at

    def freeze_at(self, when: datetime) -> None:
        """Stops the clock at `when` instead of wherever it was stopped before."""
        _check_aware(when)
        self._refuse_mid_transaction()
        self.frozen_at = when.astimezone(UTC)

    def advance(self, delta: timedelta) -> None:
        """Moves the clock forwards, or backwards if delta is negative."""
        self._refuse_mid_transaction()
        self.frozen_at += delta

    def _db_settings(self) -> tuple[str, str]:
        return "", self.frozen_at.isoformat()


def _check_aware(when: datetime) -> None:
    if when.tzinfo is None:
        raise ValueError("timewarp needs an aware datetime, this one has no timezone")


# mock goes ahead of pg_catalog so that an unqualified now() finds mock.now() first
MOCK_SEARCH_PATH = "public, mock, pg_catalog"


def create_mock_clock(conn: Connection) -> None:
    """
    Installs mock.now(), the postgres half of this fixture: the frozen instant if there is one, and
    otherwise postgres' own clock displaced by the offset. Both settings are read per transaction,
    and set by install_timewarp below.

    This lives outside create_schema_from_models because it has to exist before *either* way of
    building the schema runs, and survive drop_database() in between, so that migrations and
    models bake the same function into their column defaults.
    """
    conn.execute(
        text("""
        CREATE SCHEMA mock;

        CREATE FUNCTION mock.now() RETURNS timestamptz
        LANGUAGE sql STABLE AS $$
          SELECT coalesce(
            nullif(current_setting('mock.frozen_at', true), '')::timestamptz,
            pg_catalog.now() + coalesce(
              nullif(current_setting('mock.offset', true), '')::interval,
              interval '0'
            )
          );
        $$;
        """)
    )
    conn.commit()


def mock_clock_installed(conn: Connection) -> bool:
    """
    Whether this database has the mock clock, ie whether shifting it does anything at all. In one
    built without it, an unqualified now() is still pg_catalog.now() and reports the real time.
    """
    installed: bool = conn.exec_driver_sql(
        "SELECT to_regprocedure('now()') IS NOT DISTINCT FROM to_regprocedure('mock.now()')"
    ).scalar_one()
    return installed


def _as_interval(delta: timedelta) -> str:
    # these three are exact and sum to delta, unlike total_seconds() which is a float
    return f"{delta.days} days {delta.seconds} seconds {delta.microseconds} microseconds"


def install_timewarp[WarpT: Clock](warp: WarpT) -> Generator[WarpT]:
    # the engine is only connected to once something runs a query, so this is fine without the db fixture
    engine = _get_base_engine()

    # postgres reads the clock through mock.now(), which returns mock.frozen_at if there is one and
    # otherwise adds mock.offset to its own clock. Both are set per transaction so they can't leak
    # into another test via a pooled connection.
    def sync_db_clock(conn: Connection) -> None:
        conn.exec_driver_sql(
            "SELECT set_config('mock.offset', %s, true), set_config('mock.frozen_at', %s, true)",
            warp._db_settings(),
        )
        if not mock_clock_installed(conn):
            raise RuntimeError(
                "timewarp can't move the postgres clock in this database: now() still resolves to "
                "pg_catalog.now(), so the database would quietly report the real time. mock.now() "
                "is installed when the test database is built, so request the `db` fixture in any "
                "test that uses timewarp and touches the database."
            )
        warp._open_transactions.add(conn)

    def transaction_ended(conn: Connection) -> None:
        warp._open_transactions.discard(conn)

    event.listen(engine, "begin", sync_db_clock)
    event.listen(engine, "commit", transaction_ended)
    event.listen(engine, "rollback", transaction_ended)
    try:
        with patch.object(utils, "_mockable_now", warp.now):
            yield warp
    finally:
        event.remove(engine, "begin", sync_db_clock)
        event.remove(engine, "commit", transaction_ended)
        event.remove(engine, "rollback", transaction_ended)
