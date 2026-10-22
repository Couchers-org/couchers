import enum
from collections import defaultdict
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers import urls
from couchers.models import (
    Event,
    EventOccurrence,
    Page,
    PageType,
    PageVersion,
    PhotoGallery,
    PhotoGalleryItem,
    User,
    get_avatar_photo_subquery,
)


class UploadUseType(enum.Enum):
    profile_gallery_photo = enum.auto()
    profile_gallery_photo_avatar = enum.auto()
    event = enum.auto()
    page = enum.auto()


@dataclass
class UploadUse:
    use_type: UploadUseType
    # whether this use is the one currently shown (vs. a superseded page version or deleted occurrence)
    is_current: bool
    # only the identifier relevant to use_type is set
    user_id: int | None = None
    event_id: int | None = None
    page_id: int | None = None
    # link to the use (user profile, event, community page); not set for places/guides (no frontend route yet)
    url: str | None = None


def get_upload_uses(session: Session, key: str) -> list[UploadUse]:
    """
    Returns every place a given upload (by key) is used across the platform.

    This is a reverse lookup over all foreign keys to uploads.key. Any new reference to uploads.key
    must be handled here; test_upload_uses.py guards against drift.
    """
    return get_upload_uses_for_keys(session, [key]).get(key, [])


def get_upload_uses_for_keys(session: Session, keys: list[str]) -> dict[str, list[UploadUse]]:
    """
    Batched version of get_upload_uses: maps each given key to its list of uses.
    """
    uses: dict[str, list[UploadUse]] = defaultdict(list)
    if not keys:
        return {}

    # the first gallery photo by position is the user's avatar
    avatar_photo = get_avatar_photo_subquery()
    gallery_rows = session.execute(
        select(
            PhotoGalleryItem.upload_key,
            PhotoGallery.owner_user_id,
            User.username,
            avatar_photo.c.upload_key == PhotoGalleryItem.upload_key,
        )
        .select_from(PhotoGalleryItem)
        .join(PhotoGallery, PhotoGalleryItem.gallery_id == PhotoGallery.id)
        .join(User, User.id == PhotoGallery.owner_user_id)
        .join(avatar_photo, avatar_photo.c.gallery_id == PhotoGallery.id)
        .where(PhotoGalleryItem.upload_key.in_(keys))
    ).all()
    for upload_key, owner_user_id, username, is_avatar in gallery_rows:
        uses[upload_key].append(
            UploadUse(
                use_type=(
                    UploadUseType.profile_gallery_photo_avatar if is_avatar else UploadUseType.profile_gallery_photo
                ),
                is_current=True,
                user_id=owner_user_id,
                url=urls.user_link(username=username),
            )
        )

    # the occurrence id is what the rest of the API exposes as the "event id"
    event_rows = session.execute(
        select(EventOccurrence.photo_key, EventOccurrence.id, EventOccurrence.is_deleted, Event.slug)
        .join(Event, Event.id == EventOccurrence.event_id)
        .where(EventOccurrence.photo_key.in_(keys))
    ).all()
    for photo_key, occurrence_id, is_deleted, slug in event_rows:
        uses[photo_key].append(
            UploadUse(
                use_type=UploadUseType.event,
                is_current=not is_deleted,
                event_id=occurrence_id,
                url=urls.event_link(occurrence_id=occurrence_id, slug=slug),
            )
        )

    # the link points at the page as it stands now, so use the current version's slug
    current_version = (
        select(PageVersion.page_id, PageVersion.id.label("current_id"), PageVersion.slug.label("current_slug"))
        .distinct(PageVersion.page_id)
        .order_by(PageVersion.page_id, PageVersion.id.desc())
        .subquery()
    )
    page_rows = session.execute(
        select(
            PageVersion.photo_key,
            Page.id,
            Page.type,
            Page.parent_node_id,
            current_version.c.current_slug,
            PageVersion.id == current_version.c.current_id,
        )
        .select_from(PageVersion)
        .join(Page, Page.id == PageVersion.page_id)
        .join(current_version, current_version.c.page_id == PageVersion.page_id)
        .where(PageVersion.photo_key.in_(keys))
    ).all()
    for photo_key, page_id, page_type, parent_node_id, current_slug, is_current in page_rows:
        # only community pages have a frontend route; places and guides aren't surfaced yet
        url = (
            urls.community_link(node_id=parent_node_id, slug=current_slug) if page_type == PageType.main_page else None
        )
        uses[photo_key].append(UploadUse(use_type=UploadUseType.page, is_current=is_current, page_id=page_id, url=url))

    return dict(uses)
