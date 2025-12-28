from collections.abc import Callable
from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from google.protobuf import empty_pb2

from couchers.jobs.handlers import (
    add_users_to_email_list,
    auto_approve_moderation_queue,
    check_database_consistency,
    check_expo_push_receipts,
    enforce_community_membership,
    finalize_strong_verification,
    purge_account_deletion_tokens,
    purge_login_tokens,
    purge_password_reset_tokens,
    send_activeness_probes,
    send_email,
    send_event_reminders,
    send_host_request_reminders,
    send_message_notifications,
    send_onboarding_emails,
    send_postal_verification_postcard,
    send_reference_reminders,
    send_request_notifications,
    update_badges,
    update_randomized_locations,
    update_recommendation_scores,
)
from couchers.materialized_views import refresh_materialized_views, refresh_materialized_views_rapid
from couchers.notifications.background import handle_email_digests, handle_notification
from couchers.notifications.send_raw_push_notification import send_raw_push_notification_v2
from couchers.proto.internal import jobs_pb2
from couchers.servicers.conversations import generate_message_notifications
from couchers.servicers.discussions import generate_create_discussion_notifications
from couchers.servicers.editor import generate_new_blog_post_notifications
from couchers.servicers.events import (
    generate_event_cancel_notifications,
    generate_event_create_notifications,
    generate_event_delete_notifications,
    generate_event_update_notifications,
)
from couchers.servicers.threads import generate_reply_notifications


@dataclass(frozen=True, slots=True)
class Job:
    """Definition of a background job."""

    handler: Callable[..., Any]
    payload_type: Any = empty_pb2.Empty
    schedule: timedelta | None = None


# Job registry - maps job names to job definitions
JOBS: dict[str, Job] = {
    "handle_notification": Job(handle_notification, jobs_pb2.HandleNotificationPayload),
    "send_raw_push_notification_v2": Job(send_raw_push_notification_v2, jobs_pb2.SendRawPushNotificationPayloadV2),
    "handle_email_digests": Job(handle_email_digests, schedule=timedelta(minutes=15)),
    "generate_message_notifications": Job(
        generate_message_notifications,
        jobs_pb2.GenerateMessageNotificationsPayload,
    ),
    "generate_reply_notifications": Job(generate_reply_notifications, jobs_pb2.GenerateReplyNotificationsPayload),
    "generate_create_discussion_notifications": Job(
        generate_create_discussion_notifications,
        jobs_pb2.GenerateCreateDiscussionNotificationsPayload,
    ),
    "generate_event_create_notifications": Job(
        generate_event_create_notifications,
        jobs_pb2.GenerateEventCreateNotificationsPayload,
    ),
    "generate_event_update_notifications": Job(
        generate_event_update_notifications,
        jobs_pb2.GenerateEventUpdateNotificationsPayload,
    ),
    "generate_event_cancel_notifications": Job(
        generate_event_cancel_notifications,
        jobs_pb2.GenerateEventCancelNotificationsPayload,
    ),
    "generate_event_delete_notifications": Job(
        generate_event_delete_notifications,
        jobs_pb2.GenerateEventDeleteNotificationsPayload,
    ),
    "generate_new_blog_post_notifications": Job(
        generate_new_blog_post_notifications,
        jobs_pb2.GenerateNewBlogPostNotificationsPayload,
    ),
    "refresh_materialized_views": Job(refresh_materialized_views, schedule=timedelta(minutes=5)),
    "refresh_materialized_views_rapid": Job(refresh_materialized_views_rapid, schedule=timedelta(seconds=30)),
    "send_email": Job(send_email, jobs_pb2.SendEmailPayload),
    "purge_login_tokens": Job(purge_login_tokens, schedule=timedelta(hours=24)),
    "purge_password_reset_tokens": Job(purge_password_reset_tokens, schedule=timedelta(hours=24)),
    "purge_account_deletion_tokens": Job(purge_account_deletion_tokens, schedule=timedelta(hours=24)),
    "send_message_notifications": Job(send_message_notifications, schedule=timedelta(minutes=3)),
    "send_request_notifications": Job(send_request_notifications, schedule=timedelta(minutes=3)),
    "send_onboarding_emails": Job(send_onboarding_emails, schedule=timedelta(hours=1)),
    "send_reference_reminders": Job(send_reference_reminders, schedule=timedelta(hours=1)),
    "send_host_request_reminders": Job(send_host_request_reminders, schedule=timedelta(minutes=15)),
    "add_users_to_email_list": Job(add_users_to_email_list, schedule=timedelta(hours=1)),
    "enforce_community_membership": Job(enforce_community_membership, schedule=timedelta(minutes=15)),
    "update_recommendation_scores": Job(update_recommendation_scores, schedule=timedelta(hours=24)),
    "update_badges": Job(update_badges, schedule=timedelta(minutes=15)),
    "finalize_strong_verification": Job(finalize_strong_verification, jobs_pb2.FinalizeStrongVerificationPayload),
    "send_activeness_probes": Job(send_activeness_probes, schedule=timedelta(minutes=60)),
    "update_randomized_locations": Job(update_randomized_locations, schedule=timedelta(hours=1)),
    "send_event_reminders": Job(send_event_reminders, schedule=timedelta(hours=1)),
    "check_expo_push_receipts": Job(check_expo_push_receipts, schedule=timedelta(minutes=5)),
    "send_postal_verification_postcard": Job(
        send_postal_verification_postcard,
        jobs_pb2.SendPostalVerificationPostcardPayload,
    ),
    "check_database_consistency": Job(check_database_consistency, schedule=timedelta(hours=24)),
    "auto_approve_moderation_queue": Job(auto_approve_moderation_queue, schedule=timedelta(seconds=15)),
}
