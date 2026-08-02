from sqlalchemy import and_, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement
from sqlalchemy.sql.selectable import Subquery

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


def has_completed_profile_expression(galleries_with_photos: Subquery | None = None) -> ColumnElement[bool]:
    """
    Returns a SQL expression for checking if a user has completed their profile.

    Use this in SQLAlchemy queries where you need to filter by profile completeness.

    The avatar is checked with a correlated EXISTS, which the planner flattens into a semi-join in a WHERE clause.
    Where it can't do that -- inside an aggregate FILTER clause it stays a subplan and runs once per row -- pass a
    subquery of distinct photo_gallery_items.gallery_id that the statement outer joins on User.profile_gallery_id,
    and the check reads that join instead.

    Usage:
        statement = select(User).where(has_completed_profile_expression())
    """
    return and_(
        User.profile_gallery_id != None,
        has_avatar_photo_expression(User)
        if galleries_with_photos is None
        else galleries_with_photos.c.gallery_id.isnot(None),
        User.about_me_length >= COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH,
    )
