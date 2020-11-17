import enum
from calendar import monthrange
from datetime import date

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, Float, ForeignKey, Integer
from sqlalchemy import LargeBinary as Binary
from sqlalchemy import MetaData, String, UniqueConstraint, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import backref, relationship
from sqlalchemy.orm.session import Session

from couchers.config import config

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

    id = Column(Integer, primary_key=True)

    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    # stored in libsodium hash format, can be null for email login
    hashed_password = Column(Binary, nullable=True)
    # phone number
    # TODO: should it be unique?
    phone = Column(String, nullable=True, unique=True)
    phone_status = Column(Enum(PhoneStatus), nullable=True)

    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_active = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # display name
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    birthdate = Column(Date, nullable=False)

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

    @property
    def is_jailed(self):
        return self.accepted_tos < 1

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
        # TODO(aapeli): don't hardcode
        filename = self.avatar_filename or "default.jpg"
        return f"{config['MEDIA_SERVER_BASE_URL']}/img/avatar/{filename}"

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

    def sync_jail(self):
        """
        Sync all sessions with current jail status.

        The auth interceptor does not check users table to reduce per-request DB overhead and this info is cached in the user session
        """
        session = Session.object_session(self)
        session.query(UserSession).filter(UserSession.user == self).update({"jailed": self.is_jailed})
        session.commit()
        # session.execute(UserSession.update().values(jailed=self.is_jailed).where(UserSession.user == self))

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

    id = Column(Integer, primary_key=True)

    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(Enum(FriendStatus), nullable=False, default=FriendStatus.pending)

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

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    def __repr__(self):
        return f"SignupToken(token={self.token}, email={self.email}, created={self.created}, expiry={self.expiry})"


class LoginToken(Base):
    """
    A login token sent in an email to a user, allows them to sign in between the times defined by created and expiry
    """

    __tablename__ = "login_tokens"
    token = Column(String, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", backref="login_tokens")

    def __repr__(self):
        return f"LoginToken(token={self.token}, user={self.user}, created={self.created}, expiry={self.expiry})"


class UserSession(Base):
    """
    Active session on the app, for auth
    """

    __tablename__ = "sessions"
    token = Column(String, primary_key=True)

    # whether the user needs to do something else before using the app,
    # only allows access to auth functions
    # info on this in auth.JailInfo
    jailed = Column(Boolean, default=False, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    started = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", backref="sessions")


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

    id = Column(Integer, primary_key=True)
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

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

    id = Column(Integer, primary_key=True)
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
    creator_id = Column(ForeignKey("users.id"), nullable=False)
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
    id = Column(Integer, primary_key=True)

    # TODO: DB constraint on only one user+group_chat combo at a given time
    user_id = Column(ForeignKey("users.id"), nullable=False)
    group_chat_id = Column(ForeignKey("group_chats.id"), nullable=False)

    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    left = Column(DateTime(timezone=True), nullable=True)

    role = Column(Enum(GroupChatRole), nullable=False)

    last_seen_message_id = Column(Integer, nullable=False, default=0)

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

    id = Column(Integer, primary_key=True)

    # which conversation the message belongs in
    conversation_id = Column(ForeignKey("conversations.id"), nullable=False)

    # the user that sent the message/command
    author_id = Column(ForeignKey("users.id"), nullable=False)

    # the message type, "text" is a text message, otherwise a "control message"
    message_type = Column(Enum(MessageType), nullable=False)

    # the target if a control message and requires target, e.g. if inviting a user, the user invited is the target
    target_id = Column(ForeignKey("users.id"), nullable=True)

    # time sent
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

    id = Column(Integer, primary_key=True)

    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    author_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reported_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

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
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # dates as "YYYY-MM-DD"
    from_date = Column(String, nullable=False)
    to_date = Column(String, nullable=False)

    status = Column(Enum(HostRequestStatus), nullable=False)

    to_last_seen_message_id = Column(Integer, nullable=False, default=0)
    from_last_seen_message_id = Column(Integer, nullable=False, default=0)

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

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    user_id = Column(ForeignKey("users.id"), nullable=False)

    user = relationship("User")
