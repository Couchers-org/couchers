from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Float, String, func
from sqlalchemy import LargeBinary as Binary
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from couchers.config import config
from couchers.models.base import Base


class APICall(Base, init=False, kw_only=True):
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
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # the method call name, e.g. "/org.couchers.api.core.API/ListFriends"
    method: Mapped[str] = mapped_column(String)

    # gRPC status code name, e.g. FAILED_PRECONDITION, None if success
    status_code: Mapped[str | None] = mapped_column(String, nullable=True)

    # handler duration (excluding serialization, etc)
    duration: Mapped[float] = mapped_column(Float)

    # user_id of caller, None means not logged in
    user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    # sanitized request bytes
    request: Mapped[bytes | None] = mapped_column(Binary, nullable=True)

    # sanitized response bytes
    response: Mapped[bytes | None] = mapped_column(Binary, nullable=True)

    # whether response bytes have been truncated
    response_truncated: Mapped[bool] = mapped_column(Boolean, server_default=expression.false())

    # the exception traceback, if any
    traceback: Mapped[str | None] = mapped_column(String, nullable=True)

    # human readable perf report
    perf_report: Mapped[str | None] = mapped_column(String, nullable=True)

    # details of the browser, if available
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String, nullable=True)
