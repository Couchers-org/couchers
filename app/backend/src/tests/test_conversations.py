from datetime import timedelta

import grpc
import pytest
from google.protobuf import wrappers_pb2
from sqlalchemy import func, select

from couchers.db import session_scope
from couchers.jobs.worker import process_job
from couchers.models import (
    GroupChatRole,
    GroupChatSubscription,
    Notification,
    NotificationDelivery,
    NotificationDeliveryType,
    NotificationTopicAction,
    RateLimitAction,
)
from couchers.proto import api_pb2, conversations_pb2, notification_data_pb2, notifications_pb2
from couchers.rate_limits.definitions import RATE_LIMIT_DEFINITIONS, RATE_LIMIT_HOURS
from couchers.utils import Duration_from_timedelta, now, to_aware_datetime
from tests.fixtures.db import generate_user, make_friends, make_user_block, make_user_invisible
from tests.fixtures.misc import EmailCollector, Moderator, PushCollector, process_jobs
from tests.fixtures.sessions import api_session, conversations_session, notifications_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_list_group_chats(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user2, user1)
    make_friends(user1, user3)

    with conversations_session(token1) as c:
        # no threads initially
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 0

        # create some group chats with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        group_chat1_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message 2"))
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        group_chat2_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test group message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test group message 2"))

    moderator.approve_group_chat(group_chat1_id)
    moderator.approve_group_chat(group_chat2_id)

    with conversations_session(token1) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

    with conversations_session(token2) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

    with conversations_session(token3) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 1
        assert res.no_more

    # Test archive filtering: archive group_chat1 for user1
    with conversations_session(token1) as c:
        res = c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=group_chat1_id, is_archived=True)
        )
        assert res.group_chat_id == group_chat1_id
        assert res.is_archived

    with conversations_session(token1) as c:
        # Without filter, returns all chats
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2

        # only_archived=False returns non-archived chats only
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=False))
        assert len(res.group_chats) == 1

        # only_archived=True returns archived chats only
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=True))
        assert len(res.group_chats) == 1

    # user2 should still see both as non-archived (archive is per-user)
    with conversations_session(token2) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=False))
        assert len(res.group_chats) == 2

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=True))
        assert len(res.group_chats) == 0


def test_list_empty_group_chats(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user3)
    make_friends(user2, user1)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 0

        res1 = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        res2 = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))

    moderator.approve_group_chat(res1.group_chat_id)
    moderator.approve_group_chat(res2.group_chat_id)

    with conversations_session(token1) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

    with conversations_session(token2) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

        res3 = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        moderator.approve_group_chat(res3.group_chat_id)

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 3
        assert res.no_more

    with conversations_session(token3) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more


def test_list_group_chats_ordering(db, moderator):
    # user is member of 5 group chats, order them correctly
    user, token = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_friends(user2, user)
    make_friends(user2, user3)
    make_friends(user2, user4)
    make_friends(user3, user)
    make_friends(user3, user4)
    make_friends(user, user4)

    chat_ids = []

    with conversations_session(token2) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id], title=wrappers_pb2.StringValue(value="Chat 0")
            )
        )
        chat_ids.append(res.group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Chat 1")
            )
        )
        chat_ids.append(res.group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Chat 2")
            )
        )
        chat_ids.append(res.group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))

    with conversations_session(token3) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user2.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 3")
            )
        )
        chat_ids.append(res.group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))

    for chat_id in chat_ids:
        moderator.approve_group_chat(chat_id)

    with conversations_session(token) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id, user3.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 4")
            )
        )
        moderator.approve_group_chat(res.group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 5
        assert res.group_chats[0].title == "Chat 4"
        assert res.group_chats[1].title == "Chat 3"
        assert res.group_chats[2].title == "Chat 2"
        assert res.group_chats[3].title == "Chat 1"
        assert res.group_chats[4].title == "Chat 0"

        c.SendMessage(
            conversations_pb2.SendMessageReq(group_chat_id=res.group_chats[3].group_chat_id, text="Test message 2a")
        )
        c.SendMessage(
            conversations_pb2.SendMessageReq(group_chat_id=res.group_chats[2].group_chat_id, text="Test message 2b")
        )

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 5
        assert res.group_chats[0].title == "Chat 2"
        assert res.group_chats[0].latest_message.text.text == "Test message 2b"
        assert res.group_chats[1].title == "Chat 1"
        assert res.group_chats[1].latest_message.text.text == "Test message 2a"
        assert res.group_chats[2].title == "Chat 4"
        assert res.group_chats[3].title == "Chat 3"
        assert res.group_chats[4].title == "Chat 0"


def test_list_group_chats_ordering_after_left(db, moderator):
    # user is member to 4 group chats, and has left one.
    # The one user left has the most recent message, but user left before then,
    # this should display as e.g. 3rd most recent depending on last message when they were in the chat
    user, token = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_friends(user2, user)
    make_friends(user2, user3)
    make_friends(user2, user4)
    make_friends(user3, user)
    make_friends(user3, user4)
    make_friends(user, user4)

    chat_ids = []

    with conversations_session(token2) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id], title=wrappers_pb2.StringValue(value="Chat 0")
            )
        )
        chat_ids.append(res.group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Left Chat 1")
            )
        )
        left_chat_id = res.group_chat_id
        chat_ids.append(left_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=left_chat_id, text="Test message"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Chat 2")
            )
        )
        chat2_id = res.group_chat_id
        chat_ids.append(chat2_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat2_id, text="Test message"))

    with conversations_session(token3) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user2.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 3")
            )
        )
        chat_ids.append(res.group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))

    for chat_id in chat_ids:
        moderator.approve_group_chat(chat_id)

    with conversations_session(token) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id, user3.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 4")
            )
        )
        moderator.approve_group_chat(res.group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))

        # leave chat
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=left_chat_id))

    with conversations_session(token3) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat2_id, text="Test message"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=left_chat_id, text="Test message"))

    with conversations_session(token2) as c:
        # other user sends a message to that chat
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=left_chat_id, text="Another test message"))
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 5
        assert res.group_chats[0].title == "Left Chat 1"
        assert res.group_chats[1].title == "Chat 2"
        assert res.group_chats[2].title == "Chat 4"
        assert res.group_chats[3].title == "Chat 3"
        assert res.group_chats[4].title == "Chat 0"

    with conversations_session(token) as c:
        # we can't see the new message since we left before it was sent
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 5
        assert res.group_chats[0].title == "Chat 2"
        assert res.group_chats[1].title == "Left Chat 1"
        assert res.group_chats[2].title == "Chat 4"
        assert res.group_chats[3].title == "Chat 3"
        assert res.group_chats[4].title == "Chat 0"


