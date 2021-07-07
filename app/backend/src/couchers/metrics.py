import threading

from prometheus_client import Counter, Histogram, exposition
from prometheus_client.registry import CollectorRegistry

JOB_LABEL = "job"
ATTEMPT_LABEL = "attempt"
STATUS_LABEL = "status"
METHOD_LABEL = "method"
CODE_LABEL = "code"
EXCEPTION_LABEL = "exception"

main_process_registry = CollectorRegistry()
job_process_registry = CollectorRegistry()
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
    """custom start method to fix problem descrbied in https://github.com/prometheus/client_python/issues/155"""
    app = exposition.make_wsgi_app(registry)
    httpd = exposition.make_server(
        "", port, app, exposition.ThreadingWSGIServer, handler_class=exposition._SilentHandler
    )
    t = threading.Thread(target=httpd.serve_forever)
    t.daemon = True
    t.start()
    return httpd
