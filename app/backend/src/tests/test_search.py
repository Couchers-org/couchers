from datetime import timedelta

import pytest
from google.protobuf import wrappers_pb2

from couchers.db import session_scope
from couchers.models import MeetupStatus
from couchers.utils import Timestamp_from_datetime, create_coordinate, now
from proto import api_pb2, events_pb2, search_pb2
from tests.test_communities import create_community, testing_communities  # noqa
from tests.test_fixtures import db, events_session, generate_user, search_session, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_Search(testing_communities):
    user, token = generate_user()
    with search_session(token) as api:
        res = api.Search(
            search_pb2.SearchReq(
                query="Country 1, Region 1",
                include_users=True,
                include_communities=True,
                include_groups=True,
                include_places=True,
                include_guides=True,
            )
        )
        res = api.Search(
            search_pb2.SearchReq(
                query="Country 1, Region 1, Attraction",
                title_only=True,
                include_users=True,
                include_communities=True,
                include_groups=True,
                include_places=True,
                include_guides=True,
            )
        )


def test_UserSearch(testing_communities):
    """Test that UserSearch returns all users if no filter is set."""
    user, token = generate_user()
    with search_session(token) as api:
        res = api.UserSearch(search_pb2.UserSearchReq())
        assert len(res.results) > 0


def test_regression_search_in_area(db):
    """
    Makes sure search_in_area works.

    At the equator/prime meridian intersection (0,0), one degree is roughly 111 km.
    """

    # outside
    user1, token1 = generate_user(geom=create_coordinate(1, 0), geom_radius=100)
    # outside
    user2, token2 = generate_user(geom=create_coordinate(0, 1), geom_radius=100)
    # inside
    user3, token3 = generate_user(geom=create_coordinate(0.1, 0), geom_radius=100)
    # inside
    user4, token4 = generate_user(geom=create_coordinate(0, 0.1), geom_radius=100)
    # outside
    user5, token5 = generate_user(geom=create_coordinate(10, 10), geom_radius=100)

    with search_session(token5) as api:
        res = api.UserSearch(
            search_pb2.UserSearchReq(
                search_in_area=search_pb2.Area(
                    lat=0,
                    lng=0,
                    radius=100000,
                )
            )
        )
        assert [result.user.user_id for result in res.results] == [user3.id, user4.id]


def test_user_search_in_rectangle(db):
    """
    Makes sure search_in_rectangle works as expected.
    """

    # outside
    user1, token1 = generate_user(geom=create_coordinate(-1, 0), geom_radius=100)
    # outside
    user2, token2 = generate_user(geom=create_coordinate(0, -1), geom_radius=100)
    # inside
    user3, token3 = generate_user(geom=create_coordinate(0.1, 0.1), geom_radius=100)
    # inside
    user4, token4 = generate_user(geom=create_coordinate(1.2, 0.1), geom_radius=100)
    # outside (not fully inside)
    user5, token5 = generate_user(geom=create_coordinate(0, 0), geom_radius=100)
    # outside
    user6, token6 = generate_user(geom=create_coordinate(0.1, 1.2), geom_radius=100)
    # outside
    user7, token7 = generate_user(geom=create_coordinate(10, 10), geom_radius=100)

    with search_session(token5) as api:
        res = api.UserSearch(
            search_pb2.UserSearchReq(
                search_in_rectangle=search_pb2.RectArea(
                    lat_min=0,
                    lat_max=2,
                    lng_min=0,
                    lng_max=1,
                )
            )
        )
        assert [result.user.user_id for result in res.results] == [user3.id, user4.id]


def test_user_filter_complete_profile(db):
    """
    Make sure the completed profile flag returns only completed user profile
    """
    user_complete_profile, token6 = generate_user(complete_profile=True)

    user_incomplete_profile, token7 = generate_user(complete_profile=False)

    with search_session(token7) as api:
        res = api.UserSearch(search_pb2.UserSearchReq(profile_completed=wrappers_pb2.BoolValue(value=False)))
        assert user_incomplete_profile.id in [result.user.user_id for result in res.results]

    with search_session(token6) as api:
        res = api.UserSearch(search_pb2.UserSearchReq(profile_completed=wrappers_pb2.BoolValue(value=True)))
        assert [result.user.user_id for result in res.results] == [user_complete_profile.id]


def test_user_filter_meetup_status(db):
    """
    Make sure the completed profile flag returns only completed user profile
    """
    user_wants_to_meetup, token8 = generate_user(meetup_status=MeetupStatus.wants_to_meetup)

    user_does_not_want_to_meet, token9 = generate_user(meetup_status=MeetupStatus.does_not_want_to_meetup)

    with search_session(token8) as api:
        res = api.UserSearch(search_pb2.UserSearchReq(meetup_status_filter=[api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP]))
        assert user_wants_to_meetup.id in [result.user.user_id for result in res.results]

    with search_session(token9) as api:
        res = api.UserSearch(
            search_pb2.UserSearchReq(meetup_status_filter=[api_pb2.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP])
        )
        assert [result.user.user_id for result in res.results] == [user_does_not_want_to_meet.id]


