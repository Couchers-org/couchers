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
from couchers.utils import now


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
    Confirmed a while ago but still not sent: the postcard job kept failing, or a MyPostcard order went unconfirmed.
    """
    return (PostalVerificationAttempt.status == PostalVerificationStatus.in_progress) & (
        PostalVerificationAttempt.address_confirmed_at < now() - POSTCARD_STUCK_AFTER
    )


def alert_postcards_need_review(session: Session, attempts: Sequence[PostalVerificationAttempt], reason: str) -> None:
    """
    Posts to #monitoring so someone sorts these out by hand, since we can't safely retry a MyPostcard order.
    """
    usernames: dict[int, str] = {
        row.id: row.username
        for row in session.execute(
            select(User.id, User.username).where(User.id.in_([attempt.user_id for attempt in attempts]))
        )
    }
    lines = [f"*Postal verification postcards need checking*: {reason}", ""]
    for attempt in attempts:
        username = usernames[attempt.user_id]
        ordered = attempt.postcard_order_started_at
        lines.append(
            f"- Attempt {attempt.id} for <{urls.user_link(username=username)}|{username}>: "
            + (f"order started {ordered:%Y-%m-%d %H:%M} UTC" if ordered else "never got as far as ordering")
        )
    lines += [
        "",
        "For each one, check the MyPostcard dashboard for an order at that time. If it's there, record its order ID "
        "with the editor RecordPostcardOrder action; if not, use ResendPostcard.",
    ]
    send_slack_message(config.SLACK_MONITORING_CHANNEL, "\n".join(lines))
