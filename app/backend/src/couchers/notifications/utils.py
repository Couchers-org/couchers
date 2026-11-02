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


def get_notification_string_key_prefix(topic_action: NotificationTopicAction) -> str:
    """Returns the key prefix under which a topic-action's localized strings are found."""
    # The "host_request" topic-action is for both stay requests and invitations.
    # Strings are unified under the "stay" node.
    topic_root = "stay" if topic_action.topic == "host_request" else topic_action.topic
    return f"{topic_root}.{topic_action.action}"


def get_topic_action_description(topic_action: NotificationTopicAction, locales: list[str]) -> str:
    description_key = f"{get_notification_string_key_prefix(topic_action)}.event_description"
    return get_notifs_i18next().localize(description_key, locales)
