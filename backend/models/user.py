from sqlalchemy import (Boolean, Column, Date, Float, ForeignKey, Integer, DateTime,
                        String)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)

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
    share = Column(String, nullable=False)
    countries_visited = Column(String, nullable=False)
    countries_lived = Column(String, nullable=False)



class Reference(Base):
    __tablename__ = "references"

    id = Column(Integer, primary_key=True)
    time = Column(DateTime, nullable=False, server_default=func.now())

    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    text = Column(String, nullable=True)

    rating = Column(Integer, nullable=False)
    was_safe = Column(Boolean, nullable=False)

    from_user = relationship("User", back_populates="references_from", foreign_keys="Reference.from_user_id")
    to_user = relationship("User", back_populates="references_to", foreign_keys="Reference.to_user_id")

User.references_from = relationship("Reference", back_populates="from_user", foreign_keys="Reference.from_user_id")
User.references_to = relationship("Reference", back_populates="to_user", foreign_keys="Reference.to_user_id")
