from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class CouchsurfingComImportAttempt(Base, kw_only=True):
    """
    Records of Couchsurfing.com import attempts.

    Each attempt is logged regardless of success/failure, allowing users to have
    multiple import attempts over time.
    """

    __tablename__ = "couchsurfingcom_import_attempts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    success: Mapped[bool] = mapped_column(Boolean)

    # the raw JSON string as uploaded by the user (stored as-is to preserve original data even if invalid)
    raw_json: Mapped[str] = mapped_column(String)

    # old values of fields before the import (field_name -> old_value). The keys are fields of the User model.
    old_values: Mapped[dict[str, Any]] = mapped_column(JSONB)

    # new values of fields after the import (field_name -> new_value). The keys are fields of the User model.
    new_values: Mapped[dict[str, Any]] = mapped_column(JSONB)

    # warnings generated during import (localized)
    warnings: Mapped[list[str]] = mapped_column(JSONB)

    # errors encountered, if any (localized)
    errors: Mapped[list[str]] = mapped_column(JSONB)

    user: Mapped[User] = relationship("User", back_populates="couchsurfingcom_import_attempts", init=False)

    __table_args__ = (
        Index("ix_couchsurfingcom_import_attempts_user_id", "user_id"),
        Index("ix_couchsurfingcom_import_attempts_created", "created"),
    )
