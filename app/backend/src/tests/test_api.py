from google.protobuf import empty_pb2

import grpc
import pytest
from couchers.models import User
from pb import api_pb2
from tests.test_fixtures import api_session, db, generate_user


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
