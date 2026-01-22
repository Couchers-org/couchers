import enum
from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, Boolean, Date, DateTime, Enum, Float, ForeignKey, Index, String, func, text
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
from sqlalchemy.sql import expression

from couchers.models.base import Base, Geom
from couchers.utils import date_in_timezone, now

if TYPE_CHECKING:
    from couchers.models.conversations import Conversation
    from couchers.models.moderation import ModerationState
    from couchers.models.public_trips import PublicTrip
    from couchers.models.users import User


class HostRequestStatus(enum.Enum):
    pending = enum.auto()
    accepted = enum.auto()
    rejected = enum.auto()
    confirmed = enum.auto()
    cancelled = enum.auto()


class HostRequestQuality(enum.Enum):
    high_quality = enum.auto()
    okay_quality = enum.auto()
    low_quality = enum.auto()


class HostRequest(Base, kw_only=True):
    """
    A request to stay with a host
    """

    __tablename__ = "host_requests"
    __moderation_author_column__ = "surfer_user_id"

    conversation_id: Mapped[int] = mapped_column("id", ForeignKey("conversations.id"), primary_key=True)
    surfer_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    host_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Unified Moderation System
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)

    hosting_city: Mapped[str] = mapped_column(String)
    hosting_location: Mapped[Geom] = mapped_column(Geometry("POINT", srid=4326))
    hosting_radius: Mapped[float] = mapped_column(Float)

    # TODO: proper timezone handling
    timezone = "Etc/UTC"

    # dates in the timezone above
    from_date: Mapped[date] = mapped_column(Date)
    to_date: Mapped[date] = mapped_column(Date)

    # timezone-aware start and end times of the request, can be compared to now()
    start_time = column_property(date_in_timezone(from_date, timezone))
    end_time = column_property(date_in_timezone(to_date, timezone) + text("interval '1 days'"))
    start_time_to_write_reference = column_property(date_in_timezone(to_date, timezone))
    # notice 1 day for midnight at the *end of the day*, then 14 days to write a ref
    end_time_to_write_reference = column_property(date_in_timezone(to_date, timezone) + text("interval '15 days'"))

    status: Mapped[HostRequestStatus] = mapped_column(Enum(HostRequestStatus))
    is_host_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default=expression.false())
    is_surfer_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default=expression.false())

    host_last_seen_message_id: Mapped[int] = mapped_column(BigInteger, default=0)
    surfer_last_seen_message_id: Mapped[int] = mapped_column(BigInteger, default=0)

    # number of reference reminders sent out
    host_sent_reference_reminders: Mapped[int] = mapped_column(BigInteger, server_default=text("0"), init=False)
    surfer_sent_reference_reminders: Mapped[int] = mapped_column(BigInteger, server_default=text("0"), init=False)
    host_sent_request_reminders: Mapped[int] = mapped_column(BigInteger, server_default=text("0"), init=False)
    last_sent_request_reminder_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), init=False
    )

    # reason why the host/surfer marked that they didn't meet up
    # if null then they haven't marked it such
    host_reason_didnt_meetup: Mapped[str | None] = mapped_column(String, default=None)
    surfer_reason_didnt_meetup: Mapped[str | None] = mapped_column(String, default=None)

    # Optional link to public trip if this request originated from one
    public_trip_id: Mapped[int | None] = mapped_column(ForeignKey("public_trips.id"), index=True, default=None)

    surfer: Mapped[User] = relationship(
        init=False, backref="host_requests_sent", foreign_keys="HostRequest.surfer_user_id"
    )
    host: Mapped[User] = relationship(
        init=False, backref="host_requests_received", foreign_keys="HostRequest.host_user_id"
    )
    conversation: Mapped[Conversation] = relationship(init=False)
    moderation_state: Mapped[ModerationState] = relationship(init=False)
    public_trip: Mapped[PublicTrip | None] = relationship(init=False, backref="host_requests")

    __table_args__ = (
        # allows fast lookup as to whether they didn't meet up
        Index(
            "ix_host_requests_host_didnt_meetup",
            host_reason_didnt_meetup != None,
        ),
        Index(
            "ix_host_requests_surfer_didnt_meetup",
            surfer_reason_didnt_meetup != None,
        ),
        # Used for figuring out who needs a reminder to respond
        Index(
            "ix_host_requests_status_reminder_counts",
            status,
            host_sent_request_reminders,
            last_sent_request_reminder_time,
            from_date,
        ),
    )

    @hybrid_property
    def can_write_reference(self) -> Any:
        return (
            ((self.status == HostRequestStatus.confirmed) | (self.status == HostRequestStatus.accepted))
            & (now() >= self.start_time_to_write_reference)
            & (now() <= self.end_time_to_write_reference)
        )

    @can_write_reference.expression
    def can_write_reference_expr(cls) -> Any:  # noqa: ARG003,D102
        return (
            ((cls.status == HostRequestStatus.confirmed) | (cls.status == HostRequestStatus.accepted))
            & (func.now() >= cls.start_time_to_write_reference)
            & (func.now() <= cls.end_time_to_write_reference)
        )

    def __repr__(self) -> str:
        return f"HostRequest(id={self.conversation_id}, surfer_user_id={self.surfer_user_id}, host_user_id={self.host_user_id}...)"


class HostRequestFeedback(Base, kw_only=True):
    """
    Private feedback from a host about a host request
    """

    __tablename__ = "host_request_feedbacks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    host_request_id: Mapped[int] = mapped_column(ForeignKey("host_requests.id"))

    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    request_quality: Mapped[HostRequestQuality | None] = mapped_column(Enum(HostRequestQuality), default=None)
    decline_reason: Mapped[str | None] = mapped_column(String, default=None)  # plain text

    host_request: Mapped[HostRequest] = relationship(init=False)

    __table_args__ = (
        # Each user can leave at most one friend reference to another user
        Index(
            "ix_unique_host_req_feedback",
            from_user_id,
            to_user_id,
            host_request_id,
            unique=True,
        ),
    )
