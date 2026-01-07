import enum
from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    func,
)
from sqlalchemy import LargeBinary as Binary
from sqlalchemy.ext.hybrid import hybrid_method, hybrid_property
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
from sqlalchemy.sql.elements import ColumnElement

from couchers.models.base import Base
from couchers.utils import date_in_timezone, now

if TYPE_CHECKING:
    from couchers.models.users import User


class StrongVerificationAttemptStatus(enum.Enum):
    ## full data states
    # completed, this now provides verification for a user
    succeeded = enum.auto()

    ## no data states
    # in progress: waiting for the user to scan the Iris code or open the app
    in_progress_waiting_on_user_to_open_app = enum.auto()
    # in progress: waiting for the user to scan MRZ or NFC/chip
    in_progress_waiting_on_user_in_app = enum.auto()
    # in progress, waiting for backend to pull verification data
    in_progress_waiting_on_backend = enum.auto()
    # failed, no data
    failed = enum.auto()

    # duplicate, at our end, has data
    duplicate = enum.auto()

    ## minimal data states
    # the data, except minimal deduplication data, was deleted
    deleted = enum.auto()


class PassportSex(enum.Enum):
    """
    We don't care about sex, we use gender on the platform. But passports apparently do.
    """

    male = enum.auto()
    female = enum.auto()
    unspecified = enum.auto()


