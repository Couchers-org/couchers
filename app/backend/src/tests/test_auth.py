import http.cookies

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy.sql import delete, func

from couchers import errors
from couchers.crypto import hash_password, random_hex
from couchers.db import session_scope
from couchers.models import (
    ContributeOption,
    ContributorForm,
    LoginToken,
    PasswordResetToken,
    SignupFlow,
    User,
    UserSession,
)
from couchers.sql import couchers_select as select
from proto import api_pb2, auth_pb2
from tests.test_fixtures import (  # noqa
    api_session,
    auth_api_session,
    db,
    email_fields,
    fast_passwords,
    generate_user,
    mock_notification_email,
    push_collector,
    real_api_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig, fast_passwords):
    pass


def get_session_cookie_tokens(metadata_interceptor):
    set_cookies = [val for key, val in metadata_interceptor.latest_header_raw if key == "set-cookie"]
    sesh = http.cookies.SimpleCookie([v for v in set_cookies if "sesh" in v][0])["couchers-sesh"].value
    uid = http.cookies.SimpleCookie([v for v in set_cookies if "user-id" in v][0])["couchers-user-id"].value
    return sesh, uid


def test_UsernameValid(db):
    with auth_api_session() as (auth_api, metadata_interceptor):
        assert auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test")).valid

    with auth_api_session() as (auth_api, metadata_interceptor):
        assert not auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="")).valid


def test_signup_incremental(db):
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                basic=auth_pb2.SignupBasic(name="testing", email="email@couchers.org.invalid"),
            )
        )

    flow_token = res.flow_token
    assert res.flow_token
    assert not res.HasField("auth_res")
    assert not res.need_basic
    assert res.need_account
    assert res.need_feedback
    assert res.need_verify_email
    assert res.need_accept_community_guidelines

    # read out the signup token directly from the database for now
    with session_scope() as session:
        flow = session.execute(select(SignupFlow).where(SignupFlow.flow_token == flow_token)).scalar_one()
        assert flow.email_sent
        assert not flow.email_verified
        email_token = flow.email_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(auth_pb2.SignupFlowReq(flow_token=flow_token))

    assert res.flow_token == flow_token
    assert not res.HasField("auth_res")
    assert not res.need_basic
    assert res.need_account
    assert res.need_feedback
    assert res.need_verify_email
    assert res.need_accept_community_guidelines

    # Add feedback
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                flow_token=flow_token,
                feedback=auth_pb2.ContributorForm(
                    ideas="I'm a robot, incapable of original ideation",
                    features="I love all your features",
                    experience="I haven't done couch surfing before",
                    contribute=auth_pb2.CONTRIBUTE_OPTION_YES,
                    contribute_ways=["serving", "backend"],
                    expertise="I'd love to be your server: I can compute very fast, but only simple opcodes",
                ),
            )
        )

    assert res.flow_token == flow_token
    assert not res.HasField("auth_res")
    assert not res.need_basic
    assert res.need_account
    assert not res.need_feedback
    assert res.need_verify_email
    assert res.need_accept_community_guidelines

    # Agree to community guidelines
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                flow_token=flow_token,
                accept_community_guidelines=wrappers_pb2.BoolValue(value=True),
            )
        )

    assert res.flow_token == flow_token
    assert not res.HasField("auth_res")
    assert not res.need_basic
    assert res.need_account
    assert not res.need_feedback
    assert res.need_verify_email
    assert not res.need_accept_community_guidelines

    # Verify email
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                flow_token=flow_token,
                email_token=email_token,
            )
        )

    assert res.flow_token == flow_token
    assert not res.HasField("auth_res")
    assert not res.need_basic
    assert res.need_account
    assert not res.need_feedback
    assert not res.need_verify_email
    assert not res.need_accept_community_guidelines

    # Finally finish off account info
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                flow_token=flow_token,
                account=auth_pb2.SignupAccount(
                    username="frodo",
                    password="a very insecure password",
                    birthdate="1970-01-01",
                    gender="Bot",
                    hosting_status=api_pb2.HOSTING_STATUS_MAYBE,
                    city="New York City",
                    lat=40.7331,
                    lng=-73.9778,
                    radius=500,
                    accept_tos=True,
                ),
            )
        )

    assert not res.flow_token
    assert res.HasField("auth_res")
    assert res.auth_res.user_id
    assert not res.auth_res.jailed
    assert not res.need_basic
    assert not res.need_account
    assert not res.need_feedback
    assert not res.need_verify_email
    assert not res.need_accept_community_guidelines

    user_id = res.auth_res.user_id

    sess_token, uid = get_session_cookie_tokens(metadata_interceptor)
    assert uid == str(user_id)

    with api_session(sess_token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=str(user_id)))

    assert res.username == "frodo"
    assert res.gender == "Bot"
    assert res.hosting_status == api_pb2.HOSTING_STATUS_MAYBE
    assert res.city == "New York City"
    assert res.lat == 40.7331
    assert res.lng == -73.9778
    assert res.radius == 500

    with session_scope() as session:
        form = session.execute(select(ContributorForm)).scalar_one()

        assert form.ideas == "I'm a robot, incapable of original ideation"
        assert form.features == "I love all your features"
        assert form.experience == "I haven't done couch surfing before"
        assert form.contribute == ContributeOption.yes
        assert form.contribute_ways == ["serving", "backend"]
        assert form.expertise == "I'd love to be your server: I can compute very fast, but only simple opcodes"


