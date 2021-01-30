from unittest.mock import create_autospec, patch

import pytest
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

from couchers.crypto import random_hex
from couchers.db import new_login_token, session_scope
from couchers.email import queue_email
from couchers.jobs.enqueue import queue_job
from couchers.jobs.worker import process_job, service_jobs
from couchers.models import BackgroundJobType, LoginToken
from couchers.tasks import send_login_email
from tests.test_fixtures import db, generate_user, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_login_email_full(db):
    user, api_token = generate_user()

    message_id = random_hex(64)

    with session_scope() as session:
        login_token, expiry_text = new_login_token(session, user)
        send_login_email(user, login_token, expiry_text)
        token = login_token.token

    @create_autospec
    def mock_email_sender(sender_name, sender_email, recipient, subject, plain, html):
        assert recipient == user.email
        assert "login" in subject.lower()
        assert login_token.token in plain
        assert login_token.token in html
        return message_id

    with patch("couchers.jobs.handlers.print_dev_email", mock_email_sender) as mock:
        process_job()

    assert mock.call_count == 1


def test_email_job(db):
    queue_email("sender_name", "sender_email", "recipient", "subject", "plain", "html")

    @create_autospec
    def mock_email_sender(sender_name, sender_email, recipient, subject, plain, html):
        assert sender_name == "sender_name"
        assert sender_email == "sender_email"
        assert recipient == "recipient"
        assert subject == "subject"
        assert plain == "plain"
        assert html == "html"
        return message_id

    with patch("couchers.jobs.handlers.print_dev_email", mock_email_sender) as mock:
        process_job()

    assert mock.call_count == 1


def test_purge_login_tokens(db):
    user, api_token = generate_user()

    with session_scope() as session:
        login_token, expiry_text = new_login_token(session, user)
        login_token.expiry = func.now()
        assert session.query(LoginToken).count() == 1

    queue_job(BackgroundJobType.purge_login_tokens, empty_pb2.Empty())
    process_job()

    with session_scope() as session:
        assert session.query(LoginToken).count() == 0
