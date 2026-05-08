import json
import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from couchers.config import Config
from couchers.constants import (
    POSTAL_VERIFICATION_CODE_LIFETIME,
    POSTAL_VERIFICATION_MAX_ATTEMPTS,
    POSTAL_VERIFICATION_RATE_LIMIT,
)
from couchers.context import CouchersContext
from couchers.helpers.postal_verification import generate_postal_verification_code, has_postal_verification
from couchers.jobs.enqueue import queue_job
from couchers.jobs.handlers import send_postal_verification_postcard
from couchers.models import User
from couchers.models.notifications import NotificationTopicAction
from couchers.models.postal_verification import PostalVerificationAttempt, PostalVerificationStatus
from couchers.notifications.notify import notify
from couchers.postal.address_validation import AddressValidationError, validate_address
from couchers.proto import notification_data_pb2, postal_verification_pb2, postal_verification_pb2_grpc
from couchers.proto.internal import jobs_pb2
from couchers.utils import Timestamp_from_datetime, now

logger = logging.getLogger(__name__)

postalverificationstatus2pb = {
    PostalVerificationStatus.pending_address_confirmation: postal_verification_pb2.POSTAL_VERIFICATION_STATUS_PENDING_ADDRESS_CONFIRMATION,
    PostalVerificationStatus.in_progress: postal_verification_pb2.POSTAL_VERIFICATION_STATUS_IN_PROGRESS,
    PostalVerificationStatus.awaiting_verification: postal_verification_pb2.POSTAL_VERIFICATION_STATUS_AWAITING_VERIFICATION,
    PostalVerificationStatus.succeeded: postal_verification_pb2.POSTAL_VERIFICATION_STATUS_SUCCEEDED,
    PostalVerificationStatus.failed: postal_verification_pb2.POSTAL_VERIFICATION_STATUS_FAILED,
    PostalVerificationStatus.cancelled: postal_verification_pb2.POSTAL_VERIFICATION_STATUS_CANCELLED,
}


def _attempt_to_address_pb(attempt: PostalVerificationAttempt) -> postal_verification_pb2.PostalAddress:
    return postal_verification_pb2.PostalAddress(
        address_line_1=attempt.address_line_1,
        address_line_2=attempt.address_line_2 or "",
        city=attempt.city,
        state=attempt.state or "",
        postal_code=attempt.postal_code or "",
        country_code=attempt.country_code,
    )


