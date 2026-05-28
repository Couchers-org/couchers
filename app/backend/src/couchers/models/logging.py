import enum
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, Float, Index, String, UniqueConstraint, func
from sqlalchemy import LargeBinary as Binary
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from couchers.config import config
from couchers.models.base import Base
from couchers.models.rest import ClientPlatform


class EventSource(enum.Enum):
    backend = enum.auto()
    frontend = enum.auto()


class APICall(Base, kw_only=True):
    """
    API call logs
    """

    __tablename__ = "api_calls"
    __table_args__ = {"schema": "logging"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # whether the call was made using an api key or session cookies
    is_api_key: Mapped[bool] = mapped_column(Boolean, server_default=expression.false())

    # backend version (normally e.g. develop-31469e3), allows us to figure out which proto definitions were used
    # note that `default` is a python side default, not hardcoded into DB schema
    version: Mapped[str] = mapped_column(String, default=config["VERSION"])

    # approximate time of the call
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # the method call name, e.g. "/org.couchers.api.core.API/ListFriends"
    method: Mapped[str] = mapped_column(String)

    # gRPC status code name, e.g. FAILED_PRECONDITION, None if success
    status_code: Mapped[str | None] = mapped_column(String, default=None)

    # handler duration (excluding serialization, etc)
    duration: Mapped[float] = mapped_column(Float)

    # user_id of caller, None means not logged in
    user_id: Mapped[int | None] = mapped_column(BigInteger, default=None)

    # sanitized request bytes
    request: Mapped[bytes | None] = mapped_column(Binary, default=None)

    # sanitized response bytes
    response: Mapped[bytes | None] = mapped_column(Binary, default=None)

    # whether response bytes have been truncated
    response_truncated: Mapped[bool] = mapped_column(Boolean, server_default=expression.false())

    # the exception traceback, if any
    traceback: Mapped[str | None] = mapped_column(String, default=None)

    # human readable perf report
    perf_report: Mapped[str | None] = mapped_column(String, default=None)

    # per-request resource accounting, covering the handler span (see couchers/perf.py). Null for the rare row logged
    # without accounting armed. Wall time is `duration`; residual wait = duration - cpu_ms - db_time_ms.
    query_count: Mapped[int | None] = mapped_column(BigInteger, default=None)
    write_query_count: Mapped[int | None] = mapped_column(BigInteger, default=None)
    db_time_ms: Mapped[float | None] = mapped_column(Float, default=None)
    cpu_ms: Mapped[float | None] = mapped_column(Float, default=None)

    # client platform the call came from, from the x-couchers-client-platform header
    client_platform: Mapped[ClientPlatform | None] = mapped_column(Enum(ClientPlatform), default=None)

    # details of the browser, if available
    ip_address: Mapped[str | None] = mapped_column(String, default=None)
    user_agent: Mapped[str | None] = mapped_column(String, default=None)

    sofa: Mapped[str | None] = mapped_column(String, default=None)


class EventLog(Base, kw_only=True):
    """
    Analytics event log for tracking user behavior and business metrics.

    Append-only table for ELT extraction. Do not query this table for user-facing features.
    """

    __tablename__ = "event_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # when the row was inserted into the DB
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # when the event actually happened (same as created for backend; may differ for frontend events)
    occurred: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # backend/frontend version
    version: Mapped[str] = mapped_column(String, default=config["VERSION"])

    # sofa, null for background/system events
    sofa: Mapped[str | None] = mapped_column(String, default=None)

    # hierarchical event type, e.g. "host_request.sent", "account.login"
    event_type: Mapped[str] = mapped_column(String)

    # user who triggered the event, nullable for system events
    user_id: Mapped[int | None] = mapped_column(BigInteger, default=None)

    # flexible event-specific properties
    properties: Mapped[dict[str, Any]] = mapped_column(JSONB)

    # numeric value (duration, count, etc.)
    value: Mapped[float] = mapped_column(Float, server_default="1.0", default=1.0)

    # where the event originated
    source: Mapped[EventSource] = mapped_column(Enum(EventSource))

    __table_args__ = (
        Index("ix_logging_event_log_created", "created"),
        Index("ix_logging_event_log_event_type_created", "event_type", "created"),
        Index("ix_logging_event_log_user_id_created", "user_id", "created"),
        {"schema": "logging"},
    )


class ExperimentExposure(Base, kw_only=True):
    """
    Records the first time a user is exposed to a particular experiment variation.

    Populated by GrowthBook's on_experiment_viewed callback. One row per
    (user, experiment, variation) - subsequent exposures collide on the
    unique constraint and are dropped via ON CONFLICT DO NOTHING, so
    `created` and `data` reflect the first exposure.
    """

    __tablename__ = "experiment_exposures"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # when the first exposure was recorded
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # backend version when the first exposure was recorded
    version: Mapped[str] = mapped_column(String, default=config["VERSION"])

    # user exposed to the experiment
    user_id: Mapped[int] = mapped_column(BigInteger)

    # experiment identifier from GrowthBook
    experiment_key: Mapped[str] = mapped_column(String)

    # the variation the user was bucketed into
    variation_id: Mapped[int] = mapped_column(BigInteger)

    # remaining GrowthBook fields (variation_key, hash_attribute, hash_value,
    # bucket, in_experiment, feature_id, sticky_bucket_used, etc.)
    data: Mapped[dict[str, Any]] = mapped_column(JSONB)

    __table_args__ = (
        UniqueConstraint("user_id", "experiment_key", "variation_id", name="uq_experiment_exposures_user_exp_var"),
        Index("ix_logging_experiment_exposures_experiment_key_created", "experiment_key", "created"),
        Index("ix_logging_experiment_exposures_user_id_created", "user_id", "created"),
        {"schema": "logging"},
    )


class FeatureUsage(Base, kw_only=True):
    """
    Append-only log of feature flag evaluations.

    Populated by GrowthBook's on_feature_usage callback - one row per check.
    """

    __tablename__ = "feature_usage"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # when the feature was checked
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # user the feature was checked for
    user_id: Mapped[int] = mapped_column(BigInteger)

    # feature identifier from GrowthBook
    feature_key: Mapped[str] = mapped_column(String)

    # the feature value the user received
    value: Mapped[Any] = mapped_column(JSONB)

    __table_args__ = (
        Index("ix_logging_feature_usage_feature_key_time", "feature_key", "time"),
        Index("ix_logging_feature_usage_user_id_time", "user_id", "time"),
        {"schema": "logging"},
    )
