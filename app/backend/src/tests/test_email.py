from unittest.mock import patch

import pytest

import couchers.email
import couchers.jobs.handlers
from couchers.config import config
from couchers.crypto import random_hex, urlsafe_secure_token
from couchers.db import session_scope
from couchers.models import (
    ContentReport,
    Email,
    FriendRelationship,
    FriendStatus,
    Reference,
    ReferenceType,
    SignupFlow,
    User,
)
from couchers.notifications.notify import notify
from couchers.sql import couchers_select as select
from couchers.tasks import (
    maybe_send_reference_report_email,
    send_content_report_email,
    send_email_changed_confirmation_to_new_email,
    send_email_changed_confirmation_to_old_email,
    send_email_changed_notification_email,
    send_login_email,
    send_signup_email,
)
from proto import api_pb2, notification_data_pb2, notifications_pb2
from tests.test_fixtures import (  # noqa
    api_session,
    db,
    email_fields,
    generate_user,
    handle_notifications_bg,
    mock_notification_email,
    notifications_session,
    push_collector,
    session_scope,
    testconfig,
)


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
        user_reporter, api_token_author = generate_user()
        user_author, api_token_reported = generate_user()

        report = ContentReport(
            reporting_user=user_reporter,
            reason="spam",
            description="I think this is spam and does not belong on couchers",
            content_ref="comment/123",
            author_user=user_author,
            user_agent="n/a",
            page="https://couchers.org/comment/123",
        )

        with patch("couchers.email.queue_email") as mock:
            send_content_report_email(report)

        assert mock.call_count == 1

        (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
        assert recipient == "reports@couchers.org.invalid"
        assert report.author_user.username in plain
        assert str(report.author_user.id) in plain
        assert report.author_user.email in plain
        assert report.author_user.username in html
        assert str(report.author_user.id) in html
        assert report.author_user.email in html
        assert report.reporting_user.username in plain
        assert str(report.reporting_user.id) in plain
        assert report.reporting_user.email in plain
        assert report.reporting_user.username in html
        assert str(report.reporting_user.id) in html
        assert report.reporting_user.email in html
        assert report.reason in plain
        assert report.reason in html
        assert report.description in plain
        assert report.description in html
        assert "report" in subject.lower()


def test_reference_report_email_not_sent(db):
    with session_scope() as session:
        from_user, api_token_author = generate_user()
        to_user, api_token_reported = generate_user()

        friend_relationship = FriendRelationship(from_user=from_user, to_user=to_user, status=FriendStatus.accepted)
        session.add(friend_relationship)
        session.flush()

        reference = Reference(
            from_user=from_user,
            to_user=to_user,
            reference_type=ReferenceType.friend,
            text="This person was very nice to me.",
            rating=0.9,
            was_appropriate=True,
        )

        # no email sent for a positive ref

        with patch("couchers.email.queue_email") as mock:
            maybe_send_reference_report_email(reference)

        assert mock.call_count == 0


def test_reference_report_email(db):
    with session_scope() as session:
        from_user, api_token_author = generate_user()
        to_user, api_token_reported = generate_user()

        friend_relationship = FriendRelationship(from_user=from_user, to_user=to_user, status=FriendStatus.accepted)
        session.add(friend_relationship)
        session.flush()

        reference = Reference(
            from_user=from_user,
            to_user=to_user,
            reference_type=ReferenceType.friend,
            text="This person was not nice to me.",
            rating=0.3,
            was_appropriate=False,
        )

        with patch("couchers.email.queue_email") as mock:
            maybe_send_reference_report_email(reference)

        assert mock.call_count == 1

        (sender_name, sender_email, recipient, subject, plain, html), _ = mock.call_args
        assert recipient == "reports@couchers.org.invalid"
        assert "report" in subject.lower()
        assert "reference" in subject.lower()
        assert reference.from_user.username in plain
        assert str(reference.from_user.id) in plain
        assert reference.from_user.email in plain
        assert reference.from_user.username in html
        assert str(reference.from_user.id) in html
        assert reference.from_user.email in html
        assert reference.to_user.username in plain
        assert str(reference.to_user.id) in plain
        assert reference.to_user.email in plain
        assert reference.to_user.username in html
        assert str(reference.to_user.id) in html
        assert reference.to_user.email in html
        assert reference.text in plain
        assert reference.text in html
        assert "friend" in plain.lower()
        assert "friend" in html.lower()


def test_email_patching_fails(db):
    """
    There was a problem where the mocking wasn't happening and the email dev
    printing function was called instead, this makes sure the patching is
    actually done
    """
    with session_scope() as session:
        to_user, to_token = generate_user()
        from_user, from_token = generate_user()

        patched_msg = random_hex(64)

        def mock_queue_email(**kwargs):
            raise Exception(patched_msg)

        with patch("couchers.notifications.background.queue_email", mock_queue_email) as mock:
            with pytest.raises(Exception) as e:
                with api_session(from_token) as api:
                    api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=to_user.id))
                handle_notifications_bg()

        assert str(e.value) == patched_msg


