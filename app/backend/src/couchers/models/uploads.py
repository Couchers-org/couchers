from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, String, UniqueConstraint, exists, func, literal, select
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship
from sqlalchemy.sql.elements import ColumnElement
from sqlalchemy.sql.selectable import Subquery

from couchers import urls
from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class InitiatedUpload(Base, kw_only=True):
    """
    Started downloads, not necessarily complete yet.
    """

    __tablename__ = "initiated_uploads"

    key: Mapped[str] = mapped_column(String, primary_key=True)

    # timezones should always be UTC
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    initiator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    initiator_user: Mapped[User] = relationship(init=False)

    @hybrid_property
    def is_valid(self) -> Any:
        return (self.created <= func.now()) & (self.expiry >= func.now())


class Upload(Base, kw_only=True):
    """
    Completed uploads.

    Uploads are referenced by key from several other models (PhotoGalleryItem, EventOccurrence,
    PageVersion, ...). When adding a new foreign key to uploads.key anywhere, also teach the reverse
    lookup about it in couchers/upload_uses.py so "where is this upload used" stays complete.
    """

    __tablename__ = "uploads"

    key: Mapped[str] = mapped_column(String, primary_key=True)

    filename: Mapped[str] = mapped_column(String)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # photo credit, etc
    credit: Mapped[str | None] = mapped_column(String, default=None)

    creator_user: Mapped[User] = relationship(init=False, backref="uploads", foreign_keys="Upload.creator_user_id")

    def _url(self, size: str) -> str:
        return urls.media_url(filename=self.filename, size=size)

    @property
    def thumbnail_url(self) -> str:
        return self._url("thumbnail")

    @property
    def full_url(self) -> str:
        return self._url("full")


class PhotoGallery(Base, kw_only=True):
    """
    Photo galleries for users or other entities.
    """

    __tablename__ = "photo_galleries"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # For now, galleries are owned by users, but this could be extended
    # in the future for communities, events, etc.
    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    owner_user: Mapped[User] = relationship(init=False, foreign_keys=[owner_user_id], back_populates="galleries")
    photos: Mapped[list[PhotoGalleryItem]] = relationship(
        init=False,
        back_populates="gallery",
        order_by="PhotoGalleryItem.position",
    )


class PhotoGalleryItem(Base, kw_only=True):
    """
    Individual photos within a gallery with ordering and captions.
    """

    __tablename__ = "photo_gallery_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    gallery_id: Mapped[int] = mapped_column(ForeignKey("photo_galleries.id"), index=True)
    upload_key: Mapped[str] = mapped_column(ForeignKey("uploads.key"))

    # Float position for ordering - allows inserting between items without shifting
    position: Mapped[float] = mapped_column(Float)

    caption: Mapped[str | None] = mapped_column(String, default=None)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    gallery: Mapped[PhotoGallery] = relationship(init=False, back_populates="photos")
    upload: Mapped[Upload] = relationship(init=False)

    __table_args__ = (
        # Ensure each upload is only in a gallery once
        UniqueConstraint("gallery_id", "upload_key", name="uix_gallery_upload"),
    )


def get_avatar_photo_subquery(name: str = "avatar_photo") -> Subquery:
    """
    Returns a subquery that selects the first photo (by position) from each photo gallery.

    The subquery has columns: gallery_id, upload_key

    Usage:
        avatar_photo = get_avatar_photo_subquery()
        query = select(User).outerjoin(avatar_photo, avatar_photo.c.gallery_id == User.profile_gallery_id)
    """
    return (
        select(
            PhotoGalleryItem.gallery_id,
            PhotoGalleryItem.upload_key,
        )
        .distinct(PhotoGalleryItem.gallery_id)
        .order_by(PhotoGalleryItem.gallery_id, PhotoGalleryItem.position)
        .subquery(name=name)
    )


def get_avatar_upload(session: Session, user: User) -> Upload | None:
    """
    Returns the Upload for the user's avatar (first photo in their profile gallery), or None.
    """
    return session.execute(
        select(Upload)
        .join(PhotoGalleryItem, PhotoGalleryItem.upload_key == Upload.key)
        .where(PhotoGalleryItem.gallery_id == user.profile_gallery_id)
        .order_by(PhotoGalleryItem.position)
        .limit(1)
    ).scalar_one_or_none()


def has_avatar_photo_expression(user: type[User] | User) -> ColumnElement[bool]:
    """
    Returns an EXISTS expression that checks if a user has at least one photo in their profile gallery.

    Can be used with a User instance or the User class (for SQL expressions).

    Usage:
        # In a query filter
        statement.where(has_avatar_photo_expression(User))

        # With a concrete value
        session.execute(select(has_avatar_photo_expression(user))).scalar()
    """
    return exists(select(literal(1)).where(PhotoGalleryItem.gallery_id == user.profile_gallery_id))
