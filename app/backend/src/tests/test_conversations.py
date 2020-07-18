from datetime import datetime
from time import sleep

from google.protobuf import empty_pb2, wrappers_pb2

import grpc
import pytest
from couchers.models import User
from pb import api_pb2, conversations_pb2
from tests.test_fixtures import (api_session, conversations_session, db,
                                 generate_user)


def test_list_message_threads(db):
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
        res = c.ListMessageThreads(conversations_pb2.ListMessageThreadsReq())
        assert len(res.threads) == 0

        # create some threads with messages
        res = c.CreateMessageThread(conversations_pb2.CreateMessageThreadReq(
            recipients=["user2"], title=wrappers_pb2.StringValue(value="Test title")))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 1"))
        # TODO: Better solution than sleeping? Timestamps are the same if you don't sleep.
        sleep(1)
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 2"))
        sleep(1)
        res = c.CreateMessageThread(
            conversations_pb2.CreateMessageThreadReq(recipients=["user2", "user3"]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test group message 1"))
        sleep(1)
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test group message 2"))

        res = c.ListMessageThreads(conversations_pb2.ListMessageThreadsReq())
        assert len(res.threads) == 2
        assert res.start_index == 0
        assert not res.has_more

        res = c.ListMessageThreads(conversations_pb2.ListMessageThreadsReq(max=1))
        assert len(res.threads) == 1
        assert res.start_index == 0
        # group message is first since sent second
        assert not res.threads[0].is_dm
        first_thread_id = res.threads[0].thread_id
        assert res.has_more

        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(start_index=1, max=1))
        assert len(res.threads) == 1
        assert res.start_index == 1
        assert res.threads[0].thread_id != first_thread_id
        assert res.threads[0].title == "Test title"
        assert res.threads[0].is_dm
        assert not res.has_more
        # this user created the thread so it should default to accepted
        assert res.threads[0].status == conversations_pb2.MessageThreadStatus.ACCEPTED

    with conversations_session(db, token2) as c:
        res = c.ListMessageThreads(conversations_pb2.ListMessageThreadsReq())
        # friends accepted by default
        assert res.threads[0].status == conversations_pb2.MessageThreadStatus.ACCEPTED

    with conversations_session(db, token3) as c:
        res = c.ListMessageThreads(conversations_pb2.ListMessageThreadsReq())
        # friends accepted by default
        assert res.threads[0].status == conversations_pb2.MessageThreadStatus.PENDING


def test_edit_message_thread_status(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with conversations_session(db, token1) as c:
        res = c.CreateMessageThread(
            conversations_pb2.CreateMessageThreadReq(recipients=["user2"]))
        thread_id = res.thread_id
        c.SendMessage(conversations_pb2.SendMessageReq(thread_id=thread_id, message="test"))
        res = c.CreateMessageThread(
            conversations_pb2.CreateMessageThreadReq(recipients=["user2"]))
        thread2_id = res.thread_id

        # shouldn't be able to reject your own thread
        with pytest.raises(grpc.RpcError) as e:
            res = c.EditMessageThreadStatus(conversations_pb2.EditMessageThreadStatusReq(
                thread_id=thread_id, status=conversations_pb2.MessageThreadStatus.REJECTED))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

    with conversations_session(db, token2) as c:
        res = c.GetMessageThreadInfo(conversations_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert res.status == conversations_pb2.MessageThreadStatus.PENDING

        c.EditMessageThreadStatus(conversations_pb2.EditMessageThreadStatusReq(
            thread_id=thread_id, status=conversations_pb2.MessageThreadStatus.REJECTED))
        res = c.GetMessageThreadInfo(conversations_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert res.status == conversations_pb2.MessageThreadStatus.REJECTED

        c.EditMessageThreadStatus(conversations_pb2.EditMessageThreadStatusReq(
            thread_id=thread2_id, status=conversations_pb2.MessageThreadStatus.ACCEPTED))
        res = c.GetMessageThreadInfo(conversations_pb2.GetMessageThreadInfoReq(thread_id=thread2_id))
        assert res.status == conversations_pb2.MessageThreadStatus.ACCEPTED


def test_get_message_thread(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")
    thread_id = 0

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateMessageThread(
            conversations_pb2.CreateMessageThreadReq(recipients=["user2"]))
        thread_id = res.thread_id
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 1"))
        sleep(1)
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 2"))

        res = c.GetMessageThread(
            conversations_pb2.GetMessageThreadReq(thread_id=thread_id))
        assert len(res.messages) == 2
        assert res.start_index == 0
        assert not res.has_more

        res = c.GetMessageThread(
            conversations_pb2.GetMessageThreadReq(thread_id=thread_id, max=1))
        assert len(res.messages) == 1
        assert res.start_index == 0
        assert res.has_more
        # latest first
        assert res.messages[0].text == "Test message 2"

        res = c.GetMessageThread(conversations_pb2.GetMessageThreadReq(
            thread_id=thread_id, max=1, start_index=1))
        assert len(res.messages) == 1
        assert res.start_index == 1
        assert not res.has_more
        assert res.messages[0].text == "Test message 1"
    
    # test that another user can't access the thread
    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.GetMessageThread(conversations_pb2.GetMessageThreadReq(thread_id=thread_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_get_message_thread_info(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateMessageThread(conversations_pb2.CreateMessageThreadReq(
            recipients=["user2"], title=wrappers_pb2.StringValue(value="Test title")))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 2"))
        thread1_id = res.thread_id
        res = c.CreateMessageThread(
            conversations_pb2.CreateMessageThreadReq(recipients=["user2", "user3"]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test group message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test group message 2"))
        thread2_id = res.thread_id

        res = c.GetMessageThreadInfo(
            conversations_pb2.GetMessageThreadInfoReq(thread_id=thread1_id))
        assert res.title == "Test title"
        assert str(user2.id) in res.recipients
        assert str(user1.id) in res.admins
        assert res.creation_time.ToDatetime() <= datetime.now()
        assert res.only_admins_invite
        assert res.status == conversations_pb2.MessageThreadStatus.ACCEPTED
        assert res.is_dm

        res = c.GetMessageThreadInfo(
            conversations_pb2.GetMessageThreadInfoReq(thread_id=thread2_id))
        assert not res.title
        assert str(user2.id) in res.recipients
        assert str(user3.id) in res.recipients
        assert str(user1.id) in res.admins
        assert res.creation_time.ToDatetime() <= datetime.now()
        assert res.only_admins_invite
        assert res.status == conversations_pb2.MessageThreadStatus.ACCEPTED
        assert not res.is_dm


def test_edit_message_thread(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    thread_id = 0

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateMessageThread(conversations_pb2.CreateMessageThreadReq(
            recipients=["user2"], title=wrappers_pb2.StringValue(value="Test title")))
        thread_id = res.thread_id

        c.EditMessageThread(conversations_pb2.EditMessageThreadReq(
            thread_id=thread_id, title=wrappers_pb2.StringValue(value="Modified title"),
            only_admins_invite=wrappers_pb2.BoolValue(value=False)))
        res = c.GetMessageThreadInfo(
            conversations_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert res.title == "Modified title"
        assert not res.only_admins_invite

    # make sure non-admin is not allowed to modify
    with conversations_session(db, token2) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.EditMessageThread(conversations_pb2.EditMessageThreadReq(
                thread_id=thread_id, title=wrappers_pb2.StringValue(value="Other title"),
                only_admins_invite=wrappers_pb2.BoolValue(value=True)))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED


def test_make_remove_message_thread_admin(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    thread_id = 0

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateMessageThread(
            conversations_pb2.CreateMessageThreadReq(recipients=["user2"]))
        thread_id = res.thread_id

        # shouldn't be able to remove only admin
        with pytest.raises(grpc.RpcError) as e:
            c.RemoveMessageThreadAdmin(
                conversations_pb2.RemoveMessageThreadAdminReq(thread_id=thread_id, user="user1"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        c.AddMessageThreadAdmin(conversations_pb2.AddMessageThreadAdminReq(
            thread_id=thread_id, user="user2"))

    with conversations_session(db, token2) as c:
        res = c.GetMessageThreadInfo(
            conversations_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert "user1" in res.admins
        assert "user2" in res.admins

        c.RemoveMessageThreadAdmin(
            conversations_pb2.RemoveMessageThreadAdminReq(thread_id=thread_id, user="user2"))

        with pytest.raises(grpc.RpcError) as e:
            c.AddMessageThreadAdmin(conversations_pb2.AddMessageThreadAdminReq(
                thread_id=thread_id, user="user2"))
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

        res = c.GetMessageThreadInfo(
            conversations_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert "user1" in res.admins
        assert not "user2" in res.admins


def test_send_message(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with conversations_session(db, token1) as c:
        res = c.CreateMessageThread(
            conversations_pb2.CreateMessageThreadReq(recipients=["user2"]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 1"))
        res = c.GetMessageThread(
            conversations_pb2.GetMessageThreadReq(thread_id=res.thread_id))
        assert res.messages[0].text == "Test message 1"
        assert res.messages[0].timestamp <= datetime.now()
        assert res.messages[0].sender == "user1"


def test_leave_invite_to_message_thread(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")
    thread_id = 0

    with conversations_session(db, token1) as c:
        res = c.CreateMessageThread(
            conversations_pb2.CreateMessageThreadReq(recipients=["user2"]))
        thread_id = res.thread_id
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=thread_id, message="Test message 1"))

        # can't leave with only one admin
        with pytest.raises(grpc.RpcError) as e:
            c.LeaveMessageThread(
                conversations_pb2.LeaveMessageThreadReq(thread_id=thread_id))
        assert e.value.code() == grpc.StatusCodes.FAILED_PRECONDITION

    with conversations_session(db, token3) as c:
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetMessageThread(
                conversations_pb2.GetMessageThreadReq(thread_id=thread_id))
        assert e.value.code() == grpc.StatusCodes.PERMISSION_DENIED
        with pytest.raises(grpc.RpcError) as e:
            res = c.GetMessageThreadInfo(
                conversations_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert e.value.code() == grpc.StatusCodes.PERMISSION_DENIED

    with conversations_session(db, token2) as c:
        res = c.GetMessageThreadInfo(
            conversations_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert not "user3" in res.recipients
        with pytest.raises(grpc.RpcError) as e:
            res = c.InviteToThread(conversations_pb2.ThreadUserReq(
                thread_id=thread_id, user="user3"))
        assert e.value.code() == grpc.StatusCodes.PERMISSION_DENIED
        c.LeaveMessageThread(
            conversations_pb2.LeaveMessageThreadReq(thread_id=thread_id))

    with conversations_session(db, token1) as c:
        c.InviteToMessageThread(conversations_pb2.ThreadUserReq(
            thread_id=thread_id, user="user3"))
        res = c.GetMessageThreadInfo(
            conversations_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert not "user2" in res.recipients
        assert "user3" in res.recipients

        # test non-admin inviting
        c.EditMessageThread(conversations_pb2.EditMessageThreadReq(
            thread_id=thread_id, only_admins_invite=wrappers_pb2.BoolValue(value=False)))

    with conversations_session(db, token3) as c:
        c.InviteToMessageThread(conversations_pb2.ThreadUserReq(
            thread_id=thread_id, user="user2"))
        res = c.GetMessageThread(
            conversations_pb2.GetMessageThreadReq(thread_id=thread_id))
        assert "user2" in res.recipients


def test_search_messages(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    with conversations_session(db, token1) as c:
        # create some threads with messages
        res = c.CreateMessageThread(
            conversations_pb2.CreateMessageThreadReq(recipients=["user2"]))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(
            thread_id=res.thread_id, message="Test message 2"))
        res = c.CreateMessageThread(
            conversations_pb2.CreateMessageThreadReq(recipients=["user2", "user3"]))
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
