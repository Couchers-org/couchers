from datetime import timedelta

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.jobs.handlers import update_badges
from couchers.models import FriendRelationship, FriendStatus
from couchers.sql import couchers_select as select
from couchers.utils import create_coordinate, to_aware_datetime
from proto import api_pb2, jail_pb2, notifications_pb2
from tests.test_fixtures import (  # noqa
    api_session,
    blocking_session,
    db,
    generate_user,
    make_friends,
    make_user_block,
    make_user_invisible,
    notifications_session,
    real_api_session,
    real_jail_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_ping(db):
    user, token = generate_user()

    with real_api_session(token) as api:
        res = api.Ping(api_pb2.PingReq())

    assert res.user.user_id == user.id
    assert res.user.username == user.username
    assert res.user.name == user.name
    assert res.user.city == user.city
    assert res.user.hometown == user.hometown
    assert res.user.verification == 0.0
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

    assert res.user.hosting_status == api_pb2.HOSTING_STATUS_CANT_HOST
    assert res.user.meetup_status == api_pb2.MEETUP_STATUS_OPEN_TO_MEETUP

    assert res.user.occupation == user.occupation
    assert res.user.education == user.education
    assert res.user.about_me == user.about_me
    assert res.user.my_travels == user.my_travels
    assert res.user.things_i_like == user.things_i_like
    assert set(language_ability.code for language_ability in res.user.language_abilities) == set(["fin", "fra"])
    assert res.user.about_place == user.about_place
    assert res.user.regions_visited == ["FIN", "REU", "CHE"]  # Tests alphabetization by region name
    assert res.user.regions_lived == ["EST", "FRA", "ESP"]  # Ditto
    assert res.user.additional_information == user.additional_information

    assert res.user.friends == api_pb2.User.FriendshipStatus.NA
    assert not res.user.HasField("pending_friend_request")


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

    # Check coordinate wrapping
    user3, token3 = generate_user(geom=create_coordinate(40.0, -180.5))
    user4, token4 = generate_user(geom=create_coordinate(40.0, 20.0))
    user5, token5 = generate_user(geom=create_coordinate(90.5, 20.0))

    with api_session(token3) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user3.username))
        assert res.lat == 40.0
        assert res.lng == 179.5

    with api_session(token4) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user4.username))
        assert res.lat == 40.0
        assert res.lng == 20.0

    # PostGIS does not wrap longitude for latitude overflow
    with api_session(token5) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user5.username))
        assert res.lat == 89.5
        assert res.lng == 20.0

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


