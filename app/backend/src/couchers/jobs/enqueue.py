"""
Background jobs
"""

import logging
from datetime import timedelta

from google.protobuf.message import Message
from sqlalchemy.orm import Session

from couchers.models import BackgroundJob
from couchers.utils import now

logger = logging.getLogger(__name__)


def queue_job(
    session: Session,
    job_type: str,
    payload: Message,
    max_tries: int | None = None,
    priority: int | None = None,
    delay: timedelta | None = None,
) -> None:
    job = BackgroundJob(
        job_type=job_type,
        payload=payload.SerializeToString(),
        max_tries=max_tries,
        priority=priority,
    )
    if delay is not None:
        job.next_attempt_after = now() + delay
    session.add(job)
