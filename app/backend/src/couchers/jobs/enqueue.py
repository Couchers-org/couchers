"""
Background jobs
"""

import logging

from couchers.db import session_scope
from couchers.models import BackgroundJob

logger = logging.getLogger(__name__)


def queue_job(job_type: str, payload, max_tries=None):
    with session_scope() as session:
        job = BackgroundJob(
            job_type=job_type,
            payload=payload.SerializeToString(),
            max_tries=max_tries,
        )
        session.add(job)
        return job.id
