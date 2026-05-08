import enum
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, Float, Index, String, func
from sqlalchemy import LargeBinary as Binary
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from couchers.config import Config
from couchers.models.base import Base


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
    version: Mapped[str] = mapped_column(String, default_factory=lambda: Config.current.version)

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
    version: Mapped[str] = mapped_column(String, default_factory=lambda: Config.current.version)

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
