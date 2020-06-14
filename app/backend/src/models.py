import datetime
import logging
import re

from crypto import urlsafe_secure_token
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

    username = Column(String, nullable=True, unique=True)
    email = Column(String, nullable=False, unique=True)
    hashed_password = Column(Binary, nullable=True)

    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    verification = Column(Float, nullable=True)
    community_standing = Column(Float, nullable=True)
    gender = Column(String, nullable=False)
    birth_date = Column(Date, nullable=False)
    languages = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    about_me = Column(String, nullable=True)
    why = Column(String, nullable=True)
    thing = Column(String, nullable=True)
    share = Column(String, nullable=True)
    countries_visited = Column(String, nullable=True)
    countries_lived = Column(String, nullable=True)

    def __repr__(self):
        return f"User(id={self.id}, email={self.email}, username={self.username})"

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
        return session.query(User).filter(User.email == field).one_or_none()
    else:
        logging.info(f"Field {field=}, didn't match any known types")
        return None

class SignupToken(Base):
    """
    A signup token allows the user to verify their email and continue signing up.
    """
    __tablename__ = "signup_tokens"
    token = Column(String, primary_key=True)

    email = Column(String, nullable=False)

    created = Column(DateTime, nullable=False, server_default=func.now())
    expiry = Column(DateTime, nullable=False)

    def __repr__(self):
        return f"SignupToken(token={self.token}, email={self.email}, created={self.created}, expiry={self.expiry})"

def new_signup_token(session, email, hours=2):
    """
    Make a signup token that's valid for `hours` hours

    Returns token and expiry text
    """
    token = urlsafe_secure_token()
    signup_token = SignupToken(token=token, email=email, expiry=datetime.datetime.utcnow() + datetime.timedelta(hours=hours))
    session.add(signup_token)
    session.commit()
    return signup_token, f"{hours} hours"

class LoginToken(Base):
    """
    A login token sent in an email to a user, allows them to sign in between the times defined by created and expiry
    """
    __tablename__ = "login_tokens"
    token = Column(String, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created = Column(DateTime, nullable=False, server_default=func.now())
    expiry = Column(DateTime, nullable=False)

    user = relationship("User", backref="login_tokens")

    def __repr__(self):
        return f"LoginToken(token={self.token}, user={self.user}, created={self.created}, expiry={self.expiry})"

def new_login_token(session, user, hours=2):
    """
    Make a login token that's valid for `hours` hours

    Returns token and expiry text
    """
    token = urlsafe_secure_token()
    login_token = LoginToken(token=token, user=user, expiry=datetime.datetime.utcnow() + datetime.timedelta(hours=hours))
    session.add(login_token)
    session.commit()
    return login_token, f"{hours} hours"

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
