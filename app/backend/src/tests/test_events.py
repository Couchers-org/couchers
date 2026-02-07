from datetime import timedelta

import grpc
import pytest
from google.protobuf import wrappers_pb2
from psycopg2.extras import DateTimeTZRange
from sqlalchemy import select
from sqlalchemy.sql.expression import update

from couchers.db import session_scope
from couchers.models import BackgroundJob, EventOccurrence, Upload
from couchers.proto import editor_pb2, events_pb2, threads_pb2
from couchers.tasks import enforce_community_memberships
from couchers.utils import Timestamp_from_datetime, now, to_aware_datetime
from tests.fixtures.db import generate_user
from tests.fixtures.misc import Moderator, PushCollector, email_fields, mock_notification_email, process_jobs
from tests.fixtures.sessions import events_session, real_editor_session, threads_session
from tests.test_communities import create_community, create_group


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_CreateEvent(db, push_collector: PushCollector, moderator: Moderator):
    # test cases:
    # can create event
    # cannot create event with missing details
    # can create online event
    # can create in person event
    # can't create event that starts in the past
    # can create in different timezones

    # event creator
    user1, token1 = generate_user()
    # community moderator
    user2, token2 = generate_user()
    # third party
    user3, token3 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user2], [], None).id

    time_before = now()
    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token1) as api:
        # in person event
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                photo_key=None,
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.lat == 0.1
        assert res.offline_information.lng == 0.2
        assert res.offline_information.address == "Near Null Island"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_GOING
        assert res.organizer
        assert res.subscriber
        assert res.going_count == 1
        assert res.maybe_count == 0
        assert res.organizer_count == 1
        assert res.subscriber_count == 1
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert not res.can_moderate

        event_id = res.event_id

    # Approve the event so other users can see it
    moderator.approve_event_by_occurrence(event_id)

    with events_session(token2) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.lat == 0.1
        assert res.offline_information.lng == 0.2
        assert res.offline_information.address == "Near Null Island"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING
        assert not res.organizer
        assert not res.subscriber
        assert res.going_count == 1
        assert res.maybe_count == 0
        assert res.organizer_count == 1
        assert res.subscriber_count == 1
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert res.can_moderate

    with events_session(token3) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.lat == 0.1
        assert res.offline_information.lng == 0.2
        assert res.offline_information.address == "Near Null Island"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING
        assert not res.organizer
        assert not res.subscriber
        assert res.going_count == 1
        assert res.maybe_count == 0
        assert res.organizer_count == 1
        assert res.subscriber_count == 1
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert not res.can_edit
        assert not res.can_moderate

    with events_session(token1) as api:
        # online only event
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                photo_key=None,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                parent_community_id=c_id,
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "online_information"
        assert res.online_information.link == "https://couchers.org/meet/"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_GOING
        assert res.organizer
        assert res.subscriber
        assert res.going_count == 1
        assert res.maybe_count == 0
        assert res.organizer_count == 1
        assert res.subscriber_count == 1
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert not res.can_moderate

        event_id = res.event_id

    # Approve the online event so other users can see it
    moderator.approve_event_by_occurrence(event_id)

    with events_session(token2) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "online_information"
        assert res.online_information.link == "https://couchers.org/meet/"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING
        assert not res.organizer
        assert not res.subscriber
        assert res.going_count == 1
        assert res.maybe_count == 0
        assert res.organizer_count == 1
        assert res.subscriber_count == 1
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert res.can_moderate

    with events_session(token3) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "online_information"
        assert res.online_information.link == "https://couchers.org/meet/"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING
        assert not res.organizer
        assert not res.subscriber
        assert res.going_count == 1
        assert res.maybe_count == 0
        assert res.organizer_count == 1
        assert res.subscriber_count == 1
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert not res.can_edit
        assert not res.can_moderate

    with events_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    content="Dummy content.",
                    photo_key=None,
                    online_information=events_pb2.OnlineEventInformation(
                        link="https://couchers.org/meet/",
                    ),
                    start_time=Timestamp_from_datetime(start_time),
                    end_time=Timestamp_from_datetime(end_time),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The online event is missing a parent community."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    # title="Dummy Title",
                    content="Dummy content.",
                    photo_key=None,
                    offline_information=events_pb2.OfflineEventInformation(
                        address="Near Null Island",
                        lat=0.1,
                        lng=0.1,
                    ),
                    start_time=Timestamp_from_datetime(start_time),
                    end_time=Timestamp_from_datetime(end_time),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Missing event title."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    # content="Dummy content.",
                    photo_key=None,
                    offline_information=events_pb2.OfflineEventInformation(
                        address="Near Null Island",
                        lat=0.1,
                        lng=0.1,
                    ),
                    start_time=Timestamp_from_datetime(start_time),
                    end_time=Timestamp_from_datetime(end_time),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Missing event content."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    content="Dummy content.",
                    photo_key="nonexistent",
                    offline_information=events_pb2.OfflineEventInformation(
                        address="Near Null Island",
                        lat=0.1,
                        lng=0.1,
                    ),
                    start_time=Timestamp_from_datetime(start_time),
                    end_time=Timestamp_from_datetime(end_time),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Photo not found."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    content="Dummy content.",
                    photo_key=None,
                    offline_information=events_pb2.OfflineEventInformation(
                        address="Near Null Island",
                    ),
                    start_time=Timestamp_from_datetime(start_time),
                    end_time=Timestamp_from_datetime(end_time),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Missing event address or location."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    content="Dummy content.",
                    photo_key=None,
                    offline_information=events_pb2.OfflineEventInformation(
                        lat=0.1,
                        lng=0.1,
                    ),
                    start_time=Timestamp_from_datetime(start_time),
                    end_time=Timestamp_from_datetime(end_time),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Missing event address or location."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    content="Dummy content.",
                    photo_key=None,
                    online_information=events_pb2.OnlineEventInformation(),
                    start_time=Timestamp_from_datetime(start_time),
                    end_time=Timestamp_from_datetime(end_time),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "An online-only event requires a link."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    content="Dummy content.",
                    parent_community_id=c_id,
                    online_information=events_pb2.OnlineEventInformation(
                        link="https://couchers.org/meet/",
                    ),
                    start_time=Timestamp_from_datetime(now() - timedelta(hours=2)),
                    end_time=Timestamp_from_datetime(end_time),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The event must be in the future."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    content="Dummy content.",
                    parent_community_id=c_id,
                    online_information=events_pb2.OnlineEventInformation(
                        link="https://couchers.org/meet/",
                    ),
                    start_time=Timestamp_from_datetime(end_time),
                    end_time=Timestamp_from_datetime(start_time),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The event must end after it starts."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    content="Dummy content.",
                    parent_community_id=c_id,
                    online_information=events_pb2.OnlineEventInformation(
                        link="https://couchers.org/meet/",
                    ),
                    start_time=Timestamp_from_datetime(now() + timedelta(days=500, hours=2)),
                    end_time=Timestamp_from_datetime(now() + timedelta(days=500, hours=5)),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The event needs to start within the next year."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    content="Dummy content.",
                    parent_community_id=c_id,
                    online_information=events_pb2.OnlineEventInformation(
                        link="https://couchers.org/meet/",
                    ),
                    start_time=Timestamp_from_datetime(start_time),
                    end_time=Timestamp_from_datetime(now() + timedelta(days=100)),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Events cannot last longer than 7 days."


