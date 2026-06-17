import threading
import time
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Any, cast

from opentelemetry import trace
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
from sqlalchemy import Engine, and_, case, select
from sqlalchemy.pool import QueuePool
from sqlalchemy.sql import distinct, func
from sqlalchemy.sql.selectable import Select

from couchers import experimentation
from couchers.config import config
from couchers.db import session_scope
from couchers.helpers.completed_profile import has_completed_profile_expression
from couchers.materialized_views import ClusterSubscriptionCount
from couchers.models import (
    BackgroundJob,
    ClientPlatform,
    Cluster,
    EventOccurrenceAttendee,
    HostingStatus,
    HostRequest,
    Message,
    Node,
    NodeType,
    NonvisibleUserAccessType,
    NonvisibleUserState,
    Reference,
    User,
    UserActivity,
)
from couchers.models.moderation import (
    ModerationAction,
    ModerationObjectType,
    ModerationQueueItem,
    ModerationState,
    ModerationTrigger,
    ModerationVisibility,
)
from couchers.perf import PerfResult

tracer = trace.get_tracer(__name__)

registry: CollectorRegistry = CollectorRegistry()
multiprocess.MultiProcessCollector(registry)  # type: ignore[no-untyped-call]

_INF: float = float("inf")

# Dense from 1ms to ~300ms where most calls land, sparse out to 10min for long background jobs.
MACHINE_DURATION_SECONDS: tuple[float, ...] = (
    0.001,
    0.0025,
    0.005,
    0.0075,
    0.01,
    0.015,
    0.02,
    0.03,
    0.04,
    0.05,
    0.06,
    0.075,
    0.1,
    0.125,
    0.15,
    0.2,
    0.25,
    0.3,
    0.4,
    0.5,
    0.75,
    1.0,
    1.5,
    2.0,
    3.0,
    5.0,
    7.5,
    10.0,
    15.0,
    30.0,
    60,
    120,
    300,
    600,
    _INF,
)

start_time_gauge: Gauge = Gauge(
    "couchers_start_time_seconds",
    "Unix timestamp of when the process started",
    multiprocess_mode="max",
)
start_time_gauge.set(time.time())

commit_timestamp_gauge: Gauge = Gauge(
    "couchers_commit_timestamp_seconds",
    "Unix timestamp of the deployed commit, 0 if not a CI build",
    multiprocess_mode="max",
)
# left at its default of 0 when COMMIT_TIMESTAMP is empty (i.e. not a CI build)
if config.COMMIT_TIMESTAMP:
    commit_timestamp_gauge.set(datetime.fromisoformat(config.COMMIT_TIMESTAMP).timestamp())

jobs_duration_histogram: Histogram = Histogram(
    "couchers_background_jobs_seconds",
    "Durations of background jobs",
    labelnames=["job", "status", "attempt", "exception"],
    buckets=MACHINE_DURATION_SECONDS,
)


def observe_in_jobs_duration_histogram(
    job_type: str, job_state: str, try_count: int, exception_name: str, duration_s: float
) -> None:
    jobs_duration_histogram.labels(job_type, job_state, str(try_count), exception_name).observe(duration_s)


jobs_queued_histogram: Histogram = Histogram(
    "couchers_background_jobs_queued_seconds",
    "Time background job spent queued before being picked up",
    labelnames=["priority"],
    buckets=(
        0.01,
        0.05,
        0.1,
        0.5,
        1.0,
        2.5,
        5.0,
        10,
        20,
        30,
        40,
        50,
        60,
        90,
        120,
        180,
        240,
        300,
        360,
        420,
        480,
        540,
        600,
        720,
        900,
        1800,
        3600,
        _INF,
    ),
)


servicer_duration_histogram: Histogram = Histogram(
    "couchers_servicer_duration_seconds",
    "Durations of processing gRPC calls",
    labelnames=["method", "logged_in", "code", "exception"],
    buckets=MACHINE_DURATION_SECONDS,
)


def observe_in_servicer_duration_histogram(
    method: str, user_id: Any, status_code: str, exception_type: str, duration_s: float
) -> None:
    servicer_duration_histogram.labels(method, user_id is not None, status_code, exception_type).observe(duration_s)


servicer_setup_errors_counter: Counter = Counter(
    "couchers_servicer_setup_errors_total",
    "Number of unexpected errors raised during gRPC interceptor setup, before the handler is invoked",
    labelnames=["method", "exception"],
)


def observe_in_servicer_setup_errors_counter(method: str, exception_type: str) -> None:
    servicer_setup_errors_counter.labels(method, exception_type).inc()


