from datetime import timedelta

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import func, select

from couchers.constants import MISSED_MESSAGES_DELAY
from couchers.db import session_scope
from couchers.jobs.handlers import send_message_notifications
from couchers.jobs.worker import process_job
from couchers.models import (
    GroupChatRole,
    GroupChatSubscription,
    Notification,
    NotificationDelivery,
    NotificationDeliveryType,
    NotificationTopicAction,
    RateLimitAction,
    RateLimitViolation,
)
from couchers.proto import api_pb2, notification_data_pb2, notifications_pb2
from couchers.rate_limits.definitions import RATE_LIMIT_DEFINITIONS, RATE_LIMIT_HOURS
from couchers.servicers import conversations
from couchers.utils import now, to_aware_datetime
from tests.fixtures.api import conversations as conversations_api
from tests.fixtures.api import notifications as notifications_api
from tests.fixtures.db import generate_user, make_friends, make_user_block, make_user_invisible
from tests.fixtures.misc import EmailCollector, Moderator, PushCollector, process_jobs
from tests.fixtures.rpc_errors import expect_rpc_error
from tests.fixtures.sessions import api_session
from tests.fixtures.timewarp import Timewarp


def test_list_group_chats(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user2, user1)
    make_friends(user1, user3)

    # no threads initially
    res = conversations_api.list_group_chats(token=token1)
    assert len(res.group_chats) == 0

    # create some group chats with messages
    group_chat = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id], title="Test title", approve_by=moderator
    )
    group_chat1_id = group_chat.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat.group_chat_id, text="Test message 1")
    conversations_api.send_message(token=token1, group_chat_id=group_chat.group_chat_id, text="Test message 2")
    group_chat = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    )
    group_chat2_id = group_chat.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat.group_chat_id, text="Test group message 1")
    conversations_api.send_message(token=token1, group_chat_id=group_chat.group_chat_id, text="Test group message 2")

    res = conversations_api.list_group_chats(token=token1)
    assert len(res.group_chats) == 2
    assert res.no_more

    res = conversations_api.list_group_chats(token=token2)
    assert len(res.group_chats) == 2
    assert res.no_more

    res = conversations_api.list_group_chats(token=token3)
    assert len(res.group_chats) == 1
    assert res.no_more

    # Test archive filtering: archive group_chat1 for user1
    archive_res = conversations_api.set_group_chat_archive_status(
        token=token1, group_chat_id=group_chat1_id, is_archived=True
    )
    assert archive_res.group_chat_id == group_chat1_id
    assert archive_res.is_archived

    # Without filter, returns all chats
    res = conversations_api.list_group_chats(token=token1)
    assert len(res.group_chats) == 2

    # only_archived=False returns non-archived chats only
    res = conversations_api.list_group_chats(token=token1, only_archived=False)
    assert len(res.group_chats) == 1

    # only_archived=True returns archived chats only
    res = conversations_api.list_group_chats(token=token1, only_archived=True)
    assert len(res.group_chats) == 1

    # user2 should still see both as non-archived (archive is per-user)
    res = conversations_api.list_group_chats(token=token2, only_archived=False)
    assert len(res.group_chats) == 2

    res = conversations_api.list_group_chats(token=token2, only_archived=True)
    assert len(res.group_chats) == 0


def test_list_empty_group_chats(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user3)
    make_friends(user2, user1)
    make_friends(user2, user3)

    res = conversations_api.list_group_chats(token=token1)
    assert len(res.group_chats) == 0

    res1 = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id], approve_by=moderator)
    res2 = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    )

    res = conversations_api.list_group_chats(token=token1)
    assert len(res.group_chats) == 2
    assert res.no_more

    res = conversations_api.list_group_chats(token=token2)
    assert len(res.group_chats) == 2
    assert res.no_more

    res3 = conversations_api.create_group_chat(token=token2, recipient_user_ids=[user3.id], approve_by=moderator)

    res = conversations_api.list_group_chats(token=token2)
    assert len(res.group_chats) == 3
    assert res.no_more

    res = conversations_api.list_group_chats(token=token3)
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

    res = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user.id], title="Chat 0", approve_by=moderator
    )
    chat_ids.append(res.group_chat_id)
    conversations_api.send_message(token=token2, group_chat_id=res.group_chat_id, text="Test message")
    res = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user.id, user3.id], title="Chat 1", approve_by=moderator
    )
    chat_ids.append(res.group_chat_id)
    conversations_api.send_message(token=token2, group_chat_id=res.group_chat_id, text="Test message")
    res = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user.id, user3.id], title="Chat 2", approve_by=moderator
    )
    chat_ids.append(res.group_chat_id)
    conversations_api.send_message(token=token2, group_chat_id=res.group_chat_id, text="Test message")

    res = conversations_api.create_group_chat(
        token=token3, recipient_user_ids=[user.id, user2.id, user4.id], title="Chat 3", approve_by=moderator
    )
    chat_ids.append(res.group_chat_id)
    conversations_api.send_message(token=token3, group_chat_id=res.group_chat_id, text="Test message")

    res = conversations_api.create_group_chat(
        token=token, recipient_user_ids=[user2.id, user3.id, user4.id], title="Chat 4", approve_by=moderator
    )
    conversations_api.send_message(token=token, group_chat_id=res.group_chat_id, text="Test message")
    group_chats_res = conversations_api.list_group_chats(token=token)
    assert len(group_chats_res.group_chats) == 5
    assert group_chats_res.group_chats[0].title == "Chat 4"
    assert group_chats_res.group_chats[1].title == "Chat 3"
    assert group_chats_res.group_chats[2].title == "Chat 2"
    assert group_chats_res.group_chats[3].title == "Chat 1"
    assert group_chats_res.group_chats[4].title == "Chat 0"

    conversations_api.send_message(
        token=token, group_chat_id=group_chats_res.group_chats[3].group_chat_id, text="Test message 2a"
    )
    conversations_api.send_message(
        token=token, group_chat_id=group_chats_res.group_chats[2].group_chat_id, text="Test message 2b"
    )

    group_chats_res = conversations_api.list_group_chats(token=token)
    assert len(group_chats_res.group_chats) == 5
    assert group_chats_res.group_chats[0].title == "Chat 2"
    assert group_chats_res.group_chats[0].latest_message.text.text == "Test message 2b"
    assert group_chats_res.group_chats[1].title == "Chat 1"
    assert group_chats_res.group_chats[1].latest_message.text.text == "Test message 2a"
    assert group_chats_res.group_chats[2].title == "Chat 4"
    assert group_chats_res.group_chats[3].title == "Chat 3"
    assert group_chats_res.group_chats[4].title == "Chat 0"


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

    res = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user.id], title="Chat 0", approve_by=moderator
    )
    chat_ids.append(res.group_chat_id)
    conversations_api.send_message(token=token2, group_chat_id=res.group_chat_id, text="Test message")
    res = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user.id, user3.id], title="Left Chat 1", approve_by=moderator
    )
    left_chat_id = res.group_chat_id
    chat_ids.append(left_chat_id)
    conversations_api.send_message(token=token2, group_chat_id=left_chat_id, text="Test message")
    res = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user.id, user3.id], title="Chat 2", approve_by=moderator
    )
    chat2_id = res.group_chat_id
    chat_ids.append(chat2_id)
    conversations_api.send_message(token=token2, group_chat_id=chat2_id, text="Test message")

    res = conversations_api.create_group_chat(
        token=token3, recipient_user_ids=[user.id, user2.id, user4.id], title="Chat 3", approve_by=moderator
    )
    chat_ids.append(res.group_chat_id)
    conversations_api.send_message(token=token3, group_chat_id=res.group_chat_id, text="Test message")

    res = conversations_api.create_group_chat(
        token=token, recipient_user_ids=[user2.id, user3.id, user4.id], title="Chat 4", approve_by=moderator
    )
    conversations_api.send_message(token=token, group_chat_id=res.group_chat_id, text="Test message")

    # leave chat
    conversations_api.leave_group_chat(token=token, group_chat_id=left_chat_id)

    conversations_api.send_message(token=token3, group_chat_id=chat2_id, text="Test message")
    conversations_api.send_message(token=token3, group_chat_id=left_chat_id, text="Test message")

    # other user sends a message to that chat
    conversations_api.send_message(token=token2, group_chat_id=left_chat_id, text="Another test message")
    group_chats_res = conversations_api.list_group_chats(token=token2)
    assert len(group_chats_res.group_chats) == 5
    assert group_chats_res.group_chats[0].title == "Left Chat 1"
    assert group_chats_res.group_chats[1].title == "Chat 2"
    assert group_chats_res.group_chats[2].title == "Chat 4"
    assert group_chats_res.group_chats[3].title == "Chat 3"
    assert group_chats_res.group_chats[4].title == "Chat 0"

    # we can't see the new message since we left before it was sent
    group_chats_res = conversations_api.list_group_chats(token=token)
    assert len(group_chats_res.group_chats) == 5
    assert group_chats_res.group_chats[0].title == "Chat 2"
    assert group_chats_res.group_chats[1].title == "Left Chat 1"
    assert group_chats_res.group_chats[2].title == "Chat 4"
    assert group_chats_res.group_chats[3].title == "Chat 3"
    assert group_chats_res.group_chats[4].title == "Chat 0"


