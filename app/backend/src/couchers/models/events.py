import enum
from datetime import datetime
from typing import TYPE_CHECKING, cast

from geoalchemy2 import Geometry
from psycopg.types.range import TimestamptzRange
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    and_,
    func,
    select,
)
from sqlalchemy.dialects.postgresql import TSTZRANGE, ExcludeConstraint
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import DynamicMapped, Mapped, backref, column_property, mapped_column, relationship
from sqlalchemy.sql import expression
from sqlalchemy.sql.elements import ColumnElement

from couchers.models.base import Base, Geom, communities_seq
from couchers.models.moderation import ModerationObjectType
from couchers.models.static import TimezoneArea
from couchers.utils import get_coordinates

if TYPE_CHECKING:
    from couchers.models import Cluster, Node, Thread, Upload, User
    from couchers.models.moderation import ModerationState


class ClusterEventAssociation(Base, kw_only=True):
    """
    events related to clusters
    """

    __tablename__ = "cluster_event_associations"
    __table_args__ = (UniqueConstraint("event_id", "cluster_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id"), index=True)

    event: Mapped[Event] = relationship(init=False, backref="cluster_event_associations")
    cluster: Mapped[Cluster] = relationship(init=False, backref="cluster_event_associations")


class Event(Base, kw_only=True):
    """
    An event is composed of two parts:

    * An event template (Event)
    * An occurrence (EventOccurrence)

    One-off events will have one of each; repeating events will have one Event,
    multiple EventOccurrences, one for each time the event happens.
    """

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(
        BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value(), init=False
    )
    parent_node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id"), index=True)

    title: Mapped[str] = mapped_column(String)

    slug: Mapped[str] = column_property(func.slugify(title))

    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    owner_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True, default=None)
    owner_cluster_id: Mapped[int | None] = mapped_column(ForeignKey("clusters.id"), index=True, default=None)
    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id"), unique=True)

    parent_node: Mapped[Node] = relationship(
        init=False, backref="child_events", remote_side="Node.id", foreign_keys="Event.parent_node_id"
    )
    thread: Mapped[Thread] = relationship(init=False, backref="event", uselist=False)
    subscribers: DynamicMapped[User] = relationship(
        init=False, backref="subscribed_events", secondary="event_subscriptions", lazy="dynamic", viewonly=True
    )
    organizers: DynamicMapped[User] = relationship(
        init=False, backref="organized_events", secondary="event_organizers", lazy="dynamic", viewonly=True
    )
    creator_user: Mapped[User] = relationship(
        init=False, backref="created_events", foreign_keys="Event.creator_user_id"
    )
    owner_user: Mapped[User | None] = relationship(
        init=False, backref="owned_events", foreign_keys="Event.owner_user_id"
    )
    owner_cluster: Mapped[Cluster | None] = relationship(
        init=False,
        backref=backref("owned_events", lazy="dynamic"),
        uselist=False,
        foreign_keys="Event.owner_cluster_id",
    )
    occurrences: DynamicMapped[EventOccurrence] = relationship(init=False, lazy="dynamic")

    __table_args__ = (
        # Only one of owner_user and owner_cluster should be set
        CheckConstraint(
            "(owner_user_id IS NULL) <> (owner_cluster_id IS NULL)",
            name="one_owner",
        ),
    )


