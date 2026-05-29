import logging
import signal
import sys
import threading
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

# ruff: noqa: E402

import sentry_sdk
from sentry_sdk.integrations import excepthook
from sqlalchemy.sql import text

from couchers.config import check_config, config
from couchers.constants import API_BASE_PORT, API_WORKER_COUNT, GRACEFUL_SHUTDOWN_TIMEOUT, MEDIA_PORT
from couchers.db import apply_migrations, db_post_fork, session_scope
from couchers.experimentation import setup_experimentation
from couchers.i18n.locales import get_main_i18next
from couchers.jobs.worker import start_jobs_scheduler, start_jobs_worker
from couchers.metrics import create_prometheus_server
from couchers.server import create_main_server, create_media_server
from couchers.supervisor import supervise
from couchers.tracing import setup_tracing
from dummy_data import add_dummy_data

check_config(config)

logging.basicConfig(
    format="[%(process)5d:%(thread)20d] %(asctime)s: %(name)s:%(lineno)d: %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)


def _run_api_server(port: int) -> None:
    try:
        db_post_fork()
        setup_experimentation()
        setup_tracing()

        server = create_main_server(port=port, start_resource_sampler=True)
        server.start()
        logger.info(f"API worker serving on {port}")

        terminate = threading.Event()
        signal.signal(signal.SIGTERM, lambda *_: terminate.set())
        signal.signal(signal.SIGINT, lambda *_: terminate.set())
        terminate.wait()

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
    logger.info("Running DB migrations")

    apply_migrations()

    get_main_i18next()  # Force eager loading of translations

    if config["ADD_DUMMY_DATA"]:
        add_dummy_data()

    logger.info("Starting")

    children: list[Process] = []

    if config["ROLE"] in ["scheduler", "all"]:
        scheduler = start_jobs_scheduler()
        scheduler.name = "scheduler"
        children.append(scheduler)

    if config["ROLE"] in ["worker", "all"]:
        for i in range(config["BACKGROUND_WORKER_COUNT"]):
            worker = start_jobs_worker()
            worker.name = f"worker-{i}"
            children.append(worker)

    # The multiprocessing start method is forkserver/spawn (Python 3.14 default; never
    # fork), so each worker runs its own per-process init — don't pin set_start_method("fork") to "simplify"
    # this, that reintroduces fork-after-threads hazards.
    if config["ROLE"] in ["api", "all"]:
        for port in range(API_BASE_PORT, API_BASE_PORT + API_WORKER_COUNT):
            api_worker = start_api_worker(port)
            api_worker.name = f"api-{port}"
            children.append(api_worker)

    create_prometheus_server(8000)

    # Must precede setup_tracing(), which reads the `trace_sample_ratio` flag.
    setup_experimentation()

    setup_tracing()

    media_server = None
    if config["ROLE"] in ["api", "all"]:
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
