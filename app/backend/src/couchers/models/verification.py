import enum

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
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
from sqlalchemy.orm import column_property, relationship

from couchers.models.base import Base
from couchers.utils import date_in_timezone, now


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


class StrongVerificationAttempt(Base):
    """
    An attempt to perform strong verification
    """

    __tablename__ = "strong_verification_attempts"

    # our verification id
    id = Column(BigInteger, primary_key=True)

    # this is returned in the callback, and we look up the attempt via this
    verification_attempt_token = Column(String, nullable=False, unique=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    status = Column(
        Enum(StrongVerificationAttemptStatus),
        nullable=False,
        default=StrongVerificationAttemptStatus.in_progress_waiting_on_user_to_open_app,
    )

    ## full data
    has_full_data = Column(Boolean, nullable=False, default=False)
    # the data returned from iris, encrypted with a public key whose private key is kept offline
    passport_encrypted_data = Column(Binary, nullable=True)
    passport_date_of_birth = Column(Date, nullable=True)
    passport_sex = Column(Enum(PassportSex), nullable=True)

    ## minimal data: this will not be deleted
    has_minimal_data = Column(Boolean, nullable=False, default=False)
    passport_expiry_date = Column(Date, nullable=True)
    passport_nationality = Column(String, nullable=True)
    # last three characters of the passport number
    passport_last_three_document_chars = Column(String, nullable=True)

    iris_token = Column(String, nullable=False, unique=True)
    iris_session_id = Column(BigInteger, nullable=False, unique=True)

    passport_expiry_datetime = column_property(date_in_timezone(passport_expiry_date, "Etc/UTC"))

    user = relationship("User")

    @hybrid_property
    def is_valid(self):
        """
        This only checks whether the attempt is a success and the passport is not expired, use `has_strong_verification` for full check
        """
        return (self.status == StrongVerificationAttemptStatus.succeeded) and (self.passport_expiry_datetime >= now())

    @is_valid.expression
    def is_valid(cls):
        return (cls.status == StrongVerificationAttemptStatus.succeeded) & (
            func.coalesce(cls.passport_expiry_datetime >= func.now(), False)
        )

    @hybrid_property
    def is_visible(self):
        return self.status != StrongVerificationAttemptStatus.deleted

    @hybrid_method
    def _raw_birthdate_match(self, user):
        """Does not check whether the SV attempt itself is not expired"""
        return self.passport_date_of_birth == user.birthdate

    @hybrid_method
    def matches_birthdate(self, user):
        return self.is_valid & self._raw_birthdate_match(user)

    @hybrid_method
    def _raw_gender_match(self, user):
        """Does not check whether the SV attempt itself is not expired"""
        return (
            ((user.gender == "Woman") & (self.passport_sex == PassportSex.female))
            | ((user.gender == "Man") & (self.passport_sex == PassportSex.male))
            | (self.passport_sex == PassportSex.unspecified)
            | (user.has_passport_sex_gender_exception == True)
        )

    @hybrid_method
    def matches_gender(self, user):
        return self.is_valid & self._raw_gender_match(user)

    @hybrid_method
    def has_strong_verification(self, user):
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


class StrongVerificationCallbackEvent(Base):
    __tablename__ = "strong_verification_callback_events"

    id = Column(BigInteger, primary_key=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    verification_attempt_id = Column(ForeignKey("strong_verification_attempts.id"), nullable=False, index=True)

    iris_status = Column(String, nullable=False)
