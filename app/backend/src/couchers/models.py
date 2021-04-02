import enum
from calendar import monthrange
from datetime import date

from geoalchemy2.types import Geometry
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
)
from sqlalchemy import LargeBinary as Binary
from sqlalchemy import MetaData, Sequence, String, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import backref, column_property, relationship
from sqlalchemy.orm.session import Session
from sqlalchemy.sql import func, text

from couchers.config import config
from couchers.utils import date_in_timezone, get_coordinates, now

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
    cant_host = enum.auto()


class MeetupStatus(enum.Enum):
    wants_to_meetup = enum.auto()
    open_to_meetup = enum.auto()
    does_not_want_to_meetup = enum.auto()


class SmokingLocation(enum.Enum):
    yes = enum.auto()
    window = enum.auto()
    outside = enum.auto()
    no = enum.auto()


class SleepingArrangement(enum.Enum):
    private = enum.auto()
    common = enum.auto()
    shared_room = enum.auto()
    shared_space = enum.auto()


class ParkingDetails(enum.Enum):
    free_onsite = enum.auto()
    free_offsite = enum.auto()
    paid_onsite = enum.auto()
    paid_offsite = enum.auto()


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
    hometown = Column(String, nullable=True)

    # TODO: proper timezone handling
    timezone = "Etc/UTC"

    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_active = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # id of the last message that they received a notification about
    last_notified_message_id = Column(BigInteger, nullable=False, default=0)

    # display name
    name = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    pronouns = Column(String, nullable=True)
    birthdate = Column(Date, nullable=False)  # in the timezone of birthplace

    # name as on official docs for verification, etc. not needed until verification
    full_name = Column(String, nullable=True)

    avatar_key = Column(ForeignKey("uploads.key"), nullable=True)

    hosting_status = Column(Enum(HostingStatus), nullable=True)
    meetup_status = Column(Enum(MeetupStatus), nullable=True)

    # verification score
    verification = Column(Float, nullable=True)
    # community standing score
    community_standing = Column(Float, nullable=True)

    occupation = Column(String, nullable=True)  # CommonMark without images
    education = Column(String, nullable=True)  # CommonMark without images
    about_me = Column(String, nullable=True)  # CommonMark without images
    my_travels = Column(String, nullable=True)  # CommonMark without images
    things_i_like = Column(String, nullable=True)  # CommonMark without images
    about_place = Column(String, nullable=True)  # CommonMark without images
    # TODO: array types once we go postgres
    languages = Column(String, nullable=True)
    countries_visited = Column(String, nullable=True)
    countries_lived = Column(String, nullable=True)
    additional_information = Column(String, nullable=True)  # CommonMark without images

    is_banned = Column(Boolean, nullable=False, default=False)

    # hosting preferences
    max_guests = Column(Integer, nullable=True)
    last_minute = Column(Boolean, nullable=True)
    has_pets = Column(Boolean, nullable=True)
    accepts_pets = Column(Boolean, nullable=True)
    pet_details = Column(String, nullable=True)  # CommonMark without images
    has_kids = Column(Boolean, nullable=True)
    accepts_kids = Column(Boolean, nullable=True)
    kid_details = Column(String, nullable=True)  # CommonMark without images
    has_housemates = Column(Boolean, nullable=True)
    housemate_details = Column(String, nullable=True)  # CommonMark without images
    wheelchair_accessible = Column(Boolean, nullable=True)
    smoking_allowed = Column(Enum(SmokingLocation), nullable=True)
    smokes_at_home = Column(Boolean, nullable=True)
    drinking_allowed = Column(Boolean, nullable=True)
    drinks_at_home = Column(Boolean, nullable=True)
    other_host_info = Column(String, nullable=True)  # CommonMark without images

    sleeping_arrangement = Column(Enum(SleepingArrangement), nullable=True)
    sleeping_details = Column(String, nullable=True)  # CommonMark without images
    area = Column(String, nullable=True)  # CommonMark without images
    house_rules = Column(String, nullable=True)  # CommonMark without images
    parking = Column(Boolean, nullable=True)
    parking_details = Column(Enum(ParkingDetails), nullable=True)  # CommonMark without images
    camping_ok = Column(Boolean, nullable=True)

    accepted_tos = Column(Integer, nullable=False, default=0)

    # for changing their email
    new_email = Column(String, nullable=True)
    new_email_token = Column(String, nullable=True)
    new_email_token_created = Column(DateTime(timezone=True), nullable=True)
    new_email_token_expiry = Column(DateTime(timezone=True), nullable=True)

    avatar = relationship("Upload", foreign_keys="User.avatar_key")

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


