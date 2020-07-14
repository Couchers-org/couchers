from concurrent import futures
from contextlib import contextmanager
from datetime import date, datetime
from unittest.mock import patch

from google.protobuf import empty_pb2, wrappers_pb2

import grpc
import pytest
from couchers.db import session_scope
from couchers.interceptors import intercept_server
from couchers.models import Base, User
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from pb import api_pb2, api_pb2_grpc, auth_pb2, auth_pb2_grpc
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


@pytest.fixture
def db(tmp_path):
    """
    Create a temporary SQLite-backed database in a temp directory, and return the Session object.
    """
    db_path = tmp_path / "db.sqlite"
    engine = create_engine(f"sqlite:///{db_path}", echo=True)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)

    return Session

def generate_user(db, username):
    """
    Create a new user, return session token
    """
    auth = Auth(db)

    session = db()

    user = User(
        username=username,
        email=f"{username}@dev.couchers.org",
        # password is just 'password'
        # this is hardcoded because the password is slow to hash (so would slow down tests otherwise)
        hashed_password=b"$argon2id$v=19$m=65536,t=2,p=1$4cjGg1bRaZ10k+7XbIDmFg$tZG7JaLrkfyfO7cS233ocq7P8rf3znXR7SAfUt34kJg",
        name=username.capitalize(),
        city="Testing city",
        verification=0.5,
        community_standing=0.5,
        birthdate=date(year=2000, month=1, day=1),
        gender="N/A",
        languages="",
        occupation="Tester",
        about_me="I test things",
        about_place="My place has a lot of testing paraphenelia",
        countries_visited="",
        countries_lived="",
    )

    session.add(user)

    # this expires the user, so now it's "dirty"
    session.commit()

    # refresh it, undoes the expiry
    session.refresh(user)
    # allows detaches the user from the session, allowing its use outside this session
    session.expunge(user)

    session.close()

    with patch("couchers.servicers.auth.verify_password", lambda hashed, password: password == "password"):
        token = auth.Authenticate(auth_pb2.AuthReq(user=username, password="password"), "Dummy context").token

    return user, token

@contextmanager
def api_session(db, token):
    """
    Create a fresh API for testing, uses the token for auth
    """
    auth_interceptor = Auth(db).get_auth_interceptor()

    server = grpc.server(futures.ThreadPoolExecutor(1))
    server = intercept_server(server, auth_interceptor)
    port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
    servicer = API(db)
    api_pb2_grpc.add_APIServicer_to_server(servicer, server)
    server.start()

    call_creds = grpc.access_token_call_credentials(token)
    comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

    with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
        yield api_pb2_grpc.APIStub(channel)

    server.stop(None)

def test_ping(db):
    user, token = generate_user(db, "tester")

    with api_session(db, token) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.user_id == user.id
        assert res.username == user.username
        assert res.name == user.name
        assert res.color == user.color

def test_friend_request_flow(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    # send friend request from user1 to user2
    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user2"))

        # check it went through
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 1
        assert len(res.received) == 0

        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user == "user2"

    with api_session(db, token2) as api:
        # check it's there
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 1

        assert res.received[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.received[0].user == "user1"

        fr_id = res.received[0].friend_request_id

        # accept it
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))

        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check we're friends now
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.users) == 1
        assert res.users[0] == "user1"

    with api_session(db, token1) as api:
        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check we're friends now
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.users) == 1
        assert res.users[0] == "user2"

def test_cant_friend_request_twice(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    # send friend request from user1 to user2
    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user2"))

        with pytest.raises(grpc.RpcError):
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user2"))

def test_cant_friend_request_pending(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    # send friend request from user1 to user2
    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user2"))

    with api_session(db, token2) as api, pytest.raises(grpc.RpcError):
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user1"))

def test_ListFriends(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    # send friend request from user1 to user2 and user3
    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user2"))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user3"))

    with api_session(db, token3) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user2"))

    with api_session(db, token2) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.received) == 2

        # order is an implementation detail
        user1_req = [req for req in res.received if req.user == "user1"][0]
        user3_req = [req for req in res.received if req.user == "user3"][0]

        assert user1_req.state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert user1_req.user == "user1"
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=user1_req.friend_request_id, accept=True))

        assert user3_req.state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert user3_req.user == "user3"
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=user3_req.friend_request_id, accept=True))

        # check we now have two friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.users) == 2
        assert "user1" in res.users
        assert "user3" in res.users

    with api_session(db, token3) as api:
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.users) == 1
        assert "user2" in res.users

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.received) == 1
        assert res.received[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.received[0].user == "user1"
        fr_id = res.received[0].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))

        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.users) == 2
        assert "user1" in res.users
        assert "user2" in res.users

    with api_session(db, token1) as api:
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.users) == 2
        assert "user2" in res.users
        assert "user3" in res.users