def _quick_signup():
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                basic=auth_pb2.SignupBasic(name="testing", email="email@couchers.org.invalid"),
                account=auth_pb2.SignupAccount(
                    username="frodo",
                    password="a very insecure password",
                    birthdate="1970-01-01",
                    gender="Bot",
                    hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                    city="New York City",
                    lat=40.7331,
                    lng=-73.9778,
                    radius=500,
                    accept_tos=True,
                ),
                feedback=auth_pb2.ContributorForm(),
                accept_community_guidelines=wrappers_pb2.BoolValue(value=True),
            )
        )

    flow_token = res.flow_token

    assert res.flow_token
    assert not res.HasField("auth_res")
    assert not res.need_basic
    assert not res.need_account
    assert not res.need_feedback
    assert res.need_verify_email

    # read out the signup token directly from the database for now
    with session_scope() as session:
        flow = session.execute(select(SignupFlow).where(SignupFlow.flow_token == flow_token)).scalar_one()
        assert flow.email_sent
        assert not flow.email_verified
        email_token = flow.email_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(auth_pb2.SignupFlowReq(email_token=email_token))

    assert not res.flow_token
    assert res.HasField("auth_res")
    assert res.auth_res.user_id
    assert not res.auth_res.jailed
    assert not res.need_basic
    assert not res.need_account
    assert not res.need_feedback
    assert not res.need_verify_email

    # make sure we got the right token in a cookie
    with session_scope() as session:
        token = (
            session.execute(
                select(UserSession).join(User, UserSession.user_id == User.id).where(User.username == "frodo")
            ).scalar_one()
        ).token
    sesh, uid = get_session_cookie_tokens(metadata_interceptor)
    assert sesh == token


def test_signup(db):
    _quick_signup()


def test_basic_login(db):
    # Create our test user using signup
    _quick_signup()

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.Authenticate(auth_pb2.AuthReq(user="frodo", password="a very insecure password"))

    reply_token, _ = get_session_cookie_tokens(metadata_interceptor)

    with session_scope() as session:
        token = (
            session.execute(
                select(UserSession)
                .join(User, UserSession.user_id == User.id)
                .where(User.username == "frodo")
                .where(UserSession.token == reply_token)
                .where(UserSession.is_valid)
            ).scalar_one_or_none()
        ).token
        assert token

    # log out
    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.Deauthenticate(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={reply_token}"),))


def test_login_part_signed_up_verified_email(db):
    """
    If you try to log in but didn't finish singing up, we send you a new email and ask you to finish signing up.
    """
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="testing", email="email@couchers.org.invalid"))
        )

    flow_token = res.flow_token
    assert res.need_verify_email

    # verify the email
    with session_scope() as session:
        flow = session.execute(select(SignupFlow).where(SignupFlow.flow_token == flow_token)).scalar_one()
        flow_token = flow.flow_token
        email_token = flow.email_token
    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.SignupFlow(auth_pb2.SignupFlowReq(email_token=email_token))

    with mock_notification_email() as mock:
        with auth_api_session() as (auth_api, metadata_interceptor):
            with pytest.raises(grpc.RpcError) as e:
                auth_api.Authenticate(auth_pb2.AuthReq(user="email@couchers.org.invalid", password="wrong pwd"))
            assert e.value.details() == errors.SIGNUP_FLOW_EMAIL_STARTED_SIGNUP

    assert mock.call_count == 1
    e = email_fields(mock)
    assert e.recipient == "email@couchers.org.invalid"
    assert flow_token in e.plain
    assert flow_token in e.html