def test_CreateEvent_incomplete_profile(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, token2 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user2], [], None).id

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateEvent(
                events_pb2.CreateEventReq(
                    title="Dummy Title",
                    content="Dummy content.",
                    photo_key=None,
                    offline_information=events_pb2.OfflineEventInformation(
                        address="Near Null Island",
                        lat=0.1,
                        lng=0.2,
                    ),
                    start_time=Timestamp_from_datetime(start_time),
                    end_time=Timestamp_from_datetime(end_time),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You have to complete your profile before you can create an event."


def test_ScheduleEvent(db):
    # test cases:
    # can schedule a new event occurrence

    user, token = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user], [], None).id

    time_before = now()
    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                parent_community_id=c_id,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )

        new_start_time = now() + timedelta(hours=6)
        new_end_time = new_start_time + timedelta(hours=2)

        res = api.ScheduleEvent(
            events_pb2.ScheduleEventReq(
                event_id=res.event_id,
                content="New event occurrence",
                offline_information=events_pb2.OfflineEventInformation(
                    address="A bit further but still near Null Island",
                    lat=0.3,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(new_start_time),
                end_time=Timestamp_from_datetime(new_end_time),
                timezone="UTC",
            )
        )

        res = api.GetEvent(events_pb2.GetEventReq(event_id=res.event_id))

        assert not res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "New event occurrence"
        assert not res.photo_url
        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.lat == 0.3
        assert res.offline_information.lng == 0.2
        assert res.offline_information.address == "A bit further but still near Null Island"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user.id
        assert to_aware_datetime(res.start_time) == new_start_time
        assert to_aware_datetime(res.end_time) == new_end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_GOING
        assert res.organizer
        assert res.subscriber
        assert res.going_count == 1
        assert res.maybe_count == 0
        assert res.organizer_count == 1
        assert res.subscriber_count == 1
        assert res.owner_user_id == user.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert res.can_moderate


def test_cannot_overlap_occurrences_schedule(db):
    user, token = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user], [], None).id

    start = now()

    with events_session(token) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                parent_community_id=c_id,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=1)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=3)),
                timezone="UTC",
            )
        )

        with pytest.raises(grpc.RpcError) as e:
            api.ScheduleEvent(
                events_pb2.ScheduleEventReq(
                    event_id=res.event_id,
                    content="New event occurrence",
                    offline_information=events_pb2.OfflineEventInformation(
                        address="A bit further but still near Null Island",
                        lat=0.3,
                        lng=0.2,
                    ),
                    start_time=Timestamp_from_datetime(start + timedelta(hours=2)),
                    end_time=Timestamp_from_datetime(start + timedelta(hours=6)),
                    timezone="UTC",
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "An event cannot have overlapping occurrences."


def test_cannot_overlap_occurrences_update(db):
    user, token = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user], [], None).id

    start = now()

    with events_session(token) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                parent_community_id=c_id,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=1)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=3)),
                timezone="UTC",
            )
        )

        event_id = api.ScheduleEvent(
            events_pb2.ScheduleEventReq(
                event_id=res.event_id,
                content="New event occurrence",
                offline_information=events_pb2.OfflineEventInformation(
                    address="A bit further but still near Null Island",
                    lat=0.3,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=4)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=6)),
                timezone="UTC",
            )
        ).event_id

        # can overlap with this current existing occurrence
        api.UpdateEvent(
            events_pb2.UpdateEventReq(
                event_id=event_id,
                start_time=Timestamp_from_datetime(start + timedelta(hours=5)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=6)),
            )
        )

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateEvent(
                events_pb2.UpdateEventReq(
                    event_id=event_id,
                    start_time=Timestamp_from_datetime(start + timedelta(hours=2)),
                    end_time=Timestamp_from_datetime(start + timedelta(hours=4)),
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "An event cannot have overlapping occurrences."


def test_UpdateEvent_single(db, moderator: Moderator):
    # test cases:
    # owner can update
    # community owner can update
    # can't mess up online/in person dichotomy
    # notifies attendees

    # event creator
    user1, token1 = generate_user()
    # community moderator
    user2, token2 = generate_user()
    # third parties
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user2], [], None).id

    time_before = now()
    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token1) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )

        event_id = res.event_id

    moderator.approve_event_by_occurrence(event_id)

    with events_session(token4) as api:
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))

    with events_session(token5) as api:
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_GOING)
        )

    with events_session(token6) as api:
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_MAYBE)
        )

    time_before_update = now()

    with events_session(token1) as api:
        res = api.UpdateEvent(
            events_pb2.UpdateEventReq(
                event_id=event_id,
            )
        )

    with events_session(token1) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.lat == 0.1
        assert res.offline_information.lng == 0.2
        assert res.offline_information.address == "Near Null Island"
        assert time_before <= to_aware_datetime(res.created) <= time_before_update
        assert time_before_update <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_GOING
        assert res.organizer
        assert res.subscriber
        assert res.going_count == 2
        assert res.maybe_count == 1
        assert res.organizer_count == 1
        assert res.subscriber_count == 3
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert not res.can_moderate

    with events_session(token2) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.lat == 0.1
        assert res.offline_information.lng == 0.2
        assert res.offline_information.address == "Near Null Island"
        assert time_before <= to_aware_datetime(res.created) <= time_before_update
        assert time_before_update <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING
        assert not res.organizer
        assert not res.subscriber
        assert res.going_count == 2
        assert res.maybe_count == 1
        assert res.organizer_count == 1
        assert res.subscriber_count == 3
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert res.can_moderate

    with events_session(token3) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.lat == 0.1
        assert res.offline_information.lng == 0.2
        assert res.offline_information.address == "Near Null Island"
        assert time_before <= to_aware_datetime(res.created) <= time_before_update
        assert time_before_update <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING
        assert not res.organizer
        assert not res.subscriber
        assert res.going_count == 2
        assert res.maybe_count == 1
        assert res.organizer_count == 1
        assert res.subscriber_count == 3
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert not res.can_edit
        assert not res.can_moderate

    with events_session(token1) as api:
        res = api.UpdateEvent(
            events_pb2.UpdateEventReq(
                event_id=event_id,
                title=wrappers_pb2.StringValue(value="Dummy Title"),
                content=wrappers_pb2.StringValue(value="Dummy content."),
                online_information=events_pb2.OnlineEventInformation(link="https://couchers.org/meet/"),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone=wrappers_pb2.StringValue(value="UTC"),
            )
        )

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "online_information"
        assert res.online_information.link == "https://couchers.org/meet/"
        assert time_before <= to_aware_datetime(res.created) <= time_before_update
        assert time_before_update <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_GOING
        assert res.organizer
        assert res.subscriber
        assert res.going_count == 2
        assert res.maybe_count == 1
        assert res.organizer_count == 1
        assert res.subscriber_count == 3
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert not res.can_moderate

        event_id = res.event_id

    with events_session(token2) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "online_information"
        assert res.online_information.link == "https://couchers.org/meet/"
        assert time_before <= to_aware_datetime(res.created) <= time_before_update
        assert time_before_update <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING
        assert not res.organizer
        assert not res.subscriber
        assert res.going_count == 2
        assert res.maybe_count == 1
        assert res.organizer_count == 1
        assert res.subscriber_count == 3
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert res.can_moderate

    with events_session(token3) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "online_information"
        assert res.online_information.link == "https://couchers.org/meet/"
        assert time_before <= to_aware_datetime(res.created) <= time_before_update
        assert time_before_update <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING
        assert not res.organizer
        assert not res.subscriber
        assert res.going_count == 2
        assert res.maybe_count == 1
        assert res.organizer_count == 1
        assert res.subscriber_count == 3
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert not res.can_edit
        assert not res.can_moderate

    with events_session(token1) as api:
        res = api.UpdateEvent(
            events_pb2.UpdateEventReq(
                event_id=event_id,
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
            )
        )

    with events_session(token3) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.address == "Near Null Island"
        assert res.offline_information.lat == 0.1
        assert res.offline_information.lng == 0.2


