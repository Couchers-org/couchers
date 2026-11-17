from collections.abc import Sequence
from contextlib import contextmanager
from datetime import timedelta
from typing import cast

import grpc
from google.protobuf import duration_pb2, wrappers_pb2

from couchers.proto import conversations_pb2, conversations_pb2_grpc
from couchers.servicers.conversations import Conversations
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import FakeChannel


@contextmanager
def _conversations_session(token: str):
    channel = FakeChannel(token)
    conversations_pb2_grpc.add_ConversationsServicer_to_server(Conversations(), cast(grpc.Server, channel))
    yield conversations_pb2_grpc.ConversationsStub(cast(grpc.Channel, channel))


def list_group_chats(
    *,
    token: str,
    last_message_id: int | None = None,
    number: int | None = None,
    only_archived: bool | None = None,
) -> conversations_pb2.ListGroupChatsRes:
    with _conversations_session(token) as session:
        res: conversations_pb2.ListGroupChatsRes = session.ListGroupChats(
            conversations_pb2.ListGroupChatsReq(
                last_message_id=last_message_id, number=number, only_archived=only_archived
            )
        )
    return res


def list_message_threads(
    *,
    token: str,
    page_size: int | None = None,
    page_token: str | None = None,
    categories: Sequence[conversations_pb2.MessageThreadCategory.ValueType] | None = None,
    only_archived: bool | None = None,
    only_unread: bool = False,
) -> conversations_pb2.ListMessageThreadsRes:
    with _conversations_session(token) as session:
        res: conversations_pb2.ListMessageThreadsRes = session.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(
                page_size=page_size,
                page_token=page_token,
                categories=categories,
                only_archived=only_archived,
                only_unread=only_unread,
            )
        )
    return res


def mark_all_threads_seen(
    *,
    token: str,
    categories: Sequence[conversations_pb2.MessageThreadCategory.ValueType] | None = None,
    only_archived: bool | None = None,
    only_unread: bool = False,
) -> None:
    with _conversations_session(token) as session:
        session.MarkAllThreadsSeen(
            conversations_pb2.MarkAllThreadsSeenReq(
                categories=categories, only_archived=only_archived, only_unread=only_unread
            )
        )


def get_group_chat(*, token: str, group_chat_id: int) -> conversations_pb2.GroupChat:
    with _conversations_session(token) as session:
        group_chat: conversations_pb2.GroupChat = session.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id)
        )
    return group_chat


def get_direct_message(*, token: str, user_id: int) -> conversations_pb2.GroupChat:
    with _conversations_session(token) as session:
        group_chat: conversations_pb2.GroupChat = session.GetDirectMessage(
            conversations_pb2.GetDirectMessageReq(user_id=user_id)
        )
    return group_chat


def get_updates(*, token: str, newest_message_id: int = 0) -> conversations_pb2.GetUpdatesRes:
    with _conversations_session(token) as session:
        res: conversations_pb2.GetUpdatesRes = session.GetUpdates(
            conversations_pb2.GetUpdatesReq(newest_message_id=newest_message_id)
        )
    return res


def get_group_chat_messages(
    *,
    token: str,
    group_chat_id: int,
    last_message_id: int | None = None,
    number: int | None = None,
    only_unseen: bool = False,
) -> conversations_pb2.GetGroupChatMessagesRes:
    with _conversations_session(token) as session:
        res: conversations_pb2.GetGroupChatMessagesRes = session.GetGroupChatMessages(
            conversations_pb2.GetGroupChatMessagesReq(
                group_chat_id=group_chat_id, last_message_id=last_message_id, number=number, only_unseen=only_unseen
            )
        )
    return res


def mark_last_seen_group_chat(*, token: str, group_chat_id: int, last_seen_message_id: int) -> None:
    with _conversations_session(token) as session:
        session.MarkLastSeenGroupChat(
            conversations_pb2.MarkLastSeenGroupChatReq(
                group_chat_id=group_chat_id, last_seen_message_id=last_seen_message_id
            )
        )


