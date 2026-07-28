from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from sqlalchemy import Connection, event

from couchers import utils
from couchers.db import _get_base_engine


class Timewarp:
    """
    Shifts the clock that both python and postgres read, for tests that need to sit at a particular
    date or jump around in time.

        timewarp.set_time(datetime(2024, 2, 29, 12, tzinfo=UTC))
        timewarp.add_time(timedelta(days=30))

    Both clocks keep running, they're just displaced by an offset. Each side applies that offset to
    its own clock, so the two stay as (im)perfectly aligned as they normally are, and set_time lands
    within a hair of the instant asked for rather than exactly on it. Postgres also still reports
    transaction start time, so a long transaction sees its own start rather than a later add_time.
    """

    def __init__(self) -> None:
        self.offset = timedelta()
        self._open_transactions: set[Connection] = set()

    def now(self) -> datetime:
        return datetime.now(tz=UTC) + self.offset

    def set_time(self, when: datetime) -> None:
        if when.tzinfo is None:
            raise ValueError("timewarp needs an aware datetime, this one has no timezone")
        self._refuse_mid_transaction()
        self.offset = when - datetime.now(tz=UTC)

    def add_time(self, delta: timedelta) -> None:
        """Advances the clock, or rewinds it if delta is negative."""
        self._refuse_mid_transaction()
        self.offset += delta

    def reset(self) -> None:
        self._refuse_mid_transaction()
        self.offset = timedelta()

    def _refuse_mid_transaction(self) -> None:
        if self._open_transactions:
            raise RuntimeError(
                "can't move the clock while a transaction is open: postgres fixes now() at "
                "transaction start, so this would silently do nothing until the next one. Move the "
                "clock outside the session_scope block."
            )


def _as_interval(delta: timedelta) -> str:
    # these three are exact and sum to delta, unlike total_seconds() which is a float
    return f"{delta.days} days {delta.seconds} seconds {delta.microseconds} microseconds"


def install_timewarp() -> Generator[Timewarp]:
    warp = Timewarp()
    engine = _get_base_engine()

    # postgres reads the clock through mock.now(), which adds this setting to its own clock. It's
    # set per transaction so it can't leak into another test via a pooled connection.
    def sync_db_offset(conn: Connection) -> None:
        warp._open_transactions.add(conn)
        conn.exec_driver_sql("SELECT set_config('mock.offset', %s, true)", (_as_interval(warp.offset),))

    def transaction_ended(conn: Connection) -> None:
        warp._open_transactions.discard(conn)

    event.listen(engine, "begin", sync_db_offset)
    event.listen(engine, "commit", transaction_ended)
    event.listen(engine, "rollback", transaction_ended)
    try:
        with patch.object(utils, "_real_now", warp.now):
            yield warp
    finally:
        event.remove(engine, "begin", sync_db_offset)
        event.remove(engine, "commit", transaction_ended)
        event.remove(engine, "rollback", transaction_ended)
