import functools
import json

from sqlalchemy.sql import func

from couchers import urls
from couchers.config import config
from couchers.jobs.enqueue import queue_job
from couchers.models import PushNotificationSubscription
from couchers.notifications.push_api import get_vapid_public_key_from_private_key
from couchers.sql import couchers_select as select
from proto.internal import jobs_pb2


@functools.cache
def get_vapid_public_key():
    return get_vapid_public_key_from_private_key(config["PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY"])


def push_to_subscription(
    session,
    *,
    push_notification_subscription_id: int,
    user_id: int,
    topic_action: str,
    key: str = None,
    title: str,
    body: str,
    icon: str = None,
    url: str = None,
    ttl: int = 0,
):
    queue_job(
        session,
        job_type="send_raw_push_notification",
        payload=jobs_pb2.SendRawPushNotificationPayload(
            data=json.dumps(
                {
                    "title": config["NOTIFICATION_PREFIX"] + title[:500],
                    "body": body[:2000],
                    "icon": icon or urls.icon_url(),
                    "url": url,
                    "user_id": user_id,
                    "topic_action": topic_action,
                    "key": key or "",
                }
            ).encode("utf8"),
            push_notification_subscription_id=push_notification_subscription_id,
            ttl=ttl,
        ),
    )


def _push_to_user(session, user_id, topic_action, key, title, body, icon, url, ttl):
    """
    Same as above but for a given user
    """
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
        push_to_subscription(
            session,
            push_notification_subscription_id=sub_id,
            user_id=user_id,
            topic_action=topic_action,
            key=key,
            title=title,
            body=body,
            icon=icon,
            url=url,
            ttl=ttl,
        )


def push_to_user(
    session,
    *,
    user_id: int,
    topic_action: str,
    key: str = None,
    title: str,
    body: str,
    icon: str = None,
    url: str = None,
    ttl: int = 0,
):
    """
    This indirection is so that this can be easily mocked. Not sure how to do it better :(
    """
    _push_to_user(
        session,
        user_id=user_id,
        topic_action=topic_action,
        key=key,
        title=title,
        body=body,
        icon=icon,
        url=url,
        ttl=ttl,
    )
