import json
import logging
from datetime import timedelta

import grpc
import requests
from google.protobuf import empty_pb2
from sqlalchemy.sql import func, update
from user_agents import parse as user_agents_parse

from couchers import errors
from couchers.config import config
from couchers.constants import PHONE_REVERIFICATION_INTERVAL, SMS_CODE_ATTEMPTS, SMS_CODE_LIFETIME
from couchers.crypto import (
    b64decode,
    b64encode,
    hash_password,
    simple_decrypt,
    simple_encrypt,
    urlsafe_secure_token,
    verify_password,
    verify_token,
)
from couchers.helpers.geoip import geoip_approximate_location
from couchers.jobs.enqueue import queue_job
from couchers.metrics import (
    account_deletion_initiations_counter,
    strong_verification_completions_counter,
    strong_verification_data_deletions_counter,
    strong_verification_initiations_counter,
)
from couchers.models import (
    AccountDeletionReason,
    AccountDeletionToken,
    ContributeOption,
    ContributorForm,
    ModNote,
    StrongVerificationAttempt,
    StrongVerificationAttemptStatus,
    StrongVerificationCallbackEvent,
    User,
    UserSession,
)
from couchers.notifications.notify import notify
from couchers.phone import sms
from couchers.phone.check import is_e164_format, is_known_operator
from couchers.sql import couchers_select as select
from couchers.tasks import (
    maybe_send_contributor_form_email,
    send_account_deletion_report_email,
    send_email_changed_confirmation_to_new_email,
)
from couchers.utils import (
    Timestamp_from_datetime,
    dt_from_page_token,
    dt_to_page_token,
    is_valid_email,
    now,
    to_aware_datetime,
)
from proto import account_pb2, account_pb2_grpc, api_pb2, auth_pb2, iris_pb2_grpc, notification_data_pb2
from proto.google.api import httpbody_pb2
from proto.internal import jobs_pb2, verification_pb2

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

contributeoption2sql = {
    auth_pb2.CONTRIBUTE_OPTION_UNSPECIFIED: None,
    auth_pb2.CONTRIBUTE_OPTION_YES: ContributeOption.yes,
    auth_pb2.CONTRIBUTE_OPTION_MAYBE: ContributeOption.maybe,
    auth_pb2.CONTRIBUTE_OPTION_NO: ContributeOption.no,
}

contributeoption2api = {
    None: auth_pb2.CONTRIBUTE_OPTION_UNSPECIFIED,
    ContributeOption.yes: auth_pb2.CONTRIBUTE_OPTION_YES,
    ContributeOption.maybe: auth_pb2.CONTRIBUTE_OPTION_MAYBE,
    ContributeOption.no: auth_pb2.CONTRIBUTE_OPTION_NO,
}

MAX_PAGINATION_LENGTH = 50


def has_strong_verification(session, user):
    attempt = session.execute(
        select(StrongVerificationAttempt)
        .where(StrongVerificationAttempt.user_id == user.id)
        .where(StrongVerificationAttempt.is_valid)
        .order_by(StrongVerificationAttempt.passport_expiry_datetime.desc())
        .limit(1)
    ).scalar_one_or_none()
    if attempt:
        assert attempt.is_valid
        return attempt.has_strong_verification(user)
    return False


def mod_note_to_pb(note: ModNote):
    return account_pb2.ModNote(
        note_id=note.id,
        note_content=note.note_content,
        created=Timestamp_from_datetime(note.created),
        acknowledged=Timestamp_from_datetime(note.acknowledged) if note.acknowledged else None,
    )


def get_strong_verification_fields(session, db_user):
    out = dict(
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


def abort_on_invalid_password(password, context):
    """
    Internal utility function: given a password, aborts if password is unforgivably insecure
    """
    if len(password) < 8:
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PASSWORD_TOO_SHORT)

    if len(password) > 256:
        # Hey, what are you trying to do? Give us a DDOS attack?
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PASSWORD_TOO_LONG)

    # check for most common weak passwords (not meant to be an exhaustive check!)
    if password.lower() in ("password", "12345678", "couchers", "couchers1"):
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INSECURE_PASSWORD)


