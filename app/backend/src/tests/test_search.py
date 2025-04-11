from datetime import timedelta

import pytest
from google.protobuf import wrappers_pb2

from couchers.db import session_scope
from couchers.models import EventOccurrence, HostingStatus, LanguageAbility, LanguageFluency, MeetupStatus
from couchers.utils import Timestamp_from_datetime, create_coordinate, millis_from_dt, now
from proto import api_pb2, communities_pb2, events_pb2, search_pb2
from tests.test_communities import create_community, testing_communities  # noqa
from tests.test_fixtures import (  # noqa
    communities_session,
    db,
    events_session,
    generate_user,
    search_session,
    testconfig,
)
from tests.test_references import create_friend_reference


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
        assert res.total_items == len(res.results)


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


def test_user_filter_language(db):
    """
    Test filtering users by language ability.
    """
    user_with_german_beginner, token11 = generate_user(hosting_status=HostingStatus.can_host)
    user_with_japanese_conversational, token12 = generate_user(hosting_status=HostingStatus.can_host)
    user_with_german_fluent, token13 = generate_user(hosting_status=HostingStatus.can_host)

    with session_scope() as session:
        session.add(
            LanguageAbility(
                user_id=user_with_german_beginner.id, language_code="deu", fluency=LanguageFluency.beginner
            ),
        )
        session.add(
            LanguageAbility(
                user_id=user_with_japanese_conversational.id,
                language_code="jpn",
                fluency=LanguageFluency.fluent,
            )
        )
        session.add(
            LanguageAbility(user_id=user_with_german_fluent.id, language_code="deu", fluency=LanguageFluency.fluent)
        )

    with search_session(token11) as api:
        res = api.UserSearch(
            search_pb2.UserSearchReq(
                language_ability_filter=[
                    api_pb2.LanguageAbility(
                        code="deu",
                        fluency=api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT,
                    )
                ]
            )
        )
        assert [result.user.user_id for result in res.results] == [user_with_german_fluent.id]

        res = api.UserSearch(
            search_pb2.UserSearchReq(
                language_ability_filter=[
                    api_pb2.LanguageAbility(
                        code="jpn",
                        fluency=api_pb2.LanguageAbility.Fluency.FLUENCY_CONVERSATIONAL,
                    )
                ]
            )
        )
        assert [result.user.user_id for result in res.results] == [user_with_japanese_conversational.id]


def test_user_filter_strong_verification(db):
    user1, token1 = generate_user()
    user2, _ = generate_user(strong_verification=True)
    user3, _ = generate_user()
    user4, _ = generate_user(strong_verification=True)
    user5, _ = generate_user(strong_verification=True)

    with search_session(token1) as api:
        res = api.UserSearch(search_pb2.UserSearchReq(only_with_strong_verification=False))
        assert [result.user.user_id for result in res.results] == [user1.id, user2.id, user3.id, user4.id, user5.id]

        res = api.UserSearch(search_pb2.UserSearchReq(only_with_strong_verification=True))
        assert [result.user.user_id for result in res.results] == [user2.id, user4.id, user5.id]


def test_regression_search_only_with_references(db):
    user1, token1 = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()
    user4, _ = generate_user(delete_user=True)

    with session_scope() as session:
        # user 2 has references
        create_friend_reference(session, user1.id, user2.id, timedelta(days=1))
        create_friend_reference(session, user3.id, user2.id, timedelta(days=1))
        create_friend_reference(session, user4.id, user2.id, timedelta(days=1))

        # user 3 only has reference from a deleted user
        create_friend_reference(session, user4.id, user3.id, timedelta(days=1))

    with search_session(token1) as api:
        res = api.UserSearch(search_pb2.UserSearchReq(only_with_references=False))
        assert [result.user.user_id for result in res.results] == [user1.id, user2.id, user3.id]

        res = api.UserSearch(search_pb2.UserSearchReq(only_with_references=True))
        assert [result.user.user_id for result in res.results] == [user2.id]