def test_CancelFriendRequest(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user2"))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].user == "user2"
        fr_id = res.sent[0].friend_request_id

        api.CancelFriendRequest(api_pb2.CancelFriendRequestReq(friend_request_id=fr_id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0

def test_reject_friend_request(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user2"))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user == "user2"

    with api_session(db, token2) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.received[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.received[0].user == "user1"

        fr_id = res.received[0].friend_request_id

        # reject it
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=False))

        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check not friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.users) == 0

    with api_session(db, token1) as api:
        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check we're not friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.users) == 0

        # check we can send another friend req
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user2"))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user == "user2"

def test_search(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")
    user4, token4 = generate_user(db, "user4")

    with api_session(db, token1) as api:
        res = api.Search(api_pb2.SearchReq(query="user"))
        assert len(res.users) == 4

        res = api.Search(api_pb2.SearchReq(query="user5"))
        assert len(res.users) == 0

def test_list_message_threads(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    #make user 2 and 1 friends
    with api_session(db, token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user="user1"))

    with api_session(db, token1) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=res.received[0].friend_request_id, accept=True))

        #no threads initially
        res = api.ListMessageThreads(api_pb2.ListMessageThreadsReq())
        assert len(res.threads) == 0
        
        #create some threads with messages
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2"], title=wrappers_pb2.StringValue(value="Test title")))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test message 1"))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test message 2"))
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2", "user3"]))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test group message 1"))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test group message 2"))
        
        res = api.ListMessageThreads(api_pb2.ListMessageThreadsReq())
        assert len(res.threads) == 2
        assert res.start_index == 0
        assert not res.has_more

        res = api.ListMessageThreads(api_pb2.ListMessageThreadsReq(max=1))
        assert len(res.threads) == 1
        assert res.start_index == 0
        #group message is first since sent second
        assert not res.threads[0].is_dm
        first_thread_id = res.threads[0].thread_id
        assert res.has_more

        res = api.ListMessageThreads(api_pb2.ListMessageThreadsReq(start_index=1, max=1))
        assert len(res.threads) == 1
        assert res.start_index == 1
        assert res.threads[0].thread_id != first_thread_id
        assert res.threads[0].title.value == "Test title"
        assert res.threads[0].is_dm
        assert not res.has_more
        #this user created the thread so it should default to accepted
        assert res.threads[0].status == api_pb2.MessageThreadStatus.ACCEPTED
    
    with api_session(db, token2) as api:
        res = api.ListMessageThreads(api_pb2.ListMessageThreadsReq())
        #friends accepted by default
        assert res.threads[0].status == api_pb2.MessageThreadStatus.ACCEPTED
        
    with api_session(db, token3) as api:
        res = api.ListMessageThreads(api_pb2.ListMessageThreadsReq())
        #friends accepted by default
        assert res.threads[0].status == api_pb2.MessageThreadStatus.PENDING


