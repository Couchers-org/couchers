from datetime import datetime

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2

from couchers import errors
from couchers.models import User
from pb import api_pb2, conversations_pb2
from tests.test_fixtures import (
    api_session,
    check_fd_leak,
    conversations_session,
    db,
    generate_user,
    make_friends,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig, check_fd_leak):
    pass


def test_list_group_chats(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user2, user1)
    make_friends(db, user1, user3)

    with conversations_session(db, token1) as c:
        # no threads initially
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 0

        # create some group chats with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message 2"))
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test group message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test group message 2"))

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

    with conversations_session(db, token2) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

    with conversations_session(db, token3) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 1
        assert res.no_more


def test_list_empty_group_chats(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user3)
    make_friends(db, user2, user1)
    make_friends(db, user2, user3)

    with conversations_session(db, token1) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 0

        c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

    with conversations_session(db, token2) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

        c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 3
        assert res.no_more

    with conversations_session(db, token3) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more


def test_list_group_chats_ordering(db):
    # user is member of 5 group chats, order them correctly
    user, token = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    user4, token4 = generate_user(db)

    make_friends(db, user2, user)
    make_friends(db, user2, user3)
    make_friends(db, user2, user4)
    make_friends(db, user3, user)
    make_friends(db, user3, user4)
    make_friends(db, user, user4)

    with conversations_session(db, token2) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id], title=wrappers_pb2.StringValue(value="Chat 0")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Chat 1")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Chat 2")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))

    with conversations_session(db, token3) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user2.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 3")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))

    with conversations_session(db, token) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id, user3.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 4")
            )
        )
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


def test_list_group_chats_ordering_after_left(db):
    # user is member to 4 group chats, and has left one.
    # The one user left has the most recent message, but user left before then,
    # this should display as e.g. 3rd most recent depending on last message when they were in the chat
    user, token = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    user4, token4 = generate_user(db)

    make_friends(db, user2, user)
    make_friends(db, user2, user3)
    make_friends(db, user2, user4)
    make_friends(db, user3, user)
    make_friends(db, user3, user4)
    make_friends(db, user, user4)

    with conversations_session(db, token2) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id], title=wrappers_pb2.StringValue(value="Chat 0")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Left Chat 1")
            )
        )
        left_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=left_chat_id, text="Test message"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Chat 2")
            )
        )
        chat2_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat2_id, text="Test message"))

    with conversations_session(db, token3) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user.id, user2.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 3")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))

    with conversations_session(db, token) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id, user3.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 4")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message"))

        # leave chat
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=left_chat_id))

    with conversations_session(db, token3) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat2_id, text="Test message"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=left_chat_id, text="Test message"))

    with conversations_session(db, token2) as c:
        # other user sends a message to that chat
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=left_chat_id, text="Another test message"))
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 5
        assert res.group_chats[0].title == "Left Chat 1"
        assert res.group_chats[1].title == "Chat 2"
        assert res.group_chats[2].title == "Chat 4"
        assert res.group_chats[3].title == "Chat 3"
        assert res.group_chats[4].title == "Chat 0"

    with conversations_session(db, token) as c:
        # we can't see the new message since we left before it was sent
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 5
        assert res.group_chats[0].title == "Chat 2"
        assert res.group_chats[1].title == "Left Chat 1"
        assert res.group_chats[2].title == "Chat 4"
        assert res.group_chats[3].title == "Chat 3"
        assert res.group_chats[4].title == "Chat 0"


def test_get_group_chat_messages(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)

    with conversations_session(db, token1) as c:
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
    with conversations_session(db, token3) as c:
        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        assert len(res.messages) == 0


def test_get_group_chat_messages_pagination(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    make_friends(db, user1, user2)

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        for i in range(30):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text=str(i)))

    with conversations_session(db, token2) as c:
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


def test_get_group_chat_messages_joined_left(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    user4, token4 = generate_user(db)
    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user1, user4)
    start_time = datetime.now()

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user4.id]))
        group_chat_id = res.group_chat_id

        for i in range(10):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text=str(i)))

        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))

        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="10"))

        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))

        # created + 10 normal + invited + normal
        assert len(res.messages) == 13

    with conversations_session(db, token3) as c:
        # can only see last message after invited
        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        # joined + normal
        assert len(res.messages) == 2
        assert res.messages[0].text.text == "10"

        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(db, token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="11"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="12"))

        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))

        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="13"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="14"))

    with conversations_session(db, token3) as c:
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
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user3, user1)

    with conversations_session(db, token1) as c:
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
        assert res.created.ToDatetime() <= datetime.now()
        assert res.only_admins_invite
        assert res.is_dm

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat2_id))
        assert not res.title
        assert user2.id in res.member_user_ids
        assert user3.id in res.member_user_ids
        assert user1.id in res.admin_user_ids
        assert res.created.ToDatetime() <= datetime.now()
        assert res.only_admins_invite
        assert not res.is_dm