def test_get_group_chat_messages(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)

    # create some threads with messages
    group_chat = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id])
    group_chat_id = group_chat.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat.group_chat_id, text="Test message 1")
    conversations_api.send_message(token=token1, group_chat_id=group_chat.group_chat_id, text="Test message 2")

    res = conversations_api.get_group_chat_messages(token=token1, group_chat_id=group_chat_id)
    # created + 2 normal
    assert len(res.messages) == 3
    assert res.no_more

    assert res.messages[0].text.text == "Test message 2"
    assert res.messages[1].text.text == "Test message 1"
    assert res.messages[2].WhichOneof("content") == "chat_created"

    # test that another user can't access the thread
    res = conversations_api.get_group_chat_messages(token=token3, group_chat_id=group_chat_id)
    assert len(res.messages) == 0


def test_get_group_chat_messages_pagination(db, moderator):
    sender_user, sender_token = generate_user()
    recipient_user, recipient_token = generate_user()
    make_friends(sender_user, recipient_user)

    group_chat = conversations_api.create_group_chat(
        token=sender_token, recipient_user_ids=[recipient_user.id], approve_by=moderator
    )
    group_chat_id = group_chat.group_chat_id
    for i in range(30):
        conversations_api.send_message(token=sender_token, group_chat_id=group_chat_id, text=str(i))

    res = conversations_api.get_group_chat_messages(token=recipient_token, group_chat_id=group_chat_id)
    # pagination
    assert len(res.messages) == 20
    assert res.messages[0].text.text == "29"
    assert res.messages[19].text.text == "10"
    assert not res.no_more
    res = conversations_api.get_group_chat_messages(
        token=recipient_token, group_chat_id=group_chat_id, last_message_id=res.messages[19].message_id
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

    group_chat = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user4.id], approve_by=moderator
    )
    group_chat_id = group_chat.group_chat_id

    for i in range(10):
        conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text=str(i))

    conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user3.id)

    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="10")

    res = conversations_api.get_group_chat_messages(token=token1, group_chat_id=group_chat_id)

    # created + 10 normal + invited + normal
    assert len(res.messages) == 13

    # can only see last message after invited
    res = conversations_api.get_group_chat_messages(token=token3, group_chat_id=group_chat_id)
    # joined + normal
    assert len(res.messages) == 2
    assert res.messages[0].text.text == "10"

    conversations_api.leave_group_chat(token=token3, group_chat_id=group_chat_id)

    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="11")
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="12")

    conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user3.id)

    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="13")
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="14")

    # can only see last message after invited
    res = conversations_api.get_group_chat_messages(token=token3, group_chat_id=group_chat_id)
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

    # create some threads with messages
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id], title="Test title")
    conversations_api.send_message(token=token1, group_chat_id=res.group_chat_id, text="Test message 1")
    conversations_api.send_message(token=token1, group_chat_id=res.group_chat_id, text="Test message 2")
    group_chat1_id = res.group_chat_id
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id, user3.id])
    conversations_api.send_message(token=token1, group_chat_id=res.group_chat_id, text="Test group message 1")
    conversations_api.send_message(token=token1, group_chat_id=res.group_chat_id, text="Test group message 2")
    group_chat2_id = res.group_chat_id

    res = conversations_api.get_group_chat(token=token1, group_chat_id=group_chat1_id)
    assert res.title == "Test title"
    assert user2.id in res.member_user_ids
    assert user1.id in res.admin_user_ids
    assert to_aware_datetime(res.created) <= now()
    assert res.only_admins_invite
    assert res.is_dm
    assert not res.is_archived

    res = conversations_api.get_group_chat(token=token1, group_chat_id=group_chat2_id)
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

    # create a group chat with messages
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id, user3.id], title="Test title")
    group_chat_id = res.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 1")

    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        res = conversations_api.get_group_chat(token=token4, group_chat_id=group_chat_id)


def test_get_group_chat_info_left(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_friends(user1, user2)
    make_friends(user3, user1)
    make_friends(user1, user4)

    # create a group chat with messages
    res = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], title="Test title", approve_by=moderator
    )
    group_chat_id = res.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 1")

    conversations_api.leave_group_chat(token=token3, group_chat_id=group_chat_id)

    conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user4.id)

    # this user left when user4 wasn't a member,
    # so the returned members should be user1, user2, and user3 only
    res = conversations_api.get_group_chat(token=token3, group_chat_id=group_chat_id)
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
    # create a group chat
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id, user3.id], title="Test title")
    group_chat_id = res.group_chat_id

    # remove a user from group
    conversations_api.remove_group_chat_user(token=token1, group_chat_id=group_chat_id, user_id=user2.id)
    assert user3.id in res.member_user_ids  # other users are still in the group

    # can't remove the same user twice
    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION):
        conversations_api.remove_group_chat_user(token=token1, group_chat_id=group_chat_id, user_id=user2.id)


