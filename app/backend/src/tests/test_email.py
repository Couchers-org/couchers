from unittest.mock import patch

import pytest
from couchers.crypto import random_hex, urlsafe_secure_token
from couchers.db import new_login_token, new_signup_token
from couchers.email import _render_email
from couchers.tasks import send_login_email, send_signup_email
from tests.test_fixtures import db, generate_user


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

def test_login_email(db):
    user, api_token = generate_user(db)

    message_id = random_hex(64)

    login_token, expiry_text = new_login_token(db(), user)

    def mock_send_smtp_email(sender_name, sender_email, recipient, subject, plain, html):
        assert recipient == user.email
        assert "login" in subject.lower()
        assert login_token.token in plain
        assert login_token.token in html
        return message_id

    with patch("couchers.email.send_smtp_email", mock_send_smtp_email):
        send_login_email(user, login_token, expiry_text)

def test_signup_email(db):
    user, api_token = generate_user(db)

    request_email = f"{random_hex(12)}@couchers.org.invalid"
    message_id = random_hex(64)

    token, expiry_text = new_signup_token(db(), request_email)

    def mock_send_smtp_email(sender_name, sender_email, recipient, subject, plain, html):
        assert recipient == request_email
        assert token.token in plain
        assert token.token in html
        return message_id

    with patch("couchers.email.send_smtp_email", mock_send_smtp_email):
        send_signup_email(request_email, token, expiry_text)

def test_report_email():
    subject = random_hex(64)
    author_user_id = 12345
    reported_user_id = 67890
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