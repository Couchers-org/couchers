import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Enum, ForeignKey, Index, Integer, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class ActivenessProbeStatus(enum.Enum):
    # no response yet
    pending = enum.auto()

    # didn't respond on time
    expired = enum.auto()

    # responded that they're still active
    still_active = enum.auto()

    # responded that they're no longer active
    no_longer_active = enum.auto()


class ActivenessProbe(Base, kw_only=True):
    """
    Activeness probes are used to gauge if users are still active: we send them a notification and ask them to respond,
    we use this data both to help indicate response rate, as well as to make sure only those who are actively hosting
    show up as such.
    """

    __tablename__ = "activeness_probes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    # the time this probe was initiated
    probe_initiated: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    # the number of reminders sent for this probe
    notifications_sent: Mapped[int] = mapped_column(Integer, server_default="0", init=False)

    # the time of response
    responded: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    # the response value
    response: Mapped[ActivenessProbeStatus] = mapped_column(
        Enum(ActivenessProbeStatus), default=ActivenessProbeStatus.pending
    )

    @hybrid_property
    def is_pending(self) -> bool:
        return self.responded == None

    user: Mapped[User] = relationship(init=False, back_populates="pending_activeness_probe")

    __table_args__ = (
        # a user can have at most one pending activeness probe at a time
        Index(
            "ix_activeness_probe_unique_pending_response",
            user_id,
            unique=True,
            postgresql_where=responded.is_(None),
        ),
        # response time is none iff response is pending
        CheckConstraint(
            "(responded IS NULL AND response = 'pending') OR (responded IS NOT NULL AND response != 'pending')",
            name="pending_has_no_responded",
        ),
    )
