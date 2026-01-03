from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers import urls
from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class InitiatedUpload(Base, init=False, kw_only=True):
    """
    Started downloads, not necessarily complete yet.
    """

    __tablename__ = "initiated_uploads"

    key: Mapped[str] = mapped_column(String, primary_key=True)

    # timezones should always be UTC
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    initiator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    initiator_user: Mapped[User] = relationship()

    @hybrid_property
    def is_valid(self) -> Any:
        return (self.created <= func.now()) & (self.expiry >= func.now())


class Upload(Base, init=False, kw_only=True):
    """
    Completed uploads.
    """

    __tablename__ = "uploads"

    key: Mapped[str] = mapped_column(String, primary_key=True)

    filename: Mapped[str] = mapped_column(String)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # photo credit, etc
    credit: Mapped[str | None] = mapped_column(String, nullable=True)

    creator_user: Mapped[User] = relationship(backref="uploads", foreign_keys="Upload.creator_user_id")

    def _url(self, size: str) -> str:
        return urls.media_url(filename=self.filename, size=size)

    @property
    def thumbnail_url(self) -> str:
        return self._url("thumbnail")

    @property
    def full_url(self) -> str:
        return self._url("full")


class PhotoGallery(Base, init=False, kw_only=True):
    """
    Photo galleries for users or other entities.
    """

    __tablename__ = "photo_galleries"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    # For now, galleries are owned by users, but this could be extended
    # in the future for communities, events, etc.
    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    owner_user: Mapped[User] = relationship(foreign_keys=[owner_user_id], back_populates="galleries")
    photos: Mapped[list[PhotoGalleryItem]] = relationship(
        back_populates="gallery",
        order_by="PhotoGalleryItem.position",
    )


class PhotoGalleryItem(Base, init=False, kw_only=True):
    """
    Individual photos within a gallery with ordering and captions.
    """

    __tablename__ = "photo_gallery_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    gallery_id: Mapped[int] = mapped_column(ForeignKey("photo_galleries.id"), index=True, default=None)
    upload_key: Mapped[str] = mapped_column(ForeignKey("uploads.key"), default=None)

    # Float position for ordering - allows inserting between items without shifting
    position: Mapped[float] = mapped_column(Float)

    caption: Mapped[str | None] = mapped_column(String)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    gallery: Mapped[PhotoGallery] = relationship(back_populates="photos")
    upload: Mapped[Upload] = relationship()

    __table_args__ = (
        # Ensure each upload is only in a gallery once
        UniqueConstraint("gallery_id", "upload_key", name="uix_gallery_upload"),
    )
