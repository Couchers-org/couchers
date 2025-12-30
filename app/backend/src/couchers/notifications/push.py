from dataclasses import dataclass
from typing import ClassVar

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from couchers import urls
from couchers.config import config
from couchers.jobs.enqueue import queue_job
from couchers.models import PushNotificationSubscription
from couchers.notifications.send_raw_push_notification import send_raw_push_notification_v2
from couchers.proto.internal import jobs_pb2

@dataclass(frozen=True, slots=True)
class PushNotificationContent:
    """Defines the user-visible content of a push notification."""
    # Android reference: https://developer.android.com/develop/ui/views/notifications
    # iOS reference: https://developer.apple.com/documentation/usernotifications/unnotificationcontent

    MAX_TITLE_LENGTH: ClassVar[int] = 500
    MAX_BODY_LENGTH: ClassVar[int] = 2000

    title: str
    """A localized title for the notification, this should be a very short string (2-4 words)."""
    body: str
    """The main text of the notification."""
    icon_url: str | None = None
    """A URL to the icon to show in the notification. If None, will use the default app icon."""
    action_url: str | None = None
    """The URL to open when the notification is clicked. If None, will open the app's main URL."""


def push_to_subscription(
    session: Session,
    *,
    push_notification_subscription_id: int,
    user_id: int,
    topic_action: str,
    content: PushNotificationContent,
    key: str | None = None,
    ttl: int = 0,
) -> None:
    title = config["NOTIFICATION_PREFIX"] + content[:PushNotificationSubscription.MAX_TITLE_LENGTH]
    body = content.body[:PushNotificationSubscription.MAX_BODY_LENGTH]
    icon_url = content.icon_url or urls.icon_url()
    action_url = content.action_url or ""
    queue_job(
        session,
        job=send_raw_push_notification_v2,
        payload=jobs_pb2.SendRawPushNotificationPayloadV2(
            push_notification_subscription_id=push_notification_subscription_id,
            ttl=ttl,
            title=title,
            body=body,
            icon=icon_url,
            url=action_url,
            user_id=user_id,
            topic_action=topic_action,
            key=key or "",
        ),
        priority=7,
    )


def _push_to_user(
    session: Session,
    user_id: int,
    topic_action: str,
    content: PushNotificationContent,
    key: str | None,
    ttl: int,
) -> None:
    """
    Same as above but for a given user
    """
    sub_ids = (
        session.execute(
            select(PushNotificationSubscription.id)
            .where(PushNotificationSubscription.user_id == user_id)
            .where(PushNotificationSubscription.disabled_at > func.now())
        )
        .scalars()
        .all()
    )
    for sub_id in sub_ids:
        push_to_subscription(
            session,
            push_notification_subscription_id=sub_id,
            user_id=user_id,
            topic_action=topic_action,
            content=content,
            key=key,
            ttl=ttl,
        )


def push_to_user(
    session: Session,
    *,
    user_id: int,
    topic_action: str,
    content: PushNotificationContent,
    key: str | None = None,
    ttl: int = 0,
) -> None:
    """
    This indirection is so that this can be easily mocked. Not sure how to do it better :(
    """
    _push_to_user(
        session,
        user_id=user_id,
        topic_action=topic_action,
        content=content,
        key=key,
        ttl=ttl,
    )