class SignupToken(Base):
    """
    A signup token allows the user to verify their email and continue signing up.
    """

    __tablename__ = "signup_tokens"
    token = Column(String, primary_key=True)

    email = Column(String, nullable=False)

    # timezones should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())

    def __repr__(self):
        return f"SignupToken(token={self.token}, email={self.email}, created={self.created}, expiry={self.expiry})"


class LoginToken(Base):
    """
    A login token sent in an email to a user, allows them to sign in between the times defined by created and expiry
    """

    __tablename__ = "login_tokens"
    token = Column(String, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # timezones should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", backref="login_tokens")

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())

    def __repr__(self):
        return f"LoginToken(token={self.token}, user={self.user}, created={self.created}, expiry={self.expiry})"


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    token = Column(String, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", backref="password_reset_tokens")

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())

    def __repr__(self):
        return f"PasswordResetToken(token={self.token}, user={self.user}, created={self.created}, expiry={self.expiry})"


class UserSession(Base):
    """
    API keys/session cookies for the app

    There are two types of sessions: long-lived, and short-lived. Long-lived are
    like when you choose "remember this browser": they will be valid for a long
    time without the user interacting with the site. Short-lived sessions on the
    other hand get invalidated quickly if the user does not interact with the
    site.

    Long-lived tokens are valid from `created` until `expiry`.

    Short-lived tokens expire after 168 hours (7 days) if they are not used.
    """

    __tablename__ = "sessions"
    token = Column(String, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # whether it's a long-lived or short-lived session
    long_lived = Column(Boolean, nullable=False)

    # the time at which the session was created
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # the expiry of the session: the session *cannot* be refreshed past this
    expiry = Column(DateTime(timezone=True), nullable=False, server_default=func.now() + text("interval '90 days'"))

    # the time at which the token was invalidated, allows users to delete sessions
    deleted = Column(DateTime(timezone=True), nullable=True, default=None)

    # the last time this session was used
    last_seen = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # count of api calls made with this token/session (if we're updating last_seen, might as well update this too)
    api_calls = Column(Integer, nullable=False, default=0)

    # details of the browser, if available
    # these are from the request creating the session, not used for anything else
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    user = relationship("User", backref="sessions")

    @hybrid_property
    def is_valid(self):
        """
        It must have been created and not be expired or deleted.

        Also, if it's a short lived token, it must have been used in the last 168 hours.

        TODO: this probably won't run in python (instance level), only in sql (class level)
        """
        return (
            (self.created <= func.now())
            & (self.expiry >= func.now())
            & (self.deleted == None)
            & (self.long_lived | (func.now() - self.last_seen < text("interval '168 hours'")))
        )


class Conversation(Base):
    """
    Conversation brings together the different types of message/conversation types
    """

    __tablename__ = "conversations"

    id = Column(BigInteger, primary_key=True)
    # timezone should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self):
        return f"Conversation(id={self.id}, created={self.created})"


class GroupChat(Base):
    """
    Group chat
    """

    __tablename__ = "group_chats"

    conversation_id = Column("id", ForeignKey("conversations.id"), nullable=False, primary_key=True)

    title = Column(String, nullable=True)
    only_admins_invite = Column(Boolean, nullable=False, default=True)
    creator_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    is_dm = Column(Boolean, nullable=False)

    conversation = relationship("Conversation", backref="group_chat")
    creator = relationship("User", backref="created_group_chats")

    def __repr__(self):
        return f"GroupChat(conversation={self.conversation}, title={self.title or 'None'}, only_admins_invite={self.only_admins_invite}, creator={self.creator}, is_dm={self.is_dm})"


class GroupChatRole(enum.Enum):
    admin = enum.auto()
    participant = enum.auto()


class GroupChatSubscription(Base):
    """
    The recipient of a thread and information about when they joined/left/etc.
    """

    __tablename__ = "group_chat_subscriptions"
    id = Column(BigInteger, primary_key=True)

    # TODO: DB constraint on only one user+group_chat combo at a given time
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    group_chat_id = Column(ForeignKey("group_chats.id"), nullable=False, index=True)

    # timezones should always be UTC
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    left = Column(DateTime(timezone=True), nullable=True)

    role = Column(Enum(GroupChatRole), nullable=False)

    last_seen_message_id = Column(BigInteger, nullable=False, default=0)

    user = relationship("User", backref="group_chat_subscriptions")
    group_chat = relationship("GroupChat", backref=backref("subscriptions", lazy="dynamic"))

    @property
    def unseen_message_count(self):
        return (
            Session.object_session(self)
            .query(Message.id)
            .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
            .filter(GroupChatSubscription.id == self.id)
            .filter(Message.id > GroupChatSubscription.last_seen_message_id)
            .count()
        )

    def __repr__(self):
        return f"GroupChatSubscription(id={self.id}, user={self.user}, joined={self.joined}, left={self.left}, role={self.role}, group_chat={self.group_chat})"


class MessageType(enum.Enum):
    text = enum.auto()
    # e.g.
    # image =
    # emoji =
    # ...
    chat_created = enum.auto()
    chat_edited = enum.auto()
    user_invited = enum.auto()
    user_left = enum.auto()
    user_made_admin = enum.auto()
    user_removed_admin = enum.auto()
    host_request_status_changed = enum.auto()


class HostRequestStatus(enum.Enum):
    pending = enum.auto()
    accepted = enum.auto()
    rejected = enum.auto()
    confirmed = enum.auto()
    cancelled = enum.auto()


class Message(Base):
    """
    A message.

    If message_type = text, then the message is a normal text message, otherwise, it's a special control message.
    """

    __tablename__ = "messages"

    id = Column(BigInteger, primary_key=True)

    # which conversation the message belongs in
    conversation_id = Column(ForeignKey("conversations.id"), nullable=False, index=True)

    # the user that sent the message/command
    author_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # the message type, "text" is a text message, otherwise a "control message"
    message_type = Column(Enum(MessageType), nullable=False)

    # the target if a control message and requires target, e.g. if inviting a user, the user invited is the target
    target_id = Column(ForeignKey("users.id"), nullable=True, index=True)

    # time sent, timezone should always be UTC
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # the plain-text message text if not control
    text = Column(String, nullable=True)

    # the new host request status if the message type is host_request_status_changed
    host_request_status_target = Column(Enum(HostRequestStatus), nullable=True)

    conversation = relationship("Conversation", backref="messages", order_by="Message.time.desc()")
    author = relationship("User", foreign_keys="Message.author_id")
    target = relationship("User", foreign_keys="Message.target_id")

    @property
    def is_normal_message(self):
        """
        There's only one normal type atm, text
        """
        return self.message_type == MessageType.text

    def __repr__(self):
        return f"Message(id={self.id}, time={self.time}, text={self.text}, author={self.author}, conversation={self.conversation})"


class Complaint(Base):
    """
    A record that a user has reported another user to admin
    """

    __tablename__ = "complaints"

    id = Column(BigInteger, primary_key=True)

    # timezone should always be UTC
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    author_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    reported_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    reason = Column(String, nullable=False)
    description = Column(String, nullable=False)

    author_user = relationship("User", foreign_keys="Complaint.author_user_id")
    reported_user = relationship("User", foreign_keys="Complaint.reported_user_id")


class Email(Base):
    """
    Table of all dispatched emails for debugging purposes, etc.
    """

    __tablename__ = "emails"

    id = Column(String, primary_key=True)

    # timezone should always be UTC
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    sender_name = Column(String, nullable=False)
    sender_email = Column(String, nullable=False)

    recipient = Column(String, nullable=False)
    subject = Column(String, nullable=False)

    plain = Column(String, nullable=False)
    html = Column(String, nullable=False)


class HostRequest(Base):
    """
    A request to stay with a host
    """

    __tablename__ = "host_requests"

    conversation_id = Column("id", ForeignKey("conversations.id"), nullable=False, primary_key=True)
    from_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    to_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # TODO: proper timezone handling
    timezone = "Etc/UTC"

    # dates in the timezone above
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)

    # timezone aware start and end times of the request, can be compared to now()
    start_time = column_property(date_in_timezone(from_date, timezone))
    end_time = column_property(date_in_timezone(to_date, timezone) + text("interval '1 days'"))
    end_time_to_write_reference = column_property(end_time + text("interval '14 days'"))

    status = Column(Enum(HostRequestStatus), nullable=False)

    to_last_seen_message_id = Column(BigInteger, nullable=False, default=0)
    from_last_seen_message_id = Column(BigInteger, nullable=False, default=0)

    from_user = relationship("User", backref="host_requests_sent", foreign_keys="HostRequest.from_user_id")
    to_user = relationship("User", backref="host_requests_received", foreign_keys="HostRequest.to_user_id")
    conversation = relationship("Conversation")

    @hybrid_property
    def can_write_reference(self):
        return (
            (self.status == HostRequestStatus.confirmed)
            & (now() >= self.end_time)
            & (now() <= self.end_time_to_write_reference)
        )

    @can_write_reference.expression
    def can_write_reference(cls):
        return (
            (cls.status == HostRequestStatus.confirmed)
            & (func.now() >= cls.end_time)
            & (func.now() <= cls.end_time_to_write_reference)
        )

    def __repr__(self):
        return f"HostRequest(id={self.id}, from_user_id={self.from_user_id}, to_user_id={self.to_user_id}...)"