def test_get_group_chat_messages(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)

    with conversations_session(token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message 2"))

        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        # created + 2 normal
        assert len(res.messages) == 3
        assert res.no_more

        assert res.messages[0].text.text == "Test message 2"
        assert res.messages[1].text.text == "Test message 1"
        assert res.messages[2].WhichOneof("content") == "chat_created"

    # test that another user can't access the thread
    with conversations_session(token3) as c:
        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        assert len(res.messages) == 0


def test_get_group_chat_messages_pagination(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_friends(user1, user2)

    with conversations_session(token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        for i in range(30):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text=str(i)))

    moderator.approve_group_chat(group_chat_id)

    with conversations_session(token2) as c:
        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        # pagination
        assert len(res.messages) == 20
        assert res.messages[0].text.text == "29"
        assert res.messages[19].text.text == "10"
        assert not res.no_more
        res = c.GetGroupChatMessages(
            conversations_pb2.GetGroupChatMessagesReq(
                group_chat_id=group_chat_id, last_message_id=res.messages[19].message_id
            )
        )
        assert len(res.messages) == 11
        assert res.messages[0].text.text == "9"
        assert res.messages[9].text.text == "0"
        assert res.no_more


def test_get_group_chat_messages_joined_left(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user4)

    with conversations_session(token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user4.id]))
        group_chat_id = res.group_chat_id
        moderator.approve_group_chat(group_chat_id)

        for i in range(10):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text=str(i)))

        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))

        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="10"))

        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))

        # created + 10 normal + invited + normal
        assert len(res.messages) == 13

    with conversations_session(token3) as c:
        # can only see last message after invited
        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        # joined + normal
        assert len(res.messages) == 2
        assert res.messages[0].text.text == "10"

        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="11"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="12"))

        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))

        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="13"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="14"))

    with conversations_session(token3) as c:
        # can only see last message after invited
        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        # joined + normal + left + invite + 2 normal
        assert len(res.messages) == 6
        assert res.messages[0].text.text == "14"
        assert res.messages[1].text.text == "13"
        assert res.messages[2].WhichOneof("content") == "user_invited"
        assert res.messages[3].WhichOneof("content") == "user_left"
        assert res.messages[4].text.text == "10"
        assert res.messages[5].WhichOneof("content") == "user_invited"


def test_get_group_chat_info(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user3, user1)

    with conversations_session(token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message 2"))
        group_chat1_id = res.group_chat_id
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test group message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test group message 2"))
        group_chat2_id = res.group_chat_id

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat1_id))
        assert res.title == "Test title"
        assert user2.id in res.member_user_ids
        assert user1.id in res.admin_user_ids
        assert to_aware_datetime(res.created) <= now()
        assert res.only_admins_invite
        assert res.is_dm
        assert not res.is_archived

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat2_id))
        assert not res.title
        assert user2.id in res.member_user_ids
        assert user3.id in res.member_user_ids
        assert user1.id in res.admin_user_ids
        assert to_aware_datetime(res.created) <= now()
        assert res.only_admins_invite
        assert not res.is_dm
        assert not res.is_archived


