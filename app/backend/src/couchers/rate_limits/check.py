import logging
from typing import TYPE_CHECKING

from sqlalchemy import exists, select

from couchers.models import RateLimitAction, RateLimitViolation
from couchers.rate_limits.definitions import RATE_LIMIT_DEFINITIONS, RATE_LIMIT_INTERVAL
from couchers.tasks import send_rate_limit_violation_report_email
from couchers.utils import now

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


logger = logging.getLogger(__name__)


def _get_user_events_in_past_time_interval(session, user_id: int) -> dict[RateLimitAction, list[dict]]:
    """Get all relevant events for the user in the last rate limit interval for the mod email."""
    return {
        action: RATE_LIMIT_DEFINITIONS[action].mod_email_information_query(session, user_id)
        for action in RateLimitAction
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


def process_rate_limits_and_check_abort(session: "Session", user_id: int, action: RateLimitAction) -> bool:
    """
    Check if the user has reached a rate limit. Notify the moderation team in a separate background job if so.

    Returns True if the user has reached a hard rate limit.
    """
    rate_limit_definition = RATE_LIMIT_DEFINITIONS[action]
    count_last_interval = rate_limit_definition.count_actions_query(session=session, user_id=user_id)
    for limit, is_hard_limit in [
        (rate_limit_definition.hard_limit, True),
        (rate_limit_definition.warning_limit, False),
    ]:
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
