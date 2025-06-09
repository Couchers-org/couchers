from datetime import timedelta
from unittest.mock import call, patch

import pytest
import requests
from google.protobuf import empty_pb2
from sqlalchemy.sql import delete, func

import couchers.jobs.worker
from couchers.config import config
from couchers.crypto import urlsafe_secure_token
from couchers.db import session_scope
from couchers.email import queue_email
from couchers.email.dev import print_dev_email
from couchers.jobs.enqueue import queue_job
from couchers.jobs.handlers import (
    add_users_to_email_list,
    send_message_notifications,
    send_onboarding_emails,
    send_reference_reminders,
    send_request_notifications,
    update_badges,
    update_recommendation_scores,
)
from couchers.jobs.worker import _run_job_and_schedule, process_job, run_scheduler, service_jobs
from couchers.metrics import create_prometheus_server
from couchers.models import (
    AccountDeletionToken,
    BackgroundJob,
    BackgroundJobState,
    Email,
    LoginToken,
    PasswordResetToken,
    UserBadge,
)
from couchers.sql import couchers_select as select
from couchers.utils import now, today
from proto import conversations_pb2, requests_pb2
from tests.test_fixtures import (
    conversations_session,
    generate_user,
    make_friends,
    make_user_block,
    process_jobs,
    requests_session,
)
from tests.test_references import create_host_reference, create_host_request

# Define TEST_HOST_REQUEST_LONG_TEXT here, as it's used in this file for API calls
# Ideally, this would be imported from a common test utility/fixture file.
TEST_HOST_REQUEST_LONG_TEXT = "Hello! I am a friendly traveler looking for a place to stay while visiting your city. I enjoy cultural exchanges and am am happy to share stories from my travels. I am clean, respectful, and can offer help around the house if needed. I look forward to hearing from you! This message is intentionally long to meet minimum length requirements in tests."


def now_5_min_in_future():
    return now() + timedelta(minutes=5)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _check_job_counter(job, status, attempt, exception):
    metrics_string = requests.get("http://localhost:8000").text
    string_to_check = f'attempt="{attempt}",exception="{exception}",job="{job}",status="{status}"'
    assert string_to_check in metrics_string


def test_email_job(db):
    with session_scope() as session:
        queue_email(session, "sender_name", "sender_email", "recipient", "subject", "plain", "html")

    def mock_print_dev_email(
        sender_name, sender_email, recipient, subject, plain, html, list_unsubscribe_header, source_data
    ):
        assert sender_name == "sender_name"
        assert sender_email == "sender_email"
        assert recipient == "recipient"
        assert subject == "subject"
        assert plain == "plain"
        assert html == "html"
        return print_dev_email(
            sender_name, sender_email, recipient, subject, plain, html, list_unsubscribe_header, source_data
        )

    with patch("couchers.jobs.handlers.print_dev_email", mock_print_dev_email):
        process_job()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state == BackgroundJobState.completed)
            ).scalar_one()
            == 1
        )
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state != BackgroundJobState.completed)
            ).scalar_one()
            == 0
        )


def test_purge_login_tokens(db):
    user, api_token = generate_user()
    with session_scope() as session:
        login_token = LoginToken(token=urlsafe_secure_token(), user=user, expiry=now())
        session.add(login_token)
        assert session.execute(select(func.count()).select_from(LoginToken)).scalar_one() == 1
        queue_job(session, "purge_login_tokens", empty_pb2.Empty())
    process_job()
    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(LoginToken)).scalar_one() == 0
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state == BackgroundJobState.completed)
            ).scalar_one()
            == 1
        )
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state != BackgroundJobState.completed)
            ).scalar_one()
            == 0
        )


def test_purge_password_reset_tokens(db):
    user, api_token = generate_user()
    with session_scope() as session:
        password_reset_token = PasswordResetToken(token=urlsafe_secure_token(), user=user, expiry=now())
        session.add(password_reset_token)
        assert session.execute(select(func.count()).select_from(PasswordResetToken)).scalar_one() == 1
        queue_job(session, "purge_password_reset_tokens", empty_pb2.Empty())
    process_job()
    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(PasswordResetToken)).scalar_one() == 0
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state == BackgroundJobState.completed)
            ).scalar_one()
            == 1
        )
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state != BackgroundJobState.completed)
            ).scalar_one()
            == 0
        )