def test_edit_group_chat(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)

    # create some threads with messages
    res = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id], title="Test title", approve_by=moderator
    )
    group_chat_id = res.group_chat_id

    conversations_api.edit_group_chat(
        token=token1, group_chat_id=group_chat_id, title="Modified title", only_admins_invite=False
    )
    res = conversations_api.get_group_chat(token=token1, group_chat_id=group_chat_id)
    assert res.title == "Modified title"
    assert not res.only_admins_invite

    # make sure non-admin is not allowed to modify
    with expect_rpc_error(grpc.StatusCode.PERMISSION_DENIED):
        conversations_api.edit_group_chat(
            token=token2, group_chat_id=group_chat_id, title="Other title", only_admins_invite=True
        )

    # make sure non-recipient is not allowed to modify
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        conversations_api.edit_group_chat(
            token=token3, group_chat_id=group_chat_id, title="Other title", only_admins_invite=True
        )


def test_make_remove_group_chat_admin(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    # create some threads with messages
    res = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    )
    group_chat_id = res.group_chat_id

    # shouldn't be able to remove only admin
    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION, "You can't remove the last admin."):
        conversations_api.remove_group_chat_admin(token=token1, group_chat_id=group_chat_id, user_id=user1.id)

    conversations_api.make_group_chat_admin(token=token1, group_chat_id=group_chat_id, user_id=user2.id)

    # shouldn't be able to make admin again
    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION, "That user is already an admin."):
        conversations_api.make_group_chat_admin(token=token1, group_chat_id=group_chat_id, user_id=user2.id)

    res = conversations_api.get_group_chat(token=token2, group_chat_id=group_chat_id)
    assert user1.id in res.admin_user_ids
    assert user2.id in res.admin_user_ids

    conversations_api.remove_group_chat_admin(token=token1, group_chat_id=group_chat_id, user_id=user2.id)

    res = conversations_api.get_group_chat(token=token1, group_chat_id=group_chat_id)
    assert user1.id in res.admin_user_ids
    assert user2.id not in res.admin_user_ids

    # shouldn't be able to make admin if not admin
    with expect_rpc_error(grpc.StatusCode.PERMISSION_DENIED):
        conversations_api.make_group_chat_admin(token=token2, group_chat_id=group_chat_id, user_id=user3.id)


def test_send_message(db, moderator: Moderator, push_collector: PushCollector, email_collector: EmailCollector):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)

    # Let user2 receive email notifications for every chat message
    notifications_api.set_notification_settings(
        token=token2,
        preferences=[
            notifications_pb2.SingleNotificationPreference(
                topic=NotificationTopicAction.chat__message.topic,
                action=NotificationTopicAction.chat__message.action,
                delivery_method="email",
                enabled=True,
            )
        ],
    )

    group_chat_title = "My group chat"
    message1 = "Test message 1"

    # Let user1 create a group chat with user2 and send a message
    res = conversations_api.create_group_chat(token=token1, title=group_chat_title, recipient_user_ids=[user2.id])
    group_chat_id = res.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text=message1)

    # Sender can already see group chat
    messages_res = conversations_api.get_group_chat_messages(token=token1, group_chat_id=group_chat_id)
    assert messages_res.messages[0].text.text == message1
    assert to_aware_datetime(messages_res.messages[0].time) <= now()
    assert messages_res.messages[0].author_user_id == user1.id

    # user2 sees nothing until the group chat is approved
    assert push_collector.count_for_user(user2.id) == 0
    assert email_collector.count_for_recipient(user2.email) == 0

    moderator.approve_group_chat(group_chat_id)

    # user2 gets email and push notifications
    push = push_collector.pop_for_user(user2.id, last=True)
    assert push.topic_action == NotificationTopicAction.chat__message.display
    assert user1.name in push.content.title
    assert group_chat_title in push.content.title
    assert push.content.ios_title == user1.name
    assert push.content.ios_subtitle == group_chat_title
    assert message1 in push.content.body

    email = email_collector.pop_for_recipient(user2.email, last=True)
    assert group_chat_title in email.subject
    assert message1 in email.plain
    assert message1 in email.html

    # can't send message if not in chat
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        conversations_api.send_message(token=token3, group_chat_id=group_chat_id, text="Test message 2")

    make_user_block(user2, user1)
    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION, "You can't send a message in this chat."):
        conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Message after block")


def test_send_direct_message(db, moderator: Moderator, push_collector: PushCollector, email_collector: EmailCollector):
    sender_user, sender_token = generate_user(complete_profile=True)
    recipient_user, recipient_token = generate_user(complete_profile=True)

    make_friends(sender_user, recipient_user)

    # Let user2 receive email notifications for every chat message
    notifications_api.set_notification_settings(
        token=recipient_token,
        preferences=[
            notifications_pb2.SingleNotificationPreference(
                topic=NotificationTopicAction.chat__message.topic,
                action=NotificationTopicAction.chat__message.action,
                delivery_method="email",
                enabled=True,
            )
        ],
    )

    # Let sender_user send two DM's to recipient_user
    message1 = "Hello, user2!"
    message2 = "One more message."

    # Send a DM from sender_user to recipient_user
    dm_group_chat_id = conversations_api.send_direct_message(
        token=sender_token, recipient_user_id=recipient_user.id, text=message1
    )
    moderator.approve_group_chat(dm_group_chat_id)

    conversations_api.send_direct_message(token=sender_token, recipient_user_id=recipient_user.id, text=message2)

    # recipient_user should have received push and email notifications for both messages
    push = push_collector.pop_for_user(recipient_user.id, last=False)
    assert push.topic_action == NotificationTopicAction.chat__message.display
    assert push.content.title == sender_user.name
    assert push.content.body == message1

    email = email_collector.pop_for_recipient(recipient_user.email, last=False)
    assert sender_user.name in email.subject
    assert message1 in email.plain
    assert message1 in email.html

    push = push_collector.pop_for_user(recipient_user.id, last=True)
    assert push.topic_action == NotificationTopicAction.chat__message.display
    assert push.content.title == sender_user.name
    assert push.content.body == message2

    email = email_collector.pop_for_recipient(recipient_user.email, last=True)
    assert sender_user.name in email.subject
    assert message2 in email.plain
    assert message2 in email.html

    # Fetch the chat by ID returned from SendDirectMessage
    chat = conversations_api.get_group_chat(token=recipient_token, group_chat_id=dm_group_chat_id)

    assert chat.is_dm
    group_chat_id = chat.group_chat_id

    # Verify that the messages was received
    messages = conversations_api.get_group_chat_messages(token=recipient_token, group_chat_id=group_chat_id).messages

    assert len(messages) == 2
    assert messages[0].text.text == message2
    assert messages[1].text.text == message1
    assert messages[0].author_user_id == sender_user.id


