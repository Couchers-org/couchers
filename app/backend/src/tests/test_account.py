from datetime import timedelta
from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy.sql import func

from couchers import errors
from couchers.crypto import hash_password, random_hex
from couchers.db import session_scope
from couchers.models import AccountDeletionReason, AccountDeletionToken, BackgroundJob, Upload, User
from couchers.sql import couchers_select as select
from couchers.utils import now
from proto import account_pb2, api_pb2, auth_pb2
from tests.test_fixtures import (  # noqa
    account_session,
    auth_api_session,
    db,
    email_fields,
    fast_passwords,
    generate_user,
    mock_notification_email,
    process_jobs,
    push_collector,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_GetAccountInfo(db, fast_passwords):
    # with password
    user1, token1 = generate_user(hashed_password=hash_password(random_hex()), email="user@couchers.invalid")

    with account_session(token1) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.login_method == account_pb2.GetAccountInfoRes.LoginMethod.PASSWORD
        assert res.has_password
        assert res.email == "user@couchers.invalid"
        assert res.username == user1.username
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_UNVERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_UNVERIFIED


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


def test_ChangePassword_normal(db, fast_passwords, push_collector):
    # user has old password and is changing to new password
    old_password = random_hex()
    new_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with mock_notification_email() as mock:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value=old_password),
                    new_password=wrappers_pb2.StringValue(value=new_password),
                )
            )

    mock.assert_called_once()
    assert email_fields(mock).subject == "[TEST] Your password was changed"

    push_collector.assert_user_has_single_matching(
        user.id, title="Your password was changed", body="Your login password for Couchers.org was changed."
    )

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


def test_ChangePassword_remove(db, fast_passwords):
    old_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with mock_notification_email() as mock:
            account.ChangePassword(
                account_pb2.ChangePasswordReq(
                    old_password=wrappers_pb2.StringValue(value=old_password),
                )
            )
        mock.assert_called_once()
        assert email_fields(mock).subject == "[TEST] Your password was changed"

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
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        account.ChangeEmail(
            account_pb2.ChangeEmailReq(
                password=wrappers_pb2.StringValue(value=password),
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


def test_ChangeEmail_sends_proper_emails_has_password(db, fast_passwords, push_collector):
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

    process_jobs()

    with session_scope() as session:
        jobs = session.execute(select(BackgroundJob).where(BackgroundJob.job_type == "send_email")).scalars().all()
        assert len(jobs) == 2
        payload_for_notification_email = jobs[0].payload
        payload_for_confirmation_email_new_address = jobs[1].payload
        uq_str1 = b"An email change to the email"
        uq_str2 = (
            b"You requested that your email be changed to this email address on Couchers.org. Your old email address is"
        )
        assert (uq_str1 in jobs[0].payload and uq_str2 in jobs[1].payload) or (
            uq_str2 in jobs[0].payload and uq_str1 in jobs[1].payload
        )

    push_collector.assert_user_has_single_matching(
        user.id,
        title="An email change was initiated on your account",
        body=f"An email change to the email {new_email} was initiated on your account.",
    )


def test_contributor_form(db):
    user, token = generate_user()

    with account_session(token) as account:
        res = account.GetContributorFormInfo(empty_pb2.Empty())
        assert not res.filled_contributor_form

        account.FillContributorForm(account_pb2.FillContributorFormReq(contributor_form=auth_pb2.ContributorForm()))

        res = account.GetContributorFormInfo(empty_pb2.Empty())
        assert res.filled_contributor_form


def test_DeleteAccount_start(db):
    user, token = generate_user()

    with account_session(token) as account:
        with mock_notification_email() as mock:
            account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True, reason=None))
        mock.assert_called_once()
        assert email_fields(mock).subject == "[TEST] Confirm your Couchers.org account deletion"

    with session_scope() as session:
        deletion_token = session.execute(
            select(AccountDeletionToken).where(AccountDeletionToken.user_id == user.id)
        ).scalar_one()

        assert deletion_token.is_valid
        assert not session.execute(select(User).where(User.id == user.id)).scalar_one().is_deleted


def test_DeleteAccount_message_storage(db):
    user, token = generate_user()

    with account_session(token) as account:
        account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True, reason=None))  # not stored
        account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True, reason=""))  # not stored
        account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True, reason="Reason"))
        account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True, reason="0192#(&!&#)*@//)(8"))
        account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True, reason="\n\n\t"))  # not stored
        account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True, reason="1337"))

    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(AccountDeletionReason)).scalar_one() == 3


