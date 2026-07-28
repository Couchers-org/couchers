from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import func, select
from sqlalchemy.sql import text

from couchers.db import session_scope
from couchers.models import BackgroundJob
from couchers.utils import now, now_in_timezone, today
from tests.fixtures.timewarp import Timewarp

LEAP_DAY = datetime(2024, 2, 29, 12, 0, 0, tzinfo=UTC)

# the clocks keep running while a test does its work, and postgres' differs from ours by a hair
TOLERANCE = timedelta(seconds=1)


def assert_close(actual: datetime, expected: datetime) -> None:
    assert abs(actual - expected) < TOLERANCE, f"{actual} is not within {TOLERANCE} of {expected}"


def make_job() -> BackgroundJob:
    return BackgroundJob(job_type="dummy_job", payload=b"")


def db_now() -> datetime:
    with session_scope() as session:
        return session.execute(select(func.now())).scalar_one()


def test_set_time_moves_both_clocks(db, timewarp: Timewarp) -> None:
    timewarp.set_time(LEAP_DAY)
    assert_close(now(), LEAP_DAY)
    assert_close(db_now(), LEAP_DAY)


def test_add_time_moves_both_clocks(db, timewarp: Timewarp) -> None:
    timewarp.set_time(LEAP_DAY)
    timewarp.add_time(timedelta(days=30))
    assert_close(now(), LEAP_DAY + timedelta(days=30))
    assert_close(db_now(), LEAP_DAY + timedelta(days=30))


def test_add_time_rewinds(db, timewarp: Timewarp) -> None:
    timewarp.set_time(LEAP_DAY)
    timewarp.add_time(-timedelta(hours=6))
    assert_close(now(), LEAP_DAY - timedelta(hours=6))
    assert_close(db_now(), LEAP_DAY - timedelta(hours=6))


def test_add_time_without_set_time_shifts_the_real_clock(db, timewarp: Timewarp) -> None:
    before = datetime.now(tz=UTC)
    timewarp.add_time(timedelta(days=365))
    assert before + timedelta(days=365) <= now() <= datetime.now(tz=UTC) + timedelta(days=365)


def test_the_clocks_keep_running(db, timewarp: Timewarp) -> None:
    timewarp.set_time(LEAP_DAY)
    first, first_db = now(), db_now()
    assert now() > first
    assert db_now() > first_db


def test_server_default_respects_the_warp(db, timewarp: Timewarp) -> None:
    timewarp.set_time(LEAP_DAY)
    with session_scope() as session:
        job = make_job()
        session.add(job)
        session.flush()
        assert_close(job.queued, LEAP_DAY)
        assert_close(job.next_attempt_after, LEAP_DAY)


def test_warp_persists_across_transactions(db, timewarp: Timewarp) -> None:
    """The setting is per-transaction, so each new session has to pick the offset up again."""
    timewarp.set_time(LEAP_DAY)
    with session_scope() as session:
        session.add(make_job())
    with session_scope() as session:
        assert_close(session.execute(select(BackgroundJob)).scalar_one().queued, LEAP_DAY)


def test_rows_inserted_at_different_times_differ(db, timewarp: Timewarp) -> None:
    timewarp.set_time(LEAP_DAY)
    with session_scope() as session:
        session.add(make_job())
    timewarp.add_time(timedelta(days=1))
    with session_scope() as session:
        session.add(make_job())
    with session_scope() as session:
        first, second = session.execute(select(BackgroundJob.queued).order_by(BackgroundJob.queued)).scalars().all()
    assert_close(first, LEAP_DAY)
    assert_close(second, LEAP_DAY + timedelta(days=1))


def test_two_inserts_in_one_transaction_agree(db, timewarp: Timewarp) -> None:
    """Postgres reports transaction start time, so the clock running doesn't split these apart."""
    timewarp.set_time(LEAP_DAY)
    with session_scope() as session:
        first, second = make_job(), make_job()
        session.add(first)
        session.flush()
        session.add(second)
        session.flush()
        assert first.queued == second.queued
        assert_close(first.queued, LEAP_DAY)


def test_query_time_now_is_warped(db, timewarp: Timewarp) -> None:
    """Unqualified now() in a WHERE clause resolves through search_path too, so hybrid properties
    like BackgroundJob.ready_for_retry see the warped clock."""
    timewarp.set_time(LEAP_DAY)
    with session_scope() as session:
        session.add(make_job())

    timewarp.add_time(-timedelta(days=1))
    with session_scope() as session:
        assert session.execute(select(BackgroundJob).where(BackgroundJob.ready_for_retry)).all() == []

    timewarp.add_time(timedelta(days=2))
    with session_scope() as session:
        assert session.execute(select(BackgroundJob).where(BackgroundJob.ready_for_retry)).one()


def test_derived_python_helpers_follow(db, timewarp: Timewarp) -> None:
    timewarp.set_time(LEAP_DAY)
    assert today() == LEAP_DAY.date()
    assert_close(now_in_timezone("America/New_York"), LEAP_DAY)


def test_reset_restores_both_clocks(db, timewarp: Timewarp) -> None:
    timewarp.set_time(LEAP_DAY)
    timewarp.reset()
    assert_close(now(), datetime.now(tz=UTC))
    assert_close(db_now(), datetime.now(tz=UTC))


def test_moving_the_clock_mid_transaction_raises(db, timewarp: Timewarp) -> None:
    with pytest.raises(RuntimeError, match="while a transaction is open"):
        with session_scope() as session:
            session.add(make_job())
            session.flush()
            timewarp.add_time(timedelta(days=1))


def test_no_complaint_before_the_transaction_touches_the_database(db, timewarp: Timewarp) -> None:
    """A session that hasn't emitted any SQL yet has no transaction, so postgres hasn't pinned
    now() and the clock is still free to move."""
    with session_scope() as session:
        session.add(make_job())
        timewarp.set_time(LEAP_DAY)
        session.flush()
        assert_close(session.execute(select(BackgroundJob)).scalar_one().queued, LEAP_DAY)


def test_the_clock_is_movable_again_after_the_transaction(db, timewarp: Timewarp) -> None:
    with session_scope() as session:
        session.add(make_job())
    timewarp.set_time(LEAP_DAY)
    assert_close(db_now(), LEAP_DAY)


def test_a_rolled_back_transaction_doesnt_wedge_the_clock(db, timewarp: Timewarp) -> None:
    with pytest.raises(ZeroDivisionError):
        with session_scope() as session:
            session.add(make_job())
            raise ZeroDivisionError
    timewarp.set_time(LEAP_DAY)
    assert_close(db_now(), LEAP_DAY)


def test_naive_datetime_rejected(timewarp: Timewarp) -> None:
    with pytest.raises(ValueError, match="aware datetime"):
        timewarp.set_time(datetime(2024, 2, 29, 12, 0, 0))


def test_clock_is_real_without_the_fixture(db) -> None:
    before = datetime.now(tz=UTC)
    assert before <= now() <= datetime.now(tz=UTC)
    assert_close(db_now(), datetime.now(tz=UTC))


def test_nothing_depends_on_the_real_now(db) -> None:
    """Every column default should have bound mock.now(), not pg_catalog.now(). A dependency on the
    real function means some DDL resolved before the search_path was in place."""
    with session_scope() as session:
        dependants = (
            session.execute(
                text("""
                SELECT pg_describe_object(classid, objid, objsubid)
                FROM pg_depend
                WHERE refclassid = 'pg_proc'::regclass
                  AND refobjid = 'pg_catalog.now()'::regprocedure
                """)
            )
            .scalars()
            .all()
        )
        assert dependants == []
