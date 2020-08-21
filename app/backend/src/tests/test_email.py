from unittest.mock import patch

import pytest
from couchers.crypto import random_hex, urlsafe_secure_token
from couchers.db import new_login_token, new_signup_token
from couchers.email import _render_email
from couchers.tasks import send_login_email, send_signup_email, send_host_request_email, send_message_received_email, send_friend_request_email
from couchers.config import config
from tests.test_fixtures import db, generate_user, generate_friend_relationship, generate_host_request


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

def test_host_request_email_rendering():
    subject = random_hex(64)
    name_host = random_hex(64)
    name_guest = random_hex(64)
    host_request_link = random_hex(64)
    plain, html = _render_email(subject, "host_request", template_args={"name_host": name_host, "name_guest": name_guest, "host_request_link": host_request_link})
    assert name_host in plain
    assert name_host in html
    assert name_guest in plain
    assert name_guest in html
    assert host_request_link in plain
    assert host_request_link in html
    assert subject in html

def test_friend_request_email_rendering():
    subject = random_hex(64)
    name_recipient = random_hex(64)
    name_sender = random_hex(64)
    friend_requests_link = random_hex(64)
    plain, html = _render_email(subject, "friend_request", template_args={"name_recipient": name_recipient, "name_sender": name_sender, "friend_requests_link": friend_requests_link})
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
    plain, html = _render_email(subject, "message_received", template_args={"name_recipient": name_recipient, "messages_link": messages_link})
    assert name_recipient in plain
    assert name_recipient in html
    assert messages_link in plain
    assert messages_link in html

    assert subject in html

def test_login_email(db):
    user, api_token = generate_user(db)

    message_id = random_hex(64)

    login_token, expiry_text = new_login_token(db(), user)

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

    token, expiry_text = new_signup_token(db(), request_email)

    def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
        assert recipient == request_email
        assert token.token in plain
        assert token.token in html
        return message_id

    with patch("couchers.email.send_email", mock_send_email):
        send_signup_email(request_email, token, expiry_text)

def test_report_email():
    subject = random_hex(64)
    author_user_id = 0x12345678_deadbeef
    reported_user_id = 0xfeebdaed_87654321
    reason = random_hex(64)
    description = random_hex(64)

    plain, html = _render_email(subject, "report", template_args={"author": author_user_id, "reported_user": reported_user_id, "reason": reason, "description": description})
    assert str(author_user_id) in plain
    assert str(author_user_id) in html
    assert str(reported_user_id) in plain
    assert str(reported_user_id) in html
    assert reason in plain
    assert reason in html
    assert description in plain
    assert description in html
    assert subject in html

def test_host_request_email(db):
    user_host, api_token_host = generate_user(db)
    user_guest, api_token_guest = generate_user(db)

    host_request = generate_host_request(user_guest, user_host, "2020-01-01", "2020-01-05")

    message_id = random_hex(64)

    def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
        assert recipient == user_host.email
        assert "host request" in subject.lower()
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
    user_sender, api_token_sender = generate_user(db)
    user_recipient, api_token_recipient = generate_user(db)

    friend_relationship = generate_friend_relationship(user_sender, user_recipient)

    message_id = random_hex(64)

    def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
        assert recipient == user_recipient.email
        assert "friend" in subject.lower()
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
    user_sender, api_token_sender = generate_user(db)
    user_recipient, api_token_recipient = generate_user(db)
    friend_relationship = generate_friend_relationship(user_sender, user_recipient)

    patched_msg = random_hex(64)

    def mock_send_smtp_email(sender_name, sender_email, recipient, subject, plain, html):
        raise Exception(patched_msg)

    with pytest.raises(Exception) as e:
        with patch("couchers.email.send_email", mock_send_smtp_email):
            send_friend_request_email(friend_relationship)
    assert str(e.value) == patched_msg
