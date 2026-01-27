from datetime import UTC, date, datetime, timedelta
from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy import select, update
from sqlalchemy.sql import func

from couchers import urls
from couchers.crypto import hash_password, random_hex
from couchers.db import session_scope
from couchers.materialized_views import refresh_materialized_views_rapid
from couchers.models import (
    AccountDeletionReason,
    AccountDeletionToken,
    BackgroundJob,
    InviteCode,
    PhotoGalleryItem,
    Upload,
    User,
)
from couchers.proto import account_pb2, api_pb2, auth_pb2, conversations_pb2, requests_pb2
from couchers.utils import now, today
from tests.fixtures.db import generate_user, make_volunteer
from tests.fixtures.misc import PushCollector, email_fields, mock_notification_email, process_jobs
from tests.fixtures.sessions import (
    account_session,
    auth_api_session,
    public_session,
    real_account_session,
    requests_session,
)
from tests.test_requests import valid_request_text


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_GetAccountInfo(db, fast_passwords):
    # with password
    user1, token1 = generate_user(hashed_password=hash_password(random_hex()), email="user@couchers.invalid")

    with account_session(token1) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.email == "user@couchers.invalid"
        assert res.username == user1.username
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_UNVERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_UNVERIFIED
        assert not res.is_superuser
        assert res.ui_language_preference == ""
        assert not res.is_volunteer


def test_donation_banner_no_drive(db):
    """Test that the banner is not shown when DONATION_DRIVE_START is None"""
    # User has donated, but the drive is disabled, so the banner should not show
    user, token = generate_user()

    with patch("couchers.servicers.account.DONATION_DRIVE_START", None):
        with account_session(token) as account:
            res = account.GetAccountInfo(empty_pb2.Empty())
            assert not res.should_show_donation_banner


def test_donation_banner_never_donated(db):
    """Test that banner is shown when user has never donated and drive is active"""
    drive_start = datetime(2025, 11, 1, tzinfo=UTC)

    # Explicitly set last_donated=None since generate_user defaults to now()
    user, token = generate_user(last_donated=None)

    with patch("couchers.servicers.account.DONATION_DRIVE_START", drive_start):
        with account_session(token) as account:
            res = account.GetAccountInfo(empty_pb2.Empty())
            assert res.should_show_donation_banner


def test_donation_banner_donated_before_drive(db):
    """Test that banner is shown when user donated before drive start"""
    drive_start = datetime(2025, 11, 1, tzinfo=UTC)

    user, token = generate_user()

    # Set donation before drive start
    with session_scope() as session:
        last_donated = datetime(2025, 10, 15, tzinfo=UTC)  # Before Nov 1
        session.execute(update(User).where(User.id == user.id).values(last_donated=last_donated))

    with patch("couchers.servicers.account.DONATION_DRIVE_START", drive_start):
        with account_session(token) as account:
            res = account.GetAccountInfo(empty_pb2.Empty())
            assert res.should_show_donation_banner


def test_donation_banner_donated_after_drive(db):
    """Test that banner is not shown when user donated after drive start"""
    drive_start = datetime(2025, 11, 1, tzinfo=UTC)

    user, token = generate_user()

    # Set donation after drive start
    with session_scope() as session:
        last_donated = datetime(2025, 11, 15, tzinfo=UTC)  # After Nov 1
        session.execute(update(User).where(User.id == user.id).values(last_donated=last_donated))

    with patch("couchers.servicers.account.DONATION_DRIVE_START", drive_start):
        with account_session(token) as account:
            res = account.GetAccountInfo(empty_pb2.Empty())
            assert not res.should_show_donation_banner


