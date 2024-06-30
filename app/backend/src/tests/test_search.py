import pytest
from google.protobuf import wrappers_pb2

from couchers.models import MeetupStatus
from couchers.utils import create_coordinate
from proto import api_pb2, search_pb2
from tests.test_communities import testing_communities  # noqa
from tests.test_fixtures import db, generate_user, search_session, testconfig  # noqa


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
