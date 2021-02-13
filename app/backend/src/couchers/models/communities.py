import enum

from geoalchemy2.types import Geometry
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Sequence,
    String,
    UniqueConstraint,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import backref, column_property, relationship
from sqlalchemy.sql import func

from couchers.utils import get_coordinates


communities_seq = Sequence("communities_seq")


class Node(Base):
    """
    Node, i.e. geographical subdivision of the world

    Administered by the official cluster
    """

    __tablename__ = "nodes"

    id = Column(BigInteger, communities_seq, primary_key=True)

    # name and description come from official cluster
    parent_node_id = Column(ForeignKey("nodes.id"), nullable=True, index=True)
    geom = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    parent_node = relationship("Node", backref="child_nodes", remote_side="Node.id")

    contained_users = relationship(
        "User",
        lazy="dynamic",
        primaryjoin="func.ST_Contains(foreign(Node.geom), User.geom).as_comparison(1, 2)",
        viewonly=True,
        uselist=True,
    )


class Cluster(Base):
    """
    Cluster, administered grouping of content
    """

    __tablename__ = "clusters"
    __table_args__ = (
        CheckConstraint(
            # make sure the parent_node_id and official_cluster_for_node_id match
            "(official_cluster_for_node_id IS NULL) OR (official_cluster_for_node_id = parent_node_id)",
            name="official_cluster_matches_parent_node",
        ),
    )

    id = Column(BigInteger, communities_seq, primary_key=True)
    parent_node_id = Column(ForeignKey("nodes.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    # short description
    description = Column(String, nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    official_cluster_for_node_id = Column(ForeignKey("nodes.id"), nullable=True, unique=True, index=True)

    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)

    slug = column_property(func.slugify(name))

    official_cluster_for_node = relationship(
        "Node",
        backref=backref("official_cluster", uselist=False),
        uselist=False,
        foreign_keys="Cluster.official_cluster_for_node_id",
    )

    parent_node = relationship(
        "Node", backref="child_clusters", remote_side="Node.id", foreign_keys="Cluster.parent_node_id"
    )

    nodes = relationship("Cluster", backref="clusters", secondary="node_cluster_associations")
    # all pages
    pages = relationship("Page", backref="clusters", secondary="cluster_page_associations", lazy="dynamic")
    events = relationship("Event", backref="clusters", secondary="cluster_event_associations")
    discussions = relationship("Discussion", backref="clusters", secondary="cluster_discussion_associations")

    # includes also admins
    members = relationship(
        "User",
        lazy="dynamic",
        backref="cluster_memberships",
        secondary="cluster_subscriptions",
        primaryjoin="Cluster.id == ClusterSubscription.cluster_id",
        secondaryjoin="User.id == ClusterSubscription.user_id",
    )

    admins = relationship(
        "User",
        lazy="dynamic",
        backref="cluster_adminships",
        secondary="cluster_subscriptions",
        primaryjoin="Cluster.id == ClusterSubscription.cluster_id",
        secondaryjoin="and_(User.id == ClusterSubscription.user_id, ClusterSubscription.role == 'admin')",
    )

    thread = relationship("Thread", backref="cluster", uselist=False)


class NodeClusterAssociation(Base):
    """
    NodeClusterAssociation, grouping of nodes
    """

    __tablename__ = "node_cluster_associations"
    __table_args__ = (UniqueConstraint("node_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    node_id = Column(ForeignKey("nodes.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    node = relationship("Node", backref="node_cluster_associations")
    cluster = relationship("Cluster", backref="node_cluster_associations")


class ClusterRole(enum.Enum):
    member = enum.auto()
    admin = enum.auto()


class ClusterSubscription(Base):
    """
    ClusterSubscription of a user
    """

    __tablename__ = "cluster_subscriptions"
    __table_args__ = (UniqueConstraint("user_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)
    role = Column(Enum(ClusterRole), nullable=False)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    left = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="cluster_subscriptions")
    cluster = relationship("Cluster", backref="cluster_subscriptions")

    @hybrid_property
    def is_current(self):
        return (self.joined <= func.now()) & ((not self.left) | (self.left >= func.now()))


class ClusterPageAssociation(Base):
    """
    pages related to clusters
    """

    __tablename__ = "cluster_page_associations"
    __table_args__ = (UniqueConstraint("page_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    page_id = Column(ForeignKey("pages.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    page = relationship("Page", backref="cluster_page_associations")
    cluster = relationship("Cluster", backref="cluster_page_associations")


class PageType(enum.Enum):
    main_page = enum.auto()
    place = enum.auto()
    guide = enum.auto()


class Page(Base):
    """
    similar to a wiki page about a community, POI or guide
    """

    __tablename__ = "pages"
    __table_args__ = (
        # Only one of owner_user and owner_cluster should be set
        CheckConstraint(
            "(owner_user_id IS NULL AND owner_cluster_id IS NOT NULL) OR (owner_user_id IS NOT NULL AND owner_cluster_id IS NULL)",
            name="one_owner",
        ),
        # if the page is a main page, it must be owned by that cluster
        CheckConstraint(
            "(main_page_for_cluster_id IS NULL) OR (owner_cluster_id IS NOT NULL AND main_page_for_cluster_id = owner_cluster_id)",
            name="main_page_owned_by_cluster",
        ),
    )

    id = Column(BigInteger, communities_seq, primary_key=True)

    type = Column(Enum(PageType), nullable=False)
    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    owner_user_id = Column(ForeignKey("users.id"), nullable=True, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=True, index=True)

    main_page_for_cluster_id = Column(ForeignKey("clusters.id"), nullable=True, unique=True, index=True)

    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)

    main_page_for_cluster = relationship(
        "Cluster",
        backref=backref("main_page", uselist=False),
        uselist=False,
        foreign_keys="Page.main_page_for_cluster_id",
    )

    thread = relationship("Thread", backref="page", uselist=False)
    creator_user = relationship("User", backref="created_pages", foreign_keys="Page.creator_user_id")
    owner_user = relationship("User", backref="owned_pages", foreign_keys="Page.owner_user_id")
    owner_cluster = relationship(
        "Cluster", backref=backref("owned_pages", lazy="dynamic"), uselist=False, foreign_keys="Page.owner_cluster_id"
    )

    editors = relationship("User", secondary="page_versions")


class PageVersion(Base):
    """
    version of page content
    """

    __tablename__ = "page_versions"

    id = Column(BigInteger, primary_key=True)

    page_id = Column(ForeignKey("pages.id"), nullable=False, index=True)
    editor_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    # the human-readable address
    address = Column(String, nullable=True)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    slug = column_property(func.slugify(title))

    page = relationship("Page", backref="versions", order_by="PageVersion.id")
    editor_user = relationship("User", backref="edited_pages")

    @property
    def coordinates(self):
        # returns (lat, lng) or None
        if self.geom:
            return get_coordinates(self.geom)
        else:
            return None


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
    A happening
    """

    __tablename__ = "events"

    id = Column(BigInteger, communities_seq, primary_key=True)

    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    address = Column(String, nullable=False)
    photo = Column(String, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    owner_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=False, unique=True, index=True)

    thread = relationship("Thread", backref="event", uselist=False)
    owner_user = relationship("User", backref="owned_events")
    owner_cluster = relationship("Cluster", backref="owned event", uselist=False)

    suscribers = relationship("User", backref="events", secondary="event_subscriptions")


class EventSubscription(Base):
    """
    users subscriptions to events
    """

    __tablename__ = "event_subscriptions"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", backref="event_subscriptions")
    event = relationship("Event", backref="event_subscriptions")


class ClusterDiscussionAssociation(Base):
    """
    discussions related to clusters
    """

    __tablename__ = "cluster_discussion_associations"
    __table_args__ = (UniqueConstraint("discussion_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    discussion_id = Column(ForeignKey("discussions.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    discussion = relationship("Discussion", backref="cluster_discussion_associations")
    cluster = relationship("Cluster", backref="cluster_discussion_associations")


class Discussion(Base):
    """
    forum board
    """

    __tablename__ = "discussions"

    id = Column(BigInteger, communities_seq, primary_key=True)

    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    slug = column_property(func.slugify(title))

    thread = relationship("Thread", backref="discussion", uselist=False)

    subscribers = relationship("User", backref="discussions", secondary="discussion_subscriptions")

    creator_user = relationship("User", backref="created_discussions", foreign_keys="Discussion.creator_user_id")
    owner_cluster = relationship("Cluster", backref=backref("owned_discussions", lazy="dynamic"), uselist=False)


class DiscussionSubscription(Base):
    """
    users subscriptions to discussions
    """

    __tablename__ = "discussion_subscriptions"
    __table_args__ = (UniqueConstraint("discussion_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    discussion_id = Column(ForeignKey("discussions.id"), nullable=False, index=True)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    left = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="discussion_subscriptions")
    discussion = relationship("Discussion", backref="discussion_subscriptions")


class Thread(Base):
    """
    Thread
    """

    __tablename__ = "threads"

    id = Column(BigInteger, primary_key=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)


class Comment(Base):
    """
    Comment
    """

    __tablename__ = "comments"

    id = Column(BigInteger, primary_key=True)

    thread_id = Column(ForeignKey("threads.id"), nullable=False, index=True)
    author_user_id = Column(ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)

    thread = relationship("Thread", backref="comments")


class Reply(Base):
    """
    Reply
    """

    __tablename__ = "replies"

    id = Column(BigInteger, primary_key=True)

    comment_id = Column(ForeignKey("comments.id"), nullable=False, index=True)
    author_user_id = Column(ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)

    comment = relationship("Comment", backref="replies")
