from datetime import datetime, timedelta
from unittest.mock import create_autospec, patch

import pytest
import pytz
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

import couchers.jobs.worker
from couchers.db import new_login_token, session_scope
from couchers.email import queue_email
from couchers.email.dev import print_dev_email
from couchers.jobs.enqueue import queue_job
from couchers.jobs.handlers import process_send_message_notifications
from couchers.jobs.worker import _run_job_and_schedule, process_job, run_scheduler, service_jobs
from couchers.models import (
    BackgroundJob,
    BackgroundJobState,
    BackgroundJobType,
    Email,
    HostRequest,
    LoginToken,
    SignupToken,
)
from couchers.tasks import send_login_email
from couchers.utils import now, today
from pb import auth_pb2, conversations_pb2, requests_pb2
from tests.test_fixtures import (
    auth_api_session,
    conversations_session,
    db,
    generate_user,
    make_friends,
    requests_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_login_email_full(db):
    user, api_token = generate_user()
    user_email = user.email

    with session_scope() as session:
        login_token, expiry_text = new_login_token(session, user)
        send_login_email(user, login_token, expiry_text)
        token = login_token.token

        def mock_print_dev_email(sender_name, sender_email, recipient, subject, plain, html):
            assert recipient == user.email
            assert "login" in subject.lower()
            assert login_token.token in plain
            assert login_token.token in html
            return print_dev_email(sender_name, sender_email, recipient, subject, plain, html)

        with patch("couchers.jobs.handlers.print_dev_email", mock_print_dev_email):
            process_job()

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.state == BackgroundJobState.completed).count() == 1
        assert session.query(BackgroundJob).filter(BackgroundJob.state != BackgroundJobState.completed).count() == 0


def test_email_job(db):
    queue_email("sender_name", "sender_email", "recipient", "subject", "plain", "html")

    def mock_print_dev_email(sender_name, sender_email, recipient, subject, plain, html):
        assert sender_name == "sender_name"
        assert sender_email == "sender_email"
        assert recipient == "recipient"
        assert subject == "subject"
        assert plain == "plain"
        assert html == "html"
        return print_dev_email(sender_name, sender_email, recipient, subject, plain, html)

    with patch("couchers.jobs.handlers.print_dev_email", mock_print_dev_email):
        process_job()

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.state == BackgroundJobState.completed).count() == 1
        assert session.query(BackgroundJob).filter(BackgroundJob.state != BackgroundJobState.completed).count() == 0


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

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.state == BackgroundJobState.completed).count() == 1
        assert session.query(BackgroundJob).filter(BackgroundJob.state != BackgroundJobState.completed).count() == 0


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

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.state == BackgroundJobState.completed).count() == 2
        assert session.query(BackgroundJob).filter(BackgroundJob.state != BackgroundJobState.completed).count() == 0


def test_service_jobs(db):
    queue_email("sender_name", "sender_email", "recipient", "subject", "plain", "html")

    # we create this HitSleep exception here, and mock out the normal sleep(1) in the infinite loop to instead raise
    # this. that allows us to conveniently get out of the infinite loop and know we had no more jobs left
    class HitSleep(Exception):
        pass

    # the mock `sleep` function that instead raises the aforementioned exception
    def raising_sleep(seconds):
        raise HitSleep()

    with pytest.raises(HitSleep):
        with patch("couchers.jobs.worker.sleep", raising_sleep):
            service_jobs()

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.state == BackgroundJobState.completed).count() == 1
        assert session.query(BackgroundJob).filter(BackgroundJob.state != BackgroundJobState.completed).count() == 0


def test_scheduler(db, monkeypatch):
    MOCK_SCHEDULE = [
        (BackgroundJobType.purge_login_tokens, timedelta(seconds=7)),
        (BackgroundJobType.purge_signup_tokens, timedelta(seconds=11)),
    ]

    current_time = 0
    end_time = 70

    class EndOfTime(Exception):
        pass

    def mock_monotonic():
        nonlocal current_time
        return current_time

    def mock_sleep(seconds):
        nonlocal current_time
        current_time += seconds
        if current_time > end_time:
            raise EndOfTime()

    realized_schedule = []

    def mock_run_job_and_schedule(sched, schedule_id):
        nonlocal current_time
        realized_schedule.append((current_time, schedule_id))
        _run_job_and_schedule(sched, schedule_id)

    monkeypatch.setattr(couchers.jobs.worker, "_run_job_and_schedule", mock_run_job_and_schedule)
    monkeypatch.setattr(couchers.jobs.worker, "SCHEDULE", MOCK_SCHEDULE)
    monkeypatch.setattr(couchers.jobs.worker, "monotonic", mock_monotonic)
    monkeypatch.setattr(couchers.jobs.worker, "sleep", mock_sleep)

    with pytest.raises(EndOfTime):
        run_scheduler()

    assert realized_schedule == [
        (0.0, 0),
        (0.0, 1),
        (7.0, 0),
        (11.0, 1),
        (14.0, 0),
        (21.0, 0),
        (22.0, 1),
        (28.0, 0),
        (33.0, 1),
        (35.0, 0),
        (42.0, 0),
        (44.0, 1),
        (49.0, 0),
        (55.0, 1),
        (56.0, 0),
        (63.0, 0),
        (66.0, 1),
        (70.0, 0),
    ]

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.state == BackgroundJobState.pending).count() == 18
        assert session.query(BackgroundJob).filter(BackgroundJob.state != BackgroundJobState.pending).count() == 0


