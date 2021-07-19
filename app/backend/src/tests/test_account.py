from datetime import timedelta
from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy.sql import func

from couchers import errors
from couchers.crypto import hash_password, random_hex
from couchers.db import session_scope
from couchers.models import AccountDeletionToken, BackgroundJob, BackgroundJobType, ReasonForDeletion, Upload, User
from couchers.sql import couchers_select as select
from couchers.utils import now
from proto import account_pb2, auth_pb2
from tests.test_fixtures import account_session, auth_api_session, db, fast_passwords, generate_user, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_GetAccountInfo(db, fast_passwords):
    # without password
    user1, token1 = generate_user(hashed_password=None, email="funkybot@couchers.invalid")

    with account_session(token1) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.login_method == account_pb2.GetAccountInfoRes.LoginMethod.MAGIC_LINK
        assert not res.has_password
        assert res.email == "funkybot@couchers.invalid"
        assert res.username == user1.username

    # with password
    user1, token1 = generate_user(hashed_password=hash_password(random_hex()), email="user@couchers.invalid")

    with account_session(token1) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.login_method == account_pb2.GetAccountInfoRes.LoginMethod.PASSWORD
        assert res.has_password
        assert res.email == "user@couchers.invalid"
        assert res.username == user1.username


def test_GetAccountInfo_regression(db):
    # there was a bug in evaluating `has_completed_profile` on the backend (in python)
    # when about_me is None but the user has a key, it was failing because len(about_me) doesn't work on None
    uploader_user, _ = generate_user()
    with session_scope() as session:
        key = random_hex(32)
        filename = random_hex(32) + ".jpg"
        session.add(
            Upload(
                key=key,
                filename=filename,
                creator_user_id=uploader_user.id,
            )
        )
        session.commit()
    user, token = generate_user(about_me=None, avatar_key=key)

    with account_session(token) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())


def test_ChangePassword_normal(db, fast_passwords):
    # user has old password and is changing to new password
    old_password = random_hex()
    new_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with patch("couchers.servicers.account.send_password_changed_email") as mock:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value=old_password),
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        mock.assert_called_once()

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(new_password)


def test_ChangePassword_regression(db, fast_passwords):
    # send_password_changed_email wasn't working
    # user has old password and is changing to new password
    old_password = random_hex()
    new_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        account.ChangePassword(
            account_pb2.ChangePasswordReq(
                old_password=wrappers_pb2.StringValue(value=old_password),
                new_password=wrappers_pb2.StringValue(value=new_password),
            )
        )

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(new_password)


def test_ChangePassword_normal_short_password(db, fast_passwords):
    # user has old password and is changing to new password, but used short password
    old_password = random_hex()
    new_password = random_hex(length=1)
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value=old_password),
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.PASSWORD_TOO_SHORT

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePassword_normal_long_password(db, fast_passwords):
    # user has old password and is changing to new password, but used short password
    old_password = random_hex()
    new_password = random_hex(length=1000)
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value=old_password),
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.PASSWORD_TOO_LONG

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePassword_normal_insecure_password(db, fast_passwords):
    # user has old password and is changing to new password, but used insecure password
    old_password = random_hex()
    new_password = "12345678"
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value=old_password),
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INSECURE_PASSWORD

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePassword_normal_wrong_password(db, fast_passwords):
    # user has old password and is changing to new password, but used wrong old password
    old_password = random_hex()
    new_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value="wrong password"),
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_USERNAME_OR_PASSWORD

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePassword_normal_no_password(db, fast_passwords):
    # user has old password and is changing to new password, but didn't supply old password
    old_password = random_hex()
    new_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PASSWORD

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePassword_normal_no_passwords(db, fast_passwords):
    # user has old password and called with empty body
    old_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(account_pb2.ChangePasswordReq())
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_BOTH_PASSWORDS

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePassword_add(db, fast_passwords):
    # user does not have an old password and is adding a new password
    new_password = random_hex()
    user, token = generate_user(hashed_password=None)

    with account_session(token) as account:
        with patch("couchers.servicers.account.send_password_changed_email") as mock:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        mock.assert_called_once()

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(new_password)


def test_ChangePassword_add_with_password(db, fast_passwords):
    # user does not have an old password and is adding a new password, but supplied a password
    new_password = random_hex()
    user, token = generate_user(hashed_password=None)

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value="wrong password"),
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.NO_PASSWORD

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert not updated_user.has_password


def test_ChangePassword_add_no_passwords(db, fast_passwords):
    # user does not have an old password and called with empty body
    user, token = generate_user(hashed_password=None)

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(account_pb2.ChangePasswordReq())
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_BOTH_PASSWORDS

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == None


