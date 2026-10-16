import grpc
import pytest
from google.protobuf import wrappers_pb2
from sqlalchemy import select

from couchers.db import is_user_in_node_geography, session_scope
from couchers.models import (
    SignupFlow,
)
from couchers.proto import api_pb2, auth_pb2, communities_pb2, pages_pb2
from couchers.tasks import enforce_community_memberships
from tests.fixtures.communities import (
    create_1d_point,
    create_community,
    get_community_id,
    get_group_id,
)
from tests.fixtures.db import generate_user, get_user_id_and_token
from tests.fixtures.sessions import (
    auth_api_session,
    communities_session,
)
from tests.test_auth import get_session_cookie_tokens


class TestCommunities:
    @staticmethod
    def test_GetCommunity(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user2_id, token2 = get_user_id_and_token(session, "user2")
            user6_id, token6 = get_user_id_and_token(session, "user6")
            w_id = get_community_id(session, "Global")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")
            c2_id = get_community_id(session, "Country 2")

        with communities_session(token2) as api:
            res = api.GetCommunity(
                communities_pb2.GetCommunityReq(
                    community_id=w_id,
                )
            )
            assert res.name == "Global"
            assert res.slug == "global"
            assert res.description == "Description for Global"
            assert len(res.parents) == 1
            assert res.parents[0].HasField("community")
            assert res.parents[0].community.community_id == w_id
            assert res.parents[0].community.name == "Global"
            assert res.parents[0].community.slug == "global"
            assert res.parents[0].community.description == "Description for Global"
            assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
            assert res.main_page.slug == "main-page-for-the-global-community"
            assert res.main_page.last_editor_user_id == user1_id
            assert res.main_page.creator_user_id == user1_id
            assert res.main_page.owner_community_id == w_id
            assert res.main_page.title == "Main page for the Global community"
            assert res.main_page.content == "There is nothing here yet..."
            assert not res.main_page.can_edit
            assert not res.main_page.can_moderate
            assert res.main_page.editor_user_ids == [user1_id]
            assert res.member
            assert not res.admin
            assert res.member_count == 8
            assert res.admin_count == 3

            res = api.GetCommunity(
                communities_pb2.GetCommunityReq(
                    community_id=c1r1c1_id,
                )
            )
            assert res.community_id == c1r1c1_id
            assert res.name == "Country 1, Region 1, City 1"
            assert res.slug == "country-1-region-1-city-1"
            assert res.description == "Description for Country 1, Region 1, City 1"
            assert len(res.parents) == 4
            assert res.parents[0].HasField("community")
            assert res.parents[0].community.community_id == w_id
            assert res.parents[0].community.name == "Global"
            assert res.parents[0].community.slug == "global"
            assert res.parents[0].community.description == "Description for Global"
            assert res.parents[1].HasField("community")
            assert res.parents[1].community.community_id == c1_id
            assert res.parents[1].community.name == "Country 1"
            assert res.parents[1].community.slug == "country-1"
            assert res.parents[1].community.description == "Description for Country 1"
            assert res.parents[2].HasField("community")
            assert res.parents[2].community.community_id == c1r1_id
            assert res.parents[2].community.name == "Country 1, Region 1"
            assert res.parents[2].community.slug == "country-1-region-1"
            assert res.parents[2].community.description == "Description for Country 1, Region 1"
            assert res.parents[3].HasField("community")
            assert res.parents[3].community.community_id == c1r1c1_id
            assert res.parents[3].community.name == "Country 1, Region 1, City 1"
            assert res.parents[3].community.slug == "country-1-region-1-city-1"
            assert res.parents[3].community.description == "Description for Country 1, Region 1, City 1"
            assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
            assert res.main_page.slug == "main-page-for-the-country-1-region-1-city-1-community"
            assert res.main_page.last_editor_user_id == user2_id
            assert res.main_page.creator_user_id == user2_id
            assert res.main_page.owner_community_id == c1r1c1_id
            assert res.main_page.title == "Main page for the Country 1, Region 1, City 1 community"
            assert res.main_page.content == "There is nothing here yet..."
            assert res.main_page.can_edit
            assert res.main_page.can_moderate
            assert res.main_page.editor_user_ids == [user2_id]
            assert res.member
            assert res.admin
            assert res.member_count == 3
            assert res.admin_count == 1

            res = api.GetCommunity(
                communities_pb2.GetCommunityReq(
                    community_id=c2_id,
                )
            )
            assert res.community_id == c2_id
            assert res.name == "Country 2"
            assert res.slug == "country-2"
            assert res.description == "Description for Country 2"
            assert len(res.parents) == 2
            assert res.parents[0].HasField("community")
            assert res.parents[0].community.community_id == w_id
            assert res.parents[0].community.name == "Global"
            assert res.parents[0].community.slug == "global"
            assert res.parents[0].community.description == "Description for Global"
            assert res.parents[1].HasField("community")
            assert res.parents[1].community.community_id == c2_id
            assert res.parents[1].community.name == "Country 2"
            assert res.parents[1].community.slug == "country-2"
            assert res.parents[1].community.description == "Description for Country 2"
            assert res.main_page.type == pages_pb2.PAGE_TYPE_MAIN_PAGE
            assert res.main_page.slug == "main-page-for-the-country-2-community"
            assert res.main_page.last_editor_user_id == user6_id
            assert res.main_page.creator_user_id == user6_id
            assert res.main_page.owner_community_id == c2_id
            assert res.main_page.title == "Main page for the Country 2 community"
            assert res.main_page.content == "There is nothing here yet..."
            assert not res.main_page.can_edit
            assert not res.main_page.can_moderate
            assert res.main_page.editor_user_ids == [user6_id]
            assert not res.member
            assert not res.admin
            assert res.member_count == 2
            assert res.admin_count == 2

    @staticmethod
    def test_ListCommunities(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r2_id = get_community_id(session, "Country 1, Region 2")

        with communities_session(token1) as api:
            res = api.ListCommunities(
                communities_pb2.ListCommunitiesReq(
                    community_id=c1_id,
                )
            )
            assert [c.community_id for c in res.communities] == [c1r1_id, c1r2_id]

    @staticmethod
    def test_ListCommunities_all(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            w_id = get_community_id(session, "Global")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")
            c1r2_id = get_community_id(session, "Country 1, Region 2")
            c1r2c1_id = get_community_id(session, "Country 1, Region 2, City 1")
            c2_id = get_community_id(session, "Country 2")
            c2r1_id = get_community_id(session, "Country 2, Region 1")
            c2r1c1_id = get_community_id(session, "Country 2, Region 1, City 1")

        # Fetch all communities ordered by name
        with communities_session(token1) as api:
            res = api.ListCommunities(
                communities_pb2.ListCommunitiesReq(
                    page_size=5,
                )
            )
            assert [c.community_id for c in res.communities] == [c1_id, c1r1_id, c1r1c1_id, c1r1c2_id, c1r2_id]
            res = api.ListCommunities(
                communities_pb2.ListCommunitiesReq(
                    page_size=2,
                    page_token=res.next_page_token,
                )
            )
            assert [c.community_id for c in res.communities] == [c1r2c1_id, c2_id]
            res = api.ListCommunities(
                communities_pb2.ListCommunitiesReq(
                    page_size=5,
                    page_token=res.next_page_token,
                )
            )
            assert [c.community_id for c in res.communities] == [c2r1_id, c2r1c1_id, w_id]

    @staticmethod
    def test_ListUserCommunities(testing_communities):
        with session_scope() as session:
            user2_id, token2 = get_user_id_and_token(session, "user2")
            w_id = get_community_id(session, "Global")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")
            c1r2_id = get_community_id(session, "Country 1, Region 2")
            c1r2c1_id = get_community_id(session, "Country 1, Region 2, City 1")

        # Fetch user2's communities from user2's account
        with communities_session(token2) as api:
            res = api.ListUserCommunities(communities_pb2.ListUserCommunitiesReq())
            assert [c.community_id for c in res.communities] == [
                c1r1c1_id,
                c1r1c2_id,
                c1r2c1_id,
                c1r1_id,
                c1r2_id,
                c1_id,
                w_id,
            ]

            # paginated, with pages crossing node type boundaries
            res = api.ListUserCommunities(communities_pb2.ListUserCommunitiesReq(page_size=2))
            assert [c.community_id for c in res.communities] == [c1r1c1_id, c1r1c2_id]
            res = api.ListUserCommunities(
                communities_pb2.ListUserCommunitiesReq(page_size=2, page_token=res.next_page_token)
            )
            assert [c.community_id for c in res.communities] == [c1r2c1_id, c1r1_id]
            res = api.ListUserCommunities(
                communities_pb2.ListUserCommunitiesReq(page_size=2, page_token=res.next_page_token)
            )
            assert [c.community_id for c in res.communities] == [c1r2_id, c1_id]
            res = api.ListUserCommunities(
                communities_pb2.ListUserCommunitiesReq(page_size=2, page_token=res.next_page_token)
            )
            assert [c.community_id for c in res.communities] == [w_id]
            assert not res.next_page_token

    @staticmethod
    def test_ListOtherUserCommunities(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user2_id, token2 = get_user_id_and_token(session, "user2")
            w_id = get_community_id(session, "Global")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")
            c1r2_id = get_community_id(session, "Country 1, Region 2")
            c1r2c1_id = get_community_id(session, "Country 1, Region 2, City 1")

        # Fetch user2's communities from user1's account
        with communities_session(token1) as api:
            res = api.ListUserCommunities(communities_pb2.ListUserCommunitiesReq(user_id=user2_id))
            assert [c.community_id for c in res.communities] == [
                c1r1c1_id,
                c1r1c2_id,
                c1r2c1_id,
                c1r1_id,
                c1r2_id,
                c1_id,
                w_id,
            ]

    @staticmethod
    def test_ListGroups(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user5_id, token5 = get_user_id_and_token(session, "user5")
            w_id = get_community_id(session, "Global")
            hitchhikers_id = get_group_id(session, "Hitchhikers")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            foodies_id = get_group_id(session, "Country 1, Region 1, Foodies")
            skaters_id = get_group_id(session, "Country 1, Region 1, Skaters")

        with communities_session(token1) as api:
            res = api.ListGroups(
                communities_pb2.ListGroupsReq(
                    community_id=c1r1_id,
                )
            )
            assert [g.group_id for g in res.groups] == [foodies_id, skaters_id]

        with communities_session(token5) as api:
            res = api.ListGroups(
                communities_pb2.ListGroupsReq(
                    community_id=w_id,
                )
            )
            assert len(res.groups) == 1
            assert res.groups[0].group_id == hitchhikers_id

    @staticmethod
    def test_ListAdmins(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user3_id, token3 = get_user_id_and_token(session, "user3")
            user4_id, token4 = get_user_id_and_token(session, "user4")
            user5_id, token5 = get_user_id_and_token(session, "user5")
            user7_id, token7 = get_user_id_and_token(session, "user7")
            w_id = get_community_id(session, "Global")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token1) as api:
            res = api.ListAdmins(
                communities_pb2.ListAdminsReq(
                    community_id=w_id,
                )
            )
            assert res.admin_user_ids == [user1_id, user3_id, user7_id]

            res = api.ListAdmins(
                communities_pb2.ListAdminsReq(
                    community_id=c1r1c2_id,
                )
            )
            assert res.admin_user_ids == [user4_id, user5_id]

    @staticmethod
    def test_AddAdmin(testing_communities):
        with session_scope() as session:
            user4_id, token4 = get_user_id_and_token(session, "user4")
            user5_id, _ = get_user_id_and_token(session, "user5")
            user2_id, _ = get_user_id_and_token(session, "user2")
            user8_id, token8 = get_user_id_and_token(session, "user8")
            node_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token8) as api:
            with pytest.raises(grpc.RpcError) as err:
                api.AddAdmin(communities_pb2.AddAdminReq(community_id=node_id, user_id=user2_id))
            assert err.value.code() == grpc.StatusCode.FAILED_PRECONDITION
            assert err.value.details() == "You're not allowed to moderate that community"

        with communities_session(token4) as api:
            res = api.ListAdmins(communities_pb2.ListAdminsReq(community_id=node_id))
            assert res.admin_user_ids == [user4_id, user5_id]

            with pytest.raises(grpc.RpcError) as err:
                api.AddAdmin(communities_pb2.AddAdminReq(community_id=node_id, user_id=user8_id))
            assert err.value.code() == grpc.StatusCode.FAILED_PRECONDITION
            assert err.value.details() == "That user is not in the community."

            with pytest.raises(grpc.RpcError) as err:
                api.AddAdmin(communities_pb2.AddAdminReq(community_id=node_id, user_id=user5_id))
            assert err.value.code() == grpc.StatusCode.FAILED_PRECONDITION
            assert err.value.details() == "That user is already an admin."

            api.AddAdmin(communities_pb2.AddAdminReq(community_id=node_id, user_id=user2_id))
            res = api.ListAdmins(communities_pb2.ListAdminsReq(community_id=node_id))
            assert res.admin_user_ids == [user2_id, user4_id, user5_id]
            # Cleanup because database changes do not roll back
            api.RemoveAdmin(communities_pb2.RemoveAdminReq(community_id=node_id, user_id=user2_id))

    @staticmethod
    def test_RemoveAdmin(testing_communities):
        with session_scope() as session:
            user4_id, token4 = get_user_id_and_token(session, "user4")
            user5_id, _ = get_user_id_and_token(session, "user5")
            user2_id, _ = get_user_id_and_token(session, "user2")
            user8_id, token8 = get_user_id_and_token(session, "user8")
            node_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token8) as api:
            with pytest.raises(grpc.RpcError) as err:
                api.AddAdmin(communities_pb2.AddAdminReq(community_id=node_id, user_id=user2_id))
            assert err.value.code() == grpc.StatusCode.FAILED_PRECONDITION
            assert err.value.details() == "You're not allowed to moderate that community"

        with communities_session(token4) as api:
            res = api.ListAdmins(communities_pb2.ListAdminsReq(community_id=node_id))
            assert res.admin_user_ids == [user4_id, user5_id]

            with pytest.raises(grpc.RpcError) as err:
                api.RemoveAdmin(communities_pb2.RemoveAdminReq(community_id=node_id, user_id=user8_id))
            assert err.value.code() == grpc.StatusCode.FAILED_PRECONDITION
            assert err.value.details() == "That user is not in the community."

            with pytest.raises(grpc.RpcError) as err:
                api.RemoveAdmin(communities_pb2.RemoveAdminReq(community_id=node_id, user_id=user2_id))
            assert err.value.code() == grpc.StatusCode.FAILED_PRECONDITION
            assert err.value.details() == "That user is not an admin."

            api.RemoveAdmin(communities_pb2.RemoveAdminReq(community_id=node_id, user_id=user5_id))
            res = api.ListAdmins(communities_pb2.ListAdminsReq(community_id=node_id))
            assert res.admin_user_ids == [user4_id]
            # Cleanup because database changes do not roll back
            api.AddAdmin(communities_pb2.AddAdminReq(community_id=node_id, user_id=user5_id))

    @staticmethod
    def test_ListMembers(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user2_id, token2 = get_user_id_and_token(session, "user2")
            user3_id, token3 = get_user_id_and_token(session, "user3")
            user4_id, token4 = get_user_id_and_token(session, "user4")
            user5_id, token5 = get_user_id_and_token(session, "user5")
            user6_id, token6 = get_user_id_and_token(session, "user6")
            user7_id, token7 = get_user_id_and_token(session, "user7")
            user8_id, token8 = get_user_id_and_token(session, "user8")
            w_id = get_community_id(session, "Global")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token1) as api:
            res = api.ListMembers(
                communities_pb2.ListMembersReq(
                    community_id=w_id,
                )
            )
            assert res.member_user_ids == [
                user8_id,
                user7_id,
                user6_id,
                user5_id,
                user4_id,
                user3_id,
                user2_id,
                user1_id,
            ]

            res = api.ListMembers(
                communities_pb2.ListMembersReq(
                    community_id=c1r1c2_id,
                )
            )
            assert res.member_user_ids == [user5_id, user4_id, user2_id]

    @staticmethod
    def test_ListNearbyUsers(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user2_id, token2 = get_user_id_and_token(session, "user2")
            user3_id, token3 = get_user_id_and_token(session, "user3")
            user4_id, token4 = get_user_id_and_token(session, "user4")
            user5_id, token5 = get_user_id_and_token(session, "user5")
            user6_id, token6 = get_user_id_and_token(session, "user6")
            user7_id, token7 = get_user_id_and_token(session, "user7")
            user8_id, token8 = get_user_id_and_token(session, "user8")
            w_id = get_community_id(session, "Global")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token1) as api:
            res = api.ListNearbyUsers(
                communities_pb2.ListNearbyUsersReq(
                    community_id=w_id,
                )
            )
            assert res.nearby_user_ids == [
                user1_id,
                user2_id,
                user3_id,
                user4_id,
                user5_id,
                user6_id,
                user7_id,
                user8_id,
            ]

            res = api.ListNearbyUsers(
                communities_pb2.ListNearbyUsersReq(
                    community_id=c1r1c2_id,
                )
            )
            assert res.nearby_user_ids == [user4_id]

    @staticmethod
    def test_ListDiscussions(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            w_id = get_community_id(session, "Global")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

        with communities_session(token1) as api:
            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=w_id,
                    page_size=3,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 6",
                "Discussion title 5",
                "Discussion title 4",
            ]
            for d in res.discussions:
                assert d.thread.thread_id > 0
                assert d.thread.num_responses == 0

            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=w_id,
                    page_token=res.next_page_token,
                    page_size=2,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 3",
                "Discussion title 2",
            ]
            for d in res.discussions:
                assert d.thread.thread_id > 0
                assert d.thread.num_responses == 0

            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=w_id,
                    page_token=res.next_page_token,
                    page_size=2,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 1",
            ]
            for d in res.discussions:
                assert d.thread.thread_id > 0
                assert d.thread.num_responses == 0

            res = api.ListDiscussions(
                communities_pb2.ListDiscussionsReq(
                    community_id=c1r1c2_id,
                )
            )
            assert [d.title for d in res.discussions] == [
                "Discussion title 7",
            ]
            for d in res.discussions:
                assert d.thread.thread_id > 0
                assert d.thread.num_responses == 0

    @staticmethod
    def test_is_user_in_node_geography(testing_communities):
        with session_scope() as session:
            c1_id = get_community_id(session, "Country 1")

            user1_id, _ = get_user_id_and_token(session, "user1")
            user2_id, _ = get_user_id_and_token(session, "user2")
            user3_id, _ = get_user_id_and_token(session, "user3")
            user4_id, _ = get_user_id_and_token(session, "user4")
            user5_id, _ = get_user_id_and_token(session, "user5")

            # All these users should be in Country 1's geography
            assert is_user_in_node_geography(session, user1_id, c1_id)
            assert is_user_in_node_geography(session, user2_id, c1_id)
            assert is_user_in_node_geography(session, user3_id, c1_id)
            assert is_user_in_node_geography(session, user4_id, c1_id)
            assert is_user_in_node_geography(session, user5_id, c1_id)

    @staticmethod
    def test_ListEvents(testing_communities):
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            c1_id = get_community_id(session, "Country 1")

        with communities_session(token1) as api:
            res = api.ListEvents(
                communities_pb2.ListEventsReq(
                    community_id=c1_id,
                    page_size=3,
                )
            )
            assert [d.title for d in res.events] == [
                "Event title 1",
                "Event title 2",
                "Event title 3",
            ]

            res = api.ListEvents(
                communities_pb2.ListEventsReq(
                    community_id=c1_id,
                    page_token=res.next_page_token,
                    page_size=2,
                )
            )
            assert [d.title for d in res.events] == [
                "Event title 4",
                "Event title 5",
            ]

            res = api.ListEvents(
                communities_pb2.ListEventsReq(
                    community_id=c1_id,
                    page_token=res.next_page_token,
                    page_size=2,
                )
            )
            assert [d.title for d in res.events] == [
                "Event title 6",
            ]
            assert not res.next_page_token

    @staticmethod
    def test_empty_query_aborts(testing_communities):
        with session_scope() as session:
            _, token = get_user_id_and_token(session, "user1")

        with communities_session(token) as api:
            with pytest.raises(grpc.RpcError) as err:
                api.SearchCommunities(communities_pb2.SearchCommunitiesReq(query="   "))
            assert err.value.code() == grpc.StatusCode.INVALID_ARGUMENT
            assert err.value.details() == "Query must be at least 3 characters long."

    @staticmethod
    def test_min_length_lt_3_aborts(testing_communities):
        """
        len(query) < 3 → return INVALID_ARGUMENT: query_too_short
        """
        with session_scope() as session:
            _, token = get_user_id_and_token(session, "user1")

        with communities_session(token) as api:
            with pytest.raises(grpc.RpcError) as err:
                api.SearchCommunities(communities_pb2.SearchCommunitiesReq(query="zz", page_size=5))
            assert err.value.code() == grpc.StatusCode.INVALID_ARGUMENT
            assert err.value.details() == "Query must be at least 3 characters long."

    @staticmethod
    def test_typo_matches_existing_name(testing_communities):
        """
        Word_similarity should match a simple typo in community name.
        """
        with session_scope() as session:
            _, token = get_user_id_and_token(session, "user1")
            c1_id = get_community_id(session, "Country 1")

        with communities_session(token) as api:
            res = api.SearchCommunities(communities_pb2.SearchCommunitiesReq(query="Coutri 1", page_size=5))
            ids = [c.community_id for c in res.communities]
            assert c1_id in ids

    @staticmethod
    def test_word_similarity_matches_partial_word(testing_communities):
        """
        Query 'city' should match 'Country 1, Region 1, City 1'.
        """
        with session_scope() as session:
            _, token = get_user_id_and_token(session, "user1")
            city1_id = get_community_id(session, "Country 1, Region 1, City 1")  # переименовал для ясности

        with communities_session(token) as api:
            res = api.SearchCommunities(communities_pb2.SearchCommunitiesReq(query="city", page_size=5))
            ids = [c.community_id for c in res.communities]
            assert city1_id in ids

    @staticmethod
    def test_results_sorted_by_similarity(testing_communities):
        """
        Results should be ordered by similarity score (best match first).
        For query 'Country 1, Region', the full region name should rank higher
        than deeper descendants like 'City 1'.
        """
        with session_scope() as session:
            _, token = get_user_id_and_token(session, "user1")
            region_id = get_community_id(session, "Country 1, Region 1")
            city_id = get_community_id(session, "Country 1, Region 1, City 1")

        with communities_session(token) as api:
            res = api.SearchCommunities(communities_pb2.SearchCommunitiesReq(query="Country 1, Region", page_size=5))
            ids = [c.community_id for c in res.communities]

            assert region_id in ids
            assert city_id in ids
            assert ids.index(region_id) < ids.index(city_id)

    @staticmethod
    def test_no_results_returns_empty(testing_communities):
        """
        For a nonsense query that shouldn't meet the similarity threshold, return empty list.
        """
        with session_scope() as session:
            _, token = get_user_id_and_token(session, "user1")

        with communities_session(token) as api:
            res = api.SearchCommunities(communities_pb2.SearchCommunitiesReq(query="qwertyuiopasdf", page_size=5))
            assert res.communities == []

    @staticmethod
    def test_ListAllCommunities(testing_communities):
        """
        Test that ListAllCommunities returns all communities with proper hierarchy information.
        """
        with session_scope() as session:
            user1_id, token1 = get_user_id_and_token(session, "user1")
            user2_id, token2 = get_user_id_and_token(session, "user2")
            user6_id, token6 = get_user_id_and_token(session, "user6")
            w_id = get_community_id(session, "Global")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")
            c1r2_id = get_community_id(session, "Country 1, Region 2")
            c1r2c1_id = get_community_id(session, "Country 1, Region 2, City 1")
            c2_id = get_community_id(session, "Country 2")
            c2r1_id = get_community_id(session, "Country 2, Region 1")
            c2r1c1_id = get_community_id(session, "Country 2, Region 1, City 1")

        # Test with user1 who is a member of multiple communities
        with communities_session(token1) as api:
            res = api.ListAllCommunities(communities_pb2.ListAllCommunitiesReq())

            # Should return all 10 communities
            assert len(res.communities) == 10

            # Get all community IDs
            community_ids = [c.community_id for c in res.communities]
            assert set(community_ids) == {
                w_id,
                c1_id,
                c1r1_id,
                c1r1c1_id,
                c1r1c2_id,
                c1r2_id,
                c1r2c1_id,
                c2_id,
                c2r1_id,
                c2r1c1_id,
            }

            # Check that each community has the required fields
            for community in res.communities:
                assert community.community_id > 0
                assert len(community.name) > 0
                assert len(community.slug) > 0
                assert community.member_count > 0
                # member field should be a boolean
                assert isinstance(community.member, bool)
                # parents should be present for hierarchical ordering
                assert len(community.parents) >= 1
                # created timestamp should be present
                assert community.HasField("created")
                assert community.created.seconds > 0

            # Find specific communities and verify their data
            global_community = next(c for c in res.communities if c.community_id == w_id)
            assert global_community.name == "Global"
            assert global_community.slug == "global"
            assert global_community.member  # user1 is a member
            assert global_community.member_count == 8
            assert len(global_community.parents) == 1  # Only itself

            c1r1c1_community = next(c for c in res.communities if c.community_id == c1r1c1_id)
            assert c1r1c1_community.name == "Country 1, Region 1, City 1"
            assert c1r1c1_community.slug == "country-1-region-1-city-1"
            assert c1r1c1_community.member  # user1 is a member
            assert c1r1c1_community.member_count == 3
            assert len(c1r1c1_community.parents) == 4  # Global, Country 1, Region 1, City 1
            # Verify parent hierarchy
            assert c1r1c1_community.parents[0].community.community_id == w_id
            assert c1r1c1_community.parents[1].community.community_id == c1_id
            assert c1r1c1_community.parents[2].community.community_id == c1r1_id
            assert c1r1c1_community.parents[3].community.community_id == c1r1c1_id

        # Test with user6 who has different community memberships
        with communities_session(token6) as api:
            res = api.ListAllCommunities(communities_pb2.ListAllCommunitiesReq())

            # Should still return all 10 communities
            assert len(res.communities) == 10

            # Find Country 2 community - user6 should be a member
            c2_community = next(c for c in res.communities if c.community_id == c2_id)
            assert c2_community.member  # user6 is a member
            assert c2_community.member_count == 2

            # Find Country 1 - user6 should NOT be a member
            c1_community = next(c for c in res.communities if c.community_id == c1_id)
            assert not c1_community.member  # user6 is not a member

            # Global - user6 should be a member
            global_community = next(c for c in res.communities if c.community_id == w_id)
            assert global_community.member  # user6 is a member

    @staticmethod
    def test_ListRecentCommunities(testing_communities, monkeypatch):
        """
        ListRecentCommunities returns newest-first communities across the whole tree,
        honouring page_size.
        """
        with session_scope() as session:
            _, token = get_user_id_and_token(session, "user1")
            # communities are created in this order in the fixture, so creation
            # time ascends down the list
            w_id = get_community_id(session, "Global")
            c2_id = get_community_id(session, "Country 2")
            c2r1_id = get_community_id(session, "Country 2, Region 1")
            c2r1c1_id = get_community_id(session, "Country 2, Region 1, City 1")
            c1_id = get_community_id(session, "Country 1")
            c1r1_id = get_community_id(session, "Country 1, Region 1")
            c1r1c1_id = get_community_id(session, "Country 1, Region 1, City 1")
            c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")
            c1r2_id = get_community_id(session, "Country 1, Region 2")
            c1r2c1_id = get_community_id(session, "Country 1, Region 2, City 1")

        newest_first = [
            c1r2c1_id,
            c1r2_id,
            c1r1c2_id,
            c1r1c1_id,
            c1r1_id,
            c1_id,
            c2r1c1_id,
            c2r1_id,
            c2_id,
            w_id,
        ]

        with communities_session(token) as api:
            res = api.ListRecentCommunities(communities_pb2.ListRecentCommunitiesReq(page_size=3))
            assert [c.community_id for c in res.communities] == newest_first[:3]
            for community in res.communities:
                assert community.HasField("created")
                assert community.created.seconds > 0

            # default page size returns all communities for this fixture
            res = api.ListRecentCommunities(communities_pb2.ListRecentCommunitiesReq())
            assert [c.community_id for c in res.communities] == newest_first

            # page_size is clamped to MAX_PAGINATION_LENGTH on the server
            monkeypatch.setattr("couchers.servicers.communities.MAX_PAGINATION_LENGTH", 4)
            res = api.ListRecentCommunities(communities_pb2.ListRecentCommunitiesReq(page_size=1000))
            assert [c.community_id for c in res.communities] == newest_first[:4]
            # and also applies to the default when the request omits page_size
            res = api.ListRecentCommunities(communities_pb2.ListRecentCommunitiesReq())
            assert [c.community_id for c in res.communities] == newest_first[:4]


def test_JoinCommunity_and_LeaveCommunity(testing_communities):
    # these are separate as they mutate the database
    with session_scope() as session:
        # at x=1, inside c1 (country 1)
        user1_id, token1 = get_user_id_and_token(session, "user1")
        # at x=51, not inside c1
        user8_id, token8 = get_user_id_and_token(session, "user8")
        c1_id = get_community_id(session, "Country 1")

    with communities_session(token1) as api:
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user1 is already part of c1, cannot join
        with pytest.raises(grpc.RpcError) as e:
            res = api.JoinCommunity(
                communities_pb2.JoinCommunityReq(
                    community_id=c1_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You're already in that community."

        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user1 is inside c1, cannot leave
        with pytest.raises(grpc.RpcError) as e:
            res = api.LeaveCommunity(
                communities_pb2.LeaveCommunityReq(
                    community_id=c1_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert (
            e.value.details()
            == "Your location on your profile is within this community, so you cannot leave it. However, you can adjust your notifications in your account settings."
        )

        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

    with communities_session(token8) as api:
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user8 is not in c1 yet, cannot leave
        with pytest.raises(grpc.RpcError) as e:
            res = api.LeaveCommunity(
                communities_pb2.LeaveCommunityReq(
                    community_id=c1_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You're not in that community."

        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user8 is not in c1 and not part, can join
        res = api.JoinCommunity(
            communities_pb2.JoinCommunityReq(
                community_id=c1_id,
            )
        )

        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user8 is not in c1 and but now part, can't join again
        with pytest.raises(grpc.RpcError) as e:
            res = api.JoinCommunity(
                communities_pb2.JoinCommunityReq(
                    community_id=c1_id,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You're already in that community."

        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member

        # user8 is not in c1 yet, but part of it, can leave
        res = api.LeaveCommunity(
            communities_pb2.LeaveCommunityReq(
                community_id=c1_id,
            )
        )
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member


def test_LeaveCommunity_regression(db):
    # See github issue #1444, repro:
    # 1. Join more than one community
    # 2. Leave one of them
    # 3. You are no longer in any community
    # admin
    user1, token1 = generate_user(username="user1", geom=create_1d_point(200), geom_radius=0.1)
    # joiner/leaver
    user2, token2 = generate_user(username="user2", geom=create_1d_point(201), geom_radius=0.1)

    with session_scope() as session:
        c0 = create_community(session, 0, 100, "Community 0", [user1], [], None)
        c1 = create_community(session, 0, 50, "Community 1", [user1], [], c0)
        c2 = create_community(session, 0, 10, "Community 2", [user1], [], c0)
        c0_id = c0.id
        c1_id = c1.id
        c2_id = c2.id

    enforce_community_memberships()

    with communities_session(token1) as api:
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c0_id)).member
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c2_id)).member

    with communities_session(token2) as api:
        # first check we're not in any communities
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c0_id)).member
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c2_id)).member

        # join some communities
        api.JoinCommunity(communities_pb2.JoinCommunityReq(community_id=c1_id))
        api.JoinCommunity(communities_pb2.JoinCommunityReq(community_id=c2_id))

        # check memberships
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c0_id)).member
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c2_id)).member

        # leave just c2
        api.LeaveCommunity(communities_pb2.LeaveCommunityReq(community_id=c2_id))

        # check memberships
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c0_id)).member
        assert api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c1_id)).member
        assert not api.GetCommunity(communities_pb2.GetCommunityReq(community_id=c2_id)).member


