import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors, models
from couchers.constants import TOS_VERSION
from couchers.crypto import random_hex
from couchers.servicers import jail as servicers_jail
from proto import api_pb2, jail_pb2
from tests.test_fixtures import (  # noqa
    db,
    fast_passwords,
    generate_user,
    real_api_session,
    real_jail_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_jail_basic(db):
    user1, token1 = generate_user()

    with real_api_session(token1) as api:
        res = api.Ping(api_pb2.PingReq())

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        # check every field is false
        for field in res.DESCRIPTOR.fields:
            assert getattr(res, field.name) == False

        assert not res.jailed

    # make the user jailed
    user2, token2 = generate_user(accepted_tos=0)

    with real_api_session(token2) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    with real_jail_session(token2) as jail:
        res = jail.JailInfo(empty_pb2.Empty())

        assert res.jailed

        reason_count = 0

        # check at least one field is true
        for field in res.DESCRIPTOR.fields:
            reason_count += getattr(res, field.name) == True

        assert reason_count > 0


def test_JailInfo(db):
    user1, token1 = generate_user(accepted_tos=0)

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_tos

    with real_api_session(token1) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    # make the user not jailed
    user2, token2 = generate_user()

    with real_jail_session(token2) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos

    with real_api_session(token2) as api:
        res = api.Ping(api_pb2.PingReq())


def test_AcceptTOS(db):
    # make them have not accepted TOS
    user1, token1 = generate_user(accepted_tos=0)

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_tos

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_TOS

        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_tos

        # now accept
        res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=True))

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_TOS

    # make them have accepted TOS
    user2, token2 = generate_user()

    with real_jail_session(token2) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_TOS

        # accepting again doesn't do anything
        res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=True))

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos


def test_TOS_increase(db, monkeypatch):
    # test if the TOS version is updated

    # not jailed yet
    user, token = generate_user()

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos

    with real_api_session(token) as api:
        res = api.Ping(api_pb2.PingReq())

    # now we pretend to update the TOS version
    new_TOS_VERSION = TOS_VERSION + 1

    monkeypatch.setattr(models, "TOS_VERSION", new_TOS_VERSION)
    monkeypatch.setattr(servicers_jail, "TOS_VERSION", new_TOS_VERSION)

    # make sure we're jailed
    with real_api_session(token) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_tos

        # now accept
        res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=True))

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos


def test_SetLocation(db):
    # make them have not added a location
    user1, token1 = generate_user(geom=None, geom_radius=None)

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


def test_AcceptCommunityGuidelines(db):
    # make them have not accepted GC
    user1, token1 = generate_user(accepted_community_guidelines=0)

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_community_guidelines

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptCommunityGuidelines(jail_pb2.AcceptCommunityGuidelinesReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_COMMUNITY_GUIDELINES

        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_community_guidelines

        # now accept
        res = jail.AcceptCommunityGuidelines(jail_pb2.AcceptCommunityGuidelinesReq(accept=True))

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_community_guidelines

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptCommunityGuidelines(jail_pb2.AcceptCommunityGuidelinesReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_COMMUNITY_GUIDELINES

    # make them have accepted GC
    user2, token2 = generate_user()

    with real_jail_session(token2) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_community_guidelines

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptCommunityGuidelines(jail_pb2.AcceptCommunityGuidelinesReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_COMMUNITY_GUIDELINES

        # accepting again doesn't do anything
        res = jail.AcceptCommunityGuidelines(jail_pb2.AcceptCommunityGuidelinesReq(accept=True))

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_community_guidelines


def test_SetPassword(db, fast_passwords):
    # make them not have a password
    user1, token1 = generate_user(hashed_password=None)

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_set_password

        # make sure bad password are caught
        with pytest.raises(grpc.RpcError) as e:
            jail.SetPassword(jail_pb2.SetPasswordReq(new_password="password"))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INSECURE_PASSWORD

        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_set_password

        # make sure we can set a good password
        pwd = random_hex()
        res = jail.SetPassword(jail_pb2.SetPasswordReq(new_password=pwd))

        assert not res.jailed
        assert not res.has_not_set_password

        # make sure we can't set a password again
        with pytest.raises(grpc.RpcError) as e:
            jail.SetPassword(jail_pb2.SetPasswordReq(new_password=random_hex()))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.ALREADY_HAS_PASSWORD

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_set_password
