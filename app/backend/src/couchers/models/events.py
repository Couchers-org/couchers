import enum

from geoalchemy2 import Geometry
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
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
from sqlalchemy.orm import backref, column_property, relationship
from sqlalchemy.sql import expression

from couchers.models.base import Base, communities_seq
from couchers.utils import get_coordinates


class ClusterEventAssociation(Base):
    """
    events related to clusters
    """

    __tablename__ = "cluster_event_associations"
    __table_args__ = (UniqueConstraint("event_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

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

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())
    parent_node_id = Column(ForeignKey("nodes.id"), nullable=False, index=True)

    title = Column(String, nullable=False)

    slug = column_property(func.slugify(title))

    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    owner_user_id = Column(ForeignKey("users.id"), nullable=True, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=True, index=True)
    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)

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

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)

    # the user that created this particular occurrence of a repeating event (same as event.creator_user_id if single event)
    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    content = Column(String, nullable=False)  # CommonMark without images
    photo_key = Column(ForeignKey("uploads.key"), nullable=True)

    is_cancelled = Column(Boolean, nullable=False, default=False, server_default=expression.false())
    is_deleted = Column(Boolean, nullable=False, default=False, server_default=expression.false())

    # a null geom is an online-only event
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    # physical address, iff geom is not null
    address = Column(String, nullable=True)
    # videoconferencing link, etc, must be specified if no geom, otherwise optional
    link = Column(String, nullable=True)

    timezone = "Etc/UTC"

    # time during which the event takes place; this is a range type (instead of separate start+end times) which
    # simplifies database constraints, etc
    during = Column(TSTZRANGE, nullable=False)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_edited = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

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
        ExcludeConstraint(("event_id", "="), ("during", "&&"), name="event_occurrences_event_id_during_excl"),
    )

    @property
    def coordinates(self):
        # returns (lat, lng) or None
        return get_coordinates(self.geom)

    @hybrid_property
    def start_time(self):
        return self.during.lower

    @start_time.expression
    def start_time(cls):
        return func.lower(cls.during)

    @hybrid_property
    def end_time(self):
        return self.during.upper

    @end_time.expression
    def end_time(cls):
        return func.upper(cls.during)


class EventSubscription(Base):
    """
    Users' subscriptions to events
    """

    __tablename__ = "event_subscriptions"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User")
    event = relationship("Event")


class EventOrganizer(Base):
    """
    Organizers for events
    """

    __tablename__ = "event_organizers"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

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

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    occurrence_id = Column(ForeignKey("event_occurrences.id"), nullable=False, index=True)
    responded = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    attendee_status = Column(Enum(AttendeeStatus), nullable=False)

    user = relationship("User")
    occurrence = relationship("EventOccurrence", backref=backref("attendances", lazy="dynamic"))

    reminder_sent = Column(Boolean, nullable=False, default=False, server_default=expression.false())


class EventCommunityInviteRequest(Base):
    """
    Requests to send out invitation notifications/emails to the community for a given event occurrence
    """

    __tablename__ = "event_community_invite_requests"

    id = Column(BigInteger, primary_key=True)

    occurrence_id = Column(ForeignKey("event_occurrences.id"), nullable=False, index=True)
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    decided = Column(DateTime(timezone=True), nullable=True)
    decided_by_user_id = Column(ForeignKey("users.id"), nullable=True)
    approved = Column(Boolean, nullable=True)

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
