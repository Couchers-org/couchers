import enum

from sqlalchemy import BigInteger, CheckConstraint, Column, DateTime, Enum, ForeignKey, Index, Integer, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

from couchers.models.base import Base


class ActivenessProbeStatus(enum.Enum):
    # no response yet
    pending = enum.auto()

    # didn't respond on time
    expired = enum.auto()

    # responded that they're still active
    still_active = enum.auto()

    # responded that they're no longer active
    no_longer_active = enum.auto()


class ActivenessProbe(Base):
    """
    Activeness probes are used to gauge if users are still active: we send them a notification and ask them to respond,
    we use this data both to help indicate response rate, as well as to make sure only those who are actively hosting
    show up as such.
    """

    __tablename__ = "activeness_probes"

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    # the time this probe was initiated
    probe_initiated = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # the number of reminders sent for this probe
    notifications_sent = Column(Integer, nullable=False, server_default="0")

    # the time of response
    responded = Column(DateTime(timezone=True), nullable=True, default=None)
    # the response value
    response = Column(Enum(ActivenessProbeStatus), nullable=False, default=ActivenessProbeStatus.pending)

    @hybrid_property
    def is_pending(self):
        return self.responded == None

    user = relationship("User", back_populates="pending_activeness_probe")

    __table_args__ = (
        # a user can have at most one pending activeness probe at a time
        Index(
            "ix_activeness_probe_unique_pending_response",
            user_id,
            unique=True,
            postgresql_where=responded == None,
        ),
        # response time is none iff response is pending
        CheckConstraint(
            "(responded IS NULL AND response = 'pending') OR (responded IS NOT NULL AND response != 'pending')",
            name="pending_has_no_responded",
        ),
    )