def test_purge_account_deletion_tokens(db):
    user, api_token = generate_user()
    user2, api_token2 = generate_user()
    user3, api_token3 = generate_user()
    with session_scope() as session:
        account_deletion_tokens = [
            AccountDeletionToken(token=urlsafe_secure_token(), user=user, expiry=now() - timedelta(hours=2)),
            AccountDeletionToken(token=urlsafe_secure_token(), user=user2, expiry=now()),
            AccountDeletionToken(token=urlsafe_secure_token(), user=user3, expiry=now() + timedelta(hours=5)),
        ]
        for token in account_deletion_tokens:
            session.add(token)
        assert session.execute(select(func.count()).select_from(AccountDeletionToken)).scalar_one() == 3
        queue_job(session, "purge_account_deletion_tokens", empty_pb2.Empty())
    process_job()
    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(AccountDeletionToken)).scalar_one() == 1
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state == BackgroundJobState.completed)
            ).scalar_one()
            == 1
        )
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state != BackgroundJobState.completed)
            ).scalar_one()
            == 0
        )


def test_enforce_community_memberships(db):
    with session_scope() as session:
        queue_job(session, "enforce_community_membership", empty_pb2.Empty())
    process_job()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state == BackgroundJobState.completed)
            ).scalar_one()
            == 1
        )
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state != BackgroundJobState.completed)
            ).scalar_one()
            == 0
        )


def test_refresh_materialized_views(db):
    with session_scope() as session:
        queue_job(session, "refresh_materialized_views", empty_pb2.Empty())
    process_job()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state == BackgroundJobState.completed)
            ).scalar_one()
            == 1
        )
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state != BackgroundJobState.completed)
            ).scalar_one()
            == 0
        )


def test_service_jobs(db):
    with session_scope() as session:
        queue_email(session, "sender_name", "sender_email", "recipient", "subject", "plain", "html")

    class HitSleep(Exception):
        pass

    def raising_sleep(seconds):
        raise HitSleep()

    with pytest.raises(HitSleep):
        with patch("couchers.jobs.worker.sleep", raising_sleep):
            service_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state == BackgroundJobState.completed)
            ).scalar_one()
            == 1
        )
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.state != BackgroundJobState.completed)
            ).scalar_one()
            == 0
        )


def test_scheduler(db, monkeypatch):
    MOCK_SCHEDULE = [
        ("purge_login_tokens", timedelta(seconds=7)),
        ("send_message_notifications", timedelta(seconds=11)),
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
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.state == BackgroundJobState.pending)
            ).scalar_one()
            == 18
        )
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.state != BackgroundJobState.pending)
            ).scalar_one()
            == 0
        )


def test_job_retry(db):
    with session_scope() as session:
        queue_job(session, "mock_job", empty_pb2.Empty())
    called_count = 0

    def mock_job(payload):
        nonlocal called_count
        called_count += 1
        raise Exception()

    MOCK_JOBS = {
        "mock_job": (empty_pb2.Empty, mock_job),
    }
    create_prometheus_server(port=8000)
    new_config = config.copy()
    new_config["IN_TEST"] = False
    with patch("couchers.jobs.worker.config", new_config), patch("couchers.jobs.worker.JOBS", MOCK_JOBS):
        process_job()
        with session_scope() as session:
            assert (
                session.execute(
                    select(func.count())
                    .select_from(BackgroundJob)
                    .where(BackgroundJob.state == BackgroundJobState.error)
                ).scalar_one()
                == 1
            )
            assert (
                session.execute(
                    select(func.count())
                    .select_from(BackgroundJob)
                    .where(BackgroundJob.state != BackgroundJobState.error)
                ).scalar_one()
                == 0
            )
            session.execute(select(BackgroundJob)).scalar_one().next_attempt_after = func.now()
        process_job()
        with session_scope() as session:
            session.execute(select(BackgroundJob)).scalar_one().next_attempt_after = func.now()
        process_job()
        with session_scope() as session:
            session.execute(select(BackgroundJob)).scalar_one().next_attempt_after = func.now()
        process_job()
        with session_scope() as session:
            session.execute(select(BackgroundJob)).scalar_one().next_attempt_after = func.now()
        process_job()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.state == BackgroundJobState.failed)
            ).scalar_one()
            == 1
        )
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.state != BackgroundJobState.failed)
            ).scalar_one()
            == 0
        )
    _check_job_counter("mock_job", "error", "4", "Exception")
    _check_job_counter("mock_job", "failed", "5", "Exception")


