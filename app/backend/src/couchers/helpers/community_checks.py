"""
Checks that communities fit together: that the parent links form a tree with the right types, and that each boundary is
valid, lies inside its parent's and does not overlap its neighbours much.
"""

import logging
from collections import Counter, defaultdict
from collections.abc import Iterable, Iterator, Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import ColumnElement, and_, case, exists, func, select
from sqlalchemy.orm import Session

from couchers.models import (
    Cluster,
    CommunityCheckRun,
    CommunityIssue,
    CommunityIssuePriority,
    Node,
    NodeType,
    User,
)

logger = logging.getLogger(__name__)

CITY_TYPES = {NodeType.locality, NodeType.sublocality}
MAX_CITY_KM2 = 10_000
ACTIVE_WINDOW = timedelta(days=90)

RULES = (
    "parent_loop",
    "missing_parent",
    "official_cluster",
    "type_by_level",
    "type_not_below_parent",
    "duplicate_boundary",
    "invalid_boundary",
    "outside_parent",
    "overlap",
    "oversized_city",
)

# Casting to geography fails on the 180°-long edges of the world's and continents' boundaries, so areas are measured in
# an equal-area projection instead. Some boundaries reach a little past ±180°, and without +over the projection wraps
# those points round to the other side of the world, so that a small island group measures as wide as the globe.
EQUAL_AREA = "+proj=cea +lat_ts=30 +ellps=WGS84 +units=m +over"


def _km2(geom: Any) -> ColumnElement[Any]:
    return func.ST_Area(func.ST_Transform(geom, EQUAL_AREA)) / 1e6


def _area_geojson(geom: Any) -> ColumnElement[str]:
    return func.ST_AsGeoJSON(func.ST_SimplifyPreserveTopology(func.ST_CollectionExtract(geom, 3), 0.005), 5)


@dataclass(frozen=True)
class Community:
    id: int
    parent_id: int | None
    type: NodeType
    name: str
    clusters: int
    invalid_reason: str | None
    geom_hash: str
    area_km2: float

    @property
    def label(self) -> str:
        return f"{self.name} ({self.id})"


@dataclass(frozen=True)
class Issue:
    rule: str
    community: Community
    other: Community | None = None
    area_km2: float | None = None
    share: float | None = None
    details: str = ""
    area_geojson: str | None = None

    @property
    def priority(self) -> CommunityIssuePriority:
        if self.rule == "oversized_city":
            return CommunityIssuePriority.low
        if self.rule == "outside_parent":
            if self.community.type == NodeType.region:
                return CommunityIssuePriority.low
            return CommunityIssuePriority.medium
        if self.rule == "overlap":
            assert self.other is not None
            types = (self.community.type, self.other.type)
            cities = [t in CITY_TYPES for t in types]
            if all(cities):
                return CommunityIssuePriority.high
            if any(cities) or NodeType.subregion in types:
                return CommunityIssuePriority.medium
            return CommunityIssuePriority.low
        return CommunityIssuePriority.high

    @property
    def key(self) -> tuple[str, int, int | None]:
        return (self.rule, self.community.id, self.other.id if self.other else None)


def load_communities(session: Session) -> dict[int, Community]:
    official = (
        select(
            Cluster.parent_node_id.label("node_id"),
            func.count().label("clusters"),
            func.min(Cluster.name).label("name"),
        )
        .where(Cluster.is_official_cluster)
        .group_by(Cluster.parent_node_id)
        .subquery()
    )
    rows = session.execute(
        select(
            Node.id,
            Node.parent_node_id,
            Node.node_type,
            func.coalesce(official.c.clusters, 0).label("clusters"),
            official.c.name,
            case((~func.ST_IsValid(Node.geom), func.ST_IsValidReason(Node.geom))).label("invalid_reason"),
            func.md5(func.ST_AsBinary(Node.geom)).label("geom_hash"),
            _km2(Node.geom).label("area_km2"),
        )
        .outerjoin(official, official.c.node_id == Node.id)
        .order_by(Node.id)
    ).all()
    return {
        row.id: Community(
            id=row.id,
            parent_id=row.parent_node_id,
            type=row.node_type,
            name=row.name or f"Community {row.id}",
            clusters=row.clusters,
            invalid_reason=row.invalid_reason,
            geom_hash=row.geom_hash,
            area_km2=row.area_km2,
        )
        for row in rows
    }


