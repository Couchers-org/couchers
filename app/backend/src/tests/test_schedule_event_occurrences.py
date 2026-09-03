"""
Integration tests for the job scheduling event recurrences.
"""

from datetime import UTC, date, datetime, timedelta
from typing import cast

import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy import select

from couchers.context import CouchersContext
from couchers.db import session_scope
from couchers.jobs.handlers import schedule_event_occurrences
from couchers.models import EventOccurrence, EventRecurrence, User
from couchers.proto import events_pb2
from couchers.servicers.auth import create_session
from couchers.utils import datetime_to_iso8601_local, to_aware_datetime
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import _MockCouchersContext, events_session
from tests.fixtures.timewarp import FrozenTimewarp
from tests.test_communities import create_community


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _create_user_in_community() -> tuple[User, str]:
    """
    CreateEvent needs a community node whose area covers the test location to resolve a timezone.

    Issues a long-lived session token rather than generate_user()'s default short-lived one: these
    tests jump the frozen clock forward by a week or more at a time, and a short-lived session
    expires after 168 hours of inactivity, which a jump that size blows straight through.
    """
    user, _ = generate_user()

    with session_scope() as session:
        create_community(session, 0, 2, "Community", [user], [], None)

        live_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        context = cast(CouchersContext, _MockCouchersContext())
        token, _ = create_session(context, session, live_user, True, set_cookie=False)

    return user, token


def _create_recurring_event(
    token: str,
    *,
    utc_start_time: datetime,
    duration: timedelta,
    rrule_interval: int,
    ends_on_utc_date: date,
) -> events_pb2.Event:
    """Creates a recurring event (not yet offered through API)."""
    with events_session(token) as api:
        create_res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content",
                # Null Island is in GMT/UTC
                location=events_pb2.EventLocation(address="Near Null Island", lat=0.1, lng=0.2),
                start_datetime_iso8601_local=datetime_to_iso8601_local(utc_start_time),
                end_datetime_iso8601_local=datetime_to_iso8601_local(utc_start_time + duration),
            )
        )

    # Make it recurring through DB manipulation.
    with session_scope() as session:
        occurrence: events_pb2.Event = session.execute(
            select(EventOccurrence).where(EventOccurrence.id == create_res.event_id)
        ).scalar_one()

        session.add(
            EventRecurrence(
                event_id=occurrence.event_id,
                rrule_interval=rrule_interval,
                last_scheduled_date=utc_start_time.date(),
                ends_on_date=ends_on_utc_date,
            )
        )

    return create_res


