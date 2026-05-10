import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Enum, ForeignKey, Index, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.host_requests import HostRequest
    from couchers.models.users import User


class ReminderType(enum.Enum):
    complete_profile = enum.auto()
    complete_verification = enum.auto()
    respond_to_host_request = enum.auto()
    write_reference = enum.auto()


class ReminderDismissal(Base, kw_only=True):
    """
    Records that a user has dismissed a dashboard reminder.

    For global reminders (complete_profile, complete_verification), host_request_id is NULL
    and the dismissal expires after a cooldown (see REMINDER_DISMISSAL_COOLDOWN in account.py).
    For per-entity reminders (respond_to_host_request, write_reference), host_request_id is
    set and the dismissal is permanent for that host request.
    """

    __tablename__ = "reminder_dismissals"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    reminder_type: Mapped[ReminderType] = mapped_column(Enum(ReminderType))
    host_request_id: Mapped[int | None] = mapped_column(ForeignKey("host_requests.id"), default=None)
    dismissed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    user: Mapped[User] = relationship(init=False)
    host_request: Mapped[HostRequest | None] = relationship(init=False)

    __table_args__ = (
        # One dismissal per (user, type) for global reminders.
        Index(
            "ix_reminder_dismissals_global_unique",
            "user_id",
            "reminder_type",
            unique=True,
            postgresql_where=text("host_request_id IS NULL"),
        ),
        # One dismissal per (user, type, host_request_id) for entity reminders.
        Index(
            "ix_reminder_dismissals_entity_unique",
            "user_id",
            "reminder_type",
            "host_request_id",
            unique=True,
            postgresql_where=text("host_request_id IS NOT NULL"),
        ),
        # Lookup index for filtering reminders.
        Index("ix_reminder_dismissals_user_type", "user_id", "reminder_type"),
        # host_request_id must be NULL for global types and set for entity types.
        CheckConstraint(
            "(reminder_type IN ('complete_profile', 'complete_verification') AND host_request_id IS NULL) "
            "OR (reminder_type IN ('respond_to_host_request', 'write_reference') AND host_request_id IS NOT NULL)",
            name="entity_consistency",
        ),
    )
