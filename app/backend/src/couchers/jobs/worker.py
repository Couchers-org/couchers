"""
Background job workers
"""

import logging
import traceback
from concurrent import futures
from datetime import timedelta
from multiprocessing import Process
from sched import scheduler
from time import sleep, time

from google.protobuf import empty_pb2
from psycopg2.errors import ProgrammingError
from sqlalchemy.exc import OperationalError

from couchers.db import get_engine, session_scope
from couchers.jobs.definitions import JOBS, SCHEDULE
from couchers.jobs.enqueue import queue_job
from couchers.models import BackgroundJob, BackgroundJobState, BackgroundJobType
from couchers.utils import now

logger = logging.getLogger(__name__)


def process_job():
    logger.info(f"Processing a job")
    with session_scope(isolation_level="REPEATABLE READ") as session:
        # a combination of REPEATABLE READ and SELECT ... FOR UPDATE SKIP LOCKED makes sure that only one transaction
        # will modify the job at a time. SKIP UPDATE means that if the job is locked, then we ignore that row, it's
        # easier to use SKIP LOCKED vs NOWAIT in the ORM, with NOWAIT you get an ugly error from psycopg2
        job = (
            session.query(BackgroundJob)
            .filter(BackgroundJob.ready_for_retry)
            .filter(BackgroundJob.state == BackgroundJobState.pending)
            .with_for_update(skip_locked=True)
            .first()
        )

        if not job:
            logger.info(f"No pending jobs")
            return

        # we've got a lock for a job now, it's "pending" until we commit or the lock is gone
        logger.info(f"Job #{job.id} grabbed")

        job.try_count += 1

        try:
            message_type, func = JOBS[job.job_type]
            ret = func(message_type.FromString(job.payload))
            job.state = BackgroundJobState.completed
            logger.info(f"Job #{job.id} complete on try number {job.try_count}")
        except Exception as e:
            if job.try_count >= job.max_tries:
                # if we already tried max_tries times, it's permanently failed
                job.state = BackgroundJobState.failed
                logger.info(f"Job #{job.id} failed on try number {job.try_count}")
            else:
                job.state = BackgroundJobState.error
                # exponential backoff
                job.next_attempt_after += timedelta(seconds=15 * (2 ** job.try_count))
                logger.info(f"Job #{job.id} error on try number {job.try_count}, next try at {job.next_attempt_after}")
            # add some info for debugging
            job.failure_info = traceback.format_exc()

        # exiting ctx manager commits and releases the row lock


def service_jobs():
    """
    Don't run many of these simultaneously: it'll work but it'll conflict and cause a lot of missed job processing.
    """
    get_engine().dispose()

    MAX_WORKERS = 8
    with futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        jobs = []
        while True:
            # jobs should be list of currently running jobs
            jobs = [job for job in jobs if not job.done()]
            idle_workers = MAX_WORKERS - len(jobs)
            if idle_workers == 0:
                # if we're at max capacity, then wait for one job to finish
                futures.wait(jobs, return_when=futures.FIRST_COMPLETED)

                # loop back to start, it's cleaner
                continue

            wait = False

            with session_scope() as session:
                job_ids = (
                    session.query(BackgroundJob.id)
                    .filter(BackgroundJob.ready_for_retry)
                    .filter(BackgroundJob.state == BackgroundJobState.pending)
                    .limit(idle_workers)
                    .with_for_update(skip_locked=True)
                    .all()
                )
                # end the transaction and don't keep it open while sleeping, etc

            if len(job_ids) > 0:
                for _ in range(min(len(job_ids), idle_workers)):
                    jobs.append(executor.submit(process_job))
            else:
                # no jobs to work on, don't hammer the DB, we can wait a second
                sleep(1)


def run_scheduler():
    """
    Schedules jobs according to schedule in .definitions
    """
    get_engine().dispose()

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


def _run_forever(func):
    while True:
        try:
            logger.critical("Background worker starting")
            func()
        except Exception as e:
            logger.critical("Unhandled exception in background worker", exc_info=e)


def start_job_servicer():
    bg_loop = Process(target=_run_forever, args=(service_jobs,))
    bg_loop.start()
    bg_scheduler = Process(target=_run_forever, args=(run_scheduler,))
    bg_scheduler.start()
    return (bg_loop, bg_scheduler)