def test_get_group_chat_info_denied(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    user4, token4 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user3, user1)

    with conversations_session(db, token1) as c:
        # create a group chat with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id, user3.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

    with conversations_session(db, token4) as c:
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_get_group_chat_info_left(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    user4, token4 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user3, user1)
    make_friends(db, user1, user4)

    with conversations_session(db, token1) as c:
        # create a group chat with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id, user3.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

    with conversations_session(db, token3) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(db, token1) as c:
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user4.id))

    with conversations_session(db, token3) as c:
        # this user left when user4 wasn't a member,
        # so the returned members should be user1, user2, and user3 only
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        print(res.member_user_ids)
        assert len(res.member_user_ids) == 3
        assert user1.id in res.member_user_ids
        assert user2.id in res.member_user_ids
        assert user3.id in res.member_user_ids


def test_edit_group_chat(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    make_friends(db, user1, user2)

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        group_chat_id = res.group_chat_id

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
    with conversations_session(db, token2) as c:
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
    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.EditGroupChat(
                conversations_pb2.EditGroupChatReq(
                    group_chat_id=group_chat_id,
                    title=wrappers_pb2.StringValue(value="Other title"),
                    only_admins_invite=wrappers_pb2.BoolValue(value=True),
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_make_remove_group_chat_admin(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        group_chat_id = res.group_chat_id

        # shouldn't be able to remove only admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(
                conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user1.id)
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_REMOVE_LAST_ADMIN

        c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user2.id))

        # shouldn't be able to make admin again
        with pytest.raises(grpc.RpcError) as e:
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.ALREADY_ADMIN

    with conversations_session(db, token2) as c:
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

    with conversations_session(db, token1) as c:
        c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user2.id))

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user1.id in res.admin_user_ids
        assert not user2.id in res.admin_user_ids

    with conversations_session(db, token2) as c:
        # shouldn't be able to make admin if not admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED


def test_send_message(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    make_friends(db, user1, user2)
    make_friends(db, user1, user3)

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))
        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        assert res.messages[0].text.text == "Test message 1"
        assert res.messages[0].time.ToDatetime() <= datetime.now()
        assert res.messages[0].author_user_id == user1.id

    # can't send message if not in chat
    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 2"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_leave_invite_to_group_chat(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    user4, token4 = generate_user(db)
    user5, token5 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user1, user5)
    make_friends(db, user2, user3)
    make_friends(db, user4, user3)

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user5.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

    # other user not in chat
    with conversations_session(db, token3) as c:
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

    with conversations_session(db, token2) as c:
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert not user3.id in res.member_user_ids

        # only_admins_invite defaults to true so shouldn't be able to invite
        with pytest.raises(grpc.RpcError) as e:
            res = c.InviteToGroupChat(
                conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id)
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(db, token1) as c:
        # can't invite non-friend
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user4.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.GROUP_CHAT_ONLY_INVITE_FRIENDS

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

    with conversations_session(db, token3) as c:
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user2.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user2.id in res.member_user_ids


def test_group_chats_with_messages_before_join(db):
    """
    If user 1 and 2 have a group chat and send messages, then add user 3; user 3
    should still see the group chat!
    """
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    user4, token4 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)
    make_friends(db, user1, user4)

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user4.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

    with conversations_session(db, token2) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 2"))

    with conversations_session(db, token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 3"))

        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))

    with conversations_session(db, token3) as c:
        # should work
        c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 1


def test_invite_to_dm(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

        # dm, shou;dn't be able to invite someone else
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_INVITE_TO_DM


def test_sole_admin_leaves(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))

        # sole admin can't leave group chat
        with pytest.raises(grpc.RpcError) as e:
            c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.LAST_ADMIN_CANT_LEAVE

    with conversations_session(db, token2) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(db, token3) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    # sole admin can leave when last in chat
    with conversations_session(db, token1) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))


def test_search_messages(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test message 2"))
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test group message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text="Test group message 4"))

        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="message "))
        assert len(res.results) == 4
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="group "))
        assert len(res.results) == 2
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="message 5"))
        assert len(res.results) == 0

    # outside user doesn't get results
    with conversations_session(db, token3) as c:
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))
        assert len(res.results) == 0