def test_job_retry(db):
    queue_job(BackgroundJobType.purge_login_tokens, empty_pb2.Empty())

    called_count = 0

    def mock_handler(payload):
        nonlocal called_count
        called_count += 1
        raise Exception()

    MOCK_JOBS = {
        BackgroundJobType.purge_login_tokens: (empty_pb2.Empty, mock_handler),
    }

    with patch("couchers.jobs.worker.JOBS", MOCK_JOBS):
        process_job()
        with session_scope() as session:
            assert session.query(BackgroundJob).filter(BackgroundJob.state == BackgroundJobState.error).count() == 1
            assert session.query(BackgroundJob).filter(BackgroundJob.state != BackgroundJobState.error).count() == 0

            session.query(BackgroundJob).one().next_attempt_after = func.now()
        process_job()
        with session_scope() as session:
            session.query(BackgroundJob).one().next_attempt_after = func.now()
        process_job()
        with session_scope() as session:
            session.query(BackgroundJob).one().next_attempt_after = func.now()
        process_job()
        with session_scope() as session:
            session.query(BackgroundJob).one().next_attempt_after = func.now()
        process_job()

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.state == BackgroundJobState.failed).count() == 1
        assert session.query(BackgroundJob).filter(BackgroundJob.state != BackgroundJobState.failed).count() == 0


def test_no_jobs_no_problem(db):
    with session_scope() as session:
        assert session.query(BackgroundJob).count() == 0

    assert not process_job()

    with session_scope() as session:
        assert session.query(BackgroundJob).count() == 0


def now_5_min_in_future():
    return now() + timedelta(minutes=5)


def test_process_send_message_notifications_basic(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    process_send_message_notifications(empty_pb2.Empty())

    # should find no jobs, since there's no messages
    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.job_type == BackgroundJobType.send_email).count() == 0

    with conversations_session(token1) as c:
        group_chat_id = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 2"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 4"))

    with conversations_session(token3) as c:
        group_chat_id = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id])
        ).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 5"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 6"))

    process_send_message_notifications(empty_pb2.Empty())

    # no emails sent out
    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.job_type == BackgroundJobType.send_email).count() == 0

    # this should generate emails for both user2 and user3
    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        process_send_message_notifications(empty_pb2.Empty())

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.job_type == BackgroundJobType.send_email).count() == 2
        # delete them all
        session.query(BackgroundJob).delete(synchronize_session=False)

    # shouldn't generate any more emails
    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        process_send_message_notifications(empty_pb2.Empty())

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.job_type == BackgroundJobType.send_email).count() == 0


def test_process_send_message_notifications_host_request(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    process_send_message_notifications(empty_pb2.Empty())

    # should find no jobs, since there's no messages
    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.job_type == BackgroundJobType.send_email).count() == 0

    with requests_session(token1) as requests:
        host_request_id = requests.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
            )
        ).host_request_id

    with session_scope() as session:
        # delete send_email BackgroundJob created by CreateHostRequest
        session.query(BackgroundJob).delete(synchronize_session=False)

    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        process_send_message_notifications(empty_pb2.Empty())

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.job_type == BackgroundJobType.send_email).count() == 1

        # delete all BackgroundJobs
        session.query(BackgroundJob).delete(synchronize_session=False)

        host_request = session.query(HostRequest).filter(HostRequest.conversation_id == host_request_id).one()
        host_request.to_last_seen_message_id = host_request.from_last_seen_message_id
        session.flush()

    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        process_send_message_notifications(empty_pb2.Empty())

    # Should find no messages since it's been seen
    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.job_type == BackgroundJobType.send_email).count() == 0


def test_process_send_message_notifications_seen(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_friends(user1, user2)

    process_send_message_notifications(empty_pb2.Empty())

    # should find no jobs, since there's no messages
    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.job_type == BackgroundJobType.send_email).count() == 0

    with conversations_session(token1) as c:
        group_chat_id = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id])
        ).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 2"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 4"))

    # user 2 now marks those messages as seen
    with conversations_session(token2) as c:
        m_id = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id)).latest_message.message_id
        c.MarkLastSeenGroupChat(
            conversations_pb2.MarkLastSeenGroupChatReq(group_chat_id=group_chat_id, last_seen_message_id=m_id)
        )

    process_send_message_notifications(empty_pb2.Empty())

    # no emails sent out
    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.job_type == BackgroundJobType.send_email).count() == 0

    # still shouldn't generate emails as user2 has seen all messages
    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        process_send_message_notifications(empty_pb2.Empty())

    with session_scope() as session:
        assert session.query(BackgroundJob).filter(BackgroundJob.job_type == BackgroundJobType.send_email).count() == 0
