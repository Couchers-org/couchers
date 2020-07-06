import enum
from datetime import date
from calendar import monthrange
from math import floor

from sqlalchemy import (Boolean, Column, Date, DateTime, Enum, Float,
                        ForeignKey, Integer)
from sqlalchemy import LargeBinary as Binary
from sqlalchemy import String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class PhoneStatus(enum.Enum):
    # unverified
    unverified = 1
    # verified
    verified = 2


class User(Base):
    """
    Basic user and profile details
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)

    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    # stored in libsodium hash format, can be null for email login
    hashed_password = Column(Binary, nullable=True)
    # phone number
    # TODO: should it be unique?
    phone = Column(String, nullable=True, unique=True)
    phone_status = Column(Enum(PhoneStatus), nullable=True)

    joined = Column(DateTime, nullable=False, server_default=func.now())
    last_active = Column(DateTime, nullable=False, server_default=func.now())

    # display name
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    birthdate = Column(Date, nullable=False)

    # name as on official docs for verification, etc. not needed until verification
    full_name = Column(String, nullable=True)

    # verification score
    verification = Column(Float, nullable=True)
    # community standing score
    community_standing = Column(Float, nullable=True)

    occupation = Column(String, nullable=True)
    about_me = Column(String, nullable=True)
    about_place = Column(String, nullable=True)
    # profile color
    color = Column(String, nullable=False, default="#643073")
    # TODO: array types once we go postgres
    languages = Column(String, nullable=True)
    countries_visited = Column(String, nullable=True)
    countries_lived = Column(String, nullable=True)

    # TODO: hosting fields

    @property
    def age(self):
        max_day = monthrange(date.today().year, self.birthdate.month)[1]
        age = date.today().year - self.birthdate.year
        #in case of leap-day babies, make sure the date is valid for this year
        safe_birthdate = self.birthdate
        if (self.birthdate.day > max_day):
            safe_birthdate = safe_birthdate.replace(day = max_day)
        if date.today() < safe_birthdate.replace(year=date.today().year):
            age -= 1
        return age

    @property
    def display_joined(self):
        # TODO: cruden a bit
        return self.joined

    @property
    def display_last_active(self):
        # TODO(aapeli): return as crude (e.g. up to 12 hour accuracy) timestamp
        return self.last_active

    def __repr__(self):
        return f"User(id={self.id}, email={self.email}, username={self.username})"


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
