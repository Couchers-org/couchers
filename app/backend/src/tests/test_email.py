from datetime import timedelta
from unittest.mock import patch

import pytest
from sqlalchemy import select, update

import couchers.email
import couchers.jobs.handlers
from couchers.config import config
from couchers.crypto import random_hex, urlsafe_secure_token
from couchers.db import session_scope
from couchers.models import (
    ContentReport,
    Email,
    Reference,
    ReferenceType,
    SignupFlow,
    User,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.notify import notify
from couchers.proto import api_pb2, editor_pb2, events_pb2, notification_data_pb2, notifications_pb2
from couchers.tasks import (
    enforce_community_memberships,
    maybe_send_reference_report_email,
    send_content_report_email,
    send_email_changed_confirmation_to_new_email,
    send_signup_email,
)
from couchers.utils import Timestamp_from_datetime, now
from tests.fixtures.db import generate_user, get_friend_relationship, make_friends
from tests.fixtures.misc import Moderator, email_fields, mock_notification_email, process_jobs
from tests.fixtures.sessions import api_session, events_session, notifications_session, real_editor_session
from tests.test_communities import create_community


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_signup_verification_email(db):
    request_email = f"{random_hex(12)}@couchers.org.invalid"

    flow = SignupFlow(name="Frodo", email=request_email, flow_token="")

    with session_scope() as session:
        with mock_notification_email() as mock:
            send_signup_email(session, flow)

    assert mock.call_count == 1
    e = email_fields(mock)
    assert e.recipient == request_email
    assert flow.email_token
    assert flow.email_token in e.html
    assert flow.email_token in e.html


def test_report_email(db):
    user_reporter, api_token_author = generate_user()
    user_author, api_token_reported = generate_user()

    with session_scope() as session:
        report = ContentReport(
            reporting_user_id=user_reporter.id,
            reason="spam",
            description="I think this is spam and does not belong on couchers",
            content_ref="comment/123",
            author_user_id=user_author.id,
            user_agent="n/a",
            page="https://couchers.org/comment/123",
        )
        session.add(report)
        session.flush()

        with mock_notification_email() as mock:
            send_content_report_email(session, report)

        # Load all data before session closes
        author_username = report.author_user.username
        author_id = report.author_user.id
        author_email = report.author_user.email
        reporting_username = report.reporting_user.username
        reporting_id = report.reporting_user.id
        reporting_email = report.reporting_user.email
        reason = report.reason
        description = report.description

    assert mock.call_count == 1

    e = email_fields(mock)
    assert e.recipient == "reports@couchers.org.invalid"
    assert author_username in e.plain
    assert str(author_id) in e.plain
    assert author_email in e.plain
    assert reporting_username in e.plain
    assert str(reporting_id) in e.plain
    assert reporting_email in e.plain
    assert reason in e.plain
    assert description in e.plain
    assert "report" in e.subject.lower()


def test_reference_report_email_not_sent(db):
    from_user, api_token_author = generate_user()
    to_user, api_token_reported = generate_user()

    make_friends(from_user, to_user)

    with session_scope() as session:
        reference = Reference(
            from_user_id=from_user.id,
            to_user_id=to_user.id,
            reference_type=ReferenceType.friend,
            text="This person was very nice to me.",
            rating=0.9,
            was_appropriate=True,
        )

        # no email sent for a positive ref

        with mock_notification_email() as mock:
            maybe_send_reference_report_email(session, reference)

        assert mock.call_count == 0


def test_reference_report_email(db):
    from_user, api_token_author = generate_user()
    to_user, api_token_reported = generate_user()

    make_friends(from_user, to_user)

    with session_scope() as session:
        reference = Reference(
            from_user_id=from_user.id,
            to_user_id=to_user.id,
            reference_type=ReferenceType.friend,
            text="This person was not nice to me.",
            rating=0.3,
            was_appropriate=False,
            private_text="This is some private text for support",
        )
        session.add(reference)
        session.flush()

        with mock_notification_email() as mock:
            maybe_send_reference_report_email(session, reference)

        assert mock.call_count == 1
        e = email_fields(mock)
        assert e.recipient == "reports@couchers.org.invalid"
        assert "report" in e.subject.lower()
        assert "reference" in e.subject.lower()
        assert from_user.username in e.plain
        assert str(from_user.id) in e.plain
        assert from_user.email in e.plain
        assert to_user.username in e.plain
        assert str(to_user.id) in e.plain
        assert to_user.email in e.plain
        assert reference.text in e.plain
        assert "friend" in e.plain.lower()
        assert reference.private_text
        assert reference.private_text in e.plain


def test_email_patching_fails(db):
    """
    There was a problem where the mocking wasn't happening and the email dev
    printing function was called instead, this makes sure the patching is
    actually done
    """
    to_user, to_token = generate_user()
    from_user, from_token = generate_user()
    # Need a moderator to approve the friend request since UMS defers notification
    mod_user, mod_token = generate_user(is_superuser=True)
    moderator = Moderator(mod_user, mod_token)

    patched_msg = random_hex(64)

    def mock_queue_email(session, **kwargs):
        raise Exception(patched_msg)

    with api_session(from_token) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=to_user.id))

    friend_relationship = get_friend_relationship(from_user, to_user)
    assert friend_relationship is not None
    moderator.approve_friend_request(friend_relationship.id)

    with patch("couchers.email._queue_email", mock_queue_email):
        with pytest.raises(Exception) as e:
            process_jobs()

    assert str(e.value) == patched_msg


