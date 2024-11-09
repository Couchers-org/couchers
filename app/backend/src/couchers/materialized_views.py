import logging

from google.protobuf import empty_pb2
from sqlalchemy import Index, Integer, event
from sqlalchemy.sql import func, literal, literal_column, union_all
from sqlalchemy.sql import select as sa_select
from sqlalchemy_utils.view import (
    CreateView,
    DropView,
    create_materialized_view,
    create_table_from_selectable,
    refresh_materialized_view,
)

from couchers.db import session_scope
from couchers.models import Base, ClusterRole, ClusterSubscription, Upload, User

logger = logging.getLogger(__name__)


def create_materialized_view_with_different_ddl(
    name, select_selectable, create_selectable, metadata, indexes=None, aliases=None
):
    """
    Copied wholesale from sqlalchemy_utils (3-clause BSD), with minor tweak in {select,create}_selectable

    https://github.com/kvesteri/sqlalchemy-utils/blob/baf53cd1a3e779fc127010543fed53cf4a97fe16/sqlalchemy_utils/view.py#L77-L124
    """
    table = create_table_from_selectable(
        name=name, selectable=select_selectable, indexes=indexes, metadata=None, aliases=aliases
    )

    event.listen(metadata, "after_create", CreateView(name, create_selectable, materialized=True))

    @event.listens_for(metadata, "after_create")
    def create_indexes(target, connection, **kw):
        for idx in table.indexes:
            idx.create(connection)

    event.listen(metadata, "before_drop", DropView(name, materialized=True))
    return table


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


def make_lite_users_selectable(create=False):
    if create:
        # because this is rendered as a select when emitting the CREATE VIEW, using User.geom would be rendered as
        # `ST_AsEWKB(users.geom)` instead of the literal column, the following fixes it
        geom_column = literal_column("users.geom")
    else:
        geom_column = User.geom

    return (
        sa_select(
            User.id.label("id"),
            User.username.label("username"),
            User.name.label("name"),
            User.city.label("city"),
            User.age.label("age"),
            geom_column.label("geom"),
            User.geom_radius.label("radius"),
            User.is_visible.label("is_visible"),
            Upload.filename.label("avatar_filename"),
            User.has_completed_profile.label("has_completed_profile"),
        )
        .select_from(User)
        .outerjoin(Upload, Upload.key == User.avatar_key)
    )


lite_users_selectable_select = make_lite_users_selectable(create=False)
lite_users_selectable_create = make_lite_users_selectable(create=True)

lite_users = create_materialized_view_with_different_ddl(
    "lite_users",
    lite_users_selectable_select,
    lite_users_selectable_create,
    Base.metadata,
    [Index("uq_lite_users_id", lite_users_selectable_create.c.id, unique=True)],
)


def make_clustered_users_selectable(create=False):
    # emits something along the lines of
    # WITH anon_1 AS (
    #   SELECT id,
    #     geom,
    #     ST_ClusterDBSCAN(geom, eps := .15, minpoints := 5) OVER (ORDER BY id) AS cluster_id
    #   FROM users
    #   WHERE geom IS NOT NULL
    # )

    cluster_cte = (
        sa_select(
            User.id,
            User.geom,
            # DBSCAN clustering with epsilon=.15 deg (~17 km), minpoints=5, cluster will be NULL for not in any cluster
            func.ST_ClusterDBSCAN(User.geom, 0.15, 5).over(order_by=User.id).label("cluster_id"),
        )
        .where(User.geom != None)
        .cte("clustered")
    )

    if create:
        centroid_geom = literal_column("ST_Centroid(ST_Collect(clustered.geom))")
        cluster_geom = literal_column("clustered.geom")
    else:
        centroid_geom = func.ST_Centroid(func.ST_Collect(cluster_cte.c.geom))
        cluster_geom = cluster_cte.c.geom

    clustered_users = (
        sa_select(centroid_geom.label("geom"), func.count().label("count"))
        .select_from(cluster_cte)
        .where(cluster_cte.c.cluster_id != None)
        .group_by(cluster_cte.c.cluster_id)
    )

    isolated_users = (
        sa_select(cluster_geom.label("geom"), literal(1, type_=Integer).label("count"))
        .select_from(cluster_cte)
        .where(cluster_cte.c.cluster_id == None)
    )

    return union_all(clustered_users, isolated_users)


clustered_users_selectable_select = make_clustered_users_selectable(create=False)
clustered_users_selectable_create = make_clustered_users_selectable(create=True)

clustered_users = create_materialized_view_with_different_ddl(
    "clustered_users", clustered_users_selectable_select, clustered_users_selectable_create, Base.metadata
)


def refresh_materialized_views(payload: empty_pb2.Empty):
    logger.info("Refreshing materialized views")
    with session_scope() as session:
        refresh_materialized_view(session, "cluster_subscription_counts", concurrently=True)
        refresh_materialized_view(session, "cluster_admin_counts", concurrently=True)
        refresh_materialized_view(session, "clustered_users")


def refresh_materialized_views_rapid(payload: empty_pb2.Empty):
    logger.info("Refreshing materialized views (rapid)")
    with session_scope() as session:
        refresh_materialized_view(session, "lite_users", concurrently=True)