def test_excessive_chat_initiations_are_reported(db, low_rate_limits, email_collector: EmailCollector):
    """Test that excessive chat initiations are first reported in a warning email and finally lead blocking of further contacting other users."""
    user, token = generate_user()
    rate_limit_definition = RATE_LIMIT_DEFINITIONS[RateLimitAction.chat_initiation]
    # Test warning email
    for _ in range(rate_limit_definition.warning_limit):
        recipient_user, _ = generate_user()
        _ = conversations_api.create_group_chat(token=token, recipient_user_ids=[recipient_user.id])

    assert email_collector.count_for_reports() == 0

    recipient_user, _ = generate_user()
    _ = conversations_api.create_group_chat(token=token, recipient_user_ids=[recipient_user.id])

    email = email_collector.pop_for_reports(last=True)
    assert email.plain.startswith(
        f"User {user.username} has sent {rate_limit_definition.warning_limit} chat initiations in the past {RATE_LIMIT_HOURS} hours."
    )

    # Test new chat initiations fail after exceeding CHAT_INITIATION_HARD_LIMIT
    for _ in range(rate_limit_definition.hard_limit - rate_limit_definition.warning_limit - 1):
        recipient_user, _ = generate_user()
        _ = conversations_api.create_group_chat(token=token, recipient_user_ids=[recipient_user.id])

    assert email_collector.count_for_reports() == 0

    recipient_user, _ = generate_user()
    with expect_rpc_error(
        grpc.StatusCode.RESOURCE_EXHAUSTED,
        "You have messaged a lot of users in the past 24 hours. To avoid spam, you can't contact any more users for now.",
    ):
        _ = conversations_api.create_group_chat(token=token, recipient_user_ids=[recipient_user.id])

    email = email_collector.pop_for_reports(last=True)
    assert email.plain.startswith(
        f"User {user.username} has sent {rate_limit_definition.hard_limit} chat initiations in the past {RATE_LIMIT_HOURS} hours."
    )
    assert "The user has been blocked from sending further chat initiations for now." in email.plain

    with session_scope() as session:
        assert session.execute(
            select(RateLimitViolation.is_hard_limit)
            .where(RateLimitViolation.user_id == user.id)
            .order_by(RateLimitViolation.id)
        ).scalars().all() == [False, True]

    # still blocked once the hard violation is on record, without reporting again
    recipient_user, _ = generate_user()
    with expect_rpc_error(grpc.StatusCode.RESOURCE_EXHAUSTED):
        _ = conversations_api.create_group_chat(token=token, recipient_user_ids=[recipient_user.id])
    assert email_collector.count_for_reports() == 0


def test_send_direct_message_rate_limit(db, low_rate_limits, moderator, email_collector: EmailCollector):
    """SendDirectMessage should enforce the chat_initiation rate limit when creating a new DM, but not when sending into an existing one."""
    user, token = generate_user(complete_profile=True)
    rate_limit_definition = RATE_LIMIT_DEFINITIONS[RateLimitAction.chat_initiation]

    for _ in range(rate_limit_definition.warning_limit):
        recipient, _ = generate_user()
        conversations_api.send_direct_message(token=token, recipient_user_id=recipient.id, text="hi")

    assert email_collector.count_for_reports() == 0

    recipient, _ = generate_user()
    existing_dm_recipient_id = recipient.id
    conversations_api.send_direct_message(token=token, recipient_user_id=existing_dm_recipient_id, text="hi")

    email = email_collector.pop_for_reports(last=True)
    assert email.plain.startswith(
        f"User {user.username} has sent {rate_limit_definition.warning_limit} chat initiations in the past {RATE_LIMIT_HOURS} hours."
    )

    for _ in range(rate_limit_definition.hard_limit - rate_limit_definition.warning_limit - 1):
        recipient, _ = generate_user()
        conversations_api.send_direct_message(token=token, recipient_user_id=recipient.id, text="hi")

    assert email_collector.count_for_reports() == 0

    # follow-up into an existing DM must not count as a new initiation
    conversations_api.send_direct_message(token=token, recipient_user_id=existing_dm_recipient_id, text="follow-up")
    assert email_collector.count_for_reports() == 0

    recipient, _ = generate_user()
    with expect_rpc_error(
        grpc.StatusCode.RESOURCE_EXHAUSTED,
        "You have messaged a lot of users in the past 24 hours. To avoid spam, you can't contact any more users for now.",
    ):
        conversations_api.send_direct_message(token=token, recipient_user_id=recipient.id, text="hi")

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

    res = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user5.id], approve_by=moderator
    )
    group_chat_id = res.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 1")

    # other user not in chat
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        res = conversations_api.get_group_chat(token=token3, group_chat_id=group_chat_id)
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        conversations_api.invite_to_group_chat(token=token3, group_chat_id=group_chat_id, user_id=user4.id)
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        conversations_api.leave_group_chat(token=token3, group_chat_id=group_chat_id)

    res = conversations_api.get_group_chat(token=token2, group_chat_id=group_chat_id)
    assert user3.id not in res.member_user_ids

    # only_admins_invite defaults to true so shouldn't be able to invite
    with expect_rpc_error(grpc.StatusCode.PERMISSION_DENIED):
        conversations_api.invite_to_group_chat(token=token2, group_chat_id=group_chat_id, user_id=user3.id)
    conversations_api.leave_group_chat(token=token2, group_chat_id=group_chat_id)

    # invite invisible user fails
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user6.id)
    # invite fake user fails
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=999)
    # invite blocked user fails
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user7.id)
    # invite blocking user fails
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user8.id)

    conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user3.id)
    res = conversations_api.get_group_chat(token=token1, group_chat_id=group_chat_id)
    assert user1.id in res.member_user_ids
    assert user5.id in res.member_user_ids
    assert user3.id in res.member_user_ids

    # test non-admin inviting
    conversations_api.edit_group_chat(token=token1, group_chat_id=group_chat_id, only_admins_invite=False)

    conversations_api.invite_to_group_chat(token=token3, group_chat_id=group_chat_id, user_id=user2.id)
    res = conversations_api.get_group_chat(token=token3, group_chat_id=group_chat_id)
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

    res = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user4.id], approve_by=moderator
    )
    group_chat_id = res.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 1")

    conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="Test message 2")

    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 3")

    conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user3.id)

    # should work
    conversations_api.get_group_chat(token=token3, group_chat_id=group_chat_id)

    group_chats_res = conversations_api.list_group_chats(token=token3)
    assert len(group_chats_res.group_chats) == 1


def test_invite_to_dm(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id])
    group_chat_id = res.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 1")

    # dm, shou;dn't be able to invite someone else
    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION, "You can't invite other users to a direct message."):
        conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user3.id)


def test_sole_admin_leaves(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    res = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    )
    group_chat_id = res.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 1")

    # sole admin can't leave group chat
    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION, "The last admin can't leave a group chat."):
        conversations_api.leave_group_chat(token=token1, group_chat_id=group_chat_id)

    conversations_api.leave_group_chat(token=token2, group_chat_id=group_chat_id)

    conversations_api.leave_group_chat(token=token3, group_chat_id=group_chat_id)

    # sole admin can leave when last in chat
    conversations_api.leave_group_chat(token=token1, group_chat_id=group_chat_id)


def test_search_messages(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)

    # create some threads with messages, approved so they appear in search results
    group_chat = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id], approve_by=moderator)
    gc1_id = group_chat.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gc1_id, text="Test message 1")
    conversations_api.send_message(token=token1, group_chat_id=gc1_id, text="Test message 2")
    group_chat = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    )
    gc2_id = group_chat.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gc2_id, text="Test group message 3")
    conversations_api.send_message(token=token1, group_chat_id=gc2_id, text="Test group message 4")

    res = conversations_api.search_messages(token=token1, query="message ")
    assert len(res.results) == 4
    res = conversations_api.search_messages(token=token1, query="group ")
    assert len(res.results) == 2
    res = conversations_api.search_messages(token=token1, query="message 5")
    assert len(res.results) == 0

    # outside user doesn't get results
    res = conversations_api.search_messages(token=token3, query="Test message")
    assert len(res.results) == 0