class ReferenceType(enum.Enum):
    friend = enum.auto()
    surfed = enum.auto()  # The "from" user surfed with the "to" user
    hosted = enum.auto()  # The "from" user hosted the "to" user


class Reference(Base):
    """
    Reference from one user to another
    """

    __tablename__ = "references"

    id = Column(BigInteger, primary_key=True)
    # timezone should always be UTC
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    from_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    to_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    reference_type = Column(Enum(ReferenceType), nullable=False)

    host_request_id = Column(ForeignKey("host_requests.id"), nullable=True)

    text = Column(String, nullable=True)  # plain text

    rating = Column(Float, nullable=False)
    was_appropriate = Column(Boolean, nullable=False)

    from_user = relationship("User", backref="references_from", foreign_keys="Reference.from_user_id")
    to_user = relationship("User", backref="references_to", foreign_keys="Reference.to_user_id")

    host_request = relationship("HostRequest", backref="references")

    __table_args__ = (
        # Rating must be between 0 and 1, inclusive
        CheckConstraint(
            "rating BETWEEN 0 AND 1",
            name="rating_between_0_and_1",
        ),
        # Has a host_request_id iff it's not a friend reference
        CheckConstraint(
            "(host_request_id IS NULL AND reference_type = 'friend') OR (host_request_id IS NOT NULL AND reference_type != 'friend')",
            name="host_request_id_xor_friend_reference",
        ),
        # Each user can leave at most one friend reference to another user
        Index(
            "ix_references_unique_friend_reference",
            from_user_id,
            to_user_id,
            reference_type,
            unique=True,
            postgresql_where=(reference_type == ReferenceType.friend),
        ),
        # Each user can leave at most one reference to another user for each stay
        Index(
            "ix_references_unique_per_host_request",
            from_user_id,
            to_user_id,
            host_request_id,
            unique=True,
            postgresql_where=(host_request_id != None),
        ),
    )


