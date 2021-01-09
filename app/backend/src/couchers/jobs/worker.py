"""
Background job workers
"""

import logging
import traceback
from multiprocessing import Process
from time import sleep

from couchers.db import session_scope
from couchers.jobs.definitions import JOBS
from couchers.models import BackgroundJob, BackgroundJobState, BackgroundJobType
from couchers.utils import now

logger = logging.getLogger(__name__)

# Note that the database stuff here isn't perfect, it has some issues with having multiple parallel servicers
# See: https://www.2ndquadrant.com/en/blog/what-is-select-skip-locked-for-in-postgresql-9-5/


def process_job(job_id):
    with session_scope() as session:
        # grab the job
        job = (
            session.query(BackgroundJob).filter(BackgroundJob.id == job_id).filter(BackgroundJob.is_ready).one_or_none()
        )
        # if it's gone, too bad
        if not job:
            return

        # mark it as ours
        job.state = BackgroundJobState.working
        job.try_count += 1
        session.commit()

        try:
            message_type, func = JOBS[job.job_type]
            ret = func(message_type.FromString(job.payload))
            job.state = BackgroundJobState.completed
        except Exception as e:
            if job.try_count >= job.max_tries:
                # if we already tried max_tries times, it's permanently failed
                job.state = BackgroundJobState.failed
            else:
                job.state = BackgroundJobState.error
            # exponential backoff
            job.next_attempt_after = 5 * (2 ** job.try_count)
            # add some info for debugging
            job.failure_info = traceback.format_exc()
        session.commit()


def service_jobs():
    # There should only be one of these service schedulers running at one time
    while True:
        with session_scope() as session:
            job = session.query(BackgroundJob).filter(BackgroundJob.is_ready).first()
            if not job:
                sleep(2)
                continue
            else:
                process_job(job.id)


def start_job_servicer():
    bg = Process(target=service_jobs)
    bg.start()
    return bg
