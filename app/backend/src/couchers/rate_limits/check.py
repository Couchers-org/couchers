import logging
from typing import TYPE_CHECKING

from sqlalchemy import exists, func, select

from couchers.models import (
    Conversation,
    FriendRelationship,
    GroupChat,
    GroupChatSubscription,
    HostRequest,
    RateLimitAction,
    RateLimitViolation,
    User,
)
from couchers.rate_limits.constants import RATE_LIMIT_DEFINITIONS, RATE_LIMIT_INTERVAL
from couchers.tasks import send_rate_limit_violation_report_email
from couchers.utils import now

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


logger = logging.getLogger(__name__)


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


def _get_user_events_in_past_time_interval(session, user_id: int) -> dict[str, list[dict]]:
    """Get all relevant events for the user in the last rate limit interval for the mod email."""
    return {
        "host_requests": _get_user_host_requests_in_past_time_interval(session, user_id),
        "friend_requests": _get_user_friend_requests_in_past_time_interval(session, user_id),
        "chat_initiations": _get_user_initiated_chats_in_past_time_interval(session, user_id),
    }


def _save_rate_limit_violation(
    session: "Session", user_id: int, action: RateLimitAction, is_hard_limit: bool
) -> RateLimitViolation:
    """Save a rate limit violation to the database and return it."""
    violation = RateLimitViolation(
        user_id=user_id,
        action=action,
        is_hard_limit=is_hard_limit,
    )
    session.add(violation)
    session.flush()
    return violation


def _user_has_violated_rate_limit_in_past_time_interval(
    session: "Session", user_id: int, action: RateLimitAction, is_hard_limit: bool
) -> bool:
    """Check if a RateLimitViolation for the user for the given action exists in the last RATE_LIMIT_INTERVAL."""
    return session.execute(
        select(
            exists().where(
                RateLimitViolation.user_id == user_id,
                RateLimitViolation.action == action,
                RateLimitViolation.created >= now() - RATE_LIMIT_INTERVAL,
                RateLimitViolation.is_hard_limit == is_hard_limit,
            )
        )
    ).scalar_one()


def _get_user_action_count_last_interval(session: "Session", user_id: int, action: RateLimitAction) -> int:
    """Return the number of user actions in the last RATE_LIMIT_INTERVAL."""
    match action:
        case RateLimitAction.host_request:
            return session.execute(
                select(func.count())
                .select_from(HostRequest)
                .join(Conversation, HostRequest.conversation_id == Conversation.id)
                .where(HostRequest.surfer_user_id == user_id)
                .where(Conversation.created >= now() - RATE_LIMIT_INTERVAL)
            ).scalar_one()
        case RateLimitAction.friend_request:
            return session.execute(
                select(func.count())
                .select_from(FriendRelationship)
                .where(FriendRelationship.from_user_id == user_id)
                .where(FriendRelationship.time_sent >= now() - RATE_LIMIT_INTERVAL)
            ).scalar_one()
        case RateLimitAction.chat_initiation:
            return session.execute(
                select(func.count())
                .select_from(GroupChat)
                .join(Conversation, GroupChat.conversation_id == Conversation.id)
                .where(GroupChat.creator_id == user_id)
                .where(Conversation.created >= now() - RATE_LIMIT_INTERVAL)
            ).scalar_one()
        case _:
            raise ValueError(f"Unknown rate limit action: {action}")


def process_rate_limits_and_check_abort(session: "Session", user_id: int, action: RateLimitAction) -> bool:
    """
    Check if the user has reached a rate limit. Notify the moderation team in a separate background job if so.

    Returns True if the user has reached a hard rate limit.
    """
    count_last_interval = _get_user_action_count_last_interval(session=session, user_id=user_id, action=action)
    rate_limit = RATE_LIMIT_DEFINITIONS[action]
    for limit, is_hard_limit in [(rate_limit.hard_limit, True), (rate_limit.warning_limit, False)]:
        if count_last_interval >= limit:
            if not _user_has_violated_rate_limit_in_past_time_interval(
                session=session, user_id=user_id, action=action, is_hard_limit=is_hard_limit
            ):
                rate_limit_violation = _save_rate_limit_violation(
                    session=session, user_id=user_id, action=action, is_hard_limit=is_hard_limit
                )
                events = _get_user_events_in_past_time_interval(session=session, user_id=user_id)
                send_rate_limit_violation_report_email(
                    session=session, rate_limit_violation=rate_limit_violation, threshold=limit, events=events
                )
                if is_hard_limit:
                    return True
    return False
