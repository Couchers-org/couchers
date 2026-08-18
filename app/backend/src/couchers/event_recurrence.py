"""
Pure logic for computing recurring event occurrence dates from an RRULE.

No database or session dependency.
"""

from collections.abc import Generator
from datetime import date, datetime, time, timedelta

from dateutil.rrule import DAILY, MONTHLY, WEEKLY, rrule, rrulestr

from couchers.utils import now


def make_every_nth_week_rrule(start_date: date, n: int, end_date: date | None = None) -> str:
    """Build an RRULE for recurring every nth week. Unbounded if no `end_date`."""
    until = datetime.combine(end_date, time.min) if end_date is not None else None
    return str(rrule(WEEKLY, dtstart=datetime.combine(start_date, time.min), interval=n, until=until))


def make_daily_rrule(start_date: date, end_date: date | None = None) -> str:
    """Build an RRULE for recurring daily. Unbounded if no `end_date`."""
    until = datetime.combine(end_date, time.min) if end_date is not None else None
    return str(rrule(DAILY, dtstart=datetime.combine(start_date, time.min), until=until))


def make_monthly_rrule(start_date: date, end_date: date | None = None) -> str:
    """Build an RRULE for recurring monthly. Unbounded if no `end_date`."""
    until = datetime.combine(end_date, time.min) if end_date is not None else None
    return str(rrule(MONTHLY, dtstart=datetime.combine(start_date, time.min), until=until))


def get_future_occurrences(from_date: date, rrule: str) -> Generator[date]:
    """
    Yields the date of each future occurrence of an RRULE, starting on or after `from_date`.
    This may be unbounded depending on the RRULE.
    """
    rule = rrulestr(rrule)
    from_datetime = datetime.combine(from_date, time.min)
    for occurrence in rule.xafter(from_datetime, inc=True):
        yield occurrence.date()


def schedule_occurrences(
    *,
    rrule: str,
    schedule_window: timedelta,
    min_occurrences: int,
    last_scheduled_date: date | None = None,
    today: date | None = None,
) -> list[date]:
    """
    Determine which occurrence dates should be scheduled right now.

    Takes every future occurrence within `schedule_window` of `today`, or at least
    `min_occurrences` occurrences if fewer fall in that window, then drops any on or before
    `last_scheduled_date` (already scheduled). If `last_scheduled_date` is None, nothing has
    been scheduled yet, so nothing is dropped.
    """
    today = today if today is not None else now().date()
    window_end = today + schedule_window

    occurrences: list[date] = []
    for occurrence_date in get_future_occurrences(today, rrule):
        if len(occurrences) >= min_occurrences and occurrence_date > window_end:
            break
        occurrences.append(occurrence_date)

    if last_scheduled_date is None:
        return occurrences
    return [occurrence_date for occurrence_date in occurrences if occurrence_date > last_scheduled_date]
