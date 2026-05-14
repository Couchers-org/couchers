"""
Background job workers
"""

import logging
import traceback
from collections.abc import Callable
from datetime import timedelta
from multiprocessing import Process
from sched import scheduler
from time import monotonic, perf_counter_ns, sleep
from typing import Any

import sentry_sdk
import sqlalchemy.exc
from google.protobuf import empty_pb2
from opentelemetry import trace
from sqlalchemy import select

from couchers.config import config
from couchers.db import db_post_fork, session_scope, worker_repeatable_read_session_scope
from couchers.experimentation import setup_experimentation
from couchers.jobs.definitions import JOBS, Job
from couchers.jobs.enqueue import queue_job
from couchers.metrics import (
    background_jobs_got_job_counter,
    background_jobs_no_jobs_counter,
    background_jobs_serialization_errors_counter,
    jobs_queued_histogram,
    observe_in_jobs_duration_histogram,
)
from couchers.models import BackgroundJob, BackgroundJobState
from couchers.tracing import setup_tracing
from couchers.utils import now

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


def process_job() -> bool:
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
                    .limit(1)
                    .with_for_update(skip_locked=True)
                )
                .scalars()
                .one_or_none()
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

        job_def = JOBS[job.job_type]

        jobs_queued_histogram.observe((now() - job.queued).total_seconds())
        try:
            with tracer.start_as_current_span(job.job_type) as rollspan:
                start = perf_counter_ns()
                job_def.handler(job_def.payload_type.FromString(job.payload))
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


def service_jobs() -> None:
    """
    Service jobs in an infinite loop
    """
    while True:
        # if no job was found, sleep for a second, otherwise query for another job straight away
        if not process_job():
            sleep(1)


def _run_job_and_schedule(sched: scheduler, job_def: Job[Any], frequency: timedelta) -> None:
    logger.info(f"Processing job of type {job_def.name}")

    # wake ourselves up after frequency
    sched.enter(
        delay=frequency.total_seconds(),
        priority=1,
        action=_run_job_and_schedule,
        argument=(
            sched,
            job_def,
            frequency,
        ),
    )

    # queue the job
    with session_scope() as session:
        queue_job(session, job=job_def.handler, payload=empty_pb2.Empty())


def run_scheduler() -> None:
    """
    Schedules jobs according to schedule in JOBS
    """
    sched = scheduler(monotonic, sleep)

    for job_type, job_def in JOBS.items():
        if job_def.schedule is not None:
            sched.enter(
                delay=0,
                priority=1,
                action=_run_job_and_schedule,
                argument=(
                    sched,
                    job_def,
                    job_def.schedule,
                ),
            )

    sched.run()


def _run_forever(func: Callable[[], None]) -> None:
    # Post-fork initialization: these services use threading/async internals that
    # don't survive fork() and must be initialized fresh in each child process
    db_post_fork()
    setup_tracing()
    setup_experimentation()

    while True:
        try:
            logger.info("Background worker starting")
            func()
        except Exception as e:
            logger.critical("Unhandled exception in background worker", exc_info=e)
            # cool off in case we have some programming error to not hammer the database
            sleep(60)


def start_jobs_scheduler() -> Process:
    scheduler = Process(
        target=_run_forever,
        args=(run_scheduler,),
    )
    scheduler.start()
    return scheduler


def start_jobs_worker() -> Process:
    worker = Process(target=_run_forever, args=(service_jobs,))
    worker.start()
    return worker
