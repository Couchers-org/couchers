import logging
from datetime import timedelta
from typing import List

from sqlalchemy.sql import and_, func

from couchers.db import session_scope
from couchers.models import (
    Notification,
    NotificationDelivery,
    NotificationDeliveryType,
    NotificationPreference,
    NotificationTopicAction,
    User,
)
from couchers.notifications.utils import enum_from_topic_action
from couchers.sql import couchers_select as select
from couchers.tasks import send_notification_email
from couchers.utils import now

logger = logging.getLogger(__name__)


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


def handle_notification(notification_id):
    with session_scope() as session:
        notification = session.execute(select(Notification).where(Notification.id == notification_id)).scalar_one()
        topic, action = notification.topic_action.unpack()
        logger.info(notification)
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


def handle_email_notifications():
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
                (select(NotificationDelivery).where(NotificationDelivery.id == notification_delivery_id))
            ).scalar_one()
            send_notification_email(notification_delivery.notification)
            assert notification_delivery.delivery_type == NotificationDeliveryType.email
            assert not notification_delivery.delivered
            assert notification_delivery.notification == notification_id
            notification_delivery.delivered = func.now()
            session.commit()
