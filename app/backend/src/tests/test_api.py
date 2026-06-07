from datetime import timedelta

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy import func, select, update

from couchers.db import session_scope
from couchers.helpers.badges import user_add_badge
from couchers.jobs.handlers import update_badges
from couchers.materialized_views import refresh_materialized_views_rapid
from couchers.models import (
    FriendRelationship,
    FriendStatus,
    LanguageFluency,
    ModerationObjectType,
    ModerationState,
    ModerationVisibility,
    RateLimitAction,
    User,
    UserBadge,
)
from couchers.models.notifications import Notification
from couchers.proto import admin_pb2, api_pb2, blocking_pb2, jail_pb2, notifications_pb2
from couchers.rate_limits.definitions import RATE_LIMIT_DEFINITIONS, RATE_LIMIT_HOURS
from couchers.resources import get_badge_dict
from couchers.utils import create_coordinate, now, to_aware_datetime
from tests.fixtures.db import generate_user, make_friends, make_user_block
from tests.fixtures.misc import EmailCollector, PushCollector
from tests.fixtures.sessions import (
    api_session,
    blocking_session,
    notifications_session,
    real_api_session,
    real_jail_session,
)
from tests.fixtures.sessions import (
    real_admin_session as admin_session,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_ping(db):
    user, token = generate_user(
        regions_lived=["ESP", "FRA", "EST"],
        regions_visited=["CHE", "REU", "FIN"],
        language_abilities=[
            ("fin", LanguageFluency.fluent),
            ("fra", LanguageFluency.beginner),
        ],
    )

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

    assert (res.user.lat, res.user.lng) == user.coordinates

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
    assert res.user.things_i_like == user.things_i_like
    assert {language_ability.code for language_ability in res.user.language_abilities} == {"fin", "fra"}
    assert res.user.about_place == user.about_place
    assert res.user.regions_visited == ["FIN", "REU", "CHE"]  # Tests alphabetization by region name
    assert res.user.regions_lived == ["EST", "FRA", "ESP"]  # Ditto
    assert res.user.additional_information == user.additional_information

    assert res.user.friends == api_pb2.User.FriendshipStatus.NA
    assert not res.user.HasField("pending_friend_request")


def test_coords(db):
    # make them need to update location
    user1, token1 = generate_user(geom=create_coordinate(1, 0), geom_radius=2000, needs_to_update_location=True)
    user2, token2 = generate_user()

    with api_session(token2) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.user.city == user2.city
        lat, lng = user2.coordinates
        assert res.user.lat == lat
        assert res.user.lng == lng
        assert res.user.radius == user2.geom_radius

    with api_session(token2) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user1.username))
        assert res.city == user1.city
        assert res.lat == 1.0
        assert res.lng == 0.0
        assert res.radius == 2000.0

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
        assert res.needs_to_update_location

        res = jail.SetLocation(
            jail_pb2.SetLocationReq(
                city="New York City",
                lat=40.7812,
                lng=-73.9647,
                radius=250,
            )
        )

        assert not res.jailed
        assert not res.needs_to_update_location

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.needs_to_update_location

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


@pytest.mark.parametrize("flag", ["deleted_at", "banned_at"])
def test_user_model_to_pb_ghost_user(db, flag):
    user1, token1 = generate_user()
    user2, _ = generate_user()

    with session_scope() as session:
        session.execute(update(User).where(User.id == user2.id).values(**{flag: func.now()}))

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token1) as api:
        user_pb = api.GetUser(api_pb2.GetUserReq(user=user2.username))

    assert user_pb.user_id == user2.id
    assert user_pb.is_ghost
    assert user_pb.username == "ghost"
    assert user_pb.name == "Deactivated Account"
    assert (
        user_pb.about_me
        == "This user is no longer on the platform. They may have deleted their account, been blocked, or been banned. We recommend exercising caution with any further interaction with this user off the platform. You can always reach out to support if you need any help."
    )

    assert user_pb.lat == 0
    assert user_pb.lng == 0
    assert user_pb.radius == 0
    assert user_pb.verification == 0.0
    assert user_pb.community_standing == 0.0
    assert user_pb.num_references == 0
    assert user_pb.age == 0
    assert user_pb.hosting_status == 0
    assert user_pb.meetup_status == 0
    assert user_pb.city == ""
    assert user_pb.hometown == ""
    assert user_pb.timezone == ""
    assert user_pb.gender == ""
    assert user_pb.pronouns == ""
    assert user_pb.occupation == ""
    assert user_pb.education == ""
    assert user_pb.things_i_like == ""
    assert user_pb.about_place == ""
    assert user_pb.additional_information == ""
    assert list(user_pb.language_abilities) == []
    assert list(user_pb.regions_visited) == []
    assert list(user_pb.regions_lived) == []
    assert list(user_pb.badges) == []
    assert user_pb.friends == api_pb2.User.FriendshipStatus.NOT_FRIENDS
    assert user_pb.avatar_url == ""
    assert user_pb.avatar_thumbnail_url == ""
    assert not user_pb.has_strong_verification

    with api_session(token1) as api:
        lite_user_pb = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user2.username))

    assert lite_user_pb.user_id == user2.id
    assert lite_user_pb.is_ghost
    assert lite_user_pb.username == "ghost"
    assert lite_user_pb.name == "Deactivated Account"
    assert lite_user_pb.city == ""
    assert lite_user_pb.age == 0
    assert lite_user_pb.avatar_url == ""
    assert lite_user_pb.avatar_thumbnail_url == ""
    assert lite_user_pb.lat == 0
    assert lite_user_pb.lng == 0
    assert lite_user_pb.radius == 0
    assert not lite_user_pb.has_strong_verification


