import grpc
import pytest
from concurrent import futures
from contextlib import contextmanager

from couchers.models import Base, SignupToken, LoginToken, User
from couchers.servicers.auth import Auth
from pb import auth_pb2, auth_pb2_grpc, api_pb2

from tests.test_fixtures import db


@contextmanager
def auth_api_session(db_session):
    """
    Create a fresh Auth API for testing

    TODO: investigate if there's a smarter way to stub out these tests?
    """
    auth = Auth(db_session)
    auth_server = grpc.server(futures.ThreadPoolExecutor(1))
    port = auth_server.add_insecure_port("localhost:0")
    auth_pb2_grpc.add_AuthServicer_to_server(auth, auth_server)
    auth_server.start()

    with grpc.insecure_channel(f"localhost:{port}") as channel:
        yield auth_pb2_grpc.AuthStub(channel)

    auth_server.stop(None)


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
        reply = auth_api.CompleteSignup(auth_pb2.CompleteSignupReq(
            signup_token=signup_token,
            username="frodo",
            name="Räksmörgås",
            city="Minas Tirith",
            birthdate="1980-12-31",
            gender="Robot",
            hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST))
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
