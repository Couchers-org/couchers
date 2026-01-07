"""
Unified Moderation System (UMS) models

These models provide a flexible, generic moderation system that can be applied
to any moderatable content on the platform (host requests, discussions, events, etc.)
"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base, moderation_seq

if TYPE_CHECKING:
    from couchers.models.users import User


class ModerationVisibility(enum.Enum):
    # Only visible to moderators
    HIDDEN = enum.auto()
    # Visible only to content author
    SHADOWED = enum.auto()
    # Visible to everyone, does not appear in listings
    UNLISTED = enum.auto()
    # Visible to everyone, appears in listings
    VISIBLE = enum.auto()


class ModerationTrigger(enum.Enum):
    """What triggered adding an item to the moderation queue"""

    # New content requiring triage
    INITIAL_REVIEW = enum.auto()
    # User reported/flagged content
    USER_FLAG = enum.auto()
    # Automod flagged content
    MACHINE_FLAG = enum.auto()
    # Moderator requested additional review
    MODERATOR_REVIEW = enum.auto()


class ModerationAction(enum.Enum):
    """Types of moderation actions that can be taken"""

    # Initial creation of moderation state
    CREATE = enum.auto()
    # Approve content (make visible and listed)
    APPROVE = enum.auto()
    # Hide content from everyone
    HIDE = enum.auto()
    # Flag for review
    FLAG = enum.auto()
    # Remove flag
    UNFLAG = enum.auto()


class ModerationObjectType(enum.Enum):
    """Types of objects that can be moderated"""

    HOST_REQUEST = enum.auto()
    GROUP_CHAT = enum.auto()


class ModerationState(Base, init=False, kw_only=True):
    """
    Moderation state for any moderatable object on the platform

    This table tracks the visibility and listing state of content.
    Notifications are linked directly via the moderation_state_id FK on Notification.
    """

    __tablename__ = "moderation_states"

    id: Mapped[int] = mapped_column(
        BigInteger, moderation_seq, primary_key=True, server_default=moderation_seq.next_value()
    )

    # Generic reference to the moderated object
    object_type: Mapped[ModerationObjectType] = mapped_column(Enum(ModerationObjectType))
    object_id: Mapped[int] = mapped_column(BigInteger)

    visibility: Mapped[ModerationVisibility] = mapped_column(Enum(ModerationVisibility))

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        # Each object can only have one moderation state
        Index("ix_moderation_states_object", object_type, object_id, unique=True),
        # Covering index for visibility filtering - enables index-only scans in where_moderated_content_visible
        Index("ix_moderation_states_id_visibility", id, visibility),
    )

    def __repr__(self) -> str:
        return f"ModerationState(id={self.id}, type={self.object_type}, object_id={self.object_id}, visibility={self.visibility})"


class ModerationQueueItem(Base, init=False, kw_only=True):
    """
    Action items in the moderation queue

    This table tracks what moderators need to review. Items remain in the queue
    until they are resolved (linked to a ModerationLog entry).
    """

    __tablename__ = "moderation_queue"

    id: Mapped[int] = mapped_column(
        BigInteger, moderation_seq, primary_key=True, server_default=moderation_seq.next_value()
    )
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)

    time_created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    trigger: Mapped[ModerationTrigger] = mapped_column(Enum(ModerationTrigger))
    reason: Mapped[str] = mapped_column(String)

    # When resolved, this links to the log entry that resolved it
    resolved_by_log_id: Mapped[int | None] = mapped_column(ForeignKey("moderation_log.id"), index=True)

    # Relationships
    moderation_state: Mapped[ModerationState] = relationship(init=False)

    __table_args__ = (
        # Fast lookup of unresolved items
        Index(
            "ix_moderation_queue_unresolved",
            moderation_state_id,
            time_created,
            postgresql_where=resolved_by_log_id.is_(None),
        ),
    )

    def __repr__(self) -> str:
        return (
            f"ModerationQueueItem(id={self.id}, trigger={self.trigger}, resolved={self.resolved_by_log_id is not None})"
        )


class ModerationLog(Base, init=False, kw_only=True):
    """
    History of moderation actions

    This table provides a complete audit trail of all moderation actions taken,
    including who performed the action and what changed.
    """

    __tablename__ = "moderation_log"

    id: Mapped[int] = mapped_column(
        BigInteger, moderation_seq, primary_key=True, server_default=moderation_seq.next_value()
    )
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)

    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    action: Mapped[ModerationAction] = mapped_column(Enum(ModerationAction))
    moderator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    # State changes (nullable - only include fields that changed)
    new_visibility: Mapped[ModerationVisibility | None] = mapped_column(Enum(ModerationVisibility), nullable=True)

    # Explanation for the action
    reason: Mapped[str] = mapped_column(String)

    # Relationships
    moderation_state: Mapped[ModerationState] = relationship(init=False)
    moderator: Mapped[User] = relationship(init=False)

    __table_args__ = (
        # Fast lookup of log entries for a given state, ordered by time
        Index("ix_moderation_log_state_time", moderation_state_id, time.desc()),
    )

    def __repr__(self) -> str:
        return f"ModerationLog(id={self.id}, state_id={self.moderation_state_id}, action={self.action}, moderator={self.moderator_user_id}, time={self.time})"
