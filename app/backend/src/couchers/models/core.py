import enum
from calendar import monthrange
from datetime import date

from geoalchemy2.types import Geometry
from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, Enum, Float, ForeignKey, Integer
from sqlalchemy import LargeBinary as Binary
from sqlalchemy import String, UniqueConstraint
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import backref, relationship
from sqlalchemy.orm.session import Session
from sqlalchemy.sql import func, text

from couchers.config import config
from couchers.models.base import Base
from couchers.utils import get_coordinates


class PhoneStatus(enum.Enum):
    # unverified
    unverified = 1
    # verified
    verified = 2


class HostingStatus(enum.Enum):
    can_host = 1
    maybe = 2
    difficult = 3
    cant_host = 4


class SmokingLocation(enum.Enum):
    yes = 1
    window = 2
    outside = 3
    no = 4


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
        # returns (lat, lng)
        # we put people without coords on null island
        # https://en.wikipedia.org/wiki/Null_Island
        if self.geom:
            return get_coordinates(self.geom)
        else:
            return (0.0, 0.0)

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
    pending = 1
    accepted = 2
    rejected = 3
    cancelled = 4


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
        """
        return (
            (self.created <= func.now())
            & (self.expiry >= func.now())
            & (self.deleted == None)
            & (self.long_lived | (func.now() - self.last_seen < text("interval '168 hours'")))
        )


class ReferenceType(enum.Enum):
    FRIEND = 1
    SURFED = 2  # The "from" user have surfed at the "to" user
    HOSTED = 3  # The "from" user have hosted the "to" user


class Reference(Base):
    """
    Reference from one user to another
    """

    __tablename__ = "references"
    __table_args__ = (UniqueConstraint("from_user_id", "to_user_id", "reference_type"),)

    id = Column(BigInteger, primary_key=True)
    # timezone should always be UTC
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    from_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    to_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    reference_type = Column(Enum(ReferenceType), nullable=False)

    text = Column(String, nullable=True)

    rating = Column(Integer, nullable=False)
    was_safe = Column(Boolean, nullable=False)

    from_user = relationship("User", backref="references_from", foreign_keys="Reference.from_user_id")
    to_user = relationship("User", backref="references_to", foreign_keys="Reference.to_user_id")


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
    admin = 1
    participant = 2


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
        # TODO: possibly slow

        session = Session.object_session(self)

        return (
            session.query(Message.id)
            .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
            .filter(GroupChatSubscription.id == self.id)
            .filter(Message.id > GroupChatSubscription.last_seen_message_id)
            .count()
        )

    def __repr__(self):
        return f"GroupChatSubscription(id={self.id}, user={self.user}, joined={self.joined}, left={self.left}, role={self.role}, group_chat={self.group_chat})"


class MessageType(enum.Enum):
    text = 0
    # e.g.
    # image =
    # emoji =
    # ...
    chat_created = 1
    chat_edited = 2
    user_invited = 3
    user_left = 4
    user_made_admin = 5
    user_removed_admin = 6
    host_request_status_changed = 7


class HostRequestStatus(enum.Enum):
    pending = 0
    accepted = 1
    rejected = 2
    confirmed = 3
    cancelled = 4


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

    # the message text if not control
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

    # dates as "YYYY-MM-DD", in the timezone of the host
    from_date = Column(String, nullable=False)
    to_date = Column(String, nullable=False)

    status = Column(Enum(HostRequestStatus), nullable=False)

    to_last_seen_message_id = Column(BigInteger, nullable=False, default=0)
    from_last_seen_message_id = Column(BigInteger, nullable=False, default=0)

    from_user = relationship("User", backref="host_requests_sent", foreign_keys="HostRequest.from_user_id")
    to_user = relationship("User", backref="host_requests_received", foreign_keys="HostRequest.to_user_id")
    conversation = relationship("Conversation")

    def __repr__(self):
        return f"HostRequest(id={self.id}, from_user_id={self.from_user_id}, to_user_id={self.to_user_id}...)"


class InitiatedUpload(Base):
    """
    Started downloads, not necessarily complete yet.

    For now we only have avatar images, so it's specific to that.
    """

    __tablename__ = "initiated_uploads"

    key = Column(String, primary_key=True)

    # timezones should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    user = relationship("User")

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())
