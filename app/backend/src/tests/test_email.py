from unittest.mock import patch

import pytest
from couchers.crypto import random_hex, urlsafe_secure_token
from couchers.db import new_login_token, new_signup_token, session_scope
from couchers.email import _render_email
from couchers.tasks import send_login_email, send_signup_email, send_report_email
from tests.test_fixtures import db, generate_user
from couchers.models import Complaint

testing_email_address = "reports@couchers.org.invalid"

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
    plain, html = _render_email(subject, "report", template_args={"username_author": author_user, "username_reported": reported_user, "reason": reason, "description": description})
    assert author_user in plain
    assert author_user in html
    assert reported_user in plain
    assert reported_user in html
    assert reason in plain
    assert reason in html
    assert description in plain
    assert description in html
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


def test_report_email(db):
    with session_scope(db):
        user_author, api_token_author = generate_user(db)
        user_reported, api_token_reported = generate_user(db)

        complaint = Complaint(
            author_user=user_author,
            reported_user=user_reported,
            reason=random_hex(64),
            description=random_hex(64)
        )

        message_id = random_hex(64)

        def mock_send_email(sender_name, sender_email, recipient, subject, plain, html):
            assert recipient == testing_email_address
            assert complaint.author_user.username in plain
            assert complaint.author_user.username[10:] in html
            assert complaint.reported_user.username in plain
            assert complaint.reported_user.username[10:] in html
            assert complaint.reason in plain
            assert complaint.reason in html
            assert complaint.description in plain
            assert complaint.description in html
            assert "report" in subject.lower()
            return message_id

        with patch("couchers.email.send_email", mock_send_email):
            send_report_email(complaint)
