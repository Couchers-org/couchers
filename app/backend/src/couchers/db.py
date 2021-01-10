import datetime
import functools
import logging
import os
import re
import threading
from contextlib import contextmanager

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.orm.session import Session
from sqlalchemy.pool import NullPool
from sqlalchemy.sql import and_, or_

from couchers import config
from couchers.crypto import urlsafe_secure_token
from couchers.models import FriendRelationship, FriendStatus, LoginToken, PasswordResetToken, SignupToken, User
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


# @functools.cache
def _get_base_engine():
    if config.config["IN_TEST"]:
        return create_engine(config.config["DATABASE_CONNECTION_STRING"], poolclass=NullPool)
    else:
        return create_engine(config.config["DATABASE_CONNECTION_STRING"])


# @functools.cache
def get_engine(isolation_level=None):
    """
    Creates an engine with the given isolation level.

    Do not change isolation_level unless you know what you're doing!
    """
    # creates a shallow copy with the given isolation level
    if not isolation_level:
        return _get_base_engine()
    else:
        return _get_base_engine().execution_options(isolation_level=isolation_level)


# @functools.cache
def _sessionmaker(isolation_level=None):
    return sessionmaker(bind=get_engine(isolation_level=isolation_level))


def _scoped_session(isolation_level=None):
    return scoped_session(_sessionmaker(isolation_level=isolation_level))


@contextmanager
def session_scope(isolation_level=None):
    Session = _scoped_session()
    session = Session()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()
        Session.remove()


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


def is_valid_color(color):
    return re.match(r"#[0-9a-fA-F]{6}$", color) is not None


def is_valid_date(date):
    """
    Checks if it is a date-only string in the format "YYYY-MM-DD"
    """
    try:
        datetime.date.fromisoformat(date)
    except ValueError:
        return False
    return True


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
    signup_token = SignupToken(token=token, email=email, expiry=now() + datetime.timedelta(hours=hours))
    session.add(signup_token)
    session.commit()
    return signup_token, f"{hours} hours"


def new_login_token(session, user, hours=2):
    """
    Make a login token that's valid for `hours` hours

    Returns token and expiry text
    """
    token = urlsafe_secure_token()
    login_token = LoginToken(token=token, user=user, expiry=now() + datetime.timedelta(hours=hours))
    session.add(login_token)
    session.commit()
    return login_token, f"{hours} hours"


def new_password_reset_token(session, user, hours=2):
    """
    Make a password reset token that's valid for `hours` hours

    Returns token and expiry text
    """
    token = urlsafe_secure_token()
    password_reset_token = PasswordResetToken(token=token, user=user, expiry=now() + datetime.timedelta(hours=hours))
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
    user.new_email_token_expiry = now() + datetime.timedelta(hours=hours)
    return token, f"{hours} hours"


def get_friends_status(session, user1_id, user2_id):
    if user1_id == user2_id:
        return api_pb2.User.FriendshipStatus.NA
    else:
        current_friend_relationship = (
            session.query(FriendRelationship)
            .filter(
                or_(
                    and_(FriendRelationship.from_user_id == user1_id, FriendRelationship.to_user_id == user2_id),
                    and_(FriendRelationship.from_user_id == user2_id, FriendRelationship.to_user_id == user1_id),
                )
            )
            .filter(
                or_(
                    FriendRelationship.status == FriendStatus.accepted,
                    FriendRelationship.status == FriendStatus.pending,
                )
            )
            .one_or_none()
        )

        if not current_friend_relationship:
            return api_pb2.User.FriendshipStatus.NOT_FRIENDS
        else:
            if current_friend_relationship.status == FriendStatus.accepted:
                return api_pb2.User.FriendshipStatus.FRIENDS
            else:
                return api_pb2.User.FriendshipStatus.PENDING