def test_update_profile(db):
    user, token = generate_user()

    with api_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(api_pb2.UpdateProfileReq(name=wrappers_pb2.StringValue(value="  ")))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_NAME

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(
                api_pb2.UpdateProfileReq(lat=wrappers_pb2.DoubleValue(value=0), lng=wrappers_pb2.DoubleValue(value=0))
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_COORDINATE

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(
                api_pb2.UpdateProfileReq(regions_visited=api_pb2.RepeatedStringValue(value=["United States"]))
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_REGION

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(
                api_pb2.UpdateProfileReq(regions_lived=api_pb2.RepeatedStringValue(value=["United Kingdom"]))
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_REGION

        api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                name=wrappers_pb2.StringValue(value="New name"),
                city=wrappers_pb2.StringValue(value="Timbuktu"),
                hometown=api_pb2.NullableStringValue(value="Walla Walla"),
                lat=wrappers_pb2.DoubleValue(value=0.01),
                lng=wrappers_pb2.DoubleValue(value=-2),
                radius=wrappers_pb2.DoubleValue(value=321),
                pronouns=api_pb2.NullableStringValue(value="Ro, Robo, Robots"),
                occupation=api_pb2.NullableStringValue(value="Testing"),
                education=api_pb2.NullableStringValue(value="Couchers U"),
                about_me=api_pb2.NullableStringValue(value="I rule"),
                my_travels=api_pb2.NullableStringValue(value="Oh the places you'll go!"),
                things_i_like=api_pb2.NullableStringValue(value="Couchers"),
                about_place=api_pb2.NullableStringValue(value="My place"),
                hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                meetup_status=api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP,
                language_abilities=api_pb2.RepeatedLanguageAbilityValue(
                    value=[
                        api_pb2.LanguageAbility(
                            code="eng",
                            fluency=api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT,
                        )
                    ],
                ),
                regions_visited=api_pb2.RepeatedStringValue(value=["CXR", "FIN"]),
                regions_lived=api_pb2.RepeatedStringValue(value=["USA", "EST"]),
                additional_information=api_pb2.NullableStringValue(value="I <3 Couchers"),
            )
        )

        user_details = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert user_details.name == "New name"
        assert user_details.city == "Timbuktu"
        assert user_details.hometown == "Walla Walla"
        assert user_details.pronouns == "Ro, Robo, Robots"
        assert user_details.education == "Couchers U"
        assert user_details.my_travels == "Oh the places you'll go!"
        assert user_details.things_i_like == "Couchers"
        assert user_details.lat == 0.01
        assert user_details.lng == -2
        assert user_details.radius == 321
        assert user_details.occupation == "Testing"
        assert user_details.about_me == "I rule"
        assert user_details.about_place == "My place"
        assert user_details.hosting_status == api_pb2.HOSTING_STATUS_CAN_HOST
        assert user_details.meetup_status == api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP
        assert user_details.language_abilities[0].code == "eng"
        assert user_details.language_abilities[0].fluency == api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT
        assert user_details.additional_information == "I <3 Couchers"
        assert user_details.regions_visited == ["CXR", "FIN"]
        assert user_details.regions_lived == ["EST", "USA"]

        # Test unset values
        api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                hometown=api_pb2.NullableStringValue(is_null=True),
                radius=wrappers_pb2.DoubleValue(value=0),
                pronouns=api_pb2.NullableStringValue(is_null=True),
                occupation=api_pb2.NullableStringValue(is_null=True),
                education=api_pb2.NullableStringValue(is_null=True),
                about_me=api_pb2.NullableStringValue(is_null=True),
                my_travels=api_pb2.NullableStringValue(is_null=True),
                things_i_like=api_pb2.NullableStringValue(is_null=True),
                about_place=api_pb2.NullableStringValue(is_null=True),
                hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                meetup_status=api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP,
                language_abilities=api_pb2.RepeatedLanguageAbilityValue(value=[]),
                regions_visited=api_pb2.RepeatedStringValue(value=[]),
                regions_lived=api_pb2.RepeatedStringValue(value=[]),
                additional_information=api_pb2.NullableStringValue(is_null=True),
            )
        )

        user_details = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert not user_details.hometown
        assert not user_details.radius
        assert not user_details.pronouns
        assert not user_details.occupation
        assert not user_details.education
        assert not user_details.about_me
        assert not user_details.my_travels
        assert not user_details.things_i_like
        assert not user_details.about_place
        assert user_details.hosting_status == api_pb2.HOSTING_STATUS_CAN_HOST
        assert user_details.meetup_status == api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP
        assert not user_details.language_abilities
        assert not user_details.regions_visited
        assert not user_details.regions_lived
        assert not user_details.additional_information


