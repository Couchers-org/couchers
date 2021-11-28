from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.models import (
    BackgroundJobType,
    Notification,
    NotificationDeliveryType,
    NotificationPriority,
    NotificationTopicAction,
)
from couchers.notifications.utils import enum_from_topic_action
from proto.internal import jobs_pb2


def notify(
    *, user_id, topic, key, action, avatar_key, icon, title, link, content=None, priority=NotificationPriority.normal
):
    """
    Queues a notification given the notification and a target, i.e. a tuple (user_id, topic, key), and an action.

    Notifications are sent to user identified by user_id, and are collapsed/grouped based on the combination of
    (topic, key).

    For example, topic may be "chat" for a group chat/direct message, and the key might be the chat id; so that messages
    in the same group chat show up in one group.

    The action is a simple identifier describing the action that caused the notification. For the above example, the
    action might be "add_admin" if the notification was caused by another user adding an admin into the gorup chat.

    Each different notification type should have its own action.
    """
    with session_scope() as session:
        notification = Notification(
            priority=priority,
            user_id=user_id,
            topic_action=enum_from_topic_action[topic, action],
            key=key,
            avatar_key=avatar_key,
            icon=icon,
            title=title,
            content=content,
            link=link,
        )
        session.add(notification)
        session.flush()
        notification_id = notification.id

    queue_job(
        job_type=BackgroundJobType.handle_notification,
        payload=jobs_pb2.HandleNotificationPayload(
            notification_id=notification_id,
        ),
    )
