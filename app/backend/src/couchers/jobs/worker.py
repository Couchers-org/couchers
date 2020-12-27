"""
Background job workers
"""

import logging
from time import sleep

from couchers.db import session_scope
from couchers.jobs import JOBS
from couchers.models import BackgroundJob, BackgroundJobState, BackgroundJobType
from couchers.utils import now

logger = logging.getLogger(__name__)


def service_jobs():
    jobs_dict = {job[0]: (job[1], job[2]) for job in JOBS}
    while True:
        # TODO TODO TODO
        with session_scope() as session:
            job = (
                session.query(BackgroundJob)
                .filter(BackgroundJob.state == BackgroundJobState.pending)
                .filter(BackgroundJob.next_attempt <= now())
                .first()
            )
            if not job:
                logger.info("Sleepin'!")
                sleep(5)
                continue
            else:
                job.state = BackgroundJobState.working
                job.try_count += 1
                session.commit()
                job_info = jobs_dict.get(job.job_type)
                if not job_info:
                    raise Exception("No servicer for job type")
                else:
                    message_type, func = job_info
                    ret = func(message_type.FromString(job.payload))
                    logger.info(f"ret {ret}")
                    job.state = BackgroundJobState.completed
                    session.commit()
