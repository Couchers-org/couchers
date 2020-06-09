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
    hashed_password = Column(Binary, nullable=False)

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
