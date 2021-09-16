import grpc
import pytest
from google.protobuf import wrappers_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.models import ChatRole, ChatSubscription
from couchers.sql import couchers_select as select
from couchers.utils import now, to_aware_datetime
from proto import api_pb2, conversations_pb2
from tests.test_fixtures import (  # noqa
    api_session,
    conversations_session,
    db,
    generate_user,
    make_friends,
    make_user_block,
    make_user_invisible,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_list_chats(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user2, user1)
    make_friends(user1, user3)

    with conversations_session(token1) as c:
        # no threads initially
        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 0

        # create some group chats with messages
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message 2"))
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test group message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test group message 2"))

        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 2
        assert not res.next_page_token

    with conversations_session(token2) as c:
        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 2
        assert not res.next_page_token

    with conversations_session(token3) as c:
        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 1
        assert not res.next_page_token


def test_list_empty_chats(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user3)
    make_friends(user2, user1)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 0

        c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id]))
        c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id]))

        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 2
        assert not res.next_page_token

    with conversations_session(token2) as c:
        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 2
        assert not res.next_page_token

        c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user3.id]))

        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 3
        assert not res.next_page_token

    with conversations_session(token3) as c:
        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 2
        assert not res.next_page_token


def test_list_chats_ordering(db):
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

    with conversations_session(token2) as c:
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user.id], title=wrappers_pb2.StringValue(value="Chat 0")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message"))
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Chat 1")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message"))
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Chat 2")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message"))

    with conversations_session(token3) as c:
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user.id, user2.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 3")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message"))

    with conversations_session(token) as c:
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user2.id, user3.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 4")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message"))
        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 5
        assert res.chats[0].title == "Chat 4"
        assert res.chats[1].title == "Chat 3"
        assert res.chats[2].title == "Chat 2"
        assert res.chats[3].title == "Chat 1"
        assert res.chats[4].title == "Chat 0"

        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chats[3].chat_id, text="Test message 2a"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chats[2].chat_id, text="Test message 2b"))

        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 5
        assert res.chats[0].title == "Chat 2"
        assert res.chats[0].latest_message.text.text == "Test message 2b"
        assert res.chats[1].title == "Chat 1"
        assert res.chats[1].latest_message.text.text == "Test message 2a"
        assert res.chats[2].title == "Chat 4"
        assert res.chats[3].title == "Chat 3"
        assert res.chats[4].title == "Chat 0"


def test_list_chats_ordering_after_left(db):
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

    with conversations_session(token2) as c:
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user.id], title=wrappers_pb2.StringValue(value="Chat 0")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message"))
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Left Chat 1")
            )
        )
        left_chat_id = res.chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=left_chat_id, text="Test message"))
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user.id, user3.id], title=wrappers_pb2.StringValue(value="Chat 2")
            )
        )
        chat2_id = res.chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat2_id, text="Test message"))

    with conversations_session(token3) as c:
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user.id, user2.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 3")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message"))

    with conversations_session(token) as c:
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user2.id, user3.id, user4.id], title=wrappers_pb2.StringValue(value="Chat 4")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message"))

        # leave chat
        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=left_chat_id))

    with conversations_session(token3) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat2_id, text="Test message"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=left_chat_id, text="Test message"))

    with conversations_session(token2) as c:
        # other user sends a message to that chat
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=left_chat_id, text="Another test message"))
        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 5
        assert res.chats[0].title == "Left Chat 1"
        assert res.chats[1].title == "Chat 2"
        assert res.chats[2].title == "Chat 4"
        assert res.chats[3].title == "Chat 3"
        assert res.chats[4].title == "Chat 0"

    with conversations_session(token) as c:
        # we can't see the new message since we left before it was sent
        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 5
        assert res.chats[0].title == "Chat 2"
        assert res.chats[1].title == "Left Chat 1"
        assert res.chats[2].title == "Chat 4"
        assert res.chats[3].title == "Chat 3"
        assert res.chats[4].title == "Chat 0"