def test_login_part_signed_up_not_verified_email(db):
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                basic=auth_pb2.SignupBasic(name="testing", email="email@couchers.org.invalid"),
                account=auth_pb2.SignupAccount(
                    username="frodo",
                    password="a very insecure password",
                    birthdate="1999-01-01",
                    gender="Bot",
                    hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                    city="New York City",
                    lat=40.7331,
                    lng=-73.9778,
                    radius=500,
                    accept_tos=True,
                ),
            )
        )

    flow_token = res.flow_token
    assert res.need_verify_email

    with mock_notification_email() as mock:
        with auth_api_session() as (auth_api, metadata_interceptor):
            with pytest.raises(grpc.RpcError) as e:
                auth_api.Authenticate(auth_pb2.AuthReq(user="frodo", password="wrong pwd"))
            assert e.value.details() == errors.SIGNUP_FLOW_EMAIL_STARTED_SIGNUP

    with session_scope() as session:
        flow = session.execute(select(SignupFlow).where(SignupFlow.flow_token == flow_token)).scalar_one()
        email_token = flow.email_token

    assert mock.call_count == 1
    e = email_fields(mock)
    assert e.recipient == "email@couchers.org.invalid"
    assert email_token in e.plain
    assert email_token in e.html


def test_banned_user(db):
    _quick_signup()

    with session_scope() as session:
        session.execute(select(User)).scalar_one().is_banned = True

    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            auth_api.Authenticate(auth_pb2.AuthReq(user="frodo", password="a very insecure password"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.ACCOUNT_SUSPENDED


def test_deleted_user(db):
    _quick_signup()

    with session_scope() as session:
        session.execute(select(User)).scalar_one().is_deleted = True

    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            auth_api.Authenticate(auth_pb2.AuthReq(user="frodo", password="a very insecure password"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.ACCOUNT_NOT_FOUND


def test_invalid_token(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    wrong_token = random_hex(32)

    with real_api_session(wrong_token) as api, pytest.raises(grpc.RpcError) as e:
        res = api.GetUser(api_pb2.GetUserReq(user=user2.username))

    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
    assert e.value.details() == "Unauthorized"


def test_password_reset_v2(db, push_collector):
    user, token = generate_user(hashed_password=hash_password("mypassword"))

    with auth_api_session() as (auth_api, metadata_interceptor):
        with mock_notification_email() as mock:
            res = auth_api.ResetPassword(auth_pb2.ResetPasswordReq(user=user.username))

    with session_scope() as session:
        password_reset_token = session.execute(select(PasswordResetToken)).scalar_one().token

    assert mock.call_count == 1
    e = email_fields(mock)
    assert e.recipient == user.email
    assert "reset" in e.subject.lower()
    assert password_reset_token in e.plain
    assert password_reset_token in e.html
    unique_string = "You asked for your password to be reset on Couchers.org."
    assert unique_string in e.plain
    assert unique_string in e.html
    assert f"http://localhost:3000/complete-password-reset?token={password_reset_token}" in e.plain
    assert f"http://localhost:3000/complete-password-reset?token={password_reset_token}" in e.html
    assert "support@couchers.org" in e.plain
    assert "support@couchers.org" in e.html

    push_collector.assert_user_push_matches_fields(
        user.id,
        title="A password reset was initiated on your account",
        body="Someone initiated a password change on your account.",
    )

    # make sure bad password are caught
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            auth_api.CompletePasswordResetV2(
                auth_pb2.CompletePasswordResetV2Req(password_reset_token=password_reset_token, new_password="password")
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INSECURE_PASSWORD

    # make sure we can set a good password
    with auth_api_session() as (auth_api, metadata_interceptor):
        pwd = random_hex()
        with mock_notification_email() as mock:
            res = auth_api.CompletePasswordResetV2(
                auth_pb2.CompletePasswordResetV2Req(password_reset_token=password_reset_token, new_password=pwd)
            )

    push_collector.assert_user_push_matches_fields(
        user.id,
        ix=1,
        title="Your password was successfully reset",
        body="Your password on Couchers.org was changed. If that was you, then no further action is needed.",
    )

    session_token, _ = get_session_cookie_tokens(metadata_interceptor)

    with session_scope() as session:
        other_session_token = (
            session.execute(
                select(UserSession)
                .join(User, UserSession.user_id == User.id)
                .where(User.username == user.username)
                .where(UserSession.token == session_token)
                .where(UserSession.is_valid)
            ).scalar_one_or_none()
        ).token
        assert other_session_token

    # make sure we can't set a password again
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            auth_api.CompletePasswordResetV2(
                auth_pb2.CompletePasswordResetV2Req(
                    password_reset_token=password_reset_token, new_password=random_hex()
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.INVALID_TOKEN

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert user.hashed_password == hash_password(pwd)


def test_password_reset_no_such_user(db):
    user, token = generate_user()

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.ResetPassword(
            auth_pb2.ResetPasswordReq(
                user="nonexistentuser",
            )
        )

    with session_scope() as session:
        res = session.execute(select(PasswordResetToken)).scalar_one_or_none()

    assert res is None


def test_password_reset_invalid_token_v2(db):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.ResetPassword(
            auth_pb2.ResetPasswordReq(
                user=user.username,
            )
        )

    with auth_api_session() as (auth_api, metadata_interceptor), pytest.raises(grpc.RpcError) as e:
        res = auth_api.CompletePasswordResetV2(auth_pb2.CompletePasswordResetV2Req(password_reset_token="wrongtoken"))
    assert e.value.code() == grpc.StatusCode.NOT_FOUND
    assert e.value.details() == errors.INVALID_TOKEN

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert user.hashed_password == hash_password(password)


def test_logout_invalid_token(db):
    # Create our test user using signup
    _quick_signup()

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.Authenticate(auth_pb2.AuthReq(user="frodo", password="a very insecure password"))

    reply_token, _ = get_session_cookie_tokens(metadata_interceptor)

    # delete all login tokens
    with session_scope() as session:
        session.execute(delete(LoginToken))

    # log out with non-existent token should still return a valid result
    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.Deauthenticate(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={reply_token}"),))

    reply_token, _ = get_session_cookie_tokens(metadata_interceptor)
    # make sure we set an empty cookie
    assert reply_token == ""


def test_signup_without_password(db):
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(
                    basic=auth_pb2.SignupBasic(name="Räksmörgås", email="a1@b.com"),
                    account=auth_pb2.SignupAccount(
                        username="frodo",
                        password="bad",
                        city="Minas Tirith",
                        birthdate="9999-12-31",  # arbitrary future birthdate
                        gender="Robot",
                        hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                        lat=1,
                        lng=1,
                        radius=100,
                        accept_tos=True,
                    ),
                    feedback=auth_pb2.ContributorForm(),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.PASSWORD_TOO_SHORT


def test_signup_invalid_birthdate(db):
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(
                    basic=auth_pb2.SignupBasic(name="Räksmörgås", email="a1@b.com"),
                    account=auth_pb2.SignupAccount(
                        username="frodo",
                        password="a very insecure password",
                        city="Minas Tirith",
                        birthdate="9999-12-31",  # arbitrary future birthdate
                        gender="Robot",
                        hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                        lat=1,
                        lng=1,
                        radius=100,
                        accept_tos=True,
                    ),
                    feedback=auth_pb2.ContributorForm(),
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.INVALID_BIRTHDATE

        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                basic=auth_pb2.SignupBasic(name="Christopher", email="a2@b.com"),
                account=auth_pb2.SignupAccount(
                    username="ceelo",
                    password="a very insecure password",
                    city="New York City",
                    birthdate="2000-12-31",  # arbitrary birthdate older than 18 years
                    gender="Helicopter",
                    hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                    lat=1,
                    lng=1,
                    radius=100,
                    accept_tos=True,
                ),
                feedback=auth_pb2.ContributorForm(),
            )
        )

        assert res.flow_token

        with pytest.raises(grpc.RpcError) as e:
            auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(
                    basic=auth_pb2.SignupBasic(name="Franklin", email="a3@b.com"),
                    account=auth_pb2.SignupAccount(
                        username="franklin",
                        password="a very insecure password",
                        city="Los Santos",
                        birthdate="2010-04-09",  # arbitrary birthdate < 18 yrs
                        gender="Male",
                        hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                        lat=1,
                        lng=1,
                        radius=100,
                        accept_tos=True,
                    ),
                    feedback=auth_pb2.ContributorForm(),
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.INVALID_BIRTHDATE

        with session_scope() as session:
            assert session.execute(select(func.count()).select_from(SignupFlow)).scalar_one() == 1


def test_signup_invalid_email(db):
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.SignupFlow(auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="frodo", email="a")))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_EMAIL

    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.SignupFlow(auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="frodo", email="a@b")))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_EMAIL

    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.SignupFlow(auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="frodo", email="a@b.")))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_EMAIL

    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.SignupFlow(auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="frodo", email="a@b.c")))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_EMAIL


def test_signup_existing_email(db):
    # Signed up user
    user, _ = generate_user()

    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="frodo", email=user.email))
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.SIGNUP_FLOW_EMAIL_TAKEN


