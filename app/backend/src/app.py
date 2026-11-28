import json
import logging
import sys
from datetime import UTC, datetime
from multiprocessing import Process
from os import environ
from tempfile import TemporaryDirectory
from time import sleep
from types import TracebackType
from typing import Any

# these two lines need to be at the top of the file before we span child processes
# this temp dir will be destroyed when prometheus_multiproc_dir is destroyed, aka at the end of the program.
# Also note that this should only be done in the main process.
if __name__ == "__main__":
    prometheus_multiproc_dir = TemporaryDirectory()
    environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name

# ruff: noqa: E402

import sentry_sdk
from sentry_sdk.integrations import excepthook
from sentry_sdk.integrations.logging import LoggingIntegration
from sqlalchemy.sql import text

from couchers.config import config
from couchers.constants import API_BASE_PORT, API_WORKER_COUNT, GRACEFUL_SHUTDOWN_TIMEOUT, MEDIA_PORT
from couchers.db import apply_migrations, db_post_fork, session_scope
from couchers.experimentation import setup_experimentation
from couchers.i18n.locales import get_main_i18next
from couchers.jobs.worker import start_jobs_scheduler, start_jobs_worker
from couchers.metrics import create_prometheus_server
from couchers.profiling import setup_profiling
from couchers.proto_serde_metrics import install_proto_serde_metrics
from couchers.server import create_main_server, create_media_server
from couchers.session_activity import start_session_activity_compactor
from couchers.supervisor import catch_shutdown_signals, supervise
from couchers.tracing import setup_tracing
from dummy_data import add_dummy_data

config.check()
install_proto_serde_metrics()


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, Any] = {
            "time": datetime.fromtimestamp(record.created, UTC).isoformat(timespec="microseconds"),
            "level": record.levelname,
            "logger": record.name,
            "function": record.funcName,
            "line": record.lineno,
            "process": record.process,
            "thread": record.threadName,
            "message": record.getMessage(),
        }
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        if record.stack_info:
            entry["stack"] = self.formatStack(record.stack_info)
        return json.dumps(entry)


log_handler = logging.StreamHandler()
if config.DEV:
    log_handler.setFormatter(
        logging.Formatter("[%(process)5d:%(threadName)-20s] %(asctime)s: %(name)s:%(lineno)d: %(message)s")
    )
else:
    log_handler.setFormatter(JsonFormatter())
logging.basicConfig(handlers=[log_handler], level=logging.INFO)
logger = logging.getLogger(__name__)


def _run_api_server(port: int) -> None:
    try:
        db_post_fork()
        setup_experimentation()
        setup_tracing()
        setup_profiling(role="api", instance=f"api-{port}")

        server = create_main_server(port=port, start_resource_sampler=True)
        server.start()
        logger.info(f"API worker serving on {port}")

        terminate = catch_shutdown_signals()
        while not terminate.is_set():
            sleep(1)

        logger.info(f"API worker on {port} draining (up to {GRACEFUL_SHUTDOWN_TIMEOUT}s)")
        server.stop(GRACEFUL_SHUTDOWN_TIMEOUT).wait()
    except Exception:
        # multiprocessing would only print this to stderr; send the traceback to Sentry (and flush, since
        # the process is about to die and the parent will restart the container) before re-raising
        sentry_sdk.capture_exception()
        sentry_sdk.flush()
        raise


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

    if config.SENTRY_ENABLED:
        # Sends exception tracebacks to Sentry, a cloud service for collecting exceptions
        sentry_sdk.init(
            config.SENTRY_URL,
            traces_sample_rate=0.0,
            environment=config.COOKIE_DOMAIN,
            release=config.VERSION,
            # The global excepthook picks up already handled gRPC errors (e.g. grpc.StatusCode.NOT_FOUND)
            disabled_integrations=[
                excepthook.ExcepthookIntegration(),
            ],
            integrations=[
                LoggingIntegration(event_level=logging.CRITICAL),
            ],
        )

    logger.info("Checking DB connection")
    with session_scope() as session:
        res = session.execute(text("SELECT 42;"))
        if list(res) != [(42,)]:
            raise Exception("Failed to connect to DB")


def main() -> None:
    logger.info("Running DB migrations")

    apply_migrations()

    get_main_i18next()  # Force eager loading of translations

    if config.ADD_DUMMY_DATA:
        add_dummy_data()

    logger.info("Starting")

    children: list[Process] = []

    if config.ROLE in ["scheduler", "all"]:
        scheduler = start_jobs_scheduler()
        scheduler.name = "scheduler"
        children.append(scheduler)

    if config.ROLE in ["compactor", "all"]:
        compactor = start_session_activity_compactor()
        compactor.name = "session-activity-compactor"
        children.append(compactor)

    if config.ROLE in ["worker", "all"]:
        for i in range(config.BACKGROUND_WORKER_PROCESSES):
            worker = start_jobs_worker(i, config.BACKGROUND_WORKER_THREADS_PER_PROCESS)
            worker.name = f"worker-{i}"
            children.append(worker)

    # The multiprocessing start method is forkserver/spawn (Python 3.14 default; never
    # fork), so each worker runs its own per-process init — don't pin set_start_method("fork") to "simplify"
    # this, that reintroduces fork-after-threads hazards.
    if config.ROLE in ["api", "all"]:
        for port in range(API_BASE_PORT, API_BASE_PORT + API_WORKER_COUNT):
            api_worker = start_api_worker(port)
            api_worker.name = f"api-{port}"
            children.append(api_worker)

    create_prometheus_server(8000)

    # Must precede setup_tracing(), which reads the `trace_sample_ratio` flag.
    setup_experimentation()

    setup_tracing()

    setup_profiling(role="main", instance="main")

    media_server = None
    if config.ROLE in ["api", "all"]:
        media_server = create_media_server(port=MEDIA_PORT)
        media_server.start()
        logger.info(f"Media server serving on {MEDIA_PORT}")

    logger.info("App started, supervising child processes")
    crashed = supervise(children, parent_servers=[media_server] if media_server is not None else [])

    if crashed is not None:
        sys.exit(1)


if __name__ == "__main__":
    common_init()
    main()
elif __name__ == "__mp_main__":  # processes created via multiprocessing
    common_init()
