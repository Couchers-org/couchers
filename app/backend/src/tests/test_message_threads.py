from datetime import timedelta
from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select

from couchers.db import session_scope
from couchers.helpers.host_requests import has_unseen_host_request_messages
from couchers.jobs.handlers import send_message_notifications
from couchers.models import HostRequest, NotificationTopicAction
from couchers.proto import api_pb2, conversations_pb2, notifications_pb2, requests_pb2
from couchers.utils import today
from tests.fixtures.db import generate_user
from tests.fixtures.misc import now_5_min_in_future, process_jobs
from tests.fixtures.sessions import (
    conversations_session,
    notifications_session,
    real_api_session,
    requests_session,
)
from tests.test_requests import valid_request_text


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _create_group_chat(token: str, recipient_ids: list[int], moderator, text: str = "hi") -> int:
    with conversations_session(token) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=recipient_ids))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text=text))
    moderator.approve_group_chat(res.group_chat_id)
    return int(res.group_chat_id)


def _create_host_request(surfer_token: str, host_id: int, moderator) -> int:
    with requests_session(surfer_token) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host_id,
                from_date=(today() + timedelta(days=5)).isoformat(),
                to_date=(today() + timedelta(days=10)).isoformat(),
                text=valid_request_text(),
            )
        )
    moderator.approve_host_request(res.host_request_id)
    return int(res.host_request_id)


def test_has_unseen_host_request_messages_is_false_for_a_non_party(db, moderator):
    user1, _token1 = generate_user()
    _user2, token2 = generate_user()
    outsider, _token3 = generate_user()

    conversation_id = _create_host_request(token2, user1.id, moderator)

    with session_scope() as session:
        unseen_for = {
            user_id: session.execute(
                select(HostRequest.conversation_id)
                .where(HostRequest.conversation_id == conversation_id)
                .where(has_unseen_host_request_messages(user_id))
            ).scalar_one_or_none()
            for user_id in (user1.id, outsider.id)
        }

    assert unseen_for[user1.id] == conversation_id
    assert unseen_for[outsider.id] is None


def test_mark_all_threads_seen_rejects_unspecified_category(db):
    _user1, token1 = generate_user()

    with conversations_session(token1) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.MarkAllThreadsSeen(
                conversations_pb2.MarkAllThreadsSeenReq(
                    categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_UNSPECIFIED]
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT


def test_mark_all_threads_seen_respects_categories(db, moderator):
    user1, token1 = generate_user()
    _user2, token2 = generate_user()

    # an unread group chat and an unread host request, both from user2
    _create_group_chat(token2, [user1.id], moderator, text="hello there")
    _create_host_request(token2, user1.id, moderator)

    def unseen() -> tuple[int, int]:
        with real_api_session(token1) as api:
            res = api.Ping(api_pb2.PingReq())
        return res.unseen_message_count, res.unseen_received_host_request_count

    assert unseen() == (2, 1)

    with conversations_session(token1) as c:
        c.MarkAllThreadsSeen(
            conversations_pb2.MarkAllThreadsSeenReq(categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_CHATS])
        )
    # the chat is now read; the host request is untouched
    assert unseen() == (0, 1)

    with conversations_session(token1) as c:
        c.MarkAllThreadsSeen(conversations_pb2.MarkAllThreadsSeenReq())
    assert unseen() == (0, 0)


def test_mark_all_threads_seen_respects_unread_and_archived_filters(db, moderator):
    user1, token1 = generate_user()
    _user2, token2 = generate_user()
    _user3, token3 = generate_user()

    archived_chat_id = _create_group_chat(token2, [user1.id], moderator, text="archived")
    _create_group_chat(token3, [user1.id], moderator, text="not archived")

    with conversations_session(token1) as c:
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=archived_chat_id, is_archived=True)
        )

    def unseen_chat_messages() -> int:
        with real_api_session(token1) as api:
            return int(api.Ping(api_pb2.PingReq()).unseen_message_count)

    # two messages in each chat: the creation notice and the text
    assert unseen_chat_messages() == 4

    with conversations_session(token1) as c:
        c.MarkAllThreadsSeen(conversations_pb2.MarkAllThreadsSeenReq(only_archived=True))
    assert unseen_chat_messages() == 2

    with conversations_session(token1) as c:
        c.MarkAllThreadsSeen(conversations_pb2.MarkAllThreadsSeenReq(only_unread=True))
    assert unseen_chat_messages() == 0


