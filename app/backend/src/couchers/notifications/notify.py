import logging
from collections.abc import Sequence
from dataclasses import dataclass

from google.protobuf import empty_pb2
from google.protobuf.message import Message
from sqlalchemy import and_, or_, update
from sqlalchemy.orm import Session

from couchers.jobs.enqueue import queue_job
from couchers.models import Notification
from couchers.models.notifications import NotificationTopicAction
from couchers.proto.internal import jobs_pb2

logger = logging.getLogger(__name__)


@dataclass(frozen=True, kw_only=True)
class NotificationSpec:
    user_id: int
    topic_action: NotificationTopicAction
    key: str
    data: Message | None = None
    moderation_state_id: int | None = None


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
    notify_many(
        session,
        [
            NotificationSpec(
                user_id=user_id,
                topic_action=topic_action,
                key=key,
                data=data,
                moderation_state_id=moderation_state_id,
            )
        ],
    )


def notify_many(session: Session, specs: Sequence[NotificationSpec]) -> None:
    """
    Queues many notifications at once, see notify().

    Fan-outs should render all their specs first and then call this in a fresh, short transaction: queued jobs are
    stamped with the transaction start time but can't be picked up until commit, so a long transaction inflates
    measured queue latency.
    """
    # Import here to avoid circular dependency
    from couchers.notifications.background import handle_notification  # noqa: PLC0415

    notifications = []
    for spec in specs:
        logger.info(f"Generating notification of type {spec.topic_action.display} for user {spec.user_id}")
        notifications.append(
            Notification(
                user_id=spec.user_id,
                topic_action=spec.topic_action,
                key=spec.key,
                data=(spec.data or empty_pb2.Empty()).SerializeToString(),
                moderation_state_id=spec.moderation_state_id,
            )
        )
    session.add_all(notifications)
    session.flush()

    for notification in notifications:
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
    topic_actions_and_keys: Sequence[tuple[Sequence[NotificationTopicAction], Sequence[str]]],
) -> None:
    """
    Marks the user's unseen notifications matching any of the given topic action and key groups as seen.
    """
    clauses = [
        and_(Notification.topic_action.in_(topic_actions), Notification.key.in_(keys))
        for topic_actions, keys in topic_actions_and_keys
        if topic_actions and keys
    ]
    if not clauses:
        return
    session.execute(
        update(Notification).values(is_seen=True).where(Notification.user_id == user_id).where(or_(*clauses))
    )
