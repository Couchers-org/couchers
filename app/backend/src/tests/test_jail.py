import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.models import User
from pb import api_pb2, auth_pb2, jail_pb2
from tests.test_fixtures import (
    db,
    generate_user,
    generate_user_for_session,
    real_api_session,
    real_jail_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_jail_basic(db):
    user1, token1 = generate_user(db)

    with real_api_session(db, token1) as api:
        res = api.Ping(api_pb2.PingReq())

    with real_jail_session(db, token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        # check every field is false
        for field in res.DESCRIPTOR.fields:
            assert getattr(res, field.name) == False

        assert not res.jailed

    with session_scope(db) as session:
        user2, token2 = generate_user_for_session(session, db)

        # make the user jailed
        user2.accepted_tos = 0
        session.commit()

    with real_api_session(db, token2) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    with real_jail_session(db, token2) as jail:
        res = jail.JailInfo(empty_pb2.Empty())

        assert res.jailed

        reason_count = 0

        # check at least one field is true
        for field in res.DESCRIPTOR.fields:
            reason_count += getattr(res, field.name) == True

        assert reason_count > 0


def test_JailInfo(db):
    with session_scope(db) as session:
        user1, token1 = generate_user_for_session(session, db)

        # make the user jailed
        user1.accepted_tos = 0
        session.commit()

    with real_jail_session(db, token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_tos

    with real_api_session(db, token1) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    with session_scope(db) as session:
        user2, token2 = generate_user_for_session(session, db)

        # make the user not jailed
        user2.accepted_tos = 1
        session.commit()

    with real_jail_session(db, token2) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos

    with real_api_session(db, token2) as api:
        res = api.Ping(api_pb2.PingReq())


def test_AcceptTOS(db):
    with session_scope(db) as session:
        user1, token1 = generate_user_for_session(session, db)

        # make them have not accepted TOS
        user1.accepted_tos = 0
        session.commit()

    with real_jail_session(db, token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_tos

        # calling with accept=False changes nothing
        res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=False))

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

    with session_scope(db) as session:
        user2, token2 = generate_user_for_session(session, db)

        # make them have accepted TOS
        user2.accepted_tos = 1
        session.commit()

    with real_jail_session(db, token2) as jail:
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