def test_user_model_to_pb_ghost_user_blocked(db):
    user1, token1 = generate_user()
    user2, _ = generate_user()

    with blocking_session(token1) as user_blocks:
        user_blocks.BlockUser(blocking_pb2.BlockUserReq(username=user2.username))

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token1) as api:
        user_pb = api.GetUser(api_pb2.GetUserReq(user=user2.username))

    assert user_pb.user_id == user2.id
    assert user_pb.is_ghost
    assert user_pb.username == "ghost"
    assert user_pb.name == "Deactivated Account"
    assert (
        user_pb.about_me
        == "This user is no longer on the platform. They may have deleted their account, been blocked, or been banned. We recommend exercising caution with any further interaction with this user off the platform. You can always reach out to support if you need any help."
    )

    assert user_pb.lat == 0
    assert user_pb.lng == 0
    assert user_pb.radius == 0
    assert user_pb.verification == 0.0
    assert user_pb.community_standing == 0.0
    assert user_pb.num_references == 0
    assert user_pb.age == 0
    assert user_pb.hosting_status == 0
    assert user_pb.meetup_status == 0
    assert user_pb.city == ""
    assert user_pb.hometown == ""
    assert user_pb.timezone == ""
    assert user_pb.gender == ""
    assert user_pb.pronouns == ""
    assert user_pb.occupation == ""
    assert user_pb.education == ""
    assert user_pb.things_i_like == ""
    assert user_pb.about_place == ""
    assert user_pb.additional_information == ""
    assert list(user_pb.language_abilities) == []
    assert list(user_pb.regions_visited) == []
    assert list(user_pb.regions_lived) == []
    assert list(user_pb.badges) == []
    assert user_pb.friends == api_pb2.User.FriendshipStatus.NOT_FRIENDS
    assert user_pb.avatar_url == ""
    assert user_pb.avatar_thumbnail_url == ""
    assert not user_pb.has_strong_verification

    with api_session(token1) as api:
        lite_user_pb = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user2.username))

    assert lite_user_pb.user_id == user2.id
    assert lite_user_pb.is_ghost
    assert lite_user_pb.username == "ghost"
    assert lite_user_pb.name == "Deactivated Account"
    assert lite_user_pb.city == ""
    assert lite_user_pb.age == 0
    assert lite_user_pb.avatar_url == ""
    assert lite_user_pb.avatar_thumbnail_url == ""
    assert lite_user_pb.lat == 0
    assert lite_user_pb.lng == 0
    assert lite_user_pb.radius == 0
    assert not lite_user_pb.has_strong_verification


@pytest.mark.parametrize("flag", ["deleted_at", "banned_at"])
def test_admin_viewing_ghost_users_sees_full_profile(db, flag):
    admin, token_admin = generate_user(is_superuser=True)
    user, _ = generate_user()

    with session_scope() as session:
        session.execute(update(User).where(User.id == user.id).values(**{flag: func.now()}))

    with admin_session(token_admin) as api:
        user_pb = api.GetUser(admin_pb2.GetUserReq(user=user.username))

    assert user_pb.user_id == user.id
    assert user_pb.username == user.username
    assert user_pb.name == user.name
    assert user_pb.city == user.city
    assert user_pb.name != "Deactivated Account"
    assert user_pb.username != "ghost"
    assert user_pb.hosting_status in (
        api_pb2.HOSTING_STATUS_UNKNOWN,
        api_pb2.HOSTING_STATUS_CAN_HOST,
        api_pb2.HOSTING_STATUS_MAYBE,
        api_pb2.HOSTING_STATUS_CANT_HOST,
    )