# Per-request resource accounting (see couchers/perf.py), labelled by method only to keep cardinality modest. The
# histogram _sum gives the cost rate per endpoint via rate() (DB-seconds/sec, CPU-seconds/sec); the buckets give the
# per-call distribution.
servicer_db_time_histogram: Histogram = Histogram(
    "couchers_servicer_db_time_seconds",
    "Time spent in DB cursor execution per gRPC call",
    labelnames=["method"],
    buckets=MACHINE_DURATION_SECONDS,
)
servicer_cpu_time_histogram: Histogram = Histogram(
    "couchers_servicer_cpu_seconds",
    "Backend thread CPU time per gRPC call",
    labelnames=["method"],
    buckets=MACHINE_DURATION_SECONDS,
)
# Fibonacci bucket boundaries: roughly exponential, good resolution for an unbounded value
servicer_db_query_count_histogram: Histogram = Histogram(
    "couchers_servicer_db_query_count",
    "Number of SQL statements executed per gRPC call",
    labelnames=["method"],
    buckets=(1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, _INF),
)
servicer_db_write_query_count_histogram: Histogram = Histogram(
    "couchers_servicer_db_write_query_count",
    "Number of INSERT/UPDATE/DELETE statements executed per gRPC call",
    labelnames=["method"],
    buckets=(1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, _INF),
)


def observe_in_servicer_perf_histograms(method: str, perf: PerfResult | None) -> None:
    if perf is None:
        return
    servicer_db_time_histogram.labels(method).observe(perf.db_time_ms / 1000)
    servicer_cpu_time_histogram.labels(method).observe(perf.cpu_ms / 1000)
    servicer_db_query_count_histogram.labels(method).observe(perf.db_query_count)
    servicer_db_write_query_count_histogram.labels(method).observe(perf.db_write_query_count)


# Auth/setup phase (everything before the handler body), same db-vs-cpu split as the handler-body histograms above.
servicer_setup_db_time_histogram: Histogram = Histogram(
    "couchers_servicer_setup_db_time_seconds",
    "Time spent in DB cursor execution during the auth/setup phase per gRPC call",
    labelnames=["method"],
    buckets=MACHINE_DURATION_SECONDS,
)
servicer_setup_cpu_time_histogram: Histogram = Histogram(
    "couchers_servicer_setup_cpu_seconds",
    "Backend thread CPU time during the auth/setup phase per gRPC call",
    labelnames=["method"],
    buckets=MACHINE_DURATION_SECONDS,
)


def observe_in_servicer_setup_histogram(method: str, perf: PerfResult | None) -> None:
    if perf is None:
        return
    servicer_setup_db_time_histogram.labels(method).observe(perf.db_time_ms / 1000)
    servicer_setup_cpu_time_histogram.labels(method).observe(perf.cpu_ms / 1000)


servicer_pool_wait_histogram: Histogram = Histogram(
    "couchers_servicer_pool_wait_seconds",
    "Time spent waiting to check out a DB connection from the pool per gRPC call",
    labelnames=["method"],
    buckets=MACHINE_DURATION_SECONDS,
)


def observe_in_servicer_pool_wait_histogram(method: str, pool_wait_s: float) -> None:
    servicer_pool_wait_histogram.labels(method).observe(pool_wait_s)


# Separate diagnostic, not part of the additive duration pie: "serialize" runs after the duration window closes.
servicer_serde_histogram: Histogram = Histogram(
    "couchers_servicer_serde_seconds",
    "Protobuf request deserialization / response serialization time per gRPC call",
    labelnames=["method", "direction"],
    buckets=MACHINE_DURATION_SECONDS,
)


def observe_in_servicer_serde_histogram(method: str, direction: str, serde_s: float) -> None:
    servicer_serde_histogram.labels(method, direction).observe(serde_s)


# liveall keeps one series per worker pid (and drops dead workers), so these also show load balance across workers.
# Updated from inside each worker since the /metrics scrape runs in the parent, which has neither pool.
grpc_in_flight_gauge: Gauge = Gauge(
    "couchers_grpc_in_flight",
    "Outstanding gRPC calls (running plus queued for a server thread), per worker process",
    multiprocess_mode="liveall",
)
grpc_threadpool_queue_depth_gauge: Gauge = Gauge(
    "couchers_grpc_threadpool_queue_depth",
    "gRPC calls queued waiting for a free server thread, per worker process",
    multiprocess_mode="liveall",
)
db_pool_checked_out_gauge: Gauge = Gauge(
    "couchers_db_pool_checked_out",
    "Checked-out DB connections, per worker process",
    multiprocess_mode="liveall",
)


