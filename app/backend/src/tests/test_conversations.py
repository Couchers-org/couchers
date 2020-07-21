from datetime import datetime

from google.protobuf import empty_pb2, wrappers_pb2

import grpc
import pytest
from couchers.models import User
from pb import api_pb2, conversations_pb2
from tests.test_fixtures import (api_session, conversations_session, db,
                                 generate_user, make_friends)


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

        c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id]))
        c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id, user3.id]))

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

    with conversations_session(db, token2) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more

        c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_ids=[user3.id]))

        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 3
        assert res.no_more

    with conversations_session(db, token3) as c:
        res = c.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 2
        assert res.no_more


def test_get_group_chat_messages(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)

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
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user3, user1)

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
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    make_friends(db, user1, user2)

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
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)

    make_friends(db, user1, user2)

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id]))
        group_chat_id = res.group_chat_id

        # shouldn't be able to remove only admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveGroupChatAdmin(
                conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(
            group_chat_id=group_chat_id, user_id=user2.id))

    with conversations_session(db, token2) as c:
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

    with conversations_session(db, token1) as c:
        c.RemoveGroupChatAdmin(
            conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=group_chat_id, user_id=user2.id))
        
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user1.id in res.admin_user_ids
        assert not user2.id in res.admin_user_ids


def test_send_message(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)

    make_friends(db, user1, user2)

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
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)

    with conversations_session(db, token1) as c:
        res = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(
            group_chat_id=group_chat_id,  text="Test message 1"))

    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetGroupChat(
                conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetGroupChat(
                conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    with conversations_session(db, token2) as c:
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert not user3.id in res.member_user_ids
        with pytest.raises(grpc.RpcError) as e:
            res = c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(
                group_chat_id=group_chat_id, user_id=user3.id))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        c.LeaveGroupChat(
            conversations_pb2.LeaveGroupChatReq(group_chat_id=group_chat_id))

    with conversations_session(db, token1) as c:
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(
            group_chat_id=group_chat_id, user_id=user3.id))
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user2.id in res.member_user_ids
        assert user3.id in res.member_user_ids

        # test non-admin inviting
        c.EditGroupChat(conversations_pb2.EditGroupChatReq(
            group_chat_id=group_chat_id, only_admins_invite=wrappers_pb2.BoolValue(value=False)))

    with conversations_session(db, token3) as c:
        c.InviteToGroupChat(conversations_pb2.InviteToGroupChatReq(
            group_chat_id=group_chat_id, user_id=user2.id))
        res = c.GetGroupChat(
            conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert user2.id in res.member_user_ids


def test_search_messages(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)

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


def test_admin_behaviour(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)
    user3, token3 = generate_user(db)

    make_friends(db, user1, user2)
    make_friends(db, user1, user3)
    make_friends(db, user2, user3)

    with conversations_session(db, token1) as c:
        gcid = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_ids=[user2.id, user3.id])).group_chat_id
        c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user2.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 2
        assert user1.id in res.admin_user_ids
        assert user2.id in res.admin_user_ids

    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError):
            c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user3.id))
        with pytest.raises(grpc.RpcError):
            c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user1.id))
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
        c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user2.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 1
        assert user3.id in res.admin_user_ids

    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError):
            c.RemoveGroupChatAdmin(conversations_pb2.RemoveGroupChatAdminReq(group_chat_id=gcid, user_id=user3.id))
        res = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=gcid))
        assert len(res.admin_user_ids) == 1
        assert user3.id in res.admin_user_ids

        # last admin can't leave
        with pytest.raises(grpc.RpcError):
            c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))

        c.MakeGroupChatAdmin(conversations_pb2.MakeGroupChatAdminReq(group_chat_id=gcid, user_id=user1.id))

        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))

    with conversations_session(db, token2) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))

    # last participant must be admin but can leave to orphan chat
    with conversations_session(db, token1) as c:
        c.LeaveGroupChat(conversations_pb2.LeaveGroupChatReq(group_chat_id=gcid))
