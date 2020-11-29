from datetime import timedelta
from unittest.mock import create_autospec, patch

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2

from couchers import errors
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models import User
from pb import account_pb2
from tests.test_fixtures import account_session, db, generate_user_for_session, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


# password hashing, by design, takes a lot of time, which slows down the tests. here we jump through some hoops to
# make this fast by replacing the hashing algo with sha256
def dummy_verify_password(hashed, password):
    return hashed == password.encode("utf8")


def dummy_hash_password(password):
    return password.encode("utf8")


def test_ChangePassword_normal(db):
    # user has old password and is changing to new password
    old_password = random_hex()
    new_password = random_hex()

    with session_scope(db) as session:
        user, token = generate_user_for_session(session, db)
        user.hashed_password = dummy_hash_password(old_password)
        session.commit()
        user_id = user.id

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.verify_password", dummy_verify_password) as patched_verify_password:
            with patch("couchers.servicers.account.hash_password", dummy_hash_password) as patched_hash_password:
                with patch("couchers.servicers.account.send_password_changed_email") as mock:
                    account.ChangePassword(
                        account_pb2.ChangePasswordReq(
                            old_password=wrappers_pb2.StringValue(value=old_password),
                            new_password=wrappers_pb2.StringValue(value=new_password),
                        )
                    )

                mock.assert_called_once()

    with session_scope(db) as session:
        user = session.query(User).filter(User.id == user_id).one()
        assert user.hashed_password == dummy_hash_password(new_password)


def test_ChangePassword_normal_wrong_password(db):
    # user has old password and is changing to new password, but used wrong old password
    old_password = random_hex()
    new_password = random_hex()

    with session_scope(db) as session:
        user, token = generate_user_for_session(session, db)
        user.hashed_password = dummy_hash_password(old_password)
        session.commit()
        user_id = user.id

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.verify_password", dummy_verify_password) as patched_verify_password:
            with patch("couchers.servicers.account.hash_password", dummy_hash_password) as patched_hash_password:
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
        user = session.query(User).filter(User.id == user_id).one()
        assert user.hashed_password == dummy_hash_password(old_password)


def test_ChangePassword_normal_no_password(db):
    # user has old password and is changing to new password, but didn't supply old password
    old_password = random_hex()
    new_password = random_hex()

    with session_scope(db) as session:
        user, token = generate_user_for_session(session, db)
        user.hashed_password = dummy_hash_password(old_password)
        session.commit()
        user_id = user.id

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.verify_password", dummy_verify_password) as patched_verify_password:
            with patch("couchers.servicers.account.hash_password", dummy_hash_password) as patched_hash_password:
                with pytest.raises(grpc.RpcError) as e:
                    account.ChangePassword(
                        account_pb2.ChangePasswordReq(
                            new_password=wrappers_pb2.StringValue(value=new_password),
                        )
                    )
                assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
                assert e.value.details() == errors.MISSING_PASSWORD

    with session_scope(db) as session:
        user = session.query(User).filter(User.id == user_id).one()
        assert user.hashed_password == dummy_hash_password(old_password)


def test_ChangePassword_normal_no_passwords(db):
    # user has old password and called with empty body
    old_password = random_hex()

    with session_scope(db) as session:
        user, token = generate_user_for_session(session, db)
        user.hashed_password = dummy_hash_password(old_password)
        session.commit()
        user_id = user.id

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.verify_password", dummy_verify_password) as patched_verify_password:
            with patch("couchers.servicers.account.hash_password", dummy_hash_password) as patched_hash_password:
                with pytest.raises(grpc.RpcError) as e:
                    account.ChangePassword(account_pb2.ChangePasswordReq())
                assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
                assert e.value.details() == errors.MISSING_BOTH_PASSWORDS

    with session_scope(db) as session:
        user = session.query(User).filter(User.id == user_id).one()
        assert user.hashed_password == dummy_hash_password(old_password)