def test_signup_continue_with_email(db):
    testing_email = f"{random_hex(12)}@couchers.org.invalid"
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="frodo", email=testing_email)))
    flow_token = res.flow_token
    assert flow_token

    # continue with same email, should just send another email to the user
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            res = auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="frodo", email=testing_email))
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.SIGNUP_FLOW_EMAIL_STARTED_SIGNUP


def test_signup_resend_email(db):
    with auth_api_session() as (auth_api, metadata_interceptor):
        with mock_notification_email() as mock:
            res = auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(
                    basic=auth_pb2.SignupBasic(name="testing", email="email@couchers.org.invalid"),
                    account=auth_pb2.SignupAccount(
                        username="frodo",
                        password="a very insecure password",
                        birthdate="1970-01-01",
                        gender="Bot",
                        hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                        city="New York City",
                        lat=40.7331,
                        lng=-73.9778,
                        radius=500,
                        accept_tos=True,
                    ),
                    feedback=auth_pb2.ContributorForm(),
                    accept_community_guidelines=wrappers_pb2.BoolValue(value=True),
                )
            )
        assert mock.call_count == 1
        e = email_fields(mock)
        assert e.recipient == "email@couchers.org.invalid"

    flow_token = res.flow_token
    assert flow_token

    with session_scope() as session:
        flow = session.execute(select(SignupFlow)).scalar_one()
        assert flow.flow_token == flow_token
        assert flow.email_sent
        assert not flow.email_verified
        email_token = flow.email_token

    # ask for a new signup email
    with auth_api_session() as (auth_api, metadata_interceptor):
        with mock_notification_email() as mock:
            res = auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(
                    flow_token=flow_token,
                    resend_verification_email=True,
                )
            )
        assert mock.call_count == 1
        e = email_fields(mock)
        assert e.recipient == "email@couchers.org.invalid"
        assert email_token in e.plain
        assert email_token in e.html

    with session_scope() as session:
        flow = session.execute(select(SignupFlow)).scalar_one()
        assert not flow.email_verified

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                email_token=email_token,
            )
        )

    assert not res.flow_token
    assert res.HasField("auth_res")