def test_no_jobs_no_problem(db):
    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(BackgroundJob)).scalar_one() == 0
    assert not process_job()
    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(BackgroundJob)).scalar_one() == 0


def test_send_message_notifications_basic(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)
    send_message_notifications(empty_pb2.Empty())
    process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )
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
    send_message_notifications(empty_pb2.Empty())
    process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )
    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        send_message_notifications(empty_pb2.Empty())
        process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 2
        )
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))
    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        send_message_notifications(empty_pb2.Empty())
        process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )


def test_send_message_notifications_muted(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)
    send_message_notifications(empty_pb2.Empty())
    process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )
    with conversations_session(token1) as c:
        group_chat_id = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
    with conversations_session(token3) as c:
        c.MuteGroupChat(conversations_pb2.MuteGroupChatReq(group_chat_id=group_chat_id, forever=True))
    with conversations_session(token1) as c:
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
    send_message_notifications(empty_pb2.Empty())
    process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )
    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        send_message_notifications(empty_pb2.Empty())
        process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 1
        )
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))
    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        send_message_notifications(empty_pb2.Empty())
        process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )


def test_send_request_notifications_host_request(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()
    send_request_notifications(empty_pb2.Empty())
    process_jobs()
    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(BackgroundJob)).scalar_one() == 0
    with requests_session(token1) as requests:
        host_request_id = requests.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text=TEST_HOST_REQUEST_LONG_TEXT
            )
        ).host_request_id
    with session_scope() as session:
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 1
        )
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )
    with requests_session(token2) as requests:
        requests.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text=TEST_HOST_REQUEST_LONG_TEXT,
            )
        )
    with session_scope() as session:
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 1
        )
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )


def test_send_message_notifications_seen(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_friends(user1, user2)
    send_message_notifications(empty_pb2.Empty())
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )
    with conversations_session(token1) as c:
        group_chat_id = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id])
        ).group_chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 2"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 4"))
    with conversations_session(token2) as c:
        m_id = c.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id)).latest_message.message_id
        c.MarkLastSeenGroupChat(
            conversations_pb2.MarkLastSeenGroupChatReq(group_chat_id=group_chat_id, last_seen_message_id=m_id)
        )
    send_message_notifications(empty_pb2.Empty())
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )

    def now_30_min_in_future():
        return now() + timedelta(minutes=30)

    with patch("couchers.jobs.handlers.now", now_30_min_in_future):
        send_message_notifications(empty_pb2.Empty())
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )


def test_send_onboarding_emails(db):
    user1, token1 = generate_user(onboarding_emails_sent=0, last_onboarding_email_sent=None, complete_profile=False)
    send_onboarding_emails(empty_pb2.Empty())
    process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 1
        )
    user2, token2 = generate_user(
        onboarding_emails_sent=1, last_onboarding_email_sent=now() - timedelta(days=6), complete_profile=False
    )
    send_onboarding_emails(empty_pb2.Empty())
    process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 1
        )
    user3, token3 = generate_user(
        onboarding_emails_sent=1, last_onboarding_email_sent=now() - timedelta(days=8), complete_profile=False
    )
    send_onboarding_emails(empty_pb2.Empty())
    process_jobs()
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 2
        )


