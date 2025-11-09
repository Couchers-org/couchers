from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers import urls
from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class InitiatedUpload(Base):
    """
    Started downloads, not necessarily complete yet.
    """

    __tablename__ = "initiated_uploads"

    key: Mapped[str] = mapped_column(String, primary_key=True)

    # timezones should always be UTC
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    initiator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    initiator_user: Mapped["User"] = relationship("User")

    @hybrid_property
    def is_valid(self) -> Any:
        return (self.created <= func.now()) & (self.expiry >= func.now())


class Upload(Base):
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

    creator_user: Mapped["User"] = relationship("User", backref="uploads", foreign_keys="Upload.creator_user_id")

    def _url(self, size: str) -> str:
        return urls.media_url(filename=self.filename, size=size)

    @property
    def thumbnail_url(self) -> str:
        return self._url("thumbnail")

    @property
    def full_url(self) -> str:
        return self._url("full")
