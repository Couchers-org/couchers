import json
import logging
from datetime import timedelta
from urllib.parse import urlencode

import grpc
import requests
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import func, update
from user_agents import parse as user_agents_parse

from couchers import urls
from couchers.config import config
from couchers.constants import DONATION_DRIVE_START, PHONE_REVERIFICATION_INTERVAL, SMS_CODE_ATTEMPTS, SMS_CODE_LIFETIME
from couchers.context import CouchersContext
from couchers.crypto import (
    b64decode,
    b64encode,
    generate_invite_code,
    hash_password,
    simple_decrypt,
    simple_encrypt,
    urlsafe_secure_token,
    verify_password,
    verify_token,
)
from couchers.experimentation import check_gate
from couchers.helpers.geoip import geoip_approximate_location
from couchers.helpers.strong_verification import get_strong_verification_fields, has_strong_verification
from couchers.jobs.enqueue import queue_job
from couchers.jobs.handlers import finalize_strong_verification
from couchers.materialized_views import LiteUser
from couchers.metrics import (
    account_deletion_initiations_counter,
    strong_verification_data_deletions_counter,
    strong_verification_initiations_counter,
)
from couchers.models import (
    AccountDeletionReason,
    AccountDeletionToken,
    ContributeOption,
    ContributorForm,
    HostRequest,
    HostRequestStatus,
    InviteCode,
    ModNote,
    ProfilePublicVisibility,
    StrongVerificationAttempt,
    StrongVerificationAttemptStatus,
    StrongVerificationCallbackEvent,
    User,
    UserSession,
    Volunteer,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.notify import notify
from couchers.phone import sms
from couchers.phone.check import is_e164_format, is_known_operator
from couchers.proto import account_pb2, account_pb2_grpc, auth_pb2, iris_pb2_grpc, notification_data_pb2
from couchers.proto.google.api import httpbody_pb2
from couchers.proto.internal import jobs_pb2, verification_pb2
from couchers.servicers.api import lite_user_to_pb
from couchers.servicers.public import format_volunteer_link
from couchers.servicers.references import get_pending_references_to_write, reftype2api
from couchers.sql import where_moderated_content_visible, where_users_column_visible
from couchers.tasks import (
    maybe_send_contributor_form_email,
    send_account_deletion_report_email,
    send_email_changed_confirmation_to_new_email,
)
from couchers.utils import (
    Timestamp_from_datetime,
    create_lang_cookie,
    date_to_api,
    dt_from_page_token,
    dt_to_page_token,
    is_valid_email,
    now,
    to_aware_datetime,
)

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

profilepublicitysetting2sql = {
    account_pb2.PROFILE_PUBLIC_VISIBILITY_UNKNOWN: None,
    account_pb2.PROFILE_PUBLIC_VISIBILITY_NOTHING: ProfilePublicVisibility.nothing,
    account_pb2.PROFILE_PUBLIC_VISIBILITY_MAP_ONLY: ProfilePublicVisibility.map_only,
    account_pb2.PROFILE_PUBLIC_VISIBILITY_LIMITED: ProfilePublicVisibility.limited,
    account_pb2.PROFILE_PUBLIC_VISIBILITY_MOST: ProfilePublicVisibility.most,
    account_pb2.PROFILE_PUBLIC_VISIBILITY_FULL: ProfilePublicVisibility.full,
}

profilepublicitysetting2api = {
    None: account_pb2.PROFILE_PUBLIC_VISIBILITY_UNKNOWN,
    ProfilePublicVisibility.nothing: account_pb2.PROFILE_PUBLIC_VISIBILITY_NOTHING,
    ProfilePublicVisibility.map_only: account_pb2.PROFILE_PUBLIC_VISIBILITY_MAP_ONLY,
    ProfilePublicVisibility.limited: account_pb2.PROFILE_PUBLIC_VISIBILITY_LIMITED,
    ProfilePublicVisibility.most: account_pb2.PROFILE_PUBLIC_VISIBILITY_MOST,
    ProfilePublicVisibility.full: account_pb2.PROFILE_PUBLIC_VISIBILITY_FULL,
}

MAX_PAGINATION_LENGTH = 50


def mod_note_to_pb(note: ModNote) -> account_pb2.ModNote:
    return account_pb2.ModNote(
        note_id=note.id,
        note_content=note.note_content,
        created=Timestamp_from_datetime(note.created),
        acknowledged=Timestamp_from_datetime(note.acknowledged) if note.acknowledged else None,
    )


def abort_on_invalid_password(password: str, context: CouchersContext) -> None:
    """
    Internal utility function: given a password, aborts if password is unforgivably insecure
    """
    if len(password) < 8:
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "password_too_short")

    if len(password) > 256:
        # Hey, what are you trying to do? Give us a DDOS attack?
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "password_too_long")

    # check for the most common weak passwords (not meant to be an exhaustive check!)
    if password.lower() in ("password", "12345678", "couchers", "couchers1"):
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "insecure_password")


