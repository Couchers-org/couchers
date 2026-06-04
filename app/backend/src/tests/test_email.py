from datetime import timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import pytest
from sqlalchemy import func, select, update

import couchers.email
import couchers.jobs.handlers
from couchers.config import config
from couchers.crypto import b64decode, random_hex, urlsafe_secure_token
from couchers.db import session_scope
from couchers.models import (
    ContentReport,
    Email,
    ModerationObjectType,
    ModerationState,
    ModerationVisibility,
    Reference,
    ReferenceType,
    SignupFlow,
    User,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.notify import notify
from couchers.proto import api_pb2, auth_pb2, editor_pb2, events_pb2, notification_data_pb2, notifications_pb2
from couchers.tasks import (
    enforce_community_memberships,
    maybe_send_reference_report_email,
    send_content_report_email,
    send_email_changed_confirmation_to_new_email,
    send_signup_email,
)
from couchers.utils import Timestamp_from_datetime, now
from tests.fixtures.db import generate_user, get_friend_relationship, make_friends
from tests.fixtures.misc import EmailCollector, Moderator, process_jobs
from tests.fixtures.sessions import (
    api_session,
    auth_api_session,
    events_session,
    notifications_session,
    real_editor_session,
)
from tests.test_communities import create_community


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_signup_verification_email(db, email_collector: EmailCollector):
    request_email = f"{random_hex(12)}@couchers.org.invalid"

    flow = SignupFlow(name="Frodo", email=request_email, flow_token="")

    with session_scope() as session:
        send_signup_email(session, flow)

    email = email_collector.pop_for_recipient(request_email, last=True)
    assert email.recipient == request_email
    assert flow.email_token
    assert flow.email_token in email.html
    assert flow.email_token in email.html


def test_report_email(db, email_collector: EmailCollector):
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

    email = email_collector.pop_for_recipient("reports@couchers.org.invalid", last=True)
    assert email.recipient == "reports@couchers.org.invalid"
    assert author_username in email.plain
    assert str(author_id) in email.plain
    assert author_email in email.plain
    assert reporting_username in email.plain
    assert str(reporting_id) in email.plain
    assert reporting_email in email.plain
    assert reason in email.plain
    assert description in email.plain
    assert "report" in email.subject.lower()


def test_reference_report_email_not_sent(db, email_collector: EmailCollector):
    from_user, api_token_author = generate_user()
    to_user, api_token_reported = generate_user()

    make_friends(from_user, to_user)

    with session_scope() as session:
        moderation_state = ModerationState(
            object_type=ModerationObjectType.reference,
            object_id=0,
            visibility=ModerationVisibility.visible,
        )
        session.add(moderation_state)
        session.flush()
        reference = Reference(
            from_user_id=from_user.id,
            to_user_id=to_user.id,
            reference_type=ReferenceType.friend,
            text="This person was very nice to me.",
            rating=0.9,
            was_appropriate=True,
            moderation_state_id=moderation_state.id,
        )
        session.add(reference)
        session.flush()
        moderation_state.object_id = reference.id

        # no email sent for a positive ref
        maybe_send_reference_report_email(session, reference)

    assert email_collector.count_for_recipient("reports@couchers.org.invalid") == 0


def test_reference_report_email(db, email_collector: EmailCollector):
    from_user, api_token_author = generate_user()
    to_user, api_token_reported = generate_user()

    make_friends(from_user, to_user)

    with session_scope() as session:
        moderation_state = ModerationState(
            object_type=ModerationObjectType.reference,
            object_id=0,
            visibility=ModerationVisibility.visible,
        )
        session.add(moderation_state)
        session.flush()
        reference = Reference(
            from_user_id=from_user.id,
            to_user_id=to_user.id,
            reference_type=ReferenceType.friend,
            text="This person was not nice to me.",
            rating=0.3,
            was_appropriate=False,
            private_text="This is some private text for support",
            moderation_state_id=moderation_state.id,
        )
        session.add(reference)
        session.flush()
        moderation_state.object_id = reference.id

        maybe_send_reference_report_email(session, reference)

        reference_text = reference.text
        reference_private_text = reference.private_text

    email = email_collector.pop_for_recipient("reports@couchers.org.invalid", last=True)
    assert email.recipient == "reports@couchers.org.invalid"
    assert "report" in email.subject.lower()
    assert "reference" in email.subject.lower()
    assert from_user.username in email.plain
    assert str(from_user.id) in email.plain
    assert from_user.email in email.plain
    assert to_user.username in email.plain
    assert str(to_user.id) in email.plain
    assert to_user.email in email.plain
    assert reference_text in email.plain
    assert "friend" in email.plain.lower()
    assert reference_private_text
    assert reference_private_text in email.plain


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

    def mock_queue_email(session, payload):
        raise Exception(patched_msg)

    with api_session(from_token) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=to_user.id))

    friend_relationship = get_friend_relationship(from_user, to_user)
    assert friend_relationship is not None
    moderator.approve_friend_request(friend_relationship.id)

    with patch("couchers.email.queuing._queue_email", mock_queue_email):
        with pytest.raises(Exception) as e:
            process_jobs()

    assert str(e.value) == patched_msg


