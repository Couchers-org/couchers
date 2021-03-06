from datetime import timedelta

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2

from couchers.db import session_scope
from couchers.models import Complaint
from couchers.utils import now, to_aware_datetime
from pb import api_pb2, jail_pb2
from tests.test_fixtures import (
    api_session,
    db,
    generate_user,
    make_friends,
    real_api_session,
    real_jail_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_ping(db):
    user, token = generate_user("tester")

    with real_api_session(token) as api:
        res = api.Ping(api_pb2.PingReq())

    assert res.user.user_id == user.id
    assert res.user.username == user.username
    assert res.user.name == user.name
    assert res.user.city == user.city
    assert res.user.hometown == user.hometown
    assert res.user.verification == user.verification
    assert res.user.community_standing == user.community_standing
    assert res.user.num_references == 0
    assert res.user.gender == user.gender
    assert res.user.pronouns == user.pronouns
    assert res.user.age == user.age

    assert (res.user.lat, res.user.lng) == (user.coordinates or (0, 0))

    # the joined time is fuzzed
    # but shouldn't be before actual joined time, or more than one hour behind
    assert user.joined - timedelta(hours=1) <= to_aware_datetime(res.user.joined) <= user.joined
    # same for last_active
    assert user.last_active - timedelta(hours=1) <= to_aware_datetime(res.user.last_active) <= user.last_active

    assert res.user.hosting_status == api_pb2.HOSTING_STATUS_UNKNOWN
    assert res.user.meetup_status == api_pb2.MEETUP_STATUS_UNKNOWN

    assert res.user.occupation == user.occupation
    assert res.user.education == user.education
    assert res.user.about_me == user.about_me
    assert res.user.my_travels == user.my_travels
    assert res.user.things_i_like == user.things_i_like
    assert res.user.about_place == user.about_place
    # TODO: this list serialisation will be fixed hopefully soon
    assert res.user.languages == user.languages.split("|")
    assert res.user.countries_visited == user.countries_visited.split("|")
    assert res.user.countries_lived == user.countries_lived.split("|")
    assert res.user.additional_information == user.additional_information

    assert res.user.friends == api_pb2.User.FriendshipStatus.NA
    assert len(res.user.mutual_friends) == 0


def test_coords(db):
    # make them have not added a location
    user1, token1 = generate_user(geom=None, geom_radius=None)
    user2, token2 = generate_user()

    with api_session(token2) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.user.city == user2.city
        lat, lng = user2.coordinates or (0, 0)
        assert res.user.lat == lat
        assert res.user.lng == lng
        assert res.user.radius == user2.geom_radius

    with api_session(token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user1.username))
        assert res.city == user1.city
        assert res.lat == 0.0
        assert res.lng == 0.0
        assert res.radius == 0.0

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_added_location

        res = jail.SetLocation(
            jail_pb2.SetLocationReq(
                city="New York City",
                lat=40.7812,
                lng=-73.9647,
                radius=250,
            )
        )

        assert not res.jailed
        assert not res.has_not_added_location

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_added_location

    with api_session(token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user1.username))
        assert res.city == "New York City"
        assert res.lat == 40.7812
        assert res.lng == -73.9647
        assert res.radius == 250


def test_get_user(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with api_session(token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user2.username))
        assert res.user_id == user2.id
        assert res.username == user2.username
        assert res.name == user2.name

    with api_session(token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user2.id)))
        assert res.user_id == user2.id
        assert res.username == user2.username
        assert res.name == user2.name

    with api_session(token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user2.email))
        assert res.user_id == user2.id
        assert res.username == user2.username
        assert res.name == user2.name


