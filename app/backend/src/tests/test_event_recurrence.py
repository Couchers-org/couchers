from datetime import UTC, date, datetime, timedelta

from couchers.event_recurrence import (
    get_future_occurrences,
    make_daily_rrule,
    make_every_nth_week_rrule,
    make_monthly_rrule,
    schedule_occurrences,
)
from tests.fixtures.timewarp import FrozenTimewarp


def test_make_every_nth_week_rrule_weekly() -> None:
    start = date(2000, 1, 1)
    rrule = make_every_nth_week_rrule(start, n=1)

    occurrences = get_future_occurrences(start, rrule)
    assert next(occurrences) == start
    assert next(occurrences) == date(2000, 1, 8)
    assert next(occurrences) == date(2000, 1, 15)


def test_make_every_nth_week_rrule_biweekly() -> None:
    start = date(2000, 1, 1)
    rrule = make_every_nth_week_rrule(start, n=2)

    occurrences = get_future_occurrences(start, rrule)
    assert next(occurrences) == start
    assert next(occurrences) == date(2000, 1, 15)
    assert next(occurrences) == date(2000, 1, 29)


def test_make_daily_rrule() -> None:
    start = date(2000, 1, 1)
    rrule = make_daily_rrule(start)

    occurrences = get_future_occurrences(start, rrule)
    assert next(occurrences) == start
    assert next(occurrences) == date(2000, 1, 2)
    assert next(occurrences) == date(2000, 1, 3)


def test_make_daily_rrule_with_end_date() -> None:
    start = date(2000, 1, 1)
    rrule = make_daily_rrule(start, end_date=date(2000, 1, 2))

    assert list(get_future_occurrences(start, rrule)) == [start, date(2000, 1, 2)]


def test_make_monthly_rrule() -> None:
    start = date(2000, 1, 1)
    rrule = make_monthly_rrule(start)

    occurrences = get_future_occurrences(start, rrule)
    assert next(occurrences) == start
    assert next(occurrences) == date(2000, 2, 1)
    assert next(occurrences) == date(2000, 3, 1)


def test_make_monthly_rrule_with_end_date() -> None:
    start = date(2000, 1, 1)
    rrule = make_monthly_rrule(start, end_date=date(2000, 2, 1))

    assert list(get_future_occurrences(start, rrule)) == [start, date(2000, 2, 1)]


def test_get_future_occurrences_boundaries() -> None:
    start = date(2000, 1, 1)
    rrule = make_every_nth_week_rrule(start, n=1)

    # from_date a week before the first occurrence: shouldn't return anything from the week prior
    occurrences = get_future_occurrences(start - timedelta(days=8), rrule)
    assert next(occurrences) == start
    assert next(occurrences) == date(2000, 1, 8)
    assert next(occurrences) == date(2000, 1, 15)

    # inclusive of from_date exactly on an occurrence
    occurrences = get_future_occurrences(start, rrule)
    assert next(occurrences) == start
    assert next(occurrences) == date(2000, 1, 8)
    assert next(occurrences) == date(2000, 1, 15)

    # After the first occurrence
    occurrences = get_future_occurrences(date(2000, 1, 2), rrule)
    assert next(occurrences) == date(2000, 1, 8)
    assert next(occurrences) == date(2000, 1, 15)


def test_get_future_occurrences_bounded_rule_terminates() -> None:
    start = date(2000, 1, 1)
    rrule = make_every_nth_week_rrule(start, n=1, end_date=date(2000, 1, 8))

    assert list(get_future_occurrences(start, rrule)) == [start, date(2000, 1, 8)]


def test_get_future_occurrences_past_last_occurrence_is_empty() -> None:
    start = date(2000, 1, 1)
    rrule = make_every_nth_week_rrule(start, n=1, end_date=date(2000, 1, 8))

    assert list(get_future_occurrences(date(2000, 2, 1), rrule)) == []


