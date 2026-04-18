from datetime import date, datetime, timedelta
from typing import Any
from unittest.mock import call, patch

import pytest
import requests
from google.protobuf import empty_pb2
from google.protobuf.empty_pb2 import Empty
from sqlalchemy import select
from sqlalchemy.sql import delete, func

import couchers.jobs.worker
from couchers.config import config
from couchers.constants import HOST_REQUEST_MAX_REMINDERS, HOST_REQUEST_REMINDER_INTERVAL
from couchers.crypto import urlsafe_secure_token
from couchers.db import session_scope
from couchers.email.dev import print_dev_email
from couchers.email.queuing import queue_email
from couchers.jobs import handlers
from couchers.jobs.definitions import Job
from couchers.jobs.enqueue import queue_job
from couchers.jobs.handlers import (
    add_users_to_email_list,
    enforce_community_membership,
    purge_account_deletion_tokens,
    purge_login_tokens,
    purge_password_reset_tokens,
    send_host_request_reminders,
    send_message_notifications,
    send_onboarding_emails,
    send_reference_reminders,
    send_request_notifications,
    update_badges,
    update_recommendation_scores,
)
from couchers.jobs.worker import _run_job_and_schedule, process_job, run_scheduler, service_jobs
from couchers.materialized_views import refresh_materialized_views
from couchers.metrics import create_prometheus_server
from couchers.models import (
    AccountDeletionToken,
    BackgroundJob,
    BackgroundJobState,
    Email,
    HostRequest,
    HostRequestStatus,
    LoginToken,
    Message,
    MessageType,
    PasswordResetToken,
    User,
    UserBadge,
    UserBlock,
    Volunteer,
)
from couchers.proto import conversations_pb2, requests_pb2
from couchers.utils import now, today
from tests.fixtures.db import generate_user, make_friends, make_user_block, make_volunteer
from tests.fixtures.misc import PushCollector, process_jobs
from tests.fixtures.sessions import conversations_session, requests_session
from tests.test_references import create_host_reference, create_host_request, create_host_request_by_date
from tests.test_requests import valid_request_text