def test_update_profile(db):
    user, token = generate_user()

    with api_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(api_pb2.UpdateProfileReq(name=wrappers_pb2.StringValue(value="  ")))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        res = api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                name=wrappers_pb2.StringValue(value="New name"),
                city=wrappers_pb2.StringValue(value="Timbuktu"),
                hometown=api_pb2.NullableStringValue(value="Walla Walla"),
                lat=wrappers_pb2.DoubleValue(value=0.01),
                lng=wrappers_pb2.DoubleValue(value=-2),
                radius=wrappers_pb2.DoubleValue(value=321),
                gender=wrappers_pb2.StringValue(value="Bot"),
                pronouns=api_pb2.NullableStringValue(value="Ro, Robo, Robots"),
                occupation=api_pb2.NullableStringValue(value="Testing"),
                education=api_pb2.NullableStringValue(value="Couchers U"),
                about_me=api_pb2.NullableStringValue(value="I rule"),
                my_travels=api_pb2.NullableStringValue(value="Oh the places you'll go!"),
                things_i_like=api_pb2.NullableStringValue(value="Couchers"),
                about_place=api_pb2.NullableStringValue(value="My place"),
                hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                meetup_status=api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP,
                languages=api_pb2.RepeatedStringValue(exists=True, value=["Binary", "English"]),
                countries_visited=api_pb2.RepeatedStringValue(exists=True, value=["UK", "Aus"]),
                countries_lived=api_pb2.RepeatedStringValue(exists=True, value=["UK", "Aus"]),
                additional_information=api_pb2.NullableStringValue(value="I <3 Couchers"),
            )
        )
        # all fields changed
        for field, value in res.ListFields():
            assert value == True

        user = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert user.name == "New name"
        assert user.city == "Timbuktu"
        assert user.hometown == "Walla Walla"
        assert user.pronouns == "Ro, Robo, Robots"
        assert user.education == "Couchers U"
        assert user.my_travels == "Oh the places you'll go!"
        assert user.things_i_like == "Couchers"
        assert user.lat == 0.01
        assert user.lng == -2
        assert user.radius == 321
        assert user.gender == "Bot"
        assert user.occupation == "Testing"
        assert user.about_me == "I rule"
        assert user.about_place == "My place"
        assert user.hosting_status == api_pb2.HOSTING_STATUS_CAN_HOST
        assert user.meetup_status == api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP
        assert "Binary" in user.languages
        assert "English" in user.languages
        assert user.additional_information == "I <3 Couchers"
        assert "UK" in user.countries_visited
        assert "Aus" in user.countries_visited
        assert "UK" in user.countries_lived
        assert "Aus" in user.countries_lived


def test_pending_friend_request_count(db):
    user1, token1 = generate_user("user1")
    user2, token2 = generate_user("user2")
    user3, token3 = generate_user("user3")

    with api_session(token2) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.pending_friend_request_count == 0

    with api_session(token1) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.pending_friend_request_count == 0
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        res = api.Ping(api_pb2.PingReq())
        assert res.pending_friend_request_count == 0

    with api_session(token2) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.pending_friend_request_count == 1

    with api_session(token2) as api:
        # check it's there
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 1

        assert res.received[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.received[0].user_id == user1.id

        fr_id = res.received[0].friend_request_id

        # accept it
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))

        res = api.Ping(api_pb2.PingReq())
        assert res.pending_friend_request_count == 0


def test_friend_request_flow(db):
    user1, token1 = generate_user("user1")
    user2, token2 = generate_user("user2")
    user3, token3 = generate_user("user3")

    # send friend request from user1 to user2
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        # check it went through
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 1
        assert len(res.received) == 0

        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user_id == user2.id

    with api_session(token2) as api:
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

    with api_session(token1) as api:
        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check we're friends now
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 1
        assert res.user_ids[0] == user2.id


def test_cant_friend_request_twice(db):
    user1, token1 = generate_user("user1")
    user2, token2 = generate_user("user2")

    # send friend request from user1 to user2
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        with pytest.raises(grpc.RpcError):
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))