def test_get_group_chat_info_denied(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_friends(user1, user2)
    make_friends(user3, user1)

    with conversations_session(token1) as c:
        # create a group chat with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id, user3.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

    with conversations_session(token4) as c:
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_get_group_chat_info_left(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_friends(user1, user2)
    make_friends(user3, user1)
    make_friends(user1, user4)

    with conversations_session(token1) as c:
        # create a group chat with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id, user3.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        group_chat_id = res.group_chat_id
        moderator.approve_group_chat(group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

    with conversations_session(token3) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(token1) as c:
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user4.id))

    with conversations_session(token3) as c:
        # this user left when user4 wasn't a member,
        # so the returned members should be user1, user2, and user3 only
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert len(res.member_user_ids) == 3
        assert user1.id in res.member_user_ids
        assert user2.id in res.member_user_ids
        assert user3.id in res.member_user_ids


def test_remove_group_chat_user(db):
    # create 3 uses and connect them
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)

    # using user token, create a Conversations API for testing
    with conversations_session(token1) as c:
        # create a group chat
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id, user3.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        group_chat_id = res.group_chat_id

        # remove a user from group
        c.RemoveGroupChatUser(conversations_pb2.RemoveGroupChatUserReq(group_chat_id=group_chat_id, user_id=user2.id))
        assert user3.id in res.member_user_ids  # other users are still in the group

        # can't remove the same user twice
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatUser(
                conversations_pb2.RemoveGroupChatUserReq(group_chat_id=group_chat_id, user_id=user2.id)
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION


def test_edit_group_chat(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)

    with conversations_session(token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        group_chat_id = res.group_chat_id
        moderator.approve_group_chat(group_chat_id)

        c.EditGroupChat(
            conversations_pb2.EditGroupChatReq(
                group_chat_id=group_chat_id,
                title=wrappers_pb2.StringValue(value="Modified title"),
                only_admins_invite=wrappers_pb2.BoolValue(value=False),
            )
        )
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert res.title == "Modified title"
        assert not res.only_admins_invite

    # make sure non-admin is not allowed to modify
    with conversations_session(token2) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.EditGroupChat(
                conversations_pb2.EditGroupChatReq(
                    group_chat_id=group_chat_id,
                    title=wrappers_pb2.StringValue(value="Other title"),
                    only_admins_invite=wrappers_pb2.BoolValue(value=True),
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

    # make sure non-recipient is not allowed to modify
    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.EditGroupChat(
                conversations_pb2.EditGroupChatReq(
                    group_chat_id=group_chat_id,
                    title=wrappers_pb2.StringValue(value="Other title"),
                    only_admins_invite=wrappers_pb2.BoolValue(value=True),
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_make_remove_group_chat_admin(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        group_chat_id = res.group_chat_id
        moderator.approve_group_chat(group_chat_id)

        # shouldn't be able to remove only admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(
                conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user1.id)
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You can't remove the last admin."

        c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user2.id))

        # shouldn't be able to make admin again
        with pytest.raises(grpc.RpcError) as e:
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "That user is already an admin."

    with conversations_session(token2) as c:
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

    with conversations_session(token1) as c:
        c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user2.id))

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user1.id in res.admin_user_ids
        assert user2.id not in res.admin_user_ids

    with conversations_session(token2) as c:
        # shouldn't be able to make admin if not admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED


def test_send_message(db, moderator: Moderator, push_collector: PushCollector, email_collector: EmailCollector):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)

    # Let user2 receive email notifications for every chat message
    with notifications_session(token2) as n:
        n.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=NotificationTopicAction.chat__message.topic,
                        action=NotificationTopicAction.chat__message.action,
                        delivery_method="email",
                        enabled=True,
                    )
                ]
            )
        )

    group_chat_title = "My group chat"
    message1 = "Test message 1"

    # Let user1 create a group chat with user2 and send a message
    with conversations_session(token1) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                title=wrappers_pb2.StringValue(value=group_chat_title), recipient_user_ids=[user2.id]
            )
        )
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text=message1))

        # Sender can already see group chat
        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        assert res.messages[0].text.text == message1
        assert to_aware_datetime(res.messages[0].time) <= now()
        assert res.messages[0].author_user_id == user1.id

    # user2 sees nothing until the group chat is approved
    assert push_collector.count_for_user(user2.id) == 0
    assert email_collector.count_for_recipient(user2.email) == 0

    moderator.approve_group_chat(group_chat_id)

    # user2 gets email and push notifications
    push = push_collector.pop_for_user(user2.id, last=True)
    assert push.topic_action == NotificationTopicAction.chat__message.display
    assert message1 in push.content.body

    email = email_collector.pop_for_recipient(user2.email, last=True)
    assert group_chat_title in email.subject
    assert message1 in email.plain
    assert message1 in email.html

    # can't send message if not in chat
    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 2"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    make_user_block(user2, user1)
    with conversations_session(token1) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Message after block"))
        assert e.value.details() == "You can't send a message in this chat."


def test_send_direct_message(db, moderator: Moderator, push_collector: PushCollector, email_collector: EmailCollector):
    user1, token1 = generate_user(complete_profile=True)
    user2, token2 = generate_user(complete_profile=True)

    make_friends(user1, user2)

    # Let user2 receive email notifications for every chat message
    with notifications_session(token2) as n:
        n.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=NotificationTopicAction.chat__message.topic,
                        action=NotificationTopicAction.chat__message.action,
                        delivery_method="email",
                        enabled=True,
                    )
                ]
            )
        )

    # Let user1 send two DM's to user2
    message1 = "Hello, user2!"
    message2 = "One more message."

    with conversations_session(token1) as c1:
        # Send a DM from user1 to user2
        res = c1.SendDirectMessage(conversations_pb2.SendDirectMessageReq(recipient_user_id=user2.id, text=message1))
        moderator.approve_group_chat(res.group_chat_id)

        c1.SendDirectMessage(conversations_pb2.SendDirectMessageReq(recipient_user_id=user2.id, text=message2))

    # user2 should have received push and email notifications for both messages
    push = push_collector.pop_for_user(user2.id, last=False)
    assert push.topic_action == NotificationTopicAction.chat__message.display
    assert push.content.title == user1.name
    assert push.content.body == message1

    email = email_collector.pop_for_recipient(user2.email, last=False)
    assert user1.name in email.subject
    assert message1 in email.plain
    assert message1 in email.html

    push = push_collector.pop_for_user(user2.id, last=True)
    assert push.topic_action == NotificationTopicAction.chat__message.display
    assert push.content.title == user1.name
    assert push.content.body == message2

    email = email_collector.pop_for_recipient(user2.email, last=True)
    assert user1.name in email.subject
    assert message2 in email.plain
    assert message2 in email.html

    with conversations_session(token2) as c2:
        # Fetch the chat by ID returned from SendDirectMessage
        chat = c2.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=res.group_chat_id))

        assert chat.is_dm
        group_chat_id = chat.group_chat_id

        # Verify that the messages was received
        messages = c2.GetGroupChatMessages(
            conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id)
        ).messages

        assert len(messages) == 2
        assert messages[0].text.text == message2
        assert messages[1].text.text == message1
        assert messages[0].author_user_id == user1.id


