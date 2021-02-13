import enum

from sqlalchemy import BigInteger, Boolean, Column, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import backref, relationship
from sqlalchemy.orm.session import Session
from sqlalchemy.sql import func


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
