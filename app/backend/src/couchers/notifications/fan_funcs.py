"""
Contains "fan functions" that given some data decide who to notify. Needs to return a list of user ids
"""

import logging

from sqlalchemy.sql import func, not_, select

from couchers.db import session_scope
from couchers.models import (
    ClusterSubscription,
    Event,
    EventOccurrence,
    GroupChat,
    GroupChatSubscription,
    Message,
    MessageType,
    User,
)
from couchers.sql import couchers_select as select

logger = logging.getLogger(__name__)


def fan_message_notifications(message_id_str):
    """
    Generates notifications for a message sent to a group chat
    """
    message_id = int(message_id_str)
    logger.info(f"Fanning notifications for message_id = {message_id}")

    with session_scope() as session:
        message, group_chat = session.execute(
            select(Message, GroupChat)
            .join(GroupChat, GroupChat.conversation_id == Message.conversation_id)
            .where(Message.id == message_id)
        ).one()

        if message.message_type != MessageType.text:
            logger.info(f"Not a text message, not notifying. message_id = {message_id}")
            return

        subscriptions = (
            session.execute(
                select(GroupChatSubscription)
                .join(User, User.id == GroupChatSubscription.user_id)
                .where(GroupChatSubscription.group_chat_id == message.conversation_id)
                .where(User.is_visible)
                .where(User.id != message.author_id)
                .where(GroupChatSubscription.left == None)
                .where(not_(GroupChatSubscription.is_muted))
            )
            .scalars()
            .all()
        )

        return [subscription.user_id for subscription in subscriptions]


def fan_create_event_notifications(occurrence_id_str):
    """Fans out notifications to all users who should be notified about this event."""
    occurrence_id = int(occurrence_id_str)
    logger.info(f"Fanning out notifications for event occurrence id = {occurrence_id}")

    with session_scope() as session:
        event, occurrence = session.execute(
            select(Event, EventOccurrence)
            .where(EventOccurrence.id == occurrence_id)
            .where(EventOccurrence.event_id == Event.id)
        ).one()
        creator = occurrence.creator_user

        if not creator.has_completed_profile:
            logger.info(
                f"{creator.name=} can't send notifications for {event.title=} because of an incomplete profile."
            )
            return []

        subscribers: set[User] = set()
        cluster = event.parent_node.official_cluster
        if cluster.parent_node_id == 1:
            logger.info(f"The Global Community is too big for email notifications.")
        elif creator in cluster.admins:
            subscribers.update(cluster.members)
        elif cluster.is_leaf:
            subscribers.update(cluster.members)
        else:
            max_radius = 20000  # m
            subscribers.update(
                session.execute(
                    select(User)
                    .join(ClusterSubscription, ClusterSubscription.user_id == User.id)
                    .where(ClusterSubscription.cluster_id == cluster.id)
                    .where(func.ST_DWithin(User.geom, occurrence.geom, max_radius / 111111))
                )
                .scalars()
                .all()
            )

        return [subscriber.id for subscriber in subscribers]


def fan_to_occurrence_subscribers_and_attendees(occurrence_id_str):
    occurrence_id = int(occurrence_id_str)
    with session_scope() as session:
        event, occurrence = session.execute(
            select(Event, EventOccurrence)
            .where(EventOccurrence.id == occurrence_id)
            .where(EventOccurrence.event_id == Event.id)
        ).one()
        subscribed_user_ids = [user.id for user in event.subscribers]
        attending_user_ids = [user.id for user in occurrence.attendees]
        return list(set(subscribed_user_ids + attending_user_ids))
