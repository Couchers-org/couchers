import logging
import signal
import sys
from os import environ
from tempfile import TemporaryDirectory

# these two lines need to be at the top of the file before we span child processes
# this temp dir will be destroyed when prometheus_multiproc_dir is destroyed, aka at the end of the program
prometheus_multiproc_dir = TemporaryDirectory()
environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name
# ruff: noqa: E402

import sentry_sdk
from sentry_sdk.integrations import argv, atexit, dedupe, modules, stdlib, threading
from sentry_sdk.integrations import logging as sentry_logging
from sqlalchemy.sql import text

from couchers.config import check_config, config
from couchers.db import apply_migrations, session_scope
from couchers.jobs.worker import start_jobs_scheduler, start_jobs_worker
from couchers.metrics import create_prometheus_server
from couchers.server import create_main_server, create_media_server
from couchers.tracing import setup_tracing
from dummy_data import add_dummy_data

check_config()

logging.basicConfig(format="[%(process)5d:%(thread)20d] %(asctime)s: %(name)s: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

if config["SENTRY_ENABLED"]:
    # Sends exception tracebacks to Sentry, a cloud service for collecting exceptions
    sentry_sdk.init(
        config["SENTRY_URL"],
        traces_sample_rate=0.0,
        environment=config["COOKIE_DOMAIN"],
        release=config["VERSION"],
        default_integrations=False,
        integrations=[
            # we need to manually list out the integrations, there is no other way of disabling the global excepthook integration
            # we want to disable that because it seems to be picking up already handled gRPC errors (e.g. grpc.StatusCode.NOT_FOUND)
            argv.ArgvIntegration(),
            atexit.AtexitIntegration(),
            dedupe.DedupeIntegration(),
            sentry_logging.LoggingIntegration(),
            modules.ModulesIntegration(),
            stdlib.StdlibIntegration(),
            threading.ThreadingIntegration(),
        ],
    )

# used to export metrics
create_prometheus_server(8000)


def log_unhandled_exception(exc_type, exc_value, exc_traceback):
    """Make sure that any unhandled exceptions will write to the logs"""
    if issubclass(exc_type, KeyboardInterrupt):
        # call the default excepthook saved at __excepthook__
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    logger.critical("Unhandled exception", exc_info=(exc_type, exc_value, exc_traceback))


sys.excepthook = log_unhandled_exception

logger.info("Checking DB connection")

with session_scope() as session:
    res = session.execute(text("SELECT 42;"))
    if list(res) != [(42,)]:
        raise Exception("Failed to connect to DB")

logger.info("Running DB migrations")

apply_migrations()

if config["ADD_DUMMY_DATA"]:
    add_dummy_data()

logger.info("Starting")

if config["ROLE"] in ["scheduler", "all"]:
    scheduler = start_jobs_scheduler()

if config["ROLE"] in ["worker", "all"]:
    for _ in range(config["BACKGROUND_WORKER_COUNT"]):
        start_jobs_worker()

setup_tracing()

if config["ROLE"] in ["api", "all"]:
    server = create_main_server(port=1751)
    server.start()
    media_server = create_media_server(port=1753)
    media_server.start()
    logger.info("Serving on 1751 (secure) and 1753 (media)")

logger.info("App waiting for signal...")

signal.pause()
