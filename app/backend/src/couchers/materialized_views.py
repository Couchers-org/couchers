import logging

from google.protobuf import empty_pb2
from sqlalchemy import Index
from sqlalchemy.sql import func
from sqlalchemy.sql import select as sa_select
from sqlalchemy_utils import create_materialized_view, refresh_materialized_view

from couchers.db import session_scope
from couchers.models import Base, ClusterRole, ClusterSubscription, Upload, User

logger = logging.getLogger(__name__)

cluster_subscription_counts_selectable = (
    sa_select(
        ClusterSubscription.cluster_id.label("cluster_id"),
        func.count().label("count"),
    )
    .select_from(ClusterSubscription)
    .outerjoin(User, User.id == ClusterSubscription.user_id)
    .where(User.is_visible)
    .group_by(ClusterSubscription.cluster_id)
)

cluster_subscription_counts = create_materialized_view(
    "cluster_subscription_counts",
    cluster_subscription_counts_selectable,
    Base.metadata,
    [
        Index(
            "uq_cluster_subscription_counts_cluster_id",
            cluster_subscription_counts_selectable.c.cluster_id,
            unique=True,
        )
    ],
)

cluster_admin_counts_selectable = (
    sa_select(
        ClusterSubscription.cluster_id.label("cluster_id"),
        func.count().label("count"),
    )
    .select_from(ClusterSubscription)
    .outerjoin(User, User.id == ClusterSubscription.user_id)
    .where(ClusterSubscription.role == ClusterRole.admin)
    .where(User.is_visible)
    .group_by(ClusterSubscription.cluster_id)
)

cluster_admin_counts = create_materialized_view(
    "cluster_admin_counts",
    cluster_admin_counts_selectable,
    Base.metadata,
    [Index("uq_cluster_admin_counts_cluster_id", cluster_admin_counts_selectable.c.cluster_id, unique=True)],
)

lite_users_selectable = (
    sa_select(
        User.id.label("id"),
        User.username.label("username"),
        User.name.label("name"),
        User.city.label("city"),
        User.age.label("age"),
        func.ST_Y(User.geom).label("lat"),
        func.ST_X(User.geom).label("lng"),
        User.geom_radius.label("radius"),
        User.is_visible.label("is_visible"),
        Upload.filename.label("avatar_filename"),
        User.has_completed_profile.label("completed_profile"),
    )
    .select_from(User)
    .outerjoin(Upload, Upload.key == User.avatar_key)
)

lite_users = create_materialized_view(
    "lite_users",
    lite_users_selectable,
    Base.metadata,
    [Index("uq_lite_users_id", lite_users_selectable.c.id, unique=True)],
)


def refresh_materialized_views(payload: empty_pb2.Empty):
    logger.info("Refreshing materialized views")
    with session_scope() as session:
        refresh_materialized_view(session, "cluster_subscription_counts", concurrently=True)
        refresh_materialized_view(session, "cluster_admin_counts", concurrently=True)


def refresh_materialized_views_rapid(payload: empty_pb2.Empty):
    logger.info("Refreshing materialized views (rapid)")
    with session_scope() as session:
        refresh_materialized_view(session, "lite_users", concurrently=True)