def test_search_messages_left_joined(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user4)

    group_chat = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user4.id], approve_by=moderator
    )
    group_chat_id = group_chat.group_chat_id
    for i in range(10):
        conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message " + str(i))

    conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user3.id)
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 10")
    res = conversations_api.search_messages(token=token1, query="Test message")

    assert len(res.results) == 11

    # can only see last message after invited
    res = conversations_api.search_messages(token=token3, query="Test message")

    assert len(res.results) == 1
    assert res.results[0].message.text.text == "Test message 10"

    conversations_api.leave_group_chat(token=token3, group_chat_id=group_chat_id)

    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 11")
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 12")
    conversations_api.invite_to_group_chat(token=token1, group_chat_id=group_chat_id, user_id=user3.id)
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 13")
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 14")

    # can only see last message after invited
    res = conversations_api.search_messages(token=token3, query="Test message")
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

    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    ).group_chat_id
    conversations_api.make_group_chat_admin(token=token1, group_chat_id=gcid, user_id=user2.id)
    res = conversations_api.get_group_chat(token=token1, group_chat_id=gcid)
    assert len(res.admin_user_ids) == 2
    assert user1.id in res.admin_user_ids
    assert user2.id in res.admin_user_ids

    with expect_rpc_error(grpc.StatusCode.PERMISSION_DENIED):
        conversations_api.make_group_chat_admin(token=token3, group_chat_id=gcid, user_id=user3.id)
    with expect_rpc_error(grpc.StatusCode.PERMISSION_DENIED):
        conversations_api.remove_group_chat_admin(token=token3, group_chat_id=gcid, user_id=user1.id)
    res = conversations_api.get_group_chat(token=token3, group_chat_id=gcid)
    assert len(res.admin_user_ids) == 2
    assert user1.id in res.admin_user_ids
    assert user2.id in res.admin_user_ids

    conversations_api.make_group_chat_admin(token=token2, group_chat_id=gcid, user_id=user3.id)
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert len(res.admin_user_ids) == 3
    assert user1.id in res.admin_user_ids
    assert user2.id in res.admin_user_ids
    assert user3.id in res.admin_user_ids

    conversations_api.remove_group_chat_admin(token=token2, group_chat_id=gcid, user_id=user1.id)
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert len(res.admin_user_ids) == 2
    assert user2.id in res.admin_user_ids
    assert user3.id in res.admin_user_ids

    with pytest.raises(grpc.RpcError):
        conversations_api.make_group_chat_admin(token=token1, group_chat_id=gcid, user_id=user1.id)
    with pytest.raises(grpc.RpcError):
        conversations_api.make_group_chat_admin(token=token1, group_chat_id=gcid, user_id=user3.id)
    with pytest.raises(grpc.RpcError):
        conversations_api.remove_group_chat_admin(token=token1, group_chat_id=gcid, user_id=user2.id)
    res = conversations_api.get_group_chat(token=token1, group_chat_id=gcid)
    assert len(res.admin_user_ids) == 2
    assert user2.id in res.admin_user_ids
    assert user3.id in res.admin_user_ids

    # can demote self if there are other admins
    conversations_api.remove_group_chat_admin(token=token2, group_chat_id=gcid, user_id=user2.id)
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert len(res.admin_user_ids) == 1
    assert user3.id in res.admin_user_ids

    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION, "You can't remove the last admin."):
        conversations_api.remove_group_chat_admin(token=token3, group_chat_id=gcid, user_id=user3.id)
    res = conversations_api.get_group_chat(token=token3, group_chat_id=gcid)
    assert len(res.admin_user_ids) == 1
    assert user3.id in res.admin_user_ids

    # last admin can't leave
    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION, "The last admin can't leave a group chat."):
        conversations_api.leave_group_chat(token=token3, group_chat_id=gcid)

    conversations_api.make_group_chat_admin(token=token3, group_chat_id=gcid, user_id=user1.id)

    conversations_api.leave_group_chat(token=token3, group_chat_id=gcid)

    conversations_api.leave_group_chat(token=token2, group_chat_id=gcid)

    # last participant must be admin but can leave to orphan chat
    conversations_api.leave_group_chat(token=token1, group_chat_id=gcid)


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

    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id, user4.id, user5.id]
    ).group_chat_id

    make_user_invisible(user3.id)
    make_user_block(user1, user4)
    make_user_block(user5, user1)

    # make non-existent user admin
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.make_group_chat_admin(token=token1, group_chat_id=gcid, user_id=999)

    # make invisible user admin
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.make_group_chat_admin(token=token1, group_chat_id=gcid, user_id=user3.id)

    # make blocked user admin
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.make_group_chat_admin(token=token1, group_chat_id=gcid, user_id=user4.id)

    # make blocking user admin
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.make_group_chat_admin(token=token1, group_chat_id=gcid, user_id=user5.id)

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

    # remove non-existent user admin
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.remove_group_chat_admin(token=token1, group_chat_id=gcid, user_id=999)

    # remove invisible admin
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.remove_group_chat_admin(token=token1, group_chat_id=gcid, user_id=user3.id)

    # remove blocked admin
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.remove_group_chat_admin(token=token1, group_chat_id=gcid, user_id=user4.id)

    # remove blocking admin
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
        conversations_api.remove_group_chat_admin(token=token1, group_chat_id=gcid, user_id=user5.id)


def test_last_seen(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    # this is just here to mess up any issues we get if we pretend there's only one group chat ever
    gcid_distraction = conversations_api.create_group_chat(
        token=token3, recipient_user_ids=[user2.id, user1.id], approve_by=moderator
    ).group_chat_id

    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    ).group_chat_id

    message_ids = []

    for i in range(6):
        conversations_api.send_message(token=token1, group_chat_id=gcid_distraction, text=f"gibberish message... {i}")
        conversations_api.send_message(token=token1, group_chat_id=gcid, text=f"test message {i}")
        conversations_api.send_message(token=token1, group_chat_id=gcid_distraction, text=f"gibberish message {i}")

        message_ids.append(conversations_api.get_group_chat(token=token1, group_chat_id=gcid).latest_message.message_id)

    # messages are automatically marked as seen when you send a new message
    res = conversations_api.get_group_chat(token=token1, group_chat_id=gcid)
    assert res.unseen_message_count == 0

    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    # created + 6 normal
    assert res.unseen_message_count == 7

    backward_offset = 3
    conversations_api.mark_last_seen_group_chat(
        token=token2, group_chat_id=gcid, last_seen_message_id=message_ids[-backward_offset - 1]
    )

    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert res.unseen_message_count == backward_offset

    conversations_api.send_message(token=token2, group_chat_id=gcid, text="test message ...")

    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert res.unseen_message_count == 0

    res = conversations_api.get_group_chat(token=token3, group_chat_id=gcid)
    # created + 7 normal
    assert res.unseen_message_count == 8

    conversations_api.send_message(token=token3, group_chat_id=gcid, text="test message ...")

    res = conversations_api.get_group_chat(token=token3, group_chat_id=gcid)
    assert res.unseen_message_count == 0


