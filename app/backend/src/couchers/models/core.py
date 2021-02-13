import enum
from calendar import monthrange
from datetime import date

from geoalchemy2.types import Geometry
from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, Enum, Float, ForeignKey, Integer
from sqlalchemy import LargeBinary as Binary
from sqlalchemy import MetaData, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from sqlalchemy.orm.session import Session
from sqlalchemy.sql import func

from couchers.config import config
from couchers.utils import get_coordinates

meta = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }
)

Base = declarative_base(metadata=meta)


class PhoneStatus(enum.Enum):
    unverified = enum.auto()
    verified = enum.auto()


class HostingStatus(enum.Enum):
    can_host = enum.auto()
    maybe = enum.auto()
    difficult = enum.auto()
    cant_host = enum.auto()


class SmokingLocation(enum.Enum):
    yes = enum.auto()
    window = enum.auto()
    outside = enum.auto()
    no = enum.auto()


class User(Base):
    """
    Basic user and profile details
    """

    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)

    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    # stored in libsodium hash format, can be null for email login
    hashed_password = Column(Binary, nullable=True)
    # phone number
    # TODO: should it be unique?
    phone = Column(String, nullable=True, unique=True)
    phone_status = Column(Enum(PhoneStatus), nullable=True)

    # timezones should always be UTC
    ## location
    # point describing their location. EPSG4326 is the SRS (spatial ref system, = way to describe a point on earth) used
    # by GPS, it has the WGS84 geoid with lat/lon
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    # their display location (displayed to other users), in meters
    geom_radius = Column(Float, nullable=True)
    # the display address (text) shown on their profile
    city = Column(String, nullable=False)

    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_active = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # display name
    name = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    birthdate = Column(Date, nullable=False)  # in the timezone of birthplace

    # name as on official docs for verification, etc. not needed until verification
    full_name = Column(String, nullable=True)

    hosting_status = Column(Enum(HostingStatus), nullable=True)

    # verification score
    verification = Column(Float, nullable=True)
    # community standing score
    community_standing = Column(Float, nullable=True)

    occupation = Column(String, nullable=True)
    about_me = Column(String, nullable=True)
    about_place = Column(String, nullable=True)
    # profile color
    color = Column(String, nullable=False, default="#643073")
    avatar_filename = Column(String, nullable=True)
    # TODO: array types once we go postgres
    languages = Column(String, nullable=True)
    countries_visited = Column(String, nullable=True)
    countries_lived = Column(String, nullable=True)

    is_banned = Column(Boolean, nullable=False, default=False)

    # hosting preferences
    max_guests = Column(Integer, nullable=True)
    multiple_groups = Column(Boolean, nullable=True)
    last_minute = Column(Boolean, nullable=True)
    accepts_pets = Column(Boolean, nullable=True)
    accepts_kids = Column(Boolean, nullable=True)
    wheelchair_accessible = Column(Boolean, nullable=True)
    smoking_allowed = Column(Enum(SmokingLocation), nullable=True)

    sleeping_arrangement = Column(String, nullable=True)
    area = Column(String, nullable=True)
    house_rules = Column(String, nullable=True)

    accepted_tos = Column(Integer, nullable=False, default=0)

    # for changing their email
    new_email = Column(String, nullable=True)
    new_email_token = Column(String, nullable=True)
    new_email_token_created = Column(DateTime(timezone=True), nullable=True)
    new_email_token_expiry = Column(DateTime(timezone=True), nullable=True)

    @hybrid_property
    def is_jailed(self):
        return self.accepted_tos < 1 or self.is_missing_location

    @property
    def is_missing_location(self):
        return not self.geom or not self.geom_radius

    @property
    def coordinates(self):
        if self.geom:
            return get_coordinates(self.geom)
        else:
            return None

    @property
    def age(self):
        max_day = monthrange(date.today().year, self.birthdate.month)[1]
        age = date.today().year - self.birthdate.year
        # in case of leap-day babies, make sure the date is valid for this year
        safe_birthdate = self.birthdate
        if self.birthdate.day > max_day:
            safe_birthdate = safe_birthdate.replace(day=max_day)
        if date.today() < safe_birthdate.replace(year=date.today().year):
            age -= 1
        return age

    @property
    def display_joined(self):
        """
        Returns the last active time rounded down to the nearest hour.
        """
        return self.joined.replace(minute=0, second=0, microsecond=0)

    @property
    def display_last_active(self):
        """
        Returns the last active time rounded down to the nearest 15 minutes.
        """
        return self.last_active.replace(minute=(self.last_active.minute // 15) * 15, second=0, microsecond=0)

    @property
    def avatar_url(self):
        if self.avatar_filename:
            return f"{config['MEDIA_SERVER_BASE_URL']}/img/avatar/{self.avatar_filename}"
        else:
            return None

    def mutual_friends(self, target_id):
        if target_id == self.id:
            return []

        session = Session.object_session(self)

        q1 = (
            session.query(FriendRelationship.from_user_id.label("user_id"))
            .filter(FriendRelationship.to_user == self)
            .filter(FriendRelationship.from_user_id != target_id)
            .filter(FriendRelationship.status == FriendStatus.accepted)
        )

        q2 = (
            session.query(FriendRelationship.to_user_id.label("user_id"))
            .filter(FriendRelationship.from_user == self)
            .filter(FriendRelationship.to_user_id != target_id)
            .filter(FriendRelationship.status == FriendStatus.accepted)
        )

        q3 = (
            session.query(FriendRelationship.from_user_id.label("user_id"))
            .filter(FriendRelationship.to_user_id == target_id)
            .filter(FriendRelationship.from_user != self)
            .filter(FriendRelationship.status == FriendStatus.accepted)
        )

        q4 = (
            session.query(FriendRelationship.to_user_id.label("user_id"))
            .filter(FriendRelationship.from_user_id == target_id)
            .filter(FriendRelationship.to_user != self)
            .filter(FriendRelationship.status == FriendStatus.accepted)
        )

        return session.query(User).filter(User.id.in_(q1.union(q2).intersect(q3.union(q4)).subquery())).all()

    def __repr__(self):
        return f"User(id={self.id}, email={self.email}, username={self.username})"


class FriendStatus(enum.Enum):
    pending = enum.auto()
    accepted = enum.auto()
    rejected = enum.auto()
    cancelled = enum.auto()


class FriendRelationship(Base):
    """
    Friendship relations between users

    TODO: make this better with sqlalchemy self-referential stuff
    """

    __tablename__ = "friend_relationships"

    id = Column(BigInteger, primary_key=True)

    from_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    to_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    status = Column(Enum(FriendStatus), nullable=False, default=FriendStatus.pending)

    # timezones should always be UTC
    time_sent = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    time_responded = Column(DateTime(timezone=True), nullable=True)

    from_user = relationship("User", backref="friends_from", foreign_keys="FriendRelationship.from_user_id")
    to_user = relationship("User", backref="friends_to", foreign_keys="FriendRelationship.to_user_id")
