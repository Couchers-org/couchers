from couchers.i18n import LocalizationContext
from couchers.i18n.locales import DEFAULT_LOCALE
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.utils import can_unsubscribe_topic_key, get_topic_action_setting_description, get_topic_action_unsubscribe_text, get_topic_key_unsubscribe_text


def test_topic_action_setting_descriptions() -> None:
    for topic_action in NotificationTopicAction:
        # Will throw if there's no string
        assert get_topic_action_setting_description(topic_action, locale=DEFAULT_LOCALE) != ""

def test_topic_action_unsubscribe_texts() -> None:
    for topic_action in NotificationTopicAction:
        if not topic_action.is_critical:
            assert get_topic_action_unsubscribe_text(topic_action, loc_context=LocalizationContext.en_utc()) is not None

def test_topic_key_unsubscribe_texts() -> None:
    for topic_action in NotificationTopicAction:
        if can_unsubscribe_topic_key(topic_action.topic):
            assert get_topic_key_unsubscribe_text(topic_action, loc_context=LocalizationContext.en_utc()) is not None