class EventOccurrence(Base, kw_only=True):
    __tablename__ = "event_occurrences"
    __moderation_author_column__ = "creator_user_id"
    __moderation_object_type__ = ModerationObjectType.event_occurrence

    id: Mapped[int] = mapped_column(
        BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value(), init=False
    )
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)

    # the user that created this particular occurrence of a repeating event (same as event.creator_user_id if single event)
    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    content: Mapped[str] = mapped_column(String)  # CommonMark without images
    photo_key: Mapped[str | None] = mapped_column(ForeignKey("uploads.key"), default=None)

    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False, server_default=expression.false())
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default=expression.false())

    # The GPS coordinates of the event location
    geom: Mapped[Geom] = mapped_column(Geometry(geometry_type="POINT", srid=4326))
    # The physical address string. Legacy online events have been migrated to put the link in here.
    address: Mapped[str] = mapped_column(String)

    # IANA timezone identifier of the event. None if unknown.
    timezone: Mapped[str | None] = mapped_column(String, default=None)

    # time during which the event takes place; this is a range type (instead of separate start+end times) which
    # simplifies database constraints, etc
    during: Mapped[TimestamptzRange] = mapped_column(TSTZRANGE)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    last_edited: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    creator_user: Mapped[User] = relationship(
        init=False, backref="created_event_occurrences", foreign_keys="EventOccurrence.creator_user_id"
    )
    event: Mapped[Event] = relationship(
        init=False,
        back_populates="occurrences",
        remote_side="Event.id",
        foreign_keys="EventOccurrence.event_id",
    )

    photo: Mapped[Upload | None] = relationship(init=False)
    attendances: DynamicMapped[EventOccurrenceAttendee] = relationship(
        init=False, back_populates="occurrence", lazy="dynamic"
    )
    community_invite_requests: DynamicMapped[EventCommunityInviteRequest] = relationship(
        init=False, back_populates="occurrence", lazy="dynamic"
    )
    moderation_state: Mapped[ModerationState] = relationship(init=False)

    __table_args__ = (
        # Can't have overlapping occurrences in the same Event
        ExcludeConstraint(("event_id", "="), ("during", "&&"), name="event_occurrences_event_id_during_excl"),
    )

    @property
    def coordinates(self) -> tuple[float, float]:
        # returns (lat, lng) or None
        return get_coordinates(self.geom)

    @hybrid_property
    def start_time(self) -> datetime:
        return cast(datetime, self.during.lower)

    @start_time.inplace.expression
    @classmethod
    def _start_time_expression(cls) -> ColumnElement[datetime]:
        return cast(ColumnElement[datetime], func.lower(cls.during))

    @hybrid_property
    def end_time(self) -> datetime:
        return cast(datetime, self.during.upper)

    @end_time.inplace.expression
    @classmethod
    def _end_time_expression(cls) -> ColumnElement[datetime]:
        return cast(ColumnElement[datetime], func.upper(cls.during))


class EventSubscription(Base, kw_only=True):
    """
    Users' subscriptions to events
    """

    __tablename__ = "event_subscriptions"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    user: Mapped[User] = relationship(init=False)
    event: Mapped[Event] = relationship(init=False)


class EventOrganizer(Base, kw_only=True):
    """
    Organizers for events
    """

    __tablename__ = "event_organizers"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    user: Mapped[User] = relationship(init=False)
    event: Mapped[Event] = relationship(init=False)


class AttendeeStatus(enum.Enum):
    going = enum.auto()


class EventOccurrenceAttendee(Base, kw_only=True):
    """
    Attendees for events
    """

    __tablename__ = "event_occurrence_attendees"
    __table_args__ = (UniqueConstraint("occurrence_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    occurrence_id: Mapped[int] = mapped_column(ForeignKey("event_occurrences.id"), index=True)
    responded: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    attendee_status: Mapped[AttendeeStatus] = mapped_column(Enum(AttendeeStatus))

    user: Mapped[User] = relationship(init=False)
    occurrence: Mapped[EventOccurrence] = relationship(init=False, back_populates="attendances")

    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False, server_default=expression.false())


class EventCommunityInviteRequest(Base, kw_only=True):
    """
    Requests to send out invitation notifications/emails to the community for a given event occurrence
    """

    __tablename__ = "event_community_invite_requests"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    occurrence_id: Mapped[int] = mapped_column(ForeignKey("event_occurrences.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    decided: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    decided_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    approved: Mapped[bool | None] = mapped_column(Boolean, default=None)

    occurrence: Mapped[EventOccurrence] = relationship(init=False, back_populates="community_invite_requests")
    user: Mapped[User] = relationship(init=False, foreign_keys="EventCommunityInviteRequest.user_id")

    __table_args__ = (
        # each user can only request once
        UniqueConstraint("occurrence_id", "user_id"),
        # each event can only have one notification sent out
        Index(
            "ix_event_community_invite_requests_unique",
            occurrence_id,
            unique=True,
            postgresql_where=and_(approved.is_not(None), approved == True),
        ),
        # decided and approved ought to be null simultaneously
        CheckConstraint(
            "((decided IS NULL) AND (decided_by_user_id IS NULL) AND (approved IS NULL)) OR \
             ((decided IS NOT NULL) AND (decided_by_user_id IS NOT NULL) AND (approved IS NOT NULL))",
            name="decided_approved",
        ),
    )
