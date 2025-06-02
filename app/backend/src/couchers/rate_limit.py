import logging
from typing import TYPE_CHECKING

from sqlalchemy import func, select

from couchers.constants import (
    CHAT_INITIATION_HARD_LIMIT,
    CHAT_INITIATION_WARNING_LIMIT,
    FRIEND_REQUEST_HARD_LIMIT,
    FRIEND_REQUEST_WARNING_LIMIT,
    HOST_REQUEST_HARD_LIMIT,
    HOST_REQUEST_WARNING_LIMIT,
    RATE_LIMIT_INTERVAL,
)
from couchers.models import (
    Conversation,
    FriendRelationship,
    GroupChat,
    HostRequest,
    RateLimitAction,
    RateLimitViolation,
)
from couchers.tasks import send_rate_limit_violation_report_email
from couchers.utils import now

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


logger = logging.getLogger(__name__)


def _save_rate_limit_violation(
    session: "Session", user_id: int, action: RateLimitAction, hard_limit: bool
) -> RateLimitViolation:
    """Save a rate limit violation to the database and return it."""
    violation = RateLimitViolation(
        user_id=user_id,
        action=action,
        hard_limit=hard_limit,
    )
    session.add(violation)
    session.flush()
    return violation


def _user_rate_limit_violations_in_past_time_interval(
    session: "Session", user_id: int, action: RateLimitAction, hard_limit: bool
) -> int:
    """Return the number of user rate limit violations in the last rate limit interval."""
    return session.execute(
        select(func.count())
        .select_from(RateLimitViolation)
        .where(RateLimitViolation.user_id == user_id)
        .where(RateLimitViolation.action == action)
        .where(RateLimitViolation.created >= now() - RATE_LIMIT_INTERVAL)
        .where(RateLimitViolation.hard_limit == hard_limit)
    ).scalar_one()


def _get_rate_limit_for_action(action: RateLimitAction) -> tuple[int, int]:
    match action:
        case RateLimitAction.host_request:
            return HOST_REQUEST_WARNING_LIMIT, HOST_REQUEST_HARD_LIMIT
        case RateLimitAction.friend_request:
            return FRIEND_REQUEST_WARNING_LIMIT, FRIEND_REQUEST_HARD_LIMIT
        case RateLimitAction.chat_initiation:
            return CHAT_INITIATION_WARNING_LIMIT, CHAT_INITIATION_HARD_LIMIT
        case _:
            raise ValueError(f"Unknown rate limit action: {action}")


def _has_reached_rate_limit(
    session: "Session", user_id: int, action: RateLimitAction, count_last_interval: int
) -> bool:
    warning_limit, hard_limit = _get_rate_limit_for_action(action=action)
    for limit, is_hard_limit in [(warning_limit, False), (hard_limit, True)]:
        if count_last_interval >= limit:
            if (
                _user_rate_limit_violations_in_past_time_interval(
                    session=session, user_id=user_id, action=action, hard_limit=is_hard_limit
                )
                == 0
            ):
                rate_limit_violation = _save_rate_limit_violation(
                    session=session, user_id=user_id, action=action, hard_limit=is_hard_limit
                )
                send_rate_limit_violation_report_email(
                    session=session, rate_limit_violation=rate_limit_violation, threshold=limit
                )
                if is_hard_limit:
                    return True
    return False


def has_reached_host_request_limit(session: "Session", user_id: int) -> bool:
    """
    Check if the user has reached the host request limit. Notify the moderation team in a separate background job if so.
    """
    count_host_requests_last_interval = session.execute(
        select(func.count())
        .select_from(HostRequest)
        .join(Conversation, HostRequest.conversation_id == Conversation.id)
        .where(HostRequest.surfer_user_id == user_id)
        .where(Conversation.created >= now() - RATE_LIMIT_INTERVAL)
    ).scalar_one()
    return _has_reached_rate_limit(
        session=session,
        user_id=user_id,
        action=RateLimitAction.host_request,
        count_last_interval=count_host_requests_last_interval,
    )


def has_reached_friend_request_limit(session: "Session", user_id: int) -> bool:
    """
    Check if the user has reached the friend request limit. Notify the moderation team in a separate background job if so.
    """
    count_friend_requests_last_interval = session.execute(
        select(func.count())
        .select_from(FriendRelationship)
        .where(FriendRelationship.from_user_id == user_id)
        .where(FriendRelationship.time_sent >= now() - RATE_LIMIT_INTERVAL)
    ).scalar_one()
    return _has_reached_rate_limit(
        session=session,
        user_id=user_id,
        action=RateLimitAction.friend_request,
        count_last_interval=count_friend_requests_last_interval,
    )


def has_reached_chat_initiation_limit(session: "Session", user_id: int) -> bool:
    """
    Check if the user has reached the chat initiation limit. Notify the moderation team in a separate background job if so.
    """
    count_initiated_chats_last_interval = session.execute(
        select(func.count())
        .select_from(GroupChat)
        .join(Conversation, GroupChat.conversation_id == Conversation.id)
        .where(GroupChat.creator_id == user_id)
        .where(Conversation.created >= now() - RATE_LIMIT_INTERVAL)
    ).scalar_one()
    return _has_reached_rate_limit(
        session=session,
        user_id=user_id,
        action=RateLimitAction.chat_initiation,
        count_last_interval=count_initiated_chats_last_interval,
    )