def test_email_changed_confirmation_sent_to_new_email(db):
    confirmation_token = urlsafe_secure_token()
    user, user_token = generate_user()
    user.new_email = f"{random_hex(12)}@couchers.org.invalid"
    user.new_email_token = confirmation_token
    with session_scope() as session:
        with mock_notification_email() as mock:
            send_email_changed_confirmation_to_new_email(session, user)

    assert mock.call_count == 1
    e = email_fields(mock)
    assert "new email" in e.subject
    assert e.recipient == user.new_email
    assert user.name in e.plain
    assert user.name in e.html
    assert user.email in e.plain
    assert user.email in e.html
    assert "Your old email address is" in e.plain
    assert "Your old email address is" in e.html
    assert f"http://localhost:3000/confirm-email?token={confirmation_token}" in e.plain
    assert f"http://localhost:3000/confirm-email?token={confirmation_token}" in e.html
    assert "support@couchers.org" in e.plain
    assert "support@couchers.org" in e.html


def test_do_not_email_security(db):
    user, token = generate_user()

    password_reset_token = urlsafe_secure_token()

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(notifications_pb2.SetNotificationSettingsReq(enable_do_not_email=True))

    # make sure we still get security emails

    with mock_notification_email() as mock:
        with session_scope() as session:
            notify(
                session,
                user_id=user.id,
                topic_action=NotificationTopicAction.password_reset__start,
                key="",
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

    assert "/quick-link?payload=" not in e.plain
    assert "/quick-link?payload=" not in e.html


def test_do_not_email_non_security(db):
    user, token1 = generate_user(complete_profile=True)
    from_user, token2 = generate_user(complete_profile=True)
    # Need a moderator to approve the friend request since UMS defers notification
    mod_user, mod_token = generate_user(is_superuser=True)
    moderator = Moderator(mod_user, mod_token)

    with notifications_session(token1) as notifications:
        notifications.SetNotificationSettings(notifications_pb2.SetNotificationSettingsReq(enable_do_not_email=True))

    with api_session(token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user.id))

    friend_relationship = get_friend_relationship(from_user, user)
    assert friend_relationship is not None
    moderator.approve_friend_request(friend_relationship.id)

    with mock_notification_email() as mock:
        process_jobs()

    assert mock.call_count == 0


def test_do_not_email_non_security_unsublink(db):
    user, _ = generate_user(complete_profile=True)
    from_user, token2 = generate_user(complete_profile=True)
    # Need a moderator to approve the friend request since UMS defers notification
    mod_user, mod_token = generate_user(is_superuser=True)
    moderator = Moderator(mod_user, mod_token)

    with api_session(token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user.id))

    friend_relationship = get_friend_relationship(from_user, user)
    assert friend_relationship is not None
    moderator.approve_friend_request(friend_relationship.id)

    with mock_notification_email() as mock:
        process_jobs()

    assert mock.call_count == 1
    e = email_fields(mock)

    assert "/quick-link?payload=" in e.plain
    assert "/quick-link?payload=" in e.html


