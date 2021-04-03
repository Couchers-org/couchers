from datetime import timedelta

from google.protobuf import empty_pb2

from couchers.jobs.handlers import (
    process_purge_login_tokens,
    process_purge_signup_tokens,
    process_send_email,
    process_send_message_notifications,
)
from couchers.models import BackgroundJobType
from pb.internal import jobs_pb2

# job definitions, tuples of (BackgroundJobType, message, function)
JOBS = {
    BackgroundJobType.send_email: (jobs_pb2.SendEmailPayload, process_send_email),
    BackgroundJobType.purge_login_tokens: (empty_pb2.Empty, process_purge_login_tokens),
    BackgroundJobType.purge_signup_tokens: (empty_pb2.Empty, process_purge_signup_tokens),
    BackgroundJobType.send_message_notifications: (empty_pb2.Empty, process_send_message_notifications),
}

SCHEDULE = [
    (BackgroundJobType.purge_login_tokens, timedelta(hours=24)),
    (BackgroundJobType.purge_signup_tokens, timedelta(hours=24)),
    (BackgroundJobType.send_message_notifications, timedelta(minutes=3)),
]
