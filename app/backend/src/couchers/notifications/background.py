import logging
from typing import List

from couchers.db import session_scope
from couchers.models import (
    Notification,
    NotificationDeliveryType,
    NotificationPreference,
    NotificationTopicAction,
    User,
)
from couchers.notifications.utils import enum_from_topic_action
from couchers.sql import couchers_select as select
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
        user = session.execute(select(User).where(User.id == notification.user_id)).scalar_one()
        topic, action = notification.topic_action.unpack()
        logger.info(notification)
        delivery_types = get_notification_preference(session, user.id, notification.topic_action)
        for delivery_type in delivery_types:
            logger.info(f"Should notify by {delivery_type}")
            pass
        # todo: figure out which notifications to send
