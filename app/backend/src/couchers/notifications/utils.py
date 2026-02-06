from couchers.models import NotificationTopicAction

enum_from_topic_action: dict[tuple[str, str], NotificationTopicAction] = {
    (item.topic, item.action): item for item in NotificationTopicAction
}


_DELETED_USER_NOTIFICATIONS = {
    NotificationTopicAction.account_deletion__start,
    NotificationTopicAction.account_deletion__complete,
    NotificationTopicAction.account_deletion__recovered,
}


def can_notify_deleted_user(topic_action: NotificationTopicAction) -> bool:
    return topic_action in _DELETED_USER_NOTIFICATIONS
