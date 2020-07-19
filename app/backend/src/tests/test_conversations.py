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


def test_edit_group_chat_status(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipients=["user2"]))
        thread_id = res.thread_id
        c.SendMessage(conversations_pb2.SendMessageReq(thread_id=thread_id, message="test"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipients=["user2"]))
        thread2_id = res.thread_id

        # shouldn't be able to reject your own thread
        with pytest.raises(grpc.RpcError) as e:
            res = c.EditGroupChatStatus(conversations_pb2.EditGroupChatStatusReq(
                thread_id=thread_id, status=conversations_pb2.GroupChatStatus.REJECTED))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

    with conversations_session(db, token2) as c:
        res = c.GetGroupChatInfo(conversations_pb2.GetGroupChatInfoReq(thread_id=thread_id))
        assert res.status == conversations_pb2.GroupChatStatus.PENDING

        c.EditGroupChatStatus(conversations_pb2.EditGroupChatStatusReq(
            thread_id=thread_id, status=conversations_pb2.GroupChatStatus.REJECTED))
        res = c.GetGroupChatInfo(conversations_pb2.GetGroupChatInfoReq(thread_id=thread_id))
        assert res.status == conversations_pb2.GroupChatStatus.REJECTED

        c.EditGroupChatStatus(conversations_pb2.EditGroupChatStatusReq(
            thread_id=thread2_id, status=conversations_pb2.GroupChatStatus.ACCEPTED))
        res = c.GetGroupChatInfo(conversations_pb2.GetGroupChatInfoReq(thread_id=thread2_id))
        assert res.status == conversations_pb2.GroupChatStatus.ACCEPTED