def test_lite_coords(db):
    # make them need to update location
    user1, token1 = generate_user(geom=create_coordinate(0, 0), geom_radius=0, needs_to_update_location=True)
    user2, token2 = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token2) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.user.city == user2.city
        lat, lng = user2.coordinates
        assert res.user.lat == lat
        assert res.user.lng == lng
        assert res.user.radius == user2.geom_radius

    with api_session(token2) as api:
        res = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user1.username))
        assert res.city == user1.city
        assert res.lat == 0.0
        assert res.lng == 0.0
        assert res.radius == 0.0

    # Check coordinate wrapping
    user3, token3 = generate_user(geom=create_coordinate(40.0, -180.5))
    user4, token4 = generate_user(geom=create_coordinate(40.0, 20.0))
    user5, token5 = generate_user(geom=create_coordinate(90.5, 20.0))

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token3) as api:
        res = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user3.username))
        assert res.lat == 40.0
        assert res.lng == 179.5

    with api_session(token4) as api:
        res = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user4.username))
        assert res.lat == 40.0
        assert res.lng == 20.0

    # PostGIS does not wrap longitude for latitude overflow
    with api_session(token5) as api:
        res = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user5.username))
        assert res.lat == 89.5
        assert res.lng == 20.0

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.needs_to_update_location

        res = jail.SetLocation(
            jail_pb2.SetLocationReq(
                city="New York City",
                lat=40.7812,
                lng=-73.9647,
                radius=250,
            )
        )

        assert not res.jailed
        assert not res.needs_to_update_location

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.needs_to_update_location

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token2) as api:
        res = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user1.username))
        assert res.city == "New York City"
        assert res.lat == 40.7812
        assert res.lng == -73.9647
        assert res.radius == 250


def test_lite_get_user(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token1) as api:
        res = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user2.username))
        assert res.user_id == user2.id
        assert res.username == user2.username
        assert res.name == user2.name

    with api_session(token1) as api:
        res = api.GetLiteUser(api_pb2.GetLiteUserReq(user=str(user2.id)))
        assert res.user_id == user2.id
        assert res.username == user2.username
        assert res.name == user2.name


def test_GetLiteUsers(db):
    user1, token1 = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()
    user4, _ = generate_user()
    user5, _ = generate_user()
    user6, _ = generate_user()

    make_user_block(user4, user1)

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token1) as api:
        res = api.GetLiteUsers(
            api_pb2.GetLiteUsersReq(
                users=[
                    user1.username,
                    str(user1.id),
                    "nonexistent",
                    str(user2.id),
                    "9994",
                    user6.username,
                    str(user5.id),
                    "notreal",
                    user4.username,
                ]
            )
        )

        assert len(res.responses) == 9
        assert res.responses[0].query == user1.username
        assert res.responses[0].user.user_id == user1.id

        assert res.responses[1].query == str(user1.id)
        assert res.responses[1].user.user_id == user1.id

        assert res.responses[2].query == "nonexistent"
        assert res.responses[2].not_found

        assert res.responses[3].query == str(user2.id)
        assert res.responses[3].user.user_id == user2.id

        assert res.responses[4].query == "9994"
        assert res.responses[4].not_found

        assert res.responses[5].query == user6.username
        assert res.responses[5].user.user_id == user6.id

        assert res.responses[6].query == str(user5.id)
        assert res.responses[6].user.user_id == user5.id

        assert res.responses[7].query == "notreal"
        assert res.responses[7].not_found

        # blocked - should return ghost profile
        assert res.responses[8].query == user4.username
        assert not res.responses[8].not_found
        assert res.responses[8].user.user_id == user4.id
        assert res.responses[8].user.is_ghost
        assert res.responses[8].user.username == "ghost"
        assert res.responses[8].user.name == "Deactivated Account"

    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetLiteUsers(api_pb2.GetLiteUsersReq(users=201 * [user1.username]))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "You can't request that many users at a time."