def test_ChangePassword_remove(db, fast_passwords):
    old_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with patch("couchers.servicers.account.send_password_changed_email") as mock:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value=old_password),
                )
            )
        mock.assert_called_once()

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert not updated_user.has_password


def test_ChangePassword_remove_wrong_password(db, fast_passwords):
    old_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value="wrong password"),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_USERNAME_OR_PASSWORD

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangeEmail_wrong_password(db, fast_passwords):
    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangeEmail(
                account_pb2.ChangeEmailReq(
                    password=wrappers_pb2.StringValue(value="wrong password"),
                    new_email=new_email,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_USERNAME_OR_PASSWORD

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(User)
                .where(User.new_email_token_created <= func.now())
                .where(User.new_email_token_expiry >= func.now())
            )
        ).scalar_one() == 0


def test_ChangeEmail_wrong_email(db, fast_passwords):
    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangeEmail(
                account_pb2.ChangeEmailReq(
                    password=wrappers_pb2.StringValue(value="wrong password"),
                    new_email=new_email,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_USERNAME_OR_PASSWORD

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(User)
                .where(User.new_email_token_created <= func.now())
                .where(User.new_email_token_expiry >= func.now())
            )
        ).scalar_one() == 0


def test_ChangeEmail_invalid_email(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangeEmail(
                account_pb2.ChangeEmailReq(
                    password=wrappers_pb2.StringValue(value=password),
                    new_email="not a real email",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_EMAIL

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(User)
                .where(User.new_email_token_created <= func.now())
                .where(User.new_email_token_expiry >= func.now())
            )
        ).scalar_one() == 0


def test_ChangeEmail_email_in_use(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))
    user2, token2 = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangeEmail(
                account_pb2.ChangeEmailReq(
                    password=wrappers_pb2.StringValue(value=password),
                    new_email=user2.email,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_EMAIL

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(User)
                .where(User.new_email_token_created <= func.now())
                .where(User.new_email_token_expiry >= func.now())
            )
        ).scalar_one() == 0