def test_get_group_chat(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")
    thread_id = 0

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipients=["user2"]))
        thread_id = res.thread_id
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 2"))

        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(thread_id=thread_id))
        assert len(res.messages) == 2
        assert res.start_index == 0
        assert not res.has_more

        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(thread_id=thread_id, max=1))
        assert len(res.messages) == 1
        assert res.start_index == 0
        assert res.has_more
        # latest first
        assert res.messages[0].text == "Test message 2"

        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(
            thread_id=thread_id, max=1, start_index=1))
        assert len(res.messages) == 1
        assert res.start_index == 1
        assert not res.has_more
        assert res.messages[0].text == "Test message 1"
    
    # test that another user can't access the thread
    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.GetGroupChat(conversations_pb2.GetGroupChatReq(thread_id=thread_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_get_group_chat_info(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(
            recipients=["user2"], title=wrappers_pb2.StringValue(value="Test title")))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 2"))
        thread1_id = res.thread_id
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipients=["user2", "user3"]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test group message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test group message 2"))
        thread2_id = res.thread_id

        res = c.GetGroupChatInfo(
            conversations_pb2.GetGroupChatInfoReq(thread_id=thread1_id))
        assert res.title == "Test title"
        assert str(user2.id) in res.recipients
        assert str(user1.id) in res.admins
        assert res.creation_time.ToDatetime() <= datetime.now()
        assert res.only_admins_invite
        assert res.status == conversations_pb2.GroupChatStatus.ACCEPTED
        assert res.is_dm

        res = c.GetGroupChatInfo(
            conversations_pb2.GetGroupChatInfoReq(thread_id=thread2_id))
        assert not res.title
        assert str(user2.id) in res.recipients
        assert str(user3.id) in res.recipients
        assert str(user1.id) in res.admins
        assert res.creation_time.ToDatetime() <= datetime.now()
        assert res.only_admins_invite
        assert res.status == conversations_pb2.GroupChatStatus.ACCEPTED
        assert not res.is_dm


def test_edit_group_chat(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    thread_id = 0

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(
            recipients=["user2"], title=wrappers_pb2.StringValue(value="Test title")))
        thread_id = res.thread_id

        c.EditGroupChat(conversations_pb2.EditGroupChatReq(
            thread_id=thread_id, title=wrappers_pb2.StringValue(value="Modified title"),
            only_admins_invite=wrappers_pb2.BoolValue(value=False)))
        res = c.GetGroupChatInfo(
            conversations_pb2.GetGroupChatInfoReq(thread_id=thread_id))
        assert res.title == "Modified title"
        assert not res.only_admins_invite

    # make sure non-admin is not allowed to modify
    with conversations_session(db, token2) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.EditGroupChat(conversations_pb2.EditGroupChatReq(
                thread_id=thread_id, title=wrappers_pb2.StringValue(value="Other title"),
                only_admins_invite=wrappers_pb2.BoolValue(value=True)))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED


def test_make_remove_group_chat_admin(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    thread_id = 0

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipients=["user2"]))
        thread_id = res.thread_id

        # shouldn't be able to remove only admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(
                conversations_pb2.RemoveGroupChatAdminReq(thread_id=thread_id, user="user1"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        c.AddGroupChatAdmin(conversations_pb2.AddGroupChatAdminReq(
            thread_id=thread_id, user="user2"))

    with conversations_session(db, token2) as c:
        res = c.GetGroupChatInfo(
            conversations_pb2.GetGroupChatInfoReq(thread_id=thread_id))
        assert "user1" in res.admins
        assert "user2" in res.admins

        c.RemoveGroupChatAdmin(
            conversations_pb2.RemoveGroupChatAdminReq(thread_id=thread_id, user="user2"))

        with pytest.raises(grpc.RpcError) as e:
            c.AddGroupChatAdmin(conversations_pb2.AddGroupChatAdminReq(
                thread_id=thread_id, user="user2"))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

        res = c.GetGroupChatInfo(
            conversations_pb2.GetGroupChatInfoReq(thread_id=thread_id))
        assert "user1" in res.admins
        assert not "user2" in res.admins


def test_send_message(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipients=["user2"]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 1"))
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(thread_id=res.thread_id))
        assert res.messages[0].text == "Test message 1"
        assert res.messages[0].timestamp <= datetime.now()
        assert res.messages[0].sender == "user1"


def test_leave_invite_to_group_chat(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")
    thread_id = 0

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipients=["user2"]))
        thread_id = res.thread_id
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=thread_id, message="Test message 1"))

        # can't leave with only one admin
        with pytest.raises(grpc.RpcError) as e:
            c.LeaveGroupChat(
                conversations_pb2.LeaveGroupChatReq(thread_id=thread_id))
        assert e.value.code() == grpc.StatusCodes.FAILED_PRECONDITION

    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetGroupChat(
                conversations_pb2.GetGroupChatReq(thread_id=thread_id))
        assert e.value.code() == grpc.StatusCodes.PERMISSION_DENIED
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetGroupChatInfo(
                conversations_pb2.GetGroupChatInfoReq(thread_id=thread_id))
        assert e.value.code() == grpc.StatusCodes.PERMISSION_DENIED

    with conversations_session(db, token2) as c:
        res = c.GetGroupChatInfo(
            conversations_pb2.GetGroupChatInfoReq(thread_id=thread_id))
        assert not "user3" in res.recipients
        with pytest.raises(grpc.RpcError) as e:
            res = c.InviteToThread(conversations_pb2.ThreadUserReq(
                thread_id=thread_id, user="user3"))
        assert e.value.code() == grpc.StatusCodes.PERMISSION_DENIED
        c.LeaveGroupChat(
            conversations_pb2.LeaveGroupChatReq(thread_id=thread_id))

    with conversations_session(db, token1) as c:
        c.InviteToGroupChat(conversations_pb2.ThreadUserReq(
            thread_id=thread_id, user="user3"))
        res = c.GetGroupChatInfo(
            conversations_pb2.GetGroupChatInfoReq(thread_id=thread_id))
        assert not "user2" in res.recipients
        assert "user3" in res.recipients

        # test non-admin inviting
        c.EditGroupChat(conversations_pb2.EditGroupChatReq(
            thread_id=thread_id, only_admins_invite=wrappers_pb2.BoolValue(value=False)))

    with conversations_session(db, token3) as c:
        c.InviteToGroupChat(conversations_pb2.ThreadUserReq(
            thread_id=thread_id, user="user2"))
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(thread_id=thread_id))
        assert "user2" in res.recipients


def test_search_messages(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipients=["user2"]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 2"))
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipients=["user2", "user3"]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test group message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test group message 4"))

        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="message "))
        assert len(res.results) == 4
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="group "))
        assert len(res.results) == 2
        res = c.SearchMessages(conversations_pb2.SearchMessagesReq(query="message 5"))
        assert len(res.results) == 0
