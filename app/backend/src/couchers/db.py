import functools
import logging
import os
from contextlib import contextmanager

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm.session import Session
from sqlalchemy.pool import NullPool
from sqlalchemy.sql import and_, func, literal, or_

from couchers import config
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    FriendRelationship,
    FriendStatus,
    Node,
    TimezoneArea,
)
from couchers.sql import couchers_select as select

logger = logging.getLogger(__name__)


def apply_migrations():
    alembic_dir = os.path.dirname(__file__) + "/../.."
    cwd = os.getcwd()
    try:
        os.chdir(alembic_dir)
        alembic_cfg = Config("alembic.ini")
        # alembic screws up logging config by default, this tells it not to screw it up if being run at startup like this
        alembic_cfg.set_main_option("dont_mess_up_logging", "False")
        command.upgrade(alembic_cfg, "head")
    finally:
        os.chdir(cwd)


@functools.lru_cache
def _get_base_engine():
    if config.config["IN_TEST"]:
        poolclass = NullPool
    else:
        poolclass = None
    # `future` enables SQLalchemy 2.0 behaviour
    # `pool_pre_ping` checks that the connections in the pool are alive before using them, which avoids the "server
    # closed the connection unexpectedly" errors
    return create_engine(
        config.config["DATABASE_CONNECTION_STRING"],
        future=True,
        pool_pre_ping=True,
        poolclass=poolclass,
        pool_size=50,
    )


def get_engine(isolation_level=None):
    """
    Creates an engine with the given isolation level.
    """
    # creates a shallow copy with the given isolation level
    if not isolation_level:
        return _get_base_engine()
    else:
        return _get_base_engine().execution_options(isolation_level=isolation_level)


@contextmanager
def session_scope(isolation_level=None):
    session = Session(get_engine(isolation_level=isolation_level), future=True)
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()


def are_friends(session, context, other_user):
    return (
        session.execute(
            select(FriendRelationship)
            .where_users_column_visible(context, FriendRelationship.from_user_id)
            .where_users_column_visible(context, FriendRelationship.to_user_id)
            .where(
                or_(
                    and_(
                        FriendRelationship.from_user_id == context.user_id, FriendRelationship.to_user_id == other_user
                    ),
                    and_(
                        FriendRelationship.from_user_id == other_user, FriendRelationship.to_user_id == context.user_id
                    ),
                )
            )
            .where(FriendRelationship.status == FriendStatus.accepted)
        ).scalar_one_or_none()
        is not None
    )


def get_parent_node_at_location(session, shape):
    """
    Finds the smallest node containing the shape.

    Shape can be any PostGIS geo object, e.g. output from create_coordinate
    """

    # Fin the lowest Node (in the Node tree) that contains the shape. By construction of nodes, the area of a sub-node
    # must always be less than its parent Node, so no need to actually traverse the tree!
    return (
        session.execute(select(Node).where(func.ST_Contains(Node.geom, shape)).order_by(func.ST_Area(Node.geom)))
        .scalars()
        .first()
    )


def get_node_parents_recursively(session, node_id):
    """
    Gets the upwards hierarchy of parents, ordered by level, for a given node

    Returns SQLAlchemy rows of (node_id, parent_node_id, level, cluster)
    """
    parents = (
        select(Node.id, Node.parent_node_id, literal(0).label("level"))
        .where(Node.id == node_id)
        .cte("parents", recursive=True)
    )

    subquery = select(
        parents.union(
            select(Node.id, Node.parent_node_id, (parents.c.level + 1).label("level")).join(
                parents, Node.id == parents.c.parent_node_id
            )
        )
    ).subquery()

    return session.execute(
        select(subquery, Cluster)
        .join(Cluster, Cluster.parent_node_id == subquery.c.id)
        .where(Cluster.is_official_cluster)
        .order_by(subquery.c.level.desc())
    ).all()


def _can_moderate_any_cluster(session, user_id, cluster_ids):
    return (
        session.execute(
            select(func.count())
            .select_from(ClusterSubscription)
            .where(ClusterSubscription.role == ClusterRole.admin)
            .where(ClusterSubscription.user_id == user_id)
            .where(ClusterSubscription.cluster_id.in_(cluster_ids))
        ).scalar_one()
        > 0
    )


def can_moderate_at(session, user_id, shape):
    """
    Returns True if the user_id can moderate a given geo-shape (i.e., if the shape is contained in any Node that the user is an admin of)
    """
    cluster_ids = [
        cluster_id
        for (cluster_id,) in session.execute(
            select(Cluster.id)
            .join(Node, Node.id == Cluster.parent_node_id)
            .where(Cluster.is_official_cluster)
            .where(func.ST_Contains(Node.geom, shape))
        ).all()
    ]
    return _can_moderate_any_cluster(session, user_id, cluster_ids)


def can_moderate_node(session, user_id, node_id):
    """
    Returns True if the user_id can moderate the given node (i.e., if they are admin of any community that is a parent of the node)
    """
    return _can_moderate_any_cluster(
        session, user_id, [cluster.id for _, _, _, cluster in get_node_parents_recursively(session, node_id)]
    )


def timezone_at_coordinate(session, geom):
    area = session.execute(
        select(TimezoneArea.tzid).where(func.ST_Contains(TimezoneArea.geom, geom))
    ).scalar_one_or_none()
    if area:
        return area.tzid
    return None