def start_worker_resource_sampler(executor: ThreadPoolExecutor, engine: Engine, interval: float = 1.0) -> None:
    def sample() -> None:
        while True:
            # _work_queue is private but stable: tasks gRPC has submitted that no thread has picked up yet
            grpc_threadpool_queue_depth_gauge.set(executor._work_queue.qsize())
            db_pool_checked_out_gauge.set(cast(QueuePool, engine.pool).checkedout())
            time.sleep(interval)

    threading.Thread(target=sample, daemon=True, name="resource-sampler").start()


supervised_children_alive_gauge: Gauge = Gauge(
    "couchers_supervised_children_alive",
    "Child processes (API workers, background workers, scheduler) the supervisor currently sees alive",
    multiprocess_mode="mostrecent",
)


# Simple count of API calls, broken down by method and the client platform header. Cheap (a counter, no buckets) and
# answers "how much traffic comes from each platform".
api_calls_counter: Counter = Counter(
    "couchers_api_calls_total",
    "Number of gRPC API calls",
    labelnames=["method", "platform"],
)


def observe_api_call(method: str, client_platform: ClientPlatform | None) -> None:
    api_calls_counter.labels(method, client_platform.name if client_platform is not None else "unknown").inc()


# list of gauge names and function to execute to set value to
# the python prometheus client does not support Gauge.set_function, so instead we hack around it and set each gauge just
# before collection with this
_set_hacky_gauges_funcs: list[tuple[Gauge, Callable[[], Any]]] = []


def _make_gauge_from_query(name: str, description: str, statement: Select[Any]) -> Gauge:
    """
    Given a name, description and statement that is a sqlalchemy statement, creates a gauge from it

    statement should be a sqlalchemy SELECT statement that returns a single number
    """

    def f() -> Any:
        with tracer.start_as_current_span(f"metric.{name}"):
            with session_scope() as session:
                return session.execute(statement).scalar_one()

    gauge = Gauge(name, description, multiprocess_mode="mostrecent")
    _set_hacky_gauges_funcs.append((gauge, f))
    return gauge


# list of labeled gauges and the function to populate their label values just before collection
_set_hacky_labeled_gauges_funcs: list[tuple[Gauge, Callable[[Gauge], None]]] = []


def _make_labeled_gauge_from_query(
    name: str,
    description: str,
    labelname: str,
    statement: Select[Any],
    default_label_values: list[str] | None = None,
) -> Gauge:
    """
    Given a name, description, label name and statement, creates a gauge with one label set from the statement.

    statement should be a sqlalchemy SELECT statement that returns rows of (label_value, count).

    default_label_values, if given, are seeded to zero before the query results are applied, so that label
    values with no matching rows are still emitted.
    """

    gauge = Gauge(name, description, labelnames=[labelname], multiprocess_mode="mostrecent")

    def f(g: Gauge) -> None:
        with tracer.start_as_current_span(f"metric.{name}"):
            with session_scope() as session:
                rows = session.execute(statement).all()
        for label_value in default_label_values or []:
            g.labels(label_value).set(0)
        for label_value, count in rows:
            g.labels(str(label_value)).set(count)

    _set_hacky_labeled_gauges_funcs.append((gauge, f))
    return gauge


_active_user_periods: list[tuple[str, str, timedelta]] = [
    ("5m", "5 min", timedelta(minutes=5)),
    ("24h", "24 hours", timedelta(hours=24)),
    ("1month", "1 month", timedelta(weeks=4)),
    ("3month", "3 months", timedelta(weeks=13)),
    ("6month", "6 months", timedelta(weeks=26)),
    ("12month", "12 months", timedelta(days=365)),
]

active_users_gauges: list[Gauge] = [
    _make_gauge_from_query(
        f"couchers_active_users_{name}",
        f"Number of active users in the last {description}",
        (select(func.count()).select_from(User).where(User.is_visible).where(User.last_active > func.now() - interval)),
    )
    for name, description, interval in _active_user_periods
]

users_gauge: Gauge = _make_gauge_from_query(
    "couchers_users", "Total number of users", select(func.count()).select_from(User).where(User.is_visible)
)

# Number of users per community, labeled by community name. Only includes communities at the region level or
# broader (world, macroregion, region).
users_per_community_gauge: Gauge = _make_labeled_gauge_from_query(
    "couchers_users_per_community",
    "Number of users per community, for regions and broader",
    "community",
    (
        select(Cluster.name, func.coalesce(ClusterSubscriptionCount.count, 0))
        .select_from(Node)
        .join(Cluster, and_(Cluster.parent_node_id == Node.id, Cluster.is_official_cluster))
        .outerjoin(ClusterSubscriptionCount, ClusterSubscriptionCount.cluster_id == Cluster.id)
        .where(Node.node_type <= NodeType.region)
    ),
)

