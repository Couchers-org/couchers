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
    user1, token1 = generate_user(db, jailed=False)

    with real_api_session(db, token1) as api:
        res = api.Ping(api_pb2.PingReq())

    with real_jail_session(db, token1) as jail:
        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert len(res.reasons) == 0

    user2, token2 = generate_user(db, jailed=True)

    with real_api_session(db, token2) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    with real_jail_session(db, token2) as jail:
        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert len(res.reasons) > 0


def test_JailInfo(db):
    with session_scope(db) as session:
        user1, token1 = generate_user_for_session(session, db)

        # make the user jailed
        user1.accepted_tos = 0
        session.commit()

    with real_jail_session(db, token1) as jail:
        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert len(res.reasons) == 1
        assert res.reasons[0] == jail_pb2.JailInfoRes.JailReason.MISSING_TOS

    with real_api_session(db, token1) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    with session_scope(db) as session:
        user2, token2 = generate_user_for_session(session, db)

        # make the user not jailed
        user2.accepted_tos = 1
        session.commit()

    with real_jail_session(db, token2) as jail:
        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert len(res.reasons) == 0

    with real_api_session(db, token2) as api:
        res = api.Ping(api_pb2.PingReq())


def test_GetTOS(db):
    with session_scope(db) as session:
        user1, token1 = generate_user_for_session(session, db, jailed=False)

        # make them have not accepted TOS
        user1.accepted_tos = 0
        session.commit()

    with real_jail_session(db, token1) as jail:
        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert len(res.reasons) >= 1
        assert jail_pb2.JailInfoRes.JailReason.MISSING_TOS in res.reasons

        res = jail.GetTOS(empty_pb2.Empty())
        assert not res.accepted_tos

    with session_scope(db) as session:
        user2, token2 = generate_user_for_session(session, db, jailed=False)

        # make them have accepted TOS
        user2.accepted_tos = 1
        session.commit()

    with real_jail_session(db, token2) as jail:
        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert jail_pb2.JailInfoRes.JailReason.MISSING_TOS not in res.reasons

        res = jail.GetTOS(empty_pb2.Empty())
        assert res.accepted_tos


def test_AcceptTOS(db):
    with session_scope(db) as session:
        user1, token1 = generate_user_for_session(session, db, jailed=False)

        # make them have not accepted TOS
        user1.accepted_tos = 0
        session.commit()

    with real_jail_session(db, token1) as jail:
        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert len(res.reasons) >= 1
        assert jail_pb2.JailInfoRes.JailReason.MISSING_TOS in res.reasons

        res = jail.GetTOS(empty_pb2.Empty())
        assert not res.accepted_tos

        # calling with accept=False changes nothing
        res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=False))

        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert len(res.reasons) >= 1
        assert jail_pb2.JailInfoRes.JailReason.MISSING_TOS in res.reasons

        res = jail.GetTOS(empty_pb2.Empty())
        assert not res.accepted_tos

        # now accept
        res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=True))

        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert jail_pb2.JailInfoRes.JailReason.MISSING_TOS not in res.reasons

        res = jail.GetTOS(empty_pb2.Empty())
        assert res.accepted_tos

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_TOS

    with session_scope(db) as session:
        user2, token2 = generate_user_for_session(session, db, jailed=False)

        # make them have accepted TOS
        user2.accepted_tos = 1
        session.commit()

    with real_jail_session(db, token2) as jail:
        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert jail_pb2.JailInfoRes.JailReason.MISSING_TOS not in res.reasons

        res = jail.GetTOS(empty_pb2.Empty())
        assert res.accepted_tos

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_TOS

        # accepting again doesn't do anything
        res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=True))

        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert jail_pb2.JailInfoRes.JailReason.MISSING_TOS not in res.reasons

        res = jail.GetTOS(empty_pb2.Empty())
        assert res.accepted_tos