def test_update_profile(db):
    user, token = generate_user()

    with api_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(api_pb2.UpdateProfileReq(name=wrappers_pb2.StringValue(value="  ")))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Name not supported."

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(
                api_pb2.UpdateProfileReq(lat=wrappers_pb2.DoubleValue(value=0), lng=wrappers_pb2.DoubleValue(value=0))
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid coordinate."

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(
                api_pb2.UpdateProfileReq(regions_visited=api_pb2.RepeatedStringValue(value=["United States"]))
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid region."

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(
                api_pb2.UpdateProfileReq(regions_lived=api_pb2.RepeatedStringValue(value=["United Kingdom"]))
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid region."

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
        notifications.SetNotificationSettings(notifications_pb2.SetNotificationSettingsReq(enable_do_not_email=True))

    with api_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(api_pb2.UpdateProfileReq(hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You cannot enable hosting while you have emails turned off in your settings."

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateProfile(api_pb2.UpdateProfileReq(meetup_status=api_pb2.MEETUP_STATUS_OPEN_TO_MEETUP))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You cannot enable meeting up while you have emails turned off in your settings."


def test_language_abilities(db):
    user, token = generate_user(
        language_abilities=[
            ("fin", LanguageFluency.fluent),
            ("fra", LanguageFluency.beginner),
        ],
    )

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert len(res.language_abilities) == 2

        # can't add non-existent languages
        with pytest.raises(grpc.RpcError) as err:
            api.UpdateProfile(
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
        assert err.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert err.value.details() == "Invalid language."

        # can't have multiple languages of the same type
        with pytest.raises(Exception) as err2:
            api.UpdateProfile(
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
        assert "violates unique constraint" in str(err2.value)

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


def test_pending_friend_request_count(db, moderator):
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
        # Sender can still see their own sent requests (even while SHADOWED)
        res = api.Ping(api_pb2.PingReq())
        assert res.pending_friend_request_count == 0

    # Get friend request ID from sender's view (author can see SHADOWED)
    with api_session(token1) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 1
        fr_id = res.sent[0].friend_request_id

    # Recipient cannot see SHADOWED friend requests before mod approval
    with api_session(token2) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.pending_friend_request_count == 0

    # Moderator approves the friend request
    moderator.approve_friend_request(fr_id)

    # Now recipient can see the approved friend request
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


def test_friend_request_flow(db, email_collector: EmailCollector, push_collector: PushCollector, moderator):
    user1, token1 = generate_user(complete_profile=True)
    user2, token2 = generate_user(complete_profile=True)
    user3, token3 = generate_user()

    # send a friend request from user1 to user2
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    with session_scope() as session:
        friend_request = session.execute(
            select(FriendRelationship).where(
                FriendRelationship.from_user_id == user1.id, FriendRelationship.to_user_id == user2.id
            )
        ).scalar_one()
        friend_request_id = friend_request.id

    # Notification is deferred while content is SHADOWED
    # No push notification sent yet
    assert push_collector.count_for_user(user2.id) == 0

    with api_session(token1) as api:
        # Sender can see their own sent requests (even while SHADOWED)
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 1
        assert len(res.received) == 0

        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user_id == user2.id
        assert res.sent[0].friend_request_id == friend_request_id

    # Recipient cannot see SHADOWED friend requests
    with api_session(token2) as api:
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

    # Moderator approves the friend request - this triggers the notification
    moderator.approve_friend_request(friend_request_id)

    push = push_collector.pop_for_user(user2.id, last=True)
    assert push.content.title == f"Friend request from {user1.name}"
    assert push.content.body == f"{user1.name} wants to be your friend."
    assert push.content.action_url == f"http://localhost:3000/connections/friends/?from={user1.id}"

    email = email_collector.pop_for_recipient(user2.email, last=True)
    assert email.recipient == user2.email
    assert email.subject == f"[TEST] {user1.name} wants to be your friend on Couchers.org!"
    assert user2.name in email.plain
    assert user2.name in email.html
    assert user1.name in email.plain
    assert user1.name in email.html
    assert "http://localhost:5001/img/thumbnail/" not in email.plain
    assert "http://localhost:5001/img/thumbnail/" in email.html
    assert "http://localhost:3000/connections/friends/" in email.plain
    assert "http://localhost:3000/connections/friends/" in email.html

    # Now recipient can see the approved friend request
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

    # user2 got one push (from the friend request creation)
    # user1 should now have one push (from the friend request acceptance)
    push = push_collector.pop_for_user(user1.id, last=True)
    assert push.content.title == f"{user2.name} accepted your friend request"
    assert push.content.body == f"You are now friends with {user2.name}."

    email = email_collector.pop_for_recipient(user1.email, last=True)
    assert email.recipient == user1.email
    assert email.subject == f"[TEST] {user2.name} accepted your friend request!"
    assert user1.name in email.plain
    assert user1.name in email.html
    assert user2.name in email.plain
    assert user2.name in email.html
    assert "http://localhost:5001/img/thumbnail/" not in email.plain
    assert "http://localhost:5001/img/thumbnail/" in email.html
    assert f"http://localhost:3000/user/{user2.username}" in email.plain
    assert f"http://localhost:3000/user/{user2.username}" in email.html

    with api_session(token1) as api:
        # check it's gone
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 0
        assert len(res.received) == 0

        # check we're friends now
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 1
        assert res.user_ids[0] == user2.id

    with api_session(token1) as api:
        # we can't unfriend if we aren't friends
        with pytest.raises(grpc.RpcError) as err:
            api.RemoveFriend(api_pb2.RemoveFriendReq(user_id=user3.id))
        assert err.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert err.value.details() == "You aren't friends with that user!"

        # we can unfriend
        res = api.RemoveFriend(api_pb2.RemoveFriendReq(user_id=user2.id))

        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 0


def test_RemoveFriend_regression(db, push_collector: PushCollector, moderator):
    user1, token1 = generate_user(complete_profile=True)
    user2, token2 = generate_user(complete_profile=True)
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()
    user6, token6 = generate_user()

    # Send friend requests
    with api_session(token4) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    with api_session(token5) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))

    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user3.id))

    # Approve all friend requests via moderation
    with session_scope() as session:
        friend_requests = session.execute(select(FriendRelationship)).scalars().all()
        for fr in friend_requests:
            moderator.approve_friend_request(fr.id)

    # Now recipients can respond
    with api_session(token1) as api:
        api.RespondFriendRequest(
            api_pb2.RespondFriendRequestReq(
                friend_request_id=api.ListFriendRequests(empty_pb2.Empty()).received[0].friend_request_id, accept=True
            )
        )

    with api_session(token2) as api:
        for fr in api.ListFriendRequests(empty_pb2.Empty()).received:
            api.RespondFriendRequest(
                api_pb2.RespondFriendRequestReq(friend_request_id=fr.friend_request_id, accept=True)
            )

    with api_session(token1) as api:
        res = api.ListFriends(empty_pb2.Empty())
        assert sorted(res.user_ids) == sorted([user2.id, user4.id])

        api.RemoveFriend(api_pb2.RemoveFriendReq(user_id=user2.id))

        res = api.ListFriends(empty_pb2.Empty())
        assert sorted(res.user_ids) == [user4.id]

        api.RemoveFriend(api_pb2.RemoveFriendReq(user_id=user4.id))

        res = api.ListFriends(empty_pb2.Empty())
        assert not res.user_ids


def test_cant_friend_request_twice(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # send friend request from user1 to user2
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You are already friends with or have sent a friend request to that user."


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
        assert e.value.details() == "You are already friends with or have sent a friend request to that user."


def test_cant_friend_request_already_friends(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_friends(user1, user2)

    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You are already friends with or have sent a friend request to that user."

    with api_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You are already friends with or have sent a friend request to that user."


def test_cant_friend_request_incomplete_profile(db):
    user1, token1 = generate_user(complete_profile=False)
    user2, token2 = generate_user(complete_profile=True)

    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You have to complete your profile before you can send a friend request."

    # the other direction should still work
    with api_session(token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))


def test_excessive_friend_requests_are_reported(db, email_collector: EmailCollector):
    """Test that excessive friend requests are first reported in a warning email and finally lead blocking of further requests."""
    user, token = generate_user()
    rate_limit_definition = RATE_LIMIT_DEFINITIONS[RateLimitAction.friend_request]
    with api_session(token) as api:
        # Test warning email
        for _ in range(rate_limit_definition.warning_limit):
            friend_user, _ = generate_user()
            _ = api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=friend_user.id))

        assert email_collector.count_for_reports() == 0
        friend_user, _ = generate_user()
        _ = api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=friend_user.id))

        email = email_collector.pop_for_reports(last=True)
        assert email.plain.startswith(
            f"User {user.username} has sent {rate_limit_definition.warning_limit} friend requests in the past {RATE_LIMIT_HOURS} hours."
        )

        # Test ban after exceeding FRIEND_REQUEST_HARD_LIMIT
        for _ in range(rate_limit_definition.hard_limit - rate_limit_definition.warning_limit - 1):
            friend_user, _ = generate_user()
            _ = api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=friend_user.id))

        assert email_collector.count_for_reports() == 0
        friend_user, _ = generate_user()
        with pytest.raises(grpc.RpcError) as exc_info:
            _ = api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=friend_user.id))
        assert exc_info.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED
        assert (
            exc_info.value.details()
            == "You have sent a lot of friend requests in the past 24 hours. To avoid spam, you can't send any more for now."
        )

        email = email_collector.pop_for_reports(last=True)
        assert email.plain.startswith(
            f"User {user.username} has sent {rate_limit_definition.hard_limit} friend requests in the past {RATE_LIMIT_HOURS} hours."
        )
        assert "The user has been blocked from sending further friend requests for now." in email.plain


