from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy.sql import func

from couchers import errors
from couchers.crypto import hash_password, random_hex
from couchers.db import session_scope
from couchers.models import User
from pb import account_pb2, auth_pb2
from tests.test_fixtures import account_session, auth_api_session, db, fast_passwords, generate_user, testconfig


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

    # with password
    user1, token1 = generate_user(hashed_password=hash_password(random_hex()), email="user@couchers.invalid")

    with account_session(token1) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.login_method == account_pb2.GetAccountInfoRes.LoginMethod.PASSWORD
        assert res.has_password
        assert res.email == "user@couchers.invalid"


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
        updated_user = session.query(User).filter(User.id == user.id).one()
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
        updated_user = session.query(User).filter(User.id == user.id).one()
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
        updated_user = session.query(User).filter(User.id == user.id).one()
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
        updated_user = session.query(User).filter(User.id == user.id).one()
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
        updated_user = session.query(User).filter(User.id == user.id).one()
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
        updated_user = session.query(User).filter(User.id == user.id).one()
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
        updated_user = session.query(User).filter(User.id == user.id).one()
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
        updated_user = session.query(User).filter(User.id == user.id).one()
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
        updated_user = session.query(User).filter(User.id == user.id).one()
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
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password == None


def test_ChangePassword_add_no_passwords(db, fast_passwords):
    # user does not have an old password and called with empty body
    user, token = generate_user(hashed_password=None)

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(account_pb2.ChangePasswordReq())
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_BOTH_PASSWORDS

    with session_scope() as session:
        updated_user = session.query(User).filter(User.id == user.id).one()
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
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password is None


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
        updated_user = session.query(User).filter(User.id == user.id).one()
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
            session.query(User)
            .filter(User.new_email_token_created <= func.now())
            .filter(User.new_email_token_expiry >= func.now())
        ).count() == 0


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
            session.query(User)
            .filter(User.new_email_token_created <= func.now())
            .filter(User.new_email_token_expiry >= func.now())
        ).count() == 0


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
            session.query(User)
            .filter(User.new_email_token_created <= func.now())
            .filter(User.new_email_token_expiry >= func.now())
        ).count() == 0


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
            session.query(User)
            .filter(User.new_email_token_created <= func.now())
            .filter(User.new_email_token_expiry >= func.now())
        ).count() == 0


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
            session.query(User)
            .filter(User.new_email_token_created <= func.now())
            .filter(User.new_email_token_expiry >= func.now())
        ).count() == 0


def test_ChangeEmail_wrong_token(db, fast_passwords):
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
        user_updated = (
            session.query(User)
            .filter(User.id == user.id)
            .filter(User.new_email == new_email)
            .filter(User.new_email_token_created <= func.now())
            .filter(User.new_email_token_expiry >= func.now())
        ).one()

        token = user_updated.new_email_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            res = auth_api.CompleteChangeEmail(
                auth_pb2.CompleteChangeEmailReq(
                    change_email_token="wrongtoken",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.INVALID_TOKEN

    with session_scope() as session:
        user_updated2 = session.query(User).filter(User.id == user.id).one()
        assert user_updated2.email == user.email


def test_ChangeEmail(db, fast_passwords):
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
        user_updated = (
            session.query(User)
            .filter(User.id == user.id)
            .filter(User.new_email == new_email)
            .filter(User.new_email_token_created <= func.now())
            .filter(User.new_email_token_expiry >= func.now())
        ).one()

        token = user_updated.new_email_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.CompleteChangeEmail(
            auth_pb2.CompleteChangeEmailReq(
                change_email_token=token,
            )
        )

    with session_scope() as session:
        user_updated2 = session.query(User).filter(User.id == user.id).one()
        assert user_updated2.email == new_email
        assert user_updated2.new_email is None
        assert user_updated2.new_email_token is None

    # check there's no valid tokens left
    with session_scope() as session:
        assert (
            session.query(User)
            .filter(User.new_email_token_created <= func.now())
            .filter(User.new_email_token_expiry >= func.now())
        ).count() == 0


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
