import enum
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from couchers.models import (
    EventOccurrence,
    PageVersion,
    PhotoGallery,
    PhotoGalleryItem,
    get_avatar_photo_subquery,
)


class UploadUseType(enum.Enum):
    # a photo in a user's profile gallery (not the avatar)
    profile_gallery_photo = enum.auto()
    # the first photo in a user's profile gallery, shown as their avatar
    profile_gallery_photo_avatar = enum.auto()
    # the photo on an event occurrence
    event = enum.auto()
    # the photo on a community/group page version
    page = enum.auto()


@dataclass
class UploadUse:
    use_type: UploadUseType
    # whether this use is the one currently displayed: an upload may linger in a superseded page
    # version or a deleted event occurrence, which is still a real reference but no longer shown
    is_current: bool
    # only the identifier relevant to use_type is set, the others are None
    user_id: int | None = None
    event_id: int | None = None
    page_id: int | None = None


def get_upload_uses(session: Session, key: str) -> list[UploadUse]:
    """
    Returns every place a given upload (by key) is used across the platform.

    This is a reverse lookup over all models that hold a foreign key to uploads.key. Whenever a new
    reference to uploads.key is added anywhere, it MUST be handled here (and likely needs a new
    UploadUseType). test_upload_uses.py guards against drift by asserting every foreign key targeting
    uploads.key is covered here.
    """
    uses: list[UploadUse] = []

    # profile galleries: the first photo by position is the user's avatar
    avatar_photo = get_avatar_photo_subquery()
    gallery_rows = session.execute(
        select(PhotoGallery.owner_user_id, avatar_photo.c.upload_key == key)
        .select_from(PhotoGalleryItem)
        .join(PhotoGallery, PhotoGalleryItem.gallery_id == PhotoGallery.id)
        .join(avatar_photo, avatar_photo.c.gallery_id == PhotoGallery.id)
        .where(PhotoGalleryItem.upload_key == key)
    ).all()
    for owner_user_id, is_avatar in gallery_rows:
        uses.append(
            UploadUse(
                use_type=(
                    UploadUseType.profile_gallery_photo_avatar if is_avatar else UploadUseType.profile_gallery_photo
                ),
                is_current=True,
                user_id=owner_user_id,
            )
        )

    # event occurrences: a deleted occurrence's photo is no longer shown. The occurrence id is what the
    # rest of the API exposes as the "event id"
    event_rows = session.execute(
        select(EventOccurrence.id, EventOccurrence.is_deleted).where(EventOccurrence.photo_key == key)
    ).all()
    for occurrence_id, is_deleted in event_rows:
        uses.append(UploadUse(use_type=UploadUseType.event, is_current=not is_deleted, event_id=occurrence_id))

    # page versions: only the latest version of a page is the one currently shown
    latest_version = (
        select(PageVersion.page_id, func.max(PageVersion.id).label("max_id")).group_by(PageVersion.page_id).subquery()
    )
    page_rows = session.execute(
        select(PageVersion.page_id, PageVersion.id == latest_version.c.max_id)
        .join(latest_version, latest_version.c.page_id == PageVersion.page_id)
        .where(PageVersion.photo_key == key)
    ).all()
    for page_id, is_current in page_rows:
        uses.append(UploadUse(use_type=UploadUseType.page, is_current=is_current, page_id=page_id))

    return uses
