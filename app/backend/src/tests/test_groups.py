from datetime import timedelta

import pytest

from couchers import errors
from couchers.db import session_scope
from pb import groups_pb2, pages_pb2
from tests.test_communities import get_community_id, get_group_id, get_user_id_and_token, testing_communities
from tests.test_fixtures import db, generate_user, groups_session, lists_equal, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_GetGroup(db, testing_communities):
    with session_scope() as session:
        user2_id, token2 = get_user_id_and_token(session, "user2")
        w_id = get_community_id(session, "World")
        c1_id = get_community_id(session, "Country 1")
        c2_id = get_community_id(session, "Country 2")
        c1r2_id = get_community_id(session, "Country 1, Region 2")
        c2r1_id = get_community_id(session, "Country 2, Region 1")
        gobblywobs_id = get_group_id(session, "Gobblywobs")
        c1r2foodies_id = get_group_id(session, "Country 1, Region 2, Foodies")
        c2r1foodies_id = get_group_id(session, "Country 2, Region 1, Foodies")

    with groups_session(token2) as api:
        res = api.GetGroup(
            groups_pb2.GetGroupReq(
                group_id=gobblywobs_id,
            )
        )
        assert res.group_id == gobblywobs_id
        assert res.name == "Gobblywobs"
        assert res.slug == "gobblywobs"
        assert res.description == "Description for Gobblywobs"
        assert len(res.parents) == 2
        assert res.parents[0].HasField("community")
        assert res.parents[0].community.community_id == w_id
        assert res.parents[0].community.name == "World"
        assert res.parents[0].community.slug == "world"
        assert res.parents[0].community.description == "Description for World"
        assert res.parents[1].HasField("group")
        assert res.parents[1].group.group_id == gobblywobs_id
        assert res.parents[1].group.name == "Gobblywobs"
        assert res.parents[1].group.slug == "gobblywobs"
        assert res.parents[1].group.description == "Description for Gobblywobs"
        assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
        assert res.main_page.slug == "main-page-for-the-gobblywobs-community"
        assert res.main_page.last_editor_user_id == 1
        assert res.main_page.creator_user_id == 1
        assert res.main_page.owner_user_id == 1
        assert res.main_page.title == "Main page for the Gobblywobs community"
        assert res.main_page.content == "There is nothing here yet..."
        # assert res.main_page.can_edit # TODO
        assert lists_equal(res.main_page.editor_user_ids, [1])
        assert res.member
        assert res.admin
        assert res.member_count == 4
        assert res.admin_count == 2

        res = api.GetGroup(
            groups_pb2.GetGroupReq(
                group_id=c1r2foodies_id,
            )
        )
        assert res.group_id == c1r2foodies_id
        assert res.name == "Country 1, Region 2, Foodies"
        assert res.slug == "country-1-region-2-foodies"
        assert res.description == "Description for Country 1, Region 2, Foodies"
        assert len(res.parents) == 4
        assert res.parents[0].HasField("community")
        assert res.parents[0].community.community_id == w_id
        assert res.parents[0].community.name == "World"
        assert res.parents[0].community.slug == "world"
        assert res.parents[0].community.description == "Description for World"
        assert res.parents[1].HasField("community")
        assert res.parents[1].community.community_id == c1_id
        assert res.parents[1].community.name == "Country 1"
        assert res.parents[1].community.slug == "country-1"
        assert res.parents[1].community.description == "Description for Country 1"
        assert res.parents[2].HasField("community")
        assert res.parents[2].community.community_id == c1r2_id
        assert res.parents[2].community.name == "Country 1, Region 2"
        assert res.parents[2].community.slug == "country-1-region-2"
        assert res.parents[2].community.description == "Description for Country 1, Region 2"
        assert res.parents[3].HasField("group")
        assert res.parents[3].group.group_id == c1r2foodies_id
        assert res.parents[3].group.name == "Country 1, Region 2, Foodies"
        assert res.parents[3].group.slug == "country-1-region-2-foodies"
        assert res.parents[3].group.description == "Description for Country 1, Region 2, Foodies"
        assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
        assert res.main_page.slug == "main-page-for-the-country-1-region-2-foodies-community"
        assert res.main_page.last_editor_user_id == 2
        assert res.main_page.creator_user_id == 2
        assert res.main_page.owner_user_id == 2
        assert res.main_page.title == "Main page for the Country 1, Region 2, Foodies community"
        assert res.main_page.content == "There is nothing here yet..."
        # assert res.main_page.can_edit # TODO
        assert lists_equal(res.main_page.editor_user_ids, [2])
        assert res.member
        assert res.admin
        assert res.member_count == 3
        assert res.admin_count == 1

        res = api.GetGroup(
            groups_pb2.GetGroupReq(
                group_id=c2r1foodies_id,
            )
        )
        print(res)
        assert res.group_id == c2r1foodies_id
        assert res.name == "Country 2, Region 1, Foodies"
        assert res.slug == "country-2-region-1-foodies"
        assert res.description == "Description for Country 2, Region 1, Foodies"
        assert len(res.parents) == 4
        assert res.parents[0].HasField("community")
        assert res.parents[0].community.community_id == w_id
        assert res.parents[0].community.name == "World"
        assert res.parents[0].community.slug == "world"
        assert res.parents[0].community.description == "Description for World"
        assert res.parents[1].HasField("community")
        assert res.parents[1].community.community_id == c2_id
        assert res.parents[1].community.name == "Country 2"
        assert res.parents[1].community.slug == "country-2"
        assert res.parents[1].community.description == "Description for Country 2"
        assert res.parents[2].HasField("community")
        assert res.parents[2].community.community_id == c2r1_id
        assert res.parents[2].community.name == "Country 2, Region 1"
        assert res.parents[2].community.slug == "country-2-region-1"
        assert res.parents[2].community.description == "Description for Country 2, Region 1"
        assert res.parents[3].HasField("group")
        assert res.parents[3].group.group_id == c2r1foodies_id
        assert res.parents[3].group.name == "Country 2, Region 1, Foodies"
        assert res.parents[3].group.slug == "country-2-region-1-foodies"
        assert res.parents[3].group.description == "Description for Country 2, Region 1, Foodies"
        assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
        assert res.main_page.slug == "main-page-for-the-country-2-region-1-foodies-community"
        assert res.main_page.last_editor_user_id == 6
        assert res.main_page.creator_user_id == 6
        assert res.main_page.owner_user_id == 6
        assert res.main_page.title == "Main page for the Country 2, Region 1, Foodies community"
        assert res.main_page.content == "There is nothing here yet..."
        # assert res.main_page.can_edit # TODO
        assert lists_equal(res.main_page.editor_user_ids, [6])
        assert not res.member
        assert not res.admin
        assert res.member_count == 2
        assert res.admin_count == 1


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
