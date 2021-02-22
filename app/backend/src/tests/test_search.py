import grpc
import pytest

from couchers import errors
from couchers.db import session_scope
from pb import search_pb2
from tests.test_communities import get_community_id, get_group_id, get_user_id_and_token, testing_communities
from tests.test_fixtures import db, generate_user, groups_session, search_session, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_search(testing_communities):
    user, token = generate_user()
    with search_session(token) as api:
        res = api.Search(search_pb2.SearchReq(query="Country 1, Region 1", include_places=True))