def test_user_search_exactly_user_ids(db):
    """
    Test that UserSearch with exactly_user_ids returns only those users and ignores other filters.
    """
    # Create users with different properties
    user1, token1 = generate_user()
    user2, _ = generate_user(strong_verification=True)
    user3, _ = generate_user(complete_profile=True)
    user4, _ = generate_user(meetup_status=MeetupStatus.wants_to_meetup)
    user5, _ = generate_user(delete_user=True)  # Deleted user

    with search_session(token1) as api:
        # Test that exactly_user_ids returns only the specified users
        res = api.UserSearch(search_pb2.UserSearchReq(exactly_user_ids=[user2.id, user3.id, user4.id]))
        assert sorted([result.user.user_id for result in res.results]) == sorted([user2.id, user3.id, user4.id])

        # Test that exactly_user_ids ignores other filters
        res = api.UserSearch(
            search_pb2.UserSearchReq(
                exactly_user_ids=[user2.id, user3.id, user4.id],
                only_with_strong_verification=True,  # This would normally filter out user3 and user4
            )
        )
        assert sorted([result.user.user_id for result in res.results]) == sorted([user2.id, user3.id, user4.id])

        # Test with non-existent user IDs (should be ignored)
        res = api.UserSearch(search_pb2.UserSearchReq(exactly_user_ids=[user1.id, 99999]))
        assert [result.user.user_id for result in res.results] == [user1.id]

        # Test with deleted user ID (should be ignored due to visibility filter)
        res = api.UserSearch(search_pb2.UserSearchReq(exactly_user_ids=[user1.id, user5.id]))
        assert [result.user.user_id for result in res.results] == [user1.id]


@pytest.fixture
def sample_event_data() -> dict:
    """Dummy data for creating events."""
    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)
    return {
        "title": "Dummy Title",
        "content": "Dummy content.",
        "photo_key": None,
        "offline_information": events_pb2.OfflineEventInformation(address="Near Null Island", lat=0.1, lng=0.2),
        "start_time": Timestamp_from_datetime(start_time),
        "end_time": Timestamp_from_datetime(end_time),
        "timezone": "UTC",
    }


@pytest.fixture
def create_event(sample_event_data):
    """Factory for creating events."""

    def _create_event(event_api, **kwargs) -> EventOccurrence:
        """Create an event with default values, unless overridden by kwargs."""
        return event_api.CreateEvent(events_pb2.CreateEventReq(**{**sample_event_data, **kwargs}))

    return _create_event


@pytest.fixture
def sample_community(db) -> int:
    """Create large community spanning from (-50, 0) to (50, 2) as events can only be created within communities."""
    user, _ = generate_user()
    with session_scope() as session:
        return create_community(session, -50, 50, "Community", [user], [], None).id


def test_EventSearch_no_filters(testing_communities):
    """Test that EventSearch returns all events if no filter is set."""
    user, token = generate_user()
    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq())
        assert len(res.events) > 0


def test_event_search_by_query(sample_community, create_event):
    """Test that EventSearch finds events by title (and content if query_title_only=False)."""
    user, token = generate_user()

    with events_session(token) as api:
        event1 = create_event(api, title="Lorem Ipsum")
        event2 = create_event(api, content="Lorem Ipsum")
        create_event(api)

    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq(query=wrappers_pb2.StringValue(value="Ipsum")))
        assert len(res.events) == 2
        assert {result.event_id for result in res.events} == {event1.event_id, event2.event_id}

        res = api.EventSearch(
            search_pb2.EventSearchReq(query=wrappers_pb2.StringValue(value="Ipsum"), query_title_only=True)
        )
        assert len(res.events) == 1
        assert res.events[0].event_id == event1.event_id


def test_event_search_by_time(sample_community, create_event):
    """Test that EventSearch filters with the given time range."""
    user, token = generate_user()

    with events_session(token) as api:
        event1 = create_event(
            api,
            start_time=Timestamp_from_datetime(now() + timedelta(hours=1)),
            end_time=Timestamp_from_datetime(now() + timedelta(hours=2)),
        )
        event2 = create_event(
            api,
            start_time=Timestamp_from_datetime(now() + timedelta(hours=4)),
            end_time=Timestamp_from_datetime(now() + timedelta(hours=5)),
        )
        event3 = create_event(
            api,
            start_time=Timestamp_from_datetime(now() + timedelta(hours=7)),
            end_time=Timestamp_from_datetime(now() + timedelta(hours=8)),
        )

    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq(before=Timestamp_from_datetime(now() + timedelta(hours=6))))
        assert len(res.events) == 2
        assert {result.event_id for result in res.events} == {event1.event_id, event2.event_id}

        res = api.EventSearch(search_pb2.EventSearchReq(after=Timestamp_from_datetime(now() + timedelta(hours=3))))
        assert len(res.events) == 2
        assert {result.event_id for result in res.events} == {event2.event_id, event3.event_id}

        res = api.EventSearch(
            search_pb2.EventSearchReq(
                before=Timestamp_from_datetime(now() + timedelta(hours=6)),
                after=Timestamp_from_datetime(now() + timedelta(hours=3)),
            )
        )
        assert len(res.events) == 1
        assert res.events[0].event_id == event2.event_id


