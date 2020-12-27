import logging
from concurrent import futures

from couchers import config
from couchers.jobs.worker import service_jobs

logger = logging.getLogger(__name__)


def run_background():
    service_jobs()
    return None


def wait_for_background(bundle):
    pass
