from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, String, UniqueConstraint, func, select
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.selectable import Select, Subquery

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


def get_first_gallery_photo_subquery(name: str = "first_photo") -> Subquery:
    """
    Returns a subquery that selects the first photo (by position) from each photo gallery.

    The subquery has columns: gallery_id, upload_key

    Usage:
        first_photo = get_first_gallery_photo_subquery()
        query = select(User).outerjoin(first_photo, first_photo.c.gallery_id == User.profile_gallery_id)
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


def get_first_gallery_photo_query(gallery_id: int) -> Select[tuple[PhotoGalleryItem]]:
    """
    Returns a select statement for the first photo (by position) in a specific gallery.

    Returns a PhotoGalleryItem or None.

    Usage:
        first_photo = session.execute(get_first_gallery_photo_query(gallery_id)).scalar_one_or_none()
    """
    return (
        select(PhotoGalleryItem)
        .where(PhotoGalleryItem.gallery_id == gallery_id)
        .order_by(PhotoGalleryItem.position)
        .limit(1)
    )
