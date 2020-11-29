from datetime import timedelta
from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2

from couchers import errors
from couchers.crypto import hash_password, random_hex
from couchers.db import session_scope
from couchers.models import User
from pb import account_pb2
from tests.test_fixtures import account_session, db, fast_passwords, generate_user, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_ChangePassword_normal(db, fast_passwords):
    # user has old password and is changing to new password
    old_password = random_hex()
    new_password = random_hex()

    user, token = generate_user(db, hashed_password=hash_password(old_password))

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.send_password_changed_email") as mock:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value=old_password),
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        mock.assert_called_once()

    with session_scope(db) as session:
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password == hash_password(new_password)


def test_ChangePassword_normal_wrong_password(db, fast_passwords):
    # user has old password and is changing to new password, but used wrong old password
    old_password = random_hex()
    new_password = random_hex()

    user, token = generate_user(db, hashed_password=hash_password(old_password))

    with account_session(db, token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value="wrong password"),
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_USERNAME_OR_PASSWORD

    with session_scope(db) as session:
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePassword_normal_no_password(db, fast_passwords):
    # user has old password and is changing to new password, but didn't supply old password
    old_password = random_hex()
    new_password = random_hex()

    user, token = generate_user(db, hashed_password=hash_password(old_password))

    with account_session(db, token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PASSWORD

    with session_scope(db) as session:
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePassword_normal_no_passwords(db, fast_passwords):
    # user has old password and called with empty body
    old_password = random_hex()

    user, token = generate_user(db, hashed_password=hash_password(old_password))

    with account_session(db, token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(account_pb2.ChangePasswordReq())
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_BOTH_PASSWORDS

    with session_scope(db) as session:
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePassword_add(db, fast_passwords):
    # user does not have an old password and is adding a new password
    new_password = random_hex()

    user, token = generate_user(db, hashed_password=None)

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.send_password_changed_email") as mock:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        mock.assert_called_once()

    with session_scope(db) as session:
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password == hash_password(new_password)


def test_ChangePassword_add_with_password(db, fast_passwords):
    # user does not have an old password and is adding a new password, but supplied a password
    new_password = random_hex()

    user, token = generate_user(db, hashed_password=None)

    with account_session(db, token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value="wrong password"),
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.NO_PASSWORD

    with session_scope(db) as session:
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password == None


def test_ChangePassword_add_no_passwords(db, fast_passwords):
    # user does not have an old password and called with empty body
    user, token = generate_user(db, hashed_password=None)

    with account_session(db, token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(account_pb2.ChangePasswordReq())
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_BOTH_PASSWORDS

    with session_scope(db) as session:
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password == None


def test_ChangePassword_remove(db, fast_passwords):
    old_password = random_hex()

    user, token = generate_user(db, hashed_password=hash_password(old_password))

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.send_password_changed_email") as mock:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value=old_password),
                )
            )
        mock.assert_called_once()

    with session_scope(db) as session:
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password is None


def test_ChangePassword_remove_wrong_password(db, fast_passwords):
    old_password = random_hex()

    user, token = generate_user(db, hashed_password=hash_password(old_password))

    with account_session(db, token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value="wrong password"),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.INVALID_USERNAME_OR_PASSWORD

    with session_scope(db) as session:
        updated_user = session.query(User).filter(User.id == user.id).one()
        assert updated_user.hashed_password == hash_password(old_password)