def test_ChangeEmail_no_change(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangeEmail(
                account_pb2.ChangeEmailReq(
                    password=wrappers_pb2.StringValue(value=password),
                    new_email=user.email,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_EMAIL

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(User)
                .where(User.new_email_token_created <= func.now())
                .where(User.new_email_token_expiry >= func.now())
            )
        ).scalar_one() == 0


def test_ChangeEmail_wrong_token(db, fast_passwords):
    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=None)

    with account_session(token) as account:
        account.ChangeEmail(
            account_pb2.ChangeEmailReq(
                new_email=new_email,
            )
        )

    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            res = auth_api.ConfirmChangeEmail(
                auth_pb2.ConfirmChangeEmailReq(
                    change_email_token="wrongtoken",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.INVALID_TOKEN

    with session_scope() as session:
        user_updated = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user_updated.email == user.email


def test_ChangeEmail_tokens_two_hour_window(db):
    def two_hours_one_minute_in_future():
        return now() + timedelta(hours=2, minutes=1)

    def one_minute_ago():
        return now() - timedelta(minutes=1)

    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=None)

    with account_session(token) as account:
        account.ChangeEmail(
            account_pb2.ChangeEmailReq(
                new_email=new_email,
            )
        )

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        old_email_token = user.old_email_token
        new_email_token = user.new_email_token

    with patch("couchers.servicers.auth.now", one_minute_ago):
        with auth_api_session() as (auth_api, metadata_interceptor):
            with pytest.raises(grpc.RpcError) as e:
                auth_api.ConfirmChangeEmail(
                    auth_pb2.ConfirmChangeEmailReq(
                        change_email_token=old_email_token,
                    )
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == errors.INVALID_TOKEN

            with pytest.raises(grpc.RpcError) as e:
                auth_api.ConfirmChangeEmail(
                    auth_pb2.ConfirmChangeEmailReq(
                        change_email_token=new_email_token,
                    )
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == errors.INVALID_TOKEN

    with patch("couchers.servicers.auth.now", two_hours_one_minute_in_future):
        with auth_api_session() as (auth_api, metadata_interceptor):
            with pytest.raises(grpc.RpcError) as e:
                auth_api.ConfirmChangeEmail(
                    auth_pb2.ConfirmChangeEmailReq(
                        change_email_token=old_email_token,
                    )
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == errors.INVALID_TOKEN

            with pytest.raises(grpc.RpcError) as e:
                auth_api.ConfirmChangeEmail(
                    auth_pb2.ConfirmChangeEmailReq(
                        change_email_token=new_email_token,
                    )
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == errors.INVALID_TOKEN


def test_ChangeEmail_has_password(db, fast_passwords):
    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        account.ChangeEmail(
            account_pb2.ChangeEmailReq(
                password=wrappers_pb2.StringValue(value=password),
                new_email=new_email,
            )
        )

    with session_scope() as session:
        user_updated = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user_updated.email == user.email
        assert user_updated.new_email == new_email
        assert user_updated.old_email_token is None
        assert not user_updated.old_email_token_created
        assert not user_updated.old_email_token_expiry
        assert not user_updated.need_to_confirm_via_old_email
        assert user_updated.new_email_token is not None
        assert user_updated.new_email_token_created <= now()
        assert user_updated.new_email_token_expiry >= now()
        assert user_updated.need_to_confirm_via_new_email

        token = user_updated.new_email_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.ConfirmChangeEmail(
            auth_pb2.ConfirmChangeEmailReq(
                change_email_token=token,
            )
        )
        assert res.state == auth_pb2.EMAIL_CONFIRMATION_STATE_SUCCESS

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user.email == new_email
        assert user.new_email is None
        assert user.old_email_token is None
        assert user.old_email_token_created is None
        assert user.old_email_token_expiry is None
        assert not user.need_to_confirm_via_old_email
        assert user.new_email_token is None
        assert user.new_email_token_created is None
        assert user.new_email_token_expiry is None
        assert not user.need_to_confirm_via_new_email


def test_ChangeEmail_no_password_confirm_with_old_email_first(db):
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=None)

    with account_session(token) as account:
        account.ChangeEmail(
            account_pb2.ChangeEmailReq(
                new_email=new_email,
            )
        )

    with session_scope() as session:
        user_updated = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user_updated.email == user.email
        assert user_updated.new_email == new_email
        assert user_updated.old_email_token is not None
        assert user_updated.old_email_token_created <= now()
        assert user_updated.old_email_token_expiry >= now()
        assert user_updated.need_to_confirm_via_old_email
        assert user_updated.new_email_token is not None
        assert user_updated.new_email_token_created <= now()
        assert user_updated.new_email_token_expiry >= now()
        assert user_updated.need_to_confirm_via_new_email

        token = user_updated.old_email_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.ConfirmChangeEmail(
            auth_pb2.ConfirmChangeEmailReq(
                change_email_token=token,
            )
        )
        assert res.state == auth_pb2.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_NEW_EMAIL

    with session_scope() as session:
        user_updated = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user_updated.email == user.email
        assert user_updated.new_email == new_email
        assert user_updated.old_email_token is None
        assert user_updated.old_email_token_created is None
        assert user_updated.old_email_token_expiry is None
        assert not user_updated.need_to_confirm_via_old_email
        assert user_updated.new_email_token is not None
        assert user_updated.new_email_token_created <= now()
        assert user_updated.new_email_token_expiry >= now()
        assert user_updated.need_to_confirm_via_new_email

        token = user_updated.new_email_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.ConfirmChangeEmail(
            auth_pb2.ConfirmChangeEmailReq(
                change_email_token=token,
            )
        )
        assert res.state == auth_pb2.EMAIL_CONFIRMATION_STATE_SUCCESS

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user.email == new_email
        assert user.new_email is None
        assert user.old_email_token is None
        assert user.old_email_token_created is None
        assert user.old_email_token_expiry is None
        assert not user.need_to_confirm_via_old_email
        assert user.new_email_token is None
        assert user.new_email_token_created is None
        assert user.new_email_token_expiry is None
        assert not user.need_to_confirm_via_new_email


def test_ChangeEmail_no_password_confirm_with_new_email_first(db):
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=None)

    with account_session(token) as account:
        account.ChangeEmail(
            account_pb2.ChangeEmailReq(
                new_email=new_email,
            )
        )

    with session_scope() as session:
        user_updated = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user_updated.email == user.email
        assert user_updated.new_email == new_email
        assert user_updated.old_email_token is not None
        assert user_updated.old_email_token_created <= now()
        assert user_updated.old_email_token_expiry >= now()
        assert user_updated.need_to_confirm_via_old_email
        assert user_updated.new_email_token is not None
        assert user_updated.new_email_token_created <= now()
        assert user_updated.new_email_token_expiry >= now()
        assert user_updated.need_to_confirm_via_new_email

        token = user_updated.new_email_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.ConfirmChangeEmail(
            auth_pb2.ConfirmChangeEmailReq(
                change_email_token=token,
            )
        )
        assert res.state == auth_pb2.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_OLD_EMAIL

    with session_scope() as session:
        user_updated = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user_updated.email == user.email
        assert user_updated.new_email == new_email
        assert user_updated.old_email_token is not None
        assert user_updated.old_email_token_created <= now()
        assert user_updated.old_email_token_expiry >= now()
        assert user_updated.need_to_confirm_via_old_email
        assert user_updated.new_email_token is None
        assert user_updated.new_email_token_created is None
        assert user_updated.new_email_token_expiry is None
        assert not user_updated.need_to_confirm_via_new_email

        token = user_updated.old_email_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.ConfirmChangeEmail(
            auth_pb2.ConfirmChangeEmailReq(
                change_email_token=token,
            )
        )
        assert res.state == auth_pb2.EMAIL_CONFIRMATION_STATE_SUCCESS

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user.email == new_email
        assert user.new_email is None
        assert user.old_email_token is None
        assert user.old_email_token_created is None
        assert user.old_email_token_expiry is None
        assert not user.need_to_confirm_via_old_email
        assert user.new_email_token is None
        assert user.new_email_token_created is None
        assert user.new_email_token_expiry is None
        assert not user.need_to_confirm_via_new_email


def test_ChangeEmail_sends_proper_emails_has_password(db, fast_passwords):
    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        account.ChangeEmail(
            account_pb2.ChangeEmailReq(
                password=wrappers_pb2.StringValue(value=password),
                new_email=new_email,
            )
        )

    with session_scope() as session:
        jobs = (
            session.execute(select(BackgroundJob).where(BackgroundJob.job_type == BackgroundJobType.send_email))
            .scalars()
            .all()
        )
        assert len(jobs) == 2
        payload_for_notification_email = jobs[0].payload
        payload_for_confirmation_email_new_address = jobs[1].payload
        unique_string_notification_email_as_bytes = b"You requested that your email on Couchers.org be changed to"
        unique_string_for_confirmation_email_new_email_address_as_bytes = (
            b"You requested that your email be changed to this email address on Couchers.org"
        )
        assert unique_string_notification_email_as_bytes in payload_for_notification_email
        assert (
            unique_string_for_confirmation_email_new_email_address_as_bytes
            in payload_for_confirmation_email_new_address
        )


def test_ChangeEmail_sends_proper_emails_no_password(db):
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=None)

    with account_session(token) as account:
        account.ChangeEmail(
            account_pb2.ChangeEmailReq(
                new_email=new_email,
            )
        )

    with session_scope() as session:
        jobs = (
            session.execute(select(BackgroundJob).where(BackgroundJob.job_type == BackgroundJobType.send_email))
            .scalars()
            .all()
        )
        assert len(jobs) == 2
        payload_for_confirmation_email_old_address = jobs[0].payload
        payload_for_confirmation_email_new_address = jobs[1].payload
        unique_string_for_confirmation_email_old_address_as_bytes = (
            b"You requested that your email be changed on Couchers.org"
        )
        unique_string_for_confirmation_email_new_email_address_as_bytes = (
            b"You requested that your email be changed to this email address on Couchers.org"
        )
        assert unique_string_for_confirmation_email_old_address_as_bytes in payload_for_confirmation_email_old_address
        assert (
            unique_string_for_confirmation_email_new_email_address_as_bytes
            in payload_for_confirmation_email_new_address
        )


def test_contributor_form(db):
    user, token = generate_user()

    with account_session(token) as account:
        res = account.GetContributorFormInfo(empty_pb2.Empty())
        assert not res.filled_contributor_form
        assert res.username == user.username
        assert res.name == user.name
        assert res.email == user.email
        assert res.age == user.age
        assert res.gender == user.gender
        assert res.location == user.city

        account.MarkContributorFormFilled(account_pb2.MarkContributorFormFilledReq(filled_contributor_form=True))

        res = account.GetContributorFormInfo(empty_pb2.Empty())
        assert res.filled_contributor_form
        assert res.username == user.username
        assert res.name == user.name
        assert res.email == user.email
        assert res.age == user.age
        assert res.gender == user.gender
        assert res.location == user.city

        account.MarkContributorFormFilled(account_pb2.MarkContributorFormFilledReq(filled_contributor_form=False))

        res = account.GetContributorFormInfo(empty_pb2.Empty())
        assert not res.filled_contributor_form
        assert res.username == user.username
        assert res.name == user.name
        assert res.email == user.email
        assert res.age == user.age
        assert res.gender == user.gender
        assert res.location == user.city


def test_RequestAccountDeletion(db):
    user, token = generate_user()

    with session_scope() as session:
        old_deletion_token = AccountDeletionToken(token="hello", user_id=user.id)
        session.add(old_deletion_token)
        old_token = old_deletion_token.token

    with account_session(token) as account:
        # Check the right email is sent
        with patch("couchers.email.queue_email") as mock:
            account.RequestAccountDeletion(account_pb2.RequestAccountDeletionReq(reason=None))
        mock.assert_called_once()
        (_, _, _, subject, _, _), _ = mock.call_args
        assert subject == "Confirm your Couchers.org account deletion"

    with session_scope() as session:
        deletion_token = session.execute(
            select(AccountDeletionToken).where(AccountDeletionToken.user_id == user.id)
        ).scalar_one()
        # first two asserts also imply created <= now() expiry >= now()
        assert deletion_token.is_valid == True
        assert deletion_token.end_time_to_recover < now()
        assert deletion_token.token != old_token
        assert not session.execute(select(User).where(User.id == user.id)).scalar_one().is_deleted


def test_RequestAccountDeletion_message_storage(db):
    user, token = generate_user()

    with account_session(token) as account:
        account.RequestAccountDeletion(account_pb2.RequestAccountDeletionReq(reason=None))
        account.RequestAccountDeletion(account_pb2.RequestAccountDeletionReq(reason=""))
        account.RequestAccountDeletion(account_pb2.RequestAccountDeletionReq(reason="Reason"))  # 1
        account.RequestAccountDeletion(account_pb2.RequestAccountDeletionReq(reason="0192#(&!&#)*@//)(8"))
        account.RequestAccountDeletion(account_pb2.RequestAccountDeletionReq(reason="0192#(&!&#)*@//)(8Reason"))  # 2

    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(ReasonForDeletion)).scalar_one() == 2


def test_DeleteAccount(db):
    user, token = generate_user()

    with session_scope() as session:
        deletion_token = AccountDeletionToken(token="hello", user_id=user.id)
        session.add(deletion_token)

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.DeleteAccount(
                account_pb2.DeleteAccountReq(
                    token="wrongtoken",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.INVALID_TOKEN

        # Check the right email is sent
        with patch("couchers.email.queue_email") as mock:
            res = account.DeleteAccount(
                account_pb2.DeleteAccountReq(
                    token="hello",
                )
            )
        mock.assert_called_once()
        (_, _, _, subject, _, _), _ = mock.call_args
        assert res.success
        assert subject == "Your Couchers.org account will be deleted in 48 hours"

    with session_scope() as session:
        assert session.execute(select(User).where(User.id == user.id)).scalar_one().is_deleted
        assert (
            session.execute(select(AccountDeletionToken).where(AccountDeletionToken.user_id == user.id))
            .scalar_one()
            .end_time_to_recover
            >= now()
        )


def test_AccountRecovery(db):
    user, token = generate_user(make_invisible=True)
    user_no_pass, token_no_pass = generate_user(hashed_password=None, make_invisible=True)

    with session_scope() as session:
        session.add(AccountDeletionToken(token="token", user_id=user.id))
        session.add(
            AccountDeletionToken(
                token="new_token", user_id=user_no_pass.id, end_time_to_recover=now() + timedelta(hours=48)
            )
        )

    with account_session(token) as account:
        # Fails b/c end_time_to_recover has passed (default at creation is now())
        with pytest.raises(grpc.RpcError) as e:
            account.RecoverAccount(
                account_pb2.RecoverAccountReq(
                    token="token",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.INVALID_TOKEN

    with session_scope() as session:
        account_deletion_token = session.execute(
            select(AccountDeletionToken).where(AccountDeletionToken.token == "token")
        ).scalar_one()
        account_deletion_token.end_time_to_recover = now() + timedelta(hours=48)

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.RecoverAccount(
                account_pb2.RecoverAccountReq(
                    token="wrongtoken",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.INVALID_TOKEN

        with pytest.raises(grpc.RpcError) as e:
            account.RecoverAccount(account_pb2.RecoverAccountReq(token="token", password="wrongpassword"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.INVALID_USERNAME_OR_PASSWORD

        # test correct email is sent
        with patch("couchers.email.queue_email") as mock:
            res = account.RecoverAccount(account_pb2.RecoverAccountReq(token="token", password="password"))
        mock.assert_called_once()
        (_, _, _, subject, _, _), _ = mock.call_args
        assert subject == "Your Couchers.org account has been recovered"

    with session_scope() as session:
        assert res.success
        assert not session.execute(select(User).where(User.id == user.id)).scalar_one().is_deleted

    # test for user without password
    res = account.RecoverAccount(account_pb2.RecoverAccountReq(token="new_token"))
    with session_scope() as session:
        assert res.success
        assert not session.execute(select(User).where(User.id == user_no_pass.id)).scalar_one().is_deleted
