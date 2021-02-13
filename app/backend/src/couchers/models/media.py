from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class InitiatedUpload(Base):
    """
    Started downloads, not necessarily complete yet.

    For now we only have avatar images, so it's specific to that.
    """

    __tablename__ = "initiated_uploads"

    key = Column(String, primary_key=True)

    # timezones should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    user = relationship("User")

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())
