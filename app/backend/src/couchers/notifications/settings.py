import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.db import session_scope
from couchers.i18n import LocalizationContext
from couchers.models import (
    NotificationDelivery,
    NotificationDeliveryType,
    NotificationPreference,
    NotificationTopicAction,
)
from couchers.notifications.utils import get_topic_action_description
from couchers.proto import notifications_pb2

logger = logging.getLogger(__name__)


def get_preference(
    session: Session, user_id: int, topic_action: NotificationTopicAction
) -> list[NotificationDeliveryType]:
    """
    Gets the user's preference from the DB or otherwise falls back to defaults

    Must be done in session scope

    Returns list of delivery types
    """
    overrides = {
        res.delivery_type: res.deliver
        for res in session.execute(
            select(NotificationPreference)
            .where(NotificationPreference.user_id == user_id)
            .where(NotificationPreference.topic_action == topic_action)
        )
        .scalars()
        .all()
    }
    return [dt for dt in NotificationDeliveryType if overrides.get(dt, dt in topic_action.defaults)]


def get_topic_actions_by_delivery_type(
    session: Session, user_id: int, delivery_type: NotificationDeliveryType
) -> set[NotificationTopicAction]:
    """
    Given push/email/digest, returns notifications that this user has enabled for that type.
    """
    overrides: dict[NotificationTopicAction, bool] = {}
    for topic_action, deliver in session.execute(
        select(NotificationPreference.topic_action, NotificationPreference.deliver)
        .where(NotificationPreference.user_id == user_id)
        .where(NotificationPreference.delivery_type == delivery_type)
    ).all():
        overrides[topic_action] = deliver
    return {t for t in NotificationTopicAction if overrides.get(t, delivery_type in t.defaults)}


def reset_preference(
    session: Session,
    user_id: int,
    topic_action: NotificationTopicAction,
    delivery_type: NotificationDeliveryType,
) -> None:
    current_pref = session.execute(
        select(NotificationPreference)
        .where(NotificationPreference.user_id == user_id)
        .where(NotificationPreference.topic_action == topic_action)
        .where(NotificationDelivery.delivery_type == delivery_type)
    ).scalar_one_or_none()
    if current_pref:
        session.delete(current_pref)
        session.flush()


class PreferenceNotUserEditableError(Exception):
    pass


def set_preference(
    session: Session,
    user_id: int,
    topic_action: NotificationTopicAction,
    delivery_type: NotificationDeliveryType,
    deliver: bool,
) -> None:
    if topic_action.is_critical:
        raise PreferenceNotUserEditableError()
    current_pref = session.execute(
        select(NotificationPreference)
        .where(NotificationPreference.user_id == user_id)
        .where(NotificationPreference.topic_action == topic_action)
        .where(NotificationPreference.delivery_type == delivery_type)
    ).scalar_one_or_none()
    if current_pref:
        current_pref.deliver = deliver
    else:
        session.add(
            NotificationPreference(
                user_id=user_id,
                topic_action=topic_action,
                delivery_type=delivery_type,
                deliver=deliver,
            )
        )
    session.flush()


