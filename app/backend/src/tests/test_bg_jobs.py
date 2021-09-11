from datetime import timedelta
from unittest.mock import patch

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
    process_add_users_to_email_list,
    process_send_message_notifications,
    process_send_onboarding_emails,
    process_send_reference_reminders,
    process_send_request_notifications,
)
from couchers.jobs.worker import _run_job_and_schedule, process_job, run_scheduler, service_jobs
from couchers.metrics import create_prometheus_server, job_process_registry
from couchers.models import BackgroundJob, BackgroundJobState, BackgroundJobType, Email, LoginToken
from couchers.sql import couchers_select as select
from couchers.tasks import send_login_email
from couchers.utils import now, today
from proto import conversations_pb2, requests_pb2
from tests.test_fixtures import (  # noqa
    auth_api_session,
    conversations_session,
    db,
    generate_user,
    make_friends,
    make_user_block,
    requests_session,
    testconfig,
)
from tests.test_references import create_host_reference, create_host_request


def now_5_min_in_future():
    return now() + timedelta(minutes=5)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _check_job_counter(job, status, attempt, exception):
    metrics_string = requests.get("http://localhost:8001").text
    string_to_check = f'attempt="{attempt}",exception="{exception}",job="{job}",status="{status}"'
    assert string_to_check in metrics_string


def test_login_email_full(db):
    user, api_token = generate_user()
    user_email = user.email

    with session_scope() as session:
        login_token = send_login_email(session, user)

        def mock_print_dev_email(sender_name, sender_email, recipient, subject, plain, html):
            assert recipient == user.email
            assert "login" in subject.lower()
            assert login_token.token in plain
            assert login_token.token in html
            return print_dev_email(sender_name, sender_email, recipient, subject, plain, html)

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

    queue_job(BackgroundJobType.purge_login_tokens, empty_pb2.Empty())
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


def test_enforce_community_memberships(db):
    queue_job(BackgroundJobType.enforce_community_membership, empty_pb2.Empty())
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
        (BackgroundJobType.purge_login_tokens, timedelta(seconds=7)),
        (BackgroundJobType.send_message_notifications, timedelta(seconds=11)),
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
    queue_job(BackgroundJobType.purge_login_tokens, empty_pb2.Empty())

    called_count = 0

    def mock_handler(payload):
        nonlocal called_count
        called_count += 1
        raise Exception()

    MOCK_JOBS = {
        BackgroundJobType.purge_login_tokens: (empty_pb2.Empty, mock_handler),
    }
    create_prometheus_server(registry=job_process_registry, port=8001)
    with patch("couchers.jobs.worker.JOBS", MOCK_JOBS):
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

    _check_job_counter("purge_login_tokens", "error", "4", "Exception")
    _check_job_counter("purge_login_tokens", "failed", "5", "Exception")


def test_no_jobs_no_problem(db):
    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(BackgroundJob)).scalar_one() == 0

    assert not process_job()

    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(BackgroundJob)).scalar_one() == 0


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
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 0
        )

    with conversations_session(token1) as c:
        chat_id = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id, user3.id])).chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 2"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 4"))

    with conversations_session(token3) as c:
        chat_id = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id])).chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 5"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 6"))

    process_send_message_notifications(empty_pb2.Empty())

    # no emails sent out
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 0
        )

    # this should generate emails for both user2 and user3
    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        process_send_message_notifications(empty_pb2.Empty())

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 2
        )
        # delete them all
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

    # shouldn't generate any more emails
    with patch("couchers.jobs.handlers.now", now_5_min_in_future):
        process_send_message_notifications(empty_pb2.Empty())

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 0
        )


def test_process_send_request_notifications_host_request(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    process_send_request_notifications(empty_pb2.Empty())

    # should find no jobs, since there's no messages
    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(BackgroundJob)).scalar_one() == 0

    # first test that sending host request creates email
    with requests_session(token1) as requests:
        host_request_id = requests.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
            )
        ).host_request_id

    with session_scope() as session:
        # delete send_email BackgroundJob created by CreateHostRequest
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

        # check process_send_request_notifications successfully creates background job
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            process_send_request_notifications(empty_pb2.Empty())
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 1
        )

        # delete all BackgroundJobs
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            process_send_request_notifications(empty_pb2.Empty())
        # should find no messages since host has already been notified
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 0
        )

    # then test that responding to host request creates email
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

        # check process_send_request_notifications successfully creates background job
        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            process_send_request_notifications(empty_pb2.Empty())
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 1
        )

        # delete all BackgroundJobs
        session.execute(delete(BackgroundJob).execution_options(synchronize_session=False))

        with patch("couchers.jobs.handlers.now", now_5_min_in_future):
            process_send_request_notifications(empty_pb2.Empty())
        # should find no messages since guest has already been notified
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 0
        )


