from google.protobuf import empty_pb2, wrappers_pb2
from datetime import timedelta

import grpc
import pytest
from couchers.models import User
from pb import api_pb2
from tests.test_fixtures import api_session, db, generate_user, make_friends


def test_ping(db):
    user, token = generate_user(db, "tester")

    with api_session(db, token) as api:
        res = api.Ping(api_pb2.PingReq())

    assert res.user.user_id == user.id
    assert res.user.username == user.username
    assert res.user.name == user.name
    assert res.user.city == user.city
    assert res.user.verification == user.verification
    assert res.user.community_standing == user.community_standing
    assert res.user.num_references == 0
    assert res.user.gender == user.gender
    assert res.user.age == user.age
    assert res.user.color == user.color

    # the joined time is fuzzed
    # but shouldn't be before actual joined time, or more than one hour behind
    assert user.joined - timedelta(hours=1) <= res.user.joined.ToDatetime() <= user.joined
    # same for last_active
    assert user.last_active - timedelta(hours=1) <= res.user.last_active.ToDatetime() <= user.last_active

    assert res.user.occupation == user.occupation
    assert res.user.about_me == user.about_me
    assert res.user.about_place == user.about_place
    # TODO: this list serialisation will be fixed hopefully soon
    assert res.user.languages == user.languages.split("|")
    assert res.user.countries_visited == user.countries_visited.split("|")
    assert res.user.countries_lived == user.countries_lived.split("|")

    assert res.user.friends == api_pb2.User.FriendshipStatus.NA
    assert len(res.user.mutual_friends) == 0

def test_get_user(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)

    with api_session(db, token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user2.username))
        assert res.user_id == user2.id
        assert res.username == user2.username
        assert res.name == user2.name

def test_update_profile(db):
    user, token = generate_user(db)

    with api_session(db, token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(api_pb2.UpdateProfileReq(
                name=wrappers_pb2.StringValue(value="  ")))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(api_pb2.UpdateProfileReq(
                color=wrappers_pb2.StringValue(value="color")))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        res = api.UpdateProfile(api_pb2.UpdateProfileReq(
            name=wrappers_pb2.StringValue(value="New name"),
            city=wrappers_pb2.StringValue(value="Timbuktu"),
            gender=wrappers_pb2.StringValue(value="Bot"),
            occupation=wrappers_pb2.StringValue(value="Testing"),
            about_me=wrappers_pb2.StringValue(value="I rule"),
            about_place=wrappers_pb2.StringValue(value="My place"),
            color=wrappers_pb2.StringValue(value="#111111"),
            languages=api_pb2.RepeatedStringValue(
                exists=True, value=["Binary", "English"]),
            countries_visited=api_pb2.RepeatedStringValue(
                exists=True, value=["UK", "Aus"]),
            countries_lived=api_pb2.RepeatedStringValue(
                exists=True, value=["UK", "Aus"])
        ))
        # all fields changed
        for field, value in res.ListFields():
            assert value == True

        user = api.GetUser(api_pb2.GetUserReq(user=str(user.id)))
        assert user.name == "New name"
        assert user.city == "Timbuktu"
        assert "Binary" in user.languages
        assert "English" in user.languages

        res = api.UpdateProfile(api_pb2.UpdateProfileReq(
            city=wrappers_pb2.StringValue(value="Timbuktu"),
            gender=wrappers_pb2.StringValue(value="Bot2")
        ))
        assert res.updated_name == False
        assert res.updated_city == True
        assert res.updated_gender == True
        assert res.updated_about_me == False
        assert res.updated_languages == False

def test_friend_request_flow(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    # send friend request from user1 to user2
    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        # check it went through
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 1
        assert len(res.received) == 0

        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user_id == user2.id

    with api_session(db, token2) as api:
        # check it's there
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 1

        assert res.received[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.received[0].user_id == user1.id

        fr_id = res.received[0].friend_request_id

        # accept it
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))

        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check we're friends now
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 1
        assert res.user_ids[0] == user1.id

    with api_session(db, token1) as api:
        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check we're friends now
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 1
        assert res.user_ids[0] == user2.id

def test_cant_friend_request_twice(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    # send friend request from user1 to user2
    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        with pytest.raises(grpc.RpcError):
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

def test_cant_friend_request_pending(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    # send friend request from user1 to user2
    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    with api_session(db, token2) as api, pytest.raises(grpc.RpcError):
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))

def test_ListFriends(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")

    # send friend request from user1 to user2 and user3
    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user3.id))

    with api_session(db, token3) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    with api_session(db, token2) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.received) == 2

        # order is an implementation detail
        user1_req = [req for req in res.received if req.user_id == user1.id][0]
        user3_req = [req for req in res.received if req.user_id == user3.id][0]

        assert user1_req.state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert user1_req.user_id == user1.id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=user1_req.friend_request_id, accept=True))

        assert user3_req.state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert user3_req.user_id == user3.id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=user3_req.friend_request_id, accept=True))

        # check we now have two friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 2
        assert user1.id in res.user_ids
        assert user3.id in res.user_ids

    with api_session(db, token3) as api:
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 1
        assert user2.id in res.user_ids

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.received) == 1
        assert res.received[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.received[0].user_id == user1.id
        fr_id = res.received[0].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))

        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 2
        assert user1.id in res.user_ids
        assert user2.id in res.user_ids

    with api_session(db, token1) as api:
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 2
        assert user2.id in res.user_ids
        assert user3.id in res.user_ids

