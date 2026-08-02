import enum
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, DateTime, Enum, Index, Integer, String, func, text
from sqlalchemy import LargeBinary as Binary
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column

from couchers.models.base import Base


class BackgroundJobState(enum.Enum):
    # job is fresh, waiting to be picked off the queue
    pending = enum.auto()
    # job complete
    completed = enum.auto()
    # error occurred, will be retried
    error = enum.auto()
    # failed too many times, not retrying anymore
    failed = enum.auto()


class BackgroundJob(Base, kw_only=True):
    """
    This table implements a queue of background jobs.
    """

    __tablename__ = "background_jobs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # used to discern which function should be triggered to service it
    job_type: Mapped[str] = mapped_column(String)
    state: Mapped[BackgroundJobState] = mapped_column(Enum(BackgroundJobState), default=BackgroundJobState.pending)

    # time queued
    queued: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # time at which we may next attempt it, for implementing exponential backoff
    next_attempt_after: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # used to count number of retries for failed jobs
    try_count: Mapped[int] = mapped_column(Integer, default=0)

    max_tries: Mapped[int] = mapped_column(Integer, default=5)

    # higher is more important
    priority: Mapped[int] = mapped_column(Integer, server_default=text("10"), init=False)

    # protobuf encoded job payload
    payload: Mapped[bytes] = mapped_column(Binary)

    # if the job failed, we write that info here
    failure_info: Mapped[str | None] = mapped_column(String, default=None)

    __table_args__ = (
        # used in looking up background jobs to attempt
        # create index on background_jobs(priority desc, next_attempt_after) where state = 'pending' OR state = 'error';
        # the worker's try_count < max_tries predicate is deliberately not indexed: a job that runs out of tries is
        # moved to the failed state, which this partial index already excludes, so no indexed row can fail that test
        Index(
            "ix_background_jobs_lookup",
            priority.desc(),
            next_attempt_after,
            postgresql_where=((state == BackgroundJobState.pending) | (state == BackgroundJobState.error)),
        ),
    )

    @hybrid_property
    def ready_for_retry(self) -> Any:
        return (
            (self.next_attempt_after <= func.now())
            & (self.try_count < self.max_tries)
            & ((self.state == BackgroundJobState.pending) | (self.state == BackgroundJobState.error))
        )

    def __repr__(self) -> str:
        return f"BackgroundJob(id={self.id}, job_type={self.job_type}, state={self.state}, next_attempt_after={self.next_attempt_after}, try_count={self.try_count}, failure_info={self.failure_info})"
