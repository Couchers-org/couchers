"""
Background jobs
"""

import logging

from google.protobuf.message import Message
from sqlalchemy.orm import Session

from couchers.models import BackgroundJob

logger = logging.getLogger(__name__)


def queue_job(
    session: Session,
    job_type: str,
    payload: Message,
    max_tries: int | None = None,
    priority: int | None = None,
) -> None:
    session.add(
        BackgroundJob(
            job_type=job_type,
            payload=payload.SerializeToString(),
            max_tries=max_tries,
            priority=priority,
        )
    )