def test_full_delete_account_with_recovery(db, push_collector):
    user, token = generate_user()
    user_id = user.id

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.DeleteAccount(account_pb2.DeleteAccountReq())
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.MUST_CONFIRM_ACCOUNT_DELETE

        # Check the right email is sent
        with mock_notification_email() as mock:
            account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True))

    push_collector.assert_user_push_matches_fields(
        user_id,
        ix=0,
        title="Account deletion initiated",
        body="Someone initiated the deletion of your Couchers.org account. To delete your account, please follow the link in the email we sent you.",
    )

    mock.assert_called_once()
    e = email_fields(mock)

    with session_scope() as session:
        token_o = session.execute(select(AccountDeletionToken)).scalar_one()
        token = token_o.token

        user_ = session.execute(select(User).where(User.id == user_id)).scalar_one()
        assert token_o.user == user_
        assert not user_.is_deleted
        assert not user_.undelete_token
        assert not user_.undelete_until

    assert email_fields(mock).subject == "[TEST] Confirm your Couchers.org account deletion"
    assert e.recipient == user.email
    assert "account deletion" in e.subject.lower()
    assert token in e.plain
    assert token in e.html
    unique_string = "You requested that we delete your account from Couchers.org."
    assert unique_string in e.plain
    assert unique_string in e.html
    url = f"http://localhost:3000/delete-account?token={token}"
    assert url in e.plain
    assert url in e.html
    assert "support@couchers.org" in e.plain
    assert "support@couchers.org" in e.html

    with mock_notification_email() as mock:
        with auth_api_session() as (auth_api, metadata_interceptor):
            auth_api.ConfirmDeleteAccount(
                auth_pb2.ConfirmDeleteAccountReq(
                    token=token,
                )
            )

    push_collector.assert_user_push_matches_fields(
        user_id,
        ix=1,
        title="Your Couchers.org account has been deleted",
        body="You can still undo this by following the link we emailed to you within 7 days.",
    )

    mock.assert_called_once()
    e = email_fields(mock)

    with session_scope() as session:
        assert not session.execute(select(AccountDeletionToken)).scalar_one_or_none()

        user_ = session.execute(select(User).where(User.id == user_id)).scalar_one()
        assert user_.is_deleted
        assert user_.undelete_token
        assert user_.undelete_until > now()

        undelete_token = user_.undelete_token

    assert e.recipient == user.email
    assert "account has been deleted" in e.subject.lower()
    unique_string = "You have successfully deleted your account from Couchers.org."
    assert unique_string in e.plain
    assert unique_string in e.html
    assert "7 days" in e.plain
    assert "7 days" in e.html
    url = f"http://localhost:3000/recover-account?token={undelete_token}"
    assert url in e.plain
    assert url in e.html
    assert "support@couchers.org" in e.plain
    assert "support@couchers.org" in e.html

    with mock_notification_email() as mock:
        with auth_api_session() as (auth_api, metadata_interceptor):
            auth_api.RecoverAccount(
                auth_pb2.RecoverAccountReq(
                    token=undelete_token,
                )
            )

    push_collector.assert_user_push_matches_fields(
        user_id,
        ix=2,
        title="Your Couchers.org account has been recovered!",
        body="We have recovered your Couchers.org account as per your request! Welcome back!",
    )

    mock.assert_called_once()
    e = email_fields(mock)

    assert e.recipient == user.email
    assert "account has been recovered" in e.subject.lower()
    unique_string = "Your account on Couchers.org has been successfully recovered!"
    assert unique_string in e.plain
    assert unique_string in e.html
    assert "support@couchers.org" in e.plain
    assert "support@couchers.org" in e.html

    with session_scope() as session:
        assert not session.execute(select(AccountDeletionToken)).scalar_one_or_none()

        user = session.execute(select(User).where(User.id == user_id)).scalar_one()
        assert not user.is_deleted
        assert not user.undelete_token
        assert not user.undelete_until


def test_multiple_delete_tokens(db):
    """
    Make sure deletion tokens are deleted on delete
    """
    user, token = generate_user()

    with account_session(token) as account:
        account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True))
        account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True))
        account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True))

    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(AccountDeletionToken)).scalar_one() == 3
        token = session.execute(select(AccountDeletionToken)).scalars().first().token

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.ConfirmDeleteAccount(
            auth_pb2.ConfirmDeleteAccountReq(
                token=token,
            )
        )

    with session_scope() as session:
        assert not session.execute(select(AccountDeletionToken)).scalar_one_or_none()
