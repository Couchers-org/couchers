"""
Rules for scoping a user's group chat messages, shared by the conversations API and the Ping badge.
Both count the same unread messages, so they have to agree on which of the user's subscriptions
speaks for a chat and which of that chat's messages the user is entitled to see.
"""

from sqlalchemy import ColumnElement, Select, and_, func, or_, select

from couchers.models import GroupChatSubscription, Message


def in_subscription_window() -> ColumnElement[bool]:
    """
    Restricts Message to what the joined GroupChatSubscription's user is entitled to see: messages
    sent while they were in the chat. Without it, a chat the user has left shows unread messages
    they can never open.
    """
    return and_(
        Message.time >= GroupChatSubscription.joined,
        or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None),
    )


def current_subscription_ids(user_id: int) -> Select[tuple[int]]:
    """
    The user's newest subscription to each chat they've been in. Rejoining a chat leaves the earlier
    subscription behind, and it's the newest one that carries the archived and last-seen state the
    API reads, so only that one may decide what a chat counts, shows, or marks as seen.

    Built on the bare GroupChatSubscription rather than aliased(): aliasing the entity per call
    rebuilds the ORM proxy index, and Ping runs this on every poll. correlate_except keeps this
    table local to the subquery so it doesn't bind to the enclosing query's GroupChatSubscription.
    """
    return (
        select(func.max(GroupChatSubscription.id))
        .where(GroupChatSubscription.user_id == user_id)
        .group_by(GroupChatSubscription.group_chat_id)
        .correlate_except(GroupChatSubscription)
    )