# Number of users bucketed by how recently they were last active.
_active_users_buckets: list[tuple[str, timedelta | None]] = [
    ("<1d", timedelta(days=1)),
    ("1d-1w", timedelta(days=7)),
    ("1w-1m", timedelta(weeks=4)),
    ("1m-6m", timedelta(weeks=26)),
    ("6m-12m", timedelta(days=365)),
    ("12m-24m", timedelta(days=730)),
    ("24m+", None),
]
_active_users_age = func.now() - User.last_active
active_users_by_recency_gauge: Gauge = _make_labeled_gauge_from_query(
    "couchers_active_users_by_recency",
    "Number of users bucketed by how recently they were last active",
    "period",
    (
        select(
            case(
                *[(_active_users_age < interval, label) for label, interval in _active_users_buckets if interval],
                else_=_active_users_buckets[-1][0],
            ).label("period"),
            func.count(),
        )
        .select_from(User)
        .where(User.is_visible)
        .group_by("period")
    ),
    default_label_values=[label for label, _ in _active_users_buckets],
)

# Window for the per-platform daily-active-user metrics. Kept to 24h so the user_activity scan stays cheap (an index
# scan of just the last day's rows), letting these gauges be computed inline on every scrape.
_ACTIVE_USERS_BY_PLATFORM_WINDOW = timedelta(hours=24)
# Platforms counted as "mobile" for the mobile-share fraction (native apps plus the mobile web viewport).
_MOBILE_PLATFORMS = [ClientPlatform.web_mobile, ClientPlatform.app_ios, ClientPlatform.app_android]


def active_users_by_platform_statement() -> Select[Any]:
    # one scan of the last 24h of user_activity: distinct active users in total, the mobile subset (for the share
    # fraction), and a breakdown per platform. client_platform is set from a header the client explicitly sends; it's
    # null for some other client (e.g. an API key script) or activity from before the header existed, so the
    # per-platform counts don't sum to the total and "mobile" needs its own union count rather than summing labels.
    distinct_users = func.count(distinct(UserActivity.user_id))
    return (
        select(
            distinct_users.label("total"),
            distinct_users.filter(UserActivity.client_platform.in_(_MOBILE_PLATFORMS)).label("mobile"),
            *[
                distinct_users.filter(UserActivity.client_platform == platform).label(platform.name)
                for platform in ClientPlatform
            ],
        )
        .select_from(UserActivity)
        .join(User, User.id == UserActivity.user_id)
        .where(User.is_visible)
        .where(UserActivity.period > func.now() - _ACTIVE_USERS_BY_PLATFORM_WINDOW)
    )


# Distinct active users in the last 24h, split by client platform.
active_users_by_platform_gauge: Gauge = Gauge(
    "couchers_active_users_by_platform",
    "Distinct active users in the last 24h, split by client platform (web_desktop, web_mobile, app_ios, app_android)",
    labelnames=["platform"],
    multiprocess_mode="mostrecent",
)

# Fraction of the last 24h's distinct active users who had any mobile activity. The headline "mobile is key" number.
active_users_mobile_fraction_gauge: Gauge = Gauge(
    "couchers_active_users_mobile_fraction",
    "Fraction of distinct active users in the last 24h with any mobile activity (web_mobile, app_ios, app_android)",
    multiprocess_mode="mostrecent",
)


def _set_active_users_by_platform(gauge: Gauge) -> None:
    with tracer.start_as_current_span("metric.couchers_active_users_by_platform"):
        with session_scope() as session:
            row = session.execute(active_users_by_platform_statement()).one()._mapping
    for platform in ClientPlatform:
        gauge.labels(platform.name).set(row[platform.name])
    total = row["total"]
    active_users_mobile_fraction_gauge.set(row["mobile"] / total if total else 0.0)


_set_hacky_labeled_gauges_funcs.append((active_users_by_platform_gauge, _set_active_users_by_platform))

man_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_man",
    "Total number of users with gender 'Man'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.gender == "Man"),
)

woman_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_woman",
    "Total number of users with gender 'Woman'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.gender == "Woman"),
)

nonbinary_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_nonbinary",
    "Total number of users with gender 'Non-binary'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.gender == "Non-binary"),
)

can_host_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_can_host",
    "Total number of users with hosting status 'can_host'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.hosting_status == HostingStatus.can_host),
)

cant_host_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_cant_host",
    "Total number of users with hosting status 'cant_host'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.hosting_status == HostingStatus.cant_host),
)

