import logging
import typing
from collections.abc import Sequence
from datetime import timedelta
from typing import Any

from google.protobuf import empty_pb2
from sqlalchemy import CompoundSelect, Connection, Float, Index, Integer, MetaData, Select, Table, event
from sqlalchemy.orm import Mapped
from sqlalchemy.sql import (
    and_,
    case,
    cast,
    func,
    literal,
    literal_column,
    union_all,
)
from sqlalchemy.sql import select as sa_select
from sqlalchemy.sql.functions import percentile_disc
from sqlalchemy_utils.view import (
    CreateView,
    DropView,
    create_materialized_view,
    create_table_from_selectable,
    refresh_materialized_view,
)

from couchers.db import session_scope
from couchers.models import (
    ActivenessProbe,
    ActivenessProbeStatus,
    Base,
    ClusterRole,
    ClusterSubscription,
    Geom,
    HostRequest,
    MatViewBase,
    Message,
    MessageType,
    StrongVerificationAttempt,
    Upload,
    User,
)

logger = logging.getLogger(__name__)


def create_materialized_view_with_different_ddl(
    name: str,
    select_selectable: Select[Any] | CompoundSelect[Any],
    create_selectable: Select[Any] | CompoundSelect[Any],
    metadata: MetaData,
    indexes: Sequence[Index] | None = None,
    aliases: dict[str, str] | None = None,
) -> Table:
    """
    Copied wholesale from sqlalchemy_utils (3-clause BSD), with a minor tweak in {select,create}_selectable

    https://github.com/kvesteri/sqlalchemy-utils/blob/baf53cd1a3e779fc127010543fed53cf4a97fe16/sqlalchemy_utils/view.py#L77-L124
    """
    table = create_table_from_selectable(
        name=name, selectable=select_selectable, indexes=indexes, metadata=None, aliases=aliases
    )

    event.listen(metadata, "after_create", CreateView(name, create_selectable, materialized=True))

    @event.listens_for(metadata, "after_create")
    def create_indexes(target: Any, connection: Connection, **kw: Any) -> None:
        for idx in table.indexes:
            idx.create(connection)

    event.listen(metadata, "before_drop", DropView(name, materialized=True))
    return typing.cast(Table, table)


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
            cluster_subscription_counts_selectable.subquery().c.cluster_id,
            unique=True,
        )
    ],
)


class ClusterSubscriptionCount(MatViewBase):
    __table__ = cluster_subscription_counts

    cluster_id: Mapped[int]
    count: Mapped[int]


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
    [
        Index(
            "uq_cluster_admin_counts_cluster_id",
            cluster_admin_counts_selectable.subquery().c.cluster_id,
            unique=True,
        )
    ],
)


class ClusterAdminCount(MatViewBase):
    __table__ = cluster_admin_counts

    cluster_id: Mapped[int]
    count: Mapped[int]


def make_lite_users_selectable(create: bool = False) -> Select[Any]:
    if create:
        # because this is rendered as a select when emitting the CREATE VIEW, using User.geom would be rendered as
        # `ST_AsEWKB(users.geom)` instead of the literal column, the following fixes it
        geom_column: Any = literal_column("users.geom")
    else:
        geom_column = User.geom

    strong_verification_subquery = (
        sa_select(User.id, literal(True).label("true"))
        .select_from(StrongVerificationAttempt)
        .where(StrongVerificationAttempt.has_strong_verification(User))
        .distinct()
        .subquery(name="sv_subquery")
    )

    # Be sure to modify the LiteUser type if you add/remove columns!
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
            User.has_completed_my_home.label("has_completed_my_home"),
            func.coalesce(strong_verification_subquery.c.true, False).label("has_strong_verification"),
        )
        .select_from(User)
        .outerjoin(Upload, Upload.key == User.avatar_key)
        .outerjoin(strong_verification_subquery, strong_verification_subquery.c.id == User.id)
    )


lite_users_selectable_select = make_lite_users_selectable(create=False)
lite_users_selectable_create = make_lite_users_selectable(create=True)

lite_users_subquery = lite_users_selectable_create.subquery()

lite_users = create_materialized_view_with_different_ddl(
    "lite_users",
    lite_users_selectable_select,
    lite_users_selectable_create,
    Base.metadata,
    [
        Index("uq_lite_users_id", lite_users_subquery.c.id, unique=True),
        Index("uq_lite_users_username", lite_users_subquery.c.username, unique=True),
        Index(
            "ix_lite_users_id_visible",
            lite_users_subquery.c.id,
            postgresql_using="hash",
            postgresql_where=lite_users_subquery.c.is_visible,
        ),
        Index(
            "ix_lite_users_username_visible",
            lite_users_subquery.c.username,
            postgresql_using="hash",
            postgresql_where=lite_users_subquery.c.is_visible,
        ),
    ],
)