def test_ListFriends(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    # send friend request from user1 to user2 and user3
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user3.id))
        # sender can see their sent requests (they are the author)
        res = api.ListFriendRequests(empty_pb2.Empty())
        assert len(res.sent) == 2
        user1_to_user2_id = [req for req in res.sent if req.user_id == user2.id][0].friend_request_id
        user1_to_user3_id = [req for req in res.sent if req.user_id == user3.id][0].friend_request_id

    with api_session(token3) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))
        res = api.ListFriendRequests(empty_pb2.Empty())
        user3_to_user2_id = res.sent[0].friend_request_id

    # Moderator approves the friend requests so recipients can see them
    moderator.approve_friend_request(user1_to_user2_id)
    moderator.approve_friend_request(user3_to_user2_id)

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

    # Moderator approves user1's friend request to user3 so user3 can see it
    moderator.approve_friend_request(user1_to_user3_id)

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


def test_accept_friend_request(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        moderation_state = ModerationState(
            object_type=ModerationObjectType.friend_request,
            object_id=0,
            visibility=ModerationVisibility.visible,
        )
        session.add(moderation_state)
        session.flush()
        friend_request = FriendRelationship(
            from_user_id=user1.id,
            to_user_id=user2.id,
            status=FriendStatus.pending,
            moderation_state_id=moderation_state.id,
        )
        session.add(friend_request)
        session.flush()
        moderation_state.object_id = friend_request.id
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


def test_reject_friend_request(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

        res = api.ListFriendRequests(empty_pb2.Empty())
        assert res.sent[0].state == api_pb2.FriendRequest.FriendRequestStatus.PENDING
        assert res.sent[0].user_id == user2.id
        fr_id = res.sent[0].friend_request_id

    # Moderator approves the friend request so recipient can see it
    moderator.approve_friend_request(fr_id)

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
    user1, _ = generate_user(last_donated=None)
    user2, _ = generate_user(last_donated=None)
    user3, _ = generate_user(last_donated=None)
    user4, token = generate_user(last_donated=None)

    update_badges(empty_pb2.Empty())

    founder_badge = get_badge_dict()["founder"]
    board_member_badge = get_badge_dict()["board_member"]

    with api_session(token) as api:
        assert api.GetUser(api_pb2.GetUserReq(user=user1.username)).badges == ["founder", "board_member"]
        assert api.GetUser(api_pb2.GetUserReq(user=user2.username)).badges == ["founder", "board_member"]
        assert api.GetUser(api_pb2.GetUserReq(user=user3.username)).badges == []

        assert api.ListBadgeUsers(api_pb2.ListBadgeUsersReq(badge_id=founder_badge.id)).user_ids == [1, 2]
        res = api.ListBadgeUsers(api_pb2.ListBadgeUsersReq(badge_id=board_member_badge.id, page_size=1))
        assert res.user_ids == [1]
        res2 = api.ListBadgeUsers(
            api_pb2.ListBadgeUsersReq(badge_id=board_member_badge.id, page_token=res.next_page_token)
        )
        assert res2.user_ids == [2]


def test_user_add_badge_is_idempotent(db):
    """Test that adding a badge a user already has is a no-op and doesn't send a duplicate notification."""
    user, _ = generate_user()

    with session_scope() as session:
        user_add_badge(session, user.id, "volunteer")

    # one badge row, one notification
    with session_scope() as session:
        badge_count = session.execute(
            select(func.count())
            .select_from(UserBadge)
            .where(UserBadge.user_id == user.id, UserBadge.badge_id == "volunteer")
        ).scalar()
        assert badge_count == 1
        notification_count = session.execute(
            select(func.count()).select_from(Notification).where(Notification.user_id == user.id)
        ).scalar()
        assert notification_count == 1

    # add the same badge again
    with session_scope() as session:
        user_add_badge(session, user.id, "volunteer")

    # still one badge row, no new notification
    with session_scope() as session:
        badge_count = session.execute(
            select(func.count())
            .select_from(UserBadge)
            .where(UserBadge.user_id == user.id, UserBadge.badge_id == "volunteer")
        ).scalar()
        assert badge_count == 1
        notification_count = session.execute(
            select(func.count()).select_from(Notification).where(Notification.user_id == user.id)
        ).scalar()
        assert notification_count == 1


@pytest.mark.parametrize("flag", ["deleted_at", "banned_at"])
def test_ListBadgeUsers_excludes_ghost_users(db, flag):
    """Test that ListBadgeUsers does not return deleted/banned users."""
    user1, token1 = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()

    volunteer_badge = get_badge_dict()["volunteer"]

    # Give all three users the volunteer badge
    with session_scope() as session:
        user_add_badge(session, user1.id, "volunteer", do_notify=False)
        user_add_badge(session, user2.id, "volunteer", do_notify=False)
        user_add_badge(session, user3.id, "volunteer", do_notify=False)

    # Verify all three users appear in the badge list
    with api_session(token1) as api:
        res = api.ListBadgeUsers(api_pb2.ListBadgeUsersReq(badge_id=volunteer_badge.id))
        assert set(res.user_ids) == {user1.id, user2.id, user3.id}

    # Make user2 invisible (deleted or banned)
    with session_scope() as session:
        db_user2 = session.execute(select(User).where(User.id == user2.id)).scalar_one()
        setattr(db_user2, flag, now())

    # Now user2 should not appear in the badge list
    with api_session(token1) as api:
        res = api.ListBadgeUsers(api_pb2.ListBadgeUsersReq(badge_id=volunteer_badge.id))
        assert set(res.user_ids) == {user1.id, user3.id}


@pytest.mark.parametrize("flag", ["deleted_at", "banned_at"])
def test_GetLiteUser_ghost_user_by_username(db, flag):
    """Test that GetLiteUser returns a ghost profile for deleted/banned users when querying by username."""
    user1, token1 = generate_user()
    user2, _ = generate_user()

    # Make user2 invisible
    with session_scope() as session:
        db_user2 = session.merge(user2)
        setattr(db_user2, flag, now())
        session.commit()

    # Refresh the materialized view
    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token1) as api:
        # Query by username
        lite_user = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user2.username))

        assert lite_user.user_id == user2.id
        assert lite_user.username == "ghost"
        assert lite_user.name == "Deactivated Account"
        assert lite_user.lat == 0
        assert lite_user.lng == 0
        assert lite_user.radius == 0
        assert lite_user.city == ""
        assert lite_user.age == 0
        assert lite_user.avatar_url == ""
        assert lite_user.avatar_thumbnail_url == ""
        assert not lite_user.has_strong_verification