settings_layout = [
    (
        "Core Features",
        [
            (
                "host_request",
                "Host requests",
                [
                    NotificationTopicAction.host_request__create,
                    NotificationTopicAction.host_request__accept,
                    NotificationTopicAction.host_request__confirm,
                    NotificationTopicAction.host_request__reject,
                    NotificationTopicAction.host_request__cancel,
                    NotificationTopicAction.host_request__message,
                    NotificationTopicAction.host_request__missed_messages,
                    NotificationTopicAction.host_request__reminder,
                ],
            ),
            (
                "activeness",
                "Activity Check-in",
                [
                    NotificationTopicAction.activeness__probe,
                ],
            ),
            (
                "chat",
                "Messaging",
                [
                    NotificationTopicAction.chat__message,
                    NotificationTopicAction.chat__missed_messages,
                ],
            ),
            (
                "reference",
                "References",
                [
                    NotificationTopicAction.reference__receive_hosted,
                    NotificationTopicAction.reference__receive_surfed,
                    NotificationTopicAction.reference__receive_friend,
                    NotificationTopicAction.reference__reminder_hosted,
                    NotificationTopicAction.reference__reminder_surfed,
                ],
            ),
        ],
    ),
    (
        "Community Features",
        [
            (
                "friend_request",
                "Friend requests",
                [
                    NotificationTopicAction.friend_request__create,
                    NotificationTopicAction.friend_request__accept,
                ],
            ),
            (
                "event",
                "Events",
                [
                    NotificationTopicAction.event__create_approved,
                    NotificationTopicAction.event__create_any,
                    NotificationTopicAction.event__update,
                    NotificationTopicAction.event__comment,
                    NotificationTopicAction.event__cancel,
                    NotificationTopicAction.event__delete,
                    NotificationTopicAction.event__invite_organizer,
                    NotificationTopicAction.event__reminder,
                ],
            ),
            (
                "discussion",
                "Community discussions",
                [
                    NotificationTopicAction.discussion__create,
                    NotificationTopicAction.discussion__comment,
                ],
            ),
            (
                "thread",
                "Threads, Comments, & Replies",
                [
                    NotificationTopicAction.thread__reply,
                ],
            ),
        ],
    ),
    (
        "Account Settings",
        [
            (
                "onboarding",
                "Onboarding",
                [
                    NotificationTopicAction.onboarding__reminder,
                ],
            ),
            (
                "host_my_home",
                "Hosting Nudges",
                [
                    NotificationTopicAction.host_my_home__nudge,
                ],
            ),
            (
                "badge",
                "Updates to Badges on your profile",
                [
                    NotificationTopicAction.badge__add,
                    NotificationTopicAction.badge__remove,
                ],
            ),
            (
                "donation",
                "Donations",
                [
                    NotificationTopicAction.donation__received,
                ],
            ),
        ],
    ),
    (
        "Account Security",
        [
            (
                "password",
                "Password change",
                [
                    NotificationTopicAction.password__change,
                ],
            ),
            (
                "password_reset",
                "Password reset",
                [
                    NotificationTopicAction.password_reset__start,
                    NotificationTopicAction.password_reset__complete,
                ],
            ),
            (
                "email_address",
                "Email address change",
                [
                    NotificationTopicAction.email_address__change,
                    NotificationTopicAction.email_address__verify,
                ],
            ),
            (
                "account_deletion",
                "Account deletion",
                [
                    NotificationTopicAction.account_deletion__start,
                    NotificationTopicAction.account_deletion__complete,
                    NotificationTopicAction.account_deletion__recovered,
                ],
            ),
            (
                "api_key",
                "API keys",
                [
                    NotificationTopicAction.api_key__create,
                ],
            ),
            (
                "phone_number",
                "Phone number change",
                [
                    NotificationTopicAction.phone_number__change,
                    NotificationTopicAction.phone_number__verify,
                ],
            ),
            (
                "birthdate",
                "Birthdate change",
                [
                    NotificationTopicAction.birthdate__change,
                ],
            ),
            (
                "gender",
                "Displayed gender change",
                [
                    NotificationTopicAction.gender__change,
                ],
            ),
            (
                "modnote",
                "Moderator notes",
                [
                    NotificationTopicAction.modnote__create,
                ],
            ),
            (
                "verification",
                "Verification",
                [
                    NotificationTopicAction.verification__sv_fail,
                    NotificationTopicAction.verification__sv_success,
                ],
            ),
            (
                "postal_verification",
                "Postal Verification",
                [
                    NotificationTopicAction.postal_verification__postcard_sent,
                    NotificationTopicAction.postal_verification__success,
                    NotificationTopicAction.postal_verification__failed,
                ],
            ),
        ],
    ),
    (
        "Other Notifications",
        [
            (
                "general",
                "General",
                [
                    NotificationTopicAction.general__new_blog_post,
                ],
            ),
        ],
    ),
]


def get_user_setting_groups(
    user_id: int, loc_context: LocalizationContext
) -> list[notifications_pb2.NotificationGroup]:
    with session_scope() as session:
        groups = []
        for heading, group in settings_layout:
            topics = []
            for topic, name, items in group:
                actions = []
                for topic_action in items:
                    delivery_types = get_preference(session, user_id, topic_action)
                    description = get_topic_action_description(topic_action, locale=loc_context.locale)
                    actions.append(
                        notifications_pb2.NotificationItem(
                            action=topic_action.action,
                            description=description,
                            user_editable=not topic_action.is_critical,
                            push=NotificationDeliveryType.push in delivery_types,
                            email=NotificationDeliveryType.email in delivery_types,
                            digest=NotificationDeliveryType.digest in delivery_types,
                        )
                    )
                topics.append(
                    notifications_pb2.NotificationTopic(
                        topic=topic,
                        name=name,
                        items=actions,
                    )
                )
            groups.append(
                notifications_pb2.NotificationGroup(
                    heading=heading,
                    topics=topics,
                )
            )
        return groups