def test_update_profile_do_not_email(db):
    user, token = generate_user()

    with notifications_session(token) as notifications:
        notifications.SetDoNotEmail(notifications_pb2.SetDoNotEmailReq(enable_do_not_email=True))

    with api_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(api_pb2.UpdateProfileReq(hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.DO_NOT_EMAIL_CANNOT_HOST

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(api_pb2.UpdateProfileReq(meetup_status=api_pb2.MEETUP_STATUS_OPEN_TO_MEETUP))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.DO_NOT_EMAIL_CANNOT_MEET


def test_language_abilities(db):
    user, token = generate_user()

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert len(res.language_abilities) == 2

        # can't add non-existent languages
        with pytest.raises(grpc.RpcError) as e:
            res = api.UpdateProfile(
                api_pb2.UpdateProfileReq(
                    language_abilities=api_pb2.RepeatedLanguageAbilityValue(
                        value=[
                            api_pb2.LanguageAbility(
                                code="QQQ",
                                fluency=api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT,
                            )
                        ],
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_LANGUAGE

        # can't have multiple languages of the same type
        with pytest.raises(Exception) as e:
            res = api.UpdateProfile(
                api_pb2.UpdateProfileReq(
                    language_abilities=api_pb2.RepeatedLanguageAbilityValue(
                        value=[
                            api_pb2.LanguageAbility(
                                code="eng",
                                fluency=api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT,
                            ),
                            api_pb2.LanguageAbility(
                                code="eng",
                                fluency=api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT,
                            ),
                        ],
                    ),
                )
            )
        assert "violates unique constraint" in str(e.value)

        # nothing changed
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert len(res.language_abilities) == 2

        # now actually add a value
        api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                language_abilities=api_pb2.RepeatedLanguageAbilityValue(
                    value=[
                        api_pb2.LanguageAbility(
                            code="eng",
                            fluency=api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT,
                        )
                    ],
                ),
            )
        )

        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert len(res.language_abilities) == 1
        assert res.language_abilities[0].code == "eng"
        assert res.language_abilities[0].fluency == api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT

        # change the value to a new one
        api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                language_abilities=api_pb2.RepeatedLanguageAbilityValue(
                    value=[
                        api_pb2.LanguageAbility(
                            code="fin",
                            fluency=api_pb2.LanguageAbility.Fluency.FLUENCY_BEGINNER,
                        )
                    ],
                ),
            )
        )

        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert len(res.language_abilities) == 1
        assert res.language_abilities[0].code == "fin"
        assert res.language_abilities[0].fluency == api_pb2.LanguageAbility.Fluency.FLUENCY_BEGINNER

        # should be able to set to same value still
        api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                language_abilities=api_pb2.RepeatedLanguageAbilityValue(
                    value=[
                        api_pb2.LanguageAbility(
                            code="fin",
                            fluency=api_pb2.LanguageAbility.Fluency.FLUENCY_BEGINNER,
                        )
                    ],
                ),
            )
        )

        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert len(res.language_abilities) == 1
        assert res.language_abilities[0].code == "fin"
        assert res.language_abilities[0].fluency == api_pb2.LanguageAbility.Fluency.FLUENCY_BEGINNER

        # don't change it
        api.UpdateProfile(api_pb2.UpdateProfileReq())

        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert len(res.language_abilities) == 1
        assert res.language_abilities[0].code == "fin"
        assert res.language_abilities[0].fluency == api_pb2.LanguageAbility.Fluency.FLUENCY_BEGINNER

        # remove value
        api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                language_abilities=api_pb2.RepeatedLanguageAbilityValue(
                    value=[],
                ),
            )
        )

        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert len(res.language_abilities) == 0


