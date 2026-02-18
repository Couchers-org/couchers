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
    """
    Defines the user-visible content of a push notification.

    Android and iOS use different enough styles that we can't abstract over both.
    - Android allows longer titles with sentence-style capitalization.
    - iOS has a short title but supports a subtitle and uses Title Case capitalization.

    On other platforms, prefer Android-style since they don't require a subtitle.

    Style examples:
    - Message from a user. For example about an event:
      - Android title: "{name} • {event}" (impersonates name)
      - iOS title: "{name}"
      - iOS subtitle: "Commented on {event}"
      - Icon: User's avatar
      - Body: "{message}"
    - Message-like action from a user. For example a host request:
      - Android title: "New host request by {name}" (mentions name)
      - iOS title: "{name}"
      - iOS subtitle: "New Host Request"
      - Icon: User's avatar
      - Body: "{name} requested to stay with you on {date}."
        (start with the name to clarify it's not quoting them)
    - New entity / entity changed:
      - Android title "New discussion: {title}"
      - iOS title: "New Discussion"
      - iOS subtitle: "{title}"
      - Body: "{name} started a discussion in {community}."
    """

    MAX_TITLE_LENGTH: ClassVar[int] = 500
    MAX_BODY_LENGTH: ClassVar[int] = 2000

    title: str
    """
    The notification title, as shown on Android and other platforms where there is no subtitle.
    See class documentation for examples.

    Guidelines:
    - Use localized plain text with no prior escaping.
    - Prefer 30-40 chars, though up to 65 will fit on most phones.
    - Use sentence-style capitalization (not Title Case) and don't add a period.

    References:
    - https://developer.android.com/develop/ui/views/notifications
    - https://m3.material.io/foundations/content-design/notifications
    """

    ios_title: str
    """
    The iOS-specific notification title, since iOS has a title/subtitle pair with different style.
    See class documentation for examples.

    Guidelines:
    - Use localized plain text with no prior escaping.
    - Keep below 25-30 chars as iOS truncates aggressively.
    - Use Title Case capitalization and don't add a period.

    Reference:
    - https://developer.apple.com/documentation/usernotifications/unnotificationcontent
    """

    body: str
    """
    The text of the notification body.

    Guidelines:
    - Use localized palin text with no prior escaping.
    - Keep the most important info within the first 40 chars (visible when collapsed) and the whole within 120 chars.
    - If the title is a user's name, the body should either be what they said verbatim,
      or mention them in the third person as in "{name} did x" so it is clear it is not quoting them.
    """

    ios_subtitle: str | None = None
    """
    The iOS-specific notification subtitle, since iOS has a title/subtitle pair with different style.
    See class documentation for examples.

    Guidelines:
    - Use localized plain text with no prior escaping.
    - Use Title Case capitalization and don't add a period.
    """

    action_url: str | None = None
    """The URL to open when the notification is clicked. If None, will open the app's main URL."""

    icon_url: str | None = None
    """A URL to the icon to show in the notification. If None, will use the default app icon."""


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
    # TODO(#7617): Support iOS-style title/subtitles
    title = config["NOTIFICATION_PREFIX"] + content.title[: PushNotificationContent.MAX_TITLE_LENGTH]
    body = content.body[: PushNotificationContent.MAX_BODY_LENGTH]
    icon_url = content.icon_url or urls.icon_url()
    action_url = content.action_url or ""
    queue_job(
        session,
        job=send_raw_push_notification_v2,
        payload=jobs_pb2.SendRawPushNotificationPayloadV2(
            push_notification_subscription_id=push_notification_subscription_id,
            ttl=ttl,
            title=title,
            ios_title=content.ios_title,
            ios_subtitle=content.ios_subtitle,
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
