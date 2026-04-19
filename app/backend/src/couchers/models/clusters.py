import enum
from datetime import datetime
from typing import TYPE_CHECKING

from geoalchemy2 import Geometry
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
    func,
    text,
)
from sqlalchemy import select as sa_select
from sqlalchemy.orm import (
    DynamicMapped,
    Mapped,
    column_property,
    deferred,
    mapped_column,
    relationship,
)
from sqlalchemy.sql import expression

from couchers.models.base import Base, Geom, communities_seq
from couchers.models.static import TimezoneArea
from couchers.utils import get_coordinates

if TYPE_CHECKING:
    from couchers.models import Discussion, Event, Thread, Upload, User
    from couchers.models.public_trips import PublicTrip


class NodeType(enum.Enum):
    # Ordinal: lower values are broader geographic areas
    world = 1
    macroregion = 2
    region = 3
    subregion = 4
    locality = 5
    sublocality = 6


class Node(Base, kw_only=True):
    """
    Node, i.e., geographical subdivision of the world

    Administered by the official cluster
    """

    __tablename__ = "nodes"

    id: Mapped[int] = mapped_column(
        BigInteger,
        communities_seq,
        primary_key=True,
        server_default=communities_seq.next_value(),
        init=False,
    )

    node_type: Mapped[NodeType] = mapped_column(Enum(NodeType))

    # name and description come from the official cluster
    parent_node_id: Mapped[int | None] = mapped_column(ForeignKey("nodes.id"), default=None, index=True)
    geom: Mapped[Geom] = deferred(mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False))
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    timezone = column_property(
        sa_select(TimezoneArea.tzid)
        .where(func.ST_Contains(TimezoneArea.geom, func.ST_PointOnSurface(geom)))
        .limit(1)
        .scalar_subquery(),
        deferred=True,
    )

    parent_node: Mapped[Node] = relationship(init=False, back_populates="child_nodes", remote_side="Node.id")
    child_nodes: Mapped[list[Node]] = relationship(init=False)
    child_clusters: Mapped[list[Cluster]] = relationship(
        init=False, back_populates="parent_node", overlaps="official_cluster"
    )
    official_cluster: Mapped[Cluster] = relationship(
        init=False,
        primaryjoin="and_(Node.id == Cluster.parent_node_id, Cluster.is_official_cluster)",
        foreign_keys="[Cluster.parent_node_id]",
        uselist=False,
        viewonly=True,
    )
    public_trips: Mapped[list[PublicTrip]] = relationship(init=False, back_populates="node")


class Cluster(Base, kw_only=True):
    """
    Cluster, administered grouping of content
    """

    __tablename__ = "clusters"

    id: Mapped[int] = mapped_column(
        BigInteger,
        communities_seq,
        primary_key=True,
        server_default=communities_seq.next_value(),
        init=False,
    )
    parent_node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    # short description
    description: Mapped[str] = mapped_column(String)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    is_official_cluster: Mapped[bool] = mapped_column(Boolean, default=False)

    discussions_enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default=expression.true())
    events_enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default=expression.true())

    slug: Mapped[str] = column_property(func.slugify(name))

    official_cluster_for_node: Mapped[Node] = relationship(
        init=False,
        primaryjoin="and_(Cluster.parent_node_id == Node.id, Cluster.is_official_cluster)",
        back_populates="official_cluster",
        uselist=False,
        viewonly=True,
    )

    parent_node: Mapped[Node] = relationship(
        init=False,
        back_populates="child_clusters",
        remote_side="Node.id",
        foreign_keys="Cluster.parent_node_id",
        overlaps="official_cluster",
    )

    nodes: Mapped[list[Cluster]] = relationship(
        init=False, backref="clusters", secondary="node_cluster_associations", viewonly=True
    )
    # all pages
    pages: DynamicMapped[Page] = relationship(
        init=False, backref="clusters", secondary="cluster_page_associations", lazy="dynamic", viewonly=True
    )
    events: Mapped[Event] = relationship(
        init=False, backref="clusters", secondary="cluster_event_associations", viewonly=True
    )
    discussions: Mapped[Discussion] = relationship(
        init=False, backref="clusters", secondary="cluster_discussion_associations", viewonly=True
    )

    # includes also admins
    members: DynamicMapped[User] = relationship(
        init=False,
        lazy="dynamic",
        backref="cluster_memberships",
        secondary="cluster_subscriptions",
        primaryjoin="Cluster.id == ClusterSubscription.cluster_id",
        secondaryjoin="User.id == ClusterSubscription.user_id",
        viewonly=True,
    )

    admins: DynamicMapped[User] = relationship(
        init=False,
        lazy="dynamic",
        backref="cluster_adminships",
        secondary="cluster_subscriptions",
        primaryjoin="Cluster.id == ClusterSubscription.cluster_id",
        secondaryjoin="and_(User.id == ClusterSubscription.user_id, ClusterSubscription.role == 'admin')",
        viewonly=True,
    )

    cluster_subscriptions: Mapped[list[ClusterSubscription]] = relationship(init=False)
    owned_pages: DynamicMapped[Page] = relationship(init=False, lazy="dynamic")
    owned_discussions: DynamicMapped[Discussion] = relationship(init=False, lazy="dynamic")

    main_page: Mapped[Page] = relationship(
        init=False,
        primaryjoin="and_(Cluster.id == Page.owner_cluster_id, Page.type == 'main_page')",
        viewonly=True,
        uselist=False,
    )

    @property
    def is_leaf(self) -> bool:
        """Whether the cluster is a leaf node in the cluster hierarchy."""
        return len(self.parent_node.child_nodes) == 0

    __table_args__ = (
        # Each node can have at most one official cluster
        Index(
            "ix_clusters_owner_parent_node_id_is_official_cluster",
            parent_node_id,
            is_official_cluster,
            unique=True,
            postgresql_where=is_official_cluster,
        ),
        # trigram index on unaccented name
        # note that the function `unaccent` is not immutable so cannot be used in an index, that's why we wrap it
        Index(
            "idx_clusters_name_unaccented_trgm",
            text("immutable_unaccent(name) gin_trgm_ops"),
            postgresql_using="gin",
        ),
    )


