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


# Job registry - first create a list of all jobs
_JOBS_LIST = [
    Job(handle_notification, jobs_pb2.HandleNotificationPayload),
    Job(send_raw_push_notification_v2, jobs_pb2.SendRawPushNotificationPayloadV2),
    Job(handle_email_digests, schedule=timedelta(minutes=15)),
    Job(
        generate_message_notifications,
        jobs_pb2.GenerateMessageNotificationsPayload,
    ),
    Job(generate_reply_notifications, jobs_pb2.GenerateReplyNotificationsPayload),
    Job(
        generate_create_discussion_notifications,
        jobs_pb2.GenerateCreateDiscussionNotificationsPayload,
    ),
    Job(
        generate_event_create_notifications,
        jobs_pb2.GenerateEventCreateNotificationsPayload,
    ),
    Job(
        generate_event_update_notifications,
        jobs_pb2.GenerateEventUpdateNotificationsPayload,
    ),
    Job(
        generate_event_cancel_notifications,
        jobs_pb2.GenerateEventCancelNotificationsPayload,
    ),
    Job(
        generate_event_delete_notifications,
        jobs_pb2.GenerateEventDeleteNotificationsPayload,
    ),
    Job(
        generate_new_blog_post_notifications,
        jobs_pb2.GenerateNewBlogPostNotificationsPayload,
    ),
    Job(refresh_materialized_views, schedule=timedelta(minutes=5)),
    Job(refresh_materialized_views_rapid, schedule=timedelta(seconds=30)),
    Job(send_email, jobs_pb2.SendEmailPayload),
    Job(purge_login_tokens, schedule=timedelta(hours=24)),
    Job(purge_password_reset_tokens, schedule=timedelta(hours=24)),
    Job(purge_account_deletion_tokens, schedule=timedelta(hours=24)),
    Job(send_message_notifications, schedule=timedelta(minutes=3)),
    Job(send_request_notifications, schedule=timedelta(minutes=3)),
    Job(send_onboarding_emails, schedule=timedelta(hours=1)),
    Job(send_reference_reminders, schedule=timedelta(hours=1)),
    Job(send_host_request_reminders, schedule=timedelta(minutes=15)),
    Job(add_users_to_email_list, schedule=timedelta(hours=1)),
    Job(enforce_community_membership, schedule=timedelta(minutes=15)),
    Job(update_recommendation_scores, schedule=timedelta(hours=24)),
    Job(update_badges, schedule=timedelta(minutes=15)),
    Job(finalize_strong_verification, jobs_pb2.FinalizeStrongVerificationPayload),
    Job(send_activeness_probes, schedule=timedelta(minutes=60)),
    Job(update_randomized_locations, schedule=timedelta(hours=1)),
    Job(send_event_reminders, schedule=timedelta(hours=1)),
    Job(check_expo_push_receipts, schedule=timedelta(minutes=5)),
    Job(
        send_postal_verification_postcard,
        jobs_pb2.SendPostalVerificationPostcardPayload,
    ),
    Job(check_database_consistency, schedule=timedelta(hours=24)),
    Job(auto_approve_moderation_queue, schedule=timedelta(seconds=15)),
]

# Map job names to job definitions
JOBS: dict[str, Job] = {job.handler.__name__: job for job in _JOBS_LIST}
