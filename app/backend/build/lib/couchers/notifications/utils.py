from couchers.models import NotificationTopicAction

enum_from_topic_action = {(item.topic, item.action): item for item in NotificationTopicAction}
