import functools

from couchers.config import config
from couchers.notifications.push_api import get_vapid_public_key_from_private_key, send_push


@functools.lru_cache
def get_vapid_public_key():
    return get_vapid_public_key_from_private_key(config["PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY"])


def send_push_notification_raw(data, sub):
    send_push(
        data,
        sub.endpoint,
        sub.auth_key,
        sub.p256dh_key,
        config["PUSH_NOTIFICATIONS_VAPID_SUBJECT"],
        config["PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY"],
    )
