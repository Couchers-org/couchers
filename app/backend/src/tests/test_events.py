from datetime import timedelta

import grpc
import pytest
from google.protobuf import wrappers_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.utils import Timestamp_from_datetime, now
from pb import events_pb2
from tests.test_communities import create_community
from tests.test_fixtures import db, events_session, generate_user, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_CreateEvent(db):
    # test cases:
    # can create event
    # can create recurring event
    # cannot create event with missing details
    # can create online event
    # can create in person event
    # can't create event that starts in the past
    # can create in different timezones

    # CreateEventReq
    user, token = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Community", [user], [], None).id

    with events_session(token) as api:
        api.CreateEvent(
            events_pb2.CreateEventReq(
                title="dummy title",
                content="dummy content",
                photo_key=None,
                location=events_pb2.Coordinate(
                    lat=0.1,
                    lng=0.1,
                ),
                address="Near Null Island",
                is_online_only=False,
                link=None,
                parent_community_id=c_id,
                start_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
                end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
                timezone="UTC",
            )
        )

    with events_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePlace(
                events_pb2.CreatePlaceReq(
                    title=None,
                    content="dummy content",
                    address="dummy address",
                    location=events_pb2.Coordinate(
                        lat=1,
                        lng=1,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_TITLE


def test_ScheduleEvent(db):
    # test cases:
    # can schedule a new event

    # ScheduleEventReq
    pass


def test_UpdateEvent(db):
    # test cases:
    # owner can update
    # community owner can update
    # can make once-off event into a recurring event
    # can stop recurring event from being recurring
    # can't mess up online/in person dichotomy
    # notifies attendees

    # UpdateEventReq
    pass


def test_GetEvent(db):
    # GetEventReq
    pass


def test_ListEventAttendees(db):
    # ListEventAttendeesReq
    pass


def test_ListEventSubscribers(db):
    # ListEventSubscribersReq
    pass


def test_ListEventOrganizers(db):
    # ListEventOrganizersReq
    pass


def test_TransferEvent(db):
    # test cases:
    # can transfer from individual to community/group
    # can transfer from community/group to other

    # TransferEventReq
    pass


def test_SetEventSubscription(db):
    # SetEventSubscriptionReq
    pass


def test_SetEventAttendance(db):
    # SetEventAttendanceReq
    pass


def test_InviteEventOrganizer(db):
    # test cases:
    # works and sends email

    # InviteEventOrganizerReq
    pass


def test_InviteEventOrganizer(db):
    # InviteEventOrganizerReq
    pass


def test_ListEventOccurences(db):
    # ListEventOccurencesReq
    pass


def test_ListMyEvents(db):
    # ListMyEventsReq
    pass


def test_RemoveEventOrganizer(db):
    # RemoveEventOrganizerReq
    pass
