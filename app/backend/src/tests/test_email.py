from unittest.mock import patch

import pytest

from couchers.crypto import random_hex, urlsafe_secure_token
from couchers.db import new_login_token, new_signup_token, session_scope
from couchers.email import _render_email
from couchers.models import Complaint, HostRequest, HostRequestStatus, Conversation, Message, FriendRelationship, FriendStatus
from couchers.tasks import send_login_email, send_signup_email, send_report_email, send_host_request_email, send_message_received_email, send_friend_request_email
from tests.test_fixtures import db, generate_user, testconfig
from couchers.config import config


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_login_email_rendering():
    subject = random_hex(64)
    login_link = random_hex(64)
    plain, html = _render_email(subject, "login", template_args={"user": None, "login_link": login_link})
    assert login_link in plain
    assert login_link in html
    assert subject in html


def test_signup_email_rendering():
    subject = random_hex(64)
    signup_link = random_hex(64)
    plain, html = _render_email(subject, "signup", template_args={"signup_link": signup_link})
    assert signup_link in plain
    assert signup_link in html
    assert subject in html


def test_report_email_rendering():
    subject = random_hex(64)
    author_user = random_hex(64)
    reported_user = random_hex(64)
    reason = random_hex(64)
    description = random_hex(64)

    plain, html = _render_email(
        subject,
        "report",
        template_args={
            "username_author": author_user,
            "username_reported": reported_user,
            "reason": reason,
            "description": description,
        }
    )

    assert author_user in plain
    assert author_user in html
    assert reported_user in plain
    assert reported_user in html
    assert reason in plain
    assert reason in html
    assert description in plain
    assert description in html
    assert subject in html


def test_host_request_email_rendering():
    subject = random_hex(64)
    name_host = random_hex(64)
    name_guest = random_hex(64)
    from_date = "2020-01-01"
    to_date = "2020-01-05"
    host_request_link = random_hex(64)

    plain, html = _render_email(
        subject,
        "host_request",
        template_args={
            "name_host": name_host,
            "name_guest": name_guest,
            "from_date": from_date,
            "to_date": to_date,
            "host_request_link": host_request_link
        }
    )

    assert name_host in plain
    assert name_host in html
    assert name_guest in plain
    assert name_guest in html
    assert from_date in plain
    assert from_date in html
    assert to_date in plain
    assert to_date in html
    assert host_request_link in plain
    assert host_request_link in html
    assert subject in html


def test_friend_request_email_rendering():
    subject = random_hex(64)
    name_recipient = random_hex(64)
    name_sender = random_hex(64)
    friend_requests_link = random_hex(64)

    plain, html = _render_email(
        subject,
        "friend_request",
        template_args={
            "name_recipient": name_recipient,
            "name_sender": name_sender,
            "friend_requests_link": friend_requests_link
        }
    )

    assert name_recipient in plain
    assert name_recipient in html
    assert name_sender in plain
    assert name_sender in html
    assert friend_requests_link in plain
    assert friend_requests_link in html
    assert subject in html


def test_message_received_email_rendering():
    subject = random_hex(64)
    name_recipient = random_hex(64)
    messages_link = random_hex(64)

    plain, html = _render_email(
        subject,
        "message_received",
        template_args={
            "name_recipient": name_recipient,
            "messages_link": messages_link
        }
    )

    assert name_recipient in plain
    assert name_recipient in html
    assert messages_link in plain
    assert messages_link in html
    assert subject in html


def test_login_email(db):
    user, api_token = generate_user(db)

    message_id = random_hex(64)

    with session_scope(db) as session:
        login_token, expiry_text = new_login_token(session, user)

    def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
        assert recipient == user.email
        assert "login" in subject.lower()
        assert login_token.token in plain
        assert login_token.token in html
        return message_id

    with patch("couchers.email.send_email", mock_send_email):
        send_login_email(user, login_token, expiry_text)


def test_signup_email(db):
    user, api_token = generate_user(db)

    request_email = f"{random_hex(12)}@couchers.org.invalid"
    message_id = random_hex(64)

    with session_scope(db) as session:
        token, expiry_text = new_signup_token(session, request_email)

    def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
        assert recipient == request_email
        assert token.token in plain
        assert token.token in html
        return message_id

    with patch("couchers.email.send_email", mock_send_email):
        send_signup_email(request_email, token, expiry_text)