def _simplified_boundaries() -> Any:
    # Boundaries simplified to about 100 m, which makes the comparisons much cheaper for large countries without moving
    # anything near the thresholds.
    return (
        select(
            Node.id,
            Node.parent_node_id,
            Node.node_type,
            func.ST_CollectionExtract(func.ST_MakeValid(func.ST_SimplifyPreserveTopology(Node.geom, 0.001)), 3).label(
                "geom"
            ),
        )
        .cte("simplified")
        .prefix_with("MATERIALIZED")
    )


def walk_up(communities: dict[int, Community], start: int) -> tuple[list[int], list[int] | None]:
    """The chain of parents from start upwards, and the loop it ends in, if it ends in one."""
    path = [start]
    position = {start: 0}
    parent = communities[start].parent_id
    while parent is not None and parent in communities:
        if parent in position:
            return path, path[position[parent] :]
        position[parent] = len(path)
        path.append(parent)
        parent = communities[parent].parent_id
    return path, None


def structural_issues(communities: dict[int, Community], loops: Iterable[Sequence[int]]) -> Iterator[Issue]:
    for loop in loops:
        chain = " → ".join(communities[i].label for i in [*loop, loop[0]])
        for i in loop:
            yield Issue("parent_loop", communities[i], details=f"The parent links go round in a loop: {chain}.")

    worlds = [c for c in communities.values() if c.parent_id is None and c.type == NodeType.world]
    by_hash = defaultdict(list)
    for c in communities.values():
        by_hash[c.geom_hash].append(c)

        if c.clusters != 1:
            yield Issue("official_cluster", c, details=f"It has {c.clusters} official clusters.")
        if c.invalid_reason:
            yield Issue("invalid_boundary", c, details=f"PostGIS says: {c.invalid_reason}.")
        if c.type in CITY_TYPES and c.area_km2 > MAX_CITY_KM2:
            yield Issue("oversized_city", c, area_km2=c.area_km2, details=f"It covers {c.area_km2:,.0f} km².")

        if c.parent_id is None:
            if c.type != NodeType.world:
                yield Issue("missing_parent", c, details=f"It is a {c.type.name} with no parent.")
            elif c is not worlds[0]:
                yield Issue("missing_parent", c, worlds[0], details=f"{worlds[0].label} is also a world.")
            continue
        parent = communities[c.parent_id]
        if parent.type in (NodeType.world, NodeType.macroregion):
            expected = NodeType.macroregion if parent.type == NodeType.world else NodeType.region
            if c.type != expected:
                yield Issue(
                    "type_by_level",
                    c,
                    parent,
                    details=(
                        f"It is a {c.type.name} directly under the {parent.type.name} {parent.name}, so it should be "
                        f"a {expected.name}."
                    ),
                )
        elif c.type.value <= parent.type.value:
            yield Issue(
                "type_not_below_parent",
                c,
                parent,
                details=f"It is a {c.type.name}, and its parent {parent.name} is a {parent.type.name}.",
            )

    for same in by_hash.values():
        for c in same[1:]:
            yield Issue(
                "duplicate_boundary",
                c,
                same[0],
                details=f"Its boundary is identical to that of {same[0].label}.",
            )


def outside_parent_issues(session: Session, communities: dict[int, Community]) -> Iterator[Issue]:
    simplified = _simplified_boundaries()
    child = simplified.alias("child")
    parent = simplified.alias("parent")
    pairs = (
        select(
            child.c.id,
            parent.c.id.label("parent_id"),
            child.c.geom,
            func.ST_Difference(child.c.geom, parent.c.geom).label("outside"),
        )
        .select_from(child)
        .join(parent, parent.c.id == child.c.parent_node_id)
        .where(parent.c.node_type != NodeType.world)
        .cte("pairs")
        .prefix_with("MATERIALIZED")
    )
    rows = session.execute(
        select(
            pairs.c.id,
            pairs.c.parent_id,
            _km2(pairs.c.geom).label("area_km2"),
            _km2(pairs.c.outside).label("outside_km2"),
            _area_geojson(pairs.c.outside).label("area_geojson"),
        )
    ).all()
    for row in rows:
        if not row.area_km2:
            continue
        share = row.outside_km2 / row.area_km2
        if row.outside_km2 > 100 or share > 0.01:
            c = communities[row.id]
            p = communities[row.parent_id]
            yield Issue(
                "outside_parent",
                c,
                p,
                row.outside_km2,
                share,
                details=f"{row.outside_km2:,.0f} km² of it, or {share:.1%}, lies outside {p.name}.",
                area_geojson=row.area_geojson,
            )


