import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
    text,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.elements import ColumnElement

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class PostalVerificationStatus(enum.Enum):
    # User has initiated, awaiting address confirmation
    pending_address_confirmation = enum.auto()
    # Address confirmed, postcard being sent
    in_progress = enum.auto()
    # Postcard sent, awaiting user to enter code
    awaiting_verification = enum.auto()
    # Successfully verified
    succeeded = enum.auto()
    # Failed (too many wrong attempts or expired)
    failed = enum.auto()
    # Cancelled by user
    cancelled = enum.auto()


class PostalVerificationAttempt(Base, kw_only=True):
    """
    An attempt to perform postal verification by sending a postcard with a code.
    """

    __tablename__ = "postal_verification_attempts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    status: Mapped[PostalVerificationStatus] = mapped_column(
        Enum(PostalVerificationStatus),
        default=PostalVerificationStatus.pending_address_confirmation,
    )

    # Address fields (normalized/validated)
    # Required: address_line_1, city, country
    # Optional: address_line_2, state, postal_code (varies by country)
    address_line_1: Mapped[str] = mapped_column(String)
    address_line_2: Mapped[str | None] = mapped_column(String, default=None)
    city: Mapped[str] = mapped_column(String)
    state: Mapped[str | None] = mapped_column(String, default=None)
    postal_code: Mapped[str | None] = mapped_column(String, default=None)
    country: Mapped[str] = mapped_column(String)  # ISO 3166-1 alpha-2

    # The original address as entered by user (for audit), stored as JSON
    original_address_json: Mapped[str | None] = mapped_column(String, default=None)

    # Verification code (6 chars, uppercase alphanumeric)
    verification_code: Mapped[str | None] = mapped_column(String, default=None)

    # Timestamps
    address_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    postcard_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    # Code entry attempts
    code_attempts: Mapped[int] = mapped_column(Integer, server_default=text("0"), init=False)

    # Hybrid properties
    @hybrid_property
    def is_valid(self) -> bool:
        return self.status == PostalVerificationStatus.succeeded

    @is_valid.inplace.expression
    @classmethod
    def _is_valid_expression(cls) -> ColumnElement[bool]:
        return cls.status == PostalVerificationStatus.succeeded

    # Relationships
    user: Mapped[User] = relationship(init=False)

    # Constraints
    __table_args__ = (
        # Only one active attempt per user at a time
        Index(
            "ix_postal_verification_one_active_per_user",
            user_id,
            unique=True,
            postgresql_where=(
                (status == PostalVerificationStatus.pending_address_confirmation)
                | (status == PostalVerificationStatus.in_progress)
                | (status == PostalVerificationStatus.awaiting_verification)
            ),
        ),
        # Index for looking up verification status for a user
        Index(
            "ix_postal_verification_attempts_current",
            user_id,
            postgresql_where=status == PostalVerificationStatus.succeeded,
        ),
        # Code must be set when in_progress or later (except cancelled)
        CheckConstraint(
            "(status IN ('pending_address_confirmation', 'cancelled') AND verification_code IS NULL) OR "
            "(status IN ('in_progress', 'awaiting_verification', 'succeeded', 'failed') AND verification_code IS NOT NULL)",
            name="postal_verification_code_status",
        ),
        # verified_at must be set when succeeded
        CheckConstraint(
            "(status != 'succeeded') OR (verified_at IS NOT NULL)",
            name="postal_verification_verified_at_status",
        ),
        # postcard_sent_at must be set when awaiting_verification or succeeded
        CheckConstraint(
            "(status NOT IN ('awaiting_verification', 'succeeded')) OR (postcard_sent_at IS NOT NULL)",
            name="postal_verification_postcard_sent_status",
        ),
    )