def test_excessive_chat_initiations_are_reported(db, email_collector: EmailCollector):
    """Test that excessive chat initiations are first reported in a warning email and finally lead blocking of further contacting other users."""
    user, token = generate_user()
    rate_limit_definition = RATE_LIMIT_DEFINITIONS[RateLimitAction.chat_initiation]
    with conversations_session(token) as c:
        # Test warning email
        for _ in range(rate_limit_definition.warning_limit):
            recipient_user, _ = generate_user()
            _ = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[recipient_user.id]))

        assert email_collector.count_for_reports() == 0

        recipient_user, _ = generate_user()
        _ = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[recipient_user.id]))

        email = email_collector.pop_for_reports(last=True)
        assert email.plain.startswith(
            f"User {user.username} has sent {rate_limit_definition.warning_limit} chat initiations in the past {RATE_LIMIT_HOURS} hours."
        )

        # Test new chat initiations fail after exceeding CHAT_INITIATION_HARD_LIMIT
        for _ in range(rate_limit_definition.hard_limit - rate_limit_definition.warning_limit - 1):
            recipient_user, _ = generate_user()
            _ = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[recipient_user.id]))

        assert email_collector.count_for_reports() == 0

        recipient_user, _ = generate_user()
        with pytest.raises(grpc.RpcError) as exc_info:
            _ = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[recipient_user.id]))
        assert exc_info.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED
        assert (
            exc_info.value.details()
            == "You have messaged a lot of users in the past 24 hours. To avoid spam, you can't contact any more users for now."
        )

        email = email_collector.pop_for_reports(last=True)
        assert email.plain.startswith(
            f"User {user.username} has sent {rate_limit_definition.hard_limit} chat initiations in the past {RATE_LIMIT_HOURS} hours."
        )
        assert "The user has been blocked from sending further chat initiations for now." in email.plain


def test_send_direct_message_rate_limit(db, moderator, email_collector: EmailCollector):
    """SendDirectMessage should enforce the chat_initiation rate limit when creating a new DM, but not when sending into an existing one."""
    user, token = generate_user(complete_profile=True)
    rate_limit_definition = RATE_LIMIT_DEFINITIONS[RateLimitAction.chat_initiation]

    with conversations_session(token) as c:
        for _ in range(rate_limit_definition.warning_limit):
            recipient, _ = generate_user()
            c.SendDirectMessage(conversations_pb2.SendDirectMessageReq(recipient_user_id=recipient.id, text="hi"))

        assert email_collector.count_for_reports() == 0

        recipient, _ = generate_user()
        existing_dm_recipient_id = recipient.id
        c.SendDirectMessage(
            conversations_pb2.SendDirectMessageReq(recipient_user_id=existing_dm_recipient_id, text="hi")
        )

        email = email_collector.pop_for_reports(last=True)
        assert email.plain.startswith(
            f"User {user.username} has sent {rate_limit_definition.warning_limit} chat initiations in the past {RATE_LIMIT_HOURS} hours."
        )

        for _ in range(rate_limit_definition.hard_limit - rate_limit_definition.warning_limit - 1):
            recipient, _ = generate_user()
            c.SendDirectMessage(conversations_pb2.SendDirectMessageReq(recipient_user_id=recipient.id, text="hi"))

        assert email_collector.count_for_reports() == 0

        # follow-up into an existing DM must not count as a new initiation
        c.SendDirectMessage(
            conversations_pb2.SendDirectMessageReq(recipient_user_id=existing_dm_recipient_id, text="follow-up")
        )
        assert email_collector.count_for_reports() == 0

        recipient, _ = generate_user()
        with pytest.raises(grpc.RpcError) as exc_info:
            c.SendDirectMessage(conversations_pb2.SendDirectMessageReq(recipient_user_id=recipient.id, text="hi"))
        assert exc_info.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED
        assert (
            exc_info.value.details()
            == "You have messaged a lot of users in the past 24 hours. To avoid spam, you can't contact any more users for now."
        )

        email = email_collector.pop_for_reports(last=True)
        assert email.plain.startswith(
            f"User {user.username} has sent {rate_limit_definition.hard_limit} chat initiations in the past {RATE_LIMIT_HOURS} hours."
        )
        assert "The user has been blocked from sending further chat initiations for now." in email.plain


