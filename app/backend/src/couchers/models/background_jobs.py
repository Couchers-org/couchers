import enum

from sqlalchemy import BigInteger, Column, DateTime, Enum, Index, Integer, String, func, text
from sqlalchemy import LargeBinary as Binary
from sqlalchemy.ext.hybrid import hybrid_property

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


class BackgroundJob(Base):
    """
    This table implements a queue of background jobs.
    """

    __tablename__ = "background_jobs"

    id = Column(BigInteger, primary_key=True)

    # used to discern which function should be triggered to service it
    job_type = Column(String, nullable=False)
    state = Column(Enum(BackgroundJobState), nullable=False, default=BackgroundJobState.pending)

    # time queued
    queued = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # time at which we may next attempt it, for implementing exponential backoff
    next_attempt_after = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # used to count number of retries for failed jobs
    try_count = Column(Integer, nullable=False, default=0)

    max_tries = Column(Integer, nullable=False, default=5)

    # higher is more important
    priority = Column(Integer, nullable=False, server_default=text("10"))

    # protobuf encoded job payload
    payload = Column(Binary, nullable=False)

    # if the job failed, we write that info here
    failure_info = Column(String, nullable=True)

    __table_args__ = (
        # used in looking up background jobs to attempt
        # create index on background_jobs(priority desc, next_attempt_after, (max_tries - try_count)) where state = 'pending' OR state = 'error';
        Index(
            "ix_background_jobs_lookup",
            priority.desc(),
            next_attempt_after,
            (max_tries - try_count),
            postgresql_where=((state == BackgroundJobState.pending) | (state == BackgroundJobState.error)),
        ),
    )

    @hybrid_property
    def ready_for_retry(self):
        return (
            (self.next_attempt_after <= func.now())
            & (self.try_count < self.max_tries)
            & ((self.state == BackgroundJobState.pending) | (self.state == BackgroundJobState.error))
        )

    def __repr__(self):
        return f"BackgroundJob(id={self.id}, job_type={self.job_type}, state={self.state}, next_attempt_after={self.next_attempt_after}, try_count={self.try_count}, failure_info={self.failure_info})"
