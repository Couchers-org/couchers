import logging

from google.protobuf import empty_pb2
from google.protobuf.message import Message
from sqlalchemy import update
from sqlalchemy.orm import Session

from couchers.jobs.enqueue import queue_job
from couchers.models import Notification
from couchers.models.notifications import NotificationTopicAction
from couchers.proto.internal import jobs_pb2

logger = logging.getLogger(__name__)


def notify(
    session: Session,
    *,
    user_id: int,
    topic_action: NotificationTopicAction,
    key: str,
    data: Message | None = None,
    moderation_state_id: int | None = None,
) -> None:
    """
    Queues a notification given the notification and a target, i.e. a tuple (user_id, topic, key), and an action.

    Notifications are sent to user identified by user_id, and are collapsed/grouped based on the combination of
    (topic, key).

    For example, topic may be "chat" for a group chat/direct message, and the key might be the chat id; so that messages
    in the same group chat show up in one group.

    The action is a simple identifier describing the action that caused the notification. For the above example, the
    action might be "add_admin" if the notification was caused by another user adding an admin into the gorup chat.

    Each different notification type should have its own action.

    If moderation_state_id is provided, the notification delivery is deferred until the linked content
    becomes VISIBLE or UNLISTED. This is used for notifications related to moderated content.

    The key parameter is required. Pass key="" for notifications that intentionally don't have a key
    (e.g., security notifications like password changes, or aggregated notifications like chat:missed_messages).
    """
    logger.info(f"Generating notification of type {topic_action.display} for user {user_id}")
    # Import here to avoid circular dependency
    from couchers.notifications.background import handle_notification  # noqa: PLC0415

    notification = Notification(
        user_id=user_id,
        topic_action=topic_action,
        key=key,
        data=(data or empty_pb2.Empty()).SerializeToString(),
        moderation_state_id=moderation_state_id,
    )
    session.add(notification)
    session.flush()

    queue_job(
        session,
        job=handle_notification,
        payload=jobs_pb2.HandleNotificationPayload(
            notification_id=notification.id,
        ),
    )


def mark_notifications_seen(
    session: Session,
    *,
    user_id: int,
    key: str,
    topic_actions: list[NotificationTopicAction],
) -> None:
    """
    Marks all unseen notifications for the given user, key, and topic actions as seen.
    """
    session.execute(
        update(Notification)
        .values(is_seen=True)
        .where(Notification.user_id == user_id)
        .where(Notification.key == key)
        .where(Notification.topic_action.in_(topic_actions))
    )


def mark_notifications_seen_for_keys(
    session: Session,
    *,
    user_id: int,
    keys: list[str],
    topic_actions: list[NotificationTopicAction],
) -> None:
    """
    Bulk variant of mark_notifications_seen: marks notifications for all the given keys as seen in one update.
    """
    if not keys:
        return
    session.execute(
        update(Notification)
        .values(is_seen=True)
        .where(Notification.user_id == user_id)
        .where(Notification.key.in_(keys))
        .where(Notification.topic_action.in_(topic_actions))
    )