def test_email_changed_notification_email(db):
    user, token = generate_user()
    user.new_email = f"{random_hex(12)}@couchers.org.invalid"
    with patch("couchers.templates.v2.queue_email") as mock:
        send_email_changed_notification_email(user)

    assert mock.call_count == 1
    _, kwargs = mock.call_args
    assert "change requested" in kwargs["subject"]
    assert kwargs["recipient"] == user.email
    assert user.name in kwargs["plain"]
    assert user.name in kwargs["html"]
    assert user.new_email in kwargs["plain"]
    assert user.new_email in kwargs["html"]
    assert "A confirmation was sent to that email address" in kwargs["plain"]
    assert "A confirmation was sent to that email address" in kwargs["html"]
    assert "support@couchers.org" in kwargs["plain"]
    assert "support@couchers.org" in kwargs["html"]


def test_email_changed_confirmation_sent_to_old_email(db):
    confirmation_token = urlsafe_secure_token()
    user, user_token = generate_user()
    user.new_email = f"{random_hex(12)}@couchers.org.invalid"
    user.old_email_token = confirmation_token
    with patch("couchers.templates.v2.queue_email") as mock:
        send_email_changed_confirmation_to_old_email(user)

    assert mock.call_count == 1
    _, kwargs = mock.call_args
    assert "Confirm your email change for Couchers.org" in kwargs["subject"]
    assert kwargs["recipient"] == user.email
    assert user.name in kwargs["plain"]
    assert user.name in kwargs["html"]
    assert user.new_email in kwargs["plain"]
    assert user.new_email in kwargs["html"]
    assert "confirmed this change via your new email address" in kwargs["plain"]
    assert "confirmed this change via your new email address" in kwargs["html"]
    assert f"http://localhost:3000/confirm-email?token={confirmation_token}" in kwargs["plain"]
    assert f"http://localhost:3000/confirm-email?token={confirmation_token}" in kwargs["html"]
    assert "support@couchers.org" in kwargs["plain"]
    assert "support@couchers.org" in kwargs["html"]


def test_email_changed_confirmation_sent_to_new_email(db):
    confirmation_token = urlsafe_secure_token()
    user, user_token = generate_user()
    user.new_email = f"{random_hex(12)}@couchers.org.invalid"
    user.new_email_token = confirmation_token
    with patch("couchers.templates.v2.queue_email") as mock:
        send_email_changed_confirmation_to_new_email(user)

    assert mock.call_count == 1
    _, kwargs = mock.call_args
    assert "new email" in kwargs["subject"]
    assert kwargs["recipient"] == user.new_email
    assert user.name in kwargs["plain"]
    assert user.name in kwargs["html"]
    assert user.email in kwargs["plain"]
    assert user.email in kwargs["html"]
    assert "Your old email address is" in kwargs["plain"]
    assert "Your old email address is" in kwargs["html"]
    assert f"http://localhost:3000/confirm-email?token={confirmation_token}" in kwargs["plain"]
    assert f"http://localhost:3000/confirm-email?token={confirmation_token}" in kwargs["html"]
    assert "support@couchers.org" in kwargs["plain"]
    assert "support@couchers.org" in kwargs["html"]


