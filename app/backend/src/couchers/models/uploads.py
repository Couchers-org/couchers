from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

from couchers import urls
from couchers.models.base import Base


class InitiatedUpload(Base):
    """
    Started downloads, not necessarily complete yet.
    """

    __tablename__ = "initiated_uploads"

    key = Column(String, primary_key=True)

    # timezones should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    initiator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    initiator_user = relationship("User")

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())


class Upload(Base):
    """
    Completed uploads.
    """

    __tablename__ = "uploads"
    key = Column(String, primary_key=True)

    filename = Column(String, nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # photo credit, etc
    credit = Column(String, nullable=True)

    creator_user = relationship("User", backref="uploads", foreign_keys="Upload.creator_user_id")

    def _url(self, size):
        return urls.media_url(filename=self.filename, size=size)

    @property
    def thumbnail_url(self):
        return self._url("thumbnail")

    @property
    def full_url(self):
        return self._url("full")