def test_mark_last_seen_clears_notifications(db, moderator):
    sender_user, sender_token = generate_user()
    recipient_user, recipient_token = generate_user()

    gcid = conversations_api.create_group_chat(
        token=sender_token, recipient_user_ids=[recipient_user.id], title="Test chat", approve_by=moderator
    ).group_chat_id

    conversations_api.send_message(token=sender_token, group_chat_id=gcid, text="Hello")

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

    assert unseen_notification_count(recipient_user.id) > 0

    conversations_api.mark_last_seen_group_chat(token=recipient_token, group_chat_id=gcid, last_seen_message_id=1)

    assert unseen_notification_count(recipient_user.id) == 0


def test_mark_last_seen_clears_missed_messages_notification(db, moderator, timewarp: Timewarp):
    """
    Regression test: chat__missed_messages is a summary keyed with "" rather than a chat id, so it
    needs to be marked seen separately from the per-chat chat__message notifications.
    """
    sender_user, sender_token = generate_user()
    recipient_user, recipient_token = generate_user()

    # this notification is email-only by default, and the in-app feed only shows push-enabled ones
    notifications_api.set_notification_settings(
        token=recipient_token,
        preferences=[
            notifications_pb2.SingleNotificationPreference(
                topic=NotificationTopicAction.chat__missed_messages.topic,
                action=NotificationTopicAction.chat__missed_messages.action,
                delivery_method="push",
                enabled=True,
            )
        ],
    )

    gcid = conversations_api.create_group_chat(
        token=sender_token, recipient_user_ids=[recipient_user.id], title="Test chat", approve_by=moderator
    ).group_chat_id

    conversations_api.send_message(token=sender_token, group_chat_id=gcid, text="Hello!")

    # the job only picks up messages that have been unseen for five minutes
    timewarp.advance(MISSED_MESSAGES_DELAY)
    send_message_notifications(empty_pb2.Empty())
    process_jobs()

    def unseen_missed_messages():
        res = notifications_api.list_notifications(token=recipient_token, only_unread=True)
        return [
            notification
            for notification in res.notifications
            if notification.topic == NotificationTopicAction.chat__missed_messages.topic
            and notification.action == NotificationTopicAction.chat__missed_messages.action
        ]

    assert len(unseen_missed_messages()) == 1

    conversations_api.mark_last_seen_group_chat(token=recipient_token, group_chat_id=gcid, last_seen_message_id=1)

    assert unseen_missed_messages() == []


def test_one_dm_per_pair(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    # create DM with user 2
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id])
    assert res.is_dm
    dm_with_user2 = res.group_chat_id

    # create DM with user 3
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user3.id])
    assert res.is_dm
    dm_with_user3 = res.group_chat_id

    # can't create another group chat with just user 2
    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION):
        res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id])

    # can't create another group chat with just user 3
    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION):
        res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user3.id])

    # can create joined group chat
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id, user3.id])
    assert not res.is_dm

    # Approve the DMs so user2 can see them (otherwise they're SHADOWED and only visible to creator)
    moderator.approve_group_chat(dm_with_user2)

    # can create DM with user 3
    res = conversations_api.create_group_chat(token=token2, recipient_user_ids=[user3.id])
    assert res.is_dm

    # can't create another group chat with just user 1 (DM was approved, so user2 can see it)
    with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION):
        res = conversations_api.create_group_chat(token=token2, recipient_user_ids=[user1.id])


def test_GetDirectMessage(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    # no group chat with user 2
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        res = conversations_api.get_direct_message(token=token1, user_id=user2.id)

    # no group chat with nor user 3
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        res = conversations_api.get_direct_message(token=token1, user_id=user3.id)

    # create DM with user 2
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id])
    assert res.is_dm
    gcid = res.group_chat_id

    # now should exist
    res = conversations_api.get_direct_message(token=token1, user_id=user2.id)
    assert res.group_chat_id == gcid
    assert not res.is_archived

    # create DM with user 3
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user3.id])
    assert res.is_dm

    # can create joined group chat
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[user2.id, user3.id])
    assert not res.is_dm

    # can create DM with user 3
    res = conversations_api.create_group_chat(token=token2, recipient_user_ids=[user3.id])
    assert res.is_dm
    assert res.can_message
    gcid = res.group_chat_id

    # DM with 3 should exist, but can't message after being blocked
    make_user_block(user3, user2)
    res = conversations_api.get_direct_message(token=token2, user_id=user3.id)
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

    # distractions
    gcid_distraction = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user4.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gcid_distraction, text="distraction...")

    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    ).group_chat_id

    for i in range(6):
        conversations_api.send_message(token=token1, group_chat_id=gcid, text=f"test message {i}")

    # distractions
    conversations_api.send_message(token=token1, group_chat_id=gcid_distraction, text="distraction...")

    # messages are automatically marked as seen when you send a new message
    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    with api_session(token2) as api:
        # chat created + 6 normal messages
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 7

    # now leave chat with user2
    conversations_api.leave_group_chat(token=token2, group_chat_id=gcid)

    with api_session(token2) as api:
        # seen messages becomes 0 when leaving
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    # distractions
    conversations_api.send_message(token=token1, group_chat_id=gcid_distraction, text="distraction...")

    # send more stuff without user 2
    for i in range(3):
        conversations_api.send_message(token=token1, group_chat_id=gcid, text=f"test message {i}")

    # distractions
    conversations_api.send_message(token=token1, group_chat_id=gcid_distraction, text="distraction...")

    with api_session(token2) as api:
        # seen messages becomes 0 when leaving
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    # add user 2 back
    conversations_api.invite_to_group_chat(token=token1, group_chat_id=gcid, user_id=user2.id)

    # send more stuff with user 2
    for i in range(12):
        conversations_api.send_message(token=token1, group_chat_id=gcid, text=f"test message {i}")

    # distractions
    conversations_api.send_message(token=token1, group_chat_id=gcid_distraction, text="distraction...")

    with api_session(token2) as api:
        # joined + 12 normal
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 13


def test_left_group_chat_unseen_count_excludes_unreachable_messages(db, moderator):
    """
    ListGroupChats and GetGroupChat used to count messages sent after the viewer left the chat, which
    they can never open. The viewer is removed rather than leaving, because leaving posts a message of
    your own, which marks everything up to it seen.
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user2, user3)

    group_chat_id = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user1.id, user3.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="hi")
    conversations_api.remove_group_chat_user(token=token2, group_chat_id=group_chat_id, user_id=user1.id)
    for _ in range(3):
        conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="after you left")

    # chat created, "hi", and the removal notice; the three messages sent afterwards are out of reach
    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 3

    res = conversations_api.list_group_chats(token=token1)
    (listed,) = [gc for gc in res.group_chats if gc.group_chat_id == group_chat_id]
    assert listed.unseen_message_count == 3
    assert conversations_api.get_group_chat(token=token1, group_chat_id=group_chat_id).unseen_message_count == 3


def test_left_group_chat_can_be_marked_seen(db, moderator):
    """
    MarkLastSeenGroupChat used to require a subscription with left == None, so a chat you were removed
    from kept contributing to the unread badge with no way to clear it.
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user2, user3)

    group_chat_id = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user1.id, user3.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="hi")
    conversations_api.remove_group_chat_user(token=token2, group_chat_id=group_chat_id, user_id=user1.id)
    conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="after you left")

    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 3

    latest_message_id = conversations_api.get_group_chat(
        token=token1, group_chat_id=group_chat_id
    ).latest_message.message_id
    conversations_api.mark_last_seen_group_chat(
        token=token1, group_chat_id=group_chat_id, last_seen_message_id=latest_message_id
    )

    assert conversations_api.get_group_chat(token=token1, group_chat_id=group_chat_id).unseen_message_count == 0

    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="let me back in")

    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0


