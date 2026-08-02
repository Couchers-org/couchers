from sqlalchemy import and_, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from couchers.constants import COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH
from couchers.models import User
from couchers.models.uploads import PhotoGalleryItem, has_avatar_photo_expression

# Galleries holding at least one photo. Callers passing prejoined_avatar below must outer join this onto their
# statement with galleries_with_photos.c.gallery_id == User.profile_gallery_id.
galleries_with_photos = select(PhotoGalleryItem.gallery_id).distinct().subquery("galleries_with_photos")


def has_completed_profile(session: Session, user: User) -> bool:
    """
    Check if a user has completed their profile (has photo + 150 char about_me).
    """
    if not user.profile_gallery_id or not user.about_me or len(user.about_me) < COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH:
        return False
    return bool(session.execute(select(has_avatar_photo_expression(user))).scalar())


def has_completed_profile_expression(prejoined_avatar: bool = False) -> ColumnElement[bool]:
    """
    Returns a SQL expression for checking if a user has completed their profile.

    Use this in SQLAlchemy queries where you need to filter by profile completeness.

    The avatar check is a correlated EXISTS, which the planner flattens into a semi-join in a WHERE clause. Set
    prejoined_avatar where it can't do that -- inside an aggregate FILTER clause it stays a subplan and runs once
    per row -- and outer join galleries_with_photos into the statement instead.

    Usage:
        statement = select(User).where(has_completed_profile_expression())
    """
    return and_(
        User.profile_gallery_id != None,
        galleries_with_photos.c.gallery_id.isnot(None) if prejoined_avatar else has_avatar_photo_expression(User),
        User.about_me_length >= COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH,
    )
