import enum

from sqlalchemy import BigInteger, Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class ReferenceType(enum.Enum):
    FRIEND = enum.auto()
    SURFED = enum.auto()  # The "from" user have surfed at the "to" user
    HOSTED = enum.auto()  # The "from" user have hosted the "to" user


class Reference(Base):
    """
    Reference from one user to another
    """

    __tablename__ = "references"
    __table_args__ = (UniqueConstraint("from_user_id", "to_user_id", "reference_type"),)

    id = Column(BigInteger, primary_key=True)
    # timezone should always be UTC
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    from_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    to_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    reference_type = Column(Enum(ReferenceType), nullable=False)

    text = Column(String, nullable=True)

    rating = Column(Integer, nullable=False)
    was_safe = Column(Boolean, nullable=False)

    from_user = relationship("User", backref="references_from", foreign_keys="Reference.from_user_id")
    to_user = relationship("User", backref="references_to", foreign_keys="Reference.to_user_id")