def test_rejoined_group_chat_ping_reads_newest_subscription(db, moderator):
    """
    Rejoining a chat leaves the earlier subscription behind with its own last-seen state. Ping used to
    match on any of the viewer's subscriptions, so the stale one kept the badge up forever.
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user2, user3)

    group_chat_id = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user1.id, user3.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="hi")
    # removed rather than leaving, so user1's first subscription is left behind with unread messages
    conversations_api.remove_group_chat_user(token=token2, group_chat_id=group_chat_id, user_id=user1.id)
    conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="while you were away")
    conversations_api.invite_to_group_chat(token=token2, group_chat_id=group_chat_id, user_id=user1.id)
    conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="welcome back")

    # only the invite notice and "welcome back" are in reach of the newest subscription
    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 2

    latest_message_id = conversations_api.get_group_chat(
        token=token1, group_chat_id=group_chat_id
    ).latest_message.message_id
    conversations_api.mark_last_seen_group_chat(
        token=token1, group_chat_id=group_chat_id, last_seen_message_id=latest_message_id
    )

    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0


def test_rejoined_group_chat_only_unseen_matches_the_badge(db, moderator):
    """
    GetGroupChatMessages matched only_unseen against every one of the viewer's subscriptions, so the
    abandoned one served up its unread messages even though the badge no longer counts them.
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user2, user3)

    group_chat_id = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user1.id, user3.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="hi")
    conversations_api.remove_group_chat_user(token=token2, group_chat_id=group_chat_id, user_id=user1.id)
    conversations_api.invite_to_group_chat(token=token2, group_chat_id=group_chat_id, user_id=user1.id)
    conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="welcome back")

    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 2

    unseen = conversations_api.get_group_chat_messages(
        token=token1, group_chat_id=group_chat_id, only_unseen=True
    ).messages
    assert [m.WhichOneof("content") for m in unseen] == ["text", "user_invited"]
    assert unseen[0].text.text == "welcome back"

    # the earlier stint is still readable, it just isn't unread
    all_messages = conversations_api.get_group_chat_messages(token=token1, group_chat_id=group_chat_id).messages
    assert [m.text.text for m in all_messages if m.WhichOneof("content") == "text"] == ["welcome back", "hi"]


def test_rejoined_group_chat_archived_filter_reads_newest_subscription(db, moderator):
    """
    ListGroupChats applied the archived filter before picking the newest subscription, so a chat
    archived before the viewer was removed stayed in their archived list off the abandoned
    subscription, where nothing could ever mark it seen.
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user2, user3)

    group_chat_id = conversations_api.create_group_chat(
        token=token2, recipient_user_ids=[user1.id, user3.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token2, group_chat_id=group_chat_id, text="hi")

    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=group_chat_id, is_archived=True)

    conversations_api.remove_group_chat_user(token=token2, group_chat_id=group_chat_id, user_id=user1.id)
    conversations_api.invite_to_group_chat(token=token2, group_chat_id=group_chat_id, user_id=user1.id)

    archived = conversations_api.list_group_chats(token=token1, only_archived=True).group_chats
    assert [gc.group_chat_id for gc in archived] == []

    (listed,) = conversations_api.list_group_chats(token=token1, only_archived=False).group_chats
    assert listed.group_chat_id == group_chat_id
    assert not listed.is_archived


def test_regression_ListGroupChats_pagination(db, moderator, monkeypatch):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)

    # two full pages and a partial one, which is the shape that lost chats, without paying for a
    # chat per row of a production-sized page
    monkeypatch.setattr(conversations, "DEFAULT_PAGINATION_LENGTH", 3)

    # tuples of (group_chat_id, message_id)
    group_chat_and_message_ids = []
    for i in range(7):
        res1 = conversations_api.create_group_chat(
            token=token1, recipient_user_ids=[user2.id, user3.id], title=f"Chat {i}", approve_by=moderator
        )

        conversations_api.send_message(token=token1, group_chat_id=res1.group_chat_id, text=f"Test message {i}")

        res2 = conversations_api.get_group_chat(token=token1, group_chat_id=res1.group_chat_id)

        group_chat_and_message_ids.append((res2.group_chat_id, res2.latest_message.message_id))

    seen_group_chat_ids = []

    pages = 0
    last_message_id = 0
    more = True
    while more:
        res = conversations_api.list_group_chats(token=token1, last_message_id=last_message_id)
        last_message_id = res.last_message_id
        more = not res.no_more
        pages += 1

        seen_group_chat_ids.extend([chat.group_chat_id for chat in res.group_chats])

    assert pages == 3, "The chats didn't come back over several pages, so nothing was paginated"
    assert set(seen_group_chat_ids) == {x[0] for x in group_chat_and_message_ids}, "Not all group chats returned"


def test_muting(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    # this is just here to mess up any issues we get if we pretend there's only one group chat ever
    gcid_distraction = conversations_api.create_group_chat(
        token=token3, recipient_user_ids=[user2.id, user1.id], approve_by=moderator
    ).group_chat_id

    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    ).group_chat_id

    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert not res.mute_info.muted
    assert not res.mute_info.HasField("muted_until")

    conversations_api.mute_group_chat(token=token2, group_chat_id=gcid, forever=True)
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert res.mute_info.muted
    assert not res.mute_info.HasField("muted_until")

    conversations_api.mute_group_chat(token=token2, group_chat_id=gcid, unmute=True)
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert not res.mute_info.muted
    assert not res.mute_info.HasField("muted_until")

    conversations_api.mute_group_chat(token=token2, group_chat_id=gcid, for_duration=timedelta(hours=2))
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
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
    gcid_distraction = conversations_api.create_group_chat(
        token=token3, recipient_user_ids=[user2.id, user1.id], approve_by=moderator
    ).group_chat_id

    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    ).group_chat_id

    # Test basic archive/unarchive functionality
    # Initially not archived
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert not res.is_archived

    # Archive the chat
    archive_res = conversations_api.set_group_chat_archive_status(token=token2, group_chat_id=gcid, is_archived=True)
    assert archive_res.group_chat_id == gcid
    assert archive_res.is_archived

    # Verify archived via GetGroupChat
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert res.is_archived

    # Unarchive the chat
    archive_res = conversations_api.set_group_chat_archive_status(token=token2, group_chat_id=gcid, is_archived=False)
    assert archive_res.group_chat_id == gcid
    assert not archive_res.is_archived

    # Verify unarchived via GetGroupChat
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert not res.is_archived


def test_archiving_per_user(db, moderator):
    """Test that archiving is per-user - one user archiving doesn't affect others"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_friends(user1, user2)

    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gcid, text="Hello")

    # User1 archives the chat
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid, is_archived=True)
    res = conversations_api.get_group_chat(token=token1, group_chat_id=gcid)
    assert res.is_archived

    # User2 should NOT see it as archived
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert not res.is_archived

    # User2 archives it too
    conversations_api.set_group_chat_archive_status(token=token2, group_chat_id=gcid, is_archived=True)
    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert res.is_archived

    # User1 unarchives - user2 should still see it as archived
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid, is_archived=False)
    res = conversations_api.get_group_chat(token=token1, group_chat_id=gcid)
    assert not res.is_archived

    res = conversations_api.get_group_chat(token=token2, group_chat_id=gcid)
    assert res.is_archived