def test_event_search_by_circle(sample_community, create_event):
    """Test that EventSearch only returns events within the given circle."""
    user, token = generate_user()

    with events_session(token) as api:
        inside_pts = [(0.1, 0.01), (0.01, 0.1)]
        for i, (lat, lng) in enumerate(inside_pts):
            create_event(
                api,
                title=f"Inside area {i}",
                offline_information=events_pb2.OfflineEventInformation(lat=lat, lng=lng, address=f"Inside area {i}"),
            )

        outside_pts = [(1, 0.1), (0.1, 1), (10, 1)]
        for i, (lat, lng) in enumerate(outside_pts):
            create_event(
                api,
                title=f"Outside area {i}",
                offline_information=events_pb2.OfflineEventInformation(lat=lat, lng=lng, address=f"Outside area {i}"),
            )

    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq(search_in_area=search_pb2.Area(lat=0, lng=0, radius=100000)))
        assert len(res.events) == len(inside_pts)
        assert all(event.title.startswith("Inside area") for event in res.events)


def test_event_search_by_rectangle(sample_community, create_event):
    """Test that EventSearch only returns events within the given rectangular area."""
    user, token = generate_user()

    with events_session(token) as api:
        inside_pts = [(0.1, 0.2), (1.2, 0.2)]
        for i, (lat, lng) in enumerate(inside_pts):
            create_event(
                api,
                title=f"Inside area {i}",
                offline_information=events_pb2.OfflineEventInformation(lat=lat, lng=lng, address=f"Inside area {i}"),
            )

        outside_pts = [(-1, 0.1), (0.1, 0.01), (-0.01, 0.01), (0.1, 1.2), (10, 1)]
        for i, (lat, lng) in enumerate(outside_pts):
            create_event(
                api,
                title=f"Outside area {i}",
                offline_information=events_pb2.OfflineEventInformation(lat=lat, lng=lng, address=f"Outside area {i}"),
            )

    with search_session(token) as api:
        res = api.EventSearch(
            search_pb2.EventSearchReq(
                search_in_rectangle=search_pb2.RectArea(lat_min=0, lat_max=2, lng_min=0.1, lng_max=1)
            )
        )
        assert len(res.events) == len(inside_pts)
        assert all(event.title.startswith("Inside area") for event in res.events)


def test_event_search_pagination(sample_community, create_event):
    """Test that EventSearch paginates correctly.

    Check that
     - <page_size> events are returned, if available
     - sort order is applied (default: past=False)
     - the next page token is correct
    """
    user, token = generate_user()

    anchor_time = now()
    with events_session(token) as api:
        for i in range(5):
            create_event(
                api,
                title=f"Event {i + 1}",
                start_time=Timestamp_from_datetime(anchor_time + timedelta(hours=i + 1)),
                end_time=Timestamp_from_datetime(anchor_time + timedelta(hours=i + 1, minutes=30)),
            )

    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq(past=False, page_size=4))
        assert len(res.events) == 4
        assert [event.title for event in res.events] == ["Event 1", "Event 2", "Event 3", "Event 4"]
        assert res.next_page_token == str(millis_from_dt(anchor_time + timedelta(hours=5, minutes=30)))

        res = api.EventSearch(search_pb2.EventSearchReq(page_size=4, page_token=res.next_page_token))
        assert len(res.events) == 1
        assert res.events[0].title == "Event 5"
        assert res.next_page_token == ""

        res = api.EventSearch(
            search_pb2.EventSearchReq(
                past=True, page_size=2, page_token=str(millis_from_dt(anchor_time + timedelta(hours=4, minutes=30)))
            )
        )
        assert len(res.events) == 2
        assert [event.title for event in res.events] == ["Event 4", "Event 3"]
        assert res.next_page_token == str(millis_from_dt(anchor_time + timedelta(hours=2, minutes=30)))

        res = api.EventSearch(search_pb2.EventSearchReq(past=True, page_size=2, page_token=res.next_page_token))
        assert len(res.events) == 2
        assert [event.title for event in res.events] == ["Event 2", "Event 1"]
        assert res.next_page_token == ""