maybe_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_maybe",
    "Total number of users with hosting status 'maybe'",
    select(func.count()).select_from(User).where(User.is_visible).where(User.hosting_status == HostingStatus.maybe),
)

completed_profile_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_completed_profile",
    "Total number of users with a completed profile",
    select(func.count()).select_from(User).where(User.is_visible).where(has_completed_profile_expression()),
)

completed_my_home_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_completed_my_home",
    "Total number of users with a completed my home section",
    select(func.count()).select_from(User).where(User.is_visible).where(User.has_completed_my_home),
)

sent_message_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_sent_message",
    "Total number of users who have sent a message",
    (select(func.count(distinct(Message.author_id))).join(User, User.id == Message.author_id).where(User.is_visible)),
)

sent_request_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_sent_request",
    "Total number of users who have sent a host request",
    (
        select(func.count(distinct(HostRequest.initiator_user_id)))
        .join(User, User.id == HostRequest.initiator_user_id)
        .where(User.is_visible)
    ),
)

has_reference_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_has_reference",
    "Total number of users who have a reference",
    (
        select(func.count(distinct(Reference.to_user_id)))
        .join(User, User.id == Reference.to_user_id)
        .where(User.is_visible)
    ),
)

rsvpd_to_event_gauge: Gauge = _make_gauge_from_query(
    "couchers_users_rsvpd_to_event",
    "Total number of users who have RSVPd to an event",
    (
        select(func.count(distinct(EventOccurrenceAttendee.user_id)))
        .join(User, User.id == EventOccurrenceAttendee.user_id)
        .where(User.is_visible)
    ),
)

background_jobs_ready_to_execute_gauge: Gauge = _make_gauge_from_query(
    "couchers_background_jobs_ready_to_execute",
    "Total number of background jobs ready to execute",
    select(func.count()).select_from(BackgroundJob).where(BackgroundJob.ready_for_retry),
)

background_jobs_serialization_errors_counter: Counter = Counter(
    "couchers_background_jobs_serialization_errors_total",
    "Number of times a bg worker has a serialization error",
)

background_jobs_no_jobs_counter: Counter = Counter(
    "couchers_background_jobs_no_jobs_total",
    "Number of times a bg worker tries to grab a job but there is none",
)

background_jobs_got_job_counter: Counter = Counter(
    "couchers_background_jobs_got_job_total",
    "Number of times a bg worker grabbed a job",
)


signup_initiations_counter: Counter = Counter(
    "couchers_signup_initiations_total",
    "Number of initiated signups",
)
signup_completions_counter: Counter = Counter(
    "couchers_signup_completions_total",
    "Number of completed signups",
    labelnames=["gender"],
)
# Per-step signup funnel counters. Each fires once, the first time a signup flow satisfies the given gate, so
# that step_total/initiations_total gives the fraction of signups that reached that step. Unlabeled to match
# signup_initiations_counter for clean ratios.
signup_account_filled_counter: Counter = Counter(
    "couchers_signup_account_filled_total",
    "Number of signup flows that filled in their account details",
)
signup_email_verified_counter: Counter = Counter(
    "couchers_signup_email_verified_total",
    "Number of signup flows that verified their email address",
)
signup_guidelines_accepted_counter: Counter = Counter(
    "couchers_signup_guidelines_accepted_total",
    "Number of signup flows that accepted the community guidelines",
)
signup_motivations_filled_counter: Counter = Counter(
    "couchers_signup_motivations_filled_total",
    "Number of signup flows that filled in their motivations",
)
signup_time_histogram: Histogram = Histogram(
    "couchers_signup_time_seconds",
    "Time taken for a user to sign up",
    labelnames=["gender"],
    buckets=(30, 60, 90, 120, 180, 240, 300, 360, 420, 480, 540, 600, 900, 1200, 1800, 3600, 7200, _INF),
)

logins_counter: Counter = Counter(
    "couchers_logins_total",
    "Number of logins",
    labelnames=["gender"],
)

password_reset_initiations_counter: Counter = Counter(
    "couchers_password_reset_initiations_total",
    "Number of password reset initiations",
)
password_reset_completions_counter: Counter = Counter(
    "couchers_password_reset_completions_total",
    "Number of password reset completions",
)

account_deletion_initiations_counter: Counter = Counter(
    "couchers_account_deletion_initiations_total",
    "Number of account deletion initiations",
    labelnames=["gender"],
)
account_deletion_completions_counter: Counter = Counter(
    "couchers_account_deletion_completions_total",
    "Number of account deletion completions",
    labelnames=["gender"],
)
account_recoveries_counter: Counter = Counter(
    "couchers_account_recoveries_total",
    "Number of account recoveries",
    labelnames=["gender"],
)

