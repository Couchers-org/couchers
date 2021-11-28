from couchers.models import NotificationDeliveryType, NotificationTopicAction
from couchers.notifications.utils import enum_from_topic_action

push = NotificationDeliveryType.push
email = NotificationDeliveryType.email
digest = NotificationDeliveryType.digest

default_delivery = {
    "friend_request": {
        "send": [push, email, digest],
        "accept": [push, digest],
    }
}


def _check_defaults():
    # todo: move to tests?
    defaults_set_for = [(topic, action) for topic, defs in default_delivery.items() for action, _ in defs.items()]
    # no dupes
    assert len(defaults_set_for) == len(
        set(defaults_set_for)
    ), "Notification preferences (default_delivery) messed up: duplicate preferences"
    # everything has a default
    assert (
        set(defaults_set_for) == enum_from_topic_action.keys()
    ), "Notification preferences (default_delivery) messed up: not every notification type has a default delivery setting"


_check_defaults()