def test_UpdateEvent_all(db, moderator: Moderator):
    # event creator
    user1, token1 = generate_user()
    # community moderator
    user2, token2 = generate_user()
    # third parties
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user2], [], None).id

    time_before = now()
    start_time = now() + timedelta(hours=1)
    end_time = start_time + timedelta(hours=1.5)

    event_ids = []

    with events_session(token1) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="0th occurrence",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )

        event_id = res.event_id
        event_ids.append(event_id)

    moderator.approve_event_by_occurrence(event_id)

    with events_session(token4) as api:
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))

    with events_session(token5) as api:
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_GOING)
        )

    with events_session(token6) as api:
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_MAYBE)
        )

    with events_session(token1) as api:
        for i in range(5):
            res = api.ScheduleEvent(
                events_pb2.ScheduleEventReq(
                    event_id=event_ids[-1],
                    content=f"{i + 1}th occurrence",
                    online_information=events_pb2.OnlineEventInformation(
                        link="https://couchers.org/meet/",
                    ),
                    start_time=Timestamp_from_datetime(start_time + timedelta(hours=2 + i)),
                    end_time=Timestamp_from_datetime(start_time + timedelta(hours=2.5 + i)),
                    timezone="UTC",
                )
            )

            event_ids.append(res.event_id)

    updated_event_id = event_ids[3]

    time_before_update = now()

    with events_session(token1) as api:
        res = api.UpdateEvent(
            events_pb2.UpdateEventReq(
                event_id=updated_event_id,
                title=wrappers_pb2.StringValue(value="New Title"),
                content=wrappers_pb2.StringValue(value="New content."),
                online_information=events_pb2.OnlineEventInformation(link="https://couchers.org/meet/"),
                update_all_future=True,
            )
        )

    time_after_update = now()

    with events_session(token2) as api:
        for i in range(3):
            res = api.GetEvent(events_pb2.GetEventReq(event_id=event_ids[i]))
            assert res.content == f"{i}th occurrence"
            assert time_before <= to_aware_datetime(res.last_edited) <= time_before_update

        for i in range(3, 6):
            res = api.GetEvent(events_pb2.GetEventReq(event_id=event_ids[i]))
            assert res.content == "New content."
            assert time_before_update <= to_aware_datetime(res.last_edited) <= time_after_update


def test_GetEvent(db, moderator: Moderator):
    # event creator
    user1, token1 = generate_user()
    # community moderator
    user2, token2 = generate_user()
    # third parties
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user2], [], None).id

    time_before = now()
    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token1) as api:
        # in person event
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )

        event_id = res.event_id

    moderator.approve_event_by_occurrence(event_id)

    with events_session(token4) as api:
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))

    with events_session(token5) as api:
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_GOING)
        )

    with events_session(token6) as api:
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_MAYBE)
        )

    with events_session(token1) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.lat == 0.1
        assert res.offline_information.lng == 0.2
        assert res.offline_information.address == "Near Null Island"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_GOING
        assert res.organizer
        assert res.subscriber
        assert res.going_count == 2
        assert res.maybe_count == 1
        assert res.organizer_count == 1
        assert res.subscriber_count == 3
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert not res.can_moderate

    with events_session(token2) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.lat == 0.1
        assert res.offline_information.lng == 0.2
        assert res.offline_information.address == "Near Null Island"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING
        assert not res.organizer
        assert not res.subscriber
        assert res.going_count == 2
        assert res.maybe_count == 1
        assert res.organizer_count == 1
        assert res.subscriber_count == 3
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert res.can_edit
        assert res.can_moderate

    with events_session(token3) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))

        assert res.is_next
        assert res.title == "Dummy Title"
        assert res.slug == "dummy-title"
        assert res.content == "Dummy content."
        assert not res.photo_url
        assert res.WhichOneof("mode") == "offline_information"
        assert res.offline_information.lat == 0.1
        assert res.offline_information.lng == 0.2
        assert res.offline_information.address == "Near Null Island"
        assert time_before <= to_aware_datetime(res.created) <= now()
        assert time_before <= to_aware_datetime(res.last_edited) <= now()
        assert res.creator_user_id == user1.id
        assert to_aware_datetime(res.start_time) == start_time
        assert to_aware_datetime(res.end_time) == end_time
        # assert res.timezone == "UTC"
        assert res.start_time_display
        assert res.end_time_display
        assert res.attendance_state == events_pb2.ATTENDANCE_STATE_NOT_GOING
        assert not res.organizer
        assert not res.subscriber
        assert res.going_count == 2
        assert res.maybe_count == 1
        assert res.organizer_count == 1
        assert res.subscriber_count == 3
        assert res.owner_user_id == user1.id
        assert not res.owner_community_id
        assert not res.owner_group_id
        assert res.thread.thread_id
        assert not res.can_edit
        assert not res.can_moderate