def test_send_reference_reminders(db):
    send_reference_reminders(empty_pb2.Empty())
    user1, token1 = generate_user(email="user1@couchers.org.invalid", name="User 1")
    user2, token2 = generate_user(email="user2@couchers.org.invalid", name="User 2")
    user3, token3 = generate_user(email="user3@couchers.org.invalid", name="User 3")
    user4, token4 = generate_user(email="user4@couchers.org.invalid", name="User 4")
    user5, token5 = generate_user(email="user5@couchers.org.invalid", name="User 5")
    user6, token6 = generate_user(email="user6@couchers.org.invalid", name="User 6")
    user7, token7 = generate_user(email="user7@couchers.org.invalid", name="User 7")
    user8, token8 = generate_user(email="user8@couchers.org.invalid", name="User 8")
    user9, token9 = generate_user(email="user9@couchers.org.invalid", name="User 9")
    user10, token10 = generate_user(email="user10@couchers.org.invalid", name="User 10")
    make_user_block(user9, user10)
    user11, token11 = generate_user(email="user11@couchers.org.invalid", name="User 11")
    user12, token12 = generate_user(email="user12@couchers.org.invalid", name="User 12")
    with session_scope() as session:
        ref1, hr1 = create_host_reference(session, user2.id, user1.id, timedelta(days=7), surfing=True)
        create_host_reference(session, user1.id, user2.id, timedelta(days=7), host_request_id=hr1)
        ref2, hr2 = create_host_reference(session, user3.id, user4.id, timedelta(days=11), surfing=False)
        ref3, hr3 = create_host_reference(session, user6.id, user5.id, timedelta(days=9), surfing=True)
        hr4 = create_host_request(session, user7.id, user8.id, timedelta(days=4))
        hr5 = create_host_request(session, user9.id, user10.id, timedelta(days=7))
        hr6 = create_host_request(session, user12.id, user11.id, timedelta(days=6), surfer_reason_didnt_meetup="")
    expected_emails = [
        (
            "user11@couchers.org.invalid",
            "[TEST] You have 14 days to write a reference for User 12!",
            ("from when you hosted them", "/leave-reference/hosted/"),
        ),
        (
            "user4@couchers.org.invalid",
            "[TEST] You have 3 days to write a reference for User 3!",
            ("from when you surfed with them", "/leave-reference/surfed/"),
        ),
        (
            "user5@couchers.org.invalid",
            "[TEST] You have 7 days to write a reference for User 6!",
            ("from when you hosted them", "/leave-reference/hosted/"),
        ),
        (
            "user7@couchers.org.invalid",
            "[TEST] You have 14 days to write a reference for User 8!",
            ("from when you surfed with them", "/leave-reference/surfed/"),
        ),
        (
            "user8@couchers.org.invalid",
            "[TEST] You have 14 days to write a reference for User 7!",
            ("from when you hosted them", "/leave-reference/hosted/"),
        ),
    ]
    send_reference_reminders(empty_pb2.Empty())
    while process_job():
        pass
    with session_scope() as session:
        emails = [
            (email.recipient, email.subject, email.plain, email.html)
            for email in session.execute(select(Email).order_by(Email.recipient.asc())).scalars().all()
        ]
        actual_addresses_and_subjects = [email[:2] for email in emails]
        expected_addresses_and_subjects = [email[:2] for email in expected_emails]
        print(actual_addresses_and_subjects)
        print(expected_addresses_and_subjects)
        assert actual_addresses_and_subjects == expected_addresses_and_subjects
        for (address, subject, plain, html), (_, _, search_strings) in zip(emails, expected_emails):
            for find in search_strings:
                assert find in plain, f"Expected to find string {find} in PLAIN email {subject} to {address}, didn't"
                assert find in html, f"Expected to find string {find} in HTML email {subject} to {address}, didn't"


