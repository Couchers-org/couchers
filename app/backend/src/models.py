import logging
import re

from sqlalchemy import (Boolean, Column, Date, DateTime, Float, ForeignKey,
                        Integer)
from sqlalchemy import LargeBinary as Binary
from sqlalchemy import String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    """
    Basic user and profile details
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)

    username = Column(String, nullable=False, unique=True)
    email_address = Column(String, nullable=False, unique=True)
    hashed_password = Column(Binary, nullable=True)

    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    verification = Column(Float, nullable=False)
    community_standing = Column(Float, nullable=False)
    gender = Column(String, nullable=False)
    birth_date = Column(Date, nullable=False)
    languages = Column(String, nullable=False)
    occupation = Column(String, nullable=False)
    about_me = Column(String, nullable=False)
    why = Column(String, nullable=False)
    thing = Column(String, nullable=False)
    share = Column(String, nullable=False)
    countries_visited = Column(String, nullable=False)
    countries_lived = Column(String, nullable=False)

# When a user logs in, they can basically input one of three things: user id, username, or email
# These are three non-intersecting sets
# * user_ids are numeric representations in base 10
# * usernames are alphanumeric + underscores, at least 2 chars long, and don't start with a number, and don't start or end with underscore
# * emails are just whatever stack overflow says emails are ;)

def is_valid_user_id(field):
    """
    Checks if it's a string representing a base 10 integer
    """
    return re.match(r"^[1-9][0-9]*$", field) is not None

def is_valid_username(field):
    """
    Checks if it's an alphanumeric + underscore, lowercase string, at least two characters long, and starts with a letter, ends with alphanumeric
    """
    return re.match(r"^[a-z][0-9a-z_]*[a-z0-9]$", field) is not None

def is_valid_email(field):
    """
    From SO
    """
    return re.match(r'^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$', field) is not None

def get_user_by_field(session, field):
    """
    Returns the user based on any of those three
    """
    if is_valid_user_id(field):
        logging.debug(f"Field matched to type user id")
        return session.query(User).filter(User.id == field).one_or_none()
    elif is_valid_username(field):
        logging.debug(f"Field matched to type username")
        return session.query(User).filter(User.username == field).one_or_none()
    elif is_valid_email(field):
        logging.debug(f"Field matched to type email")
        return session.query(User).filter(User.email_address == field).one_or_none()
    else:
        logging.info(f"Field {field=}, didn't match any known types")
        return None


class UserSession(Base):
    """
    Active session on the app, for auth
    """
    __tablename__ = "sessions"
    token = Column(String, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    started = Column(DateTime, nullable=False, server_default=func.now())

    user = relationship("User", backref="sessions")

class Reference(Base):
    """
    Reference from one user to another
    """
    __tablename__ = "references"

    id = Column(Integer, primary_key=True)
    time = Column(DateTime, nullable=False, server_default=func.now())

    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    text = Column(String, nullable=True)

    rating = Column(Integer, nullable=False)
    was_safe = Column(Boolean, nullable=False)

    from_user = relationship("User", backref="references_from", foreign_keys="Reference.from_user_id")
    to_user = relationship("User", backref="references_to", foreign_keys="Reference.to_user_id")