def test_search_messages_left_joined(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)
    user4, token4 = generate_user(db)
    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user1, user4)
    start_time = datetime.now()

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user4.id]))
        group_chat_id = res.group_chat_id
        for i in range(10):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message " + str(i)))

        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 10"))
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))

        assert len(res.results) == 11

    with conversations_session(db, token3) as c:
        # can only see last message after invited
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))

        assert len(res.results) == 1
        assert res.results[0].message.text.text == "Test message 10"

        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(db, token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 11"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 12"))
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=group_chat_id, user_id=user3.id))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 13"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 14"))

    with conversations_session(db, token3) as c:
        # can only see last message after invited
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))
        assert len(res.results) == 3
        assert res.results[0].message.text.text == "Test message 14"
        assert res.results[1].message.text.text == "Test message 13"
        assert res.results[2].message.text.text == "Test message 10"


def test_admin_behaviour(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)

    with conversations_session(db, token1) as c:
        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
        c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user2.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 2
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

    with conversations_session(db, token3) as c:
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

    with conversations_session(db, token2) as c:
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

    with conversations_session(db, token1) as c:
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

    with conversations_session(db, token2) as c:
        # can demote self if there are other admins
        c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user2.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 1
        assert user3.id in res.admin_user_ids

    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_REMOVE_LAST_ADMIN
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 1
        assert user3.id in res.admin_user_ids

        # last admin can't leave
        with pytest.raises(grpc.RpcError) as e:
            c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.LAST_ADMIN_CANT_LEAVE

        c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user1.id))

        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))

    with conversations_session(db, token2) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))

    # last participant must be admin but can leave to orphan chat
    with conversations_session(db, token1) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))


def test_last_seen(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)

    with conversations_session(db, token3) as c:
        # this is just here to mess up any issues we get if we pretend there's only one group chat ever
        gcid_distraction = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user1.id])
        ).group_chat_id

    with conversations_session(db, token1) as c:
        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id

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

    with conversations_session(db, token2) as c:
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

        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text=f"test message ..."))

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.unseen_message_count == 0

    with conversations_session(db, token3) as c:
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        # created + 7 normal
        assert res.unseen_message_count == 8

        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text=f"test message ..."))

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert res.unseen_message_count == 0


def test_one_dm_per_pair(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)

    with conversations_session(db, token1) as c:
        # create DM with user 2
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        assert res.is_dm

        # create DM with user 3
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm

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

    with conversations_session(db, token2) as c:
        # can create DM with user 3
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm

        # can't create another group chat with just user 1
        with pytest.raises(grpc.RpcError) as e:
            res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user1.id]))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION


def test_GetDirectMessage(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)

    with conversations_session(db, token1) as c:
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

        # create DM with user 3
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm

        # can create joined group chat
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id]))
        assert not res.is_dm

    with conversations_session(db, token2) as c:
        # can create DM with user 3
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm
        gcid = res.group_chat_id

        # DM with 3 should exist
        res = c.GetDirectMessage(conversations_pb2.GetDirectMessageReq(user_id=user3.id))
        assert res.group_chat_id == gcid


def test_total_unseen(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    # distractions
    user4, token4 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)

    # distractions
    make_friends(db, user1, user4)

    start_time = datetime.utcnow()

    with conversations_session(db, token1) as c:
        # distractions
        gcid_distraction = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user4.id])
        ).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text=f"distraction..."))

        gcid = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id

        for i in range(6):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text=f"test message {i}"))

        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text=f"distraction..."))

    # messages are automatically marked as seen when you send a new message
    with api_session(db, token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    with api_session(db, token2) as api:
        # chat created + 6 normal messages
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 7

    # now leave chat with user2
    with conversations_session(db, token2) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))

    with api_session(db, token2) as api:
        # seen messages becomes 0 when leaving
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    with conversations_session(db, token1) as c:
        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text=f"distraction..."))

        # send more stuff without user 2
        for i in range(3):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text=f"test message {i}"))

        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text=f"distraction..."))

    with api_session(db, token2) as api:
        # seen messages becomes 0 when leaving
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    with conversations_session(db, token1) as c:
        # add user 2 back
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(group_chat_id=gcid, user_id=user2.id))

        # send more stuff with user 2
        for i in range(12):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid, text=f"test message {i}"))

        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=gcid_distraction, text=f"distraction..."))

    with api_session(db, token2) as api:
        # joined + 12 normal
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 13


def test_regression_ListGroupChats_pagination(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)

    with conversations_session(db, token1) as c:
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

        seen_group_chat_ids = []

        next_message_id = 0
        more = True
        while more:
            res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq(last_message_id=next_message_id))
            next_message_id = res.next_message_id
            more = not res.no_more

            seen_group_chat_ids.extend([chat.group_chat_id for chat in res.group_chats])

        assert set(seen_group_chat_ids) == set(x[0] for x in group_chat_and_message_ids), "Not all group chats returned"