def test_edit_message_thread_status(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with api_session(db, token1) as api:
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2"]))
        thread_id = res.thread_id

        #shouldn't be able to reject your own thread
        with pytest.raises(grpc.RpcError) as e:
            res = api.EditMessageThreadStatus(thread_id=thread_id, status=api_pb2.MessageThreadStatus.REJECTED)
        assert e.code() == grpc.StatusCode.FAILED_PRECONDITION

    with api_session(db, token2) as api:
        res = api.ListMessageThreads(api_pb2.ListMessageThreadsReq())
        assert res.threads[0].status == api_pb2.MessageThreadStatus.PENDING

        api.EditMessageThreadStatus(thread_id=res.thread_id, status=api_pb2.MessageThreadStatus.REJECTED)
        res = api.ListMessageThreads(api_pb2.ListMessageThreadsReq())
        assert res.threads[0].status == api_pb2.MessageThreadStatus.REJECTED

        api.EditMessageThreadStatus(thread_id=res.thread_id, status=api_pb2.MessageThreadStatus.ACCEPTED)
        res = api.ListMessageThreads(api_pb2.ListMessageThreadsReq())
        assert res.threads[0].status == api_pb2.MessageThreadStatus.ACCEPTED

def test_get_message_thread(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with api_session(db, token1) as api:
        
        #create some threads with messages
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2"]))
        thread_id = res.thread_id
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test message 1"))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test message 2"))

        res = api.GetMessageThread(api_pb2.GetMessageThreadReq(thread_id=thread_id))
        assert len(res.messages == 2)
        assert res.start_index == 0
        assert not res.has_more

        res = api.GetMessageThread(api_pb2.GetMessageThreadReq(thread_id=thread_id, max=1))
        assert len(res.messages == 1)
        assert res.start_index == 0
        assert res.has_more
        #latest first
        assert res.messages[0].text == "Test message 2"
        
        res = api.GetMessageThread(api_pb2.GetMessageThreadReq(thread_id=thread_id, max=1, start_index=1))
        assert len(res.messages == 1)
        assert res.start_index == 1
        assert not res.has_more
        assert res.messages[0].text == "Test message 1"
  
def test_get_message_thread_info(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    with api_session(db, token1) as api:
        #create some threads with messages
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2"], title=wrappers_pb2.StringValue(value="Test title")))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test message 1"))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test message 2"))
        thread1_id = res.thread_id
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2", "user3"]))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test group message 1"))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test group message 2"))
        thread2_id = res.thread_id

        res = api.GetMessageThreadInfo(api_pb2.GetMessageThreadInfoReq(thread_id=thread1_id))
        assert res.title.value == "Test title"
        assert "user2" in res.recipients
        assert "user1" in res.admins
        assert res.creation_time <= datetime.now()
        assert res.only_admins_invite
        assert res.status == api_pb2.MessageThreadStatus.ACCEPTED
        assert res.is_dm

        res = api.GetMessageThreadInfo(api_pb2.GetMessageThreadInfoReq(thread_id=thread2_id))
        assert not res.has_title()
        assert "user2" in res.recipients
        assert "user3" in res.recipients
        assert "user1" in res.admins
        assert res.creation_time <= datetime.now()
        assert res.only_admins_invite
        assert res.status == api_pb2.MessageThreadStatus.ACCEPTED
        assert not res.is_dm
  