strong_verification_initiations_counter: Counter = Counter(
    "couchers_strong_verification_initiations_total",
    "Number of strong verification initiations",
    labelnames=["gender"],
)
strong_verification_completions_counter: Counter = Counter(
    "couchers_strong_verification_completions_total",
    "Number of strong verification completions",
)
strong_verification_data_deletions_counter: Counter = Counter(
    "couchers_strong_verification_data_deletions_total",
    "Number of strong verification data deletions",
    labelnames=["gender"],
)

host_requests_sent_counter: Counter = Counter(
    "couchers_host_requests_total",
    "Number of host requests sent",
    labelnames=["from_gender", "to_gender"],
)
host_request_responses_counter: Counter = Counter(
    "couchers_host_requests_responses_total",
    "Number of responses to host requests",
    labelnames=["responder_gender", "other_gender", "response_type"],
)

sent_messages_counter: Counter = Counter(
    "couchers_sent_messages_total",
    "Number of messages sent",
    labelnames=["gender", "message_type"],
)


push_notification_counter: Counter = Counter(
    "couchers_push_notification_total",
    "Number of push notification delivery attempts",
    labelnames=["platform", "outcome"],
)
emails_counter: Counter = Counter(
    "couchers_emails_total",
    "Number of emails sent",
)


antibots_assessed_counter: Counter = Counter(
    "couchers_antibots_assessed_total",
    "Number of times an antibot assessment is created",
    labelnames=["action"],
)

antibot_score_histogram: Histogram = Histogram(
    "couchers_antibot_score",
    "Score of antibot assessments",
    labelnames=["action"],
    buckets=tuple(x / 20 for x in range(0, 21)),
)