class InitiatedUpload(Base):
    """
    Started downloads, not necessarily complete yet.
    """

    __tablename__ = "initiated_uploads"

    key = Column(String, primary_key=True)

    # timezones should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    initiator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    initiator_user = relationship("User")

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())


class Upload(Base):
    """
    Completed uploads.
    """

    __tablename__ = "uploads"
    key = Column(String, primary_key=True)

    filename = Column(String, nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # photo credit, etc
    credit = Column(String, nullable=True)

    creator_user = relationship("User", backref="uploads", foreign_keys="Upload.creator_user_id")

    def _url(self, size):
        return f"{config['MEDIA_SERVER_BASE_URL']}/img/{size}/{self.filename}"

    @property
    def thumbnail_url(self):
        return self._url("thumbnail")

    @property
    def full_url(self):
        return self._url("full")


communities_seq = Sequence("communities_seq")


class Node(Base):
    """
    Node, i.e. geographical subdivision of the world

    Administered by the official cluster
    """

    __tablename__ = "nodes"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())

    # name and description come from official cluster
    parent_node_id = Column(ForeignKey("nodes.id"), nullable=True, index=True)
    geom = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    parent_node = relationship("Node", backref="child_nodes", remote_side="Node.id")

    contained_users = relationship(
        "User",
        lazy="dynamic",
        primaryjoin="func.ST_Contains(foreign(Node.geom), User.geom).as_comparison(1, 2)",
        viewonly=True,
        uselist=True,
    )


