"""
Builders for public trips and the communities they're posted in, written straight to the database.
"""

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.db import session_scope
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    ModerationObjectType,
    ModerationState,
    ModerationVisibility,
    Node,
    NodeType,
)
from couchers.models.public_trips import PublicTrip, PublicTripStatus
from couchers.utils import create_polygon_lat_lng, to_multi

# 150+ utf-16 code units to satisfy PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16.
VALID_TRIP_DESCRIPTION = (
    "Visiting the area for a week for a music festival. I love meeting new people "
    "and would really appreciate local tips. Happy to help with tasks in exchange."
)


def create_trip_community(
    node_type: NodeType = NodeType.locality, small_community_features_enabled: bool = True
) -> int:
    """Creates a community named "Test community" and returns its node id."""
    # Polygon inside the fake Europe/Helsinki timezone area so node.timezone resolves.
    with session_scope() as session:
        node = Node(
            geom=to_multi(create_polygon_lat_lng([[60, 24], [60, 26], [62, 26], [62, 24], [60, 24]])),
            node_type=node_type,
        )
        session.add(node)
        session.flush()
        cluster = Cluster(
            name="Test community",
            description="Test",
            parent_node_id=node.id,
            is_official_cluster=True,
            small_community_features_enabled=small_community_features_enabled,
        )
        session.add(cluster)
        session.flush()
        return node.id


def add_community_admin(user_id: int, node_id: int) -> None:
    with session_scope() as session:
        cluster_id = session.execute(
            select(Cluster.id).where(Cluster.parent_node_id == node_id).where(Cluster.is_official_cluster)
        ).scalar_one()
        session.add(ClusterSubscription(cluster_id=cluster_id, user_id=user_id, role=ClusterRole.admin))


def add_public_trip(
    session: Session,
    user_id: int,
    from_date: date,
    to_date: date,
    *,
    node_id: int | None = None,
    description: str = "Looking for a host!",
    status: PublicTripStatus | None = None,
    same_gender_only: bool = False,
    visibility: ModerationVisibility = ModerationVisibility.visible,
) -> int:
    """
    Adds a public trip and returns its id.

    Without a node_id, the trip goes in whichever node exists, or in a new bare node if there are none.
    """
    if node_id is None:
        node = session.execute(select(Node).limit(1)).scalar_one_or_none()
        if node is None:
            node = Node(
                geom=to_multi(create_polygon_lat_lng([[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]])),
                node_type=NodeType.locality,
            )
            session.add(node)
            session.flush()
        node_id = node.id
    moderation_state = ModerationState(
        object_type=ModerationObjectType.public_trip,
        object_id=0,  # placeholder, set after PublicTrip flush
        visibility=visibility,
    )
    session.add(moderation_state)
    session.flush()
    trip = PublicTrip(
        user_id=user_id,
        node_id=node_id,
        from_date=from_date,
        to_date=to_date,
        description=description,
        status=status or PublicTripStatus.searching_for_host,
        same_gender_only=same_gender_only,
        moderation_state_id=moderation_state.id,
    )
    session.add(trip)
    session.flush()
    moderation_state.object_id = trip.id
    return trip.id


def create_public_trip(
    user_id: int,
    from_date: date,
    to_date: date,
    *,
    node_id: int | None = None,
    description: str = "Looking for a host!",
    status: PublicTripStatus | None = None,
    same_gender_only: bool = False,
    visibility: ModerationVisibility = ModerationVisibility.visible,
) -> int:
    """add_public_trip in its own transaction."""
    with session_scope() as session:
        return add_public_trip(
            session,
            user_id,
            from_date,
            to_date,
            node_id=node_id,
            description=description,
            status=status,
            same_gender_only=same_gender_only,
            visibility=visibility,
        )
