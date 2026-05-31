import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, CheckConstraint, Date, DateTime, Enum, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models import Node, User
    from couchers.models.host_requests import HostRequest


class PublicTripStatus(enum.Enum):
    searching_for_host = enum.auto()
    closed = enum.auto()


class PublicTrip(Base, kw_only=True):
    """
    A public trip posted by a traveler looking for a host in a community.
    """

    __tablename__ = "public_trips"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # The traveler posting the trip
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # The community/location (city-level node)
    node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id"), index=True)

    # Trip dates
    from_date: Mapped[date] = mapped_column(Date)
    to_date: Mapped[date] = mapped_column(Date)

    # User's message about their trip
    description: Mapped[str] = mapped_column(String)

    # Current status
    status: Mapped[PublicTripStatus] = mapped_column(
        Enum(PublicTripStatus), default=PublicTripStatus.searching_for_host
    )

    # If true, only users with the same gender as the poster can see this trip
    same_gender_only: Mapped[bool] = mapped_column(Boolean, default=False, server_default=expression.false())

    # Timestamps
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # Relationships
    user: Mapped[User] = relationship(init=False, back_populates="public_trips")
    node: Mapped[Node] = relationship(init=False, back_populates="public_trips")
    host_requests: Mapped[list[HostRequest]] = relationship(init=False, back_populates="public_trip")

    __table_args__ = (
        # Ensure from_date is not after to_date
        CheckConstraint("from_date <= to_date", name="valid_date_range"),
        # Index for querying active trips in a community
        # Using partial index since we mostly query for active trips
        Index(
            "ix_public_trips_node_from_date_active",
            node_id,
            from_date,
            postgresql_where=status == PublicTripStatus.searching_for_host,
        ),
    )
