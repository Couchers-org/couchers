"""
Background jobs
"""

import logging
from collections.abc import Callable

import google.protobuf.message
from sqlalchemy.orm import Session

from couchers.models import BackgroundJob

logger = logging.getLogger(__name__)


def queue_job[T: google.protobuf.message.Message](
    session: Session,
    job: Callable[[T], None],
    payload: T,
    max_tries: int | None = None,
    priority: int | None = None,
) -> None:
    session.add(
        BackgroundJob(
            job_type=job.__name__,
            payload=payload.SerializeToString(),
            max_tries=max_tries,
            priority=priority,
        )
    )
