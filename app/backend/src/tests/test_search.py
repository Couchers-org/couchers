import grpc
import pytest
from google.protobuf import wrappers_pb2

from couchers import errors
from couchers.db import session_scope
from pb import search_pb2
from tests.test_communities import get_community_id, get_group_id, get_user_id_and_token, testing_communities
from tests.test_fixtures import db, generate_user, groups_session, search_session, testconfig


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


def test_Search_function_invisible_users(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user(is_deleted=True)

    with search_session(token1) as api:
        res = api.Search(
            search_pb2.SearchReq(
                query="test_user_",
                include_users=True,
            )
        )
        assert len(res.results) == 1


def test_UserSearch_function_invisible_users(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user(is_deleted=True)

    with search_session(token1) as api:
        res = api.UserSearch(search_pb2.UserSearchReq(query=wrappers_pb2.StringValue(value="test_user_")))
        assert len(res.results) == 1