def test_event_search_pagination_with_page_number(sample_community, create_event):
    """Test that EventSearch paginates correctly with page number.

    Check that
     - <page_size> events are returned, if available
     - sort order is applied (default: past=False)
     - <page_number> is respected
     - <total_items> is correct
    """
    user, token = generate_user()

    anchor_time = now()
    with events_session(token) as api:
        for i in range(5):
            create_event(
                api,
                title=f"Event {i + 1}",
                start_time=Timestamp_from_datetime(anchor_time + timedelta(hours=i + 1)),
                end_time=Timestamp_from_datetime(anchor_time + timedelta(hours=i + 1, minutes=30)),
            )

    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq(page_size=2, page_number=1))
        assert len(res.events) == 2
        assert [event.title for event in res.events] == ["Event 1", "Event 2"]
        assert res.total_items == 5

        res = api.EventSearch(search_pb2.EventSearchReq(page_size=2, page_number=2))
        assert len(res.events) == 2
        assert [event.title for event in res.events] == ["Event 3", "Event 4"]
        assert res.total_items == 5

        res = api.EventSearch(search_pb2.EventSearchReq(page_size=2, page_number=3))
        assert len(res.events) == 1
        assert [event.title for event in res.events] == ["Event 5"]
        assert res.total_items == 5

        # Verify no more pages
        res = api.EventSearch(search_pb2.EventSearchReq(page_size=2, page_number=4))
        assert not res.events
        assert res.total_items == 5


def test_event_search_online_status(sample_community, create_event):
    """Test that EventSearch respects only_online and only_offline filters and by default returns both."""
    user, token = generate_user()

    with events_session(token) as api:
        create_event(api, title="Offline event")

        create_event(
            api,
            title="Online event",
            online_information=events_pb2.OnlineEventInformation(link="https://couchers.org/meet/"),
            parent_community_id=sample_community,
            offline_information=events_pb2.OfflineEventInformation(),
        )

    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq())
        assert len(res.events) == 2
        assert {event.title for event in res.events} == {"Offline event", "Online event"}

        res = api.EventSearch(search_pb2.EventSearchReq(only_online=True))
        assert {event.title for event in res.events} == {"Online event"}

        res = api.EventSearch(search_pb2.EventSearchReq(only_offline=True))
        assert {event.title for event in res.events} == {"Offline event"}


def test_event_search_filter_subscription_attendance_organizing_my_communities(sample_community, create_event):
    """Test that EventSearch respects subscribed, attending, organizing and my_communities filters and by default
    returns all events.
    """
    _, token = generate_user()
    other_user, other_token = generate_user()

    with communities_session(token) as api:
        api.JoinCommunity(communities_pb2.JoinCommunityReq(community_id=sample_community))

    with session_scope() as session:
        create_community(session, 55, 60, "Other community", [other_user], [], None)

    with events_session(other_token) as api:
        e_subscribed = create_event(api, title="Subscribed event")
        e_attending = create_event(api, title="Attending event")
        create_event(api, title="Community event")
        create_event(
            api,
            title="Other community event",
            offline_information=events_pb2.OfflineEventInformation(lat=58, lng=1, address="Somewhere"),
        )

    with events_session(token) as api:
        create_event(api, title="Organized event")
        api.SetEventSubscription(events_pb2.SetEventSubscriptionReq(event_id=e_subscribed.event_id, subscribe=True))
        api.SetEventAttendance(
            events_pb2.SetEventAttendanceReq(
                event_id=e_attending.event_id, attendance_state=events_pb2.ATTENDANCE_STATE_GOING
            )
        )

    with search_session(token) as api:
        res = api.EventSearch(search_pb2.EventSearchReq())
        assert {event.title for event in res.events} == {
            "Subscribed event",
            "Attending event",
            "Community event",
            "Other community event",
            "Organized event",
        }

        res = api.EventSearch(search_pb2.EventSearchReq(subscribed=True))
        assert {event.title for event in res.events} == {"Subscribed event", "Organized event"}

        res = api.EventSearch(search_pb2.EventSearchReq(attending=True))
        assert {event.title for event in res.events} == {"Attending event", "Organized event"}

        res = api.EventSearch(search_pb2.EventSearchReq(organizing=True))
        assert {event.title for event in res.events} == {"Organized event"}

        res = api.EventSearch(search_pb2.EventSearchReq(my_communities=True))
        assert {event.title for event in res.events} == {
            "Subscribed event",
            "Attending event",
            "Community event",
            "Organized event",
        }

        res = api.EventSearch(search_pb2.EventSearchReq(subscribed=True, attending=True))
        assert {event.title for event in res.events} == {"Subscribed event", "Attending event", "Organized event"}
