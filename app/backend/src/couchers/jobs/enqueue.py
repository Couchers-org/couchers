"""
Background jobs
"""

import logging

from couchers.db import session_scope
from couchers.models import BackgroundJob, BackgroundJobType

logger = logging.getLogger(__name__)


def queue_job(job_type: BackgroundJobType, payload, max_tries=2):
    with session_scope() as session:
        job = BackgroundJob(
            job_type=job_type,
            payload=payload.SerializeToString(),
            max_tries=max_tries,
        )
        session.add(job)
        return job.id