def test_edit_message_thread(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    thread_id = 0

    with api_session(db, token1) as api:
        #create some threads with messages
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2"], title=wrappers_pb2.StringValue(value="Test title")))
        thread_id = res.thread_id

        api.EditMessageThread(api_pb2.EditMessageThreadReq(thread_id=thread_id, title=wrappers_pb2.StringValue(value="Modified title"), only_admins_invite=False))
        res = api.GetMessageThreadInfo(api_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert res.title.value == "Modified title"
        assert not res.only_admins_invite
    
    #make sure non-admin is not allowed to modify
    with api_session(db, token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.EditMessageThread(api_pb2.EditMessageThreadReq(thread_id=thread_id, title=wrappers_pb2.StringValue(value="Other title"), only_admins_invite=True))
        assert e.code() == grpc.StatusCode.PERMISSION_DENIED
  
def test_make_remove_message_thread_admin(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    thread_id = 0

    with api_session(db, token1) as api:
        #create some threads with messages
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2"]))
        thread_id = res.thread_id

        #shouldn't be able to remove only admin
        with pytest.raises(grpc.RpcError) as e:
            api.RemoveMessageThreadAdmin(api_pb2.RemoveMessageThreadAdminReq(thread_id=thread_id, user="user1"))
        assert e.code() == grpc.StatusCode.FAILED_PRECONDITION

        api.AddMessageThreadAdmin(api_pb2.AddMessageThreadAdminReq(thread_id=thread_id, user="user2"))
    
    with api_session(db, token2) as api:
        res = api.GetMessageThreadInfo(api_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert "user1" in res.admins
        assert "user2" in res.admins

        api.RemoveMessageThreadAdmin(api_pb2.RemoveMessageThreadAdminReq(thread_id=thread_id, user="user2"))

        with pytest.raises(grpc.RpcError) as e:
            api.AddMessageThreadAdmin(api_pb2.AddMessageThreadAdminReq(thread_id=thread_id, user="user2"))
        assert e.code() == grpc.StatusCode.PERMISSION_DENIED

        res = api.GetMessageThreadInfo(api_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert "user1" in res.admins
        assert not "user2" in res.admins


def test_send_message(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with api_session(db, token1) as api:
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2"]))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test message 1"))
        res = api.GetMessageThread(api_pb2.GetMessageThreadReq(thread_id=res.thread_id))
        assert res.messages[0].text == "Test message 1"
        assert res.messages[0].timestamp <= datetime.now()
        assert res.messages[0].sender == "user1"
  
def test_leave_invite_to_message_thread(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")
    thread_id = 0

    with api_session(db, token1) as api:
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2"]))
        thread_id = res.thread_id
        api.SendMessage(api_pb2.SendMessageReq(thread_id=thread_id, message="Test message 1"))

        #can't leave with only one admin
        with pytest.raises(grpc.RpcError) as e:
            api.LeaveMessageThread(api_pb2.LeaveMessageThreadReq(thread_id=thread_id))
        assert e.code() == grpc.StatusCodes.FAILED_PRECONDITION
    
    with api_session(db, token3) as api:
        with pytest.raises(grpc.RpcError) as e:
            res = api.GetMessageThread(api_pb2.GetMessageThreadReq(thread_id=thread_id))
        assert e.code() == grpc.StatusCodes.PERMISSION_DENIED
        with pytest.raises(grpc.RpcError) as e:
            res = api.GetMessageThreadInfo(api_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert e.code() == grpc.StatusCodes.PERMISSION_DENIED
    
    with api_session(db, token2) as api:
        res = api.GetMessageThreadInfo(api_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert not "user3" in res.recipients
        with pytest.raises(grpc.RpcError) as e:
            res = api.InviteToThread(api_pb2.ThreadUserReq(thread_id=thread_id, user="user3"))
        assert e.code() == grpc.StatusCodes.PERMISSION_DENIED
        api.LeaveMessageThread(api_pb2.LeaveMessageThreadReq(thread_id=thread_id))
    
    with api_session(db, token1) as api:
        api.InviteToMessageThread(api_pb2.ThreadUserReq(thread_id=thread_id, user="user3"))
        res = api.GetMessageThreadInfo(api_pb2.GetMessageThreadInfoReq(thread_id=thread_id))
        assert not "user2" in res.recipients
        assert "user3" in res.recipients

        #test non-admin inviting
        api.EditMessageThread(api_pb2.EditMessageThreadReq(thread_id=thread_id, only_admins_invite=False))
    
    with api_session(db, token3) as api:
        api.InviteToMessageThread(api_pb2.ThreadUserReq(thread_id=thread_id, user="user2"))
        res = api.GetMessageThread(api_pb2.GetMessageThreadReq(thread_id=thread_id))
        assert "user2" in res.recipients

def test_search_messages(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    with api_session(db, token1) as api:
        #create some threads with messages
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2"]))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test message 1"))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test message 2"))
        res = api.CreateMessageThread(api_pb2.CreateMessageThreadReq(recipients=["user2", "user3"]))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test group message 3"))
        api.SendMessage(api_pb2.SendMessageReq(thread_id=res.thread_id, message="Test group message 4"))

        res = api.SearchMessages(api_pb2.SearchMessagesReq(query="message "))
        assert len(res.results) == 4
        res = api.SearchMessages(api_pb2.SearchMessagesReq(query="group "))
        assert len(res.results) == 2
        res = api.SearchMessages(api_pb2.SearchMessagesReq(query="message 5"))
        assert len(res.results) == 0