def test_mark_all_threads_seen_clears_departed_group_chat(db, moderator):
    """
    A viewer who was removed from a chat can only reach the messages sent before they left, so
    marking everything seen has to advance them to that message rather than to the chat's newest —
    otherwise the badge never clears.

    The viewer is removed rather than leaving, because leaving posts a message of your own, which
    marks everything up to it seen.
    """
    user1, token1 = generate_user()
    _user2, token2 = generate_user()
    user3, _token3 = generate_user()

    chat_id = _create_group_chat(token2, [user1.id, user3.id], moderator)

    with conversations_session(token2) as c:
        c.RemoveGroupChatUser(conversations_pb2.RemoveGroupChatUserReq(group_chat_id=chat_id, user_id=user1.id))
        for _ in range(3):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat_id, text="after you left"))

    def unseen_chat_messages() -> int:
        with real_api_session(token1) as api:
            return int(api.Ping(api_pb2.PingReq()).unseen_message_count)

    # chat created, "hi", and the removal notice; the three messages sent afterwards are out of reach
    assert unseen_chat_messages() == 3

    with conversations_session(token1) as c:
        c.MarkAllThreadsSeen(conversations_pb2.MarkAllThreadsSeenReq())
    assert unseen_chat_messages() == 0


def test_mark_all_threads_seen_advances_the_current_subscription(db, moderator):
    """
    Rejoining a chat leaves the earlier subscription behind with its own last-seen state. Only the
    current subscription is advanced, and the stale one must not hold the chat unread afterwards.
    """
    user1, token1 = generate_user()
    _user2, token2 = generate_user()
    user3, _token3 = generate_user()

    chat_id = _create_group_chat(token2, [user1.id, user3.id], moderator)

    # removed rather than leaving, so user1's first subscription is left behind with unread messages
    with conversations_session(token2) as c:
        c.RemoveGroupChatUser(conversations_pb2.RemoveGroupChatUserReq(group_chat_id=chat_id, user_id=user1.id))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat_id, text="while you were away"))
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=chat_id, user_id=user1.id))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat_id, text="welcome back"))

    def unseen_chat_messages() -> int:
        with real_api_session(token1) as api:
            return int(api.Ping(api_pb2.PingReq()).unseen_message_count)

    # only the invite notice and "welcome back" are in reach; the first stint's messages are not
    assert unseen_chat_messages() == 2

    with conversations_session(token1) as c:
        c.MarkAllThreadsSeen(conversations_pb2.MarkAllThreadsSeenReq())
    assert unseen_chat_messages() == 0


def test_mark_all_threads_seen_clears_missed_messages_notification(db, moderator):
    """
    Regression test: chat__missed_messages is a summary keyed with "" rather than a chat id, so it
    needs its own (topic actions, keys) group instead of being pooled with the per-chat keys.
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # this notification is email-only by default, and the in-app feed only shows push-enabled ones
    with notifications_session(token2) as n:
        n.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=NotificationTopicAction.chat__missed_messages.topic,
                        action=NotificationTopicAction.chat__missed_messages.action,
                        delivery_method="push",
                        enabled=True,
                    )
                ]
            )
        )

    _create_group_chat(token1, [user2.id], moderator, text="hello there")

    # the job only picks up messages that have been unseen for five minutes
    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        send_message_notifications(empty_pb2.Empty())
        process_jobs()

    def unseen_missed_messages():
        with notifications_session(token2) as n:
            res = n.ListNotifications(notifications_pb2.ListNotificationsReq(only_unread=True))
        return [
            notification
            for notification in res.notifications
            if notification.topic == NotificationTopicAction.chat__missed_messages.topic
            and notification.action == NotificationTopicAction.chat__missed_messages.action
        ]

    assert len(unseen_missed_messages()) == 1

    with conversations_session(token2) as c:
        c.MarkAllThreadsSeen(conversations_pb2.MarkAllThreadsSeenReq())

    assert unseen_missed_messages() == []