@pytest.mark.parametrize("flag", ["deleted_at", "banned_at"])
def test_GetLiteUser_ghost_user_by_id(db, flag):
    """Test that GetLiteUser returns a ghost profile for deleted/banned users when querying by ID."""
    user1, token1 = generate_user()
    user2, _ = generate_user()

    # Make user2 invisible
    with session_scope() as session:
        db_user2 = session.merge(user2)
        setattr(db_user2, flag, now())
        session.commit()

    # Refresh the materialized view
    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token1) as api:
        # Query by ID
        lite_user = api.GetLiteUser(api_pb2.GetLiteUserReq(user=str(user2.id)))

        assert lite_user.user_id == user2.id
        assert lite_user.username == "ghost"
        assert lite_user.name == "Deactivated Account"
        assert lite_user.lat == 0
        assert lite_user.lng == 0
        assert lite_user.radius == 0
        assert lite_user.city == ""
        assert lite_user.age == 0
        assert lite_user.avatar_url == ""
        assert lite_user.avatar_thumbnail_url == ""
        assert not lite_user.has_strong_verification


def test_GetLiteUser_blocked_user(db):
    """Test that GetLiteUser returns a ghost profile for blocked users."""
    user1, token1 = generate_user()
    user2, _ = generate_user()

    # User1 blocks user2
    make_user_block(user1, user2)

    # Refresh the materialized view
    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token1) as api:
        # Query by username
        lite_user = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user2.username))

        assert lite_user.user_id == user2.id
        assert lite_user.is_ghost
        assert lite_user.username == "ghost"
        assert lite_user.name == "Deactivated Account"

        # Query by ID
        lite_user = api.GetLiteUser(api_pb2.GetLiteUserReq(user=str(user2.id)))

        assert lite_user.user_id == user2.id
        assert lite_user.is_ghost
        assert lite_user.username == "ghost"
        assert lite_user.name == "Deactivated Account"


