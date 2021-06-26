import logging
import signal
import sys

import sentry_sdk
from prometheus_client import start_http_server
from sqlalchemy.sql import text

from couchers import config
from couchers.db import apply_migrations, session_scope
from couchers.jobs.worker import start_jobs_scheduler, start_jobs_worker
from couchers.metrics import main_process_registry
from couchers.server import create_main_server, create_media_server
from dummy_data import add_dummy_data

config.check_config()

logging.basicConfig(format="%(asctime)s: %(name)s: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

logging.getLogger("couchers.jobs.worker").setLevel(logging.INFO)

if config.config["SENTRY_ENABLED"]:
    # Sends exception tracebacks to Sentry, a cloud service for collecting exceptions
    sentry_sdk.init(config.config["SENTRY_URL"], traces_sample_rate=0.0)

# Starts a prometheus metrics endpoint
start_http_server(port=8000, registry=main_process_registry)


def log_unhandled_exception(exc_type, exc_value, exc_traceback):
    """Make sure that any unhandled exceptions will write to the logs"""
    if issubclass(exc_type, KeyboardInterrupt):
        # call the default excepthook saved at __excepthook__
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    logger.critical("Unhandled exception", exc_info=(exc_type, exc_value, exc_traceback))


sys.excepthook = log_unhandled_exception

logger.info(f"Checking DB connection")

with session_scope() as session:
    res = session.execute(text("SELECT 42;"))
    if list(res) != [(42,)]:
        raise Exception("Failed to connect to DB")

logger.info(f"Running DB migrations")

apply_migrations()

if config.config["ADD_DUMMY_DATA"]:
    add_dummy_data()

logger.info(f"Starting")

if config.config["ROLE"] in ["api", "all"]:
    server = create_main_server(port=1751)
    server.start()
    media_server = create_media_server(port=1753)
    media_server.start()
    logger.info(f"Serving on 1751 (secure) and 1753 (media)")

if config.config["ROLE"] in ["scheduler", "all"]:
    scheduler = start_jobs_scheduler()

if config.config["ROLE"] in ["worker", "all"]:
    worker = start_jobs_worker()

logger.info("App waiting for signal...")

signal.pause()