def test_successful_authenticate(db):
    user, _ = generate_user(hashed_password=hash_password("password"))

    # Authenticate with username
    with auth_api_session() as (auth_api, metadata_interceptor):
        reply = auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password="password"))
    assert not reply.jailed

    # Authenticate with email
    with auth_api_session() as (auth_api, metadata_interceptor):
        reply = auth_api.Authenticate(auth_pb2.AuthReq(user=user.email, password="password"))
    assert not reply.jailed


def test_unsuccessful_authenticate(db):
    user, _ = generate_user(hashed_password=hash_password("password"))

    # Invalid password
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password="incorrectpassword"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.INVALID_PASSWORD

    # Invalid username
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.Authenticate(auth_pb2.AuthReq(user="notarealusername", password="password"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.ACCOUNT_NOT_FOUND

    # Invalid email
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.Authenticate(
                auth_pb2.AuthReq(user=f"{random_hex(12)}@couchers.org.invalid", password="password")
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.ACCOUNT_NOT_FOUND

    # Invalid id
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.Authenticate(auth_pb2.AuthReq(user="-1", password="password"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.ACCOUNT_NOT_FOUND


def test_complete_signup(db):
    testing_email = f"{random_hex(12)}@couchers.org.invalid"
    with auth_api_session() as (auth_api, metadata_interceptor):
        reply = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="Tester", email=testing_email))
        )

    flow_token = reply.flow_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        # Invalid username
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(
                    flow_token=flow_token,
                    account=auth_pb2.SignupAccount(
                        username=" ",
                        password="a very insecure password",
                        city="Minas Tirith",
                        birthdate="1980-12-31",
                        gender="Robot",
                        hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                        lat=1,
                        lng=1,
                        radius=100,
                        accept_tos=True,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_USERNAME

    with auth_api_session() as (auth_api, metadata_interceptor):
        # Invalid name
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(
                    basic=auth_pb2.SignupBasic(name=" ", email=f"{random_hex(12)}@couchers.org.invalid")
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_NAME

    with auth_api_session() as (auth_api, metadata_interceptor):
        # Hosting status required
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(
                    flow_token=flow_token,
                    account=auth_pb2.SignupAccount(
                        username="frodo",
                        password="a very insecure password",
                        city="Minas Tirith",
                        birthdate="1980-12-31",
                        gender="Robot",
                        hosting_status=None,
                        lat=1,
                        lng=1,
                        radius=100,
                        accept_tos=True,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.HOSTING_STATUS_REQUIRED

    user, _ = generate_user()
    with auth_api_session() as (auth_api, metadata_interceptor):
        # Username unavailable
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(
                    flow_token=flow_token,
                    account=auth_pb2.SignupAccount(
                        username=user.username,
                        password="a very insecure password",
                        city="Minas Tirith",
                        birthdate="1980-12-31",
                        gender="Robot",
                        hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                        lat=1,
                        lng=1,
                        radius=100,
                        accept_tos=True,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.USERNAME_NOT_AVAILABLE

    with auth_api_session() as (auth_api, metadata_interceptor):
        # Invalid coordinate
        with pytest.raises(grpc.RpcError) as e:
            reply = auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(
                    flow_token=flow_token,
                    account=auth_pb2.SignupAccount(
                        username="frodo",
                        password="a very insecure password",
                        city="Minas Tirith",
                        birthdate="1980-12-31",
                        gender="Robot",
                        hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                        lat=0,
                        lng=0,
                        radius=100,
                        accept_tos=True,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_COORDINATE


def test_signup_token_regression(db):
    # Repro steps:
    # 1. Start a signup
    # 2. Confirm the email
    # 3. Start a new signup with the same email
    # Expected: send a link to the email to continue signing up.
    # Actual: `AttributeError: 'SignupFlow' object has no attribute 'token'`

    testing_email = f"{random_hex(12)}@couchers.org.invalid"

    # 1. Start a signup
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="frodo", email=testing_email)))
    flow_token = res.flow_token
    assert flow_token

    # 2. Confirm the email
    with session_scope() as session:
        email_token = (
            session.execute(select(SignupFlow).where(SignupFlow.flow_token == flow_token)).scalar_one().email_token
        )

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                flow_token=flow_token,
                email_token=email_token,
            )
        )

    # 3. Start a new signup with the same email
    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            res = auth_api.SignupFlow(
                auth_pb2.SignupFlowReq(basic=auth_pb2.SignupBasic(name="frodo", email=testing_email))
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.SIGNUP_FLOW_EMAIL_STARTED_SIGNUP


@pytest.mark.parametrize("opt_out", [True, False])
def test_opt_out_of_newsletter(db, opt_out):
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                basic=auth_pb2.SignupBasic(name="testing", email="email@couchers.org.invalid"),
                account=auth_pb2.SignupAccount(
                    username="frodo",
                    password="a very insecure password",
                    birthdate="1970-01-01",
                    gender="Bot",
                    hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                    city="New York City",
                    lat=40.7331,
                    lng=-73.9778,
                    radius=500,
                    accept_tos=True,
                    opt_out_of_newsletter=opt_out,
                ),
                feedback=auth_pb2.ContributorForm(),
                accept_community_guidelines=wrappers_pb2.BoolValue(value=True),
            )
        )

    with session_scope() as session:
        email_token = (
            session.execute(select(SignupFlow).where(SignupFlow.flow_token == res.flow_token)).scalar_one().email_token
        )

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(auth_pb2.SignupFlowReq(email_token=email_token))

    user_id = res.auth_res.user_id

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == user_id)).scalar_one()
        assert not user.in_sync_with_newsletter
        assert user.opt_out_of_newsletter == opt_out


def test_GetAuthState(db):
    user, token = generate_user()
    jailed_user, jailed_token = generate_user(accepted_tos=0)

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.GetAuthState(empty_pb2.Empty())
        assert not res.logged_in
        assert not res.HasField("auth_res")

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.GetAuthState(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={token}"),))
        assert res.logged_in
        assert res.HasField("auth_res")
        assert res.auth_res.user_id == user.id
        assert not res.auth_res.jailed

        auth_api.Deauthenticate(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={token}"),))

        res = auth_api.GetAuthState(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={token}"),))
        assert not res.logged_in
        assert not res.HasField("auth_res")

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.GetAuthState(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={jailed_token}"),))
        assert res.logged_in
        assert res.HasField("auth_res")
        assert res.auth_res.user_id == jailed_user.id
        assert res.auth_res.jailed


# tests for ConfirmChangeEmail within test_account.py tests for test_ChangeEmail_*
