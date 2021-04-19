import functools
import logging
import os
import re
from contextlib import contextmanager
from datetime import time, timedelta

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.orm.session import Session
from sqlalchemy.pool import NullPool
from sqlalchemy.sql import and_, func, literal, or_

from couchers import config
from couchers.crypto import urlsafe_secure_token
from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    FriendRelationship,
    FriendStatus,
    LoginToken,
    Node,
    PasswordResetToken,
    SignupToken,
    User,
)
from couchers.utils import now
from pb import api_pb2

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


@functools.cache
def _get_base_engine():
    if config.config["IN_TEST"]:
        return create_engine(config.config["DATABASE_CONNECTION_STRING"], poolclass=NullPool)
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
    session = Session(get_engine(isolation_level=isolation_level))
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()


# When a user logs in, they can basically input one of three things: user id, username, or email
# These are three non-intersecting sets
# * user_ids are numeric representations in base 10
# * usernames are alphanumeric + underscores, at least 2 chars long, and don't start with a number, and don't start or end with underscore
# * emails are just whatever stack overflow says emails are ;)


def is_valid_user_id(field):
    """
    Checks if it's a string representing a base 10 integer not starting with 0
    """
    return re.match(r"[1-9][0-9]*$", field) is not None


def is_valid_username(field):
    """
    Checks if it's an alphanumeric + underscore, lowercase string, at least
    two characters long, and starts with a letter, ends with alphanumeric
    """
    return re.match(r"[a-z][0-9a-z_]*[a-z0-9]$", field) is not None


def is_valid_name(field):
    """
    Checks if it has at least one non-whitespace character
    """
    return re.match(r"\S+", field) is not None


def is_valid_email(field):
    """
    From SO
    """
    return (
        re.match(
            r'(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$',
            field,
        )
        is not None
    )


def get_user_by_field(session, field):
    """
    Returns the user based on any of those three
    """
    if is_valid_user_id(field):
        logger.debug(f"Field matched to type user id")
        return session.query(User).filter(User.id == field).one_or_none()
    elif is_valid_username(field):
        logger.debug(f"Field matched to type username")
        return session.query(User).filter(User.username == field).one_or_none()
    elif is_valid_email(field):
        logger.debug(f"Field matched to type email")
        return session.query(User).filter(User.email == field).one_or_none()
    else:
        logger.debug(f"Field {field=}, didn't match any known types")
        return None


def new_signup_token(session, email, hours=2):
    """
    Make a signup token that's valid for `hours` hours

    Returns token and expiry text
    """
    token = urlsafe_secure_token()
    signup_token = SignupToken(token=token, email=email, expiry=now() + timedelta(hours=hours))
    session.add(signup_token)
    session.commit()
    return signup_token, f"{hours} hours"


def new_login_token(session, user, hours=2):
    """
    Make a login token that's valid for `hours` hours

    Returns token and expiry text
    """
    token = urlsafe_secure_token()
    login_token = LoginToken(token=token, user=user, expiry=now() + timedelta(hours=hours))
    session.add(login_token)
    session.commit()
    return login_token, f"{hours} hours"


def new_password_reset_token(session, user, hours=2):
    """
    Make a password reset token that's valid for `hours` hours

    Returns token and expiry text
    """
    token = urlsafe_secure_token()
    password_reset_token = PasswordResetToken(token=token, user=user, expiry=now() + timedelta(hours=hours))
    session.add(password_reset_token)
    session.commit()
    return password_reset_token, f"{hours} hours"


def set_email_change_token(session, user, hours=2):
    """
    Make a new email change token that's valid for `hours` hours for this user

    Note: does not call session.commit()

    Returns token and expiry text
    """
    token = urlsafe_secure_token()
    user.new_email_token = token
    user.new_email_token_created = now()
    user.new_email_token_expiry = now() + timedelta(hours=hours)
    return token, f"{hours} hours"


def are_friends(session, user1_id, user2_id):
    return (
        session.query(FriendRelationship)
        .filter(
            or_(
                and_(FriendRelationship.from_user_id == user1_id, FriendRelationship.to_user_id == user2_id),
                and_(FriendRelationship.from_user_id == user2_id, FriendRelationship.to_user_id == user1_id),
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