def test_leave_invite_to_group_chat(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user(delete_user=True)
    user7, token7 = generate_user()
    user8, token8 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user5)
    make_friends(user1, user7)
    make_friends(user1, user8)
    make_friends(user2, user3)
    make_friends(user4, user3)
    make_user_block(user1, user7)
    make_user_block(user8, user1)

    with conversations_session(token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user5.id]))
        group_chat_id = res.group_chat_id
        moderator.approve_group_chat(group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

    # other user not in chat
    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        with pytest.raises(grpc.RpcError) as e:
            res = c.InviteToGroupChat(
                conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user4.id)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        with pytest.raises(grpc.RpcError) as e:
            res = c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    with conversations_session(token2) as c:
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user3.id not in res.member_user_ids

        # only_admins_invite defaults to true so shouldn't be able to invite
        with pytest.raises(grpc.RpcError) as e:
            res = c.InviteToGroupChat(
                conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id)
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(token1) as c:
        # invite invisible user fails
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user6.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."
        # invite fake user fails
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."
        # invite blocked user fails
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user7.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."
        # invite blocking user fails
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user8.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user1.id in res.member_user_ids
        assert user5.id in res.member_user_ids
        assert user3.id in res.member_user_ids

        # test non-admin inviting
        c.EditGroupChat(
            conversations_pb2.EditGroupChatReq(
                group_chat_id=group_chat_id, only_admins_invite=wrappers_pb2.BoolValue(value=False)
            )
        )

    with conversations_session(token3) as c:
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user2.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user2.id in res.member_user_ids


def test_group_chats_with_messages_before_join(db, moderator):
    """
    If user 1 and 2 have a group chat and send messages, then add user 3; user 3
    should still see the group chat!
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)
    make_friends(user1, user4)

    with conversations_session(token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user4.id]))
        group_chat_id = res.group_chat_id
        moderator.approve_group_chat(group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

    with conversations_session(token2) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 2"))

    with conversations_session(token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 3"))

        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))

    with conversations_session(token3) as c:
        # should work
        c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 1


def test_invite_to_dm(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

        # dm, shou;dn't be able to invite someone else
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You can't invite other users to a direct message."


def test_sole_admin_leaves(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        group_chat_id = res.group_chat_id
        moderator.approve_group_chat(group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

        # sole admin can't leave group chat
        with pytest.raises(grpc.RpcError) as e:
            c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "The last admin can't leave a group chat."

    with conversations_session(token2) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(token3) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    # sole admin can leave when last in chat
    with conversations_session(token1) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))


def test_search_messages(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)

    with conversations_session(token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        gc1_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gc1_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gc1_id, text="Test message 2"))
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        gc2_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gc2_id, text="Test group message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gc2_id, text="Test group message 4"))

    # Approve group chats so they appear in search results
    moderator.approve_group_chat(gc1_id)
    moderator.approve_group_chat(gc2_id)

    with conversations_session(token1) as c:
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="message "))
        assert len(res.results) == 4
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="group "))
        assert len(res.results) == 2
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="message 5"))
        assert len(res.results) == 0

    # outside user doesn't get results
    with conversations_session(token3) as c:
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))
        assert len(res.results) == 0


def test_search_messages_left_joined(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user4)

    with conversations_session(token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user4.id]))
        group_chat_id = res.group_chat_id
        moderator.approve_group_chat(group_chat_id)
        for i in range(10):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message " + str(i)))

        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 10"))
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))

        assert len(res.results) == 11

    with conversations_session(token3) as c:
        # can only see last message after invited
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))

        assert len(res.results) == 1
        assert res.results[0].message.text.text == "Test message 10"

        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 11"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 12"))
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 13"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 14"))

    with conversations_session(token3) as c:
        # can only see last message after invited
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))
        assert len(res.results) == 3
        assert res.results[0].message.text.text == "Test message 14"
        assert res.results[1].message.text.text == "Test message 13"
        assert res.results[2].message.text.text == "Test message 10"


def test_admin_behaviour(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
        moderator.approve_group_chat(gcid)
        c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user2.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 2
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 2
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

    with conversations_session(token2) as c:
        c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user3.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 3
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids
        assert user3.id in res.admin_user_ids

        c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user1.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 2
        assert user2.id in res.admin_user_ids
        assert user3.id in res.admin_user_ids

    with conversations_session(token1) as c:
        with pytest.raises(grpc.RpcError):
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user1.id))
        with pytest.raises(grpc.RpcError):
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user3.id))
        with pytest.raises(grpc.RpcError):
            c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user2.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 2
        assert user2.id in res.admin_user_ids
        assert user3.id in res.admin_user_ids

    with conversations_session(token2) as c:
        # can demote self if there are other admins
        c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user2.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 1
        assert user3.id in res.admin_user_ids

    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You can't remove the last admin."
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 1
        assert user3.id in res.admin_user_ids

        # last admin can't leave
        with pytest.raises(grpc.RpcError) as e:
            c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "The last admin can't leave a group chat."

        c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user1.id))

        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))

    with conversations_session(token2) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))

    # last participant must be admin but can leave to orphan chat
    with conversations_session(token1) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))


def test_add_remove_admin_failures(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user4)
    make_friends(user1, user5)

    with conversations_session(token1) as c:
        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id, user4.id, user5.id])
        ).group_chat_id

        make_user_invisible(user3.id)
        make_user_block(user1, user4)
        make_user_block(user5, user1)

        # make non-existent user admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        # make invisible user admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        # make blocked user admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user4.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        # make blocking user admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user5.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        with session_scope() as session:
            subscriptions = (
                session.execute(
                    select(GroupChatSubscription)
                    .where(GroupChatSubscription.group_chat_id == gcid)
                    .where(GroupChatSubscription.role == GroupChatRole.participant)
                )
                .scalars()
                .all()
            )

            for subscription in subscriptions:
                subscription.role = GroupChatRole.admin

    with conversations_session(token1) as c:
        # remove non-existent user admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        # remove invisible admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        # remove blocked admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user4.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."

        # remove blocking admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user5.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."


def test_last_seen(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token3) as c:
        # this is just here to mess up any issues we get if we pretend there's only one group chat ever
        gcid_distraction = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user1.id])
        ).group_chat_id
        moderator.approve_group_chat(gcid_distraction)

    with conversations_session(token1) as c:
        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
        moderator.approve_group_chat(gcid)

        message_ids = []

        for i in range(6):
            c.SendMessage(
                conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text=f"gibberish message... {i}")
            )
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text=f"test message {i}"))
            c.SendMessage(
                conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text=f"gibberish message {i}")
            )

            message_ids.append(
                c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid)).latest_message.message_id
            )

        # messages are automatically marked as seen when you send a new message
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.unseen_message_count == 0

    with conversations_session(token2) as c:
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        # created + 6 normal
        assert res.unseen_message_count == 7

        backward_offset = 3
        c.MarkLastSeenGroupChat(
            conversations_pb2.MarkLastSeenGroupChatReq(
                group_chat_id=gcid, last_seen_message_id=message_ids[-backward_offset - 1]
            )
        )

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.unseen_message_count == backward_offset

        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text="test message ..."))

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.unseen_message_count == 0

    with conversations_session(token3) as c:
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        # created + 7 normal
        assert res.unseen_message_count == 8

        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text="test message ..."))

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.unseen_message_count == 0


def test_mark_last_seen_clears_notifications(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with conversations_session(token1) as c:
        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test chat")
            )
        ).group_chat_id

    moderator.approve_group_chat(gcid)

    with conversations_session(token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text="Hello"))

    process_jobs()

    def unseen_notification_count(user_id):
        with session_scope() as session:
            return session.execute(
                select(func.count())
                .select_from(Notification)
                .where(Notification.user_id == user_id)
                .where(Notification.key == str(gcid))
                .where(Notification.is_seen == False)
            ).scalar_one()

    assert unseen_notification_count(user2.id) > 0

    with conversations_session(token2) as c:
        c.MarkLastSeenGroupChat(conversations_pb2.MarkLastSeenGroupChatReq(group_chat_id=gcid, last_seen_message_id=1))

    assert unseen_notification_count(user2.id) == 0


def test_one_dm_per_pair(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        # create DM with user 2
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        assert res.is_dm
        dm_with_user2 = res.group_chat_id

        # create DM with user 3
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm
        dm_with_user3 = res.group_chat_id

        # can't create another group chat with just user 2
        with pytest.raises(grpc.RpcError) as e:
            res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        # can't create another group chat with just user 3
        with pytest.raises(grpc.RpcError) as e:
            res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        # can create joined group chat
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        assert not res.is_dm

    # Approve the DMs so user2 can see them (otherwise they're SHADOWED and only visible to creator)
    moderator.approve_group_chat(dm_with_user2)

    with conversations_session(token2) as c:
        # can create DM with user 3
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm

        # can't create another group chat with just user 1 (DM was approved, so user2 can see it)
        with pytest.raises(grpc.RpcError) as e:
            res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user1.id]))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION


def test_GetDirectMessage(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        # no group chat with user 2
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetDirectMessage(conversations_pb2.GetDirectMessageReq(user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        # no group chat with nor user 3
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetDirectMessage(conversations_pb2.GetDirectMessageReq(user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        # create DM with user 2
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        assert res.is_dm
        gcid = res.group_chat_id

        # now should exist
        res = c.GetDirectMessage(conversations_pb2.GetDirectMessageReq(user_id=user2.id))
        assert res.group_chat_id == gcid
        assert not res.is_archived

        # create DM with user 3
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm

        # can create joined group chat
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        assert not res.is_dm

    with conversations_session(token2) as c:
        # can create DM with user 3
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm
        assert res.can_message
        gcid = res.group_chat_id

        # DM with 3 should exist, but can't message after being blocked
        make_user_block(user3, user2)
        res = c.GetDirectMessage(conversations_pb2.GetDirectMessageReq(user_id=user3.id))
        assert res.group_chat_id == gcid
        assert not res.can_message


def test_total_unseen(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    # distractions
    user4, token4 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    # distractions
    make_friends(user1, user4)

    with conversations_session(token1) as c:
        # distractions
        gcid_distraction = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user4.id])
        ).group_chat_id
        moderator.approve_group_chat(gcid_distraction)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text="distraction..."))

        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
        moderator.approve_group_chat(gcid)

        for i in range(6):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text=f"test message {i}"))

        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text="distraction..."))

    # messages are automatically marked as seen when you send a new message
    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    with api_session(token2) as api:
        # chat created + 6 normal messages
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 7

    # now leave chat with user2
    with conversations_session(token2) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))

    with api_session(token2) as api:
        # seen messages becomes 0 when leaving
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    with conversations_session(token1) as c:
        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text="distraction..."))

        # send more stuff without user 2
        for i in range(3):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text=f"test message {i}"))

        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text="distraction..."))

    with api_session(token2) as api:
        # seen messages becomes 0 when leaving
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    with conversations_session(token1) as c:
        # add user 2 back
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=gcid, user_id=user2.id))

        # send more stuff with user 2
        for i in range(12):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text=f"test message {i}"))

        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text="distraction..."))

    with api_session(token2) as api:
        # joined + 12 normal
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 13


def test_regression_ListGroupChats_pagination(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)

    with conversations_session(token1) as c:
        # tuples of (group_chat_id, message_id)
        group_chat_and_message_ids = []
        for i in range(50):
            res1 = c.CreateGroupChat(
                conversations_pb2.CreateGroupChatReq(
                    recipient_user_ids=[user2.id, user3.id], title=wrappers_pb2.StringValue(value=f"Chat {i}")
                )
            )

            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res1.group_chat_id, text=f"Test message {i}"))

            res2 = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=res1.group_chat_id))

            group_chat_and_message_ids.append((res2.group_chat_id, res2.latest_message.message_id))
            moderator.approve_group_chat(res1.group_chat_id)

        seen_group_chat_ids = []

        last_message_id = 0
        more = True
        while more:
            res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(last_message_id=last_message_id))
            last_message_id = res.last_message_id
            more = not res.no_more

            seen_group_chat_ids.extend([chat.group_chat_id for chat in res.group_chats])

        assert set(seen_group_chat_ids) == {x[0] for x in group_chat_and_message_ids}, "Not all group chats returned"


def test_muting(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token3) as c:
        # this is just here to mess up any issues we get if we pretend there's only one group chat ever
        gcid_distraction = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user1.id])
        ).group_chat_id
        moderator.approve_group_chat(gcid_distraction)

    with conversations_session(token1) as c:
        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
        moderator.approve_group_chat(gcid)

    with conversations_session(token2) as c:
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert not res.mute_info.muted
        assert not res.mute_info.HasField("muted_until")

        c.MuteGroupChat(conversations_pb2.MuteGroupChatReq(group_chat_id=gcid, forever=True))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.mute_info.muted
        assert not res.mute_info.HasField("muted_until")

        c.MuteGroupChat(conversations_pb2.MuteGroupChatReq(group_chat_id=gcid, unmute=True))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert not res.mute_info.muted
        assert not res.mute_info.HasField("muted_until")

        c.MuteGroupChat(
            conversations_pb2.MuteGroupChatReq(
                group_chat_id=gcid, for_duration=Duration_from_timedelta(timedelta(hours=2))
            )
        )
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.mute_info.muted
        assert res.mute_info.HasField("muted_until")
        assert to_aware_datetime(res.mute_info.muted_until) >= now() + timedelta(hours=1, minutes=59)
        assert to_aware_datetime(res.mute_info.muted_until) <= now() + timedelta(hours=2, minutes=1)


def test_archiving(db, moderator):
    """Test SetGroupChatArchiveStatus RPC with GetGroupChat and ListGroupChats"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    # Create a distraction chat to ensure we're testing the right one
    with conversations_session(token3) as c:
        gcid_distraction = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user1.id])
        ).group_chat_id
        moderator.approve_group_chat(gcid_distraction)

    with conversations_session(token1) as c:
        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
        moderator.approve_group_chat(gcid)

    # Test basic archive/unarchive functionality
    with conversations_session(token2) as c:
        # Initially not archived
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert not res.is_archived

        # Archive the chat
        archive_res = c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=True)
        )
        assert archive_res.group_chat_id == gcid
        assert archive_res.is_archived

        # Verify archived via GetGroupChat
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.is_archived

        # Unarchive the chat
        archive_res = c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=False)
        )
        assert archive_res.group_chat_id == gcid
        assert not archive_res.is_archived

        # Verify unarchived via GetGroupChat
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert not res.is_archived


