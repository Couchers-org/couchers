from datetime import timedelta

import pytest

from couchers import errors
from couchers.db import session_scope
from pb import groups_pb2
from tests.test_communities import get_community_id, get_group_id, get_user_id_and_token, testing_communities
from tests.test_fixtures import db, generate_user, groups_session, lists_equal, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_GetGroup(db, testing_communities):
    pass


def test_ListAdmins(db, testing_communities):
    with session_scope() as session:
        user1_id, token1 = get_user_id_and_token(session, "user1")
        user2_id, token2 = get_user_id_and_token(session, "user2")
        gobblywobs_id = get_group_id(session, "Gobblywobs")
        c1r2foodies_id = get_group_id(session, "Country 1, Region 2, Foodies")

    with groups_session(token1) as api:
        res = api.ListAdmins(
            groups_pb2.ListAdminsReq(
                group_id=gobblywobs_id,
            )
        )
        assert lists_equal(res.admin_user_ids, [user1_id, user2_id])

        res = api.ListAdmins(
            groups_pb2.ListAdminsReq(
                group_id=c1r2foodies_id,
            )
        )
        assert lists_equal(res.admin_user_ids, [user2_id])


def test_ListMembers(db, testing_communities):
    with session_scope() as session:
        user1_id, token1 = get_user_id_and_token(session, "user1")
        user2_id, token2 = get_user_id_and_token(session, "user2")
        user4_id, token4 = get_user_id_and_token(session, "user4")
        user5_id, token5 = get_user_id_and_token(session, "user5")
        user8_id, token8 = get_user_id_and_token(session, "user8")
        gobblywobs_id = get_group_id(session, "Gobblywobs")
        c1r2foodies_id = get_group_id(session, "Country 1, Region 2, Foodies")

    with groups_session(token1) as api:
        res = api.ListMembers(
            groups_pb2.ListMembersReq(
                group_id=gobblywobs_id,
            )
        )
        assert lists_equal(res.member_user_ids, [user1_id, user2_id, user5_id, user8_id])

        res = api.ListMembers(
            groups_pb2.ListMembersReq(
                group_id=c1r2foodies_id,
            )
        )
        assert lists_equal(res.member_user_ids, [user2_id, user4_id, user5_id])


# TODO: also requires implementing content transfer functionality
# Note: allegedly groups cannot contain content other than discussions!

# def test_ListPlaces(db, testing_communities):
#     pass

# def test_ListGuides(db, testing_communities):
#     pass

# def test_ListEvents(db, testing_communities):
#     pass

# def test_ListDiscussions(db, testing_communities):
#     pass
