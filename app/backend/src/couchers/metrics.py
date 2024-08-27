import threading
from datetime import timedelta

from prometheus_client import Counter, Gauge, Histogram, exposition
from prometheus_client.registry import CollectorRegistry
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.models import User
from couchers.sql import couchers_select as select
from couchers.utils import now

JOB_LABEL = "job"
ATTEMPT_LABEL = "attempt"
STATUS_LABEL = "status"
METHOD_LABEL = "method"
CODE_LABEL = "code"
EXCEPTION_LABEL = "exception"

main_process_registry = CollectorRegistry()
job_process_registry = CollectorRegistry()


jobs_duration_histogram = Histogram(
    "couchers_background_jobs_seconds",
    "Durations of background jobs",
    labelnames=(JOB_LABEL, STATUS_LABEL, ATTEMPT_LABEL, EXCEPTION_LABEL),
    registry=job_process_registry,
)


def observe_in_jobs_duration_histogram(job_type, job_state, try_count, exception_name, duration_s):
    jobs_duration_histogram.labels(job_type, job_state, str(try_count), exception_name).observe(duration_s)


servicer_duration_histogram = Histogram(
    "couchers_servicer_duration_seconds",
    "Durations of processing gRPC calls",
    labelnames=(METHOD_LABEL, CODE_LABEL, EXCEPTION_LABEL),
    registry=main_process_registry,
)


def observe_in_servicer_duration_histogram(method, status_code, exception_type, duration_s):
    servicer_duration_histogram.labels(method, status_code, exception_type).observe(duration_s)


def _get_active_users_5m():
    with session_scope() as session:
        return session.execute(
            select(func.count())
            .select_from(User)
            .where(User.is_visible)
            .where(User.last_active > now() - timedelta(minutes=5))
        ).scalar_one()


active_users_5m_gauge = Gauge(
    "couchers_active_users_5m",
    "Number of active users in the last 5 min",
    registry=main_process_registry,
)
active_users_5m_gauge.set_function(_get_active_users_5m)


def _get_users():
    with session_scope() as session:
        return session.execute(select(func.count()).select_from(User).where(User.is_visible)).scalar_one()


users_gauge = Gauge(
    "couchers_users",
    "Total number of users",
    registry=main_process_registry,
)
users_gauge.set_function(_get_users)


signup_initiations_counter = Counter(
    "couchers_signup_initiations_total",
    "Number of initiated signups",
    registry=main_process_registry,
)

signup_completions_counter = Counter(
    "couchers_signup_completions_total",
    "Number of completed signups",
    registry=main_process_registry,
)

logins_counter = Counter(
    "couchers_logins_total",
    "Number of logins",
    registry=main_process_registry,
)

password_reset_initiations_counter = Counter(
    "couchers_password_reset_initiations_total",
    "Number of password reset initiations",
    registry=main_process_registry,
)
password_reset_completions_counter = Counter(
    "couchers_password_reset_completions_total",
    "Number of password reset completions",
    registry=main_process_registry,
)

account_deletion_initiations_counter = Counter(
    "couchers_account_deletion_initiations_total",
    "Number of account deletion initiations",
    registry=main_process_registry,
)
account_deletion_completions_counter = Counter(
    "couchers_account_deletion_completions_total",
    "Number of account deletion completions",
    registry=main_process_registry,
)
account_recoveries_counter = Counter(
    "couchers_account_recoveries_total",
    "Number of account recoveries",
    registry=main_process_registry,
)

strong_verification_initiations_counter = Counter(
    "couchers_strong_verification_initiations_total",
    "Number of strong verification initiations",
    registry=main_process_registry,
)
strong_verification_completions_counter = Counter(
    "couchers_strong_verification_completions_total",
    "Number of strong verification completions",
    registry=main_process_registry,
)
strong_verification_data_deletions_counter = Counter(
    "couchers_strong_verification_data_deletions_total",
    "Number of strong verification data deletions",
    registry=main_process_registry,
)


def create_prometheus_server(registry, port):
    """custom start method to fix problem descrbied in https://github.com/prometheus/client_python/issues/155"""
    app = exposition.make_wsgi_app(registry)
    httpd = exposition.make_server(
        "", port, app, exposition.ThreadingWSGIServer, handler_class=exposition._SilentHandler
    )
    t = threading.Thread(target=httpd.serve_forever)
    t.daemon = True
    t.start()
    return httpd