def test_archiving_with_list_group_chats(db, moderator):
    """Test archive filtering with ListGroupChats endpoint"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)

    # Create 3 chats
    gcid1 = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gcid1, text="Chat 1")

    gcid2 = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user3.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gcid2, text="Chat 2")

    gcid3 = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gcid3, text="Chat 3")

    # Initially all 3 chats should be visible
    res = conversations_api.list_group_chats(token=token1)
    assert len(res.group_chats) == 3

    # All should be non-archived
    res = conversations_api.list_group_chats(token=token1, only_archived=False)
    assert len(res.group_chats) == 3

    # None should be archived
    res = conversations_api.list_group_chats(token=token1, only_archived=True)
    assert len(res.group_chats) == 0

    # Archive chat 1
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid1, is_archived=True)

    # Without filter, still see all 3
    res = conversations_api.list_group_chats(token=token1)
    assert len(res.group_chats) == 3

    # Non-archived should show 2
    res = conversations_api.list_group_chats(token=token1, only_archived=False)
    assert len(res.group_chats) == 2
    assert gcid1 not in [gc.group_chat_id for gc in res.group_chats]

    # Archived should show 1
    res = conversations_api.list_group_chats(token=token1, only_archived=True)
    assert len(res.group_chats) == 1
    assert res.group_chats[0].group_chat_id == gcid1
    assert res.group_chats[0].is_archived

    # Archive chat 2 as well
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid2, is_archived=True)

    # Non-archived should show 1
    res = conversations_api.list_group_chats(token=token1, only_archived=False)
    assert len(res.group_chats) == 1
    assert res.group_chats[0].group_chat_id == gcid3

    # Archived should show 2
    res = conversations_api.list_group_chats(token=token1, only_archived=True)
    assert len(res.group_chats) == 2
    archived_ids = {gc.group_chat_id for gc in res.group_chats}
    assert archived_ids == {gcid1, gcid2}

    # Unarchive chat 1
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid1, is_archived=False)

    # Non-archived should show 2
    res = conversations_api.list_group_chats(token=token1, only_archived=False)
    assert len(res.group_chats) == 2

    # Archived should show 1
    res = conversations_api.list_group_chats(token=token1, only_archived=True)
    assert len(res.group_chats) == 1
    assert res.group_chats[0].group_chat_id == gcid2


def test_archiving_chat_not_found(db, moderator):
    """Test that archiving a non-existent or non-accessible chat fails"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)

    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gcid, text="Hello")

    # User3 is not in the chat - should get NOT_FOUND
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        conversations_api.set_group_chat_archive_status(token=token3, group_chat_id=gcid, is_archived=True)

    # Non-existent chat ID should fail
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=99999, is_archived=True)


def test_archiving_after_leaving_chat(db, moderator):
    """Test that you can't archive a chat after leaving it"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gcid, text="Hello")

    # User2 leaves the chat
    conversations_api.leave_group_chat(token=token2, group_chat_id=gcid)

    # User2 should not be able to archive it now
    with expect_rpc_error(grpc.StatusCode.NOT_FOUND):
        conversations_api.set_group_chat_archive_status(token=token2, group_chat_id=gcid, is_archived=True)


def test_archiving_dm(db, moderator):
    """Test that archiving works for DMs as well as group chats"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_friends(user1, user2)

    # Create a DM
    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gcid, text="Hello")

    # Verify it's a DM
    res = conversations_api.get_group_chat(token=token1, group_chat_id=gcid)
    assert res.is_dm
    assert not res.is_archived

    # Archive the DM
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid, is_archived=True)

    res = conversations_api.get_group_chat(token=token1, group_chat_id=gcid)
    assert res.is_archived

    # Unarchive it
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid, is_archived=False)

    res = conversations_api.get_group_chat(token=token1, group_chat_id=gcid)
    assert not res.is_archived


def test_archiving_idempotent(db, moderator):
    """Test that archiving/unarchiving is idempotent"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_friends(user1, user2)

    gcid = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id], approve_by=moderator
    ).group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=gcid, text="Hello")

    # Archive twice - should work without error
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid, is_archived=True)
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid, is_archived=True)
    res = conversations_api.get_group_chat(token=token1, group_chat_id=gcid)
    assert res.is_archived

    # Unarchive twice - should work without error
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid, is_archived=False)
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=gcid, is_archived=False)
    res = conversations_api.get_group_chat(token=token1, group_chat_id=gcid)
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
        notifications_api.set_notification_settings(
            token=token,
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

    def send_msg(token, i):
        conversations_api.send_message(token=token, group_chat_id=group_chat_id, text=f"Test message {i}")

    res = conversations_api.create_group_chat(
        token=token1, recipient_user_ids=[user2.id, user3.id, user4.id], approve_by=moderator
    )
    group_chat_id = res.group_chat_id
    conversations_api.edit_group_chat(token=token1, group_chat_id=group_chat_id, only_admins_invite=False)
    send_msg(token1, i=1)
    send_msg(token1, i=2)

    conversations_api.invite_to_group_chat(token=token4, group_chat_id=group_chat_id, user_id=user5.id)
    send_msg(token4, i=3)
    conversations_api.invite_to_group_chat(token=token4, group_chat_id=group_chat_id, user_id=user6.id)
    send_msg(token4, i=4)
    send_msg(token4, i=5)

    send_msg(token3, i=6)
    conversations_api.leave_group_chat(token=token3, group_chat_id=group_chat_id)

    send_msg(token2, i=7)
    conversations_api.leave_group_chat(token=token2, group_chat_id=group_chat_id)

    send_msg(token6, i=8)

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
    incomplete_user, incomplete_token = generate_user(complete_profile=False)
    user3, token3 = generate_user(complete_profile=True)
    make_friends(user1, incomplete_user)
    make_friends(user1, user3)

    # user 1 can make a chat
    res = conversations_api.create_group_chat(token=token1, recipient_user_ids=[incomplete_user.id])
    group_chat_id = res.group_chat_id
    conversations_api.send_message(token=token1, group_chat_id=group_chat_id, text="Test message 1")
    messages_res = conversations_api.get_group_chat_messages(token=token1, group_chat_id=group_chat_id)
    assert messages_res.messages[0].text.text == "Test message 1"
    assert to_aware_datetime(messages_res.messages[0].time) <= now()
    assert messages_res.messages[0].author_user_id == user1.id

    # incomplete_user cannot
    with expect_rpc_error(
        grpc.StatusCode.FAILED_PRECONDITION,
        "You have to complete your profile before you can send a message.",
    ):
        conversations_api.create_group_chat(token=incomplete_token, recipient_user_ids=[user3.id])
