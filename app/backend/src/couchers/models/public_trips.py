import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, Enum, ForeignKey, Index, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models import Node, User
    from couchers.models.host_requests import HostRequest


class PublicTripStatus(enum.Enum):
    active = enum.auto()
    found_host = enum.auto()
    cancelled = enum.auto()


class PublicTripOutcome(enum.Enum):
    # Found a host through this public trip feature
    found_host_via_public_trip = enum.auto()
    # Found a host through another means (e.g., direct search)
    found_host_other = enum.auto()
    # User cancelled the trip
    trip_cancelled = enum.auto()
    # Trip expired with no responses
    no_responses = enum.auto()


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
    status: Mapped[PublicTripStatus] = mapped_column(Enum(PublicTripStatus), default=PublicTripStatus.active)

    # Outcome (set when trip ends)
    outcome: Mapped[PublicTripOutcome | None] = mapped_column(Enum(PublicTripOutcome), default=None)

    # Metrics
    profile_click_count: Mapped[int] = mapped_column(BigInteger, default=0, server_default=text("0"))
    first_response_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

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
            postgresql_where=status == PublicTripStatus.active,
        ),
    )
