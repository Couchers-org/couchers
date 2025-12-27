import secrets
from typing import cast

from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from couchers.constants import (
    POSTAL_VERIFICATION_CODE_ALPHABET,
    POSTAL_VERIFICATION_CODE_LENGTH,
)
from couchers.models import User
from couchers.models.postal_verification import PostalVerificationAttempt


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
