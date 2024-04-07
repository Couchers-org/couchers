from datetime import timedelta

from google.protobuf import empty_pb2

from couchers.jobs.handlers import (
    add_users_to_email_list,
    enforce_community_membership,
    generate_message_notifications,
    handle_email_digests,
    handle_email_notifications,
    handle_notification,
    purge_account_deletion_tokens,
    purge_login_tokens,
    purge_password_reset_tokens,
    refresh_materialized_views,
    send_email,
    send_message_notifications,
    send_onboarding_emails,
    send_reference_reminders,
    send_request_notifications,
    update_recommendation_scores,
)
from proto.internal import jobs_pb2

# job definitions, tuples of (job type, message, function)
JOBS = {
    "send_email": (jobs_pb2.SendEmailPayload, send_email),
    "purge_login_tokens": (empty_pb2.Empty, purge_login_tokens),
    "purge_password_reset_tokens": (empty_pb2.Empty, purge_password_reset_tokens),
    "purge_account_deletion_tokens": (empty_pb2.Empty, purge_account_deletion_tokens),
    "send_message_notifications": (empty_pb2.Empty, send_message_notifications),
    "send_onboarding_emails": (empty_pb2.Empty, send_onboarding_emails),
    "add_users_to_email_list": (empty_pb2.Empty, add_users_to_email_list),
    "send_request_notifications": (empty_pb2.Empty, send_request_notifications),
    "enforce_community_membership": (empty_pb2.Empty, enforce_community_membership),
    "send_reference_reminders": (empty_pb2.Empty, send_reference_reminders),
    "handle_notification": (jobs_pb2.HandleNotificationPayload, handle_notification),
    "handle_email_notifications": (empty_pb2.Empty, handle_email_notifications),
    "handle_email_digests": (empty_pb2.Empty, handle_email_digests),
    "generate_message_notifications": (
        jobs_pb2.GenerateMessageNotificationsPayload,
        generate_message_notifications,
    ),
    "update_recommendation_scores": (empty_pb2.Empty, update_recommendation_scores),
    "refresh_materialized_views": (empty_pb2.Empty, refresh_materialized_views),
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
