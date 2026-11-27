import secrets
from collections.abc import Sequence
from typing import cast

from sqlalchemy import ColumnElement, exists, select
from sqlalchemy.orm import Session

from couchers import urls
from couchers.config import config
from couchers.constants import (
    POSTAL_VERIFICATION_CODE_ALPHABET,
    POSTAL_VERIFICATION_CODE_LENGTH,
    POSTCARD_STUCK_AFTER,
)
from couchers.models import User
from couchers.models.postal_verification import PostalVerificationAttempt, PostalVerificationStatus
from couchers.slack import send_slack_message
from couchers.utils import not_none, now


def generate_postal_verification_code() -> str:
    """
    Generates a random 6-character uppercase alphanumeric code.
    Uses a reduced alphabet to avoid confusion (no I, O, 0, 1).
    """
    return "".join(secrets.choice(POSTAL_VERIFICATION_CODE_ALPHABET) for _ in range(POSTAL_VERIFICATION_CODE_LENGTH))


def has_postal_verification(session: Session, user: User) -> bool:
    """
    Check if user has valid postal verification.

    Similar to strong verification, we query the database rather than
    storing a denormalized flag on the user.
    """
    result = session.execute(
        select(
            exists(
                select(PostalVerificationAttempt)
                .where(PostalVerificationAttempt.user_id == user.id)
                .where(PostalVerificationAttempt.is_valid)
            )
        )
    ).scalar()

    return cast(bool, result)


def postcard_is_stuck() -> ColumnElement[bool]:
    """
    Left waiting on the postcard job for too long, or left in sending by a run that never recorded its order.
    """
    cutoff = now() - POSTCARD_STUCK_AFTER
    return (
        (PostalVerificationAttempt.status == PostalVerificationStatus.in_progress)
        & (PostalVerificationAttempt.address_confirmed_at < cutoff)
    ) | (
        (PostalVerificationAttempt.status == PostalVerificationStatus.sending)
        & (PostalVerificationAttempt.postcard_order_started_at < cutoff)
    )


def alert_postcards_need_review(session: Session, attempts: Sequence[PostalVerificationAttempt], reason: str) -> None:
    usernames: dict[int, str] = {
        row.id: row.username
        for row in session.execute(
            select(User.id, User.username).where(User.id.in_([attempt.user_id for attempt in attempts]))
        )
    }
    lines = [f"*Postal verification postcards need checking*: {reason}", ""]
    for attempt in attempts:
        username = usernames[attempt.user_id]
        line = f"- Attempt {attempt.id} for <{urls.user_link(username=username)}|{username}>: "
        if attempt.status == PostalVerificationStatus.sending:
            line += (
                f"ordering started {not_none(attempt.postcard_order_started_at):%Y-%m-%d %H:%M} UTC. Look for an "
                "order from that time on MyPostcard, and record its job ID with the editor RecordPostcardOrder "
                "action if there is one, or use ResendPostcard if there isn't."
            )
        else:
            line += "never ordered, so it can be sent with the editor ResendPostcard action."
        lines.append(line)
    send_slack_message(config.SLACK_MONITORING_CHANNEL, "\n".join(lines))