def mute_group_chat(
    *,
    token: str,
    group_chat_id: int,
    # Exactly one of these should be set, mirroring the request's oneof.
    unmute: bool | None = None,
    forever: bool | None = None,
    for_duration: timedelta | None = None,
) -> None:
    with _conversations_session(token) as session:
        session.MuteGroupChat(
            conversations_pb2.MuteGroupChatReq(
                group_chat_id=group_chat_id,
                unmute=unmute,
                forever=forever,
                for_duration=duration_pb2.Duration(seconds=int(for_duration.total_seconds()))
                if for_duration is not None
                else None,
            )
        )


def set_group_chat_archive_status(
    *, token: str, group_chat_id: int, is_archived: bool
) -> conversations_pb2.SetGroupChatArchiveStatusRes:
    with _conversations_session(token) as session:
        res: conversations_pb2.SetGroupChatArchiveStatusRes = session.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=group_chat_id, is_archived=is_archived)
        )
    return res


def create_group_chat(
    *,
    token: str,
    recipient_user_ids: Sequence[int],
    title: str | None = None,
    approve_by: Moderator | None = None,
) -> conversations_pb2.GroupChat:
    with _conversations_session(token) as session:
        group_chat: conversations_pb2.GroupChat = session.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                title=wrappers_pb2.StringValue(value=title) if title is not None else None,
                recipient_user_ids=recipient_user_ids,
            )
        )

    if approve_by is not None:
        approve_by.approve_group_chat(group_chat.group_chat_id)

    return group_chat


def edit_group_chat(
    *,
    token: str,
    group_chat_id: int,
    # None leaves the field unchanged.
    title: str | None = None,
    only_admins_invite: bool | None = None,
) -> None:
    with _conversations_session(token) as session:
        session.EditGroupChat(
            conversations_pb2.EditGroupChatReq(
                group_chat_id=group_chat_id,
                title=wrappers_pb2.StringValue(value=title) if title is not None else None,
                only_admins_invite=wrappers_pb2.BoolValue(value=only_admins_invite)
                if only_admins_invite is not None
                else None,
            )
        )


def invite_to_group_chat(*, token: str, group_chat_id: int, user_id: int) -> None:
    with _conversations_session(token) as session:
        session.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user_id))


def make_group_chat_admin(*, token: str, group_chat_id: int, user_id: int) -> None:
    with _conversations_session(token) as session:
        session.MakeGroupChatAdmin(
            conversations_pb2.MakeGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user_id)
        )


def remove_group_chat_user(*, token: str, group_chat_id: int, user_id: int) -> None:
    with _conversations_session(token) as session:
        session.RemoveGroupChatUser(
            conversations_pb2.RemoveGroupChatUserReq(group_chat_id=group_chat_id, user_id=user_id)
        )


def remove_group_chat_admin(*, token: str, group_chat_id: int, user_id: int) -> None:
    with _conversations_session(token) as session:
        session.RemoveGroupChatAdmin(
            conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user_id)
        )


def send_message(*, token: str, group_chat_id: int, text: str = "Dummy message.") -> None:
    with _conversations_session(token) as session:
        session.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text=text))


def send_direct_message(*, token: str, recipient_user_id: int, text: str = "Dummy message.") -> int:
    with _conversations_session(token) as session:
        res: conversations_pb2.SendDirectMessageRes = session.SendDirectMessage(
            conversations_pb2.SendDirectMessageReq(recipient_user_id=recipient_user_id, text=text)
        )
    return res.group_chat_id


def leave_group_chat(*, token: str, group_chat_id: int) -> None:
    with _conversations_session(token) as session:
        session.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))


def search_messages(
    *, token: str, query: str, last_message_id: int | None = None, number: int | None = None
) -> conversations_pb2.SearchMessagesRes:
    with _conversations_session(token) as session:
        res: conversations_pb2.SearchMessagesRes = session.SearchMessages(
            conversations_pb2.SearchMessagesReq(query=query, last_message_id=last_message_id, number=number)
        )
    return res