def now_5_min_in_future() -> datetime:
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
        login_token = LoginToken(token=urlsafe_secure_token(), user_id=user.id, expiry=now())
        session.add(login_token)
        assert session.execute(select(func.count()).select_from(LoginToken)).scalar_one() == 1

        queue_job(session, job=purge_login_tokens, payload=empty_pb2.Empty())
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
        password_reset_token = PasswordResetToken(token=urlsafe_secure_token(), user_id=user.id, expiry=now())
        session.add(password_reset_token)
        assert session.execute(select(func.count()).select_from(PasswordResetToken)).scalar_one() == 1

        queue_job(session, job=purge_password_reset_tokens, payload=empty_pb2.Empty())
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
        """
        3 cases:
        1) Token is valid
        2) Token expired but account retrievable
        3) Account is irretrievable (and expired)
        """
        account_deletion_tokens = [
            AccountDeletionToken(token=urlsafe_secure_token(), user_id=user.id, expiry=now() - timedelta(hours=2)),
            AccountDeletionToken(token=urlsafe_secure_token(), user_id=user2.id, expiry=now()),
            AccountDeletionToken(token=urlsafe_secure_token(), user_id=user3.id, expiry=now() + timedelta(hours=5)),
        ]
        for token in account_deletion_tokens:
            session.add(token)
        assert session.execute(select(func.count()).select_from(AccountDeletionToken)).scalar_one() == 3

        queue_job(session, job=purge_account_deletion_tokens, payload=empty_pb2.Empty())
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
        queue_job(session, job=enforce_community_membership, payload=empty_pb2.Empty())
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
        queue_job(session, job=refresh_materialized_views, payload=empty_pb2.Empty())

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
    def purge_login_tokens(payload: empty_pb2.Empty):
        return

    def send_message_notifications(payload: empty_pb2.Empty):
        return

    MOCK_JOBS = {
        "purge_login_tokens": Job(purge_login_tokens, timedelta(seconds=7)),
        "send_message_notifications": Job(send_message_notifications, timedelta(seconds=11)),
    }

    current_time = 0
    end_time = 70

    class EndOfTime(Exception):
        pass

    def mock_monotonic():
        return current_time

    def mock_sleep(seconds):
        nonlocal current_time
        current_time += seconds
        if current_time > end_time:
            raise EndOfTime()

    realized_schedule = []

    def mock_run_job_and_schedule(sched, job: Job[Any], frequency: timedelta) -> None:
        realized_schedule.append((current_time, job.name))
        _run_job_and_schedule(sched, job, frequency)

    monkeypatch.setattr(couchers.jobs.worker, "_run_job_and_schedule", mock_run_job_and_schedule)
    monkeypatch.setattr(couchers.jobs.worker, "JOBS", MOCK_JOBS)
    monkeypatch.setattr(couchers.jobs.worker, "monotonic", mock_monotonic)
    monkeypatch.setattr(couchers.jobs.worker, "sleep", mock_sleep)

    with pytest.raises(EndOfTime):
        run_scheduler()

    # Convert to job indices for comparison (to maintain test compatibility)
    job_order = ["purge_login_tokens", "send_message_notifications"]
    realized_schedule_indices = [(time, job_order.index(job_name)) for time, job_name in realized_schedule]

    assert realized_schedule_indices == [
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
    called_count = 0

    def mock_job(payload: empty_pb2.Empty) -> None:
        nonlocal called_count
        called_count += 1
        raise Exception()

    with session_scope() as session:
        queue_job(session, job=mock_job, payload=empty_pb2.Empty())

    MOCK_JOBS: dict[str, Job[Any]] = {
        "mock_job": Job(mock_job),
    }
    create_prometheus_server(port=8000)

    # if IN_TEST is true, then the bg worker will raise on exceptions
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


def test_send_message_notifications_basic(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    send_message_notifications(empty_pb2.Empty())
    process_jobs()

    # should find no jobs, since there's no messages
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )

    with conversations_session(token1) as c:
        group_chat_id1 = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id, user3.id])
        ).group_chat_id
    moderator.approve_group_chat(group_chat_id1)

    with conversations_session(token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id1, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id1, text="Test message 2"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id1, text="Test message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id1, text="Test message 4"))

    with conversations_session(token3) as c:
        group_chat_id2 = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id])
        ).group_chat_id
    moderator.approve_group_chat(group_chat_id2)

    with conversations_session(token3) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id2, text="Test message 5"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id2, text="Test message 6"))

    send_message_notifications(empty_pb2.Empty())
    process_jobs()

    # no emails sent out
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )

    # this should generate emails for both user2 and user3
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
        # delete them all
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

    # shouldn't generate any more emails
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


def test_send_message_notifications_muted(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    send_message_notifications(empty_pb2.Empty())
    process_jobs()

    # should find no jobs, since there's no messages
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
    moderator.approve_group_chat(group_chat_id)

    with conversations_session(token3) as c:
        # mute it for user 3
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
        moderator.approve_group_chat(group_chat_id)
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 5"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 6"))

    send_message_notifications(empty_pb2.Empty())
    process_jobs()

    # no emails sent out
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )

    # this should generate emails for both user2 and NOT user3
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
        # delete them all
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

    # shouldn't generate any more emails
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


def test_send_request_notifications_host_request(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    send_request_notifications(empty_pb2.Empty())
    process_jobs()

    # should find no jobs, since there's no messages
    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(BackgroundJob)).scalar_one() == 0

    with requests_session(token1) as requests:
        host_request_id = requests.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text=valid_request_text()
            )
        ).host_request_id
    moderator.approve_host_request(host_request_id)

    with session_scope() as session:
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

        # the only unseen message is the creation message, which the host was already
        # notified about via host_request__create — no missed_messages email
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )

    # test that responding to host request creates email
    with requests_session(token2) as requests:
        requests.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Test request",
            )
        )

    with session_scope() as session:
        # delete send_email BackgroundJob created by RespondHostRequest
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

        # check send_request_notifications successfully creates background job
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 1
        )

        # delete all BackgroundJobs
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()
        # should find no messages since guest has already been notified
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )


def test_send_request_notifications_host_request_with_followup(db, moderator):
    """
    When the surfer sends a follow-up message after creating the host request,
    the host should get a missed_messages notification (even though the initial
    creation message alone would be skipped).
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as requests:
        host_request_id = requests.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text=valid_request_text()
            )
        ).host_request_id
    moderator.approve_host_request(host_request_id)

    # surfer sends a follow-up message
    with requests_session(token1) as requests:
        requests.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="Following up on my request!")
        )

    with session_scope() as session:
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

        # now there are two unseen text messages for the host, so missed_messages should fire
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 1
        )


def test_send_request_notifications_two_requests_one_with_followup(db, moderator):
    """
    A host (user2) receives two requests: first from user1 (with a follow-up message),
    then from user3 (creation only). Because request B is created after request A's
    follow-up, it has a higher message ID. If the background job processes B first and
    advances last_notified_request_message_id past A's messages, one might expect A's
    notification to be lost — but it isn't, because the query results are already
    materialized before the loop begins.
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # request A: user1 -> user2, with a follow-up
    with requests_session(token1) as requests:
        host_request_a = requests.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text=valid_request_text()
            )
        ).host_request_id
    moderator.approve_host_request(host_request_a)

    with requests_session(token1) as requests:
        requests.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_a, text="Sorry, meant Tuesday night!")
        )

    # request B: user3 -> user2, creation only (higher message IDs than A's follow-up)
    with requests_session(token3) as requests:
        host_request_b = requests.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text=valid_request_text()
            )
        ).host_request_id
    moderator.approve_host_request(host_request_b)

    with session_scope() as session:
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

        # should get exactly 1 missed_messages email: for request A (has follow-up),
        # not request B (creation only, skipped)
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 1
        )


def test_send_message_notifications_seen(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_friends(user1, user2)

    send_message_notifications(empty_pb2.Empty())

    # should find no jobs, since there's no messages
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
        moderator.approve_group_chat(group_chat_id)
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

    send_message_notifications(empty_pb2.Empty())

    # no emails sent out
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        )

    def now_30_min_in_future():
        return now() + timedelta(minutes=30)

    # still shouldn't generate emails as user2 has seen all messages
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
    # needs to get first onboarding email
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

    # needs to get second onboarding email, but not yet
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

    # needs to get second onboarding email
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
    # need to test:
    # case 1: bidirectional (no emails)
    # case 2: host left ref (surfer needs an email)
    # case 3: surfer left ref (host needs an email)
    # case 4: neither left ref (host & surfer need an email)
    # case 5: neither left ref, but host blocked surfer, so neither should get an email
    # case 6: neither left ref, surfer indicated they didn't meet up, (host still needs an email)

    send_reference_reminders(empty_pb2.Empty())

    # case 1: bidirectional (no emails)
    user1, token1 = generate_user(email="user1@couchers.org.invalid", name="User 1")
    user2, token2 = generate_user(email="user2@couchers.org.invalid", name="User 2")

    # case 2: host left ref (surfer needs an email)
    # host
    user3, token3 = generate_user(email="user3@couchers.org.invalid", name="User 3")
    # surfer
    user4, token4 = generate_user(email="user4@couchers.org.invalid", name="User 4")

    # case 3: surfer left ref (host needs an email)
    # host
    user5, token5 = generate_user(email="user5@couchers.org.invalid", name="User 5")
    # surfer
    user6, token6 = generate_user(email="user6@couchers.org.invalid", name="User 6")

    # case 4: neither left ref (host & surfer need an email)
    # surfer
    user7, token7 = generate_user(email="user7@couchers.org.invalid", name="User 7")
    # host
    user8, token8 = generate_user(email="user8@couchers.org.invalid", name="User 8")

    # case 5: neither left ref, but host blocked surfer, so neither should get an email
    # surfer
    user9, token9 = generate_user(email="user9@couchers.org.invalid", name="User 9")
    # host
    user10, token10 = generate_user(email="user10@couchers.org.invalid", name="User 10")

    make_user_block(user9, user10)

    # case 6: neither left ref, surfer indicated they didn't meet up, (host still needs an email)
    # host
    user11, token11 = generate_user(email="user11@couchers.org.invalid", name="User 11")
    # surfer
    user12, token12 = generate_user(email="user12@couchers.org.invalid", name="User 12")

    with session_scope() as session:
        # note that create_host_reference creates a host request whose age is one day older than the timedelta here

        # case 1: bidirectional (no emails)
        ref1, hr1 = create_host_reference(session, user2.id, user1.id, timedelta(days=7), surfing=True)
        create_host_reference(session, user1.id, user2.id, timedelta(days=7), host_request_id=hr1)

        # case 2: host left ref (surfer needs an email)
        ref2, hr2 = create_host_reference(session, user3.id, user4.id, timedelta(days=11), surfing=False)

        # case 3: surfer left ref (host needs an email)
        ref3, hr3 = create_host_reference(session, user6.id, user5.id, timedelta(days=9), surfing=True)

        # case 4: neither left ref (host & surfer need an email)
        hr4 = create_host_request(session, user7.id, user8.id, timedelta(days=4))

        # case 5: neither left ref, but host blocked surfer, so neither should get an email
        hr5 = create_host_request(session, user9.id, user10.id, timedelta(days=7))

        # case 6: neither left ref, surfer indicated they didn't meet up, (host still needs an email)
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