def test_CancelEvent(db):
    # event creator
    user1, token1 = generate_user()
    # community moderator
    user2, token2 = generate_user()
    # third parties
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user2], [], None).id

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token1) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )

        event_id = res.event_id

    with events_session(token4) as api:
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))

    with events_session(token5) as api:
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_GOING)
        )

    with events_session(token6) as api:
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_MAYBE)
        )

    with events_session(token1) as api:
        res = api.CancelEvent(
            events_pb2.CancelEventReq(
                event_id=event_id,
            )
        )

    with events_session(token1) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        assert res.is_cancelled

    with events_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateEvent(
                events_pb2.UpdateEventReq(
                    event_id=event_id,
                    title=wrappers_pb2.StringValue(value="New Title"),
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You can't modify, subscribe to, or attend to an event that's been cancelled."

        with pytest.raises(grpc.RpcError) as e:
            api.InviteEventOrganizer(
                events_pb2.InviteEventOrganizerReq(
                    event_id=event_id,
                    user_id=user3.id,
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You can't modify, subscribe to, or attend to an event that's been cancelled."

        with pytest.raises(grpc.RpcError) as e:
            api.TransferEvent(events_pb2.TransferEventReq(event_id=event_id, new_owner_community_id=c_id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You can't modify, subscribe to, or attend to an event that's been cancelled."

    with events_session(token3) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You can't modify, subscribe to, or attend to an event that's been cancelled."

        with pytest.raises(grpc.RpcError) as e:
            api.SetEventAttendance(
                events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_GOING)
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You can't modify, subscribe to, or attend to an event that's been cancelled."

    with events_session(token1) as api:
        for include_cancelled in [True, False]:
            res = api.ListEventOccurrences(
                events_pb2.ListEventOccurrencesReq(
                    event_id=event_id,
                    include_cancelled=include_cancelled,
                )
            )
            if include_cancelled:
                assert len(res.events) > 0
            else:
                assert len(res.events) == 0

            res = api.ListMyEvents(
                events_pb2.ListMyEventsReq(
                    include_cancelled=include_cancelled,
                )
            )
            if include_cancelled:
                assert len(res.events) > 0
            else:
                assert len(res.events) == 0


def test_ListEventAttendees(db, moderator: Moderator):
    # event creator
    user1, token1 = generate_user()
    # others
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user1], [], None).id

    with events_session(token1) as api:
        event_id = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        ).event_id

    moderator.approve_event_by_occurrence(event_id)

    for token in [token2, token3, token4, token5]:
        with events_session(token) as api:
            api.SetEventAttendance(
                events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_GOING)
            )

    with events_session(token6) as api:
        assert api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).going_count == 5

        res = api.ListEventAttendees(events_pb2.ListEventAttendeesReq(event_id=event_id, page_size=2))
        assert res.attendee_user_ids == [user1.id, user2.id]

        res = api.ListEventAttendees(
            events_pb2.ListEventAttendeesReq(event_id=event_id, page_size=2, page_token=res.next_page_token)
        )
        assert res.attendee_user_ids == [user3.id, user4.id]

        res = api.ListEventAttendees(
            events_pb2.ListEventAttendeesReq(event_id=event_id, page_size=2, page_token=res.next_page_token)
        )
        assert res.attendee_user_ids == [user5.id]
        assert not res.next_page_token


def test_ListEventSubscribers(db, moderator: Moderator):
    # event creator
    user1, token1 = generate_user()
    # others
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user1], [], None).id

    with events_session(token1) as api:
        event_id = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        ).event_id

    moderator.approve_event_by_occurrence(event_id)

    for token in [token2, token3, token4, token5]:
        with events_session(token) as api:
            api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))

    with events_session(token6) as api:
        assert api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).subscriber_count == 5

        res = api.ListEventSubscribers(events_pb2.ListEventSubscribersReq(event_id=event_id, page_size=2))
        assert res.subscriber_user_ids == [user1.id, user2.id]

        res = api.ListEventSubscribers(
            events_pb2.ListEventSubscribersReq(event_id=event_id, page_size=2, page_token=res.next_page_token)
        )
        assert res.subscriber_user_ids == [user3.id, user4.id]

        res = api.ListEventSubscribers(
            events_pb2.ListEventSubscribersReq(event_id=event_id, page_size=2, page_token=res.next_page_token)
        )
        assert res.subscriber_user_ids == [user5.id]
        assert not res.next_page_token


def test_ListEventOrganizers(db, moderator: Moderator):
    # event creator
    user1, token1 = generate_user()
    # others
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user1], [], None).id

    with events_session(token1) as api:
        event_id = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        ).event_id

    moderator.approve_event_by_occurrence(event_id)

    with events_session(token1) as api:
        for user_id in [user2.id, user3.id, user4.id, user5.id]:
            api.InviteEventOrganizer(events_pb2.InviteEventOrganizerReq(event_id=event_id, user_id=user_id))

    with events_session(token6) as api:
        assert api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).organizer_count == 5

        res = api.ListEventOrganizers(events_pb2.ListEventOrganizersReq(event_id=event_id, page_size=2))
        assert res.organizer_user_ids == [user1.id, user2.id]

        res = api.ListEventOrganizers(
            events_pb2.ListEventOrganizersReq(event_id=event_id, page_size=2, page_token=res.next_page_token)
        )
        assert res.organizer_user_ids == [user3.id, user4.id]

        res = api.ListEventOrganizers(
            events_pb2.ListEventOrganizersReq(event_id=event_id, page_size=2, page_token=res.next_page_token)
        )
        assert res.organizer_user_ids == [user5.id]
        assert not res.next_page_token


def test_TransferEvent(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    with session_scope() as session:
        c = create_community(session, 0, 2, "Community", [user3], [], None)
        h = create_group(session, "Group", [user4], [], c)
        c_id = c.id
        h_id = h.id

    with events_session(token1) as api:
        event_id = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        ).event_id

        api.TransferEvent(
            events_pb2.TransferEventReq(
                event_id=event_id,
                new_owner_community_id=c_id,
            )
        )

        # remove ourselves as organizer, otherwise we can still edit it
        api.RemoveEventOrganizer(events_pb2.RemoveEventOrganizerReq(event_id=event_id))

        with pytest.raises(grpc.RpcError) as e:
            api.TransferEvent(
                events_pb2.TransferEventReq(
                    event_id=event_id,
                    new_owner_group_id=h_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You're not allowed to transfer that event."

        event_id = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        ).event_id

        api.TransferEvent(
            events_pb2.TransferEventReq(
                event_id=event_id,
                new_owner_group_id=h_id,
            )
        )

        # remove ourselves as organizer, otherwise we can still edit it
        api.RemoveEventOrganizer(events_pb2.RemoveEventOrganizerReq(event_id=event_id))

        with pytest.raises(grpc.RpcError) as e:
            api.TransferEvent(
                events_pb2.TransferEventReq(
                    event_id=event_id,
                    new_owner_community_id=c_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You're not allowed to transfer that event."


def test_SetEventSubscription(db, moderator: Moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user1], [], None).id

    with events_session(token1) as api:
        event_id = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        ).event_id

    moderator.approve_event_by_occurrence(event_id)

    with events_session(token2) as api:
        assert not api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).subscriber
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=True))
        assert api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).subscriber
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=event_id, subscribe=False))
        assert not api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).subscriber


