import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, Float, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from couchers.models.base import Base


class CommunityIssueRule(enum.Enum):
    parent_loop = enum.auto()
    missing_parent = enum.auto()
    official_cluster = enum.auto()
    type_by_level = enum.auto()
    type_not_below_parent = enum.auto()
    duplicate_boundary = enum.auto()
    invalid_boundary = enum.auto()
    outside_parent = enum.auto()
    overlap = enum.auto()
    oversized_city = enum.auto()


class CommunityIssuePriority(enum.Enum):
    high = enum.auto()
    medium = enum.auto()
    low = enum.auto()


class CommunityIssue(Base, kw_only=True):
    """
    A way in which a community breaks one of the rules in couchers.helpers.community_checks

    An issue stays open while every run of the checks finds it, and is resolved by the first run that does not.
    """

    __tablename__ = "community_issues"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    rule: Mapped[CommunityIssueRule] = mapped_column(Enum(CommunityIssueRule))
    priority: Mapped[CommunityIssuePriority] = mapped_column(Enum(CommunityIssuePriority))
    node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id", ondelete="CASCADE"), index=True)
    # the parent, the community it overlaps, or the earlier copy, depending on the rule
    other_node_id: Mapped[int | None] = mapped_column(ForeignKey("nodes.id", ondelete="CASCADE"), default=None)
    area_km2: Mapped[float | None] = mapped_column(Float, default=None)
    share: Mapped[float | None] = mapped_column(Float, default=None)
    details: Mapped[str] = mapped_column(String)
    # the area outside the parent, or the overlap, for drawing on a map
    area_geojson: Mapped[str | None] = mapped_column(String, default=None)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolved: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    __table_args__ = (
        Index(
            "ix_community_issues_open",
            rule,
            node_id,
            func.coalesce(other_node_id, 0),
            unique=True,
            postgresql_where=resolved == None,
        ),
        Index("ix_community_issues_resolved", resolved),
    )


class CommunityCheckRun(Base, kw_only=True):
    __tablename__ = "community_check_runs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    open_issues: Mapped[int] = mapped_column(Integer)
    active_users: Mapped[int] = mapped_column(Integer)
    # users active in the last 90 days whose location is outside every locality
    active_users_outside_localities: Mapped[int] = mapped_column(Integer)