def test_send_host_request_reminders(db, moderator):
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
    user11, token11 = generate_user(email="user11@couchers.org.invalid", name="User 11")
    user12, token12 = generate_user(email="user12@couchers.org.invalid", name="User 12")
    user13, token13 = generate_user(email="user13@couchers.org.invalid", name="User 13")
    user14, token14 = generate_user(email="user14@couchers.org.invalid", name="User 14")

    with session_scope() as session:
        # case 1: pending, future, interval elapsed => notify
        hr1 = create_host_request_by_date(
            session=session,
            surfer_user_id=user1.id,
            host_user_id=user2.id,
            from_date=today() + HOST_REQUEST_REMINDER_INTERVAL + timedelta(days=1),
            to_date=today() + HOST_REQUEST_REMINDER_INTERVAL + timedelta(days=2),
            status=HostRequestStatus.pending,
            host_sent_request_reminders=0,
            last_sent_request_reminder_time=now() - HOST_REQUEST_REMINDER_INTERVAL,
        )

        # case 2: max reminders reached => do not notify
        hr2 = create_host_request_by_date(
            session=session,
            surfer_user_id=user3.id,
            host_user_id=user4.id,
            from_date=today() + HOST_REQUEST_REMINDER_INTERVAL + timedelta(days=1),
            to_date=today() + HOST_REQUEST_REMINDER_INTERVAL + timedelta(days=2),
            status=HostRequestStatus.pending,
            host_sent_request_reminders=HOST_REQUEST_MAX_REMINDERS,
            last_sent_request_reminder_time=now() - HOST_REQUEST_REMINDER_INTERVAL,
        )

        # case 3: interval not yet elapsed => do not notify
        hr3 = create_host_request_by_date(
            session=session,
            surfer_user_id=user5.id,
            host_user_id=user6.id,
            from_date=today() + HOST_REQUEST_REMINDER_INTERVAL + timedelta(days=1),
            to_date=today() + HOST_REQUEST_REMINDER_INTERVAL + timedelta(days=2),
            status=HostRequestStatus.pending,
            host_sent_request_reminders=0,
            last_sent_request_reminder_time=now() - HOST_REQUEST_REMINDER_INTERVAL + timedelta(hours=1),
        )

        # case 4: start date is today => do not notify
        hr4 = create_host_request_by_date(
            session=session,
            surfer_user_id=user7.id,
            host_user_id=user8.id,
            from_date=today(),
            to_date=today() + timedelta(days=2),
            status=HostRequestStatus.pending,
            host_sent_request_reminders=0,
            last_sent_request_reminder_time=now() - HOST_REQUEST_REMINDER_INTERVAL,
        )

        # case 5: from_date in the past => do not notify
        hr5 = create_host_request_by_date(
            session=session,
            surfer_user_id=user9.id,
            host_user_id=user10.id,
            from_date=today() - timedelta(days=1),
            to_date=today() + timedelta(days=1),
            status=HostRequestStatus.pending,
            host_sent_request_reminders=0,
            last_sent_request_reminder_time=now() - HOST_REQUEST_REMINDER_INTERVAL,
        )

        # case 6: non-pending status => do not notify
        hr6 = create_host_request_by_date(
            session=session,
            surfer_user_id=user11.id,
            host_user_id=user12.id,
            from_date=today() + timedelta(days=3),
            to_date=today() + timedelta(days=4),
            status=HostRequestStatus.accepted,
            host_sent_request_reminders=0,
            last_sent_request_reminder_time=now() - HOST_REQUEST_REMINDER_INTERVAL,
        )

        # case 7: host already sent a message => do not notify
        hr7 = create_host_request_by_date(
            session=session,
            surfer_user_id=user13.id,
            host_user_id=user14.id,
            from_date=today() + HOST_REQUEST_REMINDER_INTERVAL + timedelta(days=1),
            to_date=today() + HOST_REQUEST_REMINDER_INTERVAL + timedelta(days=2),
            status=HostRequestStatus.pending,
            host_sent_request_reminders=0,
            last_sent_request_reminder_time=now() - HOST_REQUEST_REMINDER_INTERVAL,
        )

        msg = Message(
            conversation_id=hr7,
            author_id=user14.id,
            text="Looking forward to hosting you!",
            message_type=MessageType.text,
        )
        msg.time = now()
        session.add(msg)

    # Approve host requests so they're visible for notifications
    moderator.approve_host_request(hr1)
    moderator.approve_host_request(hr2)
    moderator.approve_host_request(hr3)
    moderator.approve_host_request(hr4)
    moderator.approve_host_request(hr5)
    moderator.approve_host_request(hr6)
    moderator.approve_host_request(hr7)

    send_host_request_reminders(empty_pb2.Empty())

    while process_job():
        pass

    with session_scope() as session:
        emails = [
            (email.recipient, email.subject, email.plain, email.html)
            for email in session.execute(select(Email).order_by(Email.recipient.asc())).scalars().all()
        ]

    expected_emails = [
        (
            "user2@couchers.org.invalid",
            "[TEST] You have a pending host request from User 1!",
            ("Please respond to the request!", "User 1"),
        )
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


def test_update_badges(db, push_collector: PushCollector):
    user1, _ = generate_user(last_donated=None)
    user2, _ = generate_user(last_donated=None)
    user3, _ = generate_user(last_donated=None)
    user4, _ = generate_user(phone="+15555555555", phone_verification_verified=func.now(), last_donated=None)
    user5, _ = generate_user(phone="+15555555556", phone_verification_verified=func.now(), last_donated=None)
    user6, _ = generate_user(last_donated=None)

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

    assert badge_tuples == expected  # type: ignore[comparison-overlap]

    print(push_collector.by_user)

    push = push_collector.pop_for_user(user1.id, last=False)
    assert push.content.title == "New profile badge: Founder"
    assert push.content.body == "The Founder badge was added to your profile."

    push = push_collector.pop_for_user(user1.id, last=True)
    assert push.content.title == "New profile badge: Board Member"
    assert push.content.body == "The Board Member badge was added to your profile."

    push = push_collector.pop_for_user(user2.id, last=False)
    assert push.content.title == "New profile badge: Founder"
    assert push.content.body == "The Founder badge was added to your profile."

    push = push_collector.pop_for_user(user2.id, last=True)
    assert push.content.title == "New profile badge: Board Member"
    assert push.content.body == "The Board Member badge was added to your profile."

    push = push_collector.pop_for_user(user4.id, last=True)
    assert push.content.title == "New profile badge: Verified Phone"
    assert push.content.body == "The Verified Phone badge was added to your profile."

    push = push_collector.pop_for_user(user5.id, last=False)
    assert push.content.title == "Profile badge removed"
    assert push.content.body == "The Board Member badge was removed from your profile."

    push = push_collector.pop_for_user(user5.id, last=True)
    assert push.content.title == "New profile badge: Verified Phone"
    assert push.content.body == "The Verified Phone badge was added to your profile."


def test_send_request_notifications_blocked_users_no_notification(db, moderator):
    """
    Regression test: send_request_notifications should not send notifications
    when the host and surfer are not visible to each other (e.g., one blocked the other).
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request
    with requests_session(token1) as requests:
        host_request_id = requests.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text=valid_request_text()
            )
        ).host_request_id
    moderator.approve_host_request(host_request_id)

    with session_scope() as session:
        # delete send_email BackgroundJob created by CreateHostRequest
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

    # Now user2 (host) blocks user1 (surfer)
    make_user_block(user2, user1)

    with session_scope() as session:
        # check send_request_notifications does NOT create background job because users are blocked
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()

        # Should be 0 emails because the host blocked the surfer
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        ), "No notification email should be sent when host has blocked surfer"

    # Also test the reverse direction: surfer sends message to host, host should not get notification
    # First unblock
    with session_scope() as session:
        session.execute(delete(UserBlock).execution_options(synchronize_session=False))
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

    # Host responds
    with requests_session(token2) as requests:
        requests.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Accepting your request",
            )
        )

    with session_scope() as session:
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

    # Now user1 (surfer) blocks user2 (host)
    make_user_block(user1, user2)

    with session_scope() as session:
        # check send_request_notifications does NOT create background job
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            send_request_notifications(empty_pb2.Empty())
            process_jobs()

        # Should be 0 emails because the surfer blocked the host
        assert (
            session.execute(
                select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
            ).scalar_one()
            == 0
        ), "No notification email should be sent when surfer has blocked host"


def test_send_host_request_reminders_blocked_users_no_notification(db, moderator):
    """
    send_host_request_reminders should not send notifications when the host and surfer are not visible to each other
    (e.g., one blocked the other).
    """
    user1, token1 = generate_user(email="user1@couchers.org.invalid", name="User 1")
    user2, token2 = generate_user(email="user2@couchers.org.invalid", name="User 2")

    with session_scope() as session:
        # Create a pending host request where the host has not replied
        hr = create_host_request_by_date(
            session=session,
            surfer_user_id=user1.id,
            host_user_id=user2.id,
            from_date=today() + HOST_REQUEST_REMINDER_INTERVAL + timedelta(days=1),
            to_date=today() + HOST_REQUEST_REMINDER_INTERVAL + timedelta(days=2),
            status=HostRequestStatus.pending,
            host_sent_request_reminders=0,
            last_sent_request_reminder_time=now() - HOST_REQUEST_REMINDER_INTERVAL,
        )

    # Approve the host request so it's visible for notifications
    moderator.approve_host_request(hr)

    # Verify that without blocking, a reminder would be sent
    send_host_request_reminders(empty_pb2.Empty())

    while process_job():
        pass

    with session_scope() as session:
        emails = session.execute(select(Email)).scalars().all()
        assert len(emails) == 1, "Expected 1 reminder email before blocking"

        # Clean up emails and background jobs
        session.execute(delete(Email).execution_options(synchronize_session=False))
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

        # Reset the reminder counter so we can test again
        host_request = session.execute(select(HostRequest).where(HostRequest.conversation_id == hr)).scalar_one()
        host_request.recipient_sent_request_reminders = 0
        host_request.last_sent_request_reminder_time = now() - HOST_REQUEST_REMINDER_INTERVAL

    # Now have the host block the surfer
    make_user_block(user2, user1)

    send_host_request_reminders(empty_pb2.Empty())

    while process_job():
        pass

    with session_scope() as session:
        emails = session.execute(select(Email)).scalars().all()
        assert len(emails) == 0, "No reminder email should be sent when host has blocked surfer"


def test_send_message_notifications_blocked_users_no_notification(db, moderator):
    """
    Regression test: send_message_notifications should not send notifications
    for messages from users who are blocked by the recipient.
    """
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_friends(user1, user2)

    # Create a group chat and send messages
    with conversations_session(token1) as c:
        group_chat_id = c.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id])
        ).group_chat_id

    # Approve the group chat so it's visible for notifications
    moderator.approve_group_chat(group_chat_id)

    with conversations_session(token1) as c:
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Test message 2"))

    # Verify that without blocking, a notification would be sent
    with session_scope() as session:
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        send_message_notifications(empty_pb2.Empty())
        process_jobs()

    with session_scope() as session:
        email_job_count = session.execute(
            select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
        ).scalar_one()
        assert email_job_count == 1, "Expected 1 notification email before blocking"

        # Clean up
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

    # Reset the notification state so user2 will receive notifications for old messages again
    with session_scope() as session:
        u2 = session.execute(select(User).where(User.id == user2.id)).scalar_one()
        u2.last_notified_message_id = 0

    # Now have user2 block user1
    make_user_block(user2, user1)

    # The existing messages from user1 should now NOT trigger notifications
    # since user2 has blocked user1
    with session_scope() as session:
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        send_message_notifications(empty_pb2.Empty())
        process_jobs()

    with session_scope() as session:
        email_job_count = session.execute(
            select(func.count()).select_from(BackgroundJob).where(BackgroundJob.job_type == "send_email")
        ).scalar_one()
        assert email_job_count == 0, "No notification email should be sent when recipient has blocked sender"


def test_update_badges_volunteers(db, push_collector: PushCollector):
    """Test that volunteer and past_volunteer badges are automatically granted based on Volunteer model."""
    # Create 6 users - users 1 and 2 get founder/board_member badges from static_badges
    user1, _ = generate_user(last_donated=None)
    user2, _ = generate_user(last_donated=None)
    user3, _ = generate_user(last_donated=None)
    user4, _ = generate_user(last_donated=None)
    user5, _ = generate_user(last_donated=None)
    user6, _ = generate_user(last_donated=None)

    with session_scope() as session:
        # user3: active volunteer (stopped_volunteering is null)
        session.add(
            make_volunteer(
                user_id=user3.id,
                role="Developer",
                started_volunteering=date(2020, 1, 1),
                stopped_volunteering=None,
            )
        )

        # user4: past volunteer (stopped_volunteering is set)
        session.add(
            make_volunteer(
                user_id=user4.id,
                role="Designer",
                started_volunteering=date(2020, 1, 1),
                stopped_volunteering=date(2023, 6, 1),
            )
        )

        # user5: has old volunteer badge that should be removed (not a volunteer anymore)
        session.add(UserBadge(user_id=user5.id, badge_id="volunteer"))

        # user6: has old past_volunteer badge that should be removed
        session.add(UserBadge(user_id=user6.id, badge_id="past_volunteer"))

    update_badges(empty_pb2.Empty())
    process_jobs()

    with session_scope() as session:
        # Check user3 has volunteer badge
        user3_badges = session.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user3.id)).scalars().all()
        assert "volunteer" in user3_badges
        assert "past_volunteer" not in user3_badges

        # Check user4 has past_volunteer badge
        user4_badges = session.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user4.id)).scalars().all()
        assert "past_volunteer" in user4_badges
        assert "volunteer" not in user4_badges

        # Check user5 lost the volunteer badge (not in Volunteer table)
        user5_badges = session.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user5.id)).scalars().all()
        assert "volunteer" not in user5_badges

        # Check user6 lost the past_volunteer badge (not in Volunteer table)
        user6_badges = session.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user6.id)).scalars().all()
        assert "past_volunteer" not in user6_badges

    # Check notifications for volunteer badge users
    push = push_collector.pop_for_user(user3.id, last=True)
    assert push.content.title == "New profile badge: Active Volunteer"
    assert push.content.body == "The Active Volunteer badge was added to your profile."

    push = push_collector.pop_for_user(user4.id, last=True)
    assert push.content.title == "New profile badge: Past Volunteer"
    assert push.content.body == "The Past Volunteer badge was added to your profile."

    push = push_collector.pop_for_user(user5.id, last=True)
    assert push.content.title == "Profile badge removed"
    assert push.content.body == "The Active Volunteer badge was removed from your profile."

    push = push_collector.pop_for_user(user6.id, last=True)
    assert push.content.title == "Profile badge removed"
    assert push.content.body == "The Past Volunteer badge was removed from your profile."


def test_update_badges_volunteer_status_change(db, push_collector: PushCollector):
    """Test that badge is updated when volunteer status changes from active to past."""
    # Create users - users 1 and 2 get founder/board_member badges from static_badges
    user1, _ = generate_user(last_donated=None)
    user2, _ = generate_user(last_donated=None)
    user3, _ = generate_user(last_donated=None)

    with session_scope() as session:
        # user3: start as active volunteer
        session.add(
            make_volunteer(
                user_id=user3.id,
                role="Developer",
                started_volunteering=date(2020, 1, 1),
                stopped_volunteering=None,
                show_on_team_page=True,
            )
        )

    update_badges(empty_pb2.Empty())
    process_jobs()

    with session_scope() as session:
        user3_badges = session.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user3.id)).scalars().all()
        assert "volunteer" in user3_badges
        assert "past_volunteer" not in user3_badges

    push = push_collector.pop_for_user(user3.id, last=True)
    assert push.content.title == "New profile badge: Active Volunteer"
    assert push.content.body == "The Active Volunteer badge was added to your profile."

    # Now change the volunteer to past volunteer
    with session_scope() as session:
        volunteer = session.execute(select(Volunteer).where(Volunteer.user_id == user3.id)).scalar_one()
        volunteer.stopped_volunteering = date(2023, 12, 1)

    update_badges(empty_pb2.Empty())
    process_jobs()

    with session_scope() as session:
        user3_badges = session.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user3.id)).scalars().all()
        assert "volunteer" not in user3_badges
        assert "past_volunteer" in user3_badges

    # Check both badges were updated
    push = push_collector.pop_for_user(user3.id, last=False)
    assert push.content.title == "Profile badge removed"
    assert push.content.body == "The Active Volunteer badge was removed from your profile."

    push = push_collector.pop_for_user(user3.id, last=True)
    assert push.content.title == "New profile badge: Past Volunteer"
    assert push.content.body == "The Past Volunteer badge was added to your profile."


def test_send_message_notifications_empty_unseen_simple(monkeypatch):
    class DummyUser:
        id = 1
        is_visible = True
        last_notified_message_id = 0

    class FirstResult:
        def scalars(self):
            return self

        def unique(self):
            return [DummyUser()]

    class SecondResult:
        def all(self):
            return []

    class DummySession:
        def __init__(self):
            self.calls = 0

        def execute(self, *a, **k):
            self.calls += 1
            return FirstResult() if self.calls == 1 else SecondResult()

        def commit(self):
            pass

        def flush(self):
            pass

    def fake_session_scope():
        class Ctx:
            def __enter__(self):
                return DummySession()

            def __exit__(self, exc_type, exc, tb):
                pass

        return Ctx()

    monkeypatch.setattr(handlers, "session_scope", fake_session_scope)

    handlers.send_message_notifications(Empty())