def _volunteer_info_to_pb(volunteer: Volunteer, username: str) -> account_pb2.GetMyVolunteerInfoRes:
    return account_pb2.GetMyVolunteerInfoRes(
        display_name=volunteer.display_name,
        display_location=volunteer.display_location,
        role=volunteer.role,
        started_volunteering=date_to_api(volunteer.started_volunteering),
        stopped_volunteering=date_to_api(volunteer.stopped_volunteering) if volunteer.stopped_volunteering else None,
        show_on_team_page=volunteer.show_on_team_page,
        **format_volunteer_link(volunteer, username),
    )


class Account(account_pb2_grpc.AccountServicer):
    def GetAccountInfo(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> account_pb2.GetAccountInfoRes:
        user, volunteer = session.execute(
            select(User, Volunteer).outerjoin(Volunteer, Volunteer.user_id == User.id).where(User.id == context.user_id)
        ).one()

        # Test experimentation integration - check if user is in the test gate
        # Create 'test_statsig_integration' in Statsig console to test
        test_gate = check_gate(context, "test_statsig_integration")
        logger.info(f"Experimentation gate 'test_statsig_integration' for user {user.id}: {test_gate}")

        should_show_donation_banner = DONATION_DRIVE_START is not None and (
            user.last_donated is None or user.last_donated < DONATION_DRIVE_START
        )

        return account_pb2.GetAccountInfoRes(
            username=user.username,
            email=user.email,
            phone=user.phone if (user.phone_is_verified or not user.phone_code_expired) else None,
            has_donated=user.last_donated is not None,
            phone_verified=user.phone_is_verified,
            profile_complete=user.has_completed_profile,
            my_home_complete=user.has_completed_my_home,
            timezone=user.timezone,
            is_superuser=user.is_superuser,
            ui_language_preference=user.ui_language_preference,
            profile_public_visibility=profilepublicitysetting2api[user.public_visibility],
            is_volunteer=volunteer is not None,
            should_show_donation_banner=should_show_donation_banner,
            **get_strong_verification_fields(session, user),
        )

    def ChangePasswordV2(
        self, request: account_pb2.ChangePasswordV2Req, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        """
        Changes the user's password. They have to confirm their old password just in case.

        If they didn't have an old password previously, then we don't check that.
        """
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        if not verify_password(user.hashed_password, request.old_password):
            # wrong password
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_password")

        abort_on_invalid_password(request.new_password, context)
        user.hashed_password = hash_password(request.new_password)

        session.commit()

        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.password__change,
            key="",
        )

        return empty_pb2.Empty()

    def ChangeEmailV2(
        self, request: account_pb2.ChangeEmailV2Req, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
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
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_password")

        # not a valid email
        if not is_valid_email(request.new_email):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_email")

        # email already in use (possibly by this user)
        if session.execute(select(User).where(User.email == request.new_email)).scalar_one_or_none():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_email")

        user.new_email = request.new_email
        user.new_email_token = urlsafe_secure_token()
        user.new_email_token_created = now()
        user.new_email_token_expiry = now() + timedelta(hours=2)

        send_email_changed_confirmation_to_new_email(session, user)

        # will still go into old email
        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.email_address__change,
            key="",
            data=notification_data_pb2.EmailAddressChange(
                new_email=request.new_email,
            ),
        )

        # session autocommit
        return empty_pb2.Empty()

    def ChangeLanguagePreference(
        self, request: account_pb2.ChangeLanguagePreferenceReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        # select the user from the db
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        # update the user's preference
        user.ui_language_preference = request.ui_language_preference
        context.set_cookies(create_lang_cookie(request.ui_language_preference))

        return empty_pb2.Empty()

    def FillContributorForm(
        self, request: account_pb2.FillContributorFormReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        form = request.contributor_form

        form = ContributorForm(
            user_id=user.id,
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

    def GetContributorFormInfo(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> account_pb2.GetContributorFormInfoRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        return account_pb2.GetContributorFormInfoRes(
            filled_contributor_form=user.filled_contributor_form,
        )

    def ChangePhone(
        self, request: account_pb2.ChangePhoneReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        phone = request.phone
        # early quick validation
        if phone and not is_e164_format(phone):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_phone")

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if user.last_donated is None:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "not_donated")

        if not phone:
            user.phone = None
            user.phone_verification_verified = None
            user.phone_verification_token = None
            user.phone_verification_attempts = 0
            return empty_pb2.Empty()

        if not is_known_operator(phone):
            context.abort_with_error_code(grpc.StatusCode.UNIMPLEMENTED, "unrecognized_phone_number")

        if now() - user.phone_verification_sent < PHONE_REVERIFICATION_INTERVAL:
            context.abort_with_error_code(grpc.StatusCode.RESOURCE_EXHAUSTED, "reverification_too_early")

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
                topic_action=NotificationTopicAction.phone_number__change,
                key="",
                data=notification_data_pb2.PhoneNumberChange(
                    phone=phone,
                ),
            )

            return empty_pb2.Empty()

        context.abort(grpc.StatusCode.UNIMPLEMENTED, result)

    def VerifyPhone(
        self, request: account_pb2.VerifyPhoneReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if not sms.looks_like_a_code(request.token):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "wrong_sms_code")

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if user.phone_verification_token is None:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "no_pending_verification")

        if now() - user.phone_verification_sent > SMS_CODE_LIFETIME:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "no_pending_verification")

        if user.phone_verification_attempts > SMS_CODE_ATTEMPTS:
            context.abort_with_error_code(grpc.StatusCode.RESOURCE_EXHAUSTED, "too_many_sms_code_attempts")

        if not verify_token(request.token, user.phone_verification_token):
            user.phone_verification_attempts += 1
            session.commit()
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "wrong_sms_code")

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
            topic_action=NotificationTopicAction.phone_number__verify,
            key="",
            data=notification_data_pb2.PhoneNumberVerify(
                phone=user.phone,
            ),
        )

        return empty_pb2.Empty()

    def InitiateStrongVerification(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> account_pb2.InitiateStrongVerificationRes:
        if not config["ENABLE_STRONG_VERIFICATION"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "strong_verification_disabled")

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        existing_verification = session.execute(
            select(StrongVerificationAttempt)
            .where(StrongVerificationAttempt.user_id == user.id)
            .where(StrongVerificationAttempt.is_valid)
        ).scalar_one_or_none()
        if existing_verification:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "strong_verification_already_verified")

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
                "passport_only": True,
                "reference": reference,
            },
            timeout=10,
            verify="/etc/ssl/certs/ca-certificates.crt",
        )

        if response.status_code != 200:
            raise Exception(f"Iris didn't return 200: {response.text}")

        iris_session_id = response.json()["id"]
        token = response.json()["token"]
        session.add(
            StrongVerificationAttempt(
                user_id=user.id,
                verification_attempt_token=verification_attempt_token,
                iris_session_id=iris_session_id,
                iris_token=token,
            )
        )

        redirect_params = {
            "token": token,
            "redirect_url": urls.complete_strong_verification_url(
                verification_attempt_token=verification_attempt_token
            ),
        }
        redirect_url = "https://passportreader.app/open?" + urlencode(redirect_params)

        return account_pb2.InitiateStrongVerificationRes(
            verification_attempt_token=verification_attempt_token,
            redirect_url=redirect_url,
        )

    def GetStrongVerificationAttemptStatus(
        self, request: account_pb2.GetStrongVerificationAttemptStatusReq, context: CouchersContext, session: Session
    ) -> account_pb2.GetStrongVerificationAttemptStatusRes:
        verification_attempt = session.execute(
            select(StrongVerificationAttempt)
            .where(StrongVerificationAttempt.user_id == context.user_id)
            .where(StrongVerificationAttempt.is_visible)
            .where(StrongVerificationAttempt.verification_attempt_token == request.verification_attempt_token)
        ).scalar_one_or_none()
        if not verification_attempt:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "strong_verification_attempt_not_found")
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

    def DeleteStrongVerificationData(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
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

    def DeleteAccount(
        self, request: account_pb2.DeleteAccountReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        """
        Triggers email with token to confirm deletion

        Frontend should confirm via unique string (i.e. username) before this is called
        """
        if not request.confirm:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "must_confirm_account_delete")

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        reason = request.reason.strip()
        if reason:
            deletion_reason = AccountDeletionReason(user_id=user.id, reason=reason)
            session.add(deletion_reason)
            session.flush()
            send_account_deletion_report_email(session, deletion_reason)

        token = AccountDeletionToken(token=urlsafe_secure_token(), user_id=user.id, expiry=now() + timedelta(hours=2))

        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.account_deletion__start,
            key="",
            data=notification_data_pb2.AccountDeletionStart(
                deletion_token=token.token,
            ),
        )
        session.add(token)

        account_deletion_initiations_counter.labels(user.gender).inc()

        return empty_pb2.Empty()

    def ListModNotes(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> account_pb2.ListModNotesRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        notes = (
            session.execute(select(ModNote).where(ModNote.user_id == user.id).order_by(ModNote.created.asc()))
            .scalars()
            .all()
        )

        return account_pb2.ListModNotesRes(mod_notes=[mod_note_to_pb(note) for note in notes])

    def ListActiveSessions(
        self, request: account_pb2.ListActiveSessionsReq, context: CouchersContext, session: Session
    ) -> account_pb2.ListActiveSessionsRes:
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

        def _active_session_to_pb(user_session: UserSession) -> account_pb2.ActiveSession:
            user_agent = user_agents_parse(user_session.user_agent or "")
            return account_pb2.ActiveSession(
                created=Timestamp_from_datetime(user_session.created),
                expiry=Timestamp_from_datetime(user_session.expiry),
                last_seen=Timestamp_from_datetime(user_session.last_seen),
                operating_system=user_agent.os.family,
                browser=user_agent.browser.family,
                device=user_agent.device.family,
                approximate_location=geoip_approximate_location(user_session.ip_address) or "Unknown",
                is_current_session=user_session.token == context.token,
            )

        return account_pb2.ListActiveSessionsRes(
            active_sessions=list(map(_active_session_to_pb, user_sessions[:page_size])),
            next_page_token=dt_to_page_token(user_sessions[-1].last_seen) if len(user_sessions) > page_size else None,
        )

    def LogOutSession(
        self, request: account_pb2.LogOutSessionReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        session.execute(
            update(UserSession)
            .where(UserSession.token != context.token)
            .where(UserSession.user_id == context.user_id)
            .where(UserSession.is_valid)
            .where(UserSession.is_api_key == False)
            .where(UserSession.created == to_aware_datetime(request.created))
            .values(expiry=func.now())
            .execution_options(synchronize_session=False)
        )
        return empty_pb2.Empty()

    def LogOutOtherSessions(
        self, request: account_pb2.LogOutOtherSessionsReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if not request.confirm:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "must_confirm_logout_other_sessions")

        session.execute(
            update(UserSession)
            .where(UserSession.token != context.token)
            .where(UserSession.user_id == context.user_id)
            .where(UserSession.is_valid)
            .where(UserSession.is_api_key == False)
            .values(expiry=func.now())
            .execution_options(synchronize_session=False)
        )
        return empty_pb2.Empty()

    def SetProfilePublicVisibility(
        self, request: account_pb2.SetProfilePublicVisibilityReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        user.public_visibility = profilepublicitysetting2sql[request.profile_public_visibility]  # type: ignore[assignment]
        user.has_modified_public_visibility = True
        return empty_pb2.Empty()

    def CreateInviteCode(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> account_pb2.CreateInviteCodeRes:
        code = generate_invite_code()
        session.add(InviteCode(id=code, creator_user_id=context.user_id))

        return account_pb2.CreateInviteCodeRes(
            code=code,
            url=urls.invite_code_link(code=code),
        )

    def DisableInviteCode(
        self, request: account_pb2.DisableInviteCodeReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        invite = session.execute(
            select(InviteCode).where(InviteCode.id == request.code, InviteCode.creator_user_id == context.user_id)
        ).scalar_one_or_none()

        if not invite:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "not_found")

        invite.disabled = func.now()
        session.commit()

        return empty_pb2.Empty()

    def ListInviteCodes(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> account_pb2.ListInviteCodesRes:
        results = session.execute(
            select(
                InviteCode.id,
                InviteCode.created,
                InviteCode.disabled,
                func.count(User.id).label("num_users"),
            )
            .outerjoin(User, User.invite_code_id == InviteCode.id)
            .where(InviteCode.creator_user_id == context.user_id)
            .group_by(InviteCode.id, InviteCode.disabled)
            .order_by(func.count(User.id).desc(), InviteCode.disabled)
        ).all()

        return account_pb2.ListInviteCodesRes(
            invite_codes=[
                account_pb2.InviteCodeInfo(
                    code=code_id,
                    created=Timestamp_from_datetime(created),
                    disabled=Timestamp_from_datetime(disabled) if disabled else None,
                    uses=len_users,
                    url=urls.invite_code_link(code=code_id),
                )
                for code_id, created, disabled, len_users in results
            ]
        )

    def GetReminders(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> account_pb2.GetRemindersRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        print("************ hi I'm here ************")

        # responding to reqs comes first in desc order of when they were received
        query = select(HostRequest.conversation_id, LiteUser).join(LiteUser, LiteUser.id == HostRequest.surfer_user_id)
        query = where_users_column_visible(query, context, HostRequest.surfer_user_id)
        query = where_moderated_content_visible(query, context, HostRequest, is_list_operation=True)
        pending_host_requests = session.execute(
            query.where(HostRequest.host_user_id == context.user_id)
            .where(HostRequest.status == HostRequestStatus.pending)
            .where(HostRequest.start_time > func.now())
            .order_by(HostRequest.conversation_id.asc())
        ).all()
        reminders = [
            account_pb2.Reminder(
                respond_to_host_request_reminder=account_pb2.RespondToHostRequestReminder(
                    host_request_id=host_request_id,
                    surfer_user=lite_user_to_pb(session, lite_user, context),
                )
            )
            for host_request_id, lite_user in pending_host_requests
        ]

        # references come second, in order of deadline, desc
        reminders += [
            account_pb2.Reminder(
                write_reference_reminder=account_pb2.WriteReferenceReminder(
                    host_request_id=host_request_id,
                    reference_type=reftype2api[reference_type],
                    other_user=lite_user_to_pb(session, lite_user, context),
                )
            )
            for host_request_id, reference_type, _, lite_user in get_pending_references_to_write(session, context)
        ]

        if not user.has_completed_profile:
            reminders.append(account_pb2.Reminder(complete_profile_reminder=account_pb2.CompleteProfileReminder()))

        if not has_strong_verification(session, user):
            reminders.append(
                account_pb2.Reminder(complete_verification_reminder=account_pb2.CompleteVerificationReminder())
            )

        return account_pb2.GetRemindersRes(reminders=reminders)

    def GetMyVolunteerInfo(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> account_pb2.GetMyVolunteerInfoRes:
        user, volunteer = session.execute(
            select(User, Volunteer).outerjoin(Volunteer, Volunteer.user_id == User.id).where(User.id == context.user_id)
        ).one()
        if not volunteer:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "not_a_volunteer")
        return _volunteer_info_to_pb(volunteer, user.username)

    def UpdateMyVolunteerInfo(
        self, request: account_pb2.UpdateMyVolunteerInfoReq, context: CouchersContext, session: Session
    ) -> account_pb2.GetMyVolunteerInfoRes:
        user, volunteer = session.execute(
            select(User, Volunteer).outerjoin(Volunteer, Volunteer.user_id == User.id).where(User.id == context.user_id)
        ).one()
        if not volunteer:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "not_a_volunteer")

        if request.HasField("display_name"):
            volunteer.display_name = request.display_name.value or None

        if request.HasField("display_location"):
            volunteer.display_location = request.display_location.value or None

        if request.HasField("show_on_team_page"):
            volunteer.show_on_team_page = request.show_on_team_page.value

        if request.HasField("link_type") or request.HasField("link_text") or request.HasField("link_url"):
            link_type = request.link_type.value or volunteer.link_type
            link_text = request.link_text.value or volunteer.link_text
            link_url = request.link_url.value or volunteer.link_url
            if link_type == "couchers":
                # this is the default
                link_type = None
                link_text = None
                link_url = None
            elif link_type == "linkedin":
                # this is the username
                link_text = link_text
                link_url = f"https://www.linkedin.com/in/{link_text}/"
            elif link_type == "email":
                if not is_valid_email(link_text):
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_email")
                link_url = f"mailto:{link_text}"
            elif link_type == "website":
                if not link_url.startswith("https://") or "/" in link_text or link_text not in link_url:
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_website_url")
            else:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_link_type")
            volunteer.link_type = link_type
            volunteer.link_text = link_text
            volunteer.link_url = link_url

        session.flush()

        return _volunteer_info_to_pb(volunteer, user.username)


class Iris(iris_pb2_grpc.IrisServicer):
    def Webhook(
        self, request: httpbody_pb2.HttpBody, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
        json_data = json.loads(request.data)
        reference_payload = verification_pb2.VerificationReferencePayload.FromString(
            simple_decrypt("iris_callback", b64decode(json_data["session_reference"]))
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
            verification_attempt.status = StrongVerificationAttemptStatus.in_progress_waiting_on_backend
            session.commit()
            # background worker will go and sort this one out
            queue_job(
                session,
                job=finalize_strong_verification,
                payload=jobs_pb2.FinalizeStrongVerificationPayload(verification_attempt_id=verification_attempt.id),
                priority=8,
            )
        elif iris_status in ["FAILED", "ABORTED", "REJECTED"]:
            verification_attempt.status = StrongVerificationAttemptStatus.failed

        return httpbody_pb2.HttpBody(
            content_type="application/json",
            # json.dumps escapes non-ascii characters
            data=json.dumps({"success": True}).encode("ascii"),
        )
