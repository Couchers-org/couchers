"""
Background job workers
"""

import logging
import traceback
from datetime import timedelta
from inspect import getmembers, isfunction
from multiprocessing import Process
from sched import scheduler
from time import monotonic, perf_counter_ns, sleep

import sentry_sdk
import sqlalchemy.exc
from google.protobuf import empty_pb2
from opentelemetry import trace

from couchers.config import config
from couchers.db import db_post_fork, session_scope, worker_repeatable_read_session_scope
from couchers.jobs import handlers
from couchers.jobs.enqueue import queue_job
from couchers.metrics import (
    background_jobs_got_job_counter,
    background_jobs_no_jobs_counter,
    background_jobs_serialization_errors_counter,
    jobs_queued_histogram,
    observe_in_jobs_duration_histogram,
)
from couchers.models import BackgroundJob, BackgroundJobState
from couchers.sql import couchers_select as select
from couchers.tracing import setup_tracing
from couchers.utils import now

logger = logging.getLogger(__name__)
trace = trace.get_tracer(__name__)

JOBS = {}
SCHEDULE = []

for name, func in getmembers(handlers, isfunction):
    if hasattr(func, "PAYLOAD"):
        JOBS[name] = (func.PAYLOAD, func)
        if hasattr(func, "SCHEDULE"):
            SCHEDULE.append((name, func.SCHEDULE))


def process_job():
    """
    Attempt to process one job from the job queue. Returns False if no job was found, True if a job was processed,
    regardless of failure/success.
    """
    logger.debug("Looking for a job")

    with worker_repeatable_read_session_scope() as session:
        # a combination of REPEATABLE READ and SELECT ... FOR UPDATE SKIP LOCKED makes sure that only one transaction
        # will modify the job at a time. SKIP UPDATE means that if the job is locked, then we ignore that row, it's
        # easier to use SKIP LOCKED vs NOWAIT in the ORM, with NOWAIT you get an ugly exception from deep inside
        # psycopg2 that's quite annoying to catch and deal with
        try:
            job = (
                session.execute(
                    select(BackgroundJob)
                    .where(BackgroundJob.ready_for_retry)
                    .order_by(BackgroundJob.priority.desc(), BackgroundJob.next_attempt_after.asc())
                    .with_for_update(skip_locked=True)
                )
                .scalars()
                .first()
            )
        except sqlalchemy.exc.OperationalError:
            background_jobs_serialization_errors_counter.inc()
            logger.debug("Serialization error")
            return False

        if not job:
            background_jobs_no_jobs_counter.inc()
            logger.debug("No pending jobs")
            return False

        background_jobs_got_job_counter.inc()

        # we've got a lock for a job now, it's "pending" until we commit or the lock is gone
        logger.info(f"Job #{job.id} of type {job.job_type} grabbed")
        job.try_count += 1

        message_type, func = JOBS[job.job_type]

        jobs_queued_histogram.observe((now() - job.queued).total_seconds())
        try:
            with trace.start_as_current_span(job.job_type) as rollspan:
                start = perf_counter_ns()
                ret = func(message_type.FromString(job.payload))
                finished = perf_counter_ns()
            job.state = BackgroundJobState.completed
            observe_in_jobs_duration_histogram(
                job.job_type, job.state.name, job.try_count, "", (finished - start) / 1e9
            )
            logger.info(f"Job #{job.id} complete on try number {job.try_count}")
        except Exception as e:
            finished = perf_counter_ns()
            logger.exception(e)
            sentry_sdk.set_tag("context", "job")
            sentry_sdk.set_tag("job", job.job_type)
            sentry_sdk.capture_exception(e)

            if job.try_count >= job.max_tries:
                # if we already tried max_tries times, it's permanently failed
                job.state = BackgroundJobState.failed
                logger.info(f"Job #{job.id} failed on try number {job.try_count}")
            else:
                job.state = BackgroundJobState.error
                # exponential backoff
                job.next_attempt_after += timedelta(seconds=15 * (2**job.try_count))
                logger.info(f"Job #{job.id} error on try number {job.try_count}, next try at {job.next_attempt_after}")
            observe_in_jobs_duration_histogram(
                job.job_type, job.state.name, job.try_count, type(e).__name__, (finished - start) / 1e9
            )
            # add some info for debugging
            job.failure_info = traceback.format_exc()

            if config["IN_TEST"]:
                raise e

        # exiting ctx manager commits and releases the row lock
    return True


def service_jobs():
    """
    Service jobs in an infinite loop
    """
    while True:
        # if no job was found, sleep for a second, otherwise query for another job straight away
        if not process_job():
            sleep(1)


def _run_job_and_schedule(sched, schedule_id):
    job_type, frequency = SCHEDULE[schedule_id]
    logger.info(f"Processing job of type {job_type}")

    # wake ourselves up after frequency
    sched.enter(
        frequency.total_seconds(),
        1,
        _run_job_and_schedule,
        argument=(
            sched,
            schedule_id,
        ),
    )

    # queue the job
    with session_scope() as session:
        queue_job(session, job_type, empty_pb2.Empty())


def run_scheduler():
    """
    Schedules jobs according to schedule in .definitions
    """
    sched = scheduler(monotonic, sleep)

    for schedule_id, (job_type, frequency) in enumerate(SCHEDULE):
        sched.enter(
            0,
            1,
            _run_job_and_schedule,
            argument=(
                sched,
                schedule_id,
            ),
        )

    sched.run()


def _run_forever(func):
    db_post_fork()
    setup_tracing()

    while True:
        try:
            logger.critical("Background worker starting")
            func()
        except Exception as e:
            logger.critical("Unhandled exception in background worker", exc_info=e)
            # cool off in case we have some programming error to not hammer the database
            sleep(60)


def start_jobs_scheduler():
    scheduler = Process(
        target=_run_forever,
        args=(run_scheduler,),
    )
    scheduler.start()
    return scheduler


def start_jobs_worker():
    worker = Process(target=_run_forever, args=(service_jobs,))
    worker.start()
    return worker