class Cluster(Base):
    """
    Cluster, administered grouping of content
    """

    __tablename__ = "clusters"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())
    parent_node_id = Column(ForeignKey("nodes.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    # short description
    description = Column(String, nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    is_official_cluster = Column(Boolean, nullable=False, default=False)

    slug = column_property(func.slugify(name))

    official_cluster_for_node = relationship(
        "Node",
        primaryjoin="and_(Cluster.parent_node_id == Node.id, Cluster.is_official_cluster)",
        backref=backref("official_cluster", uselist=False),
        uselist=False,
    )

    parent_node = relationship(
        "Node", backref="child_clusters", remote_side="Node.id", foreign_keys="Cluster.parent_node_id"
    )

    nodes = relationship("Cluster", backref="clusters", secondary="node_cluster_associations")
    # all pages
    pages = relationship("Page", backref="clusters", secondary="cluster_page_associations", lazy="dynamic")
    events = relationship("Event", backref="clusters", secondary="cluster_event_associations")
    discussions = relationship("Discussion", backref="clusters", secondary="cluster_discussion_associations")

    # includes also admins
    members = relationship(
        "User",
        lazy="dynamic",
        backref="cluster_memberships",
        secondary="cluster_subscriptions",
        primaryjoin="Cluster.id == ClusterSubscription.cluster_id",
        secondaryjoin="User.id == ClusterSubscription.user_id",
    )

    admins = relationship(
        "User",
        lazy="dynamic",
        backref="cluster_adminships",
        secondary="cluster_subscriptions",
        primaryjoin="Cluster.id == ClusterSubscription.cluster_id",
        secondaryjoin="and_(User.id == ClusterSubscription.user_id, ClusterSubscription.role == 'admin')",
    )

    main_page = relationship(
        "Page",
        primaryjoin="and_(Cluster.id == Page.owner_cluster_id, Page.type == 'main_page')",
        viewonly=True,
        uselist=False,
    )

    __table_args__ = (
        # Each node can have at most one official cluster
        Index(
            "ix_clusters_owner_parent_node_id_is_official_cluster",
            parent_node_id,
            is_official_cluster,
            unique=True,
            postgresql_where=is_official_cluster,
        ),
    )


class NodeClusterAssociation(Base):
    """
    NodeClusterAssociation, grouping of nodes
    """

    __tablename__ = "node_cluster_associations"
    __table_args__ = (UniqueConstraint("node_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    node_id = Column(ForeignKey("nodes.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    node = relationship("Node", backref="node_cluster_associations")
    cluster = relationship("Cluster", backref="node_cluster_associations")


class ClusterRole(enum.Enum):
    member = enum.auto()
    admin = enum.auto()


class ClusterSubscription(Base):
    """
    ClusterSubscription of a user
    """

    __tablename__ = "cluster_subscriptions"
    __table_args__ = (UniqueConstraint("user_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)
    role = Column(Enum(ClusterRole), nullable=False)

    user = relationship("User", backref="cluster_subscriptions")
    cluster = relationship("Cluster", backref="cluster_subscriptions")


class ClusterPageAssociation(Base):
    """
    pages related to clusters
    """

    __tablename__ = "cluster_page_associations"
    __table_args__ = (UniqueConstraint("page_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    page_id = Column(ForeignKey("pages.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    page = relationship("Page", backref="cluster_page_associations")
    cluster = relationship("Cluster", backref="cluster_page_associations")


class PageType(enum.Enum):
    main_page = enum.auto()
    place = enum.auto()
    guide = enum.auto()


class Page(Base):
    """
    similar to a wiki page about a community, POI or guide
    """

    __tablename__ = "pages"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())

    parent_node_id = Column(ForeignKey("nodes.id"), nullable=False, index=True)
    type = Column(Enum(PageType), nullable=False)
    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    owner_user_id = Column(ForeignKey("users.id"), nullable=True, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=True, index=True)

    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)

    parent_node = relationship("Node", backref="child_pages", remote_side="Node.id", foreign_keys="Page.parent_node_id")

    thread = relationship("Thread", backref="page", uselist=False)
    creator_user = relationship("User", backref="created_pages", foreign_keys="Page.creator_user_id")
    owner_user = relationship("User", backref="owned_pages", foreign_keys="Page.owner_user_id")
    owner_cluster = relationship(
        "Cluster", backref=backref("owned_pages", lazy="dynamic"), uselist=False, foreign_keys="Page.owner_cluster_id"
    )

    editors = relationship("User", secondary="page_versions")

    __table_args__ = (
        # Only one of owner_user and owner_cluster should be set
        CheckConstraint(
            "(owner_user_id IS NULL AND owner_cluster_id IS NOT NULL) OR (owner_user_id IS NOT NULL AND owner_cluster_id IS NULL)",
            name="one_owner",
        ),
        # Only clusters can own main pages
        CheckConstraint(
            "NOT (owner_cluster_id IS NULL AND type = 'main_page')",
            name="main_page_owned_by_cluster",
        ),
        # Each cluster can have at most one main page
        Index(
            "ix_pages_owner_cluster_id_type",
            owner_cluster_id,
            type,
            unique=True,
            postgresql_where=(type == PageType.main_page),
        ),
    )

    def __repr__(self):
        return f"Page({self.id=})"


class PageVersion(Base):
    """
    version of page content
    """

    __tablename__ = "page_versions"

    id = Column(BigInteger, primary_key=True)

    page_id = Column(ForeignKey("pages.id"), nullable=False, index=True)
    editor_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)  # CommonMark without images
    photo_key = Column(ForeignKey("uploads.key"), nullable=True)
    # the human-readable address
    address = Column(String, nullable=True)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    slug = column_property(func.slugify(title))

    page = relationship("Page", backref="versions", order_by="PageVersion.id")
    editor_user = relationship("User", backref="edited_pages")
    photo = relationship("Upload")

    @property
    def coordinates(self):
        # returns (lat, lng) or None
        if self.geom:
            return get_coordinates(self.geom)
        else:
            return None

    def __repr__(self):
        return f"PageVersion({self.id=}, {self.page_id=})"


class ClusterEventAssociation(Base):
    """
    events related to clusters
    """

    __tablename__ = "cluster_event_associations"
    __table_args__ = (UniqueConstraint("event_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    event = relationship("Event", backref="cluster_event_associations")
    cluster = relationship("Cluster", backref="cluster_event_associations")


class Event(Base):
    """
    A happening
    """

    __tablename__ = "events"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())

    title = Column(String, nullable=False)
    content = Column(String, nullable=False)  # CommonMark without images
    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    address = Column(String, nullable=False)
    photo = Column(String, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    owner_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=False, unique=True, index=True)

    thread = relationship("Thread", backref="event", uselist=False)
    owner_user = relationship("User", backref="owned_events")
    owner_cluster = relationship("Cluster", backref="owned event", uselist=False)

    suscribers = relationship("User", backref="events", secondary="event_subscriptions")


class EventSubscription(Base):
    """
    users subscriptions to events
    """

    __tablename__ = "event_subscriptions"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", backref="event_subscriptions")
    event = relationship("Event", backref="event_subscriptions")


class ClusterDiscussionAssociation(Base):
    """
    discussions related to clusters
    """

    __tablename__ = "cluster_discussion_associations"
    __table_args__ = (UniqueConstraint("discussion_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    discussion_id = Column(ForeignKey("discussions.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    discussion = relationship("Discussion", backref="cluster_discussion_associations")
    cluster = relationship("Cluster", backref="cluster_discussion_associations")


class Discussion(Base):
    """
    forum board
    """

    __tablename__ = "discussions"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())

    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    slug = column_property(func.slugify(title))

    thread = relationship("Thread", backref="discussion", uselist=False)

    subscribers = relationship("User", backref="discussions", secondary="discussion_subscriptions")

    creator_user = relationship("User", backref="created_discussions", foreign_keys="Discussion.creator_user_id")
    owner_cluster = relationship("Cluster", backref=backref("owned_discussions", lazy="dynamic"), uselist=False)


class DiscussionSubscription(Base):
    """
    users subscriptions to discussions
    """

    __tablename__ = "discussion_subscriptions"
    __table_args__ = (UniqueConstraint("discussion_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    discussion_id = Column(ForeignKey("discussions.id"), nullable=False, index=True)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    left = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="discussion_subscriptions")
    discussion = relationship("Discussion", backref="discussion_subscriptions")


class Thread(Base):
    """
    Thread
    """

    __tablename__ = "threads"

    id = Column(BigInteger, primary_key=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)


class Comment(Base):
    """
    Comment
    """

    __tablename__ = "comments"

    id = Column(BigInteger, primary_key=True)

    thread_id = Column(ForeignKey("threads.id"), nullable=False, index=True)
    author_user_id = Column(ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)  # CommonMark without images
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)

    thread = relationship("Thread", backref="comments")


class Reply(Base):
    """
    Reply
    """

    __tablename__ = "replies"

    id = Column(BigInteger, primary_key=True)

    comment_id = Column(ForeignKey("comments.id"), nullable=False, index=True)
    author_user_id = Column(ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)  # CommonMark without images
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)

    comment = relationship("Comment", backref="replies")


class BackgroundJobType(enum.Enum):
    # payload: jobs.SendEmailPayload
    send_email = 1
    # payload: google.protobuf.Empty
    purge_login_tokens = 2
    # payload: google.protobuf.Empty
    purge_signup_tokens = 3
    # payload: google.protobuf.Empty
    send_message_notifications = 4


class BackgroundJobState(enum.Enum):
    # job is fresh, waiting to be picked off the queue
    pending = 1
    # job complete
    completed = 2
    # error occured, will be retried
    error = 3
    # failed too many times, not retrying anymore
    failed = 4


class BackgroundJob(Base):
    """
    This table implements a queue of background jobs.
    """

    __tablename__ = "background_jobs"

    id = Column(BigInteger, primary_key=True)

    # used to discern which function should be triggered to service it
    job_type = Column(Enum(BackgroundJobType), nullable=False)
    state = Column(Enum(BackgroundJobState), nullable=False, default=BackgroundJobState.pending)

    # time queued
    queued = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # time at which we may next attempt it, for implementing exponential backoff
    next_attempt_after = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # used to count number of retries for failed jobs
    try_count = Column(Integer, nullable=False, default=0)

    max_tries = Column(Integer, nullable=False, default=5)

    # protobuf encoded job payload
    payload = Column(Binary, nullable=False)

    # if the job failed, we write that info here
    failure_info = Column(String, nullable=True)

    @hybrid_property
    def ready_for_retry(self):
        return (
            (self.next_attempt_after <= func.now())
            & (self.try_count < self.max_tries)
            & ((self.state == BackgroundJobState.pending) | (self.state == BackgroundJobState.error))
        )

    def __repr__(self):
        return f"BackgroundJob(id={self.id}, job_type={self.job_type}, state={self.state}, next_attempt_after={self.next_attempt_after}, try_count={self.try_count}, failure_info={self.failure_info})"
