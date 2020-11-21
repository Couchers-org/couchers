import grpc
import pytest

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
    user1, token1 = generate_user(db, "tester1", jailed=False)

    with real_api_session(db, token1) as api:
        res = api.Ping(api_pb2.PingReq())

    with real_jail_session(db, token1) as jail:
        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert len(res.reasons) == 0

    user2, token2 = generate_user(db, "tester2", jailed=True)

    with real_api_session(db, token2) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    with real_jail_session(db, token2) as jail:
        res = jail.JailInfo(jail_pb2.JailInfoReq())
        assert len(res.reasons) > 0


def test_JailInfo_not_jailed(db):
    with session_scope(db) as session:
        user, token = generate_user_for_session(db, session, "tester")

        user.accepted_tos = 0

        session.commit()

        with real_api_session(db, token) as api, pytest.raises(grpc.RpcError) as e:
            res = api.Ping(api_pb2.PingReq())
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

        with real_jail_session(db, token) as jail:
            res = jail.JailInfo(jail_pb2.JailInfoReq())
            assert len(res.reasons) == 1
            assert res.reasons[0] == jail_pb2.JailInfoRes.JailReason.MISSING_TOS


def test_GetTOS():
    pass


def test_AcceptTOS():
    pass
