from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    BigInteger,
    DateTime,
    Float,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, MappedAsDataclass, mapped_column, relationship

from couchers import urls
from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class InitiatedUpload(MappedAsDataclass, Base, kw_only=True):
    """
    Started downloads, not necessarily complete yet.
    """

    __tablename__ = "initiated_uploads"

    key: Mapped[str] = mapped_column(String, primary_key=True)

    # timezones should always be UTC
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    initiator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    initiator_user: Mapped[User] = relationship("User", init=False)

    @hybrid_property
    def is_valid(self) -> Any:
        return (self.created <= func.now()) & (self.expiry >= func.now())


class Upload(MappedAsDataclass, Base, kw_only=True):
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

    creator_user: Mapped[User] = relationship(
        "User", backref="uploads", foreign_keys="Upload.creator_user_id", init=False
    )

    def _url(self, size: str) -> str:
        return urls.media_url(filename=self.filename, size=size)

    @property
    def thumbnail_url(self) -> str:
        return self._url("thumbnail")

    @property
    def full_url(self) -> str:
        return self._url("full")


class PhotoGallery(MappedAsDataclass, Base, kw_only=True):
    """
    Photo galleries for users or other entities.
    """

    __tablename__ = "photo_galleries"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # For now, galleries are owned by users, but this could be extended
    # in the future for communities, events, etc.
    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    owner_user: Mapped[User] = relationship(
        "User", foreign_keys=[owner_user_id], back_populates="galleries", init=False
    )
    photos: Mapped[list[PhotoGalleryItem]] = relationship(
        "PhotoGalleryItem",
        back_populates="gallery",
        order_by="PhotoGalleryItem.position",
        default_factory=list,
    )


class PhotoGalleryItem(MappedAsDataclass, Base, kw_only=True):
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

    gallery: Mapped[PhotoGallery] = relationship("PhotoGallery", back_populates="photos", init=False)
    upload: Mapped[Upload] = relationship("Upload", init=False)

    __table_args__ = (
        # Ensure each upload is only in a gallery once
        UniqueConstraint("gallery_id", "upload_key", name="uix_gallery_upload"),
    )