class LiteUser(MatViewBase):
    __table__ = lite_users

    # A subset enough to make mypy happy. Taken from "make_lite_users_selectable".
    id: Mapped[int]
    username: Mapped[str]
    name: Mapped[str]
    city: Mapped[str]
    age: Mapped[int]
    geom: Mapped[Geom]
    radius: Mapped[float]
    is_visible: Mapped[bool]
    avatar_filename: Mapped[str]
    has_completed_profile: Mapped[bool]
    has_completed_my_home: Mapped[bool]
    has_strong_verification: Mapped[bool]


def make_clustered_users_selectable(create: bool = False) -> CompoundSelect[Any]:
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
        .where(User.is_visible)
        .cte("clustered")
    )

    if create:
        centroid_geom: Any = literal_column("ST_Centroid(ST_Collect(clustered.geom))")
        cluster_geom: Any = literal_column("clustered.geom")
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


class ClusteredUser(MatViewBase):
    __table__ = clustered_users

    geom: Mapped[Geom]
    count: Mapped[int]


def float_(stmt: Any) -> Any:
    return func.coalesce(cast(stmt, Float), 0.0)


# this subquery gets the time that the request was sent
t = sa_select(Message.conversation_id, Message.time).where(Message.message_type == MessageType.chat_created).subquery()
# this subquery gets the time that the user responded to the request
s = (
    sa_select(Message.conversation_id, Message.author_id, func.min(Message.time).label("time"))
    .group_by(Message.conversation_id, Message.author_id)
    .subquery()
)
all_responses = union_all(
    # host request responses
    sa_select(
        HostRequest.host_user_id.label("user_id"),
        (s.c.time - t.c.time).label("response_time"),
    )
    .join(t, t.c.conversation_id == HostRequest.conversation_id)
    .outerjoin(s, and_(s.c.conversation_id == HostRequest.conversation_id, s.c.author_id == HostRequest.host_user_id)),
    # activeness probes
    sa_select(
        ActivenessProbe.user_id,
        (
            # expired probes have a responded time for when they were marked responded
            case(
                (
                    ActivenessProbe.response != ActivenessProbeStatus.expired,
                    ActivenessProbe.responded - ActivenessProbe.probe_initiated,
                ),
                else_=None,
            )
        ).label("response_time"),
    ),
).subquery()

user_response_rates_selectable = sa_select(
    all_responses.c.user_id.label("user_id"),
    # number of requests received
    func.count().label("requests"),
    # percentage of requests responded to
    (func.count(all_responses.c.response_time) / func.count()).label("response_rate"),
    func.avg(all_responses.c.response_time).label("avg_response_time"),
    # the 33rd percentile response time
    percentile_disc(0.33)
    .within_group(func.coalesce(all_responses.c.response_time, timedelta(days=1000)))
    .label("response_time_33p"),
    # the 66th percentile response time
    percentile_disc(0.66)
    .within_group(func.coalesce(all_responses.c.response_time, timedelta(days=1000)))
    .label("response_time_66p"),
).group_by(all_responses.c.user_id)

user_response_rates = create_materialized_view(
    "user_response_rates",
    user_response_rates_selectable,
    Base.metadata,
    [Index("uq_user_response_rates_id", user_response_rates_selectable.subquery().c.user_id, unique=True)],
)


class UserResponseRate(MatViewBase):
    __table__ = user_response_rates

    user_id: Mapped[int]
    requests: Mapped[int]
    response_rate: Mapped[float]
    avg_response_time: Mapped[float]
    response_time_33p: Mapped[timedelta]
    response_time_66p: Mapped[timedelta]


def refresh_materialized_views(payload: empty_pb2.Empty) -> None:
    logger.info("Refreshing materialized views")
    with session_scope() as session:
        refresh_materialized_view(session, "cluster_subscription_counts", concurrently=True)
        refresh_materialized_view(session, "cluster_admin_counts", concurrently=True)
        refresh_materialized_view(session, "clustered_users")
        refresh_materialized_view(session, "user_response_rates", concurrently=True)


def refresh_materialized_views_rapid(payload: empty_pb2.Empty) -> None:
    logger.info("Refreshing materialized views (rapid)")
    with session_scope() as session:
        refresh_materialized_view(session, "lite_users", concurrently=True)
