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


def can_unsubscribe_topic_key(topic_action: NotificationTopicAction) -> bool:
    """
    Determines whether a user can unsubscribe from a specific topic key
    (e.g. muting a specific chat).
    """
    # Only chat__message has a meaningful key (the chat ID); chat__missed_messages is a summary with no specific chat
    return topic_action == NotificationTopicAction.chat__message


def can_notify_deleted_user(topic_action: NotificationTopicAction) -> bool:
    return topic_action in _DELETED_USER_NOTIFICATIONS


def get_topic_action_setting_description(topic_action: NotificationTopicAction, *, locale: str) -> str:
    description_key = f"{topic_action.topic}.{topic_action.action}.event_description"
    return get_notifs_i18next().localize(description_key, locale)


def get_topic_action_unsubscribe_text(topic_action: NotificationTopicAction, *, locale: str) -> str:
    if topic_action.is_critical:
        raise ValueError(f"Cannot get unsubscribe text for critical notification {topic_action}")
    return get_notifs_i18next().localize(
        f"{topic_action.topic}.{topic_action.action}.unsubscribe_from_description", locale
    )


def get_topic_key_unsubscribe_text(topic_action: NotificationTopicAction, *, locale: str) -> str:
    if not can_unsubscribe_topic_key(topic_action):
        raise ValueError(f"Cannot get topic key unsubscribe text for topic {topic_action.topic}")
    return get_notifs_i18next().localize(f"{topic_action.topic}.unsubscribe_from_description", locale)
