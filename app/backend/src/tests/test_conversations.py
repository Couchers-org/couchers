from datetime import datetime

from google.protobuf import empty_pb2, wrappers_pb2

import grpc
import pytest
from couchers.models import User
from pb import api_pb2, conversations_pb2
from tests.test_fixtures import (api_session, conversations_session, db,
                                 generate_user)


def test_list_group_chats(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    # make user 2 and 1 friends
    with api_session(db, token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user1"))

    with api_session(db, token1) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(
            friend_request_id=res.received[0].friend_request_id, accept=True))

    with conversations_session(db, token1) as c:
        # no threads initially
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 0

        # create some group chats with messages
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(
            recipient_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test message 2"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id, user3.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test group message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test group message 2"))

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

    with conversations_session(db, token2) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())

    with conversations_session(db, token3) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())


def test_get_group_chat_messages(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")
    group_chat_id = 0

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test message 2"))

        res = c.GetGroupChatMessages(
            conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        assert len(res.messages) == 2
        assert res.no_more

        assert res.messages[0].text == "Test message 2"
        assert res.messages[1].text == "Test message 1"
    
    # test that another user can't access the thread
    with conversations_session(db, token3) as c:
        res = c.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        assert len(res.messages) == 0


def test_get_group_chat_info(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(
            recipient_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test message 2"))
        group_chat1_id = res.group_chat_id
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id, user3.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test group message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test group message 2"))
        group_chat2_id = res.group_chat_id

        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat1_id))
        assert res.title == "Test title"
        assert user2.id in res.member_user_ids
        assert user1.id in res.admin_user_ids
        assert res.created.ToDatetime() <= datetime.now()
        assert res.only_admins_invite
        assert res.is_dm

        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat2_id))
        assert not res.title
        assert user2.id in res.member_user_ids
        assert user3.id in res.member_user_ids
        assert user1.id in res.admin_user_ids
        assert res.created.ToDatetime() <= datetime.now()
        assert res.only_admins_invite
        assert not res.is_dm


def test_edit_group_chat(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    group_chat_id = 0

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(
            recipient_ids=[user2.id], title=wrappers_pb2.StringValue(value="Test title")))
        group_chat_id = res.group_chat_id

        c.EditGroupChat(conversations_pb2.EditGroupChatReq(
            group_chat_id=group_chat_id, title=wrappers_pb2.StringValue(value="Modified title"),
            only_admins_invite=wrappers_pb2.BoolValue(value=False)))
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert res.title == "Modified title"
        assert not res.only_admins_invite

    # make sure non-admin is not allowed to modify
    with conversations_session(db, token2) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.EditGroupChat(conversations_pb2.EditGroupChatReq(
                group_chat_id=group_chat_id, title=wrappers_pb2.StringValue(value="Other title"),
                only_admins_invite=wrappers_pb2.BoolValue(value=True)))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED


def test_make_remove_group_chat_admin(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    group_chat_id = 0

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id]))
        group_chat_id = res.group_chat_id

        # shouldn't be able to remove only admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(
                conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=group_chat_id, user="user1"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        c.AddGroupChatAdmin(conversations_pb2.AddGroupChatAdminReq(
            group_chat_id=group_chat_id, user="user2"))

    with conversations_session(db, token2) as c:
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert "user1" in res.admins
        assert "user2" in res.admins

        c.RemoveGroupChatAdmin(
            conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=group_chat_id, user="user2"))

        with pytest.raises(grpc.RpcError) as e:
            c.AddGroupChatAdmin(conversations_pb2.AddGroupChatAdminReq(
                group_chat_id=group_chat_id, user="user2"))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert "user1" in res.admins
        assert not "user2" in res.admins


def test_send_message(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test message 1"))
        res = c.GetGroupChatMessages(
            conversations_pb2.GetGroupChatMessagesReq(group_chat_id=res.group_chat_id))
        assert res.messages[0].text == "Test message 1"
        assert res.messages[0].time.ToDatetime() <= datetime.now()
        assert res.messages[0].author_user_id == user1.id


def test_leave_invite_to_group_chat(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")
    group_chat_id = 0

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=group_chat_id,  text="Test message 1"))

        # can't leave with only one admin
        with pytest.raises(grpc.RpcError) as e:
            c.LeaveGroupChat(
                conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCodes.FAILED_PRECONDITION

    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetGroupChat(
                conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCodes.PERMISSION_DENIED
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetGroupChat(
                conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCodes.PERMISSION_DENIED

    with conversations_session(db, token2) as c:
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert not "user3" in res.recipients
        with pytest.raises(grpc.RpcError) as e:
            res = c.InviteToThread(conversations_pb2.ThreadUserReq(
                group_chat_id=group_chat_id, user="user3"))
        assert e.value.code() == grpc.StatusCodes.PERMISSION_DENIED
        c.LeaveGroupChat(
            conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(db, token1) as c:
        c.InviteToGroupChat(conversations_pb2.ThreadUserReq(
            group_chat_id=group_chat_id, user="user3"))
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert not "user2" in res.recipients
        assert "user3" in res.recipients

        # test non-admin inviting
        c.EditGroupChat(conversations_pb2.EditGroupChatReq(
            group_chat_id=group_chat_id, only_admins_invite=wrappers_pb2.BoolValue(value=False)))

    with conversations_session(db, token3) as c:
        c.InviteToGroupChat(conversations_pb2.ThreadUserReq(
            group_chat_id=group_chat_id, user="user2"))
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert "user2" in res.recipients


def test_search_messages(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test message 2"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id, user3.id]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test group message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=res.group_chat_id, text="Test group message 4"))

        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="message "))
        assert len(res.results) == 4
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="group "))
        assert len(res.results) == 2
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="message 5"))
        assert len(res.results) == 0