def test_SetEventAttendance(db, moderator: Moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user1], [], None).id

    with events_session(token1) as api:
        event_id = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        ).event_id

    moderator.approve_event_by_occurrence(event_id)

    with events_session(token2) as api:
        assert (
            api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).attendance_state
            == events_pb2.ATTENDANCE_STATE_NOT_GOING
        )
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_GOING)
        )
        assert (
            api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).attendance_state
            == events_pb2.ATTENDANCE_STATE_GOING
        )
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_MAYBE)
        )
        assert (
            api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).attendance_state
            == events_pb2.ATTENDANCE_STATE_MAYBE
        )
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_NOT_GOING)
        )
        assert (
            api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).attendance_state
            == events_pb2.ATTENDANCE_STATE_NOT_GOING
        )


def test_InviteEventOrganizer(db, moderator: Moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user1], [], None).id

    with events_session(token1) as api:
        event_id = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        ).event_id

    moderator.approve_event_by_occurrence(event_id)

    with events_session(token2) as api:
        assert not api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).organizer

        with pytest.raises(grpc.RpcError) as e:
            api.InviteEventOrganizer(events_pb2.InviteEventOrganizerReq(event_id=event_id, user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You're not allowed to edit that event."

        assert not api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).organizer

    with events_session(token1) as api:
        api.InviteEventOrganizer(events_pb2.InviteEventOrganizerReq(event_id=event_id, user_id=user2.id))

    with events_session(token2) as api:
        assert api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).organizer


def test_ListEventOccurrences(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user2], [], None).id

    start = now()

    event_ids = []

    with events_session(token1) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="First occurrence",
                content="Dummy content.",
                parent_community_id=c_id,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=1)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=1.5)),
                timezone="UTC",
            )
        )

        event_ids.append(res.event_id)

        for i in range(5):
            res = api.ScheduleEvent(
                events_pb2.ScheduleEventReq(
                    event_id=event_ids[-1],
                    content=f"{i}th occurrence",
                    online_information=events_pb2.OnlineEventInformation(
                        link="https://couchers.org/meet/",
                    ),
                    start_time=Timestamp_from_datetime(start + timedelta(hours=2 + i)),
                    end_time=Timestamp_from_datetime(start + timedelta(hours=2.5 + i)),
                    timezone="UTC",
                )
            )

            event_ids.append(res.event_id)

        res = api.ListEventOccurrences(events_pb2.ListEventOccurrencesReq(event_id=event_ids[-1], page_size=2))
        assert [event.event_id for event in res.events] == event_ids[:2]

        res = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=event_ids[-1], page_size=2, page_token=res.next_page_token)
        )
        assert [event.event_id for event in res.events] == event_ids[2:4]

        res = api.ListEventOccurrences(
            events_pb2.ListEventOccurrencesReq(event_id=event_ids[-1], page_size=2, page_token=res.next_page_token)
        )
        assert [event.event_id for event in res.events] == event_ids[4:6]
        assert not res.next_page_token