def overlap_issues(
    session: Session, communities: dict[int, Community], ancestors: dict[int, set[int]]
) -> Iterator[Issue]:
    simplified = _simplified_boundaries()
    a = simplified.alias("a")
    b = simplified.alias("b")
    broad = [NodeType.world, NodeType.macroregion]
    pairs = (
        select(
            a.c.id.label("a_id"),
            b.c.id.label("b_id"),
            a.c.geom.label("a_geom"),
            b.c.geom.label("b_geom"),
            func.ST_Intersection(a.c.geom, b.c.geom).label("overlap"),
        )
        .select_from(a)
        .join(b, and_(a.c.id < b.c.id, func.ST_Intersects(a.c.geom, b.c.geom)))
        .where(a.c.node_type.not_in(broad))
        .where(b.c.node_type.not_in(broad))
        .where(a.c.parent_node_id.is_distinct_from(b.c.id))
        .where(b.c.parent_node_id.is_distinct_from(a.c.id))
        .cte("pairs")
        .prefix_with("MATERIALIZED")
    )
    rows = session.execute(
        select(
            pairs.c.a_id,
            pairs.c.b_id,
            _km2(pairs.c.a_geom).label("a_km2"),
            _km2(pairs.c.b_geom).label("b_km2"),
            _km2(pairs.c.overlap).label("overlap_km2"),
            _area_geojson(pairs.c.overlap).label("area_geojson"),
        )
    ).all()
    for row in rows:
        ca, cb = communities[row.a_id], communities[row.b_id]
        if ca.id in ancestors[cb.id] or cb.id in ancestors[ca.id] or ca.geom_hash == cb.geom_hash:
            continue
        smaller_km2 = min(row.a_km2, row.b_km2)
        if not smaller_km2:
            continue
        share = row.overlap_km2 / smaller_km2
        if share > 0.01 and (share > 0.05 or {ca.type, cb.type} & CITY_TYPES):
            small, big = (ca, cb) if row.a_km2 <= row.b_km2 else (cb, ca)
            yield Issue(
                "overlap",
                small,
                big,
                row.overlap_km2,
                share,
                details=f"{row.overlap_km2:,.0f} km² of it, or {share:.1%}, overlaps {big.name}.",
                area_geojson=row.area_geojson,
            )


def find_issues(session: Session) -> list[Issue]:
    communities = load_communities(session)
    ancestors = {}
    loops = {}
    for community_id in communities:
        path, loop = walk_up(communities, community_id)
        ancestors[community_id] = set(path[1:])
        if loop:
            loops[frozenset(loop)] = loop

    issues = [
        *structural_issues(communities, loops.values()),
        *outside_parent_issues(session, communities),
        *overlap_issues(session, communities, ancestors),
    ]
    return list({issue.key: issue for issue in issues}.values())


@dataclass(frozen=True)
class ActiveUsers:
    total: int
    outside_localities: int


def count_active_users(session: Session, now: datetime) -> ActiveUsers:
    in_a_locality = exists().where(Node.node_type == NodeType.locality, func.ST_Contains(Node.geom, User.geom))
    row = session.execute(
        select(func.count().label("total"), func.count().filter(~in_a_locality).label("outside_localities"))
        .select_from(User)
        .where(User.last_active > now - ACTIVE_WINDOW)
        .where(User.deleted_at.is_(None))
        .where(User.banned_at.is_(None))
    ).one()
    return ActiveUsers(total=row.total, outside_localities=row.outside_localities)


def record(session: Session, issues: Iterable[Issue], active_users: ActiveUsers, now: datetime) -> None:
    open_rows = {
        (row.rule, row.node_id, row.other_node_id): row
        for row in session.execute(select(CommunityIssue).where(CommunityIssue.resolved.is_(None))).scalars()
    }
    count = 0
    for issue in issues:
        count += 1
        row = open_rows.pop(issue.key, None)
        if row is None:
            row = CommunityIssue(
                rule=issue.rule,
                priority=issue.priority,
                node_id=issue.community.id,
                other_node_id=issue.other.id if issue.other else None,
                details=issue.details,
                first_seen=now,
                last_seen=now,
            )
            session.add(row)
        row.priority = issue.priority
        row.area_km2 = issue.area_km2
        row.share = issue.share
        row.details = issue.details
        row.area_geojson = issue.area_geojson
        row.last_seen = now
    for row in open_rows.values():
        row.resolved = now
    session.add(
        CommunityCheckRun(
            open_issues=count,
            active_users=active_users.total,
            active_users_outside_localities=active_users.outside_localities,
        )
    )


def run_community_checks(session: Session, now: datetime) -> None:
    issues = find_issues(session)
    active_users = count_active_users(session, now)
    record(session, issues, active_users, now)
    logger.info(f"Community checks found {len(issues)} issues: {dict(Counter(issue.rule for issue in issues))}")