def test_enforce_community_memberships_for_user(testing_communities, fast_passwords):
    """
    Make sure the user is added to the right communities on signup
    """
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                basic=auth_pb2.SignupBasic(name="testing", email="email@couchers.org.invalid"),
                account=auth_pb2.SignupAccount(
                    username="frodo",
                    password="a very insecure password",
                    birthdate="1970-01-01",
                    gender="Bot",
                    hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                    city="Country 1, Region 1, City 2",
                    # lat=8, lng=1 is equivalent to creating this coordinate with create_coordinate(8)
                    lat=8,
                    lng=1,
                    radius=500,
                    accept_tos=True,
                ),
                feedback=auth_pb2.ContributorForm(),
                accept_community_guidelines=wrappers_pb2.BoolValue(value=True),
                motivations=auth_pb2.SignupMotivations(motivations=["surfing"]),
            )
        )
    with session_scope() as session:
        email_token = (
            session.execute(select(SignupFlow).where(SignupFlow.flow_token == res.flow_token)).scalar_one().email_token
        )
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(auth_pb2.SignupFlowReq(email_token=email_token))
    user_id = res.auth_res.user_id

    # now check the user is in the right communities
    with session_scope() as session:
        w_id = get_community_id(session, "Global")
        c1_id = get_community_id(session, "Country 1")
        c1r1_id = get_community_id(session, "Country 1, Region 1")
        c1r1c2_id = get_community_id(session, "Country 1, Region 1, City 2")

    token, _ = get_session_cookie_tokens(metadata_interceptor)

    with communities_session(token) as api:
        res = api.ListUserCommunities(communities_pb2.ListUserCommunitiesReq())
        assert [c.community_id for c in res.communities] == [c1r1c2_id, c1r1_id, c1_id, w_id]


# TODO: requires transferring of content

# def test_ListPlaces(db, testing_communities):
#     pass

# def test_ListGuides(db, testing_communities):
#     pass

# def test_ListEvents(db, testing_communities):
#     pass