def test_get_chat_messages(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)

    with conversations_session(token1) as c:
        # create some threads with messages
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id]))
        chat_id = res.chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message 2"))

        res = c.GetChatMessages(conversations_pb2.GetChatMessagesReq(chat_id=chat_id))
        # created + 2 normal
        assert len(res.messages) == 3
        assert not res.next_page_token

        assert res.messages[0].text.text == "Test message 2"
        assert res.messages[1].text.text == "Test message 1"
        assert res.messages[2].WhichOneof("content") == "chat_created"

    # test that another user can't access the thread
    with conversations_session(token3) as c:
        res = c.GetChatMessages(conversations_pb2.GetChatMessagesReq(chat_id=chat_id))
        assert len(res.messages) == 0


def test_get_chat_messages_pagination(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_friends(user1, user2)

    with conversations_session(token1) as c:
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id]))
        chat_id = res.chat_id
        for i in range(30):
            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text=str(i)))

    with conversations_session(token2) as c:
        res = c.GetChatMessages(conversations_pb2.GetChatMessagesReq(chat_id=chat_id))
        # pagination
        assert len(res.messages) == 20
        assert res.messages[0].text.text == "29"
        assert res.messages[19].text.text == "10"
        assert res.next_page_token
        res = c.GetChatMessages(conversations_pb2.GetChatMessagesReq(chat_id=chat_id, page_token=res.next_page_token))
        assert len(res.messages) == 11
        assert res.messages[0].text.text == "9"
        assert res.messages[9].text.text == "0"
        assert not res.next_page_token


def test_get_chat_messages_joined_left(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user4)
    start_time = now()

    with conversations_session(token1) as c:
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user4.id]))
        chat_id = res.chat_id

        for i in range(10):
            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text=str(i)))

        c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user3.id))

        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="10"))

        res = c.GetChatMessages(conversations_pb2.GetChatMessagesReq(chat_id=chat_id))

        # created + 10 normal + invited + normal
        assert len(res.messages) == 13

    with conversations_session(token3) as c:
        # can only see last message after invited
        res = c.GetChatMessages(conversations_pb2.GetChatMessagesReq(chat_id=chat_id))
        # joined + normal
        assert len(res.messages) == 2
        assert res.messages[0].text.text == "10"

        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=chat_id))

    with conversations_session(token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="11"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="12"))

        c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user3.id))

        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="13"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="14"))

    with conversations_session(token3) as c:
        # can only see last message after invited
        res = c.GetChatMessages(conversations_pb2.GetChatMessagesReq(chat_id=chat_id))
        # joined + normal + left + invite + 2 normal
        assert len(res.messages) == 6
        assert res.messages[0].text.text == "14"
        assert res.messages[1].text.text == "13"
        assert res.messages[2].WhichOneof("content") == "user_invited"
        assert res.messages[3].WhichOneof("content") == "user_left"
        assert res.messages[4].text.text == "10"
        assert res.messages[5].WhichOneof("content") == "user_invited"


def test_get_chat_info(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user3, user1)

    with conversations_session(token1) as c:
        # create some threads with messages
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message 2"))
        chat1_id = res.chat_id
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test group message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test group message 2"))
        chat2_id = res.chat_id

        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat1_id))
        assert res.title == "Test title"
        assert user2.id in res.member_user_ids
        assert user1.id in res.admin_user_ids
        assert to_aware_datetime(res.created) <= now()
        assert res.only_admins_invite
        assert res.is_dm

        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat2_id))
        assert not res.title
        assert user2.id in res.member_user_ids
        assert user3.id in res.member_user_ids
        assert user1.id in res.admin_user_ids
        assert to_aware_datetime(res.created) <= now()
        assert res.only_admins_invite
        assert not res.is_dm