def test_GetLiteUser_blocking_user(db):
    """Test that GetLiteUser returns a ghost profile when the target user has blocked the requester."""
    user1, token1 = generate_user()
    user2, _ = generate_user()

    # User2 blocks user1
    make_user_block(user2, user1)

    # Refresh the materialized view
    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token1) as api:
        # Query by username
        lite_user = api.GetLiteUser(api_pb2.GetLiteUserReq(user=user2.username))

        assert lite_user.user_id == user2.id
        assert lite_user.is_ghost
        assert lite_user.username == "ghost"
        assert lite_user.name == "Deactivated Account"

        # Query by ID
        lite_user = api.GetLiteUser(api_pb2.GetLiteUserReq(user=str(user2.id)))

        assert lite_user.user_id == user2.id
        assert lite_user.is_ghost
        assert lite_user.username == "ghost"
        assert lite_user.name == "Deactivated Account"


@pytest.mark.parametrize("flag", ["deleted_at", "banned_at"])
def test_GetLiteUsers_ghost_users(db, flag):
    """Test that GetLiteUsers returns ghost profiles for deleted/banned users."""
    user1, token1 = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()
    user4, _ = generate_user()

    # Make user2 and user4 invisible
    with session_scope() as session:
        db_user2 = session.merge(user2)
        setattr(db_user2, flag, now())
        db_user4 = session.merge(user4)
        setattr(db_user4, flag, now())
        session.commit()

    # Refresh the materialized view
    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token1) as api:
        res = api.GetLiteUsers(
            api_pb2.GetLiteUsersReq(
                users=[
                    user1.username,  # visible
                    user2.username,  # ghost
                    str(user3.id),  # visible
                    str(user4.id),  # ghost
                ]
            )
        )

        assert len(res.responses) == 4

        # user1 - visible, normal profile
        assert res.responses[0].query == user1.username
        assert not res.responses[0].not_found
        assert res.responses[0].user.user_id == user1.id
        assert res.responses[0].user.username == user1.username
        assert res.responses[0].user.name == user1.name

        # user2 - ghost by username
        assert res.responses[1].query == user2.username
        assert not res.responses[1].not_found
        assert res.responses[1].user.user_id == user2.id
        assert res.responses[1].user.is_ghost
        assert res.responses[1].user.username == "ghost"
        assert res.responses[1].user.name == "Deactivated Account"

        # user3 - visible, normal profile
        assert res.responses[2].query == str(user3.id)
        assert not res.responses[2].not_found
        assert res.responses[2].user.user_id == user3.id
        assert res.responses[2].user.username == user3.username
        assert res.responses[2].user.name == user3.name

        # user4 - ghost by ID
        assert res.responses[3].query == str(user4.id)
        assert not res.responses[3].not_found
        assert res.responses[3].user.user_id == user4.id
        assert res.responses[3].user.is_ghost
        assert res.responses[3].user.username == "ghost"
        assert res.responses[3].user.name == "Deactivated Account"


