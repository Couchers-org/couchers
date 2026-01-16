import logging
import signal
import sys
from os import environ
from tempfile import TemporaryDirectory
from types import TracebackType

# these two lines need to be at the top of the file before we span child processes
# this temp dir will be destroyed when prometheus_multiproc_dir is destroyed, aka at the end of the program
prometheus_multiproc_dir = TemporaryDirectory()
environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name
# ruff: noqa: E402

import sentry_sdk
from sentry_sdk.integrations import excepthook
from sqlalchemy.sql import text

from couchers.config import check_config, config
from couchers.db import apply_migrations, session_scope
from couchers.experimentation import setup_experimentation
from couchers.i18n.localize import get_main_i18next
from couchers.jobs.worker import start_jobs_scheduler, start_jobs_worker
from couchers.metrics import create_prometheus_server
from couchers.server import create_main_server, create_media_server
from couchers.tracing import setup_tracing
from dummy_data import add_dummy_data

check_config(config)

logging.basicConfig(
    format="[%(process)5d:%(thread)20d] %(asctime)s: %(name)s:%(lineno)d: %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)


def log_unhandled_exception(
    exc_type: type[BaseException],
    exc_value: BaseException,
    exc_traceback: TracebackType | None,
) -> None:
    """Make sure that any unhandled exceptions will write to the logs"""
    if issubclass(exc_type, KeyboardInterrupt):
        # call the default excepthook saved at __excepthook__
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    logger.critical("Unhandled exception", exc_info=(exc_type, exc_value, exc_traceback))


sys.excepthook = log_unhandled_exception

if config["SENTRY_ENABLED"]:
    # Sends exception tracebacks to Sentry, a cloud service for collecting exceptions
    sentry_sdk.init(
        config["SENTRY_URL"],
        traces_sample_rate=0.0,
        environment=config["COOKIE_DOMAIN"],
        release=config["VERSION"],
        # The global excepthook picks up already handled gRPC errors (e.g. grpc.StatusCode.NOT_FOUND)
        disabled_integrations=[
            excepthook.ExcepthookIntegration(),
        ],
    )

logger.info("Checking DB connection")
with session_scope() as session:
    res = session.execute(text("SELECT 42;"))
    if list(res) != [(42,)]:
        raise Exception("Failed to connect to DB")


# In other processes __name__ is __mp_main__
if __name__ == "__main__":
    # used to export metrics
    create_prometheus_server(8000)

    logger.info("Running DB migrations")

    apply_migrations()

    get_main_i18next()  # Force eager loading of translations

    if config["ADD_DUMMY_DATA"]:
        add_dummy_data()

    logger.info("Starting")

    if config["ROLE"] in ["scheduler", "all"]:
        scheduler = start_jobs_scheduler()

    if config["ROLE"] in ["worker", "all"]:
        for _ in range(config["BACKGROUND_WORKER_COUNT"]):
            start_jobs_worker()

    setup_tracing()

    # Initialize the experimentation framework for feature flags in the main process.
    # IMPORTANT: This MUST be called AFTER worker processes are spawned (above).
    # The underlying SDK uses internal threading that doesn't survive fork().
    # Worker processes initialize their own instance in _run_forever().
    setup_experimentation()

    if config["ROLE"] in ["api", "all"]:
        server = create_main_server(port=1751)
        server.start()
        media_server = create_media_server(port=1753)
        media_server.start()
        logger.info("Serving on 1751 (secure) and 1753 (media)")

    logger.info("App waiting for signal...")

    signal.pause()
