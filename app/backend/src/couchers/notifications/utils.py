from couchers.models import NotificationTopicAction
from couchers.notifications.locales import get_notifs_i18next

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


def get_topic_action_description(topic_action: NotificationTopicAction, locale: str) -> str:
    description_key = f"topic_action_descriptions.{topic_action.topic}.{topic_action.action}"
    return get_notifs_i18next().localize(description_key, locale)
