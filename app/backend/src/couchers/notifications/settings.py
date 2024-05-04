import logging
from typing import List

from couchers.db import session_scope
from couchers.models import (
    NotificationDelivery,
    NotificationDeliveryType,
    NotificationPreference,
    NotificationTopicAction,
)
from couchers.notifications.utils import enum_from_topic_action
from couchers.sql import couchers_select as select
from proto import notifications_pb2

logger = logging.getLogger(__name__)


def get_preference(session, user_id: int, topic_action: NotificationTopicAction) -> List[NotificationDeliveryType]:
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


def reset_preference(session, user_id, topic_action, delivery_type):
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


def set_preference(session, user_id, topic_action: NotificationTopicAction, delivery_type, deliver):
    if not topic_action.user_editable:
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
                    ("create", "Someone sends you a host request"),
                    ("accept", "Someone accepts your host request"),
                    ("reject", "Someone rejects your host request"),
                    ("confirm", "Someone confirms your host request"),
                    ("cancel", "Someone cancels your host request"),
                    ("message", "Someone sends a message in a host request"),
                ],
            ),
            (
                "chat",
                "Messaging",
                [
                    ("message", "Someone sends you a message"),
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
                    ("send", "Someone sends you a friend request"),
                    ("accept", "Someone aceepts your friend request"),
                ],
            ),
            (
                "event",
                "Events",
                [
                    ("create", "An event is created in your community"),
                    ("update", "An event you are attending is updated"),
                    ("invite_organizer", "Someone invites you to co-organize an event"),
                ],
            ),
        ],
    ),
    (
        "Account Settings",
        [
            (
                "password",
                "Password change",
                [
                    ("change", "Your password is changed"),
                ],
            ),
            (
                "email_address",
                "Email address changes",
                [
                    ("change", "Your email is changed"),
                ],
            ),
            (
                "phone_number",
                "Phone number changes",
                [
                    ("change", "Your phone number is changed"),
                    ("verify", "Your phone number is verified"),
                ],
            ),
            (
                "account_recovery",
                "Account recovery",
                [
                    ("start", "Password reset is initiated"),
                    ("complete", "Password reset is completed"),
                ],
            ),
            (
                "api_key",
                "API keys",
                [
                    ("create", "An API key is created for your account"),
                ],
            ),
            (
                "badge",
                "Updates to Badges",
                [
                    ("add", "A badge is added to your account"),
                    ("remove", "A badge is removed from your account"),
                ],
            ),
            (
                "birthdate",
                "Birthdate change",
                [
                    ("change", "Your birthdate is changed"),
                ],
            ),
            (
                "gender",
                "Displayed gender change",
                [
                    ("change", "The gender displayed on your profile is changed"),
                ],
            ),
        ],
    ),
]


def check_settings():
    # check settings contain all actions+topics
    actions_by_topic = {}
    for t in NotificationTopicAction:
        actions_by_topic[t.topic] = actions_by_topic.get(t.topic, []) + [t.action]

    actions_by_topic_check = {}

    all_settings_topics = []
    for heading, group in settings_layout:
        for topic, name, items in group:
            actions = []
            for action, description in items:
                actions.append(action)
            actions_by_topic_check[topic] = actions

    for topic, actions in actions_by_topic.items():
        assert sorted(actions) == sorted(actions_by_topic_check[topic])
    assert sorted(actions_by_topic.keys()) == sorted(actions_by_topic_check.keys())


check_settings()


def get_user_setting_groups(user_id) -> List[notifications_pb2.NotificationGroup]:
    with session_scope() as session:
        groups = []
        for heading, group in settings_layout:
            topics = []
            for topic, name, items in group:
                actions = []
                for action, description in items:
                    topic_action = enum_from_topic_action[topic, action]
                    delivery_types = get_preference(session, user_id, topic_action)
                    actions.append(
                        notifications_pb2.NotificationItem(
                            action=action,
                            description=description,
                            user_editable=topic_action.user_editable,
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