def test_archiving_per_user(db, moderator):
    """Test that archiving is per-user - one user archiving doesn't affect others"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_friends(user1, user2)

    with conversations_session(token1) as c:
        gcid = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id])).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text="Hello"))
        moderator.approve_group_chat(gcid)

    # User1 archives the chat
    with conversations_session(token1) as c:
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=True)
        )
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.is_archived

    # User2 should NOT see it as archived
    with conversations_session(token2) as c:
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert not res.is_archived

    # User2 archives it too
    with conversations_session(token2) as c:
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=True)
        )
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.is_archived

    # User1 unarchives - user2 should still see it as archived
    with conversations_session(token1) as c:
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=False)
        )
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert not res.is_archived

    with conversations_session(token2) as c:
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.is_archived


def test_archiving_with_list_group_chats(db, moderator):
    """Test archive filtering with ListGroupChats endpoint"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)

    with conversations_session(token1) as c:
        # Create 3 chats
        gcid1 = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id])).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid1, text="Chat 1"))
        moderator.approve_group_chat(gcid1)

        gcid2 = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id])).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid2, text="Chat 2"))
        moderator.approve_group_chat(gcid2)

        gcid3 = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid3, text="Chat 3"))
        moderator.approve_group_chat(gcid3)

    with conversations_session(token1) as c:
        # Initially all 3 chats should be visible
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 3

        # All should be non-archived
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=False))
        assert len(res.group_chats) == 3

        # None should be archived
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=True))
        assert len(res.group_chats) == 0

        # Archive chat 1
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid1, is_archived=True)
        )

        # Without filter, still see all 3
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 3

        # Non-archived should show 2
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=False))
        assert len(res.group_chats) == 2
        assert gcid1 not in [gc.group_chat_id for gc in res.group_chats]

        # Archived should show 1
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=True))
        assert len(res.group_chats) == 1
        assert res.group_chats[0].group_chat_id == gcid1
        assert res.group_chats[0].is_archived

        # Archive chat 2 as well
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid2, is_archived=True)
        )

        # Non-archived should show 1
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=False))
        assert len(res.group_chats) == 1
        assert res.group_chats[0].group_chat_id == gcid3

        # Archived should show 2
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=True))
        assert len(res.group_chats) == 2
        archived_ids = {gc.group_chat_id for gc in res.group_chats}
        assert archived_ids == {gcid1, gcid2}

        # Unarchive chat 1
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid1, is_archived=False)
        )

        # Non-archived should show 2
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=False))
        assert len(res.group_chats) == 2

        # Archived should show 1
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(only_archived=True))
        assert len(res.group_chats) == 1
        assert res.group_chats[0].group_chat_id == gcid2