def test_pending_friend_request_count(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

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
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    # send friend request from user1 to user2
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    with session_scope() as session:
        friend_request_id = (
            session.execute(
                select(FriendRelationship).where(
                    FriendRelationship.from_user_id == user1.id and FriendRelationship.to_user_id == user2.id
                )
            ).scalar_one_or_none()
        ).id

    with api_session(token1) as api:
        # check it went through
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 1
        assert len(res.received) == 0

        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user_id == user2.id
        assert res.sent[0].friend_request_id == friend_request_id

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
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # send friend request from user1 to user2
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.FRIENDS_ALREADY_OR_PENDING


def test_cant_friend_request_pending(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # send friend request from user1 to user2
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    with api_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.FRIENDS_ALREADY_OR_PENDING


def test_cant_friend_request_already_friends(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_friends(user1, user2)

    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.FRIENDS_ALREADY_OR_PENDING

    with api_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.FRIENDS_ALREADY_OR_PENDING


def test_ListFriends(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

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


def test_ListMutualFriends(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()

    # arrange friends like this: 1<->2, 1<->3, 1<->4, 1<->5, 3<->2, 3<->4,
    # so 1 and 2 should have mutual friend 3 only
    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user4)
    make_friends(user1, user5)
    make_friends(user3, user2)
    make_friends(user3, user4)

    with api_session(token1) as api:
        mutual_friends = api.ListMutualFriends(api_pb2.ListMutualFriendsReq(user_id=user2.id)).mutual_friends
        assert len(mutual_friends) == 1
        assert mutual_friends[0].user_id == user3.id

    # and other way around same
    with api_session(token2) as api:
        mutual_friends = api.ListMutualFriends(api_pb2.ListMutualFriendsReq(user_id=user1.id)).mutual_friends
        assert len(mutual_friends) == 1
        assert mutual_friends[0].user_id == user3.id

        # Check pending request doesn't have effect
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user5.id))

        mutual_friends = api.ListMutualFriends(api_pb2.ListMutualFriendsReq(user_id=user1.id)).mutual_friends
        assert len(mutual_friends) == 1
        assert mutual_friends[0].user_id == user3.id

    # both ways
    with api_session(token1) as api:
        mutual_friends = api.ListMutualFriends(api_pb2.ListMutualFriendsReq(user_id=user2.id)).mutual_friends
        assert len(mutual_friends) == 1
        assert mutual_friends[0].user_id == user3.id


def test_mutual_friends_self(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_friends(user1, user2)
    make_friends(user2, user3)
    make_friends(user1, user4)

    with api_session(token1) as api:
        res = api.ListMutualFriends(api_pb2.ListMutualFriendsReq(user_id=user1.id))
        assert len(res.mutual_friends) == 0

    with api_session(token2) as api:
        res = api.ListMutualFriends(api_pb2.ListMutualFriendsReq(user_id=user2.id))
        assert len(res.mutual_friends) == 0

    with api_session(token3) as api:
        res = api.ListMutualFriends(api_pb2.ListMutualFriendsReq(user_id=user3.id))
        assert len(res.mutual_friends) == 0

    with api_session(token4) as api:
        res = api.ListMutualFriends(api_pb2.ListMutualFriendsReq(user_id=user4.id))
        assert len(res.mutual_friends) == 0


def test_CancelFriendRequest(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].user_id == user2.id
        fr_id = res.sent[0].friend_request_id

        api.CancelFriendRequest(api_pb2.CancelFriendRequestReq(friend_request_id=fr_id))

        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check not friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 0

    with api_session(token2) as api:
        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check we're not friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 0

    with api_session(token1) as api:
        # check we can send another friend req
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user_id == user2.id


def test_accept_friend_request(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        friend_request = FriendRelationship(from_user_id=user1.id, to_user_id=user2.id, status=FriendStatus.pending)
        session.add(friend_request)
        session.commit()
        friend_request_id = friend_request.id

    with api_session(token2) as api:
        # check request pending
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.received) == 1
        assert res.received[0].user_id == user1.id

        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=friend_request_id, accept=True))

        # check request is gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check now friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 1
        assert res.user_ids[0] == user1.id

    with api_session(token1) as api:
        # check request gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check now friends
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 1
        assert res.user_ids[0] == user2.id


def test_reject_friend_request(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

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
        assert res.last_minute.value
        assert not res.has_pets.value
        assert res.accepts_pets.value
        assert res.pet_details.value == "I love dogs"
        assert not res.has_kids.value
        assert res.accepts_kids.value
        assert res.kid_details.value == "I hate kids"
        assert not res.has_housemates.value
        assert res.housemate_details.value == "I have 7 housemates"
        assert res.wheelchair_accessible.value
        assert res.smoking_allowed == api_pb2.SMOKING_LOCATION_WINDOW
        assert not res.smokes_at_home.value
        assert res.drinking_allowed.value
        assert not res.drinks_at_home.value
        assert res.other_host_info.value == "I'm pretty swell"
        assert res.sleeping_arrangement == api_pb2.SLEEPING_ARRANGEMENT_COMMON
        assert res.sleeping_details.value == "Couch in living room"
        assert res.area.value == "area!"
        assert res.house_rules.value == "RULES!"
        assert res.parking.value
        assert res.parking_details == api_pb2.PARKING_DETAILS_PAID_ONSITE
        assert not res.camping_ok.value

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


def test_badges(db):
    user1, _ = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()
    user4, token = generate_user()

    update_badges(empty_pb2.Empty())

    with api_session(token) as api:
        assert api.GetUser(api_pb2.GetUserReq(user=user1.username)).badges == ["founder", "board_member"]
        assert api.GetUser(api_pb2.GetUserReq(user=user2.username)).badges == ["founder", "board_member"]
        assert api.GetUser(api_pb2.GetUserReq(user=user3.username)).badges == []