def test_cant_friend_request_pending(db):
    user1, token1 = generate_user("user1")
    user2, token2 = generate_user("user2")
    user3, token3 = generate_user("user3")

    # send friend request from user1 to user2
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    with api_session(token2) as api, pytest.raises(grpc.RpcError):
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))


def test_ListFriends(db):
    user1, token1 = generate_user("user1")
    user2, token2 = generate_user("user2")
    user3, token3 = generate_user("user3")

    # send friend request from user1 to user2 and user3
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user3.id))

    with api_session(token3) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    with api_session(token2) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.received) == 2

        # order is an implementation detail
        user1_req = [req for req in res.received if req.user_id == user1.id][0]
        user3_req = [req for req in res.received if req.user_id == user3.id][0]

        assert user1_req.state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert user1_req.user_id == user1.id
        api.RespondFriendRequest(
            api_pb2.RespondFriendRequestReq(friend_request_id=user1_req.friend_request_id, accept=True)
        )

        assert user3_req.state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert user3_req.user_id == user3.id
        api.RespondFriendRequest(
            api_pb2.RespondFriendRequestReq(friend_request_id=user3_req.friend_request_id, accept=True)
        )

        # check we now have two friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 2
        assert user1.id in res.user_ids
        assert user3.id in res.user_ids

    with api_session(token3) as api:
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

    with api_session(token1) as api:
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 2
        assert user2.id in res.user_ids
        assert user3.id in res.user_ids


def test_mutual_friends(db):
    user1, token1 = generate_user("user1")
    user2, token2 = generate_user("user2")
    user3, token3 = generate_user("user3")
    user4, token4 = generate_user("user4")
    user5, token5 = generate_user("user5")

    # arrange friends like this: 1<->2, 1<->3, 1<->4, 1<->5, 3<->2, 3<->4,
    # 2<->5 pending
    # so 1 and 2 should have mutual friend 3 only
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user3.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user4.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user5.id))

    with api_session(token3) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.received[0].user_id == user1.id
        fr_id = res.received[0].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user4.id))

    with api_session(token5) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.received[0].user_id == user1.id
        fr_id = res.received[0].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))

    with api_session(token2) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.received[0].user_id == user1.id
        fr_id = res.received[0].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))
        assert res.received[1].user_id == user3.id
        fr_id = res.received[1].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))

    with api_session(token4) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.received[0].user_id == user1.id
        fr_id = res.received[0].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))
        assert res.received[1].user_id == user3.id
        fr_id = res.received[1].friend_request_id
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user5.id))

    with api_session(token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user2.username)))
        assert len(res.mutual_friends) == 1
        assert res.mutual_friends[0].user_id == user3.id

    # and other way around same
    with api_session(token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user1.username)))
        assert len(res.mutual_friends) == 1
        assert res.mutual_friends[0].user_id == user3.id


def test_CancelFriendRequest(db):
    user1, token1 = generate_user("user1")
    user2, token2 = generate_user("user2")

    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].user_id == user2.id
        fr_id = res.sent[0].friend_request_id

        api.CancelFriendRequest(api_pb2.CancelFriendRequestReq(friend_request_id=fr_id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0


def test_reject_friend_request(db):
    user1, token1 = generate_user("user1")
    user2, token2 = generate_user("user2")

    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user_id == user2.id

    with api_session(token2) as api:
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

    with api_session(token1) as api:
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


def test_mutual_friends_self(db):
    user1, token1 = generate_user("user1")
    user2, token2 = generate_user("user2")
    user3, token3 = generate_user("user3")
    user4, token4 = generate_user("user4")

    make_friends(user1, user2)
    make_friends(user2, user3)
    make_friends(user1, user4)

    with api_session(token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user3.username))
        assert len(res.mutual_friends) == 1
        assert res.mutual_friends[0].user_id == user2.id

    with api_session(token3) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user1.username))
        assert len(res.mutual_friends) == 1
        assert res.mutual_friends[0].user_id == user2.id

    with api_session(token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user1.username))
        assert len(res.mutual_friends) == 0

    with api_session(token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user2.username))
        assert len(res.mutual_friends) == 0

    with api_session(token3) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user3.username))
        assert len(res.mutual_friends) == 0

    with api_session(token4) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user4.username))
        assert len(res.mutual_friends) == 0


