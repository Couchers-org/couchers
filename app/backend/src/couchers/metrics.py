import threading
from collections.abc import Callable
from datetime import timedelta
from typing import Any

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
from sqlalchemy import and_, case, select
from sqlalchemy.sql import distinct, func
from sqlalchemy.sql.selectable import Select

from couchers import experimentation
from couchers.db import session_scope
from couchers.helpers.completed_profile import has_completed_profile_expression
from couchers.materialized_views import ClusterSubscriptionCount
from couchers.models import (
    BackgroundJob,
    Cluster,
    EventOccurrenceAttendee,
    HostingStatus,
    HostRequest,
    Message,
    Node,
    NodeType,
    Reference,
    User,
)
from couchers.models.moderation import (
    ModerationAction,
    ModerationObjectType,
    ModerationQueueItem,
    ModerationState,
    ModerationTrigger,
    ModerationVisibility,
)

tracer = trace.get_tracer(__name__)

registry: CollectorRegistry = CollectorRegistry()
multiprocess.MultiProcessCollector(registry)  # type: ignore[no-untyped-call]

_INF: float = float("inf")

jobs_duration_histogram: Histogram = Histogram(
    "couchers_background_jobs_seconds",
    "Durations of background jobs",
    labelnames=["job", "status", "attempt", "exception"],
)


def observe_in_jobs_duration_histogram(
    job_type: str, job_state: str, try_count: int, exception_name: str, duration_s: float
) -> None:
    jobs_duration_histogram.labels(job_type, job_state, str(try_count), exception_name).observe(duration_s)


jobs_queued_histogram: Histogram = Histogram(
    "couchers_background_jobs_queued_seconds",
    "Time background job spent queued before being picked up",
    buckets=(0.01, 0.05, 0.1, 0.5, 1.0, 2.5, 5.0, 10, 20, 30, 40, 50, 60, 90, 120, 300, 600, 1800, 3600, _INF),
)


servicer_duration_histogram: Histogram = Histogram(
    "couchers_servicer_duration_seconds",
    "Durations of processing gRPC calls",
    labelnames=["method", "logged_in", "code", "exception"],
)


def observe_in_servicer_duration_histogram(
    method: str, user_id: Any, status_code: str, exception_type: str, duration_s: float
) -> None:
    servicer_duration_histogram.labels(method, user_id is not None, status_code, exception_type).observe(duration_s)


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


active_users_gauges: list[Gauge] = [
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
    ("1w-1m", timedelta(days=31)),
    ("1m-6m", timedelta(days=183)),
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


recaptchas_assessed_counter: Counter = Counter(
    "couchers_recaptchas_assessed_total",
    "Number of times a recaptcha assessment is created",
    labelnames=["action"],
)

recaptcha_score_histogram: Histogram = Histogram(
    "couchers_recaptcha_score",
    "Score of recaptcha assessments",
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


postcards_sent_counter: Counter = Counter(
    "couchers_postcards_sent_total",
    "Number of postcards sent via MyPostcard",
    labelnames=["country_code"],
)


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