def test_GetLiteUsers_blocked_users(db):
    """Test that GetLiteUsers returns ghost profiles for blocked users."""
    user1, token1 = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()
    user4, _ = generate_user()
    user5, _ = generate_user()

    # User1 blocks user2
    make_user_block(user1, user2)
    # User4 blocks user1
    make_user_block(user4, user1)

    # Refresh the materialized view
    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token1) as api:
        res = api.GetLiteUsers(
            api_pb2.GetLiteUsersReq(
                users=[
                    user2.username,  # user1 blocked user2
                    str(user3.id),  # visible
                    user4.username,  # user4 blocked user1
                    str(user5.id),  # visible
                ]
            )
        )

        assert len(res.responses) == 4

        # user2 - blocked by user1, should be ghost
        assert res.responses[0].query == user2.username
        assert not res.responses[0].not_found
        assert res.responses[0].user.user_id == user2.id
        assert res.responses[0].user.is_ghost
        assert res.responses[0].user.username == "ghost"
        assert res.responses[0].user.name == "Deactivated Account"

        # user3 - visible
        assert res.responses[1].query == str(user3.id)
        assert not res.responses[1].not_found
        assert res.responses[1].user.user_id == user3.id
        assert res.responses[1].user.username == user3.username

        # user4 - user4 blocked user1, should be ghost
        assert res.responses[2].query == user4.username
        assert not res.responses[2].not_found
        assert res.responses[2].user.user_id == user4.id
        assert res.responses[2].user.is_ghost
        assert res.responses[2].user.username == "ghost"
        assert res.responses[2].user.name == "Deactivated Account"

        # user5 - visible
        assert res.responses[3].query == str(user5.id)
        assert not res.responses[3].not_found
        assert res.responses[3].user.user_id == user5.id
        assert res.responses[3].user.username == user5.username


@pytest.mark.parametrize("flag", ["deleted_at", "banned_at"])
def test_GetUser_ghost_user_by_id(db, flag):
    """Test that GetUser returns a ghost profile for deleted/banned users when querying by ID."""
    user1, token1 = generate_user()
    user2, _ = generate_user()

    # Make user2 invisible
    with session_scope() as session:
        db_user2 = session.merge(user2)
        setattr(db_user2, flag, now())
        session.commit()

    with api_session(token1) as api:
        # Query by ID
        user_pb = api.GetUser(api_pb2.GetUserReq(user=str(user2.id)))

        assert user_pb.user_id == user2.id
        assert user_pb.username == "ghost"
        assert user_pb.name == "Deactivated Account"
        assert user_pb.city == ""
        assert user_pb.hosting_status == 0
        assert user_pb.meetup_status == 0


def test_GetUser_blocked_user(db):
    """Test that GetUser returns a ghost profile for blocked users."""
    user1, token1 = generate_user()
    user2, _ = generate_user()

    # User1 blocks user2
    make_user_block(user1, user2)

    with api_session(token1) as api:
        # Query by username
        user_pb = api.GetUser(api_pb2.GetUserReq(user=user2.username))

        assert user_pb.user_id == user2.id
        assert user_pb.username == "ghost"
        assert user_pb.name == "Deactivated Account"

        # Query by ID
        user_pb = api.GetUser(api_pb2.GetUserReq(user=str(user2.id)))

        assert user_pb.user_id == user2.id
        assert user_pb.username == "ghost"
        assert user_pb.name == "Deactivated Account"


def test_GetUser_blocking_user(db):
    """Test that GetUser returns a ghost profile when the target user has blocked the requester."""
    user1, token1 = generate_user()
    user2, _ = generate_user()

    # User2 blocks user1
    make_user_block(user2, user1)

    with api_session(token1) as api:
        # Query by username
        user_pb = api.GetUser(api_pb2.GetUserReq(user=user2.username))

        assert user_pb.user_id == user2.id
        assert user_pb.username == "ghost"
        assert user_pb.name == "Deactivated Account"

        # Query by ID
        user_pb = api.GetUser(api_pb2.GetUserReq(user=str(user2.id)))

        assert user_pb.user_id == user2.id
        assert user_pb.username == "ghost"
        assert user_pb.name == "Deactivated Account"
