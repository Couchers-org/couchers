import threading
from datetime import timedelta

from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    Gauge,
    Histogram,
    exposition,
    generate_latest,
    multiprocess,
)
from prometheus_client.registry import CollectorRegistry
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.models import BackgroundJob, EventOccurrenceAttendee, HostingStatus, HostRequest, Message, Reference, User
from couchers.sql import couchers_select as select

registry = CollectorRegistry()
multiprocess.MultiProcessCollector(registry)

_INF = float("inf")

jobs_duration_histogram = Histogram(
    "couchers_background_jobs_seconds",
    "Durations of background jobs",
    labelnames=["job", "status", "attempt", "exception"],
)


def observe_in_jobs_duration_histogram(job_type, job_state, try_count, exception_name, duration_s):
    jobs_duration_histogram.labels(job_type, job_state, str(try_count), exception_name).observe(duration_s)


jobs_queued_histogram = Histogram(
    "couchers_background_jobs_queued_seconds",
    "Time background job spent queued before being picked up",
    buckets=(0.01, 0.05, 0.1, 0.5, 1.0, 2.5, 5.0, 10, 20, 30, 40, 50, 60, 90, 120, 300, 600, 1800, 3600, _INF),
)


servicer_duration_histogram = Histogram(
    "couchers_servicer_duration_seconds",
    "Durations of processing gRPC calls",
    labelnames=["method", "logged_in", "code", "exception"],
)


def observe_in_servicer_duration_histogram(method, user_id, status_code, exception_type, duration_s):
    servicer_duration_histogram.labels(method, user_id is not None, status_code, exception_type).observe(duration_s)


# list of gauge names and function to execute to set value to
# the python prometheus client does not support Gauge.set_function, so instead we hack around it and set each gauge just
# before collection with this
_set_hacky_gauges_funcs = []


def _make_gauge_from_query(name, description, statement):
    """
    Given a name, description and statement that is a sqlalchemy statement, creates a gauge from it

    statement should be a sqlalchemy SELECT statement that returns a single number
    """

    def f():
        with session_scope() as session:
            return session.execute(statement).scalar_one()

    gauge = Gauge(name, description, multiprocess_mode="mostrecent")
    _set_hacky_gauges_funcs.append((gauge, f))
    return gauge


active_users_gauges = [
    _make_gauge_from_query(
        f"couchers_active_users_{name}",
        f"Number of active users in the last {description}",
        (select(func.count()).select_from(User).where(User.is_visible).where(User.last_active > func.now() - interval)),
    )
    for name, description, interval in [
        ("5m", "5 min", timedelta(minutes=5)),
        ("24h", "24 hours", timedelta(hours=24)),
        ("1month", "1 month", timedelta(days=31)),
        ("3month", "3 months", timedelta(days=92)),
        ("6month", "6 months", timedelta(days=183)),
        ("12month", "12 months", timedelta(days=365)),
    ]
]

users_gauge = _make_gauge_from_query(
    "couchers_users", "Total number of users", select(func.count()).select_from(User).where(User.is_visible)
)

man_gauge = _make_gauge_from_query(
    "couchers_users_man",
    "Total number of users with gender 'Man'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.gender == "Man"),
)

woman_gauge = _make_gauge_from_query(
    "couchers_users_woman",
    "Total number of users with gender 'Woman'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.gender == "Woman"),
)

nonbinary_gauge = _make_gauge_from_query(
    "couchers_users_nonbinary",
    "Total number of users with gender 'Non-binary'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.gender == "Non-binary"),
)

can_host_gauge = _make_gauge_from_query(
    "couchers_users_can_host",
    "Total number of users with hosting status 'can_host'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.hosting_status == HostingStatus.can_host),
)

cant_host_gauge = _make_gauge_from_query(
    "couchers_users_cant_host",
    "Total number of users with hosting status 'cant_host'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.hosting_status == HostingStatus.cant_host),
)

maybe_gauge = _make_gauge_from_query(
    "couchers_users_maybe",
    "Total number of users with hosting status 'maybe'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.hosting_status == HostingStatus.maybe),
)

completed_profile_gauge = _make_gauge_from_query(
    "couchers_users_completed_profile",
    "Total number of users with a completed profile",
    select(func.count()).select_from(User).where(User.is_visible).where(User.has_completed_profile),
)

sent_message_gauge = _make_gauge_from_query(
    "couchers_users_sent_message",
    "Total number of users who have sent a message",
    (
        select(func.count()).select_from(
            select(User.id)
            .where(User.is_visible)
            .join(Message, Message.author_id == User.id)
            .group_by(User.id)
            .subquery()
        )
    ),
)

sent_request_gauge = _make_gauge_from_query(
    "couchers_users_sent_request",
    "Total number of users who have sent a host request",
    (
        select(func.count()).select_from(
            select(User.id)
            .where(User.is_visible)
            .join(HostRequest, HostRequest.surfer_user_id == User.id)
            .group_by(User.id)
            .subquery()
        )
    ),
)

has_reference_gauge = _make_gauge_from_query(
    "couchers_users_has_reference",
    "Total number of users who have a reference",
    (
        select(func.count()).select_from(
            select(User.id)
            .where(User.is_visible)
            .join(Reference, Reference.to_user_id == User.id)
            .group_by(User.id)
            .subquery()
        )
    ),
)

rsvpd_to_event_gauge = _make_gauge_from_query(
    "couchers_users_rsvpd_to_event",
    "Total number of users who have RSVPd to an event",
    (
        select(func.count()).select_from(
            select(User.id)
            .where(User.is_visible)
            .join(EventOccurrenceAttendee, EventOccurrenceAttendee.user_id == User.id)
            .group_by(User.id)
            .subquery()
        )
    ),
)

