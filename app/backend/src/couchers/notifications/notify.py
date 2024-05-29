from google.protobuf import empty_pb2

from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.models import Notification
from couchers.notifications.utils import enum_from_topic_action
from proto.internal import jobs_pb2


def notify_v2(
    *,
    user_id,
    topic_action,
    key="",
    data=None,
):
    """
    Queues a notification given the notification and a target, i.e. a tuple (user_id, topic, key), and an action.

    Notifications are sent to user identified by user_id, and are collapsed/grouped based on the combination of
    (topic, key).

    For example, topic may be "chat" for a group chat/direct message, and the key might be the chat id; so that messages
    in the same group chat show up in one group.

    The action is a simple identifier describing the action that caused the notification. For the above example, the
    action might be "add_admin" if the notification was caused by another user adding an admin into the gorup chat.

    Each different notification type should have its own action.
    """
    topic, action = topic_action.split(":")
    with session_scope() as session:
        notification = Notification(
            user_id=user_id,
            topic_action=enum_from_topic_action[topic, action],
            key=key,
            data=(data or empty_pb2.Empty()).SerializeToString(),
        )
        session.add(notification)
        session.flush()
        notification_id = notification.id

    queue_job(
        job_type="handle_notification",
        payload=jobs_pb2.HandleNotificationPayload(
            notification_id=notification_id,
        ),
    )


def fan_notify_v2(
    *,
    fan_func: str,
    fan_func_data: str,
    topic_action,
    key="",
    data=None,
):
    """
    Like notify, but this time we pass into a background job and call fan_func(fan_func_data) in order to figure out who to send this notification to
    """
    queue_job(
        job_type="fan_notifications",
        payload=jobs_pb2.FanNotificationsPayload(
            topic_action=topic_action,
            key=key,
            data=(data or empty_pb2.Empty()).SerializeToString(),
            fan_func=fan_func,
            fan_func_data=fan_func_data,
        ),
    )