def test_progressive_scheduling_until_end_date(db, frozen_timewarp: FrozenTimewarp):
    """
    A weekly recurring event should get scheduled progressively (2 occurrences at a time) until the ends_on date.
    """
    user, token = _create_user_in_community()

    # 📅 Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Create a recurring weekly event on Thursday, January 2, 2020, 12:00-13:30 UTC.
    created_occurrence = _create_recurring_event(
        token,
        utc_start_time=datetime(2020, 1, 2, 12, 0, tzinfo=UTC),
        duration=timedelta(hours=1, minutes=30),
        rrule_interval=1,
        ends_on_utc_date=datetime(2020, 1, 20, tzinfo=UTC).date(),
    )

    with events_session(token) as api:
        occurrences_before_scheduling = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=created_occurrence.event_id, past=False)
        ).events

    assert len(occurrences_before_scheduling) == 1, "No other occurrences should exist yet."
    assert occurrences_before_scheduling[0].event_id == created_occurrence.event_id

    # Schedule recurring occurrences, expect a new occurrence on Thursday, January 9
    schedule_event_occurrences(empty_pb2.Empty())

    with events_session(token) as api:
        occurrences_after_scheduling = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=created_occurrence.event_id, past=False)
        ).events

    assert len(occurrences_after_scheduling) == 2
    assert occurrences_after_scheduling[0].event_id != occurrences_after_scheduling[1].event_id
    assert to_aware_datetime(occurrences_after_scheduling[0].start_time) == datetime(2020, 1, 2, 12, 0, tzinfo=UTC)
    assert to_aware_datetime(occurrences_after_scheduling[0].end_time) == datetime(2020, 1, 2, 13, 30, tzinfo=UTC)
    assert to_aware_datetime(occurrences_after_scheduling[1].start_time) == datetime(2020, 1, 9, 12, 0, tzinfo=UTC)
    assert to_aware_datetime(occurrences_after_scheduling[1].end_time) == datetime(2020, 1, 9, 13, 30, tzinfo=UTC)
    assert occurrences_after_scheduling[0].title == occurrences_after_scheduling[1].title
    assert occurrences_after_scheduling[0].content == occurrences_after_scheduling[1].content
    assert occurrences_after_scheduling[0].location.address == occurrences_after_scheduling[1].location.address
    assert occurrences_after_scheduling[0].location.lat == occurrences_after_scheduling[1].location.lat
    assert occurrences_after_scheduling[0].location.lng == occurrences_after_scheduling[1].location.lng
    assert occurrences_after_scheduling[0].timezone == occurrences_after_scheduling[1].timezone
    assert occurrences_after_scheduling[0].thread.thread_id != occurrences_after_scheduling[1].thread.thread_id

    # Schedule again, expect a no-op (idempotency)
    schedule_event_occurrences(empty_pb2.Empty())

    with events_session(token) as api:
        occurrences_after_scheduling_redundantly = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=created_occurrence.event_id, past=False)
        ).events

    assert len(occurrences_after_scheduling_redundantly) == len(occurrences_after_scheduling)

    # 📅 Friday, January 3, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 3, tzinfo=UTC))

    # Test that new occurrences get scheduled now that the January 2 occurrence has gone by
    schedule_event_occurrences(empty_pb2.Empty())

    with events_session(token) as api:
        occurrences_after_january_3_scheduling = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=created_occurrence.event_id, past=False)
        ).events

    # January 2 has now ended and drops off the upcoming list, so this is January 9 and 16, not 3
    # occurrences.
    assert len(occurrences_after_january_3_scheduling) == 2
    assert to_aware_datetime(occurrences_after_january_3_scheduling[1].start_time) == datetime(
        2020, 1, 16, 12, 0, tzinfo=UTC
    )

    # 📅 Friday, January 10, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 10, tzinfo=UTC))

    # Test that no occurrence gets scheduled past the ends_on_date of January 20, 2020
    schedule_event_occurrences(empty_pb2.Empty())

    with events_session(token) as api:
        occurrences_after_january_10_scheduling = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=created_occurrence.event_id, past=False)
        ).events

    # January 9 has now also ended; January 23 shouldn't be scheduled because it's past the
    # ends_on_date of January 20, so only January 16 remains upcoming.
    assert len(occurrences_after_january_10_scheduling) == 1
    assert to_aware_datetime(occurrences_after_january_10_scheduling[0].start_time) == datetime(
        2020, 1, 16, 12, 0, tzinfo=UTC
    )


def test_biweekly_frequency(db, frozen_timewarp: FrozenTimewarp):
    """Test biweekly event scheduling."""
    user, token = _create_user_in_community()

    # 📅 Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Create a recurring biweekly event on Thursday, January 2, 2020, 12:00-13:30 UTC.
    created_occurrence = _create_recurring_event(
        token,
        utc_start_time=datetime(2020, 1, 2, 12, 0, tzinfo=UTC),
        duration=timedelta(hours=1, minutes=30),
        rrule_interval=2,
        ends_on_utc_date=datetime(2020, 1, 20, tzinfo=UTC).date(),
    )

    schedule_event_occurrences(empty_pb2.Empty())

    with events_session(token) as api:
        scheduled_occurrences = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=created_occurrence.event_id, past=False)
        ).events

    assert len(scheduled_occurrences) == 2
    assert to_aware_datetime(scheduled_occurrences[0].start_time) == datetime(2020, 1, 2, 12, 0, tzinfo=UTC)
    assert to_aware_datetime(scheduled_occurrences[1].start_time) == datetime(
        2020, 1, 16, 12, 0, tzinfo=UTC
    )  # 2 weeks later