def test_donation_banner_donated_exactly_at_drive_start(db):
    """Test that banner is not shown when user donated exactly at drive start time"""
    drive_start = datetime(2025, 11, 1, tzinfo=UTC)

    user, token = generate_user()

    # Set donation exactly at drive start
    with session_scope() as session:
        session.execute(update(User).where(User.id == user.id).values(last_donated=drive_start))

    with patch("couchers.servicers.account.DONATION_DRIVE_START", drive_start):
        with account_session(token) as account:
            res = account.GetAccountInfo(empty_pb2.Empty())
            assert not res.should_show_donation_banner


def test_GetAccountInfo_regression(db):
    # there was a bug in evaluating `has_completed_profile` on the backend (in python)
    # when about_me is None but the user has a key, it was failing because len(about_me) doesn't work on None
    user, token = generate_user(about_me=None, complete_profile=False)

    # add an avatar photo to the user's profile gallery
    with session_scope() as session:
        key = random_hex(32)
        filename = random_hex(32) + ".jpg"
        session.add(
            Upload(
                key=key,
                filename=filename,
                creator_user_id=user.id,
            )
        )
        session.flush()
        session.add(
            PhotoGalleryItem(
                gallery_id=user.profile_gallery_id,
                upload_key=key,
                position=0,
            )
        )

    with account_session(token) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())


def test_ChangePasswordV2_normal(db, fast_passwords, push_collector: PushCollector):
    # user has old password and is changing to new password
    old_password = random_hex()
    new_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with mock_notification_email() as mock:
            account.ChangePasswordV2(
                account_pb2.ChangePasswordV2Req(
                    old_password=old_password,
                    new_password=new_password,
                )
            )

    mock.assert_called_once()
    assert email_fields(mock).subject == "[TEST] Your password was changed"

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Password changed"
    assert push.content.body == "Your password was changed."

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(new_password)


def test_ChangePasswordV2_regression(db, fast_passwords):
    # send_password_changed_email wasn't working
    # user has old password and is changing to new password
    old_password = random_hex()
    new_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        account.ChangePasswordV2(
            account_pb2.ChangePasswordV2Req(
                old_password=old_password,
                new_password=new_password,
            )
        )

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(new_password)


