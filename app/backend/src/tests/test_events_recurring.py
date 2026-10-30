"""
Integration tests for the job scheduling event recurrences.
"""

from datetime import UTC, date, datetime, time
from typing import cast

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import func, select, update

from couchers.context import CouchersContext
from couchers.db import session_scope
from couchers.jobs.handlers import schedule_event_occurrences
from couchers.models import User
from couchers.proto import events_pb2
from couchers.servicers.auth import create_session
from couchers.utils import to_aware_datetime
from tests.fixtures.api import events as events_api
from tests.fixtures.db import generate_user
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import _MockCouchersContext
from tests.fixtures.timewarp import FrozenTimewarp
from tests.test_communities import create_community


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


def test_recurring_event(db, frozen_timewarp: FrozenTimewarp):
    """
    A weekly recurring event should get scheduled progressively (2 occurrences at a time) until the ends_on date.
    """
    user, token = _create_user_in_community()

    # Set time to Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Create a recurring weekly event on Thursday, January 2, 2020, 12:00-13:30 UTC.
    initial_occurrence = events_api.create_event(
        token=token,
        start_date_time=(date(2020, 1, 2), time(12, 0)),
        end_date_time=(date(2020, 1, 2), time(13, 30)),
        recurrence=events_api.weekly_recurrence(interval=1, ends_on_date=date(2020, 1, 20)),
    )

    expected_recurrence = events_pb2.EventRecurrence(
        weekly=events_pb2.WeeklyEventRecurrence(
            day_of_week=events_pb2.DayOfWeek.DAY_OF_WEEK_THURSDAY,
            weekly_interval=1,
        ),
        ends_on_date="2020-01-20",
    )
    assert initial_occurrence.recurrence == expected_recurrence
    assert events_api.get_event(token=token, event_id=initial_occurrence.event_id).recurrence == expected_recurrence

    occurrences_before_scheduling = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
    ).events
    assert len(occurrences_before_scheduling) == 1, "No other occurrences should exist yet."
    assert occurrences_before_scheduling[0].event_id == initial_occurrence.event_id

    # Schedule recurring occurrences, expect a new occurrence on Thursday, January 9
    schedule_event_occurrences(empty_pb2.Empty())

    occurrences_after_scheduling = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
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

    occurrences_after_scheduling_redundantly = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
    ).events
    assert len(occurrences_after_scheduling_redundantly) == len(occurrences_after_scheduling)

    # Set time to Friday, January 3, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 3, tzinfo=UTC))

    # Test that new occurrences get scheduled now that the January 2 occurrence has gone by
    schedule_event_occurrences(empty_pb2.Empty())

    occurrences_after_january_3_scheduling = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
    ).events

    # January 2 has now ended and drops off the upcoming list, so this is January 9 and 16, not 3
    # occurrences.
    assert len(occurrences_after_january_3_scheduling) == 2
    assert to_aware_datetime(occurrences_after_january_3_scheduling[1].start_time) == datetime(
        2020, 1, 16, 12, 0, tzinfo=UTC
    )

    # Set time to Friday, January 10, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 10, tzinfo=UTC))

    # Test that no occurrence gets scheduled past the ends_on_date of January 20, 2020
    schedule_event_occurrences(empty_pb2.Empty())

    occurrences_after_january_10_scheduling = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
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

    # Set time to Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Create a recurring biweekly event on Thursday, January 2, 2020, 12:00-13:30 UTC.
    initial_occurrence = events_api.create_event(
        token=token,
        start_date_time=(date(2020, 1, 2), time(12, 0)),
        end_date_time=(date(2020, 1, 2), time(13, 30)),
        recurrence=events_api.weekly_recurrence(interval=2, ends_on_date=date(2020, 1, 20)),
    )

    schedule_event_occurrences(empty_pb2.Empty())

    scheduled_occurrences = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
    ).events
    assert len(scheduled_occurrences) == 2
    assert to_aware_datetime(scheduled_occurrences[0].start_time) == datetime(2020, 1, 2, 12, 0, tzinfo=UTC)
    assert to_aware_datetime(scheduled_occurrences[1].start_time) == datetime(
        2020, 1, 16, 12, 0, tzinfo=UTC
    )  # 2 weeks later


