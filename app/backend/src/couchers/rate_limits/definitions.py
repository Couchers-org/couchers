"""Rate limit definitions:
In order to add a new rate limit definition, extend RateLimitAction and RATE_LIMIT_DEFINITIONS and call
rate_limits.check.process_rate_limits_and_check_abort in the relevant endpoint.
"""

from dataclasses import dataclass
from datetime import timedelta
from typing import TYPE_CHECKING, Callable

from sqlalchemy import func, select

from couchers.models import (
    Conversation,
    FriendRelationship,
    GroupChat,
    GroupChatSubscription,
    HostRequest,
    RateLimitAction,
    User,
)
from couchers.utils import now

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


@dataclass
class RateLimitDefinition:
    warning_limit: int
    hard_limit: int
    count_actions_query: Callable[["Session", int], int]
    mod_email_information_query: Callable[["Session", int], list[dict]]


RATE_LIMIT_INTERVAL = timedelta(hours=24)
RATE_LIMIT_INTERVAL_STRING = "24 hours"


def _get_user_host_requests_in_past_time_interval(session, user_id) -> list[dict]:
    return (
        session.execute(
            select(
                Conversation.created.label("created"),
                HostRequest.host_user_id.label("host id"),
                User.username.label("host username"),
                User.city.label("host city"),
            )
            .join(Conversation, HostRequest.conversation_id == Conversation.id)
            .join(User, HostRequest.host_user_id == User.id)
            .where(HostRequest.surfer_user_id == user_id)
            .where(Conversation.created >= now() - RATE_LIMIT_INTERVAL)
        )
        .mappings()
        .all()
    )


def _get_user_friend_requests_in_past_time_interval(session, user_id) -> list[dict]:
    return (
        session.execute(
            select(
                FriendRelationship.time_sent,
                User.id.label("to_user (ID)"),
                User.username.label("to_user (username)"),
                FriendRelationship.status,
            )
            .join(User, FriendRelationship.to_user_id == User.id)
            .where(FriendRelationship.from_user_id == user_id)
            .where(FriendRelationship.time_sent >= now() - RATE_LIMIT_INTERVAL)
        )
        .mappings()
        .all()
    )


def _get_user_initiated_chats_in_past_time_interval(session, user_id) -> list[dict]:
    return (
        session.execute(
            select(
                Conversation.id,
                Conversation.created,
                GroupChat.title,
                GroupChat.is_dm,
                func.array_agg(User.username).label("participants"),
            )
            .join(Conversation, GroupChat.conversation_id == Conversation.id)
            .join(GroupChatSubscription, Conversation.id == GroupChatSubscription.group_chat_id)
            .join(User, GroupChatSubscription.user_id == User.id)
            .where(GroupChat.creator_id == user_id)
            .where(Conversation.created >= now() - RATE_LIMIT_INTERVAL)
            .where(GroupChatSubscription.left == None)
            .group_by(Conversation.id, Conversation.created, GroupChat.title, GroupChat.is_dm)
        )
        .mappings()
        .all()
    )


RATE_LIMIT_DEFINITIONS = {
    RateLimitAction.host_request: RateLimitDefinition(
        warning_limit=20,
        hard_limit=80,
        count_actions_query=lambda session, user_id: session.execute(
            select(func.count())
            .select_from(HostRequest)
            .join(Conversation, HostRequest.conversation_id == Conversation.id)
            .where(HostRequest.surfer_user_id == user_id)
            .where(Conversation.created >= now() - RATE_LIMIT_INTERVAL)
        ).scalar_one(),
        mod_email_information_query=_get_user_host_requests_in_past_time_interval,
    ),
    RateLimitAction.friend_request: RateLimitDefinition(
        warning_limit=10,
        hard_limit=40,
        count_actions_query=lambda session, user_id: session.execute(
            select(func.count())
            .select_from(FriendRelationship)
            .where(FriendRelationship.from_user_id == user_id)
            .where(FriendRelationship.time_sent >= now() - RATE_LIMIT_INTERVAL)
        ).scalar_one(),
        mod_email_information_query=_get_user_friend_requests_in_past_time_interval,
    ),
    RateLimitAction.chat_initiation: RateLimitDefinition(
        warning_limit=15,
        hard_limit=150,
        count_actions_query=lambda session, user_id: session.execute(
            select(func.count())
            .select_from(GroupChat)
            .join(Conversation, GroupChat.conversation_id == Conversation.id)
            .where(GroupChat.creator_id == user_id)
            .where(Conversation.created >= now() - RATE_LIMIT_INTERVAL)
        ).scalar_one(),
        mod_email_information_query=_get_user_initiated_chats_in_past_time_interval,
    ),
}
