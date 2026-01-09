import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class DonationType(enum.Enum):
    one_time = enum.auto()
    recurring = enum.auto()


class InvoiceType(enum.Enum):
    on_platform = enum.auto()
    external_shop = enum.auto()


class DonationInitiation(Base, init=False, kw_only=True):
    """
    Whenever someone initiates a donation through the platform
    """

    __tablename__ = "donation_initiations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    amount: Mapped[int] = mapped_column(Integer)
    stripe_checkout_session_id: Mapped[str] = mapped_column(String)

    donation_type: Mapped[DonationType] = mapped_column(Enum(DonationType))
    source: Mapped[str | None] = mapped_column(String, nullable=True)

    user: Mapped[User] = relationship(init=False, backref="donation_initiations")


class Invoice(Base, init=False, kw_only=True):
    """
    Successful donations, both one-off and recurring

    Triggered by `payment_intent.succeeded` webhook
    """

    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    amount: Mapped[float] = mapped_column(Float)

    stripe_payment_intent_id: Mapped[str] = mapped_column(String, unique=True)
    stripe_receipt_url: Mapped[str] = mapped_column(String)

    invoice_type: Mapped[InvoiceType] = mapped_column(Enum(InvoiceType))

    user: Mapped[User] = relationship(init=False, backref="invoices")
