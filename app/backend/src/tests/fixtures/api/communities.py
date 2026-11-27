from contextlib import contextmanager
from typing import cast

import grpc

from couchers.proto import communities_pb2, communities_pb2_grpc
from couchers.servicers.communities import Communities
from tests.fixtures.sessions import FakeChannel


@contextmanager
def _communities_session(token: str):
    channel = FakeChannel(token)
    communities_pb2_grpc.add_CommunitiesServicer_to_server(Communities(), cast(grpc.Server, channel))
    yield communities_pb2_grpc.CommunitiesStub(cast(grpc.Channel, channel))


def get_community(*, token: str, community_id: int) -> communities_pb2.Community:
    with _communities_session(token) as session:
        res: communities_pb2.Community = session.GetCommunity(
            communities_pb2.GetCommunityReq(community_id=community_id)
        )
    return res


def list_communities(
    *,
    token: str,
    # None lists all communities.
    community_id: int | None = None,
    page_size: int | None = None,
    page_token: str | None = None,
) -> communities_pb2.ListCommunitiesRes:
    with _communities_session(token) as session:
        res: communities_pb2.ListCommunitiesRes = session.ListCommunities(
            communities_pb2.ListCommunitiesReq(community_id=community_id, page_size=page_size, page_token=page_token)
        )
    return res


def list_user_communities(
    *,
    token: str,
    # None lists the communities of the calling user.
    user_id: int | None = None,
    page_size: int | None = None,
    page_token: str | None = None,
) -> communities_pb2.ListUserCommunitiesRes:
    with _communities_session(token) as session:
        res: communities_pb2.ListUserCommunitiesRes = session.ListUserCommunities(
            communities_pb2.ListUserCommunitiesReq(user_id=user_id, page_size=page_size, page_token=page_token)
        )
    return res


def list_groups(
    *, token: str, community_id: int, page_size: int | None = None, page_token: str | None = None
) -> communities_pb2.ListGroupsRes:
    with _communities_session(token) as session:
        res: communities_pb2.ListGroupsRes = session.ListGroups(
            communities_pb2.ListGroupsReq(community_id=community_id, page_size=page_size, page_token=page_token)
        )
    return res


def list_admins(
    *, token: str, community_id: int, page_size: int | None = None, page_token: str | None = None
) -> communities_pb2.ListAdminsRes:
    with _communities_session(token) as session:
        res: communities_pb2.ListAdminsRes = session.ListAdmins(
            communities_pb2.ListAdminsReq(community_id=community_id, page_size=page_size, page_token=page_token)
        )
    return res


def add_admin(*, token: str, community_id: int, user_id: int) -> None:
    with _communities_session(token) as session:
        session.AddAdmin(communities_pb2.AddAdminReq(community_id=community_id, user_id=user_id))


def remove_admin(*, token: str, community_id: int, user_id: int) -> None:
    with _communities_session(token) as session:
        session.RemoveAdmin(communities_pb2.RemoveAdminReq(community_id=community_id, user_id=user_id))


def list_members(
    *, token: str, community_id: int, page_size: int | None = None, page_token: str | None = None
) -> communities_pb2.ListMembersRes:
    with _communities_session(token) as session:
        res: communities_pb2.ListMembersRes = session.ListMembers(
            communities_pb2.ListMembersReq(community_id=community_id, page_size=page_size, page_token=page_token)
        )
    return res


def list_nearby_users(
    *, token: str, community_id: int, page_size: int | None = None, page_token: str | None = None
) -> communities_pb2.ListNearbyUsersRes:
    with _communities_session(token) as session:
        res: communities_pb2.ListNearbyUsersRes = session.ListNearbyUsers(
            communities_pb2.ListNearbyUsersReq(community_id=community_id, page_size=page_size, page_token=page_token)
        )
    return res


def list_events(
    *,
    token: str,
    community_id: int,
    past: bool = False,
    include_parents: bool = False,
    page_size: int | None = None,
    page_token: str | None = None,
) -> communities_pb2.ListEventsRes:
    with _communities_session(token) as session:
        res: communities_pb2.ListEventsRes = session.ListEvents(
            communities_pb2.ListEventsReq(
                community_id=community_id,
                past=past,
                include_parents=include_parents,
                page_size=page_size,
                page_token=page_token,
            )
        )
    return res


def list_discussions(
    *, token: str, community_id: int, page_size: int | None = None, page_token: str | None = None
) -> communities_pb2.ListDiscussionsRes:
    with _communities_session(token) as session:
        res: communities_pb2.ListDiscussionsRes = session.ListDiscussions(
            communities_pb2.ListDiscussionsReq(community_id=community_id, page_size=page_size, page_token=page_token)
        )
    return res


def join_community(*, token: str, community_id: int) -> None:
    with _communities_session(token) as session:
        session.JoinCommunity(communities_pb2.JoinCommunityReq(community_id=community_id))


def leave_community(*, token: str, community_id: int) -> None:
    with _communities_session(token) as session:
        session.LeaveCommunity(communities_pb2.LeaveCommunityReq(community_id=community_id))


def search_communities(*, token: str, query: str, page_size: int | None = None) -> communities_pb2.SearchCommunitiesRes:
    with _communities_session(token) as session:
        res: communities_pb2.SearchCommunitiesRes = session.SearchCommunities(
            communities_pb2.SearchCommunitiesReq(query=query, page_size=page_size)
        )
    return res


def list_all_communities(*, token: str) -> communities_pb2.ListAllCommunitiesRes:
    with _communities_session(token) as session:
        res: communities_pb2.ListAllCommunitiesRes = session.ListAllCommunities(communities_pb2.ListAllCommunitiesReq())
    return res


def list_recent_communities(*, token: str, page_size: int | None = None) -> communities_pb2.ListRecentCommunitiesRes:
    with _communities_session(token) as session:
        res: communities_pb2.ListRecentCommunitiesRes = session.ListRecentCommunities(
            communities_pb2.ListRecentCommunitiesReq(page_size=page_size)
        )
    return res
