import os
import pathlib
import shutil

from prometheus_client import Counter, Histogram, multiprocess
from prometheus_client.registry import CollectorRegistry

JOB_LABEL = "job"
ATTEMPT_LABEL = "attempt"
STATUS_LABEL = "status"
METHOD_LABEL = "method"
CODE_LABEL = "code"
EXCEPTION_LABEL = "exception"

main_process_registry = CollectorRegistry()
_job_process_registry = CollectorRegistry()
servicer_duration_histogram = Histogram(
    "servicer_duration",
    "Durations of processing gRPC calls",
    labelnames=(METHOD_LABEL, CODE_LABEL, EXCEPTION_LABEL),
    buckets=(1, 5, 20, 50, 100, 200, 500, 1000, 5000, 10000),
)

jobs_counter = Counter(
    "jobs",
    "Durations of processing jobs",
    labelnames=(JOB_LABEL, STATUS_LABEL, ATTEMPT_LABEL, EXCEPTION_LABEL),
    registry=_job_process_registry,
)


def init_job_process_registry():
    multiproc_dir = pathlib.Path(__file__).parent.parent / "data" / "prometheus_multiprocess"
    os.environ["PROMETHEUS_MULTIPROC_DIR"] = str(multiproc_dir)
    shutil.rmtree(str(multiproc_dir), ignore_errors=True)
    pathlib.Path(multiproc_dir).mkdir()
    multiprocess.MultiProcessCollector(_job_process_registry)
    return _job_process_registry
