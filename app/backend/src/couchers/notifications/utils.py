from decimal import Decimal

from couchers.models import NotificationTopicAction
from couchers.notifications.locales import get_notifs_i18next
from couchers.proto import notification_data_pb2

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


def get_topic_action_description(topic_action: NotificationTopicAction, locales: list[str]) -> str:
    description_key = f"{topic_action.topic}.{topic_action.action}.event_description"
    return get_notifs_i18next().localize(description_key, locales)


# TODO(9883): Remove once there are no more notifications without amount_decimal.
def get_donation_amount(data: notification_data_pb2.DonationReceived) -> tuple[Decimal, str]:
    """Returns the donation amount and its ISO 4217 currency code."""
    if data.amount_decimal:
        return Decimal(data.amount_decimal), data.currency_iso4217
    # Backcompat for notifications created before amount_decimal was introduced
    return Decimal(data.amount_usd), "USD"
