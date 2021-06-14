import pathlib
import shutil

from prometheus_client import Counter, Histogram, multiprocess
from prometheus_client.registry import CollectorRegistry

from couchers.config import config

JOB_LABEL = "job"
ATTEMPT_LABEL = "attempt"
STATUS_LABEL = "status"
METHOD_LABEL = "method"
CODE_LABEL = "code"
EXCEPTION_LABEL = "exception"

main_process_registry = CollectorRegistry()
jobs_process_registry = CollectorRegistry()

# ensures the directory used for prometheus multiprocessing exists and is clean
multiproc_dir = pathlib.Path(config["PROMETHEUS_MULTIPROC_DIR"])
if multiproc_dir.parent.exists():
    shutil.rmtree(str(multiproc_dir), ignore_errors=True)
    pathlib.Path(multiproc_dir).mkdir()
    multiprocess.MultiProcessCollector(jobs_process_registry)

servicer_duration_histogram = Histogram(
    "servicer_duration",
    "Durations of processing gRPC calls",
    labelnames=(METHOD_LABEL, CODE_LABEL),
    registry=main_process_registry,
    buckets=(1, 5, 20, 50, 100, 200, 500, 1000, 5000, 10000),
)
jobs_counter = Counter(
    "jobs",
    "Durations of processing jobs",
    labelnames=(JOB_LABEL, STATUS_LABEL, ATTEMPT_LABEL, EXCEPTION_LABEL),
    registry=jobs_process_registry,
)
