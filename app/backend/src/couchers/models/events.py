import enum
from datetime import datetime
from typing import Any

from geoalchemy2 import Geometry
from psycopg2.extras import DateTimeTZRange  # type: ignore[import-untyped]
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
)
from sqlalchemy.dialects.postgresql import TSTZRANGE, ExcludeConstraint
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, backref, column_property, mapped_column, relationship
from sqlalchemy.sql import expression

from couchers.models.base import Base, Geom, communities_seq
from couchers.utils import get_coordinates


class ClusterEventAssociation(Base):
    """
    events related to clusters
    """

    __tablename__ = "cluster_event_associations"
    __table_args__ = (UniqueConstraint("event_id", "cluster_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id"), index=True)

    event = relationship("Event", backref="cluster_event_associations")
    cluster = relationship("Cluster", backref="cluster_event_associations")


class Event(Base):
    """
    An event is composed of two parts:

    * An event template (Event)
    * An occurrence (EventOccurrence)

    One-off events will have one of each; repeating events will have one Event,
    multiple EventOccurrences, one for each time the event happens.
    """

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(
        BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value()
    )
    parent_node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id"), index=True)

    title: Mapped[str] = mapped_column(String)

    slug = column_property(func.slugify(title))

    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    owner_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    owner_cluster_id: Mapped[int | None] = mapped_column(ForeignKey("clusters.id"), nullable=True, index=True)
    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id"), unique=True)

    parent_node = relationship(
        "Node", backref="child_events", remote_side="Node.id", foreign_keys="Event.parent_node_id"
    )
    thread = relationship("Thread", backref="event", uselist=False)
    subscribers = relationship(
        "User", backref="subscribed_events", secondary="event_subscriptions", lazy="dynamic", viewonly=True
    )
    organizers = relationship(
        "User", backref="organized_events", secondary="event_organizers", lazy="dynamic", viewonly=True
    )
    creator_user = relationship("User", backref="created_events", foreign_keys="Event.creator_user_id")
    owner_user = relationship("User", backref="owned_events", foreign_keys="Event.owner_user_id")
    owner_cluster = relationship(
        "Cluster",
        backref=backref("owned_events", lazy="dynamic"),
        uselist=False,
        foreign_keys="Event.owner_cluster_id",
    )

    __table_args__ = (
        # Only one of owner_user and owner_cluster should be set
        CheckConstraint(
            "(owner_user_id IS NULL) <> (owner_cluster_id IS NULL)",
            name="one_owner",
        ),
    )


class EventOccurrence(Base):
    __tablename__ = "event_occurrences"

    id: Mapped[int] = mapped_column(
        BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value()
    )
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)

    # the user that created this particular occurrence of a repeating event (same as event.creator_user_id if single event)
    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    content: Mapped[str] = mapped_column(String)  # CommonMark without images
    photo_key: Mapped[str | None] = mapped_column(ForeignKey("uploads.key"), nullable=True)

    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False, server_default=expression.false())
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default=expression.false())

    # a null geom is an online-only event
    geom: Mapped[Geom | None] = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    # physical address, iff geom is not null
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    # videoconferencing link, etc, must be specified if no geom, otherwise optional
    link: Mapped[str | None] = mapped_column(String, nullable=True)

    timezone = "Etc/UTC"

    # time during which the event takes place; this is a range type (instead of separate start+end times) which
    # simplifies database constraints, etc
    during: Mapped["DateTimeTZRange"] = mapped_column(TSTZRANGE)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_edited: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    creator_user = relationship(
        "User", backref="created_event_occurrences", foreign_keys="EventOccurrence.creator_user_id"
    )
    event = relationship(
        "Event",
        backref=backref("occurrences", lazy="dynamic"),
        remote_side="Event.id",
        foreign_keys="EventOccurrence.event_id",
    )

    photo = relationship("Upload")

    __table_args__ = (
        # Geom and address go together
        CheckConstraint(
            # geom and address are either both null or neither of them are null
            "(geom IS NULL) = (address IS NULL)",
            name="geom_iff_address",
        ),
        # Online-only events need a link, note that online events may also have a link
        CheckConstraint(
            # exactly oen of geom or link is non-null
            "(geom IS NULL) <> (link IS NULL)",
            name="link_or_geom",
        ),
        # Can't have overlapping occurrences in the same Event
        ExcludeConstraint(("event_id", "="), ("during", "&&"), name="event_occurrences_event_id_during_excl"),  # type: ignore[no-untyped-call]
    )

    @property
    def coordinates(self) -> tuple[float, float] | None:
        # returns (lat, lng) or None
        return get_coordinates(self.geom)

    @hybrid_property
    def start_time(self) -> Any:
        return self.during.lower

    @start_time.expression
    def start_time(cls) -> Any:  # noqa: ARG003,D102
        return func.lower(cls.during)

    @hybrid_property
    def end_time(self) -> Any:
        return self.during.upper

    @end_time.expression
    def end_time(cls) -> Any:  # noqa: ARG003,D102
        return func.upper(cls.during)


class EventSubscription(Base):
    """
    Users' subscriptions to events
    """

    __tablename__ = "event_subscriptions"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    event = relationship("Event")


class EventOrganizer(Base):
    """
    Organizers for events
    """

    __tablename__ = "event_organizers"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    event = relationship("Event")


class AttendeeStatus(enum.Enum):
    going = enum.auto()
    maybe = enum.auto()


class EventOccurrenceAttendee(Base):
    """
    Attendees for events
    """

    __tablename__ = "event_occurrence_attendees"
    __table_args__ = (UniqueConstraint("occurrence_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    occurrence_id: Mapped[int] = mapped_column(ForeignKey("event_occurrences.id"), index=True)
    responded: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    attendee_status: Mapped[AttendeeStatus] = mapped_column(Enum(AttendeeStatus))

    user = relationship("User")
    occurrence = relationship("EventOccurrence", backref=backref("attendances", lazy="dynamic"))

    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False, server_default=expression.false())


class EventCommunityInviteRequest(Base):
    """
    Requests to send out invitation notifications/emails to the community for a given event occurrence
    """

    __tablename__ = "event_community_invite_requests"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    occurrence_id: Mapped[int] = mapped_column(ForeignKey("event_occurrences.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    decided: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decided_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    occurrence = relationship("EventOccurrence", backref=backref("community_invite_requests", lazy="dynamic"))
    user = relationship("User", foreign_keys="EventCommunityInviteRequest.user_id")

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
