import grpc
import pytest

from couchers import errors
from couchers.db import get_user_by_field, session_scope
from pb import groups_pb2, pages_pb2
from tests.test_communities import get_community_id, get_group_id, get_user_id_and_token, testing_communities
from tests.test_fixtures import groups_session, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


class TestGroups:
    @staticmethod
    def test_GetGroup(testing_communities):
        with session_scope() as session:
            user2_id, token2 = get_user_id_and_token(session, "user2")
            w_id = get_community_id(session, "World")
            c1_id = get_community_id(session, "Country 1")
            c2_id = get_community_id(session, "Country 2")
            c1r2_id = get_community_id(session, "Country 1, Region 2")
            c2r1_id = get_community_id(session, "Country 2, Region 1")
            hitchhikers_id = get_group_id(session, "Hitchhikers")
            c1r2foodies_id = get_group_id(session, "Country 1, Region 2, Foodies")
            c2r1foodies_id = get_group_id(session, "Country 2, Region 1, Foodies")

        with groups_session(token2) as api:
            res = api.GetGroup(
                groups_pb2.GetGroupReq(
                    group_id=hitchhikers_id,
                )
            )
            assert res.group_id == hitchhikers_id
            assert res.name == "Hitchhikers"
            assert res.slug == "hitchhikers"
            assert res.description == "Description for Hitchhikers"
            assert len(res.parents) == 2
            assert res.parents[0].HasField("community")
            assert res.parents[0].community.community_id == w_id
            assert res.parents[0].community.name == "World"
            assert res.parents[0].community.slug == "world"
            assert res.parents[0].community.description == "Description for World"
            assert res.parents[1].HasField("group")
            assert res.parents[1].group.group_id == hitchhikers_id
            assert res.parents[1].group.name == "Hitchhikers"
            assert res.parents[1].group.slug == "hitchhikers"
            assert res.parents[1].group.description == "Description for Hitchhikers"
            assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
            assert res.main_page.slug == "main-page-for-the-hitchhikers-community"
            assert res.main_page.last_editor_user_id == 1
            assert res.main_page.creator_user_id == 1
            assert res.main_page.owner_group_id == hitchhikers_id
            assert res.main_page.title == "Main page for the Hitchhikers community"
            assert res.main_page.content == "There is nothing here yet..."
            assert res.main_page.can_edit
            assert not res.main_page.can_moderate
            assert res.main_page.editor_user_ids == [1]
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
            assert res.main_page.owner_group_id == c1r2foodies_id
            assert res.main_page.title == "Main page for the Country 1, Region 2, Foodies community"
            assert res.main_page.content == "There is nothing here yet..."
            assert res.main_page.can_edit
            assert res.main_page.can_moderate
            assert res.main_page.editor_user_ids == [2]
            assert res.member
            assert res.admin
            assert res.member_count == 3
            assert res.admin_count == 1

            res = api.GetGroup(
                groups_pb2.GetGroupReq(
                    group_id=c2r1foodies_id,
                )
            )
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
            assert res.main_page.owner_group_id == c2r1foodies_id
            assert res.main_page.title == "Main page for the Country 2, Region 1, Foodies community"
            assert res.main_page.content == "There is nothing here yet..."
            assert not res.main_page.can_edit
            assert not res.main_page.can_moderate
            assert res.main_page.editor_user_ids == [6]
            assert not res.member
            assert not res.admin
            assert res.member_count == 2
            assert res.admin_count == 1

    @staticmethod
    def test_ListDiscussions(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            hitchhikers_id = get_group_id(session, "Hitchhikers")

        with groups_session(token1) as api:
            res = api.ListDiscussions(
                groups_pb2.ListDiscussionsReq(
                    group_id=hitchhikers_id,
                    page_size=5,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 8",
                "Discussion title 9",
                "Discussion title 10",
                "Discussion title 11",
                "Discussion title 12",
            ]
            res = api.ListDiscussions(
                groups_pb2.ListDiscussionsReq(
                    group_id=hitchhikers_id,
                    page_token=res.next_page_token,
                    page_size=5,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 13",
                "Discussion title 14",
            ]

    @staticmethod
    def test_ListUserGroups(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            hitchhikers_id = get_group_id(session, "Hitchhikers")
            foodies_id = get_group_id(session, "Country 1, Region 1, Foodies")
            skaters_id = get_group_id(session, "Country 1, Region 1, Skaters")

        # List user1's groups from user1's account
        with groups_session(token1) as api:
            res = api.ListUserGroups(groups_pb2.ListUserGroupsReq())
            assert [g.group_id for g in res.groups] == [hitchhikers_id, foodies_id, skaters_id]

    @staticmethod
    def test_ListOtherUserGroups(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user2_id, token2 = get_user_id_and_token(session, "user2")
            hitchhikers_id = get_group_id(session, "Hitchhikers")
            foodies_id = get_group_id(session, "Country 1, Region 1, Foodies")
            skaters_id = get_group_id(session, "Country 1, Region 1, Skaters")

        # List user1's groups from user2's account
        with groups_session(token2) as api:
            res = api.ListUserGroups(groups_pb2.ListUserGroupsReq(user_id=user1_id))
            assert [g.group_id for g in res.groups] == [hitchhikers_id, foodies_id, skaters_id]


# These tests are separate from above as they mutate the database
def test_ListAdmins(testing_communities):
    with session_scope() as session:
        user1_id, token1 = get_user_id_and_token(session, "user1")
        user2_id, token2 = get_user_id_and_token(session, "user2")
        hitchhikers_id = get_group_id(session, "Hitchhikers")
        c1r2foodies_id = get_group_id(session, "Country 1, Region 2, Foodies")

    with groups_session(token1) as api:
        res = api.ListAdmins(
            groups_pb2.ListAdminsReq(
                group_id=hitchhikers_id,
            )
        )
        assert res.admin_user_ids == [user1_id, user2_id]

        res = api.ListAdmins(
            groups_pb2.ListAdminsReq(
                group_id=c1r2foodies_id,
            )
        )
        assert res.admin_user_ids == [user2_id]

    # Hide user2
    with session_scope() as session:
        user2 = get_user_by_field(session, str(user2_id))
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

    # Check user2 invisible
    with groups_session(token1) as api:
        res = api.ListAdmins(
            groups_pb2.ListAdminsReq(
                group_id=hitchhikers_id,
            )
        )
        assert res.admin_user_ids == [user1_id]

        res = api.ListAdmins(
            groups_pb2.ListAdminsReq(
                group_id=c1r2foodies_id,
            )
        )
        assert res.admin_user_ids == []


def test_ListMembers(testing_communities):
    with session_scope() as session:
        user1_id, token1 = get_user_id_and_token(session, "user1")
        user2_id, token2 = get_user_id_and_token(session, "user2")
        user4_id, token4 = get_user_id_and_token(session, "user4")
        user5_id, token5 = get_user_id_and_token(session, "user5")
        user8_id, token8 = get_user_id_and_token(session, "user8")
        hitchhikers_id = get_group_id(session, "Hitchhikers")
        c1r2foodies_id = get_group_id(session, "Country 1, Region 2, Foodies")

    with groups_session(token1) as api:
        res = api.ListMembers(
            groups_pb2.ListMembersReq(
                group_id=hitchhikers_id,
            )
        )
        assert res.member_user_ids == [user1_id, user2_id, user5_id, user8_id]

        res = api.ListMembers(
            groups_pb2.ListMembersReq(
                group_id=c1r2foodies_id,
            )
        )
        assert res.member_user_ids == [user2_id, user4_id, user5_id]

    # Hide user2
    with session_scope() as session:
        user2 = get_user_by_field(session, str(user2_id))
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

    # Check user2 invisible
    with groups_session(token1) as api:
        res = api.ListMembers(
            groups_pb2.ListMembersReq(
                group_id=hitchhikers_id,
            )
        )
        assert res.member_user_ids == [user1_id, user5_id, user8_id]

        res = api.ListMembers(
            groups_pb2.ListMembersReq(
                group_id=c1r2foodies_id,
            )
        )
        assert res.member_user_ids == [user4_id, user5_id]


def test_JoinGroup_and_LeaveGroup(testing_communities):
    with session_scope() as session:
        user_id, token = get_user_id_and_token(session, "user3")
        h_id = get_group_id(session, "Hitchhikers")

    with groups_session(token) as api:
        # not in group at start
        assert not api.GetGroup(groups_pb2.GetGroupReq(group_id=h_id)).member

        # can't leave
        with pytest.raises(grpc.RpcError) as e:
            res = api.LeaveGroup(
                groups_pb2.LeaveGroupReq(
                    group_id=h_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.NOT_IN_GROUP

        # didn't magically join
        assert not api.GetGroup(groups_pb2.GetGroupReq(group_id=h_id)).member

        # but can join
        res = api.JoinGroup(
            groups_pb2.JoinGroupReq(
                group_id=h_id,
            )
        )

        # should be there now
        assert api.GetGroup(groups_pb2.GetGroupReq(group_id=h_id)).member

        # can't join again
        with pytest.raises(grpc.RpcError) as e:
            res = api.JoinGroup(
                groups_pb2.JoinGroupReq(
                    group_id=h_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.ALREADY_IN_GROUP

        # didn't magically leave
        assert api.GetGroup(groups_pb2.GetGroupReq(group_id=h_id)).member

        # now we can leave though
        res = api.LeaveGroup(
            groups_pb2.LeaveGroupReq(
                group_id=h_id,
            )
        )

        # managed to leave
        assert not api.GetGroup(groups_pb2.GetGroupReq(group_id=h_id)).member


def test_invisible_user_JoinGroup_LeaveGroup(testing_communities):
    with session_scope() as session:
        user1_id, token1 = get_user_id_and_token(session, "user2")  # In group
        user2_id, token2 = get_user_id_and_token(session, "user3")  # Not in group
        h_id = get_group_id(session, "Hitchhikers")

        user1 = get_user_by_field(session, str(user1_id))
        user1.is_banned = True
        session.commit()
        session.refresh(user1)
        session.expunge(user1)

        user2 = get_user_by_field(session, str(user2_id))
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

        # User1 in group, testing removal
        with groups_session(token1) as api:
            with pytest.raises(grpc.RpcError) as e:
                api.LeaveGroup(
                    groups_pb2.LeaveGroupReq(
                        group_id=h_id,
                    )
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == errors.USER_NOT_FOUND

        # User2 not in group, testing addition
        with groups_session(token2) as api:
            with pytest.raises(grpc.RpcError) as e:
                api.JoinGroup(
                    groups_pb2.JoinGroupReq(
                        group_id=h_id,
                    )
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == errors.USER_NOT_FOUND


# TODO: also requires implementing content transfer functionality
# Note: allegedly groups cannot contain content other than discussions!

# def test_ListPlaces(db, testing_communities):
#     pass

# def test_ListGuides(db, testing_communities):
#     pass

# def test_ListEvents(db, testing_communities):
#     pass
