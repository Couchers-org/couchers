from prometheus_client import Histogram

JOB_LABEL = "job"
SERVICER_LABEL = "servicer"
STATUS_CODE_LABEL = "status_code"
EXCEPTION_LABEL = "exception"

servicer_duration_histogram = Histogram(
    "servicer_duration",
    "Durations of processing servicer calls",
    labelnames=(SERVICER_LABEL, STATUS_CODE_LABEL, EXCEPTION_LABEL),
)
job_duration_histogram = Histogram(
    "job_duration", "Durations of processing jobs", labelnames=(JOB_LABEL, EXCEPTION_LABEL)
)
