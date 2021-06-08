import grpc
import pytest
from google.protobuf import wrappers_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.utils import create_coordinate
from proto import search_pb2
from tests.test_communities import get_community_id, get_group_id, get_user_id_and_token, testing_communities
from tests.test_fixtures import db, generate_user, groups_session, make_user_block, search_session, testconfig


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


def test_Search_function_invisible_user_in_search(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user(make_invisible=True)

    with search_session(token1) as api:
        res = api.Search(
            search_pb2.SearchReq(
                query="test_user_",
                include_users=True,
            )
        )
        assert len(res.results) == 1


def test_Search_function_blocking_user_in_search(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_user_block(user2, user1)

    with search_session(token1) as api:
        res = api.Search(
            search_pb2.SearchReq(
                query="test_user_",
                include_users=True,
            )
        )
        assert len(res.results) == 1


def test_Search_function_blocked_user_in_search(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_user_block(user1, user2)

    with search_session(token1) as api:
        res = api.Search(
            search_pb2.SearchReq(
                query="test_user_",
                include_users=True,
            )
        )
        assert len(res.results) == 1


def test_UserSearch_function_invisible_user_in_search(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user(make_invisible=True)

    with search_session(token1) as api:
        res = api.UserSearch(search_pb2.UserSearchReq(query=wrappers_pb2.StringValue(value="test_user_")))
        assert len(res.results) == 1


def test_UserSearch_function_blocking_user_in_search(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_user_block(user2, user1)

    with search_session(token1) as api:
        res = api.UserSearch(search_pb2.UserSearchReq(query=wrappers_pb2.StringValue(value="test_user_")))
        assert len(res.results) == 1


def test_UserSearch_function_blocked_user_in_search(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_user_block(user1, user2)

    with search_session(token1) as api:
        res = api.UserSearch(search_pb2.UserSearchReq(query=wrappers_pb2.StringValue(value="test_user_")))
        assert len(res.results) == 1


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
