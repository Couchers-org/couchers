import logging
from concurrent import futures

from couchers import config
from couchers.jobs.worker import start_job_servicer

logger = logging.getLogger(__name__)


def run_background():
    bg = start_job_servicer()
    return bg
