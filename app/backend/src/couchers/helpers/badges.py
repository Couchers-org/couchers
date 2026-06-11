from sqlalchemy import exists, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import delete

from couchers.context import make_notification_user_context
from couchers.models import UserBadge
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.notify import notify
from couchers.proto import notification_data_pb2
from couchers.resources import get_badge_dict


def user_add_badge(session: Session, user_id: int, badge_id: str, do_notify: bool = True) -> None:
    badge = get_badge_dict()[badge_id]
    already_has_badge = session.execute(
        select(exists().where(UserBadge.user_id == user_id, UserBadge.badge_id == badge_id))
    ).scalar()
    if already_has_badge:
        return
    session.add(UserBadge(user_id=user_id, badge_id=badge_id))
    session.flush()
    if do_notify:
        context = make_notification_user_context(user_id=user_id)
        notify(
            session,
            user_id=user_id,
            topic_action=NotificationTopicAction.badge__add,
            key=badge.id,
            data=notification_data_pb2.BadgeAdd(
                badge_id=badge.id,
                badge_name=context.localization.localize_string(f"badges.{badge.id}_name"),
                badge_description=context.localization.localize_string(f"badges.{badge.id}_description"),
            ),
        )
    session.commit()


def user_remove_badge(session: Session, user_id: int, badge_id: str) -> None:
    badge = get_badge_dict()[badge_id]
    session.execute(delete(UserBadge).where(UserBadge.user_id == user_id, UserBadge.badge_id == badge.id))
    session.flush()
    context = make_notification_user_context(user_id=user_id)
    notify(
        session,
        user_id=user_id,
        topic_action=NotificationTopicAction.badge__remove,
        key=badge.id,
        data=notification_data_pb2.BadgeRemove(
            badge_id=badge.id,
            badge_name=context.localization.localize_string(f"badges.{badge.id}_name"),
            badge_description=context.localization.localize_string(f"badges.{badge.id}_description"),
        ),
    )
    session.commit()