def test_ListMyEvents(db, moderator: Moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()

    with session_scope() as session:
        # Create global community first (node_id=1), then a child community (node_id=2)
        # This allows testing my_communities_exclude_global
        global_community = create_community(session, 0, 100, "Global", [user3], [], None)
        c_id = global_community.id
        child_community = create_community(session, 0, 50, "Child Community", [user3, user4], [], global_community)
        c2_id = child_community.id

    start = now()

    def new_event(hours_from_now: int, community_id: int, online: bool = True) -> events_pb2.CreateEventReq:
        if online:
            return events_pb2.CreateEventReq(
                title="Dummy Online Title",
                content="Dummy content.",
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                parent_community_id=community_id,
                timezone="UTC",
                start_time=Timestamp_from_datetime(start + timedelta(hours=hours_from_now)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=hours_from_now + 0.5)),
            )
        else:
            return events_pb2.CreateEventReq(
                title="Dummy Offline Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                parent_community_id=community_id,
                timezone="UTC",
                start_time=Timestamp_from_datetime(start + timedelta(hours=hours_from_now)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=hours_from_now + 0.5)),
            )

    with events_session(token1) as api:
        e2 = api.CreateEvent(new_event(2, c_id, True)).event_id

    moderator.approve_event_by_occurrence(e2)

    with events_session(token2) as api:
        e1 = api.CreateEvent(new_event(1, c_id, False)).event_id

    moderator.approve_event_by_occurrence(e1)

    with events_session(token1) as api:
        e3 = api.CreateEvent(new_event(3, c_id, False)).event_id

    moderator.approve_event_by_occurrence(e3)

    with events_session(token2) as api:
        e5 = api.CreateEvent(new_event(5, c_id, True)).event_id

    moderator.approve_event_by_occurrence(e5)

    with events_session(token3) as api:
        e4 = api.CreateEvent(new_event(4, c_id, True)).event_id

    moderator.approve_event_by_occurrence(e4)

    with events_session(token4) as api:
        e6 = api.CreateEvent(new_event(6, c2_id, True)).event_id

    moderator.approve_event_by_occurrence(e6)

    with events_session(token1) as api:
        api.InviteEventOrganizer(events_pb2.InviteEventOrganizerReq(event_id=e3, user_id=user3.id))

    with events_session(token1) as api:
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=e1, attendance_state=events_pb2.ATTENDANCE_STATE_MAYBE)
        )
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=e4, subscribe=True))

    with events_session(token2) as api:
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=e3, attendance_state=events_pb2.ATTENDANCE_STATE_GOING)
        )

    with events_session(token3) as api:
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=e2, subscribe=True))

    with events_session(token1) as api:
        # test pagination with token first
        res = api.ListMyEvents(events_pb2.ListMyEventsReq(page_size=2))
        assert [event.event_id for event in res.events] == [e1, e2]
        res = api.ListMyEvents(events_pb2.ListMyEventsReq(page_size=2, page_token=res.next_page_token))
        assert [event.event_id for event in res.events] == [e3, e4]
        assert not res.next_page_token

        res = api.ListMyEvents(
            events_pb2.ListMyEventsReq(
                subscribed=True,
                attending=True,
                organizing=True,
            )
        )
        assert [event.event_id for event in res.events] == [e1, e2, e3, e4]

        res = api.ListMyEvents(events_pb2.ListMyEventsReq())
        assert [event.event_id for event in res.events] == [e1, e2, e3, e4]

        res = api.ListMyEvents(events_pb2.ListMyEventsReq(subscribed=True))
        assert [event.event_id for event in res.events] == [e2, e3, e4]

        res = api.ListMyEvents(events_pb2.ListMyEventsReq(attending=True))
        assert [event.event_id for event in res.events] == [e1, e2, e3]

        res = api.ListMyEvents(events_pb2.ListMyEventsReq(organizing=True))
        assert [event.event_id for event in res.events] == [e2, e3]

    with events_session(token1) as api:
        # Test pagination with page_number and verify total_items
        res = api.ListMyEvents(
            events_pb2.ListMyEventsReq(page_size=2, page_number=1, subscribed=True, attending=True, organizing=True)
        )
        assert [event.event_id for event in res.events] == [e1, e2]
        assert res.total_items == 4

        res = api.ListMyEvents(
            events_pb2.ListMyEventsReq(page_size=2, page_number=2, subscribed=True, attending=True, organizing=True)
        )
        assert [event.event_id for event in res.events] == [e3, e4]
        assert res.total_items == 4

        # Verify no more pages
        res = api.ListMyEvents(
            events_pb2.ListMyEventsReq(page_size=2, page_number=3, subscribed=True, attending=True, organizing=True)
        )
        assert not res.events
        assert res.total_items == 4

    with events_session(token2) as api:
        res = api.ListMyEvents(events_pb2.ListMyEventsReq())
        assert [event.event_id for event in res.events] == [e1, e3, e5]

        res = api.ListMyEvents(events_pb2.ListMyEventsReq(subscribed=True))
        assert [event.event_id for event in res.events] == [e1, e5]

        res = api.ListMyEvents(events_pb2.ListMyEventsReq(attending=True))
        assert [event.event_id for event in res.events] == [e1, e3, e5]

        res = api.ListMyEvents(events_pb2.ListMyEventsReq(organizing=True))
        assert [event.event_id for event in res.events] == [e1, e5]

    with events_session(token3) as api:
        # user3 is member of both global (c_id) and child (c2_id) communities
        res = api.ListMyEvents(events_pb2.ListMyEventsReq())
        assert [event.event_id for event in res.events] == [e1, e2, e3, e4, e5, e6]

        res = api.ListMyEvents(events_pb2.ListMyEventsReq(subscribed=True))
        assert [event.event_id for event in res.events] == [e2, e4]

        res = api.ListMyEvents(events_pb2.ListMyEventsReq(attending=True))
        assert [event.event_id for event in res.events] == [e4]

        res = api.ListMyEvents(events_pb2.ListMyEventsReq(organizing=True))
        assert [event.event_id for event in res.events] == [e3, e4]

        # my_communities returns events from both communities user3 is a member of
        res = api.ListMyEvents(events_pb2.ListMyEventsReq(my_communities=True))
        assert [event.event_id for event in res.events] == [e1, e2, e3, e4, e5, e6]

        # my_communities_exclude_global filters out events from global community (node_id=1)
        res = api.ListMyEvents(events_pb2.ListMyEventsReq(my_communities=True, my_communities_exclude_global=True))
        assert [event.event_id for event in res.events] == [e6]

        # my_communities_exclude_global works independently of my_communities flag
        res = api.ListMyEvents(events_pb2.ListMyEventsReq(my_communities_exclude_global=True))
        assert [event.event_id for event in res.events] == [e6]

        # my_communities_exclude_global filters organizing results too
        res = api.ListMyEvents(events_pb2.ListMyEventsReq(organizing=True, my_communities_exclude_global=True))
        assert [event.event_id for event in res.events] == []

        # my_communities_exclude_global filters subscribed results too
        res = api.ListMyEvents(events_pb2.ListMyEventsReq(subscribed=True, my_communities_exclude_global=True))
        assert [event.event_id for event in res.events] == []

    with events_session(token5) as api:
        res = api.ListAllEvents(events_pb2.ListAllEventsReq())
        assert [event.event_id for event in res.events] == [e1, e2, e3, e4, e5, e6]


def test_RemoveEventOrganizer(db, moderator: Moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user1], [], None).id

    with events_session(token1) as api:
        event_id = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        ).event_id

    moderator.approve_event_by_occurrence(event_id)

    with events_session(token2) as api:
        assert not api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).organizer

        with pytest.raises(grpc.RpcError) as e:
            api.RemoveEventOrganizer(events_pb2.RemoveEventOrganizerReq(event_id=event_id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You're not allowed to edit that event."

        assert not api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).organizer

    with events_session(token1) as api:
        api.InviteEventOrganizer(events_pb2.InviteEventOrganizerReq(event_id=event_id, user_id=user2.id))

        with pytest.raises(grpc.RpcError) as e:
            api.RemoveEventOrganizer(events_pb2.RemoveEventOrganizerReq(event_id=event_id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You cannot remove the event owner as an organizer."

    with events_session(token2) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        assert res.organizer
        assert res.organizer_count == 2
        api.RemoveEventOrganizer(events_pb2.RemoveEventOrganizerReq(event_id=event_id))
        assert not api.GetEvent(events_pb2.GetEventReq(event_id=event_id)).organizer

        with pytest.raises(grpc.RpcError) as e:
            api.RemoveEventOrganizer(events_pb2.RemoveEventOrganizerReq(event_id=event_id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You're not allowed to edit that event."

        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        assert not res.organizer
        assert res.organizer_count == 1

    # Test that event owner can remove co-organizers
    with events_session(token1) as api:
        # Add user2 back as organizer
        api.InviteEventOrganizer(events_pb2.InviteEventOrganizerReq(event_id=event_id, user_id=user2.id))

        # Verify user2 is now an organizer
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        assert res.organizer_count == 2

        # Event owner can remove co-organizer
        api.RemoveEventOrganizer(
            events_pb2.RemoveEventOrganizerReq(event_id=event_id, user_id=wrappers_pb2.Int64Value(value=user2.id))
        )

        # Verify user2 is no longer an organizer
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        assert res.organizer_count == 1

    # Test that non-organizers cannot remove other organizers
    with events_session(token2) as api:
        # User2 cannot invite themselves as organizer (not the owner)
        with pytest.raises(grpc.RpcError) as e:
            api.InviteEventOrganizer(events_pb2.InviteEventOrganizerReq(event_id=event_id, user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "You're not allowed to edit that event."

    # Test that non-organizers cannot remove other organizers (user1 adds user2 back first)
    with events_session(token1) as api:
        # Add user2 back as organizer
        api.InviteEventOrganizer(events_pb2.InviteEventOrganizerReq(event_id=event_id, user_id=user2.id))


def test_ListEventAttendees_regression(db):
    # see issue #1617:
    #
    # 1. Create an event
    # 2. Transfer the event to a community (although this step probably not necessarily, only needed for it to show up in UI/`ListEvents` from `communities.proto`
    # 3. Change the current user's attendance state to "not going" (with `SetEventAttendance`)
    # 4. Change the current user's attendance state to "going" again
    #
    # **Expected behaviour**
    # `ListEventAttendees` should return the current user's ID
    #
    # **Actual/current behaviour**
    # `ListEventAttendees` returns another user's ID. This ID seems to be determined from the row's auto increment ID in `event_occurrence_attendees` in the database

    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user1], [], None).id

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token1) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org",
                ),
                parent_community_id=c_id,
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )

        res = api.TransferEvent(
            events_pb2.TransferEventReq(
                event_id=res.event_id,
                new_owner_community_id=c_id,
            )
        )

        event_id = res.event_id

        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_NOT_GOING)
        )
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(event_id=event_id, attendance_state=events_pb2.ATTENDANCE_STATE_GOING)
        )

        res = api.ListEventAttendees(events_pb2.ListEventAttendeesReq(event_id=event_id))
        assert len(res.attendee_user_ids) == 1
        assert res.attendee_user_ids[0] == user1.id