def test_ChangePasswordV2_normal_short_password(db, fast_passwords):
    # user has old password and is changing to new password, but used short password
    old_password = random_hex()
    new_password = random_hex(length=1)
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePasswordV2(
                account_pb2.ChangePasswordV2Req(
                    old_password=old_password,
                    new_password=new_password,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The password must be 8 or more characters long."

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePasswordV2_normal_long_password(db, fast_passwords):
    # user has old password and is changing to new password, but used short password
    old_password = random_hex()
    new_password = random_hex(length=1000)
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePasswordV2(
                account_pb2.ChangePasswordV2Req(
                    old_password=old_password,
                    new_password=new_password,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The password must be less than 256 characters."

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePasswordV2_normal_insecure_password(db, fast_passwords):
    # user has old password and is changing to new password, but used insecure password
    old_password = random_hex()
    new_password = "12345678"
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePasswordV2(
                account_pb2.ChangePasswordV2Req(
                    old_password=old_password,
                    new_password=new_password,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The password is insecure. Please use one that is not easily guessable."

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePasswordV2_normal_wrong_password(db, fast_passwords):
    # user has old password and is changing to new password, but used wrong old password
    old_password = random_hex()
    new_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePasswordV2(
                account_pb2.ChangePasswordV2Req(
                    old_password="wrong password",
                    new_password=new_password,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Wrong password."

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangePasswordV2_normal_no_passwords(db, fast_passwords):
    # user has old password and called with empty body
    old_password = random_hex()
    user, token = generate_user(hashed_password=hash_password(old_password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePasswordV2(account_pb2.ChangePasswordV2Req(old_password=old_password))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The password must be 8 or more characters long."

    with session_scope() as session:
        updated_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert updated_user.hashed_password == hash_password(old_password)


def test_ChangeEmailV2_wrong_password(db, fast_passwords):
    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangeEmailV2(
                account_pb2.ChangeEmailV2Req(
                    password="wrong password",
                    new_email=new_email,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Wrong password."

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(User)
                .where(User.new_email_token_created <= func.now())
                .where(User.new_email_token_expiry >= func.now())
            )
        ).scalar_one() == 0


def test_ChangeEmailV2_wrong_email(db, fast_passwords):
    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangeEmailV2(
                account_pb2.ChangeEmailV2Req(
                    password="wrong password",
                    new_email=new_email,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Wrong password."

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(User)
                .where(User.new_email_token_created <= func.now())
                .where(User.new_email_token_expiry >= func.now())
            )
        ).scalar_one() == 0


def test_ChangeEmailV2_invalid_email(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangeEmailV2(
                account_pb2.ChangeEmailV2Req(
                    password=password,
                    new_email="not a real email",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid email."

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(User)
                .where(User.new_email_token_created <= func.now())
                .where(User.new_email_token_expiry >= func.now())
            )
        ).scalar_one() == 0


def test_ChangeEmailV2_email_in_use(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))
    user2, token2 = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangeEmailV2(
                account_pb2.ChangeEmailV2Req(
                    password=password,
                    new_email=user2.email,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid email."

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(User)
                .where(User.new_email_token_created <= func.now())
                .where(User.new_email_token_expiry >= func.now())
            )
        ).scalar_one() == 0


def test_ChangeEmailV2_no_change(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangeEmailV2(
                account_pb2.ChangeEmailV2Req(
                    password=password,
                    new_email=user.email,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid email."

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(User)
                .where(User.new_email_token_created <= func.now())
                .where(User.new_email_token_expiry >= func.now())
            )
        ).scalar_one() == 0


def test_ChangeEmailV2_wrong_token(db, fast_passwords):
    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        account.ChangeEmailV2(
            account_pb2.ChangeEmailV2Req(
                password=password,
                new_email=new_email,
            )
        )

    with auth_api_session() as (auth_api, metadata_interceptor):
        with pytest.raises(grpc.RpcError) as e:
            res = auth_api.ConfirmChangeEmailV2(
                auth_pb2.ConfirmChangeEmailV2Req(
                    change_email_token="wrongtoken",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Invalid token."

    with session_scope() as session:
        user_updated = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user_updated.email == user.email


def test_ChangeEmailV2_tokens_two_hour_window(db):
    def two_hours_one_minute_in_future():
        return now() + timedelta(hours=2, minutes=1)

    def one_minute_ago():
        return now() - timedelta(minutes=1)

    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        account.ChangeEmailV2(
            account_pb2.ChangeEmailV2Req(
                password=password,
                new_email=new_email,
            )
        )

    with session_scope() as session:
        new_email_token = session.execute(select(User.new_email_token).where(User.id == user.id)).scalar_one()

    with patch("couchers.servicers.auth.now", one_minute_ago):
        with auth_api_session() as (auth_api, metadata_interceptor):
            with pytest.raises(grpc.RpcError) as e:
                auth_api.ConfirmChangeEmailV2(auth_pb2.ConfirmChangeEmailV2Req())
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == "Invalid token."

            with pytest.raises(grpc.RpcError) as e:
                auth_api.ConfirmChangeEmailV2(
                    auth_pb2.ConfirmChangeEmailV2Req(
                        change_email_token=new_email_token,
                    )
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == "Invalid token."

    with patch("couchers.servicers.auth.now", two_hours_one_minute_in_future):
        with auth_api_session() as (auth_api, metadata_interceptor):
            with pytest.raises(grpc.RpcError) as e:
                auth_api.ConfirmChangeEmailV2(auth_pb2.ConfirmChangeEmailV2Req())
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == "Invalid token."

            with pytest.raises(grpc.RpcError) as e:
                auth_api.ConfirmChangeEmailV2(
                    auth_pb2.ConfirmChangeEmailV2Req(
                        change_email_token=new_email_token,
                    )
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == "Invalid token."


def test_ChangeEmailV2(db, fast_passwords, push_collector: PushCollector):
    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=hash_password(password))
    user_id = user.id

    with account_session(token) as account:
        account.ChangeEmailV2(
            account_pb2.ChangeEmailV2Req(
                password=password,
                new_email=new_email,
            )
        )

    with session_scope() as session:
        user_updated = session.execute(select(User).where(User.id == user_id)).scalar_one()
        assert user_updated.email == user.email
        assert user_updated.new_email == new_email
        assert user_updated.new_email_token is not None
        assert user_updated.new_email_token_created
        assert user_updated.new_email_token_created <= now()
        assert user_updated.new_email_token_expiry
        assert user_updated.new_email_token_expiry >= now()

        token = user_updated.new_email_token

    process_jobs()
    push = push_collector.pop_for_user(user_id, last=True)
    assert push.content.title == "Email change requested"
    assert push.content.body == f"Use the link we sent to {new_email} to confirm your new address."

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.ConfirmChangeEmailV2(
            auth_pb2.ConfirmChangeEmailV2Req(
                change_email_token=token,
            )
        )

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == user_id)).scalar_one()
        assert user.email == new_email
        assert user.new_email is None
        assert user.new_email_token is None
        assert user.new_email_token_created is None
        assert user.new_email_token_expiry is None

    process_jobs()
    push = push_collector.pop_for_user(user_id, last=True)
    assert push.content.title == "Email verified"
    assert push.content.body == "Your new email address has been verified."


def test_ChangeEmailV2_sends_proper_emails(db, fast_passwords, push_collector: PushCollector):
    password = random_hex()
    new_email = f"{random_hex()}@couchers.org.invalid"
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        account.ChangeEmailV2(
            account_pb2.ChangeEmailV2Req(
                password=password,
                new_email=new_email,
            )
        )

    process_jobs()

    with session_scope() as session:
        jobs = session.execute(select(BackgroundJob).where(BackgroundJob.job_type == "send_email")).scalars().all()
        assert len(jobs) == 2
        uq_str1 = b"An email change to the email"
        uq_str2 = (
            b"You requested that your email be changed to this email address on Couchers.org. Your old email address is"
        )
        assert (uq_str1 in jobs[0].payload and uq_str2 in jobs[1].payload) or (
            uq_str2 in jobs[0].payload and uq_str1 in jobs[1].payload
        )

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Email change requested"
    assert push.content.body == f"Use the link we sent to {new_email} to confirm your new address."


def test_ChangeLanguagePreference(db, fast_passwords):
    # user changes from default to ISO 639-1 language code
    new_lang = "zh"
    user, token = generate_user()

    with real_account_session(token) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.ui_language_preference == ""

        # call will have info about the request
        res, call = account.ChangeLanguagePreference.with_call(
            account_pb2.ChangeLanguagePreferenceReq(ui_language_preference=new_lang)
        )

        # cookies are sent via initial metadata, so we check for it there
        # the value of "set-cookie" will be the full cookie string, pull the key value from the string
        cookie_values = [v.split(";")[0] for k, v in call.initial_metadata() if k == "set-cookie"]
        assert any(val == "NEXT_LOCALE=zh" for val in cookie_values), (
            f"Didn't find the right cookie, got {call.initial_metadata()}"
        )

        # the changed language preference should also be sent to the backend
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.ui_language_preference == "zh"


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
        deletion_token: AccountDeletionToken = session.execute(
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


def test_full_delete_account_with_recovery(db, push_collector: PushCollector):
    user, token = generate_user()
    user_id = user.id

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as err:
            account.DeleteAccount(account_pb2.DeleteAccountReq())
        assert err.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert err.value.details() == "Please confirm your account deletion."

        # Check the right email is sent
        with mock_notification_email() as mock:
            account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True))

    push = push_collector.pop_for_user(user_id, last=True)
    assert push.content.title == "Account deletion requested"
    assert push.content.body == "Use the link we emailed you to confirm."

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

    push = push_collector.pop_for_user(user_id, last=True)
    assert push.content.title == "Account deleted"
    assert push.content.body == "You can restore it within 7 days using the link we emailed you."

    mock.assert_called_once()
    e = email_fields(mock)

    with session_scope() as session:
        assert not session.execute(select(AccountDeletionToken)).scalar_one_or_none()

        user_ = session.execute(select(User).where(User.id == user_id)).scalar_one()
        assert user_.is_deleted
        assert user_.undelete_token
        assert user_.undelete_until
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

    push = push_collector.pop_for_user(user_id, last=True)
    assert push.content.title == "Account restored"
    assert push.content.body == "Welcome back!"

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
        token = session.execute(select(AccountDeletionToken.token).limit(1)).scalar_one()

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.ConfirmDeleteAccount(
            auth_pb2.ConfirmDeleteAccountReq(
                token=token,
            )
        )

    with session_scope() as session:
        assert not session.execute(select(AccountDeletionToken.token)).scalar_one_or_none()


def test_ListActiveSessions_pagination(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))

    with real_account_session(token) as account:
        res = account.ListActiveSessions(account_pb2.ListActiveSessionsReq(page_size=3))
        assert len(res.active_sessions) == 3
        res = account.ListActiveSessions(account_pb2.ListActiveSessionsReq(page_token=res.next_page_token, page_size=3))
        assert len(res.active_sessions) == 2
        assert not res.next_page_token


def test_ListActiveSessions_details(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))

    ips_user_agents = [
        (
            "108.123.33.162",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
        ),
        (
            "8.245.212.28",
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
        ),
        (
            "95.254.140.156",
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
        ),
    ]

    for ip, user_agent in ips_user_agents:
        options = (("grpc.primary_user_agent", user_agent),)
        with auth_api_session(grpc_channel_options=options) as (auth_api, metadata_interceptor):
            auth_api.Authenticate(
                auth_pb2.AuthReq(user=user.username, password=password), metadata=(("x-couchers-real-ip", ip),)
            )

    def dummy_geoip(ip_address):
        return {
            "108.123.33.162": "Chicago, United States",
            "8.245.212.28": "Sydney, Australia",
        }.get(ip_address)

    with real_account_session(token) as account:
        with patch("couchers.servicers.account.geoip_approximate_location", dummy_geoip):
            res = account.ListActiveSessions(account_pb2.ListActiveSessionsReq())
            print(res)
        assert len(res.active_sessions) == 4

        # this one currently making the API call
        assert res.active_sessions[0].operating_system == "Other"
        assert res.active_sessions[0].browser == "Other"
        assert res.active_sessions[0].device == "Other"
        assert res.active_sessions[0].approximate_location == "Unknown"
        assert res.active_sessions[0].is_current_session

        assert res.active_sessions[1].operating_system == "Ubuntu"
        assert res.active_sessions[1].browser == "Firefox"
        assert res.active_sessions[1].device == "Other"
        assert res.active_sessions[1].approximate_location == "Unknown"
        assert not res.active_sessions[1].is_current_session

        assert res.active_sessions[2].operating_system == "Android"
        assert res.active_sessions[2].browser == "Samsung Internet"
        assert res.active_sessions[2].device == "K"
        assert res.active_sessions[2].approximate_location == "Sydney, Australia"
        assert not res.active_sessions[2].is_current_session

        assert res.active_sessions[3].operating_system == "iOS"
        assert res.active_sessions[3].browser == "Mobile Safari"
        assert res.active_sessions[3].device == "iPhone"
        assert res.active_sessions[3].approximate_location == "Chicago, United States"
        assert not res.active_sessions[3].is_current_session


def test_LogOutSession(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))

    with real_account_session(token) as account:
        res = account.ListActiveSessions(account_pb2.ListActiveSessionsReq())
        assert len(res.active_sessions) == 5
        account.LogOutSession(account_pb2.LogOutSessionReq(created=res.active_sessions[3].created))

        res2 = account.ListActiveSessions(account_pb2.ListActiveSessionsReq())
        assert len(res2.active_sessions) == 4

        # ignore the first session as it changes
        assert res.active_sessions[1:3] + res.active_sessions[4:] == res2.active_sessions[1:]


def test_LogOutOtherSessions(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))
        auth_api.Authenticate(auth_pb2.AuthReq(user=user.username, password=password))

    with real_account_session(token) as account:
        res = account.ListActiveSessions(account_pb2.ListActiveSessionsReq())
        assert len(res.active_sessions) == 5
        with pytest.raises(grpc.RpcError) as e:
            account.LogOutOtherSessions(account_pb2.LogOutOtherSessionsReq(confirm=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "Please confirm you want to log out of other sessions."

        account.LogOutOtherSessions(account_pb2.LogOutOtherSessionsReq(confirm=True))
        res = account.ListActiveSessions(account_pb2.ListActiveSessionsReq())
        assert len(res.active_sessions) == 1


def test_CreateInviteCode(db):
    user, token = generate_user()

    with account_session(token) as account:
        res = account.CreateInviteCode(account_pb2.CreateInviteCodeReq())
        code = res.code
        assert len(code) == 8

    with session_scope() as session:
        invite = session.execute(select(InviteCode).where(InviteCode.id == code)).scalar_one()
        assert invite.creator_user_id == user.id
        assert invite.disabled is None
        assert res.url == urls.invite_code_link(code=res.code)


def test_DisableInviteCode(db):
    user, token = generate_user()

    with account_session(token) as account:
        code = account.CreateInviteCode(account_pb2.CreateInviteCodeReq()).code
        account.DisableInviteCode(account_pb2.DisableInviteCodeReq(code=code))

    with session_scope() as session:
        invite = session.execute(select(InviteCode).where(InviteCode.id == code)).scalar_one()
        assert invite.disabled is not None


def test_ListInviteCodes(db):
    user, token = generate_user()
    another_user, _ = generate_user()

    with account_session(token) as account:
        code = account.CreateInviteCode(account_pb2.CreateInviteCodeReq()).code

    # simulate another_user having signed up with this invite code
    with session_scope() as session:
        session.execute(update(User).where(User.id == another_user.id).values(invite_code_id=code))

    with account_session(token) as account:
        res = account.ListInviteCodes(empty_pb2.Empty())
        assert len(res.invite_codes) == 1
        assert res.invite_codes[0].code == code
        assert res.invite_codes[0].uses == 1
        assert res.invite_codes[0].url == urls.invite_code_link(code=code)


def test_reminders(db, moderator):
    # the strong verification reminder's absence is tested in test_strong_verification.py
    # reference writing reminders tested in test_AvailableWriteReferences_and_ListPendingReferencesToWrite
    # we use LiteUser, so remember to refresh materialized views
    user, token = generate_user(complete_profile=False)
    complete_user, complete_token = generate_user(complete_profile=True)
    req_user1, req_user_token1 = generate_user(complete_profile=True)
    req_user2, req_user_token2 = generate_user(complete_profile=True)

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with account_session(complete_token) as account:
        assert [reminder.WhichOneof("reminder") for reminder in account.GetReminders(empty_pb2.Empty()).reminders] == [
            "complete_verification_reminder"
        ]
    with account_session(token) as account:
        assert [reminder.WhichOneof("reminder") for reminder in account.GetReminders(empty_pb2.Empty()).reminders] == [
            "complete_profile_reminder",
            "complete_verification_reminder",
        ]

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    with requests_session(req_user_token1) as api:
        host_request1_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text("Test request 1"),
            )
        ).host_request_id
    moderator.approve_host_request(host_request1_id)

    with account_session(token) as account:
        reminders = account.GetReminders(empty_pb2.Empty()).reminders
        assert [reminder.WhichOneof("reminder") for reminder in reminders] == [
            "respond_to_host_request_reminder",
            "complete_profile_reminder",
            "complete_verification_reminder",
        ]
        assert reminders[0].respond_to_host_request_reminder.host_request_id == host_request1_id
        assert reminders[0].respond_to_host_request_reminder.surfer_user.user_id == req_user1.id

    with requests_session(req_user_token2) as api:
        host_request2_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text("Test request 2"),
            )
        ).host_request_id
    moderator.approve_host_request(host_request2_id)

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with account_session(token) as account:
        reminders = account.GetReminders(empty_pb2.Empty()).reminders
        assert [reminder.WhichOneof("reminder") for reminder in reminders] == [
            "respond_to_host_request_reminder",
            "respond_to_host_request_reminder",
            "complete_profile_reminder",
            "complete_verification_reminder",
        ]
        assert reminders[0].respond_to_host_request_reminder.host_request_id == host_request1_id
        assert reminders[0].respond_to_host_request_reminder.surfer_user.user_id == req_user1.id
        assert reminders[1].respond_to_host_request_reminder.host_request_id == host_request2_id
        assert reminders[1].respond_to_host_request_reminder.surfer_user.user_id == req_user2.id

    with requests_session(req_user_token1) as api:
        host_request3_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text("Test request 3"),
            )
        ).host_request_id
    moderator.approve_host_request(host_request3_id)

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with account_session(token) as account:
        reminders = account.GetReminders(empty_pb2.Empty()).reminders
        assert [reminder.WhichOneof("reminder") for reminder in reminders] == [
            "respond_to_host_request_reminder",
            "respond_to_host_request_reminder",
            "respond_to_host_request_reminder",
            "complete_profile_reminder",
            "complete_verification_reminder",
        ]
        assert reminders[0].respond_to_host_request_reminder.host_request_id == host_request1_id
        assert reminders[0].respond_to_host_request_reminder.surfer_user.user_id == req_user1.id
        assert reminders[1].respond_to_host_request_reminder.host_request_id == host_request2_id
        assert reminders[1].respond_to_host_request_reminder.surfer_user.user_id == req_user2.id
        assert reminders[2].respond_to_host_request_reminder.host_request_id == host_request3_id
        assert reminders[2].respond_to_host_request_reminder.surfer_user.user_id == req_user1.id

    # accept req
    with requests_session(token) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request1_id, status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
            )
        )

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with account_session(token) as account:
        reminders = account.GetReminders(empty_pb2.Empty()).reminders
        assert [reminder.WhichOneof("reminder") for reminder in reminders] == [
            "respond_to_host_request_reminder",
            "respond_to_host_request_reminder",
            "complete_profile_reminder",
            "complete_verification_reminder",
        ]
        assert reminders[0].respond_to_host_request_reminder.host_request_id == host_request2_id
        assert reminders[0].respond_to_host_request_reminder.surfer_user.user_id == req_user2.id
        assert reminders[1].respond_to_host_request_reminder.host_request_id == host_request3_id
        assert reminders[1].respond_to_host_request_reminder.surfer_user.user_id == req_user1.id


def test_volunteer_stuff(db):
    # taken from couchers/app/backend/resources/badges.json
    board_member_id = 8347

    # with password
    user, token = generate_user(name="Von Tester", username="tester", city="Amsterdam", id=board_member_id)

    with account_session(token) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert not res.is_volunteer

        with pytest.raises(grpc.RpcError) as e:
            account.GetMyVolunteerInfo(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert (
            e.value.details() == "You are currently not registered as a volunteer, if this is wrong, please contact us."
        )

        with pytest.raises(grpc.RpcError) as e:
            account.UpdateMyVolunteerInfo(account_pb2.UpdateMyVolunteerInfoReq())
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert (
            e.value.details() == "You are currently not registered as a volunteer, if this is wrong, please contact us."
        )

    with session_scope() as session:
        session.add(
            make_volunteer(
                user_id=user.id,
                display_name="Great Volunteer",
                display_location="The Bitbucket",
                role="Lead Tester",
                started_volunteering=date(2020, 6, 1),
            )
        )

    with account_session(token) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.is_volunteer

        res = account.GetMyVolunteerInfo(empty_pb2.Empty())

        assert res.display_name == "Great Volunteer"
        assert res.display_location == "The Bitbucket"
        assert res.role == "Lead Tester"
        assert res.started_volunteering == "2020-06-01"
        assert not res.stopped_volunteering
        assert res.show_on_team_page
        assert res.link_type == "couchers"
        assert res.link_text == "@tester"
        assert res.link_url == "http://localhost:3000/user/tester"

        res = account.UpdateMyVolunteerInfo(
            account_pb2.UpdateMyVolunteerInfoReq(
                display_name=wrappers_pb2.StringValue(value=""),
                link_type=wrappers_pb2.StringValue(value="website"),
                link_text=wrappers_pb2.StringValue(value="testervontester.com.invalid"),
                link_url=wrappers_pb2.StringValue(value="https://www.testervontester.com.invalid/"),
            )
        )

        assert res.display_name == ""
        assert res.display_location == "The Bitbucket"
        assert res.role == "Lead Tester"
        assert res.started_volunteering == "2020-06-01"
        assert not res.stopped_volunteering
        assert res.show_on_team_page
        assert res.link_type == "website"
        assert res.link_text == "testervontester.com.invalid"
        assert res.link_url == "https://www.testervontester.com.invalid/"
        res = account.UpdateMyVolunteerInfo(
            account_pb2.UpdateMyVolunteerInfoReq(
                display_name=wrappers_pb2.StringValue(value=""),
                link_type=wrappers_pb2.StringValue(value="linkedin"),
                link_text=wrappers_pb2.StringValue(value="tester-vontester"),
            )
        )
        assert res.display_name == ""
        assert res.display_location == "The Bitbucket"
        assert res.role == "Lead Tester"
        assert res.started_volunteering == "2020-06-01"
        assert not res.stopped_volunteering
        assert res.show_on_team_page
        assert res.link_type == "linkedin"
        assert res.link_text == "tester-vontester"
        assert res.link_url == "https://www.linkedin.com/in/tester-vontester/"

        res = account.UpdateMyVolunteerInfo(
            account_pb2.UpdateMyVolunteerInfoReq(
                display_name=wrappers_pb2.StringValue(value="Tester"),
                display_location=wrappers_pb2.StringValue(value=""),
                link_type=wrappers_pb2.StringValue(value="email"),
                link_text=wrappers_pb2.StringValue(value="tester@vontester.com.invalid"),
            )
        )
        assert res.display_name == "Tester"
        assert res.display_location == ""
        assert res.role == "Lead Tester"
        assert res.started_volunteering == "2020-06-01"
        assert not res.stopped_volunteering
        assert res.show_on_team_page
        assert res.link_type == "email"
        assert res.link_text == "tester@vontester.com.invalid"
        assert res.link_url == "mailto:tester@vontester.com.invalid"

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with public_session() as public:
        res = public.GetVolunteers(empty_pb2.Empty())
        assert len(res.current_volunteers) == 1
        v = res.current_volunteers[0]
        assert v.name == "Tester"
        assert v.username == "tester"
        assert v.is_board_member
        assert v.role == "Lead Tester"
        assert v.location == "Amsterdam"
        assert v.img.startswith("http://localhost:5001/img/thumbnail/")
        assert v.link_type == "email"
        assert v.link_text == "tester@vontester.com.invalid"
        assert v.link_url == "mailto:tester@vontester.com.invalid"