def test_email_changed_confirmation_sent_to_new_email(db, email_collector: EmailCollector):
    confirmation_token = urlsafe_secure_token()
    user, user_token = generate_user()
    user.new_email = f"{random_hex(12)}@couchers.org.invalid"
    user.new_email_token = confirmation_token
    with session_scope() as session:
        send_email_changed_confirmation_to_new_email(session, user)

    email = email_collector.pop_for_recipient(user.new_email, last=True)
    assert "new email" in email.subject
    assert email.recipient == user.new_email
    assert user.name in email.plain
    assert user.name in email.html
    assert user.email in email.plain
    assert user.email in email.html
    assert "Your old email address is" in email.plain
    assert "Your old email address is" in email.html
    assert f"http://localhost:3000/confirm-email?token={confirmation_token}" in email.plain
    assert f"http://localhost:3000/confirm-email?token={confirmation_token}" in email.html
    assert "support@couchers.org" in email.plain
    assert "support@couchers.org" in email.html


def test_do_not_email_security(db, email_collector: EmailCollector):
    user, token = generate_user()

    password_reset_token = urlsafe_secure_token()

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(notifications_pb2.SetNotificationSettingsReq(enable_do_not_email=True))

    # make sure we still get security emails

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

    email = email_collector.pop_for_recipient(user.email, last=True)
    assert email.recipient == user.email
    assert "reset" in email.subject.lower()
    assert password_reset_token in email.plain
    assert password_reset_token in email.html
    unique_string = "You asked for your password to be reset on Couchers.org."
    assert unique_string in email.plain
    assert unique_string in email.html
    assert f"http://localhost:3000/complete-password-reset?token={password_reset_token}" in email.plain
    assert f"http://localhost:3000/complete-password-reset?token={password_reset_token}" in email.html
    assert "support@couchers.org" in email.plain
    assert "support@couchers.org" in email.html

    assert "/quick-link?payload=" not in email.plain
    assert "/quick-link?payload=" not in email.html


def test_do_not_email_non_security(db, email_collector: EmailCollector):
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

    assert email_collector.count_for_recipient(user.email) == 0


def test_do_not_email_non_security_unsublink(db, email_collector: EmailCollector):
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

    email = email_collector.pop_for_recipient(user.email, last=True)

    assert "/quick-link?payload=" in email.plain
    assert "/quick-link?payload=" in email.html