def test_no_rescheduling_after_edit_or_cancel(db, frozen_timewarp: FrozenTimewarp):
    """Editing or cancelling an already-spawned occurrence must not cause it to be rescheduled."""
    user, token = _create_user_in_community()

    # Set time to Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Create a recurring event on Fridays
    initial_occurrence = events_api.create_event(
        token=token,
        start_date_time=(date(2020, 1, 3), time(12, 0)),
        end_date_time=(date(2020, 1, 3), time(13, 0)),
        recurrence=events_api.weekly_recurrence(interval=1, ends_on_date=date(2020, 6, 30)),
    )

    schedule_event_occurrences(empty_pb2.Empty())

    initial_scheduled_occurrences = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
    ).events
    assert len(initial_scheduled_occurrences) == 2
    to_cancel, to_move = initial_scheduled_occurrences
    assert to_aware_datetime(to_cancel.start_time) == datetime(2020, 1, 3, 12, 0, tzinfo=UTC)
    assert to_aware_datetime(to_move.start_time) == datetime(2020, 1, 10, 12, 0, tzinfo=UTC)

    # Cancel the January 3 occurrence and move the January 10 one to January 9
    events_api.cancel_event(token=token, event_id=to_cancel.event_id)

    events_api.update_event(
        token=token,
        event_id=to_move.event_id,
        start_date_time=(date(2020, 1, 9), time(12, 0)),
        end_date_time=(date(2020, 1, 9), time(13, 0)),
    )

    # Ensure no other occurrence gets scheduled, even though the January 9 occurrence was moved to January 8,
    # so we're now recurring on Thursdays instead of Fridays, since the next two Thursdays (2 and 8) are earlier
    # than the last scheduled date (January 9).
    schedule_event_occurrences(empty_pb2.Empty())

    scheduled_occurrences_after_changes = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False, include_cancelled=True
    ).events
    assert len(scheduled_occurrences_after_changes) == 2
    assert to_aware_datetime(scheduled_occurrences_after_changes[0].start_time) == datetime(
        2020, 1, 3, 12, 0, tzinfo=UTC
    )
    assert to_aware_datetime(scheduled_occurrences_after_changes[1].start_time) == datetime(
        2020, 1, 9, 12, 0, tzinfo=UTC
    )


def test_new_occurrence_not_based_on_previous(db, frozen_timewarp: FrozenTimewarp):
    """The latest occurrence is the one that is used as a template for the next one."""
    user, token = _create_user_in_community()

    # Set time to Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Schedule on Thursdays
    initial_occurrence = events_api.create_event(
        token=token,
        content="Initial content",
        start_date_time=(date(2020, 1, 2), time(12, 0)),
        end_date_time=(date(2020, 1, 2), time(13, 0)),
        recurrence=events_api.weekly_recurrence(interval=1, ends_on_date=date(2020, 6, 30)),
    )

    # Change the original occurrence
    initial_occurrence = events_api.update_event(
        token=token, event_id=initial_occurrence.event_id, content="Updated content"
    )

    # New scheduled occurrences should not care
    schedule_event_occurrences(empty_pb2.Empty())

    second_occurrence = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
    ).events[-1]
    assert to_aware_datetime(second_occurrence.start_time) == datetime(2020, 1, 9, 12, 0, tzinfo=UTC)
    assert second_occurrence.content == "Initial content"


def test_no_scheduling_after_creator_banned(db, frozen_timewarp: FrozenTimewarp):
    """Occurrences should stop being scheduled once the event creator is banned."""
    user, token = _create_user_in_community()

    # Set time to Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Schedule on Thursdays
    initial_occurrence = events_api.create_event(
        token=token,
        start_date_time=(date(2020, 1, 2), time(12, 0)),
        end_date_time=(date(2020, 1, 2), time(13, 0)),
        recurrence=events_api.weekly_recurrence(interval=1, ends_on_date=date(2020, 6, 30)),
    )

    # Schedules January 9
    schedule_event_occurrences(empty_pb2.Empty())

    occurrences_before_ban = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
    ).events
    assert len(occurrences_before_ban) == 2

    with session_scope() as session:
        session.execute(update(User).where(User.id == user.id).values(banned_at=func.now()))

    # Set time to Friday, January 3, 2020, when January 16 would otherwise get scheduled
    frozen_timewarp.freeze_at(datetime(2020, 1, 3, tzinfo=UTC))

    schedule_event_occurrences(empty_pb2.Empty())

    # Unban so the creator can see their (shadowed) occurrences through the API again
    with session_scope() as session:
        session.execute(update(User).where(User.id == user.id).values(banned_at=None))

    occurrences_after_ban = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
    ).events

    # January 2 has ended and drops off the upcoming list, and January 16 was never scheduled.
    assert [to_aware_datetime(occurrence.start_time) for occurrence in occurrences_after_ban] == [
        datetime(2020, 1, 9, 12, 0, tzinfo=UTC)
    ]


