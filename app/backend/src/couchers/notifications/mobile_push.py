"""Helpers for queuing mobile push notifications"""

import logging

from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from couchers.jobs.enqueue import queue_job
from couchers.models import MobilePushNotificationSubscription
from couchers.proto.internal import jobs_pb2
from couchers.sql import couchers_select as select

logger = logging.getLogger(__name__)


def push_to_mobile_subscription(
    session: Session,
    *,
    mobile_push_notification_subscription_id: int,
    title: str,
    body: str,
    url: str | None = None,
    topic_action: str | None = None,
    key: str | None = None,
) -> None:
    """Queue a SendMobilePushNotification job for a specific subscription"""
    queue_job(
        session,
        job_type="send_mobile_push_notification",
        payload=jobs_pb2.SendMobilePushNotificationPayload(
            mobile_push_notification_subscription_id=mobile_push_notification_subscription_id,
            title=title,
            body=body,
            url=url or "",
            topic_action=topic_action or "",
            key=key or "",
        ),
        priority=7,
    )


def _push_to_mobile_user(
    session: Session,
    *,
    user_id: int,
    title: str,
    body: str,
    url: str | None,
    topic_action: str | None,
    key: str | None,
) -> None:
    """Send mobile push notifications to all active subscriptions for a user"""
    sub_ids = (
        session.execute(
            select(MobilePushNotificationSubscription.id)
            .where(MobilePushNotificationSubscription.user_id == user_id)
            .where(MobilePushNotificationSubscription.disabled_at > func.now())
        )
        .scalars()
        .all()
    )

    for sub_id in sub_ids:
        push_to_mobile_subscription(
            session,
            mobile_push_notification_subscription_id=sub_id,
            title=title,
            body=body,
            url=url,
            topic_action=topic_action,
            key=key,
        )


def push_to_mobile_user(
    session: Session,
    *,
    user_id: int,
    title: str,
    body: str,
    url: str | None = None,
    topic_action: str | None = None,
    key: str | None = None,
) -> None:
    """Public helper to queue mobile pushes for a user"""
    _push_to_mobile_user(
        session,
        user_id=user_id,
        title=title,
        body=body,
        url=url,
        topic_action=topic_action,
        key=key,
    )
