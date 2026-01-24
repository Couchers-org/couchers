from sqlalchemy import and_, exists, func, literal, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from couchers.constants import COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH
from couchers.models import PhotoGalleryItem, User


def has_completed_profile(session: Session, user: User) -> bool:
    """
    Check if a user has completed their profile (has photo + 150 char about_me).
    """
    if not user.profile_gallery_id or not user.about_me or len(user.about_me) < COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH:
        return False
    return session.execute(
        select(exists(select(literal(1)).where(PhotoGalleryItem.gallery_id == user.profile_gallery_id)))
    ).scalar()


def has_completed_profile_expression() -> ColumnElement[bool]:
    """
    Returns a SQL expression for checking if a user has completed their profile.

    Use this in SQLAlchemy queries where you need to filter by profile completeness.

    Usage:
        statement = select(User).where(has_completed_profile_expression())
    """
    return and_(
        User.profile_gallery_id != None,
        exists(select(literal(1)).where(PhotoGalleryItem.gallery_id == User.profile_gallery_id)),
        func.coalesce(func.character_length(User.about_me), 0) >= COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH,
    )
