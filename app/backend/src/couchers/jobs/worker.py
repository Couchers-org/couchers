"""
Background job workers
"""

import logging
import traceback
from datetime import timedelta
from multiprocessing import Process
from sched import scheduler
from time import sleep, time

from google.protobuf import empty_pb2
from psycopg2.errors import LockNotAvailable
from sqlalchemy.exc import OperationalError

from couchers.db import session_scope
from couchers.jobs.definitions import JOBS, SCHEDULE
from couchers.jobs.enqueue import queue_job
from couchers.models import BackgroundJob, BackgroundJobState, BackgroundJobType
from couchers.utils import now

logger = logging.getLogger(__name__)


def process_job(job_id):
    with session_scope(isolation_level="REPEATABLE READ") as session:
        # grab the job
        # a combination of REPEATABLE READ and SELECT ... FOR UPDATE NOWAIT makes sure that only one transaction will
        # modify the job at a time, the NOWAIT (instead of e.g. FOR UPDATE) means that if the job is locked, the
        # transaction will fail without waiting. If we weren't picking out one particular job, we could instead use
        # FOR UPDATE and pick the first ready job
        try:
            job = (
                session.query(BackgroundJob)
                .filter(BackgroundJob.id == job_id)
                .filter(BackgroundJob.is_ready)
                .with_for_update(nowait=True)
                .first()
            )
        except OperationalError as e:
            if isinstance(e.orig, LockNotAvailable):
                logger.info("Job locked")
                return
            else:
                raise

        # if it's gone, too bad
        if not job:
            logger.info("Job gone")
            return

        job.try_count += 1

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
            job.next_attempt_after += timedelta(seconds=15 * (2 ** job.try_count))
            # add some info for debugging
            job.failure_info = traceback.format_exc()

        # exiting ctx manager also releases the row lock


def service_jobs():
    # There should only be one of these service schedulers running at one time
    while True:
        with session_scope() as session:
            job_id = (
                session.query(BackgroundJob.id)
                .filter(BackgroundJob.is_ready)
                .order_by(BackgroundJob.id)
                .with_for_update(skip_locked=True)
                .first()
            )
        # end the transaction and don't keep it open while sleeping
        if job_id:
            process_job(job_id)
        else:
            sleep(1)


def run_scheduler():
    """
    Schedules jobs according to schedule in .definitions
    """
    sched = scheduler(time, sleep)

    def _queue_job(schedule_id):
        job_type, frequency = SCHEDULE[schedule_id]
        logger.info(f"Scheduling job of type {job_type}")
        # queue the job
        queue_job(job_type, empty_pb2.Empty())
        # wake ourselves up after frequency timedelta
        sched.enter(frequency.total_seconds(), 1, _queue_job, argument=(schedule_id,))

    for schedule_id, _ in enumerate(SCHEDULE):
        sched.enter(0, 1, _queue_job, argument=(schedule_id,))

    sched.run()
    raise Exception("End of scheduler?")


def start_job_servicer():
    bg_loop = Process(target=service_jobs)
    bg_loop.start()
    bg_scheduler = Process(target=run_scheduler)
    bg_scheduler.start()
    return (bg_loop, bg_scheduler)
