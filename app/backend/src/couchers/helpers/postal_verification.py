import secrets

from sqlalchemy.orm import Session

from couchers.constants import (
    POSTAL_VERIFICATION_CODE_ALPHABET,
    POSTAL_VERIFICATION_CODE_LENGTH,
)
from couchers.models import User
from couchers.models.postal_verification import PostalVerificationAttempt
from couchers.sql import couchers_select as select


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
    attempt = session.execute(
        select(PostalVerificationAttempt)
        .where(PostalVerificationAttempt.user_id == user.id)
        .where(PostalVerificationAttempt.is_valid)
        .limit(1)
    ).scalar_one_or_none()
    return attempt is not None