class StrongVerificationAttempt(Base, kw_only=True):
    """
    An attempt to perform strong verification
    """

    __tablename__ = "strong_verification_attempts"

    # our verification id
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # this is returned in the callback, and we look up the attempt via this
    verification_attempt_token: Mapped[str] = mapped_column(String, unique=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    status: Mapped[StrongVerificationAttemptStatus] = mapped_column(
        Enum(StrongVerificationAttemptStatus),
        default=StrongVerificationAttemptStatus.in_progress_waiting_on_user_to_open_app,
    )

    ## full data
    has_full_data: Mapped[bool] = mapped_column(Boolean, default=False)
    # the data returned from iris, encrypted with a public key whose private key is kept offline
    passport_encrypted_data: Mapped[bytes | None] = mapped_column(Binary, default=None)
    passport_date_of_birth: Mapped[date | None] = mapped_column(Date, default=None)
    passport_sex: Mapped[PassportSex | None] = mapped_column(Enum(PassportSex), default=None)

    ## minimal data: this will not be deleted
    has_minimal_data: Mapped[bool] = mapped_column(Boolean, default=False)
    passport_expiry_date: Mapped[date | None] = mapped_column(Date, default=None)
    passport_nationality: Mapped[str | None] = mapped_column(String, default=None)
    # last three characters of the passport number
    passport_last_three_document_chars: Mapped[str | None] = mapped_column(String, default=None)

    iris_token: Mapped[str] = mapped_column(String, unique=True)
    iris_session_id: Mapped[int] = mapped_column(BigInteger, unique=True)

    passport_expiry_datetime = column_property(date_in_timezone(passport_expiry_date, "Etc/UTC"))  # type: ignore[arg-type]

    user: Mapped[User] = relationship(init=False)

    @hybrid_property
    def is_valid(self) -> bool:
        """
        This only checks whether the attempt is a success and the passport is not expired, use `has_strong_verification` for full check
        """
        return (self.status == StrongVerificationAttemptStatus.succeeded) and (self.passport_expiry_datetime >= now())

    @is_valid.inplace.expression
    @classmethod
    def _is_valid_expression(cls) -> ColumnElement[bool]:
        return (cls.status == StrongVerificationAttemptStatus.succeeded) & (
            func.coalesce(cls.passport_expiry_datetime >= func.now(), False)
        )

    @hybrid_property
    def is_visible(self) -> bool:
        return self.status != StrongVerificationAttemptStatus.deleted

    @hybrid_method
    def _raw_birthdate_match(self, user: User | type[User]) -> Any:
        """Does not check whether the SV attempt itself is not expired"""
        return self.passport_date_of_birth == user.birthdate

    @hybrid_method
    def matches_birthdate(self, user: User | type[User]) -> Any:
        return self.is_valid & self._raw_birthdate_match(user)

    @hybrid_method
    def _raw_gender_match(self, user: User | type[User]) -> Any:
        """Does not check whether the SV attempt itself is not expired"""
        return (
            ((user.gender == "Woman") & (self.passport_sex == PassportSex.female))  # type: ignore[operator]
            | ((user.gender == "Man") & (self.passport_sex == PassportSex.male))
            | (self.passport_sex == PassportSex.unspecified)
            | (user.has_passport_sex_gender_exception == True)
        )

    @hybrid_method
    def matches_gender(self, user: User | type[User]) -> Any:
        return self.is_valid & self._raw_gender_match(user)

    @hybrid_method
    def has_strong_verification(self, user: User | type[User]) -> Any:
        return self.is_valid & self._raw_birthdate_match(user) & self._raw_gender_match(user)

    __table_args__ = (
        # used to look up verification status for a user
        Index(
            "ix_strong_verification_attempts_current",
            user_id,
            passport_expiry_date,
            postgresql_where=status == StrongVerificationAttemptStatus.succeeded,
        ),
        # each passport can be verified only once
        Index(
            "ix_strong_verification_attempts_unique_succeeded",
            passport_expiry_date,
            passport_nationality,
            passport_last_three_document_chars,
            unique=True,
            postgresql_where=(
                (status == StrongVerificationAttemptStatus.succeeded)
                | (status == StrongVerificationAttemptStatus.deleted)
            ),
        ),
        # full data check
        CheckConstraint(
            "(has_full_data IS TRUE AND passport_encrypted_data IS NOT NULL AND passport_date_of_birth IS NOT NULL) OR \
             (has_full_data IS FALSE AND passport_encrypted_data IS NULL AND passport_date_of_birth IS NULL)",
            name="full_data_status",
        ),
        # minimal data check
        CheckConstraint(
            "(has_minimal_data IS TRUE AND passport_expiry_date IS NOT NULL AND passport_nationality IS NOT NULL AND passport_last_three_document_chars IS NOT NULL) OR \
             (has_minimal_data IS FALSE AND passport_expiry_date IS NULL AND passport_nationality IS NULL AND passport_last_three_document_chars IS NULL)",
            name="minimal_data_status",
        ),
        # note on implications: p => q iff ~p OR q
        # full data implies minimal data, has_minimal_data => has_full_data
        CheckConstraint(
            "(has_full_data IS FALSE) OR (has_minimal_data IS TRUE)",
            name="full_data_implies_minimal_data",
        ),
        # succeeded implies full data
        CheckConstraint(
            "(NOT (status = 'succeeded')) OR (has_full_data IS TRUE)",
            name="succeeded_implies_full_data",
        ),
        # in_progress/failed implies no_data
        CheckConstraint(
            "(NOT ((status = 'in_progress_waiting_on_user_to_open_app') OR (status = 'in_progress_waiting_on_user_in_app') OR (status = 'in_progress_waiting_on_backend') OR (status = 'failed'))) OR (has_minimal_data IS FALSE)",
            name="in_progress_failed_iris_implies_no_data",
        ),
        # deleted or duplicate implies minimal data
        CheckConstraint(
            "(NOT ((status = 'deleted') OR (status = 'duplicate'))) OR (has_minimal_data IS TRUE)",
            name="deleted_duplicate_implies_minimal_data",
        ),
    )


class StrongVerificationCallbackEvent(Base, kw_only=True):
    __tablename__ = "strong_verification_callback_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    verification_attempt_id: Mapped[int] = mapped_column(ForeignKey("strong_verification_attempts.id"), index=True)

    iris_status: Mapped[str] = mapped_column(String)
