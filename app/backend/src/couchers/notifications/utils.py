from couchers.models import NotificationTopicAction

enum_from_topic_action: dict[tuple[str, str], NotificationTopicAction] = {
    (item.topic, item.action): item for item in NotificationTopicAction
}