def test_do_not_email_security(db):
    _, token = generate_user()

    password_reset_token = urlsafe_secure_token()

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(notifications_pb2.SetNotificationSettingsReq(enable_do_not_email=True))

    # make sure we still get security emails
    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()

        with mock_notification_email() as mock:
            notify(
                user_id=user.id,
                topic_action="password_reset:start",
                data=notification_data_pb2.PasswordResetStart(
                    password_reset_token=password_reset_token,
                ),
            )

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

        assert "/unsubscribe?payload=" not in e.plain
        assert "/unsubscribe?payload=" not in e.html


def test_do_not_email_non_security(db):
    user, token1 = generate_user(complete_profile=True)
    _, token2 = generate_user(complete_profile=True)

    with notifications_session(token1) as notifications:
        notifications.SetNotificationSettings(notifications_pb2.SetNotificationSettingsReq(enable_do_not_email=True))

    with mock_notification_email() as mock:
        with api_session(token2) as api:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user.id))

    assert mock.call_count == 0


def test_do_not_email_non_security_unsublink(db):
    user, _ = generate_user(complete_profile=True)
    _, token2 = generate_user(complete_profile=True)

    with mock_notification_email() as mock:
        with api_session(token2) as api:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user.id))

    assert mock.call_count == 1
    e = email_fields(mock)

    assert "/unsubscribe?payload=" in e.plain
    assert "/unsubscribe?payload=" in e.html


def test_email_prefix_config(db, monkeypatch):
    user, token = generate_user()
    user.new_email = f"{random_hex(12)}@couchers.org.invalid"

    with patch("couchers.templates.v2.queue_email") as mock:
        send_email_changed_notification_email(user)

    assert mock.call_count == 1
    _, kwargs = mock.call_args

    assert kwargs["sender_name"] == "Couchers.org"
    assert kwargs["sender_email"] == "notify@couchers.org.invalid"
    assert kwargs["subject"] == "[TEST] Couchers.org email change requested"

    new_config = config.copy()
    new_config["NOTIFICATION_EMAIL_SENDER"] = "TestCo"
    new_config["NOTIFICATION_EMAIL_ADDRESS"] = "testco@testing.co.invalid"
    new_config["NOTIFICATION_EMAIL_PREFIX"] = ""

    monkeypatch.setattr(couchers.templates.v2, "config", new_config)

    with patch("couchers.templates.v2.queue_email") as mock:
        send_email_changed_notification_email(user)

    assert mock.call_count == 1
    _, kwargs = mock.call_args

    assert kwargs["sender_name"] == "TestCo"
    assert kwargs["sender_email"] == "testco@testing.co.invalid"
    assert kwargs["subject"] == "Couchers.org email change requested"


def test_send_donation_email(db, monkeypatch):
    user, _ = generate_user(name="Testy von Test", email="testing@couchers.org.invalid")

    new_config = config.copy()
    new_config["ENABLE_EMAIL"] = True

    monkeypatch.setattr(couchers.jobs.handlers, "config", new_config)

    notify(
        user_id=user.id,
        topic_action="donation:received",
        data=notification_data_pb2.DonationReceived(
            amount=20,
            receipt_url="https://example.com/receipt/12345",
        ),
    )

    with patch("couchers.email.smtp.smtplib.SMTP") as mock:
        handle_notifications_bg()

    with session_scope() as session:
        email = session.execute(select(Email)).scalar_one()
        assert email.subject == "[TEST] Thank you for your donation to Couchers.org!"
        assert (
            email.plain
            == """Dear Testy von Test,

Thank you so much for your donation of $20 to Couchers.org.

Your contribution will go towards building and sustaining the Couchers.org platform and community, and is vital for our goal of a completely free and non-profit generation of couch surfing.


You can download an invoice and receipt for the donation here:

<https://example.com/receipt/12345>

If you have any questions about your donation, please email us at <donations@couchers.org>.

Your generosity will help deliver the platform for everyone.


Thank you!

Aapeli and Itsi,
Couchers.org Founders


---

This is a security email, you cannot unsubscribe from it."""
        )

        assert "Thank you so much for your donation of $20 to Couchers.org." in email.html
        assert email.sender_name == "Couchers.org"
        assert email.sender_email == "notify@couchers.org.invalid"
        assert email.recipient == "testing@couchers.org.invalid"
        assert "https://example.com/receipt/12345" in email.html
        assert not email.list_unsubscribe_header
        assert email.source_data == "testing_version/donation_received"