@pytest.fixture
def sample_event_data() -> dict:
    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)
    return {
        "title": "Dummy Title",
        "content": "Dummy content.",
        "photo_key": None,
        "offline_information": events_pb2.OfflineEventInformation(
            address="Near Null Island",
            lat=0.1,
            lng=0.2,
        ),
        "start_time": Timestamp_from_datetime(start_time),
        "end_time": Timestamp_from_datetime(end_time),
        "timezone": "UTC",
    }


@pytest.fixture
def create_event(sample_event_data):
    """Factory for creating events."""

    def _create_event(token, **kwargs) -> int:
        """Create an event with default values, unless overridden by kwargs."""
        with events_session(token) as api:
            return api.CreateEvent(
                events_pb2.CreateEventReq(
                    **{
                        **sample_event_data,
                        **kwargs,
                    }
                )
            )

    return _create_event


@pytest.fixture
def sample_community(db):
    user, _ = generate_user()
    with session_scope() as session:
        create_community(session, -50, 50, "Community", [user], [], None)


def test_EventSearch_no_filters(testing_communities):
    """Test that EventSearch returns all events if no filter is set."""
    user, token = generate_user()
    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq())
        assert len(res.events) > 0


def test_event_search_by_query(sample_community, create_event):
    """Test that EventSearch finds events by title and content (if query_title_only=False)."""
    user, token = generate_user()

    event_id1 = create_event(token, title="Lorem Ipsum")
    event_id2 = create_event(token, content="Lorem Ipsum")
    create_event(token)

    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq(query="Ipsum"))
        assert len(res.events) == 2
        assert {result.event_id for result in res.events} == {event_id1, event_id2}

        res = api.EventSearch(search_pb2.EventSearchReq(query="Ipsum", query_title_only=True))
        assert len(res.events) == 1
        assert res.events[0].event_id == event_id1


def test_event_search_by_time(sample_community, create_event):
    """Test that EventSearch filters with the given time range."""
    user, token = generate_user()

    event_id1 = create_event(
        token,
        start_time=Timestamp_from_datetime(now() + timedelta(hours=1)),
        end_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
    )
    event_id2 = create_event(
        token,
        start_time=Timestamp_from_datetime(now() + timedelta(hours=4)),
        end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
    )
    event_id3 = create_event(
        token,
        start_time=Timestamp_from_datetime(now() + timedelta(hours=7)),
        end_time=Timestamp_from_datetime(now() + timedelta(hours=8)),
    )

    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq(before=Timestamp_from_datetime(now() + timedelta(hours=6))))
        assert len(res.events) == 2
        assert {result.event_id for result in res.events} == {event_id1, event_id2}

        res = api.EventSearch(search_pb2.EventSearchReq(after=Timestamp_from_datetime(now() + timedelta(hours=3))))
        assert len(res.events) == 2
        assert {result.event_id for result in res.events} == {event_id2, event_id3}

        res = api.EventSearch(
            search_pb2.EventSearchReq(
                before=Timestamp_from_datetime(now() + timedelta(hours=6)),
                after=Timestamp_from_datetime(now() + timedelta(hours=3)),
            )
        )
        assert len(res.events) == 1
        assert res.events[0].event_id == event_id2


def test_event_search_by_circle(sample_community, create_event):
    """Test that EventSearch only returns events within the given circle."""
    user, token = generate_user()

    inside_pts = [(0.1, 0), (0, 0.1)]
    for i, (lat, lng) in enumerate(inside_pts):
        create_event(
            token,
            title=f"Inside area {i}",
            offline_information=events_pb2.OfflineEventInformation(lat=lat, lng=lng, address=f"Inside area {i}"),
        )

    outside_pts = [(1, 0), (0, 1), (10, 1)]
    for i, (lat, lng) in enumerate(outside_pts):
        create_event(
            token,
            title=f"Outside area {i}",
            offline_information=events_pb2.OfflineEventInformation(lat=lat, lng=lng, address=f"Outside area {i}"),
        )

    with search_session(token) as api:
        res = api.EventSearch(
            search_pb2.EventSearchReq(
                search_in_area=search_pb2.Area(
                    lat=0,
                    lng=0,
                    radius=100000,
                )
            )
        )
        assert len(res.events) == len(inside_pts)
        assert all(event.title.startswith("Inside area") for event in res.events)


def test_event_search_by_rectangle(sample_community, create_event):
    """Test that EventSearch only returns events within the given rectangular area."""
    user, token = generate_user()

    inside_pts = [(0.1, 0.1), (1.2, 0.1)]
    for i, (lat, lng) in enumerate(inside_pts):
        create_event(
            token,
            title=f"Inside area {i}",
            offline_information=events_pb2.OfflineEventInformation(lat=lat, lng=lng, address=f"Inside area {i}"),
        )

    outside_pts = [(-1, 0), (0, -1), (0, 0), (0.1, 1.2), (10, 1)]
    for i, (lat, lng) in enumerate(outside_pts):
        create_event(
            token,
            title=f"Outside area {i}",
            offline_information=events_pb2.OfflineEventInformation(lat=lat, lng=lng, address=f"Outside area {i}"),
        )

    with search_session(token) as api:
        res = api.EventSearch(
            search_pb2.EventSearchReq(
                search_in_rectangle=search_pb2.RectArea(
                    lat_min=0,
                    lat_max=2,
                    lng_min=0,
                    lng_max=1,
                )
            )
        )
        assert len(res.events) == len(inside_pts)
        assert all(event.title.startswith("Inside area") for event in res.events)
