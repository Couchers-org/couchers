from contextlib import contextmanager
from typing import cast

import grpc

from couchers.proto import groups_pb2, groups_pb2_grpc
from couchers.servicers.groups import Groups
from tests.fixtures.sessions import FakeChannel


@contextmanager
def _groups_session(token: str):
    channel = FakeChannel(token)
    groups_pb2_grpc.add_GroupsServicer_to_server(Groups(), cast(grpc.Server, channel))
    yield groups_pb2_grpc.GroupsStub(cast(grpc.Channel, channel))


def get_group(*, token: str, group_id: int) -> groups_pb2.Group:
    with _groups_session(token) as session:
        res: groups_pb2.Group = session.GetGroup(groups_pb2.GetGroupReq(group_id=group_id))
    return res


def list_admins(
    *, token: str, group_id: int, page_size: int | None = None, page_token: str | None = None
) -> groups_pb2.ListAdminsRes:
    with _groups_session(token) as session:
        res: groups_pb2.ListAdminsRes = session.ListAdmins(
            groups_pb2.ListAdminsReq(group_id=group_id, page_size=page_size, page_token=page_token)
        )
    return res


def list_members(
    *, token: str, group_id: int, page_size: int | None = None, page_token: str | None = None
) -> groups_pb2.ListMembersRes:
    with _groups_session(token) as session:
        res: groups_pb2.ListMembersRes = session.ListMembers(
            groups_pb2.ListMembersReq(group_id=group_id, page_size=page_size, page_token=page_token)
        )
    return res


def list_events(
    *,
    token: str,
    group_id: int,
    past: bool | None = None,
    page_size: int | None = None,
    page_token: str | None = None,
) -> groups_pb2.ListEventsRes:
    with _groups_session(token) as session:
        res: groups_pb2.ListEventsRes = session.ListEvents(
            groups_pb2.ListEventsReq(group_id=group_id, past=past, page_size=page_size, page_token=page_token)
        )
    return res


def list_discussions(
    *, token: str, group_id: int, page_size: int | None = None, page_token: str | None = None
) -> groups_pb2.ListDiscussionsRes:
    with _groups_session(token) as session:
        res: groups_pb2.ListDiscussionsRes = session.ListDiscussions(
            groups_pb2.ListDiscussionsReq(group_id=group_id, page_size=page_size, page_token=page_token)
        )
    return res


def join_group(*, token: str, group_id: int) -> None:
    with _groups_session(token) as session:
        session.JoinGroup(groups_pb2.JoinGroupReq(group_id=group_id))


def leave_group(*, token: str, group_id: int) -> None:
    with _groups_session(token) as session:
        session.LeaveGroup(groups_pb2.LeaveGroupReq(group_id=group_id))


def list_user_groups(
    *, token: str, user_id: int | None = None, page_size: int | None = None, page_token: str | None = None
) -> groups_pb2.ListUserGroupsRes:
    with _groups_session(token) as session:
        res: groups_pb2.ListUserGroupsRes = session.ListUserGroups(
            groups_pb2.ListUserGroupsReq(user_id=user_id, page_size=page_size, page_token=page_token)
        )
    return res
