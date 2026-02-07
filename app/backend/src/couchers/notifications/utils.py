from couchers.models import NotificationTopicAction

enum_from_topic_action: dict[tuple[str, str], NotificationTopicAction] = {
    (item.topic, item.action): item for item in NotificationTopicAction
}

ACCOUNT_DELETION_TOPIC = NotificationTopicAction.account_deletion__start.topic


def can_unsubscribe_topic_key(topic: str | NotificationTopicAction) -> bool:
    """
    Determines whether a user can unsubscribe from all notification actions
    concerning a given topic.
    """
    if isinstance(topic, NotificationTopicAction):
        topic = topic.topic
    # We currently only support unsubscribing from chat topics
    return topic == NotificationTopicAction.chat__message.topic