class NodeClusterAssociation(Base, kw_only=True):
    """
    NodeClusterAssociation, grouping of nodes
    """

    __tablename__ = "node_cluster_associations"
    __table_args__ = (UniqueConstraint("node_id", "cluster_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id"), index=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id"), index=True)

    node: Mapped[Node] = relationship(init=False, backref="node_cluster_associations")
    cluster: Mapped[Cluster] = relationship(init=False, backref="node_cluster_associations")


class ClusterRole(enum.Enum):
    member = enum.auto()
    admin = enum.auto()


class ClusterSubscription(Base, kw_only=True):
    """
    ClusterSubscription of a user
    """

    __tablename__ = "cluster_subscriptions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id"), index=True)
    role: Mapped[ClusterRole] = mapped_column(Enum(ClusterRole))

    user: Mapped[User] = relationship(init=False, backref="cluster_subscriptions")
    cluster: Mapped[Cluster] = relationship(init=False, back_populates="cluster_subscriptions")

    __table_args__ = (
        UniqueConstraint("user_id", "cluster_id"),
        Index(
            "ix_cluster_subscriptions_members",
            cluster_id,
            user_id,
        ),
        # For fast lookup of nodes this user is an admin of
        Index(
            "ix_cluster_subscriptions_admins",
            user_id,
            cluster_id,
            postgresql_where=(role == ClusterRole.admin),
        ),
    )


class ClusterPageAssociation(Base, kw_only=True):
    """
    pages related to clusters
    """

    __tablename__ = "cluster_page_associations"
    __table_args__ = (UniqueConstraint("page_id", "cluster_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    page_id: Mapped[int] = mapped_column(ForeignKey("pages.id"), index=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id"), index=True)

    page: Mapped[Page] = relationship(init=False, backref="cluster_page_associations")
    cluster: Mapped[Cluster] = relationship(init=False, backref="cluster_page_associations")


class PageType(enum.Enum):
    main_page = enum.auto()
    place = enum.auto()
    guide = enum.auto()


class Page(Base, kw_only=True):
    """
    similar to a wiki page about a community, POI or guide
    """

    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(
        BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value(), init=False
    )

    parent_node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id"), index=True)
    type: Mapped[PageType] = mapped_column(Enum(PageType))
    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    owner_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None, index=True)
    owner_cluster_id: Mapped[int | None] = mapped_column(ForeignKey("clusters.id"), default=None, index=True)

    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id"), unique=True)

    parent_node: Mapped[Node] = relationship(
        init=False, backref="child_pages", remote_side="Node.id", foreign_keys="Page.parent_node_id"
    )

    thread: Mapped[Thread] = relationship(init=False, backref="page", uselist=False)
    creator_user: Mapped[User] = relationship(init=False, backref="created_pages", foreign_keys="Page.creator_user_id")
    owner_user: Mapped[User | None] = relationship(init=False, backref="owned_pages", foreign_keys="Page.owner_user_id")
    owner_cluster: Mapped[Cluster | None] = relationship(
        init=False, back_populates="owned_pages", uselist=False, foreign_keys="Page.owner_cluster_id"
    )

    editors: Mapped[list[User]] = relationship(init=False, secondary="page_versions", viewonly=True)
    versions: Mapped[list[PageVersion]] = relationship(init=False, back_populates="page", order_by="PageVersion.id")

    __table_args__ = (
        # Only one of owner_user and owner_cluster should be set
        CheckConstraint(
            "(owner_user_id IS NULL) <> (owner_cluster_id IS NULL)",
            name="one_owner",
        ),
        # Only clusters can own main pages
        CheckConstraint(
            "NOT (owner_cluster_id IS NULL AND type = 'main_page')",
            name="main_page_owned_by_cluster",
        ),
        # Each cluster can have at most one main page
        Index(
            "ix_pages_owner_cluster_id_type",
            owner_cluster_id,
            type,
            unique=True,
            postgresql_where=(type == PageType.main_page),
        ),
    )

    def __repr__(self) -> str:
        return f"Page({self.id=})"


class PageVersion(Base, kw_only=True):
    """
    version of page content
    """

    __tablename__ = "page_versions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    page_id: Mapped[int] = mapped_column(ForeignKey("pages.id"), index=True)
    editor_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(String)  # CommonMark without images
    photo_key: Mapped[str | None] = mapped_column(ForeignKey("uploads.key"), default=None)
    geom: Mapped[Geom | None] = mapped_column(Geometry(geometry_type="POINT", srid=4326), default=None)
    # the human-readable address
    address: Mapped[str | None] = mapped_column(String, default=None)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    slug: Mapped[str] = column_property(func.slugify(title))

    page: Mapped[Page] = relationship(init=False, back_populates="versions")
    editor_user: Mapped[User] = relationship(init=False, backref="edited_pages")
    photo: Mapped[Upload] = relationship(init=False)

    __table_args__ = (
        # Geom and address must either both be null or both be set
        CheckConstraint(
            "(geom IS NULL) = (address IS NULL)",
            name="geom_iff_address",
        ),
    )

    @property
    def coordinates(self) -> tuple[float, float] | None:
        # returns (lat, lng) or None
        return get_coordinates(self.geom)

    def __repr__(self) -> str:
        return f"PageVersion({self.id=}, {self.page_id=})"