def test_get_chat_info_denied(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_friends(user1, user2)
    make_friends(user3, user1)

    with conversations_session(token1) as c:
        # create a group chat with messages
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user2.id, user3.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        chat_id = res.chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 1"))

    with conversations_session(token4) as c:
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_get_chat_info_left(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_friends(user1, user2)
    make_friends(user3, user1)
    make_friends(user1, user4)

    with conversations_session(token1) as c:
        # create a group chat with messages
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user2.id, user3.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        chat_id = res.chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 1"))

    with conversations_session(token3) as c:
        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=chat_id))

    with conversations_session(token1) as c:
        c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user4.id))

    with conversations_session(token3) as c:
        # this user left when user4 wasn't a member,
        # so the returned members should be user1, user2, and user3 only
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id))
        assert len(res.member_user_ids) == 3
        assert user1.id in res.member_user_ids
        assert user2.id in res.member_user_ids
        assert user3.id in res.member_user_ids


def test_remove_chat_user(db):
    # create 3 uses and connect them
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)

    # using user token, create a Conversations API for testing
    with conversations_session(token1) as c:
        # create a group chat
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user2.id, user3.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        chat_id = res.chat_id

        # remove a user from group
        c.RemoveChatUser(conversations_pb2.RemoveChatUserReq(chat_id=chat_id, user_id=user2.id))
        assert user3.id in res.member_user_ids  # other users are still in the group

        # can't remove the same user twice
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveChatUser(conversations_pb2.RemoveChatUserReq(chat_id=chat_id, user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION


def test_edit_chat(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)

    with conversations_session(token1) as c:
        # create some threads with messages
        res = c.CreateChat(
            conversations_pb2.CreateChatReq(
                recipient_user_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")
            )
        )
        chat_id = res.chat_id

        c.EditChat(
            conversations_pb2.EditChatReq(
                chat_id=chat_id,
                title=wrappers_pb2.StringValue(value="Modified title"),
                only_admins_invite=wrappers_pb2.BoolValue(value=False),
            )
        )
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id))
        assert res.title == "Modified title"
        assert not res.only_admins_invite

    # make sure non-admin is not allowed to modify
    with conversations_session(token2) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.EditChat(
                conversations_pb2.EditChatReq(
                    chat_id=chat_id,
                    title=wrappers_pb2.StringValue(value="Other title"),
                    only_admins_invite=wrappers_pb2.BoolValue(value=True),
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

    # make sure non-recipient is not allowed to modify
    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.EditChat(
                conversations_pb2.EditChatReq(
                    chat_id=chat_id,
                    title=wrappers_pb2.StringValue(value="Other title"),
                    only_admins_invite=wrappers_pb2.BoolValue(value=True),
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_make_remove_chat_admin(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        # create some threads with messages
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id]))
        chat_id = res.chat_id

        # shouldn't be able to remove only admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=chat_id, user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_REMOVE_LAST_ADMIN

        c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=chat_id, user_id=user2.id))

        # shouldn't be able to make admin again
        with pytest.raises(grpc.RpcError) as e:
            c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=chat_id, user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.ALREADY_ADMIN

    with conversations_session(token2) as c:
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id))
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

    with conversations_session(token1) as c:
        c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=chat_id, user_id=user2.id))

        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id))
        assert user1.id in res.admin_user_ids
        assert not user2.id in res.admin_user_ids

    with conversations_session(token2) as c:
        # shouldn't be able to make admin if not admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=chat_id, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED


def test_send_message(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)

    with conversations_session(token1) as c:
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id]))
        chat_id = res.chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 1"))
        res = c.GetChatMessages(conversations_pb2.GetChatMessagesReq(chat_id=chat_id))
        assert res.messages[0].text.text == "Test message 1"
        assert to_aware_datetime(res.messages[0].time) <= now()
        assert res.messages[0].author_user_id == user1.id

    # can't send message if not in chat
    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 2"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_leave_invite_to_chat(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user(make_invisible=True)
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
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user5.id]))
        chat_id = res.chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 1"))

    # other user not in chat
    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        with pytest.raises(grpc.RpcError) as e:
            res = c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user4.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        with pytest.raises(grpc.RpcError) as e:
            res = c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=chat_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    with conversations_session(token2) as c:
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id))
        assert not user3.id in res.member_user_ids

        # only_admins_invite defaults to true so shouldn't be able to invite
        with pytest.raises(grpc.RpcError) as e:
            res = c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=chat_id))

    with conversations_session(token1) as c:
        # invite invisible user fails
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user6.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND
        # invite fake user fails
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND
        # invite blocked user fails
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user7.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND
        # invite blocking user fails
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user8.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND
        # can't invite non-friend
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user4.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CHAT_ONLY_INVITE_FRIENDS

        c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user3.id))
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id))
        assert user1.id in res.member_user_ids
        assert user5.id in res.member_user_ids
        assert user3.id in res.member_user_ids

        # test non-admin inviting
        c.EditChat(
            conversations_pb2.EditChatReq(chat_id=chat_id, only_admins_invite=wrappers_pb2.BoolValue(value=False))
        )

    with conversations_session(token3) as c:
        c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user2.id))
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id))
        assert user2.id in res.member_user_ids


def test_chats_with_messages_before_join(db):
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
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user4.id]))
        chat_id = res.chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 1"))

    with conversations_session(token2) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 2"))

    with conversations_session(token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 3"))

        c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user3.id))

    with conversations_session(token3) as c:
        # should work
        c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id))

        res = c.ListChats(conversations_pb2.ListChatsReq())
        assert len(res.chats) == 1


def test_invite_to_dm(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id]))
        chat_id = res.chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 1"))

        # dm, shou;dn't be able to invite someone else
        with pytest.raises(grpc.RpcError) as e:
            c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_INVITE_TO_DM


def test_sole_admin_leaves(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id]))
        chat_id = res.chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 1"))

        # sole admin can't leave group chat
        with pytest.raises(grpc.RpcError) as e:
            c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=chat_id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.LAST_ADMIN_CANT_LEAVE

    with conversations_session(token2) as c:
        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=chat_id))

    with conversations_session(token3) as c:
        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=chat_id))

    # sole admin can leave when last in chat
    with conversations_session(token1) as c:
        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=chat_id))


def test_search_messages(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)

    with conversations_session(token1) as c:
        # create some threads with messages
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test message 2"))
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test group message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res.chat_id, text="Test group message 4"))

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


def test_search_messages_left_joined(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user4)
    start_time = now()

    with conversations_session(token1) as c:
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user4.id]))
        chat_id = res.chat_id
        for i in range(10):
            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message " + str(i)))

        c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user3.id))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 10"))
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))

        assert len(res.results) == 11

    with conversations_session(token3) as c:
        # can only see last message after invited
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))

        assert len(res.results) == 1
        assert res.results[0].message.text.text == "Test message 10"

        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=chat_id))

    with conversations_session(token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 11"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 12"))
        c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=chat_id, user_id=user3.id))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 13"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 14"))

    with conversations_session(token3) as c:
        # can only see last message after invited
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="Test message"))
        assert len(res.results) == 3
        assert res.results[0].message.text.text == "Test message 14"
        assert res.results[1].message.text.text == "Test message 13"
        assert res.results[2].message.text.text == "Test message 10"


