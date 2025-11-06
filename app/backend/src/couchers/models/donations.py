import enum

from sqlalchemy import BigInteger, Column, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from couchers.models import Base


class DonationType(enum.Enum):
    one_time = enum.auto()
    recurring = enum.auto()


class DonationInitiation(Base):
    """
    Whenever someone initiates a donation through the platform
    """

    __tablename__ = "donation_initiations"
    id = Column(BigInteger, primary_key=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    amount = Column(Integer, nullable=False)
    stripe_checkout_session_id = Column(String, nullable=False)

    donation_type = Column(Enum(DonationType), nullable=False)
    source = Column(String, nullable=True)

    user = relationship("User", backref="donation_initiations")


class Invoice(Base):
    """
    Successful donations, both one-off and recurring

    Triggered by `payment_intent.succeeded` webhook
    """

    __tablename__ = "invoices"

    id = Column(BigInteger, primary_key=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    user_id = Column(ForeignKey("users.id"), nullable=False)

    amount = Column(Float, nullable=False)

    stripe_payment_intent_id = Column(String, nullable=False, unique=True)
    stripe_receipt_url = Column(String, nullable=False)

    user = relationship("User", backref="invoices")