def test_no_rescheduling_after_edit_or_cancel(db, frozen_timewarp: FrozenTimewarp):
    """Editing or cancelling an already-spawned occurrence must not cause it to be rescheduled."""
    user, token = _create_user_in_community()

    # 📅 Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Create a recurring event on Fridays
    created_occurrence = _create_recurring_event(
        token,
        utc_start_time=datetime(2020, 1, 3, 12, 0, tzinfo=UTC),
        duration=timedelta(hours=1),
        rrule_interval=1,
        ends_on_utc_date=datetime(2020, 6, 30, tzinfo=UTC).date(),
    )

    schedule_event_occurrences(empty_pb2.Empty())

    with events_session(token) as api:
        initial_scheduled_occurrences = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=created_occurrence.event_id, past=False)
        ).events

    assert len(initial_scheduled_occurrences) == 2
    to_cancel, to_move = initial_scheduled_occurrences
    assert to_aware_datetime(to_cancel.start_time) == datetime(2020, 1, 3, 12, 0, tzinfo=UTC)
    assert to_aware_datetime(to_move.start_time) == datetime(2020, 1, 10, 12, 0, tzinfo=UTC)

    # Cancel the January 3 occurrence and move the January 10 one to January 9
    with events_session(token) as api:
        api.CancelEvent(events_pb2.CancelEventReq(event_id=to_cancel.event_id))

        api.UpdateEvent(
            events_pb2.UpdateEventReq(
                event_id=to_move.event_id,
                start_datetime_iso8601_local=wrappers_pb2.StringValue(
                    value=datetime_to_iso8601_local(datetime(2020, 1, 9, 12, 0, tzinfo=UTC))
                ),
                end_datetime_iso8601_local=wrappers_pb2.StringValue(
                    value=datetime_to_iso8601_local(datetime(2020, 1, 9, 13, 0, tzinfo=UTC))
                ),
            )
        )

    # Ensure no other occurrence gets scheduled, even though the January 9 occurrence was moved to January 8,
    # so we're now recurring on Thursdays instead of Fridays, since the next two Thursdays (2 and 8) are earlier
    # than the last scheduled date (January 9).
    schedule_event_occurrences(empty_pb2.Empty())

    with events_session(token) as api:
        scheduled_occurrences_after_changes = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=created_occurrence.event_id, past=False, include_cancelled=True)
        ).events

    assert len(scheduled_occurrences_after_changes) == 2
    assert to_aware_datetime(scheduled_occurrences_after_changes[0].start_time) == datetime(
        2020, 1, 3, 12, 0, tzinfo=UTC
    )
    assert to_aware_datetime(scheduled_occurrences_after_changes[1].start_time) == datetime(
        2020, 1, 9, 12, 0, tzinfo=UTC
    )


def test_new_occurrence_based_on_latest(db, frozen_timewarp: FrozenTimewarp):
    """The latest occurrence is the one that is used as a template for the next one."""
    user, token = _create_user_in_community()

    # 📅 Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Schedule on Thursdays
    created_occurrence = _create_recurring_event(
        token,
        utc_start_time=datetime(2020, 1, 2, 12, 0, tzinfo=UTC),
        duration=timedelta(hours=1),
        rrule_interval=1,
        ends_on_utc_date=datetime(2020, 6, 30, tzinfo=UTC).date(),
    )

    schedule_event_occurrences(empty_pb2.Empty())

    with events_session(token) as api:
        second_occurrence = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=created_occurrence.event_id, past=False)
        ).events[-1]
    assert to_aware_datetime(second_occurrence.start_time) == datetime(2020, 1, 9, 12, 0, tzinfo=UTC)

    with events_session(token) as api:
        second_occurrence = api.UpdateEvent(
            events_pb2.UpdateEventReq(
                event_id=second_occurrence.event_id,
                content=wrappers_pb2.StringValue(value="Updated content"),
            )
        )

    # 📅 Wednesday, January 8, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 8, tzinfo=UTC))

    # A new occurrence should be scheduled based on the updated second one.
    schedule_event_occurrences(empty_pb2.Empty())

    with events_session(token) as api:
        third_occurrence = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=created_occurrence.event_id, past=False)
        ).events[-1]

    assert to_aware_datetime(third_occurrence.start_time) == datetime(2020, 1, 16, 12, 0, tzinfo=UTC)
    assert third_occurrence.content == "Updated content"