def test_admin_behaviour(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        gcid = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id])).chat_id
        c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=gcid, user_id=user2.id))
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert len(res.admin_user_ids) == 2
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=gcid, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=gcid, user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert len(res.admin_user_ids) == 2
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

    with conversations_session(token2) as c:
        c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=gcid, user_id=user3.id))
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert len(res.admin_user_ids) == 3
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids
        assert user3.id in res.admin_user_ids

        c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=gcid, user_id=user1.id))
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert len(res.admin_user_ids) == 2
        assert user2.id in res.admin_user_ids
        assert user3.id in res.admin_user_ids

    with conversations_session(token1) as c:
        with pytest.raises(grpc.RpcError):
            c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=gcid, user_id=user1.id))
        with pytest.raises(grpc.RpcError):
            c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=gcid, user_id=user3.id))
        with pytest.raises(grpc.RpcError):
            c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=gcid, user_id=user2.id))
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert len(res.admin_user_ids) == 2
        assert user2.id in res.admin_user_ids
        assert user3.id in res.admin_user_ids

    with conversations_session(token2) as c:
        # can demote self if there are other admins
        c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=gcid, user_id=user2.id))
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert len(res.admin_user_ids) == 1
        assert user3.id in res.admin_user_ids

    with conversations_session(token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=gcid, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_REMOVE_LAST_ADMIN
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert len(res.admin_user_ids) == 1
        assert user3.id in res.admin_user_ids

        # last admin can't leave
        with pytest.raises(grpc.RpcError) as e:
            c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=gcid))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.LAST_ADMIN_CANT_LEAVE

        c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=gcid, user_id=user1.id))

        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=gcid))

    with conversations_session(token2) as c:
        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=gcid))

    # last participant must be admin but can leave to orphan chat
    with conversations_session(token1) as c:
        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=gcid))


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
        gcid = c.CreateChat(
            conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id, user4.id, user5.id])
        ).chat_id

        make_user_invisible(user3.id)
        make_user_block(user1, user4)
        make_user_block(user5, user1)

        # make non-existent user admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=gcid, user_id=999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        # make invisible user admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=gcid, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        # make blocked user admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=gcid, user_id=user4.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        # make blocking user admin
        with pytest.raises(grpc.RpcError) as e:
            c.MakeChatAdmin(conversations_pb2.MakeChatAdminReq(chat_id=gcid, user_id=user5.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        with session_scope() as session:
            subscriptions = (
                session.execute(
                    select(ChatSubscription)
                    .where(ChatSubscription.chat_id == gcid)
                    .where(ChatSubscription.role == ChatRole.participant)
                )
                .scalars()
                .all()
            )

            for subscription in subscriptions:
                subscription.role = ChatRole.admin

    with conversations_session(token1) as c:
        # remove non-existent user admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=gcid, user_id=999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        # remove invisible admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=gcid, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        # remove blocked admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=gcid, user_id=user4.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        # remove blocking admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveChatAdmin(conversations_pb2.RemoveChatAdminReq(chat_id=gcid, user_id=user5.id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND


def test_last_seen(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token3) as c:
        # this is just here to mess up any issues we get if we pretend there's only one group chat ever
        gcid_distraction = c.CreateChat(
            conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user1.id])
        ).chat_id

    with conversations_session(token1) as c:
        gcid = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id])).chat_id

        message_ids = []

        for i in range(6):
            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid_distraction, text=f"gibberish message... {i}"))
            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid, text=f"test message {i}"))
            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid_distraction, text=f"gibberish message {i}"))

            message_ids.append(c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid)).latest_message.message_id)

        # messages are automatically marked as seen when you send a new message
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert res.unseen_message_count == 0

    with conversations_session(token2) as c:
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        # created + 6 normal
        assert res.unseen_message_count == 7

        backward_offset = 3
        c.MarkLastSeenChat(
            conversations_pb2.MarkLastSeenChatReq(chat_id=gcid, last_seen_message_id=message_ids[-backward_offset - 1])
        )

        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert res.unseen_message_count == backward_offset

        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid, text=f"test message ..."))

        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert res.unseen_message_count == 0

    with conversations_session(token3) as c:
        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        # created + 7 normal
        assert res.unseen_message_count == 8

        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid, text=f"test message ..."))

        res = c.GetChat(conversations_pb2.GetChatReq(chat_id=gcid))
        assert res.unseen_message_count == 0