def test_report_email(db):
    with session_scope(db):
        user_author, api_token_author = generate_user(db)
        user_reported, api_token_reported = generate_user(db)
        testing_email_address = "reports@couchers.org.invalid"

        complaint = Complaint(
            author_user=user_author, reported_user=user_reported, reason=random_hex(64), description=random_hex(64)
        )

        message_id = random_hex(64)

        def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
            assert recipient == "reports@couchers.org.invalid"
            assert complaint.author_user.username in plain
            assert complaint.author_user.username in html
            assert complaint.reported_user.username in plain
            assert complaint.reported_user.username in html
            assert complaint.reason in plain
            assert complaint.reason in html
            assert complaint.description in plain
            assert complaint.description in html
            assert "report" in subject.lower()
            return message_id

        with patch("couchers.email.send_email", mock_send_email):
            send_report_email(complaint)


def test_host_request_email(db):
    with session_scope(db) as session:
        from_user, api_token_from = generate_user(db)
        to_user, api_token_to = generate_user(db)
        from_date = "2020-01-01"
        to_date = "2020-01-05"

        conversation = Conversation()
        message = Message()
        message.conversation_id = conversation.id
        message.author_id = from_user.id
        message.text = random_hex(64)

        host_request = HostRequest(
            from_user=from_user,
            to_user=to_user,
            from_date=from_date,
            to_date=to_date,
            status=HostRequestStatus.pending,
            conversation_id=conversation.id,
            initial_message_id=message.id,
            from_last_seen_message_id=message.id
        )

        message_id = random_hex(64)

        def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
            assert recipient == to_user.email
            assert "host request" in subject.lower()
            assert to_user.name in plain
            assert to_user.name in html
            assert from_user.name in plain
            assert from_user.name in html
            assert from_date in plain
            assert from_date in html
            assert to_date in plain
            assert to_date in html
            assert from_user.avatar_url not in plain
            assert from_user.avatar_url in html
            assert f"{config['BASE_URL']}/hostrequests/" in plain
            assert f"{config['BASE_URL']}/hostrequests/" in html
            return message_id

        with patch("couchers.email.send_email", mock_send_email):
            send_host_request_email(host_request)

def test_message_received_email(db):
    user, api_token = generate_user(db)

    message_id = random_hex(64)

    def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
        assert recipient == user.email
        assert "mail" in subject.lower()
        assert f"{config['BASE_URL']}/messages/" in plain
        assert f"{config['BASE_URL']}/messages/" in html
        return message_id

    with patch("couchers.email.send_email", mock_send_email):
        send_message_received_email(user)


def test_friend_request_email(db):
    with session_scope(db) as session:
        from_user, api_token_from = generate_user(db)
        to_user, api_token_to = generate_user(db)
        friend_relationship = FriendRelationship(
            from_user=from_user,
            to_user=to_user,
            status=FriendStatus.pending
        )

        message_id = random_hex(64)

        def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
            assert recipient == to_user.email
            assert "friend" in subject.lower()
            assert to_user.name in plain
            assert to_user.name in html
            assert from_user.name in plain
            assert from_user.name in html
            assert from_user.avatar_url not in plain
            assert from_user.avatar_url in html
            assert f"{config['BASE_URL']}/friends/" in plain
            assert f"{config['BASE_URL']}/friends/" in html
            return message_id

        with patch("couchers.email.send_email", mock_send_email):
            send_friend_request_email(friend_relationship)

def test_email_patching_fails(db):
    """
    There was a problem where the mocking wasn't happening and the email dev
    printing function was called instead, this makes sure the patching is
    actually done
    """
    with session_scope(db) as session:
        from_user, api_token_from = generate_user(db)
        to_user, api_token_to = generate_user(db)
        friend_relationship = FriendRelationship(
            from_user=from_user,
            to_user=to_user,
            status=FriendStatus.pending
        )

        patched_msg = random_hex(64)

        def mock_send_smtp_email(sender_name, sender_email, recipient, subject, plain, html):
            raise Exception(patched_msg)

        with pytest.raises(Exception) as e:
            with patch("couchers.email.send_email", mock_send_smtp_email):
                send_friend_request_email(friend_relationship)
        assert str(e.value) == patched_msg