def test_reporting(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with api_session(token1) as api:
        res = api.Report(
            api_pb2.ReportReq(reported_user_id=user2.id, reason="reason text", description="description text")
        )
    assert isinstance(res, empty_pb2.Empty)

    with session_scope() as session:
        entries = session.query(Complaint).all()

        assert len(entries) == 1
        assert entries[0].author_user_id == user1.id
        assert entries[0].reported_user_id == user2.id
        assert entries[0].reason == "reason text"
        assert entries[0].description == "description text"

    # Test that reporting oneself and reporting nonexisting user fails
    report_req = api_pb2.ReportReq(reported_user_id=user1.id, reason="foo", description="bar")
    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.Report(report_req)
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

    report_req = api_pb2.ReportReq(reported_user_id=0x7FFFFFFFFFFFFFFF, reason="foo", description="bar")
    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.Report(report_req)
    assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_references(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    alltypes = set([api_pb2.ReferenceType.FRIEND, api_pb2.ReferenceType.HOSTED, api_pb2.ReferenceType.SURFED])
    # write all three reference types
    for typ in alltypes:
        req = api_pb2.WriteReferenceReq(to_user_id=user2.id, reference_type=typ, text="kinda weird sometimes")
        with api_session(token1) as api:
            res = api.WriteReference(req)
        assert isinstance(res, empty_pb2.Empty)

    # See what I have written. Paginate it.
    seen_types = set()
    for i in range(3):
        req = api_pb2.GetGivenReferencesReq(from_user_id=user1.id, number=1, start_at=i)
        with api_session(token1) as api:
            res = api.GetGivenReferences(req)
        assert res.total_matches == 3
        assert len(res.references) == 1
        assert res.references[0].from_user_id == user1.id
        assert res.references[0].to_user_id == user2.id
        assert res.references[0].text == "kinda weird sometimes"
        assert abs(to_aware_datetime(res.references[0].written_time) - now()) <= timedelta(days=32)
        assert res.references[0].reference_type not in seen_types
        seen_types.add(res.references[0].reference_type)
    assert seen_types == alltypes

    # See what user2 have received. Paginate it.
    seen_types = set()
    for i in range(3):
        req = api_pb2.GetReceivedReferencesReq(to_user_id=user2.id, number=1, start_at=i)
        with api_session(token1) as api:
            res = api.GetReceivedReferences(req)
        assert res.total_matches == 3
        assert len(res.references) == 1
        assert res.references[0].from_user_id == user1.id
        assert res.references[0].to_user_id == user2.id
        assert res.references[0].text == "kinda weird sometimes"
        assert res.references[0].reference_type not in seen_types
        seen_types.add(res.references[0].reference_type)
    assert seen_types == alltypes

    # Check available types
    with api_session(token1) as api:
        res = api.AvailableWriteReferenceTypes(api_pb2.AvailableWriteReferenceTypesReq(to_user_id=user2.id))
    assert res.reference_types == []

    with api_session(token2) as api:
        res = api.AvailableWriteReferenceTypes(api_pb2.AvailableWriteReferenceTypesReq(to_user_id=user1.id))
    assert set(res.reference_types) == alltypes

    # Forbidden to write a second reference of the same type
    req = api_pb2.WriteReferenceReq(to_user_id=user2.id, reference_type=api_pb2.ReferenceType.HOSTED, text="ok")
    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteReference(req)
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

    # Nonexisting user
    req = api_pb2.WriteReferenceReq(
        to_user_id=0x7FFFFFFFFFFFFFFF, reference_type=api_pb2.ReferenceType.HOSTED, text="ok"
    )
    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteReference(req)
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    # yourself
    req = api_pb2.WriteReferenceReq(to_user_id=user1.id, reference_type=api_pb2.ReferenceType.HOSTED, text="ok")
    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.WriteReference(req)
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

    with api_session(token2) as api:
        # test the number of references in GetUser and Ping
        res = api.GetUser(api_pb2.GetUserReq(user=user2.username))
        assert res.num_references == 3

        res = api.Ping(api_pb2.PingReq())
        assert res.user.num_references == 3


def test_hosting_preferences(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with api_session(token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user1.username))
        assert not res.HasField("max_guests")
        assert not res.HasField("last_minute")
        assert not res.HasField("has_pets")
        assert not res.HasField("accepts_pets")
        assert not res.HasField("pet_details")
        assert not res.HasField("has_kids")
        assert not res.HasField("accepts_kids")
        assert not res.HasField("kid_details")
        assert not res.HasField("has_housemates")
        assert not res.HasField("housemate_details")
        assert not res.HasField("wheelchair_accessible")
        assert res.smoking_allowed == api_pb2.SMOKING_LOCATION_UNKNOWN
        assert not res.HasField("smokes_at_home")
        assert not res.HasField("drinking_allowed")
        assert not res.HasField("drinks_at_home")
        assert not res.HasField("other_host_info")
        assert res.sleeping_arrangement == api_pb2.SLEEPING_ARRANGEMENT_UNKNOWN
        assert not res.HasField("sleeping_details")
        assert not res.HasField("area")
        assert not res.HasField("house_rules")
        assert not res.HasField("parking")
        assert res.parking_details == api_pb2.PARKING_DETAILS_UNKNOWN
        assert not res.HasField("camping_ok")

        api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                max_guests=api_pb2.NullableUInt32Value(value=3),
                last_minute=api_pb2.NullableBoolValue(value=True),
                has_pets=api_pb2.NullableBoolValue(value=False),
                accepts_pets=api_pb2.NullableBoolValue(value=True),
                pet_details=api_pb2.NullableStringValue(value="I love dogs"),
                has_kids=api_pb2.NullableBoolValue(value=False),
                accepts_kids=api_pb2.NullableBoolValue(value=True),
                kid_details=api_pb2.NullableStringValue(value="I hate kids"),
                has_housemates=api_pb2.NullableBoolValue(value=False),
                housemate_details=api_pb2.NullableStringValue(value="I have 7 housemates"),
                wheelchair_accessible=api_pb2.NullableBoolValue(value=True),
                smoking_allowed=api_pb2.SMOKING_LOCATION_WINDOW,
                area=api_pb2.NullableStringValue(value="area!"),
                smokes_at_home=api_pb2.NullableBoolValue(value=False),
                drinking_allowed=api_pb2.NullableBoolValue(value=True),
                drinks_at_home=api_pb2.NullableBoolValue(value=False),
                other_host_info=api_pb2.NullableStringValue(value="I'm pretty swell"),
                sleeping_arrangement=api_pb2.SLEEPING_ARRANGEMENT_COMMON,
                sleeping_details=api_pb2.NullableStringValue(value="Couch in living room"),
                house_rules=api_pb2.NullableStringValue(value="RULES!"),
                parking=api_pb2.NullableBoolValue(value=True),
                parking_details=api_pb2.PARKING_DETAILS_PAID_ONSITE,
                camping_ok=api_pb2.NullableBoolValue(value=False),
            )
        )

    # Use a second user to view the hosting preferences just to check
    # that it is public information.
    with api_session(token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user1.username))
        assert res.max_guests.value == 3
        assert res.last_minute.value is True
        assert res.has_pets.value is False
        assert res.accepts_pets.value is True
        assert res.pet_details.value == "I love dogs"
        assert res.has_kids.value is False
        assert res.accepts_kids.value is True
        assert res.kid_details.value == "I hate kids"
        assert res.has_housemates.value is False
        assert res.housemate_details.value == "I have 7 housemates"
        assert res.wheelchair_accessible.value is True
        assert res.smoking_allowed == api_pb2.SMOKING_LOCATION_WINDOW
        assert res.smokes_at_home.value is False
        assert res.drinking_allowed.value is True
        assert res.drinks_at_home.value is False
        assert res.other_host_info.value == "I'm pretty swell"
        assert res.sleeping_arrangement == api_pb2.SLEEPING_ARRANGEMENT_COMMON
        assert res.sleeping_details.value == "Couch in living room"
        assert res.area.value == "area!"
        assert res.house_rules.value == "RULES!"
        assert res.parking.value is True
        assert res.parking_details == api_pb2.PARKING_DETAILS_PAID_ONSITE
        assert res.camping_ok.value is False

    # test unsetting
    with api_session(token1) as api:
        api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                max_guests=api_pb2.NullableUInt32Value(is_null=True),
                last_minute=api_pb2.NullableBoolValue(is_null=True),
                has_pets=api_pb2.NullableBoolValue(is_null=True),
                accepts_pets=api_pb2.NullableBoolValue(is_null=True),
                pet_details=api_pb2.NullableStringValue(is_null=True),
                has_kids=api_pb2.NullableBoolValue(is_null=True),
                accepts_kids=api_pb2.NullableBoolValue(is_null=True),
                kid_details=api_pb2.NullableStringValue(is_null=True),
                has_housemates=api_pb2.NullableBoolValue(is_null=True),
                housemate_details=api_pb2.NullableStringValue(is_null=True),
                wheelchair_accessible=api_pb2.NullableBoolValue(is_null=True),
                smoking_allowed=api_pb2.SMOKING_LOCATION_UNKNOWN,
                area=api_pb2.NullableStringValue(is_null=True),
                smokes_at_home=api_pb2.NullableBoolValue(is_null=True),
                drinking_allowed=api_pb2.NullableBoolValue(is_null=True),
                drinks_at_home=api_pb2.NullableBoolValue(is_null=True),
                other_host_info=api_pb2.NullableStringValue(is_null=True),
                sleeping_arrangement=api_pb2.SLEEPING_ARRANGEMENT_UNKNOWN,
                sleeping_details=api_pb2.NullableStringValue(is_null=True),
                house_rules=api_pb2.NullableStringValue(is_null=True),
                parking=api_pb2.NullableBoolValue(is_null=True),
                parking_details=api_pb2.PARKING_DETAILS_UNKNOWN,
                camping_ok=api_pb2.NullableBoolValue(is_null=True),
            )
        )

        res = api.GetUser(api_pb2.GetUserReq(user=user1.username))
        assert not res.HasField("max_guests")
        assert not res.HasField("last_minute")
        assert not res.HasField("has_pets")
        assert not res.HasField("accepts_pets")
        assert not res.HasField("pet_details")
        assert not res.HasField("has_kids")
        assert not res.HasField("accepts_kids")
        assert not res.HasField("kid_details")
        assert not res.HasField("has_housemates")
        assert not res.HasField("housemate_details")
        assert not res.HasField("wheelchair_accessible")
        assert res.smoking_allowed == api_pb2.SMOKING_LOCATION_UNKNOWN
        assert not res.HasField("smokes_at_home")
        assert not res.HasField("drinking_allowed")
        assert not res.HasField("drinks_at_home")
        assert not res.HasField("other_host_info")
        assert res.sleeping_arrangement == api_pb2.SLEEPING_ARRANGEMENT_UNKNOWN
        assert not res.HasField("sleeping_details")
        assert not res.HasField("area")
        assert not res.HasField("house_rules")
        assert not res.HasField("parking")
        assert res.parking_details == api_pb2.PARKING_DETAILS_UNKNOWN
        assert not res.HasField("camping_ok")
