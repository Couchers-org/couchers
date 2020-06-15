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

    username = Column(String, unique=True)
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
