from sqlalchemy.orm import Session

from couchers.models import StrongVerificationAttempt, User
from couchers.sql import couchers_select as select
from proto import api_pb2


def has_strong_verification(session: Session, user: User) -> bool:
    attempt = session.execute(
        select(StrongVerificationAttempt)
        .where(StrongVerificationAttempt.user_id == user.id)
        .where(StrongVerificationAttempt.is_valid)
        .order_by(StrongVerificationAttempt.passport_expiry_datetime.desc())
        .limit(1)
    ).scalar_one_or_none()
    if attempt:
        assert attempt.is_valid
        return bool(attempt.has_strong_verification(user))
    return False


def get_strong_verification_fields(session: Session, db_user: User) -> dict[str, int | bool]:
    out: dict[str, int | bool] = dict(
        birthdate_verification_status=api_pb2.BIRTHDATE_VERIFICATION_STATUS_UNVERIFIED,
        gender_verification_status=api_pb2.GENDER_VERIFICATION_STATUS_UNVERIFIED,
        has_strong_verification=False,
    )
    attempt = session.execute(
        select(StrongVerificationAttempt)
        .where(StrongVerificationAttempt.user_id == db_user.id)
        .where(StrongVerificationAttempt.is_valid)
        .order_by(StrongVerificationAttempt.passport_expiry_datetime.desc())
        .limit(1)
    ).scalar_one_or_none()
    if attempt:
        assert attempt.is_valid
        if attempt.matches_birthdate(db_user):
            out["birthdate_verification_status"] = api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        else:
            out["birthdate_verification_status"] = api_pb2.BIRTHDATE_VERIFICATION_STATUS_MISMATCH

        if attempt.matches_gender(db_user):
            out["gender_verification_status"] = api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED
        else:
            out["gender_verification_status"] = api_pb2.GENDER_VERIFICATION_STATUS_MISMATCH

        out["has_strong_verification"] = attempt.has_strong_verification(db_user)

        assert out["has_strong_verification"] == (
            out["birthdate_verification_status"] == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
            and out["gender_verification_status"] == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED
        )
    return out