def test_email_prefix_config(db, monkeypatch):
    user, _ = generate_user()

    with mock_notification_email() as mock:
        with session_scope() as session:
            notify(
                session,
                user_id=user.id,
                topic_action=NotificationTopicAction.donation__received,
                key="",
                data=notification_data_pb2.DonationReceived(
                    amount=20,
                    receipt_url="https://example.com/receipt/12345",
                ),
            )

    assert mock.call_count == 1
    e = email_fields(mock)
    assert e.sender_name == "Couchers.org"
    assert e.sender_email == "notify@couchers.org.invalid"
    assert e.subject == "[TEST] Thank you for your donation to Couchers.org!"

    new_config = config.copy()
    new_config["NOTIFICATION_EMAIL_SENDER"] = "TestCo"
    new_config["NOTIFICATION_EMAIL_ADDRESS"] = "testco@testing.co.invalid"
    new_config["NOTIFICATION_PREFIX"] = ""

    monkeypatch.setattr(couchers.notifications.background, "config", new_config)

    with mock_notification_email() as mock:
        with session_scope() as session:
            notify(
                session,
                user_id=user.id,
                topic_action=NotificationTopicAction.donation__received,
                key="",
                data=notification_data_pb2.DonationReceived(
                    amount=20,
                    receipt_url="https://example.com/receipt/12345",
                ),
            )

    assert mock.call_count == 1
    e = email_fields(mock)
    assert e.sender_name == "TestCo"
    assert e.sender_email == "testco@testing.co.invalid"
    assert e.subject == "Thank you for your donation to Couchers.org!"


def test_send_donation_email(db, monkeypatch):
    user, _ = generate_user(name="Testy von Test", email="testing@couchers.org.invalid")

    new_config = config.copy()
    new_config["ENABLE_EMAIL"] = True

    monkeypatch.setattr(couchers.jobs.handlers, "config", new_config)

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.donation__received,
            key="",
            data=notification_data_pb2.DonationReceived(
                amount=20,
                receipt_url="https://example.com/receipt/12345",
            ),
        )

    with patch("couchers.email.smtp.smtplib.SMTP"):
        process_jobs()

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

This is a security email, you cannot unsubscribe from it.
"""
        )

        assert "Thank you so much for your donation of $20 to Couchers.org." in email.html
        assert email.sender_name == "Couchers.org"
        assert email.sender_email == "notify@couchers.org.invalid"
        assert email.recipient == "testing@couchers.org.invalid"
        assert "https://example.com/receipt/12345" in email.html
        assert not email.list_unsubscribe_header
        assert email.source_data == "testing_version/donation_received"


def test_email_deleted_users_regression(db):
    """
    We introduced a bug in notify v2 where we would email deleted/banned users.
    """
    super_user, super_token = generate_user(is_superuser=True)
    creating_user, creating_token = generate_user(complete_profile=True)

    normal_user, _ = generate_user()
    ban_user, _ = generate_user()
    delete_user, _ = generate_user()

    with session_scope() as session:
        create_community(session, 10, 2, "Global Community", [super_user], [], None)
        create_community(
            session,
            0,
            2,
            "Non-global Community",
            [super_user],
            [creating_user, normal_user, ban_user, delete_user],
            None,
        )

    enforce_community_memberships()

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)
    with events_session(creating_token) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                photo_key=None,
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )
        event_id = res.event_id
        assert not res.is_deleted

        with mock_notification_email() as mock:
            api.RequestCommunityInvite(events_pb2.RequestCommunityInviteReq(event_id=event_id))
        assert mock.call_count == 1

    with real_editor_session(super_token) as editor:
        res = editor.ListEventCommunityInviteRequests(editor_pb2.ListEventCommunityInviteRequestsReq())
        assert len(res.requests) == 1
        # this will count everyone
        assert res.requests[0].approx_users_to_notify == 5

    with session_scope() as session:
        session.execute(update(User).where(User.id == ban_user.id).values(is_banned=True))
        session.execute(update(User).where(User.id == delete_user.id).values(is_deleted=True))

    with real_editor_session(super_token) as editor:
        res = editor.ListEventCommunityInviteRequests(editor_pb2.ListEventCommunityInviteRequestsReq())
        assert len(res.requests) == 1
        # should only notify creating_user, super_user and normal_user
        assert res.requests[0].approx_users_to_notify == 3

        with mock_notification_email() as mock:
            editor.DecideEventCommunityInviteRequest(
                editor_pb2.DecideEventCommunityInviteRequestReq(
                    event_community_invite_request_id=res.requests[0].event_community_invite_request_id,
                    approve=True,
                )
            )

        assert mock.call_count == 3
