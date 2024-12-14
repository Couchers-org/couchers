from sqlalchemy.sql import delete

from couchers.models import UserBadge
from couchers.notifications.notify import notify
from couchers.resources import get_badge_dict
from proto import notification_data_pb2


def user_add_badge(session, user_id, badge_id, do_notify=True):
    badge = get_badge_dict()[badge_id]
    session.add(UserBadge(user_id=user_id, badge_id=badge_id))
    session.flush()
    if do_notify:
        notify(
            session,
            user_id=user_id,
            topic_action="badge:add",
            data=notification_data_pb2.BadgeAdd(
                badge_id=badge["id"],
                badge_name=badge["name"],
                badge_description=badge["description"],
            ),
        )
    session.commit()


def user_remove_badge(session, user_id, badge_id):
    badge = get_badge_dict()[badge_id]
    session.execute(delete(UserBadge).where(UserBadge.user_id == user_id, UserBadge.badge_id == badge_id))
    session.flush()
    notify(
        session,
        user_id=user_id,
        topic_action="badge:remove",
        data=notification_data_pb2.BadgeRemove(
            badge_id=badge["id"],
            badge_name=badge["name"],
            badge_description=badge["description"],
        ),
    )
    session.commit()
