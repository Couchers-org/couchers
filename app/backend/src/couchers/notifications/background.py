import logging
from datetime import timedelta
from typing import List

from sqlalchemy.sql import and_, func

from couchers.constants import DIGEST_FREQUENCY
from couchers.db import session_scope
from couchers.models import (
    Notification,
    NotificationDelivery,
    NotificationDeliveryType,
    NotificationPreference,
    NotificationTopicAction,
    User,
)
from couchers.notifications import fan_funcs
from couchers.notifications.notify import notify
from couchers.sql import couchers_select as select
from couchers.tasks import send_digest_email, send_notification_email

logger = logging.getLogger(__name__)


def fan_notifications(payload):
    fan_func = getattr(fan_funcs, payload.fan_func)
    user_ids = fan_func(payload.fan_func_data)
    for user_id in user_ids:
        notify(
            user_id=user_id,
            topic=payload.topic,
            key=payload.key,
            action=payload.action,
            title=payload.title,
            link=payload.link,
            avatar_key=payload.avatar_key or None,
            icon=payload.icon or None,
            content=payload.content or None,
        )


def get_notification_preference(
    session, user_id: int, topic_action: NotificationTopicAction
) -> List[NotificationDeliveryType]:
    """
    Gets the user's preference from the DB or otherwise falls back to defaults

    Must be done in session scope

    Returns list of delivery types
    """
    overrides = {
        res.delivery_type: res.deliver
        for res in session.execute(
            select(NotificationPreference)
            .where(NotificationPreference.id == user_id)
            .where(NotificationPreference.topic_action == topic_action)
        )
        .scalars()
        .all()
    }
    return [dt for dt in NotificationDeliveryType if overrides.get(dt, dt in topic_action.defaults)]


def handle_notification(payload):
    with session_scope() as session:
        notification = session.execute(
            select(Notification).where(Notification.id == payload.notification_id)
        ).scalar_one()

        # ignore this notification if the user hasn't enabled new notifications
        user = session.execute(select(User).where(User.id == notification.user_id)).scalar_one()
        if not user.new_notifications_enabled:
            logger.info(f"Skipping notification delivery for {user} due to new notifications being disabled")
            return

        topic, action = notification.topic_action.unpack()
        delivery_types = get_notification_preference(session, notification.user.id, notification.topic_action)
        for delivery_type in delivery_types:
            logger.info(f"Should notify by {delivery_type}")
            if delivery_type == NotificationDeliveryType.email:
                # for emails we don't deliver straight up, wait until the email background worker gets around to it and handles deduplication
                session.add(
                    NotificationDelivery(
                        notification_id=notification.id,
                        delivered=None,
                        delivery_type=NotificationDeliveryType.email,
                    )
                )
            elif delivery_type == NotificationDeliveryType.digest:
                # for digest notifications, add to digest queue
                session.add(
                    NotificationDelivery(
                        notification_id=notification.id,
                        delivered=None,
                        delivery_type=NotificationDeliveryType.digest,
                    )
                )
            elif delivery_type == NotificationDeliveryType.push:
                # for push notifications, we send them straight away
                session.add(
                    NotificationDelivery(
                        notification_id=notification.id,
                        delivered=func.now(),
                        delivery_type=NotificationDeliveryType.push,
                    )
                )
                # todo
                logger.info("Supposed to send push notification")


