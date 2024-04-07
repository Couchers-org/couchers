from datetime import timedelta

from google.protobuf import empty_pb2

from couchers.jobs.handlers import (
    process_add_users_to_email_list,
    process_enforce_community_membership,
    process_generate_message_notifications,
    process_handle_email_digests,
    process_handle_email_notifications,
    process_handle_notification,
    process_purge_account_deletion_tokens,
    process_purge_login_tokens,
    process_purge_password_reset_tokens,
    process_refresh_materialized_views,
    process_send_email,
    process_send_message_notifications,
    process_send_onboarding_emails,
    process_send_reference_reminders,
    process_send_request_notifications,
    process_update_recommendation_scores,
)
from proto.internal import jobs_pb2

# job definitions, tuples of (job type, message, function)
JOBS = {
    "send_email": (jobs_pb2.SendEmailPayload, process_send_email),
    "purge_login_tokens": (empty_pb2.Empty, process_purge_login_tokens),
    "purge_password_reset_tokens": (empty_pb2.Empty, process_purge_password_reset_tokens),
    "purge_account_deletion_tokens": (empty_pb2.Empty, process_purge_account_deletion_tokens),
    "send_message_notifications": (empty_pb2.Empty, process_send_message_notifications),
    "send_onboarding_emails": (empty_pb2.Empty, process_send_onboarding_emails),
    "add_users_to_email_list": (empty_pb2.Empty, process_add_users_to_email_list),
    "send_request_notifications": (empty_pb2.Empty, process_send_request_notifications),
    "enforce_community_membership": (empty_pb2.Empty, process_enforce_community_membership),
    "send_reference_reminders": (empty_pb2.Empty, process_send_reference_reminders),
    "handle_notification": (jobs_pb2.HandleNotificationPayload, process_handle_notification),
    "handle_email_notifications": (empty_pb2.Empty, process_handle_email_notifications),
    "handle_email_digests": (empty_pb2.Empty, process_handle_email_digests),
    "generate_message_notifications": (
        jobs_pb2.GenerateMessageNotificationsPayload,
        process_generate_message_notifications,
    ),
    "update_recommendation_scores": (empty_pb2.Empty, process_update_recommendation_scores),
    "refresh_materialized_views": (empty_pb2.Empty, process_refresh_materialized_views),
}

SCHEDULE = [
    ("purge_login_tokens", timedelta(hours=24)),
    ("purge_password_reset_tokens", timedelta(hours=24)),
    ("purge_account_deletion_tokens", timedelta(hours=24)),
    ("send_message_notifications", timedelta(minutes=3)),
    ("send_onboarding_emails", timedelta(hours=1)),
    ("add_users_to_email_list", timedelta(hours=1)),
    ("send_request_notifications", timedelta(minutes=3)),
    ("enforce_community_membership", timedelta(minutes=15)),
    ("send_reference_reminders", timedelta(hours=1)),
    ("handle_email_notifications", timedelta(minutes=1)),
    ("handle_email_digests", timedelta(minutes=15)),
    ("update_recommendation_scores", timedelta(hours=24)),
    ("refresh_materialized_views", timedelta(minutes=5)),
]