def test_one_dm_per_pair(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    with conversations_session(token1) as c:
        # create DM with user 2
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id]))
        assert res.is_dm

        # create DM with user 3
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm

        # can't create another group chat with just user 2
        with pytest.raises(grpc.RpcError) as e:
            res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id]))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        # can't create another group chat with just user 3
        with pytest.raises(grpc.RpcError) as e:
            res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user3.id]))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        # can create joined group chat
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id]))
        assert not res.is_dm

    with conversations_session(token2) as c:
        # can create DM with user 3
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm

        # can't create another group chat with just user 1
        with pytest.raises(grpc.RpcError) as e:
            res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user1.id]))
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
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id]))
        assert res.is_dm
        gcid = res.chat_id

        # now should exist
        res = c.GetDirectMessage(conversations_pb2.GetDirectMessageReq(user_id=user2.id))
        assert res.chat_id == gcid

        # create DM with user 3
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm

        # can create joined group chat
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id]))
        assert not res.is_dm

    with conversations_session(token2) as c:
        # can create DM with user 3
        res = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user3.id]))
        assert res.is_dm
        gcid = res.chat_id

        # DM with 3 should exist
        res = c.GetDirectMessage(conversations_pb2.GetDirectMessageReq(user_id=user3.id))
        assert res.chat_id == gcid


def test_total_unseen(db):
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

    start_time = now()

    with conversations_session(token1) as c:
        # distractions
        gcid_distraction = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user4.id])).chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid_distraction, text=f"distraction..."))

        gcid = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id])).chat_id

        for i in range(6):
            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid, text=f"test message {i}"))

        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid_distraction, text=f"distraction..."))

    # messages are automatically marked as seen when you send a new message
    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    with api_session(token2) as api:
        # chat created + 6 normal messages
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 7

    # now leave chat with user2
    with conversations_session(token2) as c:
        c.LeaveChat(conversations_pb2.LeaveChatReq(chat_id=gcid))

    with api_session(token2) as api:
        # seen messages becomes 0 when leaving
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    with conversations_session(token1) as c:
        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid_distraction, text=f"distraction..."))

        # send more stuff without user 2
        for i in range(3):
            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid, text=f"test message {i}"))

        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid_distraction, text=f"distraction..."))

    with api_session(token2) as api:
        # seen messages becomes 0 when leaving
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 0

    with conversations_session(token1) as c:
        # add user 2 back
        c.InviteToChat(conversations_pb2.InviteToChatReq(chat_id=gcid, user_id=user2.id))

        # send more stuff with user 2
        for i in range(12):
            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid, text=f"test message {i}"))

        # distractions
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=gcid_distraction, text=f"distraction..."))

    with api_session(token2) as api:
        # joined + 12 normal
        assert api.Ping(api_pb2.PingReq()).unseen_message_count == 13


def test_regression_ListChats_pagination(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)

    with conversations_session(token1) as c:
        # tuples of (chat_id, message_id)
        chat_and_message_ids = []
        for i in range(50):
            res1 = c.CreateChat(
                conversations_pb2.CreateChatReq(
                    recipient_user_ids=[user2.id, user3.id], title=wrappers_pb2.StringValue(value=f"Chat {i}")
                )
            )

            c.SendMessage(conversations_pb2.SendMessageReq(chat_id=res1.chat_id, text=f"Test message {i}"))

            res2 = c.GetChat(conversations_pb2.GetChatReq(chat_id=res1.chat_id))

            chat_and_message_ids.append((res2.chat_id, res2.latest_message.message_id))

        seen_chat_ids = []

        next_page_token = None
        start = True
        while start or next_page_token:
            start = False

            res = c.ListChats(conversations_pb2.ListChatsReq(page_token=next_page_token))
            next_page_token = res.next_page_token

            seen_chat_ids.extend([chat.chat_id for chat in res.chats])

        assert set(seen_chat_ids) == set(x[0] for x in chat_and_message_ids), "Not all group chats returned"
