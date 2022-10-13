import logging

from sqlalchemy.sql import func
from sqlalchemy.sql import select as sa_select
from sqlalchemy.sql import text

from couchers.db import session_scope
from couchers.models import Base, ClusterSubscription, User, ClusterRole
from couchers.views import view
from sqlalchemy import UniqueConstraint

logger = logging.getLogger(__name__)

cluster_subscription_counts = view(
    "cluster_subscription_counts",
    Base.metadata,
    sa_select(
        ClusterSubscription.cluster_id.label("cluster_id"),
        func.count().label("count"),
    )
    .select_from(ClusterSubscription)
    .outerjoin(User, ClusterSubscription.user_id == User.id)
    .where(User.is_visible)
    .group_by(ClusterSubscription.cluster_id),
)

UniqueConstraint(cluster_subscription_counts.c.cluster_id)

cluster_admin_counts = view(
    "cluster_admin_counts",
    Base.metadata,
    sa_select(
        ClusterSubscription.cluster_id.label("cluster_id"),
        func.count().label("count"),
    )
    .select_from(ClusterSubscription)
    .outerjoin(User, ClusterSubscription.user_id == User.id)
    .where(ClusterSubscription.role == ClusterRole.admin)
    .where(User.is_visible)
    .group_by(ClusterSubscription.cluster_id),
)

UniqueConstraint(cluster_admin_counts.c.cluster_id)


def refresh_materialized_views():
    logger.info("Refreshing materialized views")
    with session_scope() as session:
        session.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY cluster_subscription_counts;"))
        session.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY cluster_admin_counts;"))
