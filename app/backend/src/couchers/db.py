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
from couchers.models import Cluster, ClusterRole, ClusterSubscription, FriendRelationship, FriendStatus, Node
from couchers.query import CouchersQuery

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
        return create_engine(config.config["DATABASE_CONNECTION_STRING"], poolclass=NullPool, future=True)
    else:
        return create_engine(config.config["DATABASE_CONNECTION_STRING"])


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
    session = Session(get_engine(isolation_level=isolation_level), query_cls=CouchersQuery, future=True)
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
        session.query(FriendRelationship)
        .filter_users_column(context, FriendRelationship.from_user_id)
        .filter_users_column(context, FriendRelationship.to_user_id)
        .filter(
            or_(
                and_(FriendRelationship.from_user_id == context.user_id, FriendRelationship.to_user_id == other_user),
                and_(FriendRelationship.from_user_id == other_user, FriendRelationship.to_user_id == context.user_id),
            )
        )
        .filter(FriendRelationship.status == FriendStatus.accepted)
        .one_or_none()
        is not None
    )


def get_parent_node_at_location(session, shape):
    """
    Finds the smallest node containing the shape.

    Shape can be any PostGIS geo object, e.g. output from create_coordinate
    """

    # Fin the lowest Node (in the Node tree) that contains the shape. By construction of nodes, the area of a sub-node
    # must always be less than its parent Node, so no need to actually traverse the tree!
    return session.query(Node).filter(func.ST_Contains(Node.geom, shape)).order_by(func.ST_Area(Node.geom)).first()


def get_node_parents_recursively(session, node_id):
    """
    Gets the upwards hierarchy of parents, ordered by level, for a given node

    Returns SQLAlchemy rows of (node_id, parent_node_id, level, cluster)
    """
    top = (
        session.query(Node.id, Node.parent_node_id, literal(0).label("level"))
        .filter(Node.id == node_id)
        .cte("parents", recursive=True)
    )
    subquery = session.query(
        top.union(
            session.query(Node.id, Node.parent_node_id, (top.c.level + 1).label("level")).join(
                top, Node.id == top.c.parent_node_id
            )
        )
    ).subquery()
    return (
        session.query(subquery, Cluster)
        .join(Cluster, Cluster.parent_node_id == subquery.c.id)
        .filter(Cluster.is_official_cluster)
        .order_by(subquery.c.level.desc())
        .all()
    )


def _can_moderate_any_cluster(session, user_id, cluster_ids):
    return (
        session.query(ClusterSubscription)
        .filter(ClusterSubscription.role == ClusterRole.admin)
        .filter(ClusterSubscription.user_id == user_id)
        .filter(ClusterSubscription.cluster_id.in_(cluster_ids))
        .count()
        > 0
    )


def can_moderate_at(session, user_id, shape):
    """
    Returns True if the user_id can moderate a given geo-shape (i.e., if the shape is contained in any Node that the user is an admin of)
    """
    cluster_ids = [
        cluster_id
        for (cluster_id,) in session.query(Cluster.id)
        .join(Node, Node.id == Cluster.parent_node_id)
        .filter(Cluster.is_official_cluster)
        .filter(func.ST_Contains(Node.geom, shape))
        .all()
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
    area = session.query(TimezoneArea.tzid).filter(func.ST_Contains(TimezoneArea.geom, geom)).one_or_none()
    if area:
        return area.tzid
    return None
