import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ColumnElement, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class DonationType(enum.Enum):
    one_time = enum.auto()
    monthly = enum.auto()
    yearly = enum.auto()


class InvoiceType(enum.Enum):
    on_platform = enum.auto()
    external_shop = enum.auto()


class DonationInitiation(Base, kw_only=True):
    """
    Whenever someone initiates a donation through the platform
    """

    __tablename__ = "donation_initiations"

    # reserved up front with next_id()
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    amount: Mapped[int] = mapped_column(Integer)
    stripe_checkout_session_id: Mapped[str] = mapped_column(String)

    donation_type: Mapped[DonationType] = mapped_column(Enum(DonationType))
    source: Mapped[str | None] = mapped_column(String, default=None)

    user: Mapped[User] = relationship(init=False, backref="donation_initiations")

    @classmethod
    def next_id(cls) -> ColumnElement[int]:
        """
        Reserve the next value from this table's id sequence, you can call this at the start of the transaction, then
        do something with it, and insert it later as the primary key
        """
        return func.nextval(func.pg_get_serial_sequence(cls.__tablename__, "id"))


class Invoice(Base, kw_only=True):
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

    # null for payments that predate us passing the initiation id to Stripe
    donation_initiation_id: Mapped[int | None] = mapped_column(
        ForeignKey("donation_initiations.id"), index=True, default=None
    )
    donation_type: Mapped[DonationType | None] = mapped_column(Enum(DonationType), default=None)

    user: Mapped[User] = relationship(init=False, backref="invoices")
