import pytest
from couchers.crypto import random_hex
from couchers.email import _render_email


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
