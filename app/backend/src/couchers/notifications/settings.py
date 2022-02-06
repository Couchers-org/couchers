import logging

from couchers.models import NotificationDelivery, NotificationPreference
from couchers.sql import couchers_select as select

logger = logging.getLogger(__name__)


def reset_preference(session, user_id, topic_action, delivery_type):
    current_pref = session.execute(
        select(NotificationPreference)
        .where(NotificationPreference.id == user_id)
        .where(NotificationPreference.topic_action == topic_action)
        .where(NotificationDelivery.delivery_type == delivery_type)
    ).scalar_one_or_none()
    if current_pref:
        session.delete(current_pref)
        session.flush()


def set_preference(session, user_id, topic_action, delivery_type, deliver):
    current_pref = session.execute(
        select(NotificationPreference)
        .where(NotificationPreference.id == user_id)
        .where(NotificationPreference.topic_action == topic_action)
        .where(NotificationDelivery.delivery_type == delivery_type)
    ).scalar_one_or_none()
    if current_pref:
        current_pref.deliver = deliver
    else:
        session.add(
            NotificationDelivery(
                user_id=user_id,
                topic_action=topic_action,
                delivery_type=delivery_type,
                deliver=deliver,
            )
        )
    session.flush()