host_request_first_response_histogram: Histogram = Histogram(
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
account_age_on_host_request_create_histogram: Histogram = Histogram(
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


# =============================================================================
# Moderation metrics
# =============================================================================

# Gauges: Queue lengths
moderation_queue_length_gauge: Gauge = _make_gauge_from_query(
    "couchers_moderation_queue_length",
    "Total number of unresolved items in the moderation queue",
    select(func.count()).select_from(ModerationQueueItem).where(ModerationQueueItem.resolved_by_log_id.is_(None)),
)

moderation_queue_length_by_trigger_gauges: list[Gauge] = [
    _make_gauge_from_query(
        f"couchers_moderation_queue_length_{trigger.name.lower()}",
        f"Number of unresolved items in the moderation queue with trigger {trigger.name}",
        select(func.count())
        .select_from(ModerationQueueItem)
        .where(ModerationQueueItem.resolved_by_log_id.is_(None))
        .where(ModerationQueueItem.trigger == trigger),
    )
    for trigger in ModerationTrigger
]

moderation_queue_length_by_object_type_gauges: list[Gauge] = [
    _make_gauge_from_query(
        f"couchers_moderation_queue_length_{object_type.name.lower()}",
        f"Number of unresolved items in the moderation queue for {object_type.name}",
        select(func.count())
        .select_from(ModerationQueueItem)
        .join(ModerationState, ModerationQueueItem.moderation_state_id == ModerationState.id)
        .where(ModerationQueueItem.resolved_by_log_id.is_(None))
        .where(ModerationState.object_type == object_type),
    )
    for object_type in ModerationObjectType
]

# Gauges: Items in each visibility state by object type
moderation_visibility_gauges: list[Gauge] = [
    _make_gauge_from_query(
        f"couchers_moderation_items_{object_type.name.lower()}_{visibility.name.lower()}",
        f"Number of {object_type.name} items with visibility {visibility.name}",
        select(func.count())
        .select_from(ModerationState)
        .where(ModerationState.object_type == object_type)
        .where(ModerationState.visibility == visibility),
    )
    for object_type in ModerationObjectType
    for visibility in ModerationVisibility
]

# Counters: Moderation actions taken
moderation_actions_counter: Counter = Counter(
    "couchers_moderation_actions_total",
    "Number of moderation actions taken",
    labelnames=["action", "object_type"],
)


def observe_moderation_action(action: ModerationAction, object_type: ModerationObjectType) -> None:
    moderation_actions_counter.labels(action.name, object_type.name).inc()


# Counters: Visibility state transitions
moderation_visibility_transitions_counter: Counter = Counter(
    "couchers_moderation_visibility_transitions_total",
    "Number of visibility state transitions",
    labelnames=["from_visibility", "to_visibility", "object_type"],
)


def observe_moderation_visibility_transition(
    from_visibility: ModerationVisibility, to_visibility: ModerationVisibility, object_type: ModerationObjectType
) -> None:
    moderation_visibility_transitions_counter.labels(from_visibility.name, to_visibility.name, object_type.name).inc()


# Counters: Auto-approved items
moderation_auto_approved_counter: Counter = Counter(
    "couchers_moderation_auto_approved_total",
    "Number of items that were auto-approved",
)


# Counters: Queue items created
moderation_queue_items_created_counter: Counter = Counter(
    "couchers_moderation_queue_items_created_total",
    "Number of moderation queue items created",
    labelnames=["trigger", "object_type"],
)


def observe_moderation_queue_item_created(trigger: ModerationTrigger, object_type: ModerationObjectType) -> None:
    moderation_queue_items_created_counter.labels(trigger.name, object_type.name).inc()


# Counters: Queue items resolved
moderation_queue_items_resolved_counter: Counter = Counter(
    "couchers_moderation_queue_items_resolved_total",
    "Number of moderation queue items resolved",
    labelnames=["trigger", "action", "object_type"],
)


def observe_moderation_queue_item_resolved(
    trigger: ModerationTrigger, action: ModerationAction, object_type: ModerationObjectType
) -> None:
    moderation_queue_items_resolved_counter.labels(trigger.name, action.name, object_type.name).inc()


# Histogram: Time to resolve queue items
moderation_queue_resolution_time_histogram: Histogram = Histogram(
    "couchers_moderation_queue_resolution_seconds",
    "Time taken to resolve moderation queue items",
    labelnames=["trigger", "action", "object_type"],
    buckets=(
        0.1,
        0.25,
        0.5,
        1,
        2.5,
        5,
        10,
        30,
        60,
        5 * 60,
        15 * 60,
        30 * 60,
        3_600,
        2 * 3_600,
        6 * 3_600,
        12 * 3_600,
        86_400,
        2 * 86_400,
        3 * 86_400,
        7 * 86_400,
        14 * 86_400,
        30 * 86_400,
        _INF,
    ),
)


def observe_moderation_queue_resolution_time(
    trigger: ModerationTrigger, action: ModerationAction, object_type: ModerationObjectType, duration_s: float
) -> None:
    moderation_queue_resolution_time_histogram.labels(trigger.name, action.name, object_type.name).observe(duration_s)


nonvisible_user_access_counter: Counter = Counter(
    "couchers_nonvisible_user_access_total",
    "Number of access events involving nonvisible (banned/shadowed/deleted) users",
    labelnames=["access_type", "target_state"],
)


def observe_nonvisible_user_access(access_type: NonvisibleUserAccessType, target_state: NonvisibleUserState) -> None:
    nonvisible_user_access_counter.labels(access_type.name, target_state.name).inc()


postcards_sent_counter: Counter = Counter(
    "couchers_postcards_sent_total",
    "Number of postcards sent via MyPostcard",
    labelnames=["country_code"],
)


# Native app / OTA update metrics. Bucket layout is minute-resolution at the low end (watch an OTA
# rolling out), dense around the OTA (~28d) and store (~91d) windows, and sparse past it for stragglers.
_NATIVE_AGE_BUCKETS: tuple[float, ...] = (
    60,
    5 * 60,
    15 * 60,
    30 * 60,
    3_600,
    2 * 3_600,
    6 * 3_600,
    12 * 3_600,
    86_400,
    2 * 86_400,
    3 * 86_400,
    5 * 86_400,
    7 * 86_400,
    10 * 86_400,
    14 * 86_400,
    21 * 86_400,
    28 * 86_400,
    35 * 86_400,
    45 * 86_400,
    60 * 86_400,
    75 * 86_400,
    91 * 86_400,
    120 * 86_400,
    150 * 86_400,
    180 * 86_400,
    270 * 86_400,
    365 * 86_400,
    730 * 86_400,
    _INF,
)

native_bundle_age_histogram: Histogram = Histogram(
    "couchers_native_bundle_age_seconds",
    "Age of the OTA bundle reported by the client at CheckNativeStatus, by platform and launch source",
    labelnames=["platform", "is_ota_launch"],
    buckets=_NATIVE_AGE_BUCKETS,
)


def observe_native_bundle_age(platform: str, is_ota_launch: bool, age_s: float) -> None:
    native_bundle_age_histogram.labels(platform or "unknown", "true" if is_ota_launch else "false").observe(age_s)


native_binary_age_histogram: Histogram = Histogram(
    "couchers_native_binary_age_seconds",
    "Age of the embedded native binary reported by the client at CheckNativeStatus, by platform",
    labelnames=["platform"],
    buckets=_NATIVE_AGE_BUCKETS,
)


def observe_native_binary_age(platform: str, age_s: float) -> None:
    native_binary_age_histogram.labels(platform or "unknown").observe(age_s)


native_update_decisions_counter: Counter = Counter(
    "couchers_native_update_decisions_total",
    "CheckNativeStatus decisions, by platform / action / severity",
    labelnames=["platform", "action", "severity"],
)


def observe_native_update_decision(platform: str, action: str, severity: str) -> None:
    native_update_decisions_counter.labels(platform or "unknown", action, severity).inc()


native_banned_bundle_hits_counter: Counter = Counter(
    "couchers_native_banned_bundle_hits_total",
    "CheckNativeStatus calls from a device running a banned OTA bundle, by platform",
    labelnames=["platform"],
)


def observe_native_banned_bundle_hit(platform: str) -> None:
    native_banned_bundle_hits_counter.labels(platform or "unknown").inc()


native_ota_manifest_requests_counter: Counter = Counter(
    "couchers_native_ota_manifest_requests_total",
    "GetNativeUpdateManifest requests, by platform and result (served, no_update, no_match)",
    labelnames=["platform", "result"],
)


def observe_native_ota_manifest_request(platform: str, result: str) -> None:
    native_ota_manifest_requests_counter.labels(platform or "unknown", result).inc()


# One increment per CheckNativeStatus, labeled by build/bundle identity, to see the live mix of
# versions and bundles running in the fleet.
native_client_checkins_counter: Counter = Counter(
    "couchers_native_client_checkins_total",
    "CheckNativeStatus calls, labeled by build/bundle identity",
    labelnames=[
        "platform",
        "is_ota_launch",
        "embedded_display_version",
        "embedded_runtime_version",
        "ota_display_version",
        "ota_update_id",
    ],
)


def observe_native_client_checkin(
    platform: str,
    is_ota_launch: bool,
    embedded_display_version: str,
    embedded_runtime_version: str,
    ota_display_version: str,
    ota_update_id: str,
) -> None:
    native_client_checkins_counter.labels(
        platform or "unknown",
        "true" if is_ota_launch else "false",
        embedded_display_version or "unknown",
        embedded_runtime_version or "unknown",
        ota_display_version or "none",
        ota_update_id or "none",
    ).inc()


# Recomputed at scrape time via the hacky-gauge mechanism, so it reflects live age. 0 when disabled
# or never pulled.
def _feature_flags_staleness_seconds() -> float:
    return experimentation.seconds_since_last_fetch() or 0.0


feature_flags_staleness_gauge: Gauge = Gauge(
    "couchers_feature_flags_staleness_seconds",
    "Seconds since feature flags were last successfully fetched from GrowthBook",
    multiprocess_mode="mostrecent",
)
_set_hacky_gauges_funcs.append((feature_flags_staleness_gauge, _feature_flags_staleness_seconds))


feature_flag_evaluations_counter: Counter = Counter(
    "couchers_feature_flag_evaluations_total",
    "Number of feature flag evaluations, by flag key, evaluation source, and resolved value",
    labelnames=["flag_key", "source", "value"],
)

_MAX_FLAG_VALUE_LABEL_LEN = 32


def _stringify_flag_value(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float, str)):
        s = str(value)
        return s if len(s) <= _MAX_FLAG_VALUE_LABEL_LEN else f"<{type(value).__name__}>"
    if value is None:
        return "None"
    return f"<{type(value).__name__}>"


def observe_feature_flag_evaluation(flag_key: str, source: str, value: Any) -> None:
    feature_flag_evaluations_counter.labels(flag_key, source, _stringify_flag_value(value)).inc()


def create_prometheus_server(port: int) -> Any:
    """custom start method to fix problem descrbied in https://github.com/prometheus/client_python/issues/155"""

    def app(environ: Any, start_response: Any) -> Any:
        # set hacky gauges
        for gauge, f in _set_hacky_gauges_funcs:
            gauge.set(f())
        for gauge, labeled_f in _set_hacky_labeled_gauges_funcs:
            labeled_f(gauge)

        data = generate_latest(registry)
        start_response("200 OK", [("Content-type", CONTENT_TYPE_LATEST), ("Content-Length", str(len(data)))])
        return [data]

    httpd = exposition.make_server(  # type: ignore[attr-defined]
        "", port, app, exposition.ThreadingWSGIServer, handler_class=exposition._SilentHandler
    )
    t = threading.Thread(target=httpd.serve_forever)
    t.daemon = True
    t.start()
    return httpd
