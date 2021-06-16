import os
import pathlib
import shutil
import threading

from prometheus_client import Counter, Histogram, exposition, multiprocess
from prometheus_client.registry import CollectorRegistry

JOB_LABEL = "job"
ATTEMPT_LABEL = "attempt"
STATUS_LABEL = "status"
METHOD_LABEL = "method"
CODE_LABEL = "code"
EXCEPTION_LABEL = "exception"

multiproc_dir = pathlib.Path(__file__).parent.parent / "data" / "prometheus_multiprocess"

main_process_registry = CollectorRegistry()
job_process_registry = CollectorRegistry()
multiprocess.MultiProcessCollector(job_process_registry, str(multiproc_dir.absolute()))

jobs_counter = Counter(
    "jobs",
    "Durations of processing jobs",
    labelnames=(JOB_LABEL, STATUS_LABEL, ATTEMPT_LABEL, EXCEPTION_LABEL),
    registry=job_process_registry,
)

servicer_duration_histogram = Histogram(
    "servicer_duration",
    "Durations of processing gRPC calls",
    labelnames=(METHOD_LABEL, CODE_LABEL, EXCEPTION_LABEL),
    buckets=(1, 5, 20, 50, 100, 200, 500, 1000, 5000, 10000),
)


def create_prometheus_server(registry, port):
    """Starts a WSGI server for prometheus metrics as a non-daemon thread."""
    app = exposition.make_wsgi_app(registry)
    httpd = exposition.make_server(
        "", port, app, exposition.ThreadingWSGIServer, handler_class=exposition._SilentHandler
    )
    t = threading.Thread(target=httpd.serve_forever)
    t.start()
    return t


def clean_multiprocess_directory():
    shutil.rmtree(str(multiproc_dir), ignore_errors=True)
    pathlib.Path(multiproc_dir).mkdir()