def test_email_prefix_config(db, email_collector: EmailCollector, monkeypatch):
    user, _ = generate_user()

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

    email1 = email_collector.pop_for_recipient(user.email, last=True)
    assert email1.sender_name == "Couchers.org"
    assert email1.sender_email == "notify@couchers.org.invalid"
    assert email1.subject == "[TEST] Thank you for your donation to Couchers.org!"

    new_config = config.copy()
    new_config["NOTIFICATION_EMAIL_SENDER"] = "TestCo"
    new_config["NOTIFICATION_EMAIL_ADDRESS"] = "testco@testing.co.invalid"
    new_config["NOTIFICATION_PREFIX"] = ""

    monkeypatch.setattr(couchers.notifications.background, "config", new_config)

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

    email2 = email_collector.pop_for_recipient(user.email, last=True)
    assert email2.sender_name == "TestCo"
    assert email2.sender_email == "testco@testing.co.invalid"
    assert email2.subject == "Thank you for your donation to Couchers.org!"


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
            == """Hi Testy von Test,

Thank you so much for your donation of $20 to Couchers.org.

Your contribution will go towards building and sustaining the Couchers.org platform and community, and is vital for our goal of a completely free and non-profit generation of couch surfing.

You can download an invoice and receipt for the donation here:

Download invoice: https://example.com/receipt/12345

Couchers, Inc. is a 501(c)(3) nonprofit (EIN: 87-1734577) registered in the United States. No goods or services were provided in exchange for this contribution.

If you have any questions about your donation, please email us at donations@couchers.org.

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


def test_chat_missed_messages_list_unsubscribe_header(db, email_collector: EmailCollector):
    """
    Regression test: chat__missed_messages has key="" (it's a summary, not tied to a single chat).
    The List-Unsubscribe header must use a topic_action unsubscribe link, not a topic_key link.
    """
    user, _ = generate_user()

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.chat__missed_messages,
            key="",
            data=notification_data_pb2.ChatMissedMessages(
                messages=[
                    notification_data_pb2.ChatMessage(
                        author=api_pb2.User(name="Test User", user_id=2, username="testuser"),
                        message="You missed 1 message(s) from Test User",
                        text="Hello!",
                        group_chat_id=99,
                    ),
                ],
            ),
        )

    email = email_collector.pop_for_recipient(user.email, last=True)

    assert email.list_unsubscribe_header

    # Extract the List-Unsubscribe URL and call the Unsubscribe endpoint
    url = email.list_unsubscribe_header.strip("<>")
    url_parts = urlparse(url)
    params = parse_qs(url_parts.query)

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.Unsubscribe(
            auth_pb2.UnsubscribeReq(
                payload=b64decode(params["payload"][0]),
                sig=b64decode(params["sig"][0]),
            )
        )
        assert res.response


def test_email_deleted_users_regression(db, email_collector: EmailCollector, moderator: Moderator):
    """
    We introduced a bug in notify v2 where we would email deleted/banned users.
    """
    super_user, super_token = generate_user(is_superuser=True)
    creating_user, creating_token = generate_user(complete_profile=True)

    normal_user, _ = generate_user()
    ban_user, _ = generate_user()
    delete_user, _ = generate_user()

    with session_scope() as session:
        w = create_community(session, 0, 2, "Global Community", [super_user], [], None)
        mr = create_community(session, 0, 2, "Macroregion", [super_user], [], w)
        r = create_community(session, 0, 2, "Region", [super_user], [], mr)
        c_id = create_community(
            session,
            0,
            2,
            "Non-global Community",
            [super_user],
            [creating_user, normal_user, ban_user, delete_user],
            r,
        ).id

    enforce_community_memberships()

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)
    with events_session(creating_token) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                photo_key=None,
                parent_community_id=c_id,
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

    moderator.approve_event_occurrence(event_id)

    with events_session(creating_token) as api:
        api.RequestCommunityInvite(events_pb2.RequestCommunityInviteReq(event_id=event_id))

    email_collector.pop_for_mods(last=True)

    with real_editor_session(super_token) as editor:
        res = editor.ListEventCommunityInviteRequests(editor_pb2.ListEventCommunityInviteRequestsReq())
        assert len(res.requests) == 1
        # this will count everyone
        assert res.requests[0].approx_users_to_notify == 5

    with session_scope() as session:
        session.execute(update(User).where(User.id == ban_user.id).values(banned_at=func.now()))
        session.execute(update(User).where(User.id == delete_user.id).values(deleted_at=func.now()))

    with real_editor_session(super_token) as editor:
        res = editor.ListEventCommunityInviteRequests(editor_pb2.ListEventCommunityInviteRequestsReq())
        assert len(res.requests) == 1
        # should only notify creating_user, super_user and normal_user
        assert res.requests[0].approx_users_to_notify == 3

        editor.DecideEventCommunityInviteRequest(
            editor_pb2.DecideEventCommunityInviteRequestReq(
                event_community_invite_request_id=res.requests[0].event_community_invite_request_id,
                approve=True,
            )
        )

    assert email_collector.count() == 3
