from datetime import timedelta

from google.protobuf import empty_pb2

from couchers.jobs.handlers import (
    process_add_users_to_email_list,
    process_enforce_community_membership,
    process_handle_email_notifications,
    process_handle_notification,
    process_purge_login_tokens,
    process_send_email,
    process_send_message_notifications,
    process_send_onboarding_emails,
    process_send_reference_reminders,
    process_send_request_notifications,
)
from couchers.models import BackgroundJobType
from proto.internal import jobs_pb2

# job definitions, tuples of (BackgroundJobType, message, function)
JOBS = {
    BackgroundJobType.send_email: (jobs_pb2.SendEmailPayload, process_send_email),
    BackgroundJobType.purge_login_tokens: (empty_pb2.Empty, process_purge_login_tokens),
    BackgroundJobType.send_message_notifications: (empty_pb2.Empty, process_send_message_notifications),
    BackgroundJobType.send_onboarding_emails: (empty_pb2.Empty, process_send_onboarding_emails),
    BackgroundJobType.add_users_to_email_list: (empty_pb2.Empty, process_add_users_to_email_list),
    BackgroundJobType.send_request_notifications: (empty_pb2.Empty, process_send_request_notifications),
    BackgroundJobType.enforce_community_membership: (empty_pb2.Empty, process_enforce_community_membership),
    BackgroundJobType.send_reference_reminders: (empty_pb2.Empty, process_send_reference_reminders),
    BackgroundJobType.handle_notification: (jobs_pb2.HandleNotificationPayload, process_handle_notification),
    BackgroundJobType.handle_email_notifications: (empty_pb2.Empty, process_handle_email_notifications),
}

SCHEDULE = [
    (BackgroundJobType.purge_login_tokens, timedelta(hours=24)),
    (BackgroundJobType.send_message_notifications, timedelta(minutes=3)),
    (BackgroundJobType.send_onboarding_emails, timedelta(hours=1)),
    (BackgroundJobType.add_users_to_email_list, timedelta(hours=1)),
    (BackgroundJobType.send_request_notifications, timedelta(minutes=3)),
    (BackgroundJobType.enforce_community_membership, timedelta(minutes=15)),
    (BackgroundJobType.send_reference_reminders, timedelta(hours=1)),
    (BackgroundJobType.handle_email_notifications, timedelta(minutes=1)),
]
