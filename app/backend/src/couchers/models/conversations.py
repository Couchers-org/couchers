import enum
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, Index, String, func, text
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import DynamicMapped, Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from couchers.constants import DATETIME_INFINITY, DATETIME_MINUS_INFINITY
from couchers.models.base import Base
from couchers.models.host_requests import HostRequestStatus
from couchers.utils import now

if TYPE_CHECKING:
    from couchers.models import ModerationState, User


class Conversation(Base, kw_only=True):
    """
    Conversation brings together the different types of message/conversation types
    """

    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    # timezone should always be UTC
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    def __repr__(self) -> str:
        return f"Conversation(id={self.id}, created={self.created})"


class GroupChat(Base, kw_only=True):
    """
    Group chat
    """

    __tablename__ = "group_chats"
    __moderation_author_column__ = "creator_id"

    conversation_id: Mapped[int] = mapped_column("id", ForeignKey("conversations.id"), primary_key=True)

    title: Mapped[str | None] = mapped_column(String, default=None)
    only_admins_invite: Mapped[bool] = mapped_column(Boolean, default=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    is_dm: Mapped[bool] = mapped_column(Boolean)

    # Unified Moderation System
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)

    conversation: Mapped[Conversation] = relationship(init=False, backref="group_chat")
    creator: Mapped[User] = relationship(init=False, backref="created_group_chats")
    moderation_state: Mapped[ModerationState] = relationship(init=False)
    subscriptions: DynamicMapped[GroupChatSubscription] = relationship(init=False, lazy="dynamic")

    def __repr__(self) -> str:
        return f"GroupChat(conversation={self.conversation}, title={self.title or 'None'}, only_admins_invite={self.only_admins_invite}, creator={self.creator}, is_dm={self.is_dm})"


class GroupChatRole(enum.Enum):
    admin = enum.auto()
    participant = enum.auto()


class GroupChatSubscription(Base, kw_only=True):
    """
    The recipient of a thread and information about when they joined/left/etc.
    """

    __tablename__ = "group_chat_subscriptions"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # TODO: DB constraint on only one user+group_chat combo at a given time
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    group_chat_id: Mapped[int] = mapped_column(ForeignKey("group_chats.id"), index=True)

    # timezones should always be UTC
    joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    left: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    role: Mapped[GroupChatRole] = mapped_column(Enum(GroupChatRole))

    last_seen_message_id: Mapped[int] = mapped_column(BigInteger, default=0)

    is_archived: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), init=False)

    # when this chat is muted until, DATETIME_INFINITY for "forever"
    muted_until: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=DATETIME_MINUS_INFINITY.isoformat(), init=False
    )

    user: Mapped[User] = relationship(init=False, backref="group_chat_subscriptions")
    group_chat: Mapped[GroupChat] = relationship(init=False, back_populates="subscriptions")

    def muted_display(self) -> tuple[bool, datetime | None]:
        """
        Returns (muted, muted_until) display values:
        1. If not muted, returns (False, None)
        2. If muted forever, returns (True, None)
        3. If muted until a given datetime returns (True, dt)
        """
        if self.muted_until < now():
            return (False, None)
        elif self.muted_until == DATETIME_INFINITY:
            return (True, None)
        else:
            return (True, self.muted_until)

    @hybrid_property
    def is_muted(self) -> Any:
        return self.muted_until > func.now()

    def __repr__(self) -> str:
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
    user_removed_admin = enum.auto()  # RemoveGroupChatAdmin: remove admin permission from a user in group chat
    host_request_status_changed = enum.auto()
    user_removed = enum.auto()  # user is removed from group chat by amdin RemoveGroupChatUser


class Message(Base, kw_only=True):
    """
    A message.

    If message_type = text, then the message is a normal text message, otherwise, it's a special control message.
    """

    __tablename__ = "messages"
    __table_args__ = (
        Index(
            "ix_messages_conversation_id_id_text_only",
            "conversation_id",
            "id",
            postgresql_where=text("message_type = 'text'"),
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # which conversation the message belongs in
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), index=True)

    # the user that sent the message/command
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # the message type, "text" is a text message, otherwise a "control message"
    message_type: Mapped[MessageType] = mapped_column(Enum(MessageType))

    # the target if a control message and requires target, e.g. if inviting a user, the user invited is the target
    target_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True, default=None)

    # time sent, timezone should always be UTC
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # the plain-text message text if not control
    text: Mapped[str | None] = mapped_column(String, default=None)

    # the new host request status if the message type is host_request_status_changed
    host_request_status_target: Mapped[HostRequestStatus | None] = mapped_column(Enum(HostRequestStatus), default=None)

    conversation: Mapped[Conversation] = relationship(init=False, backref="messages", order_by="Message.time.desc()")
    author: Mapped[User] = relationship(init=False, foreign_keys="Message.author_id")
    target: Mapped[User | None] = relationship(init=False, foreign_keys="Message.target_id")

    @property
    def is_normal_message(self) -> bool:
        """
        There's only one normal type atm, text
        """
        return self.message_type == MessageType.text

    def __repr__(self) -> str:
        return f"Message(id={self.id}, time={self.time}, text={self.text}, author={self.author}, conversation={self.conversation})"