def test_event_threads(db, push_collector: PushCollector, moderator: Moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    with session_scope() as session:
        c = create_community(session, 0, 2, "Community", [user3], [], None)
        h = create_group(session, "Group", [user4], [], c)
        c_id = c.id
        h_id = h.id
        user4_id = user4.id

    with events_session(token1) as api:
        event = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        )

    moderator.approve_event_by_occurrence(event.event_id)

    with threads_session(token2) as api:
        reply_id = api.PostReply(threads_pb2.PostReplyReq(thread_id=event.thread.thread_id, content="hi")).thread_id

    with events_session(token3) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event.event_id))
        assert res.thread.num_responses == 1

    with threads_session(token3) as api:
        ret = api.GetThread(threads_pb2.GetThreadReq(thread_id=res.thread.thread_id))
        assert len(ret.replies) == 1
        assert not ret.next_page_token
        assert ret.replies[0].thread_id == reply_id
        assert ret.replies[0].content == "hi"
        assert ret.replies[0].author_user_id == user2.id
        assert ret.replies[0].num_replies == 0

        api.PostReply(threads_pb2.PostReplyReq(thread_id=reply_id, content="what a silly comment"))

    process_jobs()

    assert push_collector.pop_for_user(user1.id, last=True).content.title == f"{user2.name} • Dummy Title"
    assert push_collector.pop_for_user(user2.id, last=True).content.title == f"{user3.name} • Dummy Title"
    assert push_collector.count_for_user(user4_id) == 0


def test_can_overlap_other_events_schedule_regression(db):
    # we had a bug where we were checking overlapping for *all* occurrences of *all* events, not just the ones for this event
    user, token = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user], [], None).id

    start = now()

    with events_session(token) as api:
        # create another event, should be able to overlap with this one
        api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                parent_community_id=c_id,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=1)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=5)),
                timezone="UTC",
            )
        )

        # this event
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                parent_community_id=c_id,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=1)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=2)),
                timezone="UTC",
            )
        )

        # this doesn't overlap with the just created event, but does overlap with the occurrence from earlier; which should be no problem
        api.ScheduleEvent(
            events_pb2.ScheduleEventReq(
                event_id=res.event_id,
                content="New event occurrence",
                offline_information=events_pb2.OfflineEventInformation(
                    address="A bit further but still near Null Island",
                    lat=0.3,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=3)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=6)),
                timezone="UTC",
            )
        )


def test_can_overlap_other_events_update_regression(db):
    user, token = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user], [], None).id

    start = now()

    with events_session(token) as api:
        # create another event, should be able to overlap with this one
        api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                parent_community_id=c_id,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=1)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=3)),
                timezone="UTC",
            )
        )

        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                parent_community_id=c_id,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=7)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=8)),
                timezone="UTC",
            )
        )

        event_id = api.ScheduleEvent(
            events_pb2.ScheduleEventReq(
                event_id=res.event_id,
                content="New event occurrence",
                offline_information=events_pb2.OfflineEventInformation(
                    address="A bit further but still near Null Island",
                    lat=0.3,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=4)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=6)),
                timezone="UTC",
            )
        ).event_id

        # can overlap with this current existing occurrence
        api.UpdateEvent(
            events_pb2.UpdateEventReq(
                event_id=event_id,
                start_time=Timestamp_from_datetime(start + timedelta(hours=5)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=6)),
            )
        )

        api.UpdateEvent(
            events_pb2.UpdateEventReq(
                event_id=event_id,
                start_time=Timestamp_from_datetime(start + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=4)),
            )
        )


def test_list_past_events_regression(db):
    # test for a bug where listing past events didn't work if they didn't have a future occurrence
    user, token = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user], [], None).id

    start = now()

    with events_session(token) as api:
        api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                parent_community_id=c_id,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=3)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=4)),
                timezone="UTC",
            )
        )

    with session_scope() as session:
        session.execute(
            update(EventOccurrence).values(
                during=DateTimeTZRange(start + timedelta(hours=-5), start + timedelta(hours=-4))
            )
        )

    with events_session(token) as api:
        res = api.ListAllEvents(events_pb2.ListAllEventsReq(past=True))
        assert len(res.events) == 1


def test_community_invite_requests(db):
    user1, token1 = generate_user(complete_profile=True)
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user(is_superuser=True)

    with session_scope() as session:
        w = create_community(session, 0, 2, "World Community", [user5], [], None)
        c_id = create_community(session, 0, 2, "Community", [user1, user3, user4], [], w).id

    enforce_community_memberships()

    with events_session(token1) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                parent_community_id=c_id,
                online_information=events_pb2.OnlineEventInformation(
                    link="https://couchers.org/meet/",
                ),
                start_time=Timestamp_from_datetime(now() + timedelta(hours=3)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=4)),
                timezone="UTC",
            )
        )
        user_url = f"http://localhost:3000/user/{user1.username}"
        event_url = f"http://localhost:3000/event/{res.event_id}/{res.slug}"

        event_id = res.event_id

        with mock_notification_email() as mock:
            api.RequestCommunityInvite(events_pb2.RequestCommunityInviteReq(event_id=event_id))
        assert mock.call_count == 1
        e = email_fields(mock)
        assert e.recipient == "mods@couchers.org.invalid"

        assert user_url in e.plain
        assert event_url in e.plain

        # can't send another req
        with pytest.raises(grpc.RpcError) as err:
            api.RequestCommunityInvite(events_pb2.RequestCommunityInviteReq(event_id=event_id))
        assert err.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert err.value.details() == "You have already requested a community invite for this event."

    # another user can send one though
    with events_session(token3) as api:
        api.RequestCommunityInvite(events_pb2.RequestCommunityInviteReq(event_id=event_id))

    # but not a non-admin
    with events_session(token2) as api:
        with pytest.raises(grpc.RpcError) as err:
            api.RequestCommunityInvite(events_pb2.RequestCommunityInviteReq(event_id=event_id))
        assert err.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert err.value.details() == "You're not allowed to edit that event."

    with real_editor_session(token5) as editor:
        res = editor.ListEventCommunityInviteRequests(editor_pb2.ListEventCommunityInviteRequestsReq())
        assert len(res.requests) == 2
        assert res.requests[0].user_id == user1.id
        assert res.requests[0].approx_users_to_notify == 3
        assert res.requests[1].user_id == user3.id
        assert res.requests[1].approx_users_to_notify == 3

        editor.DecideEventCommunityInviteRequest(
            editor_pb2.DecideEventCommunityInviteRequestReq(
                event_community_invite_request_id=res.requests[0].event_community_invite_request_id,
                approve=False,
            )
        )

        editor.DecideEventCommunityInviteRequest(
            editor_pb2.DecideEventCommunityInviteRequestReq(
                event_community_invite_request_id=res.requests[1].event_community_invite_request_id,
                approve=True,
            )
        )

    # not after approve
    with events_session(token4) as api:
        with pytest.raises(grpc.RpcError) as err:
            api.RequestCommunityInvite(events_pb2.RequestCommunityInviteReq(event_id=event_id))
        assert err.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert err.value.details() == "A community invite has already been sent out for this event."


