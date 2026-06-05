from dataclasses import dataclass
from datetime import timedelta
from typing import Any, Protocol, cast, get_type_hints

from couchers.jobs.handlers import (
    add_users_to_email_list,
    auto_approve_moderation_queue,
    check_database_consistency,
    check_expo_push_receipts,
    check_mypostcard_jobs,
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
from couchers.jobs.user_email_campaigns import run_user_email_campaigns
from couchers.materialized_views import refresh_materialized_views, refresh_materialized_views_rapid
from couchers.notifications.background import handle_email_digests, handle_notification
from couchers.notifications.send_raw_push_notification import send_raw_push_notification_v2
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


class JobHandler[T](Protocol):
    def __call__(self, payload: T) -> None: ...

    @property
    def __name__(self) -> str: ...


@dataclass(frozen=True, slots=True)
class Job[T]:
    """Definition of a background job."""

    handler: JobHandler[T]
    schedule: timedelta | None = None

    @property
    def name(self) -> str:
        return self.handler.__name__

    @property
    def payload_type(self) -> type[T]:
        """Extracts protobuf type from type hints."""
        return cast(type[T], get_type_hints(self.handler)["payload"])


# Job registry - first create a list of all jobs.
_JOBS_LIST = [
    Job(handle_notification),
    Job(send_raw_push_notification_v2),
    Job(handle_email_digests, schedule=timedelta(minutes=15)),
    Job(generate_message_notifications),
    Job(generate_reply_notifications),
    Job(generate_create_discussion_notifications),
    Job(generate_event_create_notifications),
    Job(generate_event_update_notifications),
    Job(generate_event_cancel_notifications),
    Job(generate_event_delete_notifications),
    Job(generate_new_blog_post_notifications),
    Job(refresh_materialized_views, schedule=timedelta(minutes=5)),
    Job(refresh_materialized_views_rapid, schedule=timedelta(seconds=30)),
    Job(send_email),
    Job(purge_login_tokens, schedule=timedelta(hours=24)),
    Job(purge_password_reset_tokens, schedule=timedelta(hours=24)),
    Job(purge_account_deletion_tokens, schedule=timedelta(hours=24)),
    Job(send_message_notifications, schedule=timedelta(minutes=3)),
    Job(send_request_notifications, schedule=timedelta(minutes=3)),
    Job(send_onboarding_emails, schedule=timedelta(hours=1)),
    Job(run_user_email_campaigns, schedule=timedelta(hours=1)),
    Job(send_reference_reminders, schedule=timedelta(hours=1)),
    Job(send_host_request_reminders, schedule=timedelta(minutes=15)),
    Job(add_users_to_email_list, schedule=timedelta(hours=1)),
    Job(enforce_community_membership, schedule=timedelta(minutes=15)),
    Job(update_recommendation_scores, schedule=timedelta(hours=24)),
    Job(update_badges, schedule=timedelta(minutes=15)),
    Job(finalize_strong_verification),
    Job(send_activeness_probes, schedule=timedelta(minutes=60)),
    Job(update_randomized_locations, schedule=timedelta(hours=1)),
    Job(send_event_reminders, schedule=timedelta(hours=1)),
    Job(check_expo_push_receipts, schedule=timedelta(minutes=5)),
    Job(send_postal_verification_postcard),
    Job(check_database_consistency, schedule=timedelta(hours=24)),
    Job(check_mypostcard_jobs, schedule=timedelta(hours=24)),
    Job(auto_approve_moderation_queue, schedule=timedelta(seconds=15)),
]

# Map job names to job definitions
JOBS: dict[str, Job[Any]] = {job.name: job for job in cast(list[Job[Any]], _JOBS_LIST)}
