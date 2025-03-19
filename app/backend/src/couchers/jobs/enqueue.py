"""
Background jobs
"""

import logging

from couchers.models import BackgroundJob

logger = logging.getLogger(__name__)


def queue_job(session, job_type: str, payload, max_tries=None, priority=None):
    session.add(
        BackgroundJob(
            job_type=job_type,
            payload=payload.SerializeToString(),
            max_tries=max_tries,
            priority=priority,
        )
    )
