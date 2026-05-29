import logging
import signal
import sys
from multiprocessing import Process
from os import environ
from tempfile import TemporaryDirectory
from types import TracebackType

# these two lines need to be at the top of the file before we span child processes
# this temp dir will be destroyed when prometheus_multiproc_dir is destroyed, aka at the end of the program.
# Also note that this should only be done in the main process.
if __name__ == "__main__":
    prometheus_multiproc_dir = TemporaryDirectory()
    environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name

# must be set before grpc is imported (transitively, via couchers.server)
environ["GRPC_ENABLE_FORK_SUPPORT"] = "1"
# ruff: noqa: E402

import sentry_sdk
from sentry_sdk.integrations import excepthook
from sqlalchemy.sql import text

from couchers.config import check_config, config
from couchers.db import apply_migrations, db_post_fork, session_scope
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

# the api workers listen on API_BASE_PORT .. API_BASE_PORT + API_WORKER_COUNT - 1; this must stay in sync with
# proxy/envoy.yaml and docker-compose.prod.yml
API_WORKER_COUNT = 4
API_BASE_PORT = 1761
MEDIA_PORT = 1753


def _run_api_server(port: int) -> None:
    # post-fork init, mirroring jobs.worker._run_forever
    db_post_fork()
    setup_experimentation()
    setup_tracing()

    server = create_main_server(port=port)
    server.start()
    logger.info(f"API worker serving on {port}")
    server.wait_for_termination()


def start_api_worker(port: int) -> Process:
    worker = Process(target=_run_api_server, args=(port,))
    worker.start()
    return worker


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


def common_init() -> None:
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


def main() -> None:
    # used to export metrics
    create_prometheus_server(8000)

    logger.info("Running DB migrations")

    apply_migrations()

    get_main_i18next()  # Force eager loading of translations

    if config["ADD_DUMMY_DATA"]:
        add_dummy_data()

    logger.info("Starting")

    if config["ROLE"] in ["scheduler", "all"]:
        start_jobs_scheduler()

    if config["ROLE"] in ["worker", "all"]:
        for _ in range(config["BACKGROUND_WORKER_COUNT"]):
            start_jobs_worker()

    # fork the API workers before the parent touches gRPC (media server below + OTLP exporter); each child
    # creates its own gRPC server post-fork, spreading request handling across cores instead of one GIL
    if config["ROLE"] in ["api", "all"]:
        for port in range(API_BASE_PORT, API_BASE_PORT + API_WORKER_COUNT):
            start_api_worker(port)

    # Initialize the experimentation framework for feature flags in the main process.
    # Worker and API processes initialize their own instance post-fork.
    # Must precede setup_tracing(), which reads the `trace_sample_ratio` flag.
    setup_experimentation()

    setup_tracing()

    if config["ROLE"] in ["api", "all"]:
        media_server = create_media_server(port=MEDIA_PORT)
        media_server.start()
        logger.info(f"Media server serving on {MEDIA_PORT}")

    logger.info("App waiting for signal...")

    signal.pause()


if __name__ == "__main__":
    common_init()
    main()
elif __name__ == "__mp_main__":  # processes created via multiprocessing
    common_init()