def test_organizers_attend_scheduled_occurrences(db, frozen_timewarp: FrozenTimewarp):
    """Event organizers should be added as attendees of newly scheduled occurrences."""
    user, token = _create_user_in_community()
    co_organizer, _ = generate_user()

    # Set time to Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Schedule on Thursdays
    initial_occurrence = events_api.create_event(
        token=token,
        start_date_time=(date(2020, 1, 2), time(12, 0)),
        end_date_time=(date(2020, 1, 2), time(13, 0)),
        recurrence=events_api.weekly_recurrence(interval=1, ends_on_date=date(2020, 6, 30)),
    )

    events_api.invite_event_organizer(token=token, event_id=initial_occurrence.event_id, user_id=co_organizer.id)

    # Schedules January 9
    schedule_event_occurrences(empty_pb2.Empty())

    scheduled_occurrence = events_api.list_event_occurrences(
        token=token, event_id=initial_occurrence.event_id, past=False
    ).events[-1]
    assert to_aware_datetime(scheduled_occurrence.start_time) == datetime(2020, 1, 9, 12, 0, tzinfo=UTC)
    assert scheduled_occurrence.attendance_state == events_pb2.ATTENDANCE_STATE_GOING
    assert scheduled_occurrence.going_count == 2


def test_UpdateEvent_all_future_recurring(db, frozen_timewarp: FrozenTimewarp):
    user, token = generate_user()

    with session_scope() as session:
        create_community(session, 0, 2, "Community", [user], [], None)

    # Set time to Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Weekly on Thursdays
    initial_occurrence = events_api.create_event(
        token=token,
        content="Initial content",
        start_date_time=(date(2020, 1, 2), time(12, 0)),
        end_date_time=(date(2020, 1, 2), time(13, 0)),
        recurrence=events_api.weekly_recurrence(ends_on_date=date(2020, 6, 30)),
    )

    # Same timezone, since timezone changes are not supported when updating all future occurrences
    new_location = events_pb2.EventLocation(address="Further from Null Island", lat=0.3, lng=0.4)
    events_api.update_event(
        token=token,
        event_id=initial_occurrence.event_id,
        content="Updated content",
        location=new_location,
        update_all_future=True,
    )

    # Newly scheduled occurrences should be based on the updated template
    schedule_event_occurrences(empty_pb2.Empty())

    occurrences = events_api.list_event_occurrences(token=token, event_id=initial_occurrence.event_id).events
    assert len(occurrences) == 2
    assert to_aware_datetime(occurrences[1].start_time) == datetime(2020, 1, 9, 12, 0, tzinfo=UTC)
    for occurrence in occurrences:
        assert occurrence.content == "Updated content"
        assert occurrence.location == new_location


def test_UpdateEvent_stop_recurrence(db, frozen_timewarp: FrozenTimewarp, moderator: Moderator):
    creator_user, creator_token = generate_user()
    other_user, other_token = generate_user()

    with session_scope() as session:
        create_community(session, 0, 2, "Community", [creator_user], [other_user], None)

    # Set time to Wednesday, January 1, 2020
    frozen_timewarp.freeze_at(datetime(2020, 1, 1, tzinfo=UTC))

    # Weekly on Thursdays
    initial_occurrence = events_api.create_event(
        token=creator_token,
        start_date_time=(date(2020, 1, 2), time(12, 0)),
        end_date_time=(date(2020, 1, 2), time(13, 0)),
        recurrence=events_api.weekly_recurrence(ends_on_date=date(2020, 6, 30)),
        approve_by=moderator,
    )

    # Schedules January 9
    schedule_event_occurrences(empty_pb2.Empty())

    # Only organizers can stop the recurrence
    with pytest.raises(grpc.RpcError) as e:
        events_api.update_event(token=other_token, event_id=initial_occurrence.event_id, stop_recurrence=True)
    assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

    updated_occurrence = events_api.update_event(
        token=creator_token, event_id=initial_occurrence.event_id, stop_recurrence=True
    )
    assert not updated_occurrence.HasField("recurrence")

    # Set time to Friday, January 3, 2020, when January 16 would otherwise get scheduled
    frozen_timewarp.freeze_at(datetime(2020, 1, 3, tzinfo=UTC))
    schedule_event_occurrences(empty_pb2.Empty())

    # Already scheduled occurrences are kept, but no longer recur
    occurrences = [
        *events_api.list_event_occurrences(token=creator_token, event_id=initial_occurrence.event_id, past=True).events,
        *events_api.list_event_occurrences(token=creator_token, event_id=initial_occurrence.event_id).events,
    ]
    assert sorted(to_aware_datetime(occurrence.start_time) for occurrence in occurrences) == [
        datetime(2020, 1, 2, 12, 0, tzinfo=UTC),
        datetime(2020, 1, 9, 12, 0, tzinfo=UTC),
    ]
    assert not any(occurrence.HasField("recurrence") for occurrence in occurrences)

    # Stopping the recurrence of a non-recurring event is a no-op
    updated_occurrence = events_api.update_event(
        token=creator_token, event_id=initial_occurrence.event_id, stop_recurrence=True
    )
    assert not updated_occurrence.HasField("recurrence")
