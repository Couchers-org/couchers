from datetime import timedelta

from google.protobuf import empty_pb2

from couchers.jobs.handlers import process_purge_login_tokens, process_send_email
from couchers.models import BackgroundJobType
from pb.internal import jobs_pb2

# job definitions, tuples of (BackgroundJobType, message, function)
JOBS = {
    BackgroundJobType.send_email: (jobs_pb2.SendEmailPayload, process_send_email),
    BackgroundJobType.purge_login_tokens: (empty_pb2.Empty, process_purge_login_tokens),
}

SCHEDULE = [
    # it doesn't need to be this frequent
    (BackgroundJobType.purge_login_tokens, timedelta(hours=24))
]
