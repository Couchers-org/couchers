from sqlalchemy import exists, select

from couchers.models import Notification, NotificationTopicAction

enum_from_topic_action = {(item.topic, item.action): item for item in NotificationTopicAction}


def user_has_unseen_notifications(session, user_id: int, key: str | None = None) -> bool:
    if key is None:
        return session.execute(
            select(exists().where((Notification.user_id == user_id) & (Notification.is_seen.is_(False))))
        ).scalar_one()

    return session.execute(
        select(
            exists().where(
                (Notification.user_id == user_id) & (Notification.is_seen.is_(False)) & (Notification.key == key)
            )
        )
    ).scalar_one()
