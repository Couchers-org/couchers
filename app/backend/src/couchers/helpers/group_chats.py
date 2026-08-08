"""
Rules for scoping a user's group chat messages, shared by the conversations API and the Ping badge.
"""

from datetime import datetime

from sqlalchemy import ColumnElement, SQLColumnExpression, and_, func, or_, select

from couchers.models import GroupChatSubscription, Message


def was_subscribed_at(
    subscription: type[GroupChatSubscription], instant: SQLColumnExpression[datetime] | datetime
) -> ColumnElement[bool]:
    """
    In the chat at the given instant: joined before it and hadn't left yet, or left after it.
    """
    return and_(
        subscription.joined <= instant,
        or_(subscription.left == None, subscription.left >= instant),
    )


def is_unseen(message: type[Message], subscription: type[GroupChatSubscription]) -> ColumnElement[bool]:
    """
    Unseen by the subscriber and still within their reach: a message they can never open, because it
    was sent while they were out of the chat, is not unread.
    """
    return and_(
        was_subscribed_at(subscription, message.time),
        message.id > subscription.last_seen_message_id,
    )


def is_newest_subscription(user_id: SQLColumnExpression[int] | int) -> ColumnElement[bool]:
    """
    Only the user's newest subscription to each chat they've been in. Rejoining a chat leaves the
    earlier subscription behind, and it's the newest one that carries the archived and last-seen state.
    """
    newest_per_chat = (
        select(func.max(GroupChatSubscription.id))
        .where(GroupChatSubscription.user_id == user_id)
        .group_by(GroupChatSubscription.group_chat_id)
        # not aliased(): rebuilding the ORM proxy index per call is a hotspot, and Ping runs this on
        # every poll. correlate_except keeps this table local to the subquery so it doesn't bind to
        # the enclosing query's GroupChatSubscription
        .correlate_except(GroupChatSubscription)
    )
    return GroupChatSubscription.id.in_(newest_per_chat)