class Account(account_pb2_grpc.AccountServicer):
    def GetAccountInfo(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        return account_pb2.GetAccountInfoRes(
            username=user.username,
            email=user.email,
            phone=user.phone if (user.phone_is_verified or not user.phone_code_expired) else None,
            has_donated=user.has_donated,
            phone_verified=user.phone_is_verified,
            profile_complete=user.has_completed_profile,
            timezone=user.timezone,
            is_superuser=user.is_superuser,
            **get_strong_verification_fields(session, user),
        )

    def ChangePasswordV2(self, request, context, session):
        """
        Changes the user's password. They have to confirm their old password just in case.

        If they didn't have an old password previously, then we don't check that.
        """
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        if not verify_password(user.hashed_password, request.old_password):
            # wrong password
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_PASSWORD)

        abort_on_invalid_password(request.new_password, context)
        user.hashed_password = hash_password(request.new_password)

        session.commit()

        notify(
            session,
            user_id=user.id,
            topic_action="password:change",
        )

        return empty_pb2.Empty()

    def ChangeEmailV2(self, request, context, session):
        """
        Change the user's email address.

        If the user has a password, a notification is sent to the old email, and a confirmation is sent to the new one.

        Otherwise they need to confirm twice, via an email sent to each of their old and new emails.

        In all confirmation emails, the user must click on the confirmation link.
        """
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        # check password first
        if not verify_password(user.hashed_password, request.password):
            # wrong password
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_PASSWORD)

        # not a valid email
        if not is_valid_email(request.new_email):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)

        # email already in use (possibly by this user)
        if session.execute(select(User).where(User.email == request.new_email)).scalar_one_or_none():
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)

        user.new_email = request.new_email
        user.new_email_token = urlsafe_secure_token()
        user.new_email_token_created = now()
        user.new_email_token_expiry = now() + timedelta(hours=2)

        send_email_changed_confirmation_to_new_email(session, user)

        # will still go into old email
        notify(
            session,
            user_id=user.id,
            topic_action="email_address:change",
            data=notification_data_pb2.EmailAddressChange(
                new_email=request.new_email,
            ),
        )

        # session autocommit
        return empty_pb2.Empty()

    def FillContributorForm(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        form = request.contributor_form

        form = ContributorForm(
            user=user,
            ideas=form.ideas or None,
            features=form.features or None,
            experience=form.experience or None,
            contribute=contributeoption2sql[form.contribute],
            contribute_ways=form.contribute_ways,
            expertise=form.expertise or None,
        )

        session.add(form)
        session.flush()
        maybe_send_contributor_form_email(session, form)

        user.filled_contributor_form = True

        return empty_pb2.Empty()

    def GetContributorFormInfo(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        return account_pb2.GetContributorFormInfoRes(
            filled_contributor_form=user.filled_contributor_form,
        )

    def ChangePhone(self, request, context, session):
        phone = request.phone
        # early quick validation
        if phone and not is_e164_format(phone):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_PHONE)

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if not user.has_donated:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NOT_DONATED)

        if not phone:
            user.phone = None
            user.phone_verification_verified = None
            user.phone_verification_token = None
            user.phone_verification_attempts = 0
            return empty_pb2.Empty()

        if not is_known_operator(phone):
            context.abort(grpc.StatusCode.UNIMPLEMENTED, errors.UNRECOGNIZED_PHONE_NUMBER)

        if now() - user.phone_verification_sent < PHONE_REVERIFICATION_INTERVAL:
            context.abort(grpc.StatusCode.RESOURCE_EXHAUSTED, errors.REVERIFICATION_TOO_EARLY)

        token = sms.generate_random_code()
        result = sms.send_sms(phone, sms.format_message(token))

        if result == "success":
            user.phone = phone
            user.phone_verification_verified = None
            user.phone_verification_token = token
            user.phone_verification_sent = now()
            user.phone_verification_attempts = 0

            notify(
                session,
                user_id=user.id,
                topic_action="phone_number:change",
                data=notification_data_pb2.PhoneNumberChange(
                    phone=phone,
                ),
            )

            return empty_pb2.Empty()

        context.abort(grpc.StatusCode.UNIMPLEMENTED, result)

    def VerifyPhone(self, request, context, session):
        if not sms.looks_like_a_code(request.token):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.WRONG_SMS_CODE)

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if user.phone_verification_token is None:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NO_PENDING_VERIFICATION)

        if now() - user.phone_verification_sent > SMS_CODE_LIFETIME:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NO_PENDING_VERIFICATION)

        if user.phone_verification_attempts > SMS_CODE_ATTEMPTS:
            context.abort(grpc.StatusCode.RESOURCE_EXHAUSTED, errors.TOO_MANY_SMS_CODE_ATTEMPTS)

        if not verify_token(request.token, user.phone_verification_token):
            user.phone_verification_attempts += 1
            session.commit()
            context.abort(grpc.StatusCode.NOT_FOUND, errors.WRONG_SMS_CODE)

        # Delete verifications from everyone else that has this number
        session.execute(
            update(User)
            .where(User.phone == user.phone)
            .where(User.id != context.user_id)
            .values(
                {
                    "phone_verification_verified": None,
                    "phone_verification_attempts": 0,
                    "phone_verification_token": None,
                    "phone": None,
                }
            )
            .execution_options(synchronize_session=False)
        )

        user.phone_verification_token = None
        user.phone_verification_verified = now()
        user.phone_verification_attempts = 0

        notify(
            session,
            user_id=user.id,
            topic_action="phone_number:verify",
            data=notification_data_pb2.PhoneNumberVerify(
                phone=user.phone,
            ),
        )

        return empty_pb2.Empty()

    def InitiateStrongVerification(self, request, context, session):
        if not config["ENABLE_STRONG_VERIFICATION"]:
            context.abort(grpc.StatusCode.UNAVAILABLE, errors.STRONG_VERIFICATION_DISABLED)

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        existing_verification = session.execute(
            select(StrongVerificationAttempt)
            .where(StrongVerificationAttempt.user_id == user.id)
            .where(StrongVerificationAttempt.is_valid)
        ).scalar_one_or_none()
        if existing_verification:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.STRONG_VERIFICATION_ALREADY_VERIFIED)

        strong_verification_initiations_counter.labels(user.gender).inc()

        verification_attempt_token = urlsafe_secure_token()
        # this is the iris reference data, they will return this on every callback, it also doubles as webhook auth given lack of it otherwise
        reference = b64encode(
            simple_encrypt(
                "iris_callback",
                verification_pb2.VerificationReferencePayload(
                    verification_attempt_token=verification_attempt_token,
                    user_id=user.id,
                ).SerializeToString(),
            )
        )
        response = requests.post(
            "https://passportreader.app/api/v1/session.create",
            auth=(config["IRIS_ID_PUBKEY"], config["IRIS_ID_SECRET"]),
            json={
                "callback_url": f"{config['BACKEND_BASE_URL']}/iris/webhook",
                "face_verification": False,
                "reference": reference,
            },
            timeout=10,
        )
        if response.status_code != 200:
            raise Exception(f"Iris didn't return 200: {response.text}")
        iris_session_id = response.json()["id"]
        token = response.json()["token"]
        url = f"iris:///?token={token}"
        verification_attempt = StrongVerificationAttempt(
            user_id=user.id,
            verification_attempt_token=verification_attempt_token,
            iris_session_id=iris_session_id,
            iris_token=token,
        )
        session.add(verification_attempt)

        return account_pb2.InitiateStrongVerificationRes(
            verification_attempt_token=verification_attempt_token,
            iris_url=url,
        )

    def GetStrongVerificationAttemptStatus(self, request, context, session):
        verification_attempt = session.execute(
            select(StrongVerificationAttempt)
            .where(StrongVerificationAttempt.user_id == context.user_id)
            .where(StrongVerificationAttempt.is_visible)
            .where(StrongVerificationAttempt.verification_attempt_token == request.verification_attempt_token)
        ).scalar_one_or_none()
        if not verification_attempt:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.STRONG_VERIFICATION_ATTEMPT_NOT_FOUND)
        status_to_pb = {
            StrongVerificationAttemptStatus.succeeded: account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_SUCCEEDED,
            StrongVerificationAttemptStatus.in_progress_waiting_on_user_to_open_app: account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_USER_TO_OPEN_APP,
            StrongVerificationAttemptStatus.in_progress_waiting_on_user_in_app: account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_USER_IN_APP,
            StrongVerificationAttemptStatus.in_progress_waiting_on_backend: account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_BACKEND,
            StrongVerificationAttemptStatus.failed: account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_FAILED,
        }
        return account_pb2.GetStrongVerificationAttemptStatusRes(
            status=status_to_pb.get(
                verification_attempt.status, account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_UNKNOWN
            ),
        )

    def DeleteStrongVerificationData(self, request, context, session):
        verification_attempts = (
            session.execute(
                select(StrongVerificationAttempt)
                .where(StrongVerificationAttempt.user_id == context.user_id)
                .where(StrongVerificationAttempt.has_full_data)
            )
            .scalars()
            .all()
        )
        for verification_attempt in verification_attempts:
            verification_attempt.status = StrongVerificationAttemptStatus.deleted
            verification_attempt.has_full_data = False
            verification_attempt.passport_encrypted_data = None
            verification_attempt.passport_date_of_birth = None
            verification_attempt.passport_sex = None
        session.flush()
        # double check:
        verification_attempts = (
            session.execute(
                select(StrongVerificationAttempt)
                .where(StrongVerificationAttempt.user_id == context.user_id)
                .where(StrongVerificationAttempt.has_full_data)
            )
            .scalars()
            .all()
        )
        assert len(verification_attempts) == 0

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        strong_verification_data_deletions_counter.labels(user.gender).inc()

        return empty_pb2.Empty()

    def DeleteAccount(self, request, context, session):
        """
        Triggers email with token to confirm deletion

        Frontend should confirm via unique string (i.e. username) before this is called
        """
        if not request.confirm:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.MUST_CONFIRM_ACCOUNT_DELETE)

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        reason = request.reason.strip()
        if reason:
            reason = AccountDeletionReason(user_id=user.id, reason=reason)
            session.add(reason)
            session.flush()
            send_account_deletion_report_email(session, reason)

        token = AccountDeletionToken(token=urlsafe_secure_token(), user=user, expiry=now() + timedelta(hours=2))

        notify(
            session,
            user_id=user.id,
            topic_action="account_deletion:start",
            data=notification_data_pb2.AccountDeletionStart(
                deletion_token=token.token,
            ),
        )
        session.add(token)

        account_deletion_initiations_counter.labels(user.gender).inc()

        return empty_pb2.Empty()

    def ListModNotes(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        notes = (
            session.execute(select(ModNote).where(ModNote.user_id == user.id).order_by(ModNote.created.asc()))
            .scalars()
            .all()
        )

        return account_pb2.ListModNotesRes(mod_notes=[mod_note_to_pb(note) for note in notes])

    def ListActiveSessions(self, request, context, session):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        page_token = dt_from_page_token(request.page_token) if request.page_token else now()

        user_sessions = (
            session.execute(
                select(UserSession)
                .where(UserSession.user_id == context.user_id)
                .where(UserSession.is_valid)
                .where(UserSession.is_api_key == False)
                .where(UserSession.last_seen <= page_token)
                .order_by(UserSession.last_seen.desc())
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )

        (token, token_expiry) = context.token

        def _active_session_to_pb(user_session):
            user_agent = user_agents_parse(user_session.user_agent or "")
            return account_pb2.ActiveSession(
                created=Timestamp_from_datetime(user_session.created),
                expiry=Timestamp_from_datetime(user_session.expiry),
                last_seen=Timestamp_from_datetime(user_session.last_seen),
                operating_system=user_agent.os.family,
                browser=user_agent.browser.family,
                device=user_agent.device.family,
                approximate_location=geoip_approximate_location(user_session.ip_address) or "Unknown",
                is_current_session=user_session.token == token,
            )

        return account_pb2.ListActiveSessionsRes(
            active_sessions=list(map(_active_session_to_pb, user_sessions[:page_size])),
            next_page_token=dt_to_page_token(user_sessions[-1].last_seen) if len(user_sessions) > page_size else None,
        )

    def LogOutSession(self, request, context, session):
        (token, token_expiry) = context.token

        session.execute(
            update(UserSession)
            .where(UserSession.token != token)
            .where(UserSession.user_id == context.user_id)
            .where(UserSession.is_valid)
            .where(UserSession.is_api_key == False)
            .where(UserSession.created == to_aware_datetime(request.created))
            .values(expiry=func.now())
            .execution_options(synchronize_session=False)
        )
        return empty_pb2.Empty()

    def LogOutOtherSessions(self, request, context, session):
        if not request.confirm:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.MUST_CONFIRM_LOGOUT_OTHER_SESSIONS)

        (token, token_expiry) = context.token

        session.execute(
            update(UserSession)
            .where(UserSession.token != token)
            .where(UserSession.user_id == context.user_id)
            .where(UserSession.is_valid)
            .where(UserSession.is_api_key == False)
            .values(expiry=func.now())
            .execution_options(synchronize_session=False)
        )
        return empty_pb2.Empty()


class Iris(iris_pb2_grpc.IrisServicer):
    def Webhook(self, request, context, session):
        json_data = json.loads(request.data)
        reference_payload = verification_pb2.VerificationReferencePayload.FromString(
            simple_decrypt("iris_callback", b64decode(json_data["session_referenace"]))
        )
        # if we make it past the decrypt, we consider this webhook authenticated
        verification_attempt_token = reference_payload.verification_attempt_token
        user_id = reference_payload.user_id

        verification_attempt = session.execute(
            select(StrongVerificationAttempt)
            .where(StrongVerificationAttempt.user_id == reference_payload.user_id)
            .where(StrongVerificationAttempt.verification_attempt_token == reference_payload.verification_attempt_token)
            .where(StrongVerificationAttempt.iris_session_id == json_data["session_id"])
        ).scalar_one()
        iris_status = json_data["session_state"]
        session.add(
            StrongVerificationCallbackEvent(
                verification_attempt_id=verification_attempt.id,
                iris_status=iris_status,
            )
        )
        if iris_status == "INITIATED":
            # the user opened the session in the app
            verification_attempt.status = StrongVerificationAttemptStatus.in_progress_waiting_on_user_in_app
        elif iris_status == "COMPLETED":
            verification_attempt.status = StrongVerificationAttemptStatus.in_progress_waiting_on_backend
        elif iris_status == "APPROVED":
            strong_verification_completions_counter.inc()
            verification_attempt.status = StrongVerificationAttemptStatus.in_progress_waiting_on_backend
            session.commit()
            # background worker will go and sort this one out
            queue_job(
                session,
                job_type="finalize_strong_verification",
                payload=jobs_pb2.FinalizeStrongVerificationPayload(verification_attempt_id=verification_attempt.id),
            )
        elif iris_status in ["FAILED", "ABORTED", "REJECTED"]:
            verification_attempt.status = StrongVerificationAttemptStatus.failed

        return httpbody_pb2.HttpBody(
            content_type="application/json",
            # json.dumps escapes non-ascii characters
            data=json.dumps({"success": True}).encode("ascii"),
        )
