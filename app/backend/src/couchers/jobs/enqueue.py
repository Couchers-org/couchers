"""
Background jobs
"""

import logging

from couchers.db import session_scope
from couchers.models import BackgroundJob, BackgroundJobType

logger = logging.getLogger(__name__)


def queue_job(job_type: BackgroundJobType, payload):
    with session_scope() as session:
        job = BackgroundJob(
            job_type=job_type,
            payload=payload.SerializeToString(),
        )
        session.add(job)
        session.flush()
        return job.id