def test_archiving_chat_not_found(db, moderator):
    """Test that archiving a non-existent or non-accessible chat fails"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)

    with conversations_session(token1) as c:
        gcid = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id])).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text="Hello"))
        moderator.approve_group_chat(gcid)

    # User3 is not in the chat - should get NOT_FOUND
    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.SetGroupChatArchiveStatus(
                conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=True)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    # Non-existent chat ID should fail
    with conversations_session(token1) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.SetGroupChatArchiveStatus(
                conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=99999, is_archived=True)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_archiving_after_leaving_chat(db, moderator):
    """Test that you can't archive a chat after leaving it"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text="Hello"))
        moderator.approve_group_chat(gcid)

    # User2 leaves the chat
    with conversations_session(token2) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))

    # User2 should not be able to archive it now
    with conversations_session(token2) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.SetGroupChatArchiveStatus(
                conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=True)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_archiving_dm(db, moderator):
    """Test that archiving works for DMs as well as group chats"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_friends(user1, user2)

    with conversations_session(token1) as c:
        # Create a DM
        gcid = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id])).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text="Hello"))
        moderator.approve_group_chat(gcid)

        # Verify it's a DM
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.is_dm
        assert not res.is_archived

        # Archive the DM
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=True)
        )

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.is_archived

        # Unarchive it
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=False)
        )

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert not res.is_archived


def test_archiving_idempotent(db, moderator):
    """Test that archiving/unarchiving is idempotent"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_friends(user1, user2)

    with conversations_session(token1) as c:
        gcid = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id])).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text="Hello"))
        moderator.approve_group_chat(gcid)

        # Archive twice - should work without error
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=True)
        )
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=True)
        )
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.is_archived

        # Unarchive twice - should work without error
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=False)
        )
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=gcid, is_archived=False)
        )
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert not res.is_archived


