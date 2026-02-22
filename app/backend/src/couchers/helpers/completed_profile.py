from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from couchers.constants import COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH
from couchers.models import User
from couchers.models.uploads import has_avatar_photo_expression


def has_completed_profile(session: Session, user: User) -> bool:
    """
    Check if a user has completed their profile (has photo + 150 char about_me).
    """
    if not user.profile_gallery_id or not user.about_me or len(user.about_me) < COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH:
        return False
    return bool(session.execute(select(has_avatar_photo_expression(user))).scalar())


def has_completed_profile_expression() -> ColumnElement[bool]:
    """
    Returns a SQL expression for checking if a user has completed their profile.

    Use this in SQLAlchemy queries where you need to filter by profile completeness.

    Usage:
        statement = select(User).where(has_completed_profile_expression())
    """
    return and_(
        User.profile_gallery_id != None,
        has_avatar_photo_expression(User),
        func.coalesce(func.character_length(User.about_me), 0) >= COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH,
    )
