from concurrent import futures
from contextlib import contextmanager

import grpc
import pytest

from couchers.crypto import random_hex
from couchers.models import Base, LoginToken, SignupToken, User
from couchers.servicers.auth import Auth
from pb import api_pb2, auth_pb2, auth_pb2_grpc, bugs_pb2_grpc
from tests.test_fixtures import api_session, auth_api_session, db, generate_user


def test_UsernameValid(db):
    with auth_api_session(db) as auth_api:
        assert auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test")).valid

    with auth_api_session(db) as auth_api:
        assert not auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="")).valid


def test_basic_signup(db):
    with auth_api_session(db) as auth_api:
        reply = auth_api.Signup(auth_pb2.SignupReq(email="a@b.com"))
    assert reply.next_step == auth_pb2.SignupRes.SignupStep.SENT_SIGNUP_EMAIL

    # read out the signup token directly from the database for now
    entry = db().query(SignupToken).filter(SignupToken.email == "a@b.com").one_or_none()
    signup_token = entry.token

    with auth_api_session(db) as auth_api:
        reply = auth_api.SignupTokenInfo(auth_pb2.SignupTokenInfoReq(signup_token=signup_token))

    assert reply.email == "a@b.com"

    with auth_api_session(db) as auth_api:
        reply = auth_api.CompleteSignup(
            auth_pb2.CompleteSignupReq(
                signup_token=signup_token,
                username="frodo",
                name="Räksmörgås",
                city="Minas Tirith",
                birthdate="1980-12-31",
                gender="Robot",
                hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
            )
        )
    assert isinstance(reply.token, str)


def test_basic_login(db):
    # Create our test user using signup
    test_basic_signup(db)

    with auth_api_session(db) as auth_api:
        reply = auth_api.Login(auth_pb2.LoginReq(user="frodo"))
    assert reply.next_step == auth_pb2.LoginRes.LoginStep.SENT_LOGIN_EMAIL

    # backdoor to find login token
    entry = db().query(LoginToken).one_or_none()
    login_token = entry.token

    with auth_api_session(db) as auth_api:
        reply = auth_api.CompleteTokenLogin(auth_pb2.CompleteTokenLoginReq(login_token=login_token))
    assert isinstance(reply.token, str)
    session_token = reply.token

    # log out
    with auth_api_session(db) as auth_api:
        reply = auth_api.Deauthenticate(auth_pb2.DeAuthReq(token=session_token))


def test_login_tokens_invalidate_after_use(db):
    test_basic_signup(db)
    with auth_api_session(db) as auth_api:
        reply = auth_api.Login(auth_pb2.LoginReq(user="frodo"))
    assert reply.next_step == auth_pb2.LoginRes.LoginStep.SENT_LOGIN_EMAIL

    login_token = db().query(LoginToken).one_or_none().token

    with auth_api_session(db) as auth_api:
        session_token = auth_api.CompleteTokenLogin(auth_pb2.CompleteTokenLoginReq(login_token=login_token)).token

    with auth_api_session(db) as auth_api, pytest.raises(grpc.RpcError):
        # check we can't login again
        auth_api.CompleteTokenLogin(auth_pb2.CompleteTokenLoginReq(login_token=login_token))


def test_banned_user(db):
    test_basic_signup(db)
    with auth_api_session(db) as auth_api:
        reply = auth_api.Login(auth_pb2.LoginReq(user="frodo"))
    assert reply.next_step == auth_pb2.LoginRes.LoginStep.SENT_LOGIN_EMAIL

    login_token = db().query(LoginToken).one_or_none().token

    session = db()
    session.query(User).one().is_banned = True
    session.commit()

    with auth_api_session(db) as auth_api:
        with pytest.raises(grpc.RpcError):
            auth_api.CompleteTokenLogin(auth_pb2.CompleteTokenLoginReq(login_token=login_token))


def test_invalid_token(db):
    user1, token1 = generate_user(db)
    user2, token2 = generate_user(db)

    wrong_token = random_hex(32)

    with api_session(db, wrong_token) as api, pytest.raises(grpc.RpcError) as e:
        res = api.GetUser(api_pb2.GetUserReq(user=user2.username))

    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
    assert e.value.details() == "Unauthorized"
