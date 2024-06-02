import functools
import json

from sqlalchemy.sql import func

from couchers import urls
from couchers.config import config
from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.models import PushNotificationSubscription
from couchers.notifications.push_api import get_vapid_public_key_from_private_key
from couchers.sql import couchers_select as select
from proto.internal import jobs_pb2


@functools.lru_cache
def get_vapid_public_key():
    return get_vapid_public_key_from_private_key(config["PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY"])


def push_to_subscription(
    push_notification_subscription_id: int, *, title: str, body: str, icon: str = None, url: str = None, ttl: int = 0
):
    queue_job(
        job_type="send_raw_push_notification",
        payload=jobs_pb2.SendRawPushNotificationPayload(
            data=json.dumps(
                {
                    "title": title[:500],
                    "body": body[:2000],
                    "icon": icon or urls.icon_url(),
                    "url": url,
                }
            ).encode("utf8"),
            push_notification_subscription_id=push_notification_subscription_id,
            ttl=ttl,
        ),
    )


def _push_to_user(user_id, **kwargs):
    """
    Same as above but for a given user
    """
    with session_scope() as session:
        sub_ids = (
            session.execute(
                select(PushNotificationSubscription.id)
                .where(PushNotificationSubscription.user_id == user_id)
                .where(PushNotificationSubscription.disabled_at > func.now())
            )
            .scalars()
            .all()
        )
        for sub_id in sub_ids:
            push_to_subscription(sub_id, **kwargs)


def push_to_user(user_id, **kwargs):
    """
    This indirection is so that this can be easily mocked. Not sure how to do it better :(
    """
    _push_to_user(user_id, **kwargs)