def test_update_event_should_notify_queues_job():
    user, token = generate_user()
    start = now()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user], [], None).id

    # create an event
    with events_session(token) as api:
        create_res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                parent_community_id=c_id,
                offline_information=events_pb2.OfflineEventInformation(
                    address="https://couchers.org/meet/",
                    lat=1.0,
                    lng=2.0,
                ),
                start_time=Timestamp_from_datetime(start + timedelta(hours=3)),
                end_time=Timestamp_from_datetime(start + timedelta(hours=6)),
                timezone="UTC",
            )
        )

        event_id = create_res.event_id

    # measure initial background job queue length
    with session_scope() as session:
        jobs = session.query(BackgroundJob).all()
        job_length_before_update = len(jobs)

    # update with should_notify=False, expect no change in background job queue
    api.UpdateEvent(
        events_pb2.UpdateEventReq(
            event_id=event_id,
            start_time=Timestamp_from_datetime(start + timedelta(hours=4)),
            should_notify=False,
        )
    )

    with session_scope() as session:
        jobs = session.query(BackgroundJob).all()
        assert len(jobs) == job_length_before_update

    # update with should_notify=True, expect one new background job added
    api.UpdateEvent(
        events_pb2.UpdateEventReq(
            event_id=event_id,
            start_time=Timestamp_from_datetime(start + timedelta(hours=4)),
            should_notify=True,
        )
    )

    with session_scope() as session:
        jobs = session.query(BackgroundJob).all()
        assert len(jobs) == job_length_before_update + 1


def test_event_photo_key(db):
    """Test that events return the photo_key field when a photo is set."""
    user, token = generate_user()

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    # Create a community and an upload for the event photo
    with session_scope() as session:
        create_community(session, 0, 2, "Community", [user], [], None)
        upload = Upload(
            key="test_event_photo_key_123",
            filename="test_event_photo_key_123.jpg",
            creator_user_id=user.id,
        )
        session.add(upload)

    with events_session(token) as api:
        # Create event without photo
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Event Without Photo",
                content="No photo content.",
                photo_key=None,
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )

        assert res.photo_key == ""
        assert res.photo_url == ""

        # Create event with photo
        res_with_photo = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Event With Photo",
                content="Has photo content.",
                photo_key="test_event_photo_key_123",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time + timedelta(days=1)),
                end_time=Timestamp_from_datetime(end_time + timedelta(days=1)),
                timezone="UTC",
            )
        )

        assert res_with_photo.photo_key == "test_event_photo_key_123"
        assert "test_event_photo_key_123" in res_with_photo.photo_url

        event_id = res_with_photo.event_id

        # Verify photo_key is returned when getting the event
        get_res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        assert get_res.photo_key == "test_event_photo_key_123"
        assert "test_event_photo_key_123" in get_res.photo_url


def test_event_created_with_shadowed_visibility(db):
    """Events start in SHADOWED state when created."""
    from couchers.models import Event, ModerationState, ModerationVisibility

    user, token = generate_user()

    with session_scope() as session:
        create_community(session, 0, 2, "Community", [user], [], None)

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Test UMS Event",
                content="UMS content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )
        event_id = res.event_id

    with session_scope() as session:
        occurrence = session.execute(select(EventOccurrence).where(EventOccurrence.id == event_id)).scalar_one()
        event = session.execute(select(Event).where(Event.id == occurrence.event_id)).scalar_one()
        mod_state = session.execute(
            select(ModerationState).where(ModerationState.id == event.moderation_state_id)
        ).scalar_one()
        assert mod_state.visibility == ModerationVisibility.shadowed


def test_shadowed_event_visible_to_creator_only(db):
    """SHADOWED events are visible to the creator but not to other users."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        create_community(session, 0, 2, "Community", [user1], [], None)

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token1) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Shadowed Event",
                content="Content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )
        event_id = res.event_id

    # Creator can see it
    with events_session(token1) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        assert res.title == "Shadowed Event"

    # Other user cannot
    with events_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_event_visible_after_approval(db, moderator: Moderator):
    """Events become visible to all users after moderation approval."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        create_community(session, 0, 2, "Community", [user1], [], None)

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token1) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Approved Event",
                content="Content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )
        event_id = res.event_id

    # Other user cannot see it yet
    with events_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    # Approve the event
    moderator.approve_event_by_occurrence(event_id)

    # Now other user can see it
    with events_session(token2) as api:
        res = api.GetEvent(events_pb2.GetEventReq(event_id=event_id))
        assert res.title == "Approved Event"


def test_shadowed_event_hidden_from_list_for_non_creator(db, moderator: Moderator):
    """SHADOWED events appear in lists for the creator but not for other users."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        create_community(session, 0, 2, "Community", [user1], [], None)

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)

    with events_session(token1) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="List Test Event",
                content="Content.",
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )
        event_id = res.event_id

    # Creator can see their own SHADOWED event in lists
    with events_session(token1) as api:
        list_res = api.ListAllEvents(events_pb2.ListAllEventsReq())
        event_ids = [e.event_id for e in list_res.events]
        assert event_id in event_ids

    # Other user cannot see the SHADOWED event in lists
    with events_session(token2) as api:
        list_res = api.ListAllEvents(events_pb2.ListAllEventsReq())
        event_ids = [e.event_id for e in list_res.events]
        assert event_id not in event_ids

    # After approval, other user can see it
    moderator.approve_event_by_occurrence(event_id)

    with events_session(token2) as api:
        list_res = api.ListAllEvents(events_pb2.ListAllEventsReq())
        event_ids = [e.event_id for e in list_res.events]
        assert event_id in event_ids