def test_process_send_message_notifications_seen(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_friends(user1, user2)

    process_send_message_notifications(empty_pb2.Empty())

    # should find no jobs, since there's no messages
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 0
        )

    with conversations_session(token1) as c:
        chat_id = c.CreateChat(conversations_pb2.CreateChatReq(recipient_user_ids=[user2.id])).chat_id
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 1"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 2"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 3"))
        c.SendMessage(conversations_pb2.SendMessageReq(chat_id=chat_id, text="Test message 4"))

    # user 2 now marks those messages as seen
    with conversations_session(token2) as c:
        m_id = c.GetChat(conversations_pb2.GetChatReq(chat_id=chat_id)).latest_message.message_id
        c.MarkLastSeenChat(conversations_pb2.MarkLastSeenChatReq(chat_id=chat_id, last_seen_message_id=m_id))

    process_send_message_notifications(empty_pb2.Empty())

    # no emails sent out
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 0
        )

    def now_30_min_in_future():
        return now() + timedelta(minutes=30)

    # still shouldn't generate emails as user2 has seen all messages
    with patch("couchers.jobs.handlers.now", now_30_min_in_future):
        process_send_message_notifications(empty_pb2.Empty())

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 0
        )


def test_process_send_onboarding_emails(db):
    # needs to get first onboarding email
    user1, token1 = generate_user(onboarding_emails_sent=0, last_onboarding_email_sent=None)

    process_send_onboarding_emails(empty_pb2.Empty())

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 1
        )

    # needs to get second onboarding email, but not yet
    user2, token2 = generate_user(onboarding_emails_sent=1, last_onboarding_email_sent=now() - timedelta(days=6))

    process_send_onboarding_emails(empty_pb2.Empty())

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 1
        )

    # needs to get second onboarding email
    user3, token3 = generate_user(onboarding_emails_sent=1, last_onboarding_email_sent=now() - timedelta(days=8))

    process_send_onboarding_emails(empty_pb2.Empty())

    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(BackgroundJob)
                .where(BackgroundJob.job_type == BackgroundJobType.send_email)
            ).scalar_one()
            == 2
        )


def test_process_send_reference_reminders(db):
    # need to test:
    # case 1: bidirectional (no emails)
    # case 2: host left ref (surfer needs an email)
    # case 3: surfer left ref (host needs an email)
    # case 4: neither left ref (host & surfer need an email)

    process_send_reference_reminders(empty_pb2.Empty())

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
    # host
    user7, token7 = generate_user(email="user7@couchers.org.invalid", name="User 7")
    # surfer
    user8, token8 = generate_user(email="user8@couchers.org.invalid", name="User 8")

    # case 5: neither left ref, but host blocked surfer, so neither should get an email
    # host
    user9, token9 = generate_user(email="user9@couchers.org.invalid", name="User 9")
    # surfer
    user10, token10 = generate_user(email="user10@couchers.org.invalid", name="User 10")

    make_user_block(user9, user10)

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

    expected_emails = [
        ("user4@couchers.org.invalid", "You have 3 days to write a reference for User 3!"),
        ("user5@couchers.org.invalid", "You have 7 days to write a reference for User 6!"),
        ("user7@couchers.org.invalid", "You have 12 days to write a reference for User 8!"),
        ("user8@couchers.org.invalid", "You have 12 days to write a reference for User 7!"),
    ]

    process_send_reference_reminders(empty_pb2.Empty())

    while process_job():
        pass

    with session_scope() as session:
        emails = [
            (email.recipient, email.subject)
            for email in session.execute(select(Email).order_by(Email.recipient.asc())).scalars().all()
        ]

        print(emails)
        print(expected_emails)

        assert emails == expected_emails


def test_process_add_users_to_email_list(db):
    new_config = config.copy()
    new_config["MAILCHIMP_ENABLED"] = True
    new_config["MAILCHIMP_API_KEY"] = "dummy_api_key"
    new_config["MAILCHIMP_DC"] = "dc99"
    new_config["MAILCHIMP_LIST_ID"] = "dummy_list_id"

    with patch("couchers.config.config", new_config):
        with patch("couchers.jobs.handlers.requests.post") as mock:
            process_add_users_to_email_list(empty_pb2.Empty())
        mock.assert_not_called()

        generate_user(added_to_mailing_list=False, email="testing1@couchers.invalid", name="Tester1")
        generate_user(added_to_mailing_list=True, email="testing2@couchers.invalid", name="Tester2")
        generate_user(added_to_mailing_list=False, email="testing3@couchers.invalid", name="Tester3 von test")

        with patch("couchers.jobs.handlers.requests.post") as mock:
            ret = mock.return_value
            ret.status_code = 200
            process_add_users_to_email_list(empty_pb2.Empty())

        mock.assert_called_once_with(
            "https://dc99.api.mailchimp.com/3.0/lists/dummy_list_id",
            auth=("apikey", "dummy_api_key"),
            json={
                "members": [
                    {
                        "email_address": "testing1@couchers.invalid",
                        "status_if_new": "subscribed",
                        "status": "subscribed",
                        "merge_fields": {
                            "FNAME": "Tester1",
                        },
                    },
                    {
                        "email_address": "testing3@couchers.invalid",
                        "status_if_new": "subscribed",
                        "status": "subscribed",
                        "merge_fields": {
                            "FNAME": "Tester3 von test",
                        },
                    },
                ]
            },
        )

        with patch("couchers.jobs.handlers.requests.post") as mock:
            process_add_users_to_email_list(empty_pb2.Empty())
        mock.assert_not_called()