def test_schedule_occurrences_frequent_rule_returns_more_than_minimum() -> None:
    """
    For frequent events, we should schedule all events within the schedule window,
    which should exceed the minimum occurrence count (used for infrequent events).
    """
    reference_date = date(2000, 1, 1)
    rrule = make_daily_rrule(reference_date)

    result = schedule_occurrences(
        rrule=rrule,
        schedule_window=timedelta(weeks=2),
        min_occurrences=2,
        last_scheduled_date=reference_date - timedelta(days=1),
        today=reference_date,
    )

    assert len(result) > 2
    assert result[0] == reference_date
    assert result[-1] <= reference_date + timedelta(weeks=2)


def test_schedule_occurrences_infrequent_rule_returns_minimum_occurrences() -> None:
    """
    For infrequent events, we should schedule a fixed occurrence count.
    """
    reference_date = date(2000, 1, 1)
    # monthly, well outside the 2-week schedule window between occurrences
    rrule = make_monthly_rrule(reference_date)

    result = schedule_occurrences(
        rrule=rrule,
        schedule_window=timedelta(weeks=2),
        min_occurrences=2,
        last_scheduled_date=reference_date - timedelta(days=1),
        today=reference_date,
    )

    assert result == [reference_date, date(2000, 2, 1)]


def test_schedule_occurrences_short_rule_returns_fewer_than_minimum() -> None:
    """
    When the event's recurrence is about to end, we might schedule fewer than
    the minimum ahead-of-time scheduled occurrences.
    """
    reference_date = date(2000, 1, 1)
    rrule = make_every_nth_week_rrule(reference_date, n=1, end_date=reference_date)

    result = schedule_occurrences(
        rrule=rrule,
        schedule_window=timedelta(weeks=2),
        min_occurrences=2,
        last_scheduled_date=reference_date - timedelta(days=1),
        today=reference_date,
    )

    assert result == [reference_date]


def test_schedule_occurrences_filters_out_already_scheduled() -> None:
    """
    We should never schedule an occurrence on a date we previously scheduled.
    """

    reference_date = date(2000, 1, 1)
    rrule = make_every_nth_week_rrule(reference_date, n=1)

    # last_scheduled_date equal to an occurrence excludes it (strict >)
    result = schedule_occurrences(
        rrule=rrule,
        schedule_window=timedelta(weeks=2),
        min_occurrences=2,
        last_scheduled_date=reference_date,
        today=reference_date,
    )
    assert result == [date(2000, 1, 8), date(2000, 1, 15)]

    # everything already scheduled
    result = schedule_occurrences(
        rrule=rrule,
        schedule_window=timedelta(weeks=2),
        min_occurrences=2,
        last_scheduled_date=date(2000, 1, 15),
        today=reference_date,
    )
    assert result == []


def test_schedule_occurrences_defaults_last_scheduled_date_to_none() -> None:
    """
    When nothing has been scheduled yet, nothing should be filtered out.
    """
    reference_date = date(2000, 1, 1)
    rrule = make_every_nth_week_rrule(reference_date, n=1)

    result = schedule_occurrences(
        rrule=rrule,
        schedule_window=timedelta(weeks=2),
        min_occurrences=2,
        today=reference_date,
    )

    assert result == [reference_date, date(2000, 1, 8), date(2000, 1, 15)]


def test_schedule_occurrences_defaults_today_to_now(frozen_timewarp: FrozenTimewarp) -> None:
    reference_date = date(2000, 1, 1)
    frozen_timewarp.freeze_at(datetime(2000, 1, 1, tzinfo=UTC))

    rrule = make_every_nth_week_rrule(reference_date, n=1)
    result = schedule_occurrences(
        rrule=rrule,
        schedule_window=timedelta(weeks=2),
        min_occurrences=2,
        last_scheduled_date=reference_date - timedelta(days=1),
    )

    assert result[0] == reference_date
