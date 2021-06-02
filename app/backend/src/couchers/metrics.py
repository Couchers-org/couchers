from prometheus_client import Counter, Histogram
from prometheus_client.registry import CollectorRegistry

JOB_LABEL = "job"
ATTEMPT_LABEL = "attempt"
STATUS_LABEL = "status"
METHOD_LABEL = "method"
CODE_LABEL = "code"
EXCEPTION_LABEL = "exception"

main_process_registry = CollectorRegistry()
jobs_process_registry = CollectorRegistry()

servicer_duration_histogram = Histogram(
    "servicer_duration",
    "Durations of processing gRPC calls",
    labelnames=(METHOD_LABEL, CODE_LABEL, EXCEPTION_LABEL),
    registry=main_process_registry,
)
jobs_counter = Counter(
    "jobs",
    "Durations of processing jobs",
    labelnames=(JOB_LABEL, STATUS_LABEL, ATTEMPT_LABEL, EXCEPTION_LABEL),
    registry=jobs_process_registry,
)
