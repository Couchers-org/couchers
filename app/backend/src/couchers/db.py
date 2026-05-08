import functools
import inspect
import logging
import os
from collections.abc import Generator, Sequence
from contextlib import contextmanager
from os import getpid
from threading import get_ident

from alembic import command
from alembic.config import Config as AlembicConfig
from geoalchemy2 import WKBElement
from opentelemetry import trace
from sqlalchemy import Engine, Row, Subquery, create_engine, select, text, true
from sqlalchemy.dialects import registry
from sqlalchemy.orm.session import Session
from sqlalchemy.pool import QueuePool
from sqlalchemy.sql import and_, func, literal, or_

from couchers.config import Config
from couchers.constants import SERVER_THREADS, WORKER_THREADS
from couchers.context import CouchersContext
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    FriendRelationship,
    FriendStatus,
    Geom,
    Node,
    TimezoneArea,
    User,
)
from couchers.sql import where_users_column_visible

# Register psycopg (psycopg3) as the default driver for postgresql:// URLs
# This must happen before any engine is created
registry.register("postgresql", "sqlalchemy.dialects.postgresql.psycopg", "PGDialect_psycopg")

logger = logging.getLogger(__name__)

tracer = trace.get_tracer(__name__)


def apply_migrations() -> None:
    alembic_dir = os.path.dirname(__file__) + "/../.."
    cwd = os.getcwd()
    try:
        os.chdir(alembic_dir)
        alembic_cfg = AlembicConfig("alembic.ini")
        # alembic screws up logging config by default, this tells it not to screw it up if being run at startup like this
        alembic_cfg.set_main_option("dont_mess_up_logging", "False")
        command.upgrade(alembic_cfg, "head")
    finally:
        os.chdir(cwd)


@functools.cache
def _get_base_engine() -> Engine:
    return create_engine(
        Config.current.database_connection_string,
        # checks that the connections in the pool are alive before using them, which avoids the "server closed the
        # connection unexpectedly" errors
        pool_pre_ping=True,
        # one connection per thread
        poolclass=QueuePool,
        # main threads + a few extra in case
        pool_size=SERVER_THREADS + WORKER_THREADS + 12,
    )


@contextmanager
def session_scope() -> Generator[Session]:
    with tracer.start_as_current_span("session_scope") as rollspan:
        with Session(_get_base_engine()) as session:
            session.begin()
            try:
                if logger.isEnabledFor(logging.DEBUG):
                    try:
                        frame = inspect.stack()[2]
                        filename_line = f"{frame.filename}:{frame.lineno}"
                    except Exception as e:
                        filename_line = "{unknown file}"
                    backend_pid = session.execute(text("SELECT pg_backend_pid();")).scalar_one()
                    logger.debug(f"SScope: got {backend_pid=} at {filename_line}")
                    rollspan.set_attribute("db.backend_pid", backend_pid)
                    rollspan.set_attribute("db.filename_line", filename_line)
                rollspan.set_attribute("rpc.thread", get_ident())
                rollspan.set_attribute("rpc.pid", getpid())

                yield session
                session.commit()
            except:
                session.rollback()
                raise
            finally:
                if logger.isEnabledFor(logging.DEBUG):
                    logger.debug(f"SScope: closed {backend_pid=}")


@contextmanager
def worker_repeatable_read_session_scope() -> Generator[Session]:
    """
    This is a separate session scope that is isolated from the main one since otherwise we end up nesting transactions,
    this causes two different connections to be used

    This operates in a `REPEATABLE READ` isolation level so that we can do a `SELECT ... FOR UPDATE SKIP LOCKED` in the
    background worker, effectively using postgres as a queueing system.
    """
    with tracer.start_as_current_span("worker_session_scope") as rollspan:
        with Session(_get_base_engine().execution_options(isolation_level="REPEATABLE READ")) as session:
            session.begin()
            try:
                if logger.isEnabledFor(logging.DEBUG):
                    try:
                        frame = inspect.stack()[2]
                        filename_line = f"{frame.filename}:{frame.lineno}"
                    except Exception as e:
                        filename_line = "{unknown file}"
                    backend_pid = session.execute(text("SELECT pg_backend_pid();")).scalar_one()
                    logger.debug(f"SScope (worker): got {backend_pid=} at {filename_line}")
                    rollspan.set_attribute("db.backend_pid", backend_pid)
                    rollspan.set_attribute("db.filename_line", filename_line)
                rollspan.set_attribute("rpc.thread", get_ident())
                rollspan.set_attribute("rpc.pid", getpid())

                yield session
                session.commit()
            except:
                session.rollback()
                raise
            finally:
                if logger.isEnabledFor(logging.DEBUG):
                    logger.debug(f"SScope (worker): closed {backend_pid=}")


def db_post_fork() -> None:
    """
    Fix post-fork issues with sqlalchemy
    """
    # see https://docs.sqlalchemy.org/en/20/core/pooling.html#using-connection-pools-with-multiprocessing-or-os-fork
    _get_base_engine().dispose(close=False)


