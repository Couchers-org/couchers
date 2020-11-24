from unittest.mock import create_autospec, patch

import pytest

from couchers.config import config
from couchers.crypto import random_hex, urlsafe_secure_token
from couchers.db import new_login_token, new_signup_token, session_scope
from couchers.models import (
    Complaint,
    Conversation,
    FriendRelationship,
    FriendStatus,
    HostRequest,
    HostRequestStatus,
    Message,
)
from couchers.tasks import (
    send_friend_request_email,
    send_host_request_email,
    send_login_email,
    send_message_received_email,
    send_report_email,
    send_signup_email,
)
from tests.test_fixtures import db, generate_user, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_login_email(db):
    user, api_token = generate_user(db)

    message_id = random_hex(64)

    with session_scope(db) as session:
        login_token, expiry_text = new_login_token(session, user)

        @create_autospec
        def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
            assert recipient == user.email
            assert "login" in subject.lower()
            assert login_token.token in plain
            assert login_token.token in html
            return message_id

        with patch("couchers.email.send_email", mock_send_email) as mock:
            send_login_email(user, login_token, expiry_text)

        assert mock.call_count == 1


def test_signup_email(db):
    user, api_token = generate_user(db)

    request_email = f"{random_hex(12)}@couchers.org.invalid"
    message_id = random_hex(64)

    with session_scope(db) as session:
        token, expiry_text = new_signup_token(session, request_email)

        @create_autospec
        def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
            assert recipient == request_email
            assert token.token in plain
            assert token.token in html
            return message_id

        with patch("couchers.email.send_email", mock_send_email) as mock:
            send_signup_email(request_email, token, expiry_text)

        assert mock.call_count == 1


def test_report_email(db):
    with session_scope(db):
        user_author, api_token_author = generate_user(db)
        user_reported, api_token_reported = generate_user(db)

        complaint = Complaint(
            author_user=user_author, reported_user=user_reported, reason=random_hex(64), description=random_hex(256)
        )

        message_id = random_hex(64)

        @create_autospec
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

        with patch("couchers.email.send_email", mock_send_email) as mock:
            send_report_email(complaint)

        assert mock.call_count == 1


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
            conversation_id=conversation.id,
            from_user=from_user,
            to_user=to_user,
            from_date=from_date,
            to_date=to_date,
            status=HostRequestStatus.pending,
            from_last_seen_message_id=message.id,
        )

        message_id = random_hex(64)

        @create_autospec
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

        with patch("couchers.email.send_email", mock_send_email) as mock:
            send_host_request_email(host_request)

        assert mock.call_count == 1


def test_message_received_email(db):
    user, api_token = generate_user(db)

    message_id = random_hex(64)

    @create_autospec
    def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
        assert recipient == user.email
        assert "mail" in subject.lower()
        assert f"{config['BASE_URL']}/messages/" in plain
        assert f"{config['BASE_URL']}/messages/" in html
        return message_id

    with patch("couchers.email.send_email", mock_send_email) as mock:
        send_message_received_email(user)

    assert mock.call_count == 1


def test_friend_request_email(db):
    with session_scope(db) as session:
        from_user, api_token_from = generate_user(db)
        to_user, api_token_to = generate_user(db)
        friend_relationship = FriendRelationship(from_user=from_user, to_user=to_user, status=FriendStatus.pending)

        message_id = random_hex(64)

        @create_autospec
        def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
            assert recipient == to_user.email
            assert "friend" in subject.lower()
            assert to_user.name in plain
            assert to_user.name in html
            assert from_user.name in subject
            assert from_user.name in plain
            assert from_user.name in html
            assert from_user.avatar_url not in plain
            assert from_user.avatar_url in html
            assert f"{config['BASE_URL']}/friends/" in plain
            assert f"{config['BASE_URL']}/friends/" in html
            return message_id

        with patch("couchers.email.send_email", mock_send_email) as mock:
            send_friend_request_email(friend_relationship)

        assert mock.call_count == 1


def test_email_patching_fails(db):
    """
    There was a problem where the mocking wasn't happening and the email dev
    printing function was called instead, this makes sure the patching is
    actually done
    """
    with session_scope(db) as session:
        from_user, api_token_from = generate_user(db)
        to_user, api_token_to = generate_user(db)
        friend_relationship = FriendRelationship(from_user=from_user, to_user=to_user, status=FriendStatus.pending)

        patched_msg = random_hex(64)

        def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
            raise Exception(patched_msg)

        with pytest.raises(Exception) as e:
            with patch("couchers.email.send_email", mock_send_email):
                send_friend_request_email(friend_relationship)
        print(e.value)
        assert str(e.value) == patched_msg
