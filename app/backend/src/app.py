import logging
import sys

from app_bg import run_background, terminate_background
from app_fg import run_foreground, terminate_foreground
from couchers import config
from couchers.db import apply_migrations, session_scope
from dummy_data import add_dummy_data

config.check_config()

logging.basicConfig(format="%(asctime)s: %(name)d: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)


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
    res = session.execute("SELECT 42;")
    if list(res) != [(42,)]:
        raise Exception("Failed to connect to DB")

logger.info(f"Running DB migrations")

apply_migrations()

if config.config["ADD_DUMMY_DATA"]:
    add_dummy_data()

logger.info(f"Starting")

if config.config["ROLE"] in ["fg", "both"]:
    fg = run_foreground()

if config.config["ROLE"] in ["bg", "both"]:
    bg = run_background()

# ... TODO TODO TODO
from time import sleep

sleep(1000000)

terminate_foreground(fg)
terminate_background(bg)