def test_ChangePassword_add(db):
    # user does not have an old password and is adding a new password
    new_password = random_hex()

    with session_scope(db) as session:
        user, token = generate_user_for_session(session, db)
        user.hashed_password = None
        session.commit()
        user_id = user.id

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.verify_password", dummy_verify_password) as patched_verify_password:
            with patch("couchers.servicers.account.hash_password", dummy_hash_password) as patched_hash_password:
                with patch("couchers.servicers.account.send_password_changed_email") as mock:
                    account.ChangePassword(
                        account_pb2.ChangePasswordReq(
                            new_password=wrappers_pb2.StringValue(value=new_password),
                        )
                    )
                mock.assert_called_once()

    with session_scope(db) as session:
        user = session.query(User).filter(User.id == user_id).one()
        assert user.hashed_password == dummy_hash_password(new_password)


def test_ChangePassword_add_with_password(db):
    # user does not have an old password and is adding a new password, but supplied a password
    new_password = random_hex()

    with session_scope(db) as session:
        user, token = generate_user_for_session(session, db)
        user.hashed_password = None
        session.commit()
        user_id = user.id

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.verify_password", dummy_verify_password) as patched_verify_password:
            with patch("couchers.servicers.account.hash_password", dummy_hash_password) as patched_hash_password:
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
        user = session.query(User).filter(User.id == user_id).one()
        assert user.hashed_password == None


def test_ChangePassword_add_no_passwords(db):
    # user does not have an old password and called with empty body
    with session_scope(db) as session:
        user, token = generate_user_for_session(session, db)
        user.hashed_password = None
        session.commit()
        user_id = user.id

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.verify_password", dummy_verify_password) as patched_verify_password:
            with patch("couchers.servicers.account.hash_password", dummy_hash_password) as patched_hash_password:
                with pytest.raises(grpc.RpcError) as e:
                    account.ChangePassword(account_pb2.ChangePasswordReq())
                assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
                assert e.value.details() == errors.MISSING_BOTH_PASSWORDS

    with session_scope(db) as session:
        user = session.query(User).filter(User.id == user_id).one()
        assert user.hashed_password == None


def test_ChangePassword_remove(db):
    old_password = random_hex()

    with session_scope(db) as session:
        user, token = generate_user_for_session(session, db)
        user.hashed_password = dummy_hash_password(old_password)
        session.commit()
        user_id = user.id

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.verify_password", dummy_verify_password) as patched_verify_password:
            with patch("couchers.servicers.account.hash_password", dummy_hash_password) as patched_hash_password:
                with patch("couchers.servicers.account.send_password_changed_email") as mock:
                    account.ChangePassword(
                        account_pb2.ChangePasswordReq(
                            old_password=wrappers_pb2.StringValue(value=old_password),
                        )
                    )
                mock.assert_called_once()

    with session_scope(db) as session:
        user = session.query(User).filter(User.id == user_id).one()
        assert user.hashed_password is None


def test_ChangePassword_remove_wrong_password(db):
    old_password = random_hex()

    with session_scope(db) as session:
        user, token = generate_user_for_session(session, db)
        user.hashed_password = dummy_hash_password(old_password)
        session.commit()
        user_id = user.id

    with account_session(db, token) as account:
        with patch("couchers.servicers.account.verify_password", dummy_verify_password) as patched_verify_password:
            with patch("couchers.servicers.account.hash_password", dummy_hash_password) as patched_hash_password:
                with pytest.raises(grpc.RpcError) as e:
                    account.ChangePassword(
                        account_pb2.ChangePasswordReq(
                            old_password=wrappers_pb2.StringValue(value="wrong password"),
                        )
                    )
                assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
                assert e.value.details() == errors.INVALID_USERNAME_OR_PASSWORD

    with session_scope(db) as session:
        user = session.query(User).filter(User.id == user_id).one()
        assert user.hashed_password == dummy_hash_password(old_password)