def test_chat_notifications(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    # notifs off
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user4)
    make_friends(user4, user5)
    make_friends(user4, user6)

    # have some of them enable/disable notifs
    topic_action = NotificationTopicAction.chat__message
    for token, enabled in [
        (token1, True),
        (token2, True),
        (token3, False),
        (token4, True),
        (token5, True),
        (token6, True),
    ]:
        with notifications_session(token) as notifications:
            notifications.SetNotificationSettings(
                notifications_pb2.SetNotificationSettingsReq(
                    preferences=[
                        notifications_pb2.SingleNotificationPreference(
                            topic=topic_action.topic,
                            action=topic_action.action,
                            delivery_method=delivery_method,
                            enabled=enabled,
                        )
                        for delivery_method in ["push", "email", "digest"]
                    ],
                )
            )

    group_chat_id = None

    def send_msg(c, i):
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text=f"Test message {i}"))

    with conversations_session(token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id, user4.id]))
        group_chat_id = res.group_chat_id
        moderator.approve_group_chat(group_chat_id)
        c.EditGroupChat(
            conversations_pb2.EditGroupChatReq(
                group_chat_id=group_chat_id, only_admins_invite=wrappers_pb2.BoolValue(value=False)
            )
        )
        send_msg(c, i=1)
        send_msg(c, i=2)

    with conversations_session(token4) as c:
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user5.id))
        send_msg(c, i=3)
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user6.id))
        send_msg(c, i=4)
        send_msg(c, i=5)

    with conversations_session(token3) as c:
        send_msg(c, i=6)
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(token2) as c:
        send_msg(c, i=7)
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(token6) as c:
        send_msg(c, i=8)

    # go through all bg jobs
    while process_job():
        pass

    # now check notifs...
    expected_notifs = [
        (user1, "user1", [3, 4, 5, 6, 7, 8]),
        (user2, "user2", [1, 2, 3, 4, 5, 6]),
        (user3, "user3", []),  # notifs off
        (user4, "user4", [1, 2, 6, 7, 8]),
        (user5, "user5", [3, 4, 5, 6, 7, 8]),
        (user6, "user6", [4, 5, 6, 7]),
    ]

    with session_scope() as session:
        for user, label, expected_msgs in expected_notifs:
            deliv = (
                session.execute(
                    select(Notification.data)
                    .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
                    .where(Notification.user_id == user.id)
                    .where(Notification.topic_action == topic_action)
                    .where(NotificationDelivery.delivery_type == NotificationDeliveryType.push)
                    .order_by(Notification.created)
                )
                .scalars()
                .all()
            )

            def parse_message_payload(data):
                return notification_data_pb2.ChatMessage.FromString(data).text

            contents = [parse_message_payload(d) for d in deliv]

            print(contents)

            assert [f"Test message {i}" for i in expected_msgs] == contents, f"Wrong messages for {label}"


def test_incomplete_profile(db):
    user1, token1 = generate_user(complete_profile=True)
    user2, token2 = generate_user(complete_profile=False)
    user3, token3 = generate_user(complete_profile=True)
    make_friends(user1, user2)
    make_friends(user1, user3)

    # user 1 can make a chat
    with conversations_session(token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))
        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        assert res.messages[0].text.text == "Test message 1"
        assert to_aware_datetime(res.messages[0].time) <= now()
        assert res.messages[0].author_user_id == user1.id

    # user 2 cannot
    with conversations_session(token2) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You have to complete your profile before you can send a message."
