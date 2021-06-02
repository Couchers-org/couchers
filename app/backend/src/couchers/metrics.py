from prometheus_client import Histogram
from prometheus_client.registry import CollectorRegistry

JOB_LABEL = "job"
METHOD_LABEL = "method"
CODE_LABEL = "code"
EXCEPTION_LABEL = "exception"

main_process_registry = CollectorRegistry()
jobs_process_registry = CollectorRegistry()

servicer_duration_histogram = Histogram(
    "servicer_duration",
    "Durations of processing gRPC calls",
    labelnames=(METHOD_LABEL, CODE_LABEL, EXCEPTION_LABEL),
    registry=main_process_registry
)
job_duration_histogram = Histogram(
    "job_duration", "Durations of processing jobs", labelnames=(JOB_LABEL, EXCEPTION_LABEL), registry=jobs_process_registry
)
