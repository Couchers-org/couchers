from datetime import timedelta
from unittest.mock import patch

import pytest

from couchers.config import config
from couchers.crypto import random_hex, urlsafe_secure_token
from couchers.db import session_scope
from couchers.models import (
    Complaint,
    Conversation,
    FriendRelationship,
    FriendStatus,
    HostRequest,
    HostRequestStatus,
    Message,
    MessageType,
    SignupFlow,
    Upload,
)
from couchers.tasks import (
    send_api_key_email,
    send_email_changed_confirmation_to_new_email,
    send_email_changed_confirmation_to_old_email,
    send_email_changed_notification_email,
    send_friend_request_accepted_email,
    send_friend_request_email,
    send_login_email,
    send_new_host_request_email,
    send_password_reset_email,
    send_report_email,
    send_signup_email,
)
from couchers.utils import now
from tests.test_fixtures import db, generate_user, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_login_email(db):
    user, api_token = generate_user()

    with session_scope() as session:
        with patch("couchers.email.queue_email") as mock:
            login_token = send_login_email(session, user)

        assert mock.call_count == 1
        (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
        assert recipient == user.email
        assert "login" in subject.lower()
        assert login_token.token in plain
        assert login_token.token in html


def test_signup_verification_email(db):
    request_email = f"{random_hex(12)}@couchers.org.invalid"

    with session_scope() as session:
        flow = SignupFlow(name="Frodo", email=request_email)

        with patch("couchers.email.queue_email") as mock:
            send_signup_email(flow)

        assert mock.call_count == 1
        (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
        assert recipient == request_email
        assert flow.email_token in plain
        assert flow.email_token in html


def test_report_email(db):
    with session_scope():
        user_author, api_token_author = generate_user()
        user_reported, api_token_reported = generate_user()

        complaint = Complaint(
            author_user=user_author, reported_user=user_reported, reason=random_hex(64), description=random_hex(256)
        )

        with patch("couchers.email.queue_email") as mock:
            send_report_email(complaint)

        assert mock.call_count == 1

        (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
        assert recipient == "reports@couchers.org.invalid"
        assert complaint.author_user.username in plain
        assert str(complaint.author_user.id) in plain
        assert complaint.author_user.email in plain
        assert complaint.author_user.username in html
        assert str(complaint.author_user.id) in html
        assert complaint.author_user.email in html
        assert complaint.reported_user.username in plain
        assert str(complaint.reported_user.id) in plain
        assert complaint.reported_user.email in plain
        assert complaint.reported_user.username in html
        assert str(complaint.reported_user.id) in html
        assert complaint.reported_user.email in html
        assert complaint.reason in plain
        assert complaint.reason in html
        assert complaint.description in plain
        assert complaint.description in html
        assert "report" in subject.lower()


def test_host_request_email(db):
    with session_scope() as session:
        host, api_token_to = generate_user()
        # little trick here to get the upload correctly without invalidating users
        key = random_hex(32)
        filename = random_hex(32) + ".jpg"
        session.add(
            Upload(
                key=key,
                filename=filename,
                creator_user_id=host.id,
            )
        )
        session.commit()
        surfer, api_token_from = generate_user(avatar_key=key)
        from_date = "2020-01-01"
        to_date = "2020-01-05"

        conversation = Conversation()
        message = Message(
            conversation=conversation,
            author_id=surfer.id,
            text=random_hex(64),
            message_type=MessageType.text,
        )

        host_request = HostRequest(
            conversation=conversation,
            surfer=surfer,
            host=host,
            from_date=from_date,
            to_date=to_date,
            status=HostRequestStatus.pending,
            surfer_last_seen_message_id=message.id,
        )

        session.add(host_request)

        with patch("couchers.email.queue_email") as mock:
            send_new_host_request_email(host_request)

        assert mock.call_count == 1
        (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
        assert recipient == host.email
        assert "host request" in subject.lower()
        assert host.name in plain
        assert host.name in html
        assert surfer.name in plain
        assert surfer.name in html
        assert from_date in plain
        assert from_date in html
        assert to_date in plain
        assert to_date in html
        assert surfer.avatar.thumbnail_url not in plain
        assert surfer.avatar.thumbnail_url in html
        assert f"{config['BASE_URL']}/messages/hosting/" in plain
        assert f"{config['BASE_URL']}/messages/hosting/" in html


def test_friend_request_email(db):
    with session_scope() as session:
        to_user, api_token_to = generate_user()
        # little trick here to get the upload correctly without invalidating users
        key = random_hex(32)
        filename = random_hex(32) + ".jpg"
        session.add(
            Upload(
                key=key,
                filename=filename,
                creator_user_id=to_user.id,
            )
        )
        session.commit()
        from_user, api_token_from = generate_user(avatar_key=key)
        friend_relationship = FriendRelationship(from_user=from_user, to_user=to_user, status=FriendStatus.pending)
        session.add(friend_relationship)

        with patch("couchers.email.queue_email") as mock:
            send_friend_request_email(friend_relationship)

        assert mock.call_count == 1
        (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
        assert recipient == to_user.email
        assert "friend" in subject.lower()
        assert to_user.name in plain
        assert to_user.name in html
        assert from_user.name in subject
        assert from_user.name in plain
        assert from_user.name in html
        assert from_user.avatar.thumbnail_url not in plain
        assert from_user.avatar.thumbnail_url in html
        assert f"{config['BASE_URL']}/connections/friends/" in plain
        assert f"{config['BASE_URL']}/connections/friends/" in html


def test_friend_request_accepted_email(db):
    with session_scope() as session:
        from_user, api_token_from = generate_user()
        to_user, api_token_to = generate_user()
        key = random_hex(32)
        filename = random_hex(32) + ".jpg"
        session.add(
            Upload(
                key=key,
                filename=filename,
                creator_user_id=from_user.id,
            )
        )
        session.commit()
        to_user, api_token_to = generate_user(avatar_key=key)
        friend_relationship = FriendRelationship(from_user=from_user, to_user=to_user, status=FriendStatus.accepted)
        session.add(friend_relationship)

        with patch("couchers.email.queue_email") as mock:
            send_friend_request_accepted_email(friend_relationship)

        assert mock.call_count == 1
        (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
        assert recipient == from_user.email
        assert "friend" in subject.lower()
        assert from_user.name in plain
        assert from_user.name in html
        assert to_user.name in subject
        assert to_user.name in plain
        assert to_user.name in html
        assert to_user.avatar.thumbnail_url not in plain
        assert to_user.avatar.thumbnail_url in html
        assert f"{config['BASE_URL']}/user/{to_user.username}" in plain
        assert f"{config['BASE_URL']}/user/{to_user.username}" in html


def test_email_patching_fails(db):
    """
    There was a problem where the mocking wasn't happening and the email dev
    printing function was called instead, this makes sure the patching is
    actually done
    """
    with session_scope() as session:
        from_user, api_token_from = generate_user()
        to_user, api_token_to = generate_user()
        friend_relationship = FriendRelationship(from_user=from_user, to_user=to_user, status=FriendStatus.pending)
        session.add(friend_relationship)

        patched_msg = random_hex(64)

        def mock_queue_email(sender_name, sender_email, recipient, subject, plain, html):
            raise Exception(patched_msg)

        with pytest.raises(Exception) as e:
            with patch("couchers.email.queue_email", mock_queue_email):
                send_friend_request_email(friend_relationship)
        assert str(e.value) == patched_msg


def test_email_changed_notification_email(db):
    user, token = generate_user()
    user.new_email = f"{random_hex(12)}@couchers.org.invalid"
    with patch("couchers.email.queue_email") as mock:
        send_email_changed_notification_email(user)

    assert mock.call_count == 1
    (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
    assert "change requested" in subject
    assert recipient == user.email
    assert user.name in plain
    assert user.name in html
    assert user.new_email in plain
    assert user.new_email in html
    assert "A confirmation was sent to that email address" in plain
    assert "A confirmation was sent to that email address" in html
    assert "support@couchers.org" in plain
    assert "support@couchers.org" in html


def test_email_changed_confirmation_sent_to_old_email(db):
    confirmation_token = urlsafe_secure_token()
    user, user_token = generate_user()
    user.new_email = f"{random_hex(12)}@couchers.org.invalid"
    user.old_email_token = confirmation_token
    with patch("couchers.email.queue_email") as mock:
        send_email_changed_confirmation_to_old_email(user)

    assert mock.call_count == 1
    (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
    assert "new email" in subject
    assert recipient == user.email
    assert user.name in plain
    assert user.name in html
    assert user.new_email in plain
    assert user.new_email in html
    assert "via a similar email sent to your new email address" in plain
    assert "via a similar email sent to your new email address" in html
    assert f"{config['BASE_URL']}/confirm-email/{confirmation_token}" in plain
    assert f"{config['BASE_URL']}/confirm-email/{confirmation_token}" in html
    assert "support@couchers.org" in plain
    assert "support@couchers.org" in html


def test_email_changed_confirmation_sent_to_new_email(db):
    confirmation_token = urlsafe_secure_token()
    user, user_token = generate_user()
    user.new_email = f"{random_hex(12)}@couchers.org.invalid"
    user.new_email_token = confirmation_token
    with patch("couchers.email.queue_email") as mock:
        send_email_changed_confirmation_to_new_email(user)

    assert mock.call_count == 1
    (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
    assert "new email" in subject
    assert recipient == user.new_email
    assert user.name in plain
    assert user.name in html
    assert user.email in plain
    assert user.email in html
    assert "via a similar email sent to your old email address" in plain
    assert "via a similar email sent to your old email address" in html
    assert f"{config['BASE_URL']}/confirm-email/{confirmation_token}" in plain
    assert f"{config['BASE_URL']}/confirm-email/{confirmation_token}" in html
    assert "support@couchers.org" in plain
    assert "support@couchers.org" in html


def test_password_reset_email(db):
    user, api_token = generate_user()

    with session_scope() as session:
        with patch("couchers.email.queue_email") as mock:
            password_reset_token = send_password_reset_email(session, user)

        assert mock.call_count == 1
        (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
        assert recipient == user.email
        assert "reset" in subject.lower()
        assert password_reset_token.token in plain
        assert password_reset_token.token in html
        unique_string = "You asked for your password to be reset on Couchers.org."
        assert unique_string in plain
        assert unique_string in html
        assert f"{config['BASE_URL']}/password-reset/{password_reset_token.token}" in plain
        assert f"{config['BASE_URL']}/password-reset/{password_reset_token.token}" in html
        assert "support@couchers.org" in plain
        assert "support@couchers.org" in html


def test_api_key_email(db):
    user, api_token = generate_user()

    token = random_hex(64)
    expiry = now() + timedelta(days=90)

    with session_scope() as session:
        with patch("couchers.email.queue_email") as mock:
            send_api_key_email(session, user, token, expiry)

        assert mock.call_count == 1
        (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
        assert recipient == user.email
        assert "api key" in subject.lower()
        assert token in plain
        assert token in html
        assert str(expiry) in plain
        assert str(expiry) in html
        unique_string = "We've issued you with the following API key:"
        assert unique_string in plain
        assert unique_string in html
        assert "support@couchers.org" in plain
        assert "support@couchers.org" in html
