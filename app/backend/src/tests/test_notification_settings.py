import pytest

from couchers.i18n.locales import DEFAULT_LOCALE
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.quick_links import can_unsubscribe_topic_key
from couchers.notifications.render_email import get_topic_action_unsubscribe_text, get_topic_key_unsubscribe_text
from couchers.notifications.settings import settings_layout
from couchers.notifications.utils import get_topic_action_description


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


def test_all_notifications_have_descriptions() -> None:
    for topic_action in NotificationTopicAction:
        # Will throw if there's no string
        assert get_topic_action_description(topic_action, locales=[DEFAULT_LOCALE]) != ""


def test_topic_action_unsubscribe_text_iff_unsubscribable() -> None:
    for topic_action in NotificationTopicAction:
        if topic_action.is_critical:
            with pytest.raises(ValueError):
                get_topic_action_unsubscribe_text(topic_action)
        else:
            assert get_topic_action_unsubscribe_text(topic_action)


def test_topic_key_unsubscribe_text_iff_unsubscribable() -> None:
    for topic_action in NotificationTopicAction:
        if can_unsubscribe_topic_key(topic_action):
            assert get_topic_key_unsubscribe_text(topic_action)
        else:
            with pytest.raises(ValueError):
                get_topic_key_unsubscribe_text(topic_action)