def test_add_users_to_email_list(db):
    new_config = config.copy()
    new_config["LISTMONK_ENABLED"] = True
    new_config["LISTMONK_BASE_URL"] = "https://example.com"
    new_config["LISTMONK_API_USERNAME"] = "test_user"
    new_config["LISTMONK_API_KEY"] = "dummy_api_key"
    new_config["LISTMONK_LIST_ID"] = 6
    with patch("couchers.jobs.handlers.config", new_config):
        with patch("couchers.jobs.handlers.requests.post") as mock:
            add_users_to_email_list(empty_pb2.Empty())
        mock.assert_not_called()
        generate_user(in_sync_with_newsletter=False, email="testing1@couchers.invalid", name="Tester1", id=15)
        generate_user(in_sync_with_newsletter=True, email="testing2@couchers.invalid", name="Tester2")
        generate_user(in_sync_with_newsletter=False, email="testing3@couchers.invalid", name="Tester3 von test", id=17)
        generate_user(
            in_sync_with_newsletter=False, email="testing4@couchers.invalid", name="Tester4", opt_out_of_newsletter=True
        )
        with patch("couchers.jobs.handlers.requests.post") as mock:
            ret = mock.return_value
            ret.status_code = 200
            add_users_to_email_list(empty_pb2.Empty())
        mock.assert_has_calls(
            [
                call(
                    "https://example.com/api/subscribers",
                    auth=("test_user", "dummy_api_key"),
                    json={
                        "email": "testing1@couchers.invalid",
                        "name": "Tester1",
                        "lists": [6],
                        "preconfirm_subscriptions": True,
                        "attribs": {"couchers_user_id": 15},
                        "status": "enabled",
                    },
                    timeout=10,
                ),
                call(
                    "https://example.com/api/subscribers",
                    auth=("test_user", "dummy_api_key"),
                    json={
                        "email": "testing3@couchers.invalid",
                        "name": "Tester3 von test",
                        "lists": [6],
                        "preconfirm_subscriptions": True,
                        "attribs": {"couchers_user_id": 17},
                        "status": "enabled",
                    },
                    timeout=10,
                ),
            ],
            any_order=True,
        )
        with patch("couchers.jobs.handlers.requests.post") as mock:
            add_users_to_email_list(empty_pb2.Empty())
        mock.assert_not_called()


def test_update_recommendation_scores(db):
    update_recommendation_scores(empty_pb2.Empty())


def test_update_badges(db, push_collector):
    user1, _ = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()
    user4, _ = generate_user(phone="+15555555555", phone_verification_verified=func.now())
    user5, _ = generate_user(phone="+15555555556", phone_verification_verified=func.now())
    user6, _ = generate_user()
    with session_scope() as session:
        session.add(UserBadge(user_id=user5.id, badge_id="board_member"))
    update_badges(empty_pb2.Empty())
    process_jobs()
    with session_scope() as session:
        badge_tuples = session.execute(
            select(UserBadge.user_id, UserBadge.badge_id).order_by(UserBadge.user_id.asc(), UserBadge.id.asc())
        ).all()
    expected = [
        (user1.id, "founder"),
        (user1.id, "board_member"),
        (user2.id, "founder"),
        (user2.id, "board_member"),
        (user4.id, "phone_verified"),
        (user5.id, "phone_verified"),
    ]
    assert badge_tuples == expected
    print(push_collector.pushes)
    push_collector.assert_user_push_matches_fields(
        user1.id,
        ix=0,
        title="The Founder badge was added to your profile",
        body="Check out your profile to see the new badge!",
    )
    push_collector.assert_user_push_matches_fields(
        user1.id,
        ix=1,
        title="The Board Member badge was added to your profile",
        body="Check out your profile to see the new badge!",
    )
    push_collector.assert_user_push_matches_fields(
        user2.id,
        ix=0,
        title="The Founder badge was added to your profile",
        body="Check out your profile to see the new badge!",
    )
    push_collector.assert_user_push_matches_fields(
        user2.id,
        ix=1,
        title="The Board Member badge was added to your profile",
        body="Check out your profile to see the new badge!",
    )
    push_collector.assert_user_push_matches_fields(
        user4.id,
        ix=0,
        title="The Verified Phone badge was added to your profile",
        body="Check out your profile to see the new badge!",
    )
    push_collector.assert_user_push_matches_fields(
        user5.id,
        ix=0,
        title="The Board Member badge was removed from your profile",
        body="You can see all your badges on your profile.",
    )
    push_collector.assert_user_push_matches_fields(
        user5.id,
        ix=1,
        title="The Verified Phone badge was added to your profile",
        body="Check out your profile to see the new badge!",
    )
