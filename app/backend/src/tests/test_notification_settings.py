from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.settings import settings_layout


def test_all_notifications_appear_in_settings() -> None:
    # check settings contain all actions+topics
    actions_by_topic: dict[str, list[str]] = {}
    for t in NotificationTopicAction:
        actions_by_topic[t.topic] = actions_by_topic.get(t.topic, []) + [t.action]

    actions_by_topic_check = {}

    for heading, group in settings_layout:
        for topic, name, items in group:
            actions = []
            for topic_action in items:
                actions.append(topic_action.action)
            actions_by_topic_check[topic] = actions

    for topic, actions in actions_by_topic.items():
        assert sorted(actions) == sorted(actions_by_topic_check[topic]), (
            f"Expected {actions} == {actions_by_topic_check[topic]} for {topic}"
        )
    assert sorted(actions_by_topic.keys()) == sorted(actions_by_topic_check.keys())