def are_friends(session: Session, context: CouchersContext, other_user: int) -> bool:
    query = select(FriendRelationship)
    query = where_users_column_visible(query, context, FriendRelationship.from_user_id)
    query = where_users_column_visible(query, context, FriendRelationship.to_user_id)
    query = query.where(
        or_(
            and_(FriendRelationship.from_user_id == context.user_id, FriendRelationship.to_user_id == other_user),
            and_(FriendRelationship.from_user_id == other_user, FriendRelationship.to_user_id == context.user_id),
        )
    ).where(FriendRelationship.status == FriendStatus.accepted)
    return session.execute(query).scalar_one_or_none() is not None


def get_parent_node_at_location(session: Session, shape: WKBElement) -> Node | None:
    """
    Finds the smallest node containing the shape.

    Shape can be any PostGIS geo object, e.g., output from create_coordinate
    """

    # Find the lowest Node (in the Node tree) that contains the shape. By construction of nodes, the area of a sub-node
    # must always be less than its parent Node, so no need to actually traverse the tree!
    return (
        session.execute(
            select(Node).where(func.ST_Contains(Node.geom, shape)).order_by(func.ST_Area(Node.geom)).limit(1)
        )
        .scalars()
        .one_or_none()
    )


def _get_node_parents_recursive_cte_subquery(node_id: int) -> Subquery:
    parents = (
        select(Node.id, Node.parent_node_id, literal(0).label("level"))
        .where(Node.id == node_id)
        .cte("parents", recursive=True)
    )

    return select(
        parents.union(
            select(Node.id, Node.parent_node_id, (parents.c.level + 1).label("level")).join(
                parents, Node.id == parents.c.parent_node_id
            )
        )
    ).subquery()


def get_node_parents_recursively(session: Session, node_id: int) -> Sequence[Row[tuple[int, int, int, Cluster]]]:
    subquery = _get_node_parents_recursive_cte_subquery(node_id)
    return session.execute(
        select(subquery, Cluster)
        .join(Cluster, Cluster.parent_node_id == subquery.c.id)
        .where(Cluster.is_official_cluster)
        .order_by(subquery.c.level.desc())
    ).all()


def _can_moderate_any_cluster(session: Session, user_id: int, cluster_ids: list[int]) -> bool:
    query = select(
        (
            select(true())
            .select_from(ClusterSubscription)
            .where(ClusterSubscription.role == ClusterRole.admin)
            .where(ClusterSubscription.user_id == user_id)
            .where(ClusterSubscription.cluster_id.in_(cluster_ids))
        ).exists()
    )
    return session.execute(query).scalar_one()


def can_moderate_node(session: Session, user_id: int, node_id: int) -> bool:
    """
    Returns True if the user_id can moderate the given node (i.e., if they are admin of any community that is a parent of the node)
    """
    subquery = _get_node_parents_recursive_cte_subquery(node_id)
    query = select(
        (
            select(true())
            .select_from(ClusterSubscription)
            .where(ClusterSubscription.role == ClusterRole.admin)
            .where(ClusterSubscription.user_id == user_id)
            .join(Cluster, Cluster.id == ClusterSubscription.cluster_id)
            .where(Cluster.is_official_cluster)
            .where(Cluster.parent_node_id == subquery.c.id)
        ).exists()
    )
    return session.execute(query).scalar_one()


def can_moderate_at(session: Session, user_id: int, shape: Geom) -> bool:
    """
    Returns True if the user_id can moderate a given geo-shape (i.e., if the shape is contained in any Node that the user is an admin of)
    """
    query = select(
        (
            select(true())
            .select_from(ClusterSubscription)
            .where(ClusterSubscription.role == ClusterRole.admin)
            .where(ClusterSubscription.user_id == user_id)
            .join(Cluster, Cluster.id == ClusterSubscription.cluster_id)
            .join(Node, and_(Cluster.is_official_cluster, Node.id == Cluster.parent_node_id))
            .where(func.ST_Contains(Node.geom, shape))
        ).exists()
    )
    return session.execute(query).scalar_one()


def is_user_in_node_geography(session: Session, user_id: int, node_id: int) -> bool:
    """
    Returns True if the user's location is geographically contained within the node's boundary.
    This is used to check if a user can leave a community - users cannot leave communities
    that contain their geographic location.
    """
    query = select(
        (
            select(true())
            .select_from(User)
            .join(Node, func.ST_Contains(Node.geom, User.geom))
            .where(User.id == user_id)
            .where(Node.id == node_id)
        ).exists()
    )
    return session.execute(query).scalar_one()


def timezone_at_coordinate(session: Session, geom: WKBElement) -> str | None:
    tzid = session.execute(
        select(TimezoneArea.tzid).where(func.ST_Contains(TimezoneArea.geom, geom))
    ).scalar_one_or_none()
    return tzid
