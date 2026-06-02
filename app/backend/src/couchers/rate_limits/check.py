import logging
from collections.abc import Sequence
from typing import Any

from sqlalchemy import RowMapping, exists, select
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.models import RateLimitAction, RateLimitViolation
from couchers.rate_limits.definitions import RATE_LIMIT_DEFINITIONS, RATE_LIMIT_INTERVAL
from couchers.tasks import send_rate_limit_violation_report_email
from couchers.utils import now

logger = logging.getLogger(__name__)

RATE_LIMIT_OVERRIDES_FLAG = "rate_limit_overrides"


def _get_user_events_in_past_time_interval(
    session: Session, user_id: int
) -> dict[RateLimitAction, Sequence[RowMapping]]:
    """Get all relevant events for the user in the last rate limit interval for the mod email."""
    return {
        action: RATE_LIMIT_DEFINITIONS[action].mod_email_information_query(session, user_id)
        for action in RateLimitAction
    }


def _save_rate_limit_violation(
    session: Session, user_id: int, action: RateLimitAction, is_hard_limit: bool
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
    session: Session, user_id: int, action: RateLimitAction, is_hard_limit: bool
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


def _coerce_int_limit(value: Any, fallback: int) -> int:
    # Reject bools explicitly: bool is a subclass of int, so `True` would otherwise pass through as 1
    # and silently set a hard limit of 1.
    if isinstance(value, bool) or not isinstance(value, int):
        return fallback
    return int(value)


def _resolve_limits(context: CouchersContext, action: RateLimitAction) -> tuple[int, int]:
    """Resolve (warning_limit, hard_limit) for this user, applying any per-user override from the
    `rate_limit_overrides` object flag. Schema: `{<action.name>: {warning_limit?: int, hard_limit?: int}}`."""
    definition = RATE_LIMIT_DEFINITIONS[action]
    overrides: dict[str, Any] = context.get_object_value(RATE_LIMIT_OVERRIDES_FLAG, {})
    action_override = overrides.get(action.name) if isinstance(overrides, dict) else None
    if not isinstance(action_override, dict):
        return definition.warning_limit, definition.hard_limit
    return (
        _coerce_int_limit(action_override.get("warning_limit"), definition.warning_limit),
        _coerce_int_limit(action_override.get("hard_limit"), definition.hard_limit),
    )


def process_rate_limits_and_check_abort(context: CouchersContext, session: Session, action: RateLimitAction) -> bool:
    """
    Check if the user has reached a rate limit. Notify the moderation team in a separate background job if so.

    Returns True if the user has reached a hard rate limit.
    """
    user_id = context.user_id
    warning_limit, hard_limit = _resolve_limits(context, action)
    count_last_interval = RATE_LIMIT_DEFINITIONS[action].count_actions_query(session, user_id)
    for limit, is_hard_limit in [
        (hard_limit, True),
        (warning_limit, False),
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