def test_mutual_friends(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")
    user4, token4 = generate_user(db, "user4")
    user5, token5 = generate_user(db, "user5")

    # arrange friends like this: 1<->2, 1<->3, 1<->4, 1<->5, 3<->2, 3<->4,
    # 2<->5 pending
    # so 1 and 2 should have mutual friend 3 only
    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user3.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user4.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user5.id))

    with api_session(db, token3) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.received[0].user_id == user1.id
        fr_id = res.received[0].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user4.id))

    with api_session(db, token5) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.received[0].user_id == user1.id
        fr_id = res.received[0].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))

    with api_session(db, token2) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.received[0].user_id == user1.id
        fr_id = res.received[0].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))
        assert res.received[1].user_id == user3.id
        fr_id = res.received[1].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))

    with api_session(db, token4) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.received[0].user_id == user1.id
        fr_id = res.received[0].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))
        assert res.received[1].user_id == user3.id
        fr_id = res.received[1].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user5.id))

    with api_session(db, token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user2.username)))
        assert len(res.mutual_friends) == 1
        assert res.mutual_friends[0].user_id == user3.id

    # and other way around same
    with api_session(db, token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user1.username)))
        assert len(res.mutual_friends) == 1
        assert res.mutual_friends[0].user_id == user3.id

def test_CancelFriendRequest(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].user_id == user2.id
        fr_id = res.sent[0].friend_request_id

        api.CancelFriendRequest(api_pb2.CancelFriendRequestReq(friend_request_id=fr_id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0

def test_reject_friend_request(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")

    with api_session(db, token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user_id == user2.id

    with api_session(db, token2) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.received[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.received[0].user_id == user1.id

        fr_id = res.received[0].friend_request_id

        # reject it
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=False))

        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check not friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 0

    with api_session(db, token1) as api:
        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check we're not friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 0

        # check we can send another friend req
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user_id == user2.id

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

def test_mutual_friends_self(db):
    user1, token1 = generate_user(db, "user1")
    user2, token2 = generate_user(db, "user2")
    user3, token3 = generate_user(db, "user3")
    user4, token4 = generate_user(db, "user4")

    make_friends(db, user1, user2)
    make_friends(db, user2, user3)
    make_friends(db, user1, user4)

    with api_session(db, token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user3.id)))
        assert len(res.mutual_friends) == 1
        assert res.mutual_friends[0].user_id == user2.id

    with api_session(db, token3) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user1.id)))
        assert len(res.mutual_friends) == 1
        assert res.mutual_friends[0].user_id == user2.id

    with api_session(db, token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user1.id)))
        assert len(res.mutual_friends) == 0

    with api_session(db, token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user2.id)))
        assert len(res.mutual_friends) == 0

    with api_session(db, token3) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user3.id)))
        assert len(res.mutual_friends) == 0

    with api_session(db, token4) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user4.id)))
        assert len(res.mutual_friends) == 0
