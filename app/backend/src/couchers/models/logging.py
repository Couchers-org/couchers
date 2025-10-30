from sqlalchemy import BigInteger, Boolean, Column, DateTime, Float, String, func
from sqlalchemy import LargeBinary as Binary
from sqlalchemy.sql import expression

from couchers.config import config
from couchers.models.base import Base


class APICall(Base):
    """
    API call logs
    """

    __tablename__ = "api_calls"
    __table_args__ = {"schema": "logging"}

    id = Column(BigInteger, primary_key=True)

    # whether the call was made using an api key or session cookies
    is_api_key = Column(Boolean, nullable=False, server_default=expression.false())

    # backend version (normally e.g. develop-31469e3), allows us to figure out which proto definitions were used
    # note that `default` is a python side default, not hardcoded into DB schema
    version = Column(String, nullable=False, default=config["VERSION"])

    # approximate time of the call
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # the method call name, e.g. "/org.couchers.api.core.API/ListFriends"
    method = Column(String, nullable=False)

    # gRPC status code name, e.g. FAILED_PRECONDITION, None if success
    status_code = Column(String, nullable=True)

    # handler duration (excluding serialization, etc)
    duration = Column(Float, nullable=False)

    # user_id of caller, None means not logged in
    user_id = Column(BigInteger, nullable=True)

    # sanitized request bytes
    request = Column(Binary, nullable=True)

    # sanitized response bytes
    response = Column(Binary, nullable=True)

    # whether response bytes have been truncated
    response_truncated = Column(Boolean, nullable=False, server_default=expression.false())

    # the exception traceback, if any
    traceback = Column(String, nullable=True)

    # human readable perf report
    perf_report = Column(String, nullable=True)

    # details of the browser, if available
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