class PostalVerification(postal_verification_pb2_grpc.PostalVerificationServicer):
    def InitiatePostalVerification(
        self,
        request: postal_verification_pb2.InitiatePostalVerificationReq,
        context: CouchersContext,
        session: Session,
    ) -> postal_verification_pb2.InitiatePostalVerificationRes:
        """
        Step 1: User submits address for validation.
        """
        if not Config.current.enable_postal_verification:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "postal_verification_disabled")

        # Check if there's an active attempt
        has_active_attempt = session.execute(
            select(
                exists(
                    select(PostalVerificationAttempt)
                    .where(PostalVerificationAttempt.user_id == context.user_id)
                    .where(
                        PostalVerificationAttempt.status.in_(
                            [
                                PostalVerificationStatus.pending_address_confirmation,
                                PostalVerificationStatus.in_progress,
                                PostalVerificationStatus.awaiting_verification,
                            ]
                        )
                    )
                )
            )
        ).scalar()

        if has_active_attempt:
            context.abort_with_error_code(
                grpc.StatusCode.FAILED_PRECONDITION, "postal_verification_already_in_progress"
            )

        # Check rate limit: one initiation per 30 days
        has_recent_attempt = session.execute(
            select(
                exists(
                    select(PostalVerificationAttempt)
                    .where(PostalVerificationAttempt.user_id == context.user_id)
                    .where(PostalVerificationAttempt.created > now() - POSTAL_VERIFICATION_RATE_LIMIT)
                )
            )
        ).scalar()

        if has_recent_attempt:
            context.abort_with_error_code(grpc.StatusCode.RESOURCE_EXHAUSTED, "postal_verification_rate_limited")

        # Validate required fields
        if not request.address.address_line_1:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "address_line_1_required")
        if not request.address.city:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "city_required")
        if not request.address.country_code:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "country_required")

        # Validate address
        try:
            validated = validate_address(
                address_line_1=request.address.address_line_1,
                address_line_2=request.address.address_line_2 or None,
                city=request.address.city,
                state=request.address.state or None,
                postal_code=request.address.postal_code or None,
                country=request.address.country_code,
            )
        except AddressValidationError:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "postal_address_invalid")

        if not validated.is_deliverable:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "postal_address_undeliverable")

        # Create attempt
        attempt = PostalVerificationAttempt(
            user_id=context.user_id,
            status=PostalVerificationStatus.pending_address_confirmation,
            address_line_1=validated.address_line_1,
            address_line_2=validated.address_line_2,
            city=validated.city,
            state=validated.state,
            postal_code=validated.postal_code,
            country_code=validated.country_code,
            original_address_json=json.dumps(
                {
                    "address_line_1": request.address.address_line_1,
                    "address_line_2": request.address.address_line_2,
                    "city": request.address.city,
                    "state": request.address.state,
                    "postal_code": request.address.postal_code,
                    "country_code": request.address.country_code,
                }
            ),
        )
        session.add(attempt)
        session.flush()

        return postal_verification_pb2.InitiatePostalVerificationRes(
            postal_verification_attempt_id=attempt.id,
            corrected_address=postal_verification_pb2.PostalAddress(
                address_line_1=validated.address_line_1,
                address_line_2=validated.address_line_2 or "",
                city=validated.city,
                state=validated.state or "",
                postal_code=validated.postal_code or "",
                country_code=validated.country_code,
            ),
            address_was_corrected=validated.was_corrected,
        )

    def ConfirmPostalAddress(
        self,
        request: postal_verification_pb2.ConfirmPostalAddressReq,
        context: CouchersContext,
        session: Session,
    ) -> postal_verification_pb2.ConfirmPostalAddressRes:
        """
        Step 2: User confirms address, we generate code and send postcard.
        """
        attempt = session.execute(
            select(PostalVerificationAttempt)
            .where(PostalVerificationAttempt.id == request.postal_verification_attempt_id)
            .where(PostalVerificationAttempt.user_id == context.user_id)
        ).scalar_one_or_none()

        if not attempt:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "postal_verification_attempt_not_found")

        if attempt.status != PostalVerificationStatus.pending_address_confirmation:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "postal_verification_wrong_state")

        attempt.verification_code = generate_postal_verification_code()
        attempt.status = PostalVerificationStatus.in_progress
        attempt.address_confirmed_at = now()

        # Queue background job to send postcard
        queue_job(
            session,
            job=send_postal_verification_postcard,
            payload=jobs_pb2.SendPostalVerificationPostcardPayload(
                postal_verification_attempt_id=attempt.id,
            ),
        )

        return postal_verification_pb2.ConfirmPostalAddressRes()

    def GetPostalVerificationStatus(
        self,
        request: postal_verification_pb2.GetPostalVerificationStatusReq,
        context: CouchersContext,
        session: Session,
    ) -> postal_verification_pb2.GetPostalVerificationStatusRes:
        """
        Returns the user's postal verification status and current/latest attempt details.
        """
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        has_verification = has_postal_verification(session, user)

        # Always get the latest attempt for determining can_initiate and has_active_attempt
        latest_attempt = session.execute(
            select(PostalVerificationAttempt)
            .where(PostalVerificationAttempt.user_id == user.id)
            .order_by(PostalVerificationAttempt.created.desc())
            .limit(1)
        ).scalar_one_or_none()

        # Check if user can initiate a new attempt (based on latest attempt)
        can_initiate = True
        next_attempt_allowed_at = None
        has_active_attempt = False

        if latest_attempt:
            # Can't initiate if there's an active attempt
            if latest_attempt.status in [
                PostalVerificationStatus.pending_address_confirmation,
                PostalVerificationStatus.in_progress,
                PostalVerificationStatus.awaiting_verification,
            ]:
                can_initiate = False
                has_active_attempt = True
            else:
                # Check rate limit
                time_since_last = now() - latest_attempt.created
                if time_since_last < POSTAL_VERIFICATION_RATE_LIMIT:
                    can_initiate = False
                    next_attempt_allowed_at = latest_attempt.created + POSTAL_VERIFICATION_RATE_LIMIT

        res = postal_verification_pb2.GetPostalVerificationStatusRes(
            has_postal_verification=has_verification,
            can_initiate_new_attempt=can_initiate,
            has_active_attempt=has_active_attempt,
        )

        if next_attempt_allowed_at:
            res.next_attempt_allowed_at.CopyFrom(Timestamp_from_datetime(next_attempt_allowed_at))

        # Get specific attempt if requested, otherwise use latest
        if request.postal_verification_attempt_id:
            attempt = session.execute(
                select(PostalVerificationAttempt)
                .where(PostalVerificationAttempt.id == request.postal_verification_attempt_id)
                .where(PostalVerificationAttempt.user_id == context.user_id)
            ).scalar_one_or_none()
        else:
            attempt = latest_attempt

        if attempt:
            res.postal_verification_attempt_id = attempt.id
            res.status = postalverificationstatus2pb.get(
                attempt.status, postal_verification_pb2.POSTAL_VERIFICATION_STATUS_UNKNOWN
            )
            res.address.CopyFrom(_attempt_to_address_pb(attempt))
            res.created.CopyFrom(Timestamp_from_datetime(attempt.created))
            if attempt.postcard_sent_at:
                res.postcard_sent_at.CopyFrom(Timestamp_from_datetime(attempt.postcard_sent_at))

        return res

    def VerifyPostalCode(
        self,
        request: postal_verification_pb2.VerifyPostalCodeReq,
        context: CouchersContext,
        session: Session,
    ) -> postal_verification_pb2.VerifyPostalCodeRes:
        """
        User submits the code from the postcard.
        Looks up the user's active attempt (awaiting_verification status).
        """
        attempt = session.execute(
            select(PostalVerificationAttempt)
            .where(PostalVerificationAttempt.user_id == context.user_id)
            .where(PostalVerificationAttempt.status == PostalVerificationStatus.awaiting_verification)
        ).scalar_one_or_none()

        if not attempt:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "postal_verification_attempt_not_found")

        # Check code expiry
        if attempt.postcard_sent_at and (now() - attempt.postcard_sent_at) > POSTAL_VERIFICATION_CODE_LIFETIME:
            attempt.status = PostalVerificationStatus.failed
            notify(
                session,
                user_id=context.user_id,
                topic_action=NotificationTopicAction.postal_verification__failed,
                key="",
                data=notification_data_pb2.PostalVerificationFailed(
                    reason=notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED
                ),
            )
            session.commit()
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "postal_verification_code_expired")

        # Normalize submitted code
        submitted_code = request.code.strip().upper()

        if submitted_code != attempt.verification_code:
            attempt.code_attempts += 1
            remaining = POSTAL_VERIFICATION_MAX_ATTEMPTS - attempt.code_attempts

            if remaining <= 0:
                attempt.status = PostalVerificationStatus.failed
                notify(
                    session,
                    user_id=context.user_id,
                    topic_action=NotificationTopicAction.postal_verification__failed,
                    key="",
                    data=notification_data_pb2.PostalVerificationFailed(
                        reason=notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_TOO_MANY_ATTEMPTS
                    ),
                )
                return postal_verification_pb2.VerifyPostalCodeRes(
                    success=False,
                    remaining_attempts=0,
                )

            return postal_verification_pb2.VerifyPostalCodeRes(
                success=False,
                remaining_attempts=remaining,
            )

        # Success!
        attempt.status = PostalVerificationStatus.succeeded
        attempt.verified_at = now()

        notify(
            session,
            user_id=context.user_id,
            topic_action=NotificationTopicAction.postal_verification__success,
            key="",
        )

        return postal_verification_pb2.VerifyPostalCodeRes(
            success=True,
            remaining_attempts=0,
        )

    def CancelPostalVerification(
        self,
        request: postal_verification_pb2.CancelPostalVerificationReq,
        context: CouchersContext,
        session: Session,
    ) -> empty_pb2.Empty:
        """
        Cancels an active postal verification attempt.
        """
        attempt = session.execute(
            select(PostalVerificationAttempt)
            .where(PostalVerificationAttempt.id == request.postal_verification_attempt_id)
            .where(PostalVerificationAttempt.user_id == context.user_id)
        ).scalar_one_or_none()

        if not attempt:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "postal_verification_attempt_not_found")

        # Can cancel any active attempt (not terminal states)
        if attempt.status not in [
            PostalVerificationStatus.pending_address_confirmation,
            PostalVerificationStatus.in_progress,
            PostalVerificationStatus.awaiting_verification,
        ]:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "postal_verification_cannot_cancel")

        attempt.status = PostalVerificationStatus.cancelled
        # Clear the verification code (required by db constraint and makes sense - code is no longer valid)
        attempt.verification_code = None

        return empty_pb2.Empty()

    def ListPostalVerificationAttempts(
        self,
        request: postal_verification_pb2.ListPostalVerificationAttemptsReq,
        context: CouchersContext,
        session: Session,
    ) -> postal_verification_pb2.ListPostalVerificationAttemptsRes:
        """
        Returns all postal verification attempts for the user.
        """
        attempts = session.execute(
            select(PostalVerificationAttempt)
            .where(PostalVerificationAttempt.user_id == context.user_id)
            .order_by(PostalVerificationAttempt.created.desc())
        ).scalars()

        return postal_verification_pb2.ListPostalVerificationAttemptsRes(
            attempts=[
                postal_verification_pb2.PostalVerificationAttemptSummary(
                    postal_verification_attempt_id=attempt.id,
                    status=postalverificationstatus2pb.get(
                        attempt.status, postal_verification_pb2.POSTAL_VERIFICATION_STATUS_UNKNOWN
                    ),
                    address=_attempt_to_address_pb(attempt),
                    created=Timestamp_from_datetime(attempt.created),
                    verified_at=Timestamp_from_datetime(attempt.verified_at) if attempt.verified_at else None,
                )
                for attempt in attempts
            ]
        )