background_jobs_ready_to_execute_gauge = _make_gauge_from_query(
    "couchers_background_jobs_ready_to_execute",
    "Total number of background jobs ready to execute",
    select(func.count()).select_from(BackgroundJob).where(BackgroundJob.ready_for_retry),
)

background_jobs_serialization_errors_counter = Counter(
    "couchers_background_jobs_serialization_errors_total",
    "Number of times a bg worker has a serialization error",
)

background_jobs_no_jobs_counter = Counter(
    "couchers_background_jobs_no_jobs_total",
    "Number of times a bg worker tries to grab a job but there is none",
)

background_jobs_got_job_counter = Counter(
    "couchers_background_jobs_got_job_total",
    "Number of times a bg worker grabbed a job",
)


signup_initiations_counter = Counter(
    "couchers_signup_initiations_total",
    "Number of initiated signups",
)
signup_completions_counter = Counter(
    "couchers_signup_completions_total",
    "Number of completed signups",
    labelnames=["gender"],
)
signup_time_histogram = Histogram(
    "couchers_signup_time_seconds",
    "Time taken for a user to sign up",
    labelnames=["gender"],
    buckets=(30, 60, 90, 120, 180, 240, 300, 360, 420, 480, 540, 600, 900, 1200, 1800, 3600, 7200, _INF),
)

logins_counter = Counter(
    "couchers_logins_total",
    "Number of logins",
    labelnames=["gender"],
)

password_reset_initiations_counter = Counter(
    "couchers_password_reset_initiations_total",
    "Number of password reset initiations",
)
password_reset_completions_counter = Counter(
    "couchers_password_reset_completions_total",
    "Number of password reset completions",
)

account_deletion_initiations_counter = Counter(
    "couchers_account_deletion_initiations_total",
    "Number of account deletion initiations",
    labelnames=["gender"],
)
account_deletion_completions_counter = Counter(
    "couchers_account_deletion_completions_total",
    "Number of account deletion completions",
    labelnames=["gender"],
)
account_recoveries_counter = Counter(
    "couchers_account_recoveries_total",
    "Number of account recoveries",
    labelnames=["gender"],
)

strong_verification_initiations_counter = Counter(
    "couchers_strong_verification_initiations_total",
    "Number of strong verification initiations",
    labelnames=["gender"],
)
strong_verification_completions_counter = Counter(
    "couchers_strong_verification_completions_total",
    "Number of strong verification completions",
)
strong_verification_data_deletions_counter = Counter(
    "couchers_strong_verification_data_deletions_total",
    "Number of strong verification data deletions",
    labelnames=["gender"],
)

host_requests_sent_counter = Counter(
    "couchers_host_requests_total",
    "Number of host requests sent",
    labelnames=["from_gender", "to_gender"],
)
host_request_responses_counter = Counter(
    "couchers_host_requests_responses_total",
    "Number of responses to host requests",
    labelnames=["responder_gender", "other_gender", "response_type"],
)

sent_messages_counter = Counter(
    "couchers_sent_messages_total",
    "Number of messages sent",
    labelnames=["gender", "message_type"],
)


host_request_first_response_histogram = Histogram(
    "couchers_host_request_first_response_seconds",
    "Response time to host requests",
    labelnames=["host_gender", "surfer_gender", "response_type"],
    buckets=(
        1 * 60,  # 1m
        2 * 60,  # 2m
        5 * 60,  # 5m
        10 * 60,  # 10m
        15 * 60,  # 15m
        30 * 60,  # 30m
        45 * 60,  # 45m
        3_600,  # 1h
        2 * 3_600,  # 2h
        3 * 3_600,  # 3h
        6 * 3_600,  # 6h
        12 * 3_600,  # 12h
        86_400,  # 24h
        2 * 86_400,  # 2d
        5 * 86_400,  # 4d
        602_000,  # 1w
        2 * 602_000,  # 2w
        3 * 602_000,  # 3w
        4 * 602_000,  # 4w
        _INF,
    ),
)
account_age_on_host_request_create_histogram = Histogram(
    "couchers_account_age_on_host_request_create_histogram_seconds",
    "Age of account sending a host request",
    labelnames=["surfer_gender", "host_gender"],
    buckets=(
        5 * 60,  # 5m
        10 * 60,  # 10m
        15 * 60,  # 15m
        30 * 60,  # 30m
        45 * 60,  # 45m
        3_600,  # 1h
        2 * 3_600,  # 2h
        3 * 3_600,  # 3h
        6 * 3_600,  # 6h
        12 * 3_600,  # 12h
        86_400,  # 24h
        2 * 86_400,  # 2d
        3 * 86_400,  # 3d
        4 * 86_400,  # 4d
        5 * 86_400,  # 5d
        6 * 86_400,  # 6d
        602_000,  # 1w
        2 * 602_000,  # 2w
        3 * 602_000,  # 3w
        4 * 602_000,  # 4w
        5 * 602_000,  # 5w
        10 * 602_000,  # 10w
        25 * 602_000,  # 25w
        52 * 602_000,  # 52w
        104 * 602_000,  # 104w
        _INF,
    ),
)


def create_prometheus_server(port):
    """custom start method to fix problem descrbied in https://github.com/prometheus/client_python/issues/155"""

    def app(environ, start_response):
        # set hacky gauges
        for gauge, f in _set_hacky_gauges_funcs:
            gauge.set(f())

        data = generate_latest(registry)
        start_response("200 OK", [("Content-type", CONTENT_TYPE_LATEST), ("Content-Length", str(len(data)))])
        return [data]

    httpd = exposition.make_server(
        "", port, app, exposition.ThreadingWSGIServer, handler_class=exposition._SilentHandler
    )
    t = threading.Thread(target=httpd.serve_forever)
    t.daemon = True
    t.start()
    return httpd
