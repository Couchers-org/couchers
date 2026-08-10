"""
Unified Moderation System (UMS) models

These models provide a flexible, generic moderation system that can be applied
to any moderatable content on the platform (host requests, discussions, events, etc.)
"""

import enum
from dataclasses import dataclass
from datetime import datetime
from functools import cache
from typing import TYPE_CHECKING, Protocol

from sqlalchemy import BigInteger, ColumnElement, DateTime, Enum, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base, moderation_seq

if TYPE_CHECKING:
    from couchers.models.users import User


class ModerationVisibility(enum.Enum):
    # Only visible to moderators
    hidden = enum.auto()
    # Visible only to content author
    shadowed = enum.auto()
    # Visible to everyone, does not appear in listings
    unlisted = enum.auto()
    # Visible to everyone, appears in listings
    visible = enum.auto()


class ModerationTrigger(enum.Enum):
    """What triggered adding an item to the moderation queue"""

    # New content requiring triage
    initial_review = enum.auto()
    # User reported/flagged content
    user_flag = enum.auto()
    # Automod flagged content
    machine_flag = enum.auto()
    # Moderator requested additional review
    moderator_review = enum.auto()


class ModerationAction(enum.Enum):
    """Types of moderation actions that can be taken"""

    # Initial creation of moderation state
    create = enum.auto()
    # Approve content (make visible and listed)
    approve = enum.auto()
    # Hide content from everyone
    hide = enum.auto()
    # Flag for review
    flag = enum.auto()
    # Remove flag
    unflag = enum.auto()
    # Change a flag's priority
    set_priority = enum.auto()
    # Bulk visibility change applied to every item authored by a user
    bulk_set_visibility = enum.auto()


class ModerationObjectType(enum.Enum):
    """Types of objects that can be moderated"""

    host_request = enum.auto()
    group_chat = enum.auto()
    friend_request = enum.auto()
    event_occurrence = enum.auto()
    comment = enum.auto()
    reply = enum.auto()
    discussion = enum.auto()
    reference = enum.auto()
    public_trip = enum.auto()


class ModerationState(Base, kw_only=True):
    """
    Moderation state for any moderatable object on the platform

    This table tracks the visibility and listing state of content.
    Notifications are linked directly via the moderation_state_id FK on Notification.
    """

    __tablename__ = "moderation_states"

    id: Mapped[int] = mapped_column(
        BigInteger, moderation_seq, primary_key=True, server_default=moderation_seq.next_value(), init=False
    )

    # Generic reference to the moderated object
    object_type: Mapped[ModerationObjectType] = mapped_column(Enum(ModerationObjectType))
    object_id: Mapped[int] = mapped_column(BigInteger)

    visibility: Mapped[ModerationVisibility] = mapped_column(Enum(ModerationVisibility))

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), init=False
    )

    __table_args__ = (
        # Each object can only have one moderation state
        Index("ix_moderation_states_object", object_type, object_id, unique=True),
        # Covering index for visibility filtering - enables index-only scans in where_moderated_content_visible
        Index("ix_moderation_states_id_visibility", id, visibility),
        # Fast filtering by object type and visibility
        Index("ix_moderation_states_type_visibility", object_type, visibility),
    )

    def __repr__(self) -> str:
        return f"ModerationState(id={self.id}, type={self.object_type}, object_id={self.object_id}, visibility={self.visibility})"


class ModerationQueueItem(Base, kw_only=True):
    """
    Action items in the moderation queue

    This table tracks what moderators need to review. Items remain in the queue
    until they are resolved (linked to a ModerationLog entry).
    """

    __tablename__ = "moderation_queue"

    id: Mapped[int] = mapped_column(
        BigInteger, moderation_seq, primary_key=True, server_default=moderation_seq.next_value(), init=False
    )
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)

    time_created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    trigger: Mapped[ModerationTrigger] = mapped_column(Enum(ModerationTrigger))
    reason: Mapped[str] = mapped_column(String)

    priority: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0", default=0)

    # When resolved, this links to the log entry that resolved it
    resolved_by_log_id: Mapped[int | None] = mapped_column(ForeignKey("moderation_log.id"), index=True, default=None)

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


class ModerationLog(Base, kw_only=True):
    """
    History of moderation actions

    This table provides a complete audit trail of all moderation actions taken,
    including who performed the action and what changed.
    """

    __tablename__ = "moderation_log"

    id: Mapped[int] = mapped_column(
        BigInteger, moderation_seq, primary_key=True, server_default=moderation_seq.next_value(), init=False
    )
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)

    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    action: Mapped[ModerationAction] = mapped_column(Enum(ModerationAction))
    moderator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    # State changes (nullable - only include fields that changed)
    new_visibility: Mapped[ModerationVisibility | None] = mapped_column(Enum(ModerationVisibility), default=None)
    new_priority: Mapped[int | None] = mapped_column(Integer, default=None)

    # The queue item (flag) this action concerned, for flag-level actions
    queue_item_id: Mapped[int | None] = mapped_column(ForeignKey("moderation_queue.id"), index=True, default=None)

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


class ModeratedContent(Protocol):
    """A model governed by the UMS, identified by the moderation metadata it declares as class attributes."""

    __moderation_object_type__: ModerationObjectType
    __moderation_author_column__: str


@dataclass(frozen=True)
class ModeratedModel:
    """A model governed by the UMS, with its moderation metadata resolved."""

    object_type: ModerationObjectType
    model: type[ModeratedContent]
    author_column: ColumnElement[int]
    object_id_column: ColumnElement[int]
    moderation_state_id_column: ColumnElement[int]


@cache
def get_moderated_models() -> dict[ModerationObjectType, ModeratedModel]:
    """
    Maps each ModerationObjectType to its model and resolved moderation metadata.

    Discovered from every mapped model that declares __moderation_object_type__, so the moderation
    metadata stays on the models themselves rather than in a separate hand-maintained list.

    Ordered by model class name. registry.mappers is a frozenset, so iterating it orders Mapper objects by id(), which
    varies per process; callers build one OR branch per entry, so without sorting the same logical query is emitted
    with its branches in a different order in every process. That splits it across pg_stat_statements entries.
    """
    models: dict[ModerationObjectType, ModeratedModel] = {}
    for mapper in sorted(Base.registry.mappers, key=lambda m: m.class_.__name__):
        cls = mapper.class_
        if not hasattr(cls, "__moderation_object_type__"):
            continue
        model: type[ModeratedContent] = cls
        models[model.__moderation_object_type__] = ModeratedModel(
            object_type=model.__moderation_object_type__,
            model=model,
            author_column=mapper.columns[model.__moderation_author_column__],
            object_id_column=mapper.primary_key[0],
            moderation_state_id_column=mapper.columns["moderation_state_id"],
        )
    return models
