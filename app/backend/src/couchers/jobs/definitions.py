from datetime import timedelta

from google.protobuf import empty_pb2

from couchers.jobs.handlers import (
    process_add_users_to_email_list,
    process_purge_login_tokens,
    process_purge_signup_tokens,
    process_send_email,
    process_send_message_notifications,
    process_send_onboarding_emails,
    process_send_request_notifications,
)
from couchers.models import BackgroundJobType
from pb.internal import jobs_pb2

# job definitions, tuples of (BackgroundJobType, message, function)
JOBS = {
    BackgroundJobType.send_email: (jobs_pb2.SendEmailPayload, process_send_email),
    BackgroundJobType.purge_login_tokens: (empty_pb2.Empty, process_purge_login_tokens),
    BackgroundJobType.purge_signup_tokens: (empty_pb2.Empty, process_purge_signup_tokens),
    BackgroundJobType.send_message_notifications: (empty_pb2.Empty, process_send_message_notifications),
    BackgroundJobType.send_onboarding_emails: (empty_pb2.Empty, process_send_onboarding_emails),
    BackgroundJobType.add_users_to_email_list: (empty_pb2.Empty, process_add_users_to_email_list),
    BackgroundJobType.send_request_notifications: (empty_pb2.Empty, process_send_request_notifications),
}

SCHEDULE = [
    (BackgroundJobType.purge_login_tokens, timedelta(hours=24)),
    (BackgroundJobType.purge_signup_tokens, timedelta(hours=24)),
    (BackgroundJobType.send_message_notifications, timedelta(minutes=3)),
    (BackgroundJobType.send_onboarding_emails, timedelta(hours=1)),
    (BackgroundJobType.add_users_to_email_list, timedelta(hours=6)),
    (BackgroundJobType.send_request_notifications, timedelta(minutes=3)),
]
