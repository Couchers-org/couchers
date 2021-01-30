from unittest.mock import create_autospec, patch

import pytest
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

from couchers.crypto import random_hex
from couchers.db import new_login_token, session_scope
from couchers.email import queue_email
from couchers.jobs.enqueue import queue_job
from couchers.jobs.worker import process_job, service_jobs
from couchers.models import BackgroundJobType, LoginToken, SignupToken
from couchers.tasks import send_login_email
from pb import auth_pb2
from tests.test_fixtures import auth_api_session, db, generate_user, testconfig


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
        return ""

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


def test_purge_signup_tokens(db):
    with auth_api_session() as (auth_api, metadata_interceptor):
        reply = auth_api.Signup(auth_pb2.SignupReq(email="a@b.com"))

    # send email
    process_job()

    with session_scope() as session:
        signup_token = session.query(SignupToken).one()
        signup_token.expiry = func.now()
        assert session.query(SignupToken).count() == 1

    queue_job(BackgroundJobType.purge_signup_tokens, empty_pb2.Empty())

    # purge tokens
    process_job()

    with session_scope() as session:
        assert session.query(SignupToken).count() == 0


def test_service_jobs(db):
    queue_email("sender_name", "sender_email", "recipient", "subject", "plain", "html")

    @create_autospec
    def mock_email_sender(sender_name, sender_email, recipient, subject, plain, html):
        return ""

    # we create this HitSleep exception here, and mock out the normal sleep(1) in the infinite loop to instead raise
    # this. that allows us to conveniently get out of the infinite loop and know we had no more jobs left
    class HitSleep(Exception):
        pass

    # the mock `sleep` function that instead raises the aforementioned exception
    def raising_sleep(seconds):
        raise HitSleep()

    with patch("couchers.jobs.handlers.print_dev_email", mock_email_sender) as mock:
        with patch("couchers.jobs.worker.sleep", raising_sleep):
            with pytest.raises(HitSleep) as e:
                service_jobs()

    assert mock.call_count == 1