def handle_email_notifications(payload):
    """
    Sends out emails for notifications
    """
    logger.info(f"Sending out email notifications")

    with session_scope() as session:
        # delivered email notifications: we don't want to send emails for these
        subquery = (
            select(Notification.user_id, Notification.topic_action, Notification.key)
            .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
            .where(NotificationDelivery.delivery_type == NotificationDeliveryType.email)
            .where(NotificationDelivery.delivered != None)
            .where(Notification.created > func.now() - timedelta(hours=24))
            .group_by(Notification.user_id, Notification.topic_action, Notification.key)
            .subquery()
        )

        email_notifications_to_send = session.execute(
            (
                select(
                    User,
                    Notification.topic_action,
                    Notification.key,
                    func.min(Notification.id).label("notification_id"),
                    func.min(NotificationDelivery.id).label("notification_delivery_id"),
                )
                .join(User, User.id == Notification.user_id)
                .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
                .where(NotificationDelivery.delivery_type == NotificationDeliveryType.email)
                .where(Notification.created > func.now() - timedelta(hours=1))
                .group_by(User, Notification.user_id, Notification.topic_action, Notification.key)
                # pick the notifications that haven't been delivered
                .outerjoin(
                    subquery,
                    and_(
                        and_(
                            subquery.c.user_id == Notification.user_id,
                            subquery.c.topic_action == Notification.topic_action,
                        ),
                        subquery.c.key == Notification.key,
                    ),
                )
                .where(subquery.c.key == None)
            )
        ).all()

        for user, topic_action, key, notification_id, notification_delivery_id in email_notifications_to_send:
            topic, action = topic_action.unpack()
            logger.info(f"Sending notification id {notification_id} to {user.id} ({topic}/{action}/{key})")
            notification_delivery = session.execute(
                select(NotificationDelivery).where(NotificationDelivery.id == notification_delivery_id)
            ).scalar_one()
            assert notification_delivery.delivery_type == NotificationDeliveryType.email
            assert not notification_delivery.delivered
            assert notification_delivery.notification_id == notification_id
            send_notification_email(notification_delivery.notification)
            notification_delivery.delivered = func.now()
            session.commit()


def handle_email_digests(payload):
    """
    Sends out email digests

    The email digest is sent if the user has "digest" type notifications that have not had an individual email sent about them already.

    If a digest is sent, then we send out every notification that has type digest, regardless of if they already got another type of notification about it.

    That is, we don't send out an email unless there's something new, but if we do send one out, we send new and old stuff.
    """
    logger.info(f"Sending out email digests")

    with session_scope() as session:
        # needed?
        # # so that if this runs for a long time, we don't mess up if new notifications come at the same time
        # digest_time = now()

        # already sent email notifications
        delivered_email_notifications = (
            select(
                Notification.id.label("notification_id"),
                # min is superfluous but needed for group_by
                func.min(NotificationDelivery.id).label("notification_delivery_id"),
            )
            .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
            .where(NotificationDelivery.delivery_type == NotificationDeliveryType.email)
            .where(NotificationDelivery.delivered != None)
            .group_by(Notification)
            .subquery()
        )

        # users who have unsent "digest" type notifications but not sent email notifications
        users_to_send_digests_to = (
            session.execute(
                (
                    select(User)
                    .where(User.last_digest_sent < func.now() - DIGEST_FREQUENCY)
                    # todo: tz
                    .join(Notification, Notification.user_id == User.id)
                    .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
                    .where(NotificationDelivery.delivery_type == NotificationDeliveryType.digest)
                    .where(NotificationDelivery.delivered == None)
                    .outerjoin(
                        delivered_email_notifications,
                        delivered_email_notifications.c.notification_id == Notification.id,
                    )
                    .where(delivered_email_notifications.c.notification_delivery_id == None)
                    .group_by(User)
                )
            )
            .scalars()
            .all()
        )

        logger.info(f"{users_to_send_digests_to=}")

        for user in users_to_send_digests_to:
            # digest notifications that haven't been delivered yet
            notifications_and_deliveries = session.execute(
                (
                    select(Notification, NotificationDelivery)
                    .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
                    .where(NotificationDelivery.delivery_type == NotificationDeliveryType.digest)
                    .where(NotificationDelivery.delivered == None)
                    .where(Notification.user_id == user.id)
                    .order_by(Notification.created)
                )
            ).all()

            if notifications_and_deliveries:
                notifications, deliveries = zip(*notifications_and_deliveries)
                logger.info(f"Sending {user.id=} a digest with {len(notifications)} notifications")
                send_digest_email(user, notifications)
                for delivery in deliveries:
                    delivery.delivered = func.now()
                user.last_digest_sent = func.now()
            session.commit()
