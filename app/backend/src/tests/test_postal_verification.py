from collections.abc import Generator
from datetime import timedelta
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select, update

from couchers.config import config
from couchers.constants import (
    POSTAL_VERIFICATION_CODE_LIFETIME,
    POSTAL_VERIFICATION_MAX_ATTEMPTS,
    POSTAL_VERIFICATION_RATE_LIMIT,
    POSTCARD_STUCK_AFTER,
)
from couchers.db import session_scope
from couchers.helpers.postal_verification import generate_postal_verification_code, has_postal_verification
from couchers.jobs.handlers import alert_stuck_postcards, check_mypostcard_jobs, send_postal_verification_postcard
from couchers.jobs.worker import process_job
from couchers.models import User
from couchers.models.postal_verification import (
    PostalVerificationAttempt,
    PostalVerificationFailReason,
    PostalVerificationStatus,
)
from couchers.postal.my_postcard import AddressRejectedError, _generate_back_left_side_png
from couchers.proto import editor_pb2, postal_verification_pb2
from couchers.proto.internal import jobs_pb2
from couchers.resources import get_postcard_front_image
from couchers.utils import now, to_aware_datetime
from tests.fixtures.db import generate_user
from tests.fixtures.feature_flags import FeatureFlags
from tests.fixtures.misc import PushCollector
from tests.fixtures.sessions import postal_verification_session, real_editor_session


@pytest.fixture(autouse=True)
def mypostcard_auth() -> Generator[MagicMock]:
    """The postcard job authenticates with MyPostcard before ordering; tests mock the ordering itself."""
    with patch("couchers.jobs.handlers.authenticate", return_value="auth-token") as mock_auth:
        yield mock_auth


def test_generate_postal_verification_code():
    """Test that generated codes meet requirements."""
    allowed = set("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
    for _ in range(100):
        code = generate_postal_verification_code()
        assert len(code) == 6
        assert all(c in allowed for c in code)
        # Should not contain confusing characters
        for char in "IO01":
            assert char not in code


def test_postal_verification_disabled(db, feature_flags: FeatureFlags):
    """Test that postal verification is disabled."""
    feature_flags.set("postal_verification_enabled", False)
    user, token = generate_user()

    with postal_verification_session(token) as pv:
        with pytest.raises(grpc.RpcError) as e:
            pv.InitiatePostalVerification(
                postal_verification_pb2.InitiatePostalVerificationReq(
                    address=postal_verification_pb2.PostalAddress(
                        recipient_name="Test User",
                        address_line_1="123 Main St",
                        city="Test City",
                        country_code="US",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.UNAVAILABLE


def test_postal_verification_confirm_disabled(db, feature_flags: FeatureFlags):
    """Confirming (which queues the paid postcard) must respect the flag, not just initiation."""
    feature_flags.set("postal_verification_enabled", False)
    user, token = generate_user()

    # Seed a pending attempt directly, since initiation is gated by the same flag.
    with session_scope() as session:
        attempt = PostalVerificationAttempt(
            recipient_name="Test User",
            user_id=user.id,
            status=PostalVerificationStatus.pending_address_confirmation,
            address_line_1="123 Main St",
            city="Test City",
            country_code="US",
        )
        session.add(attempt)
        session.flush()
        attempt_id = attempt.id

    with postal_verification_session(token) as pv:
        with pytest.raises(grpc.RpcError) as e:
            pv.ConfirmPostalAddress(
                postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
            )
        assert e.value.code() == grpc.StatusCode.UNAVAILABLE


def test_postal_verification_happy_path(db):
    """Test the complete happy path for postal verification."""
    user, token = generate_user()

    # Check initial status
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert not status.has_postal_verification
        assert status.can_initiate_new_attempt
        assert not status.has_active_attempt

    # Step 1: Initiate postal verification
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="  Jane Q. Public  ",
                    address_line_1="123 Main St",
                    address_line_2="Apt 4",
                    city="Test City",
                    state="CA",
                    postal_code="12345",
                    country_code="US",
                )
            )
        )
        attempt_id = res.postal_verification_attempt_id
        assert attempt_id > 0

    # Check status after initiation
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert not status.has_postal_verification
        assert not status.can_initiate_new_attempt
        assert status.has_active_attempt
        assert status.status == postal_verification_pb2.POSTAL_VERIFICATION_STATUS_PENDING_ADDRESS_CONFIRMATION
        assert status.address.recipient_name == "Jane Q. Public"

    # Step 2: Confirm address
    with postal_verification_session(token) as pv:
        pv.ConfirmPostalAddress(
            postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
        )

    # Check status after confirmation
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.status == postal_verification_pb2.POSTAL_VERIFICATION_STATUS_IN_PROGRESS

    # Process background job to send postcard
    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        mock_send.return_value = 12345
        while process_job():
            pass

    # Printed with the name entered for this attempt, which doesn't touch the profile name
    assert mock_send.call_args.kwargs["recipient_name"] == "Jane Q. Public"
    with session_scope() as session:
        assert session.execute(select(User.name).where(User.id == user.id)).scalar_one() == user.name

    # Check status after postcard sent
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.status == postal_verification_pb2.POSTAL_VERIFICATION_STATUS_AWAITING_VERIFICATION
        assert status.postcard_sent_at.seconds > 0

    # Get the verification code from the database
    with session_scope() as session:
        attempt = session.execute(
            select(PostalVerificationAttempt).where(PostalVerificationAttempt.id == attempt_id)
        ).scalar_one()
        verification_code = attempt.verification_code

    # Step 3: Verify the code
    with postal_verification_session(token) as pv:
        res = pv.VerifyPostalCode(postal_verification_pb2.VerifyPostalCodeReq(code=verification_code))
        assert res.success

    # Check final status
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.has_postal_verification
        assert status.status == postal_verification_pb2.POSTAL_VERIFICATION_STATUS_SUCCEEDED

    # Verify with helper function
    with session_scope() as session:
        db_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert has_postal_verification(session, db_user)


def test_postal_verification_wrong_code(db):
    """Test entering wrong verification codes."""
    user, token = generate_user()

    # Initiate and confirm
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )
        attempt_id = res.postal_verification_attempt_id

    with postal_verification_session(token) as pv:
        pv.ConfirmPostalAddress(
            postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
        )

    # Process background job
    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        mock_send.return_value = 12345
        while process_job():
            pass

    # Try wrong codes
    with postal_verification_session(token) as pv:
        for i in range(POSTAL_VERIFICATION_MAX_ATTEMPTS - 1):
            res = pv.VerifyPostalCode(postal_verification_pb2.VerifyPostalCodeReq(code="WRONGX"))
            assert not res.success
            assert res.remaining_attempts == POSTAL_VERIFICATION_MAX_ATTEMPTS - 1 - i

        # Last attempt should fail and lock the attempt
        res = pv.VerifyPostalCode(postal_verification_pb2.VerifyPostalCodeReq(code="WRONGX"))
        assert not res.success
        assert res.remaining_attempts == 0

    # Check status is failed
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.status == postal_verification_pb2.POSTAL_VERIFICATION_STATUS_FAILED
        assert not status.address_rejected
    assert _get_attempt(attempt_id).fail_reason == PostalVerificationFailReason.too_many_attempts


def test_postal_verification_code_expiry(db):
    """Test that codes expire after the configured lifetime."""
    user, token = generate_user()

    # Initiate and confirm
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )
        attempt_id = res.postal_verification_attempt_id

    with postal_verification_session(token) as pv:
        pv.ConfirmPostalAddress(
            postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
        )

    # Process background job
    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        mock_send.return_value = 12345
        while process_job():
            pass

    # Get the code
    with session_scope() as session:
        attempt = session.execute(
            select(PostalVerificationAttempt).where(PostalVerificationAttempt.id == attempt_id)
        ).scalar_one()
        verification_code = attempt.verification_code
        # Set postcard_sent_at to be past expiry
        attempt.postcard_sent_at = now() - POSTAL_VERIFICATION_CODE_LIFETIME - timedelta(days=1)

    # Try to verify - should fail due to expiry
    with postal_verification_session(token) as pv:
        with pytest.raises(grpc.RpcError) as e:
            pv.VerifyPostalCode(postal_verification_pb2.VerifyPostalCodeReq(code=verification_code))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
    assert _get_attempt(attempt_id).fail_reason == PostalVerificationFailReason.code_expired


def _initiate(token: str) -> int:
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )
    attempt_id: int = res.postal_verification_attempt_id
    return attempt_id


def _cancel(token: str, attempt_id: int) -> None:
    with postal_verification_session(token) as pv:
        pv.CancelPostalVerification(
            postal_verification_pb2.CancelPostalVerificationReq(postal_verification_attempt_id=attempt_id)
        )


def test_postal_verification_rate_limit_ignores_unsent_attempts(db):
    """Cancelling before the postcard is sent costs us nothing, so it mustn't lock the user out."""
    user, token = generate_user()

    # cancelled at the confirm step
    _cancel(token, _initiate(token))

    # cancelled after confirming, before the postcard job ran
    attempt_id = _initiate(token)
    with postal_verification_session(token) as pv:
        pv.ConfirmPostalAddress(
            postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
        )
    _cancel(token, attempt_id)
    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        while process_job():
            pass
    mock_send.assert_not_called()

    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.can_initiate_new_attempt
        assert not status.HasField("next_attempt_allowed_at")

    assert _initiate(token) > 0


def test_postal_verification_rate_limit_after_postcard_sent(db):
    user, token = generate_user()

    attempt_id = _initiate(token)
    with postal_verification_session(token) as pv:
        pv.ConfirmPostalAddress(
            postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
        )
    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        mock_send.return_value = 12345
        while process_job():
            pass
    _cancel(token, attempt_id)

    with session_scope() as session:
        sent_at = session.execute(
            select(PostalVerificationAttempt.postcard_sent_at).where(PostalVerificationAttempt.id == attempt_id)
        ).scalar_one()
    assert sent_at is not None

    # Blocked, and told when they can try again: 30 days after the postcard was sent
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert not status.can_initiate_new_attempt
        assert to_aware_datetime(status.next_attempt_allowed_at) == sent_at + POSTAL_VERIFICATION_RATE_LIMIT

        with pytest.raises(grpc.RpcError) as e:
            pv.InitiatePostalVerification(
                postal_verification_pb2.InitiatePostalVerificationReq(
                    address=postal_verification_pb2.PostalAddress(
                        recipient_name="Test User",
                        address_line_1="456 Other St",
                        city="Test City",
                        country_code="US",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED

    # Once 30 days have passed since sending, they can start again
    with session_scope() as session:
        session.execute(
            update(PostalVerificationAttempt)
            .where(PostalVerificationAttempt.id == attempt_id)
            .values(postcard_sent_at=sent_at - POSTAL_VERIFICATION_RATE_LIMIT - timedelta(minutes=1))
        )

    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.can_initiate_new_attempt
    assert _initiate(token) > 0


def test_postal_verification_already_in_progress(db):
    """Test that you can't start a new attempt while one is in progress."""
    user, token = generate_user()

    # First attempt
    with postal_verification_session(token) as pv:
        pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )

    # Try to initiate another - should fail
    with postal_verification_session(token) as pv:
        with pytest.raises(grpc.RpcError) as e:
            pv.InitiatePostalVerification(
                postal_verification_pb2.InitiatePostalVerificationReq(
                    address=postal_verification_pb2.PostalAddress(
                        recipient_name="Test User",
                        address_line_1="456 Other St",
                        city="Test City",
                        country_code="US",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION


def test_postal_verification_cancel(db):
    """Test cancelling a postal verification attempt."""
    user, token = generate_user()

    # Initiate
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )
        attempt_id = res.postal_verification_attempt_id

    # Cancel
    with postal_verification_session(token) as pv:
        pv.CancelPostalVerification(
            postal_verification_pb2.CancelPostalVerificationReq(postal_verification_attempt_id=attempt_id)
        )

    # Check status
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.status == postal_verification_pb2.POSTAL_VERIFICATION_STATUS_CANCELLED
        assert not status.has_active_attempt


def test_postal_verification_can_cancel_after_postcard_sent(db):
    """Test that you CAN cancel after the postcard is sent (e.g., if postcard is lost)."""
    user, token = generate_user()

    # Initiate and confirm
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )
        attempt_id = res.postal_verification_attempt_id

    with postal_verification_session(token) as pv:
        pv.ConfirmPostalAddress(
            postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
        )

    # Process background job
    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        mock_send.return_value = 12345
        while process_job():
            pass

    # Verify status is awaiting_verification
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.status == postal_verification_pb2.POSTAL_VERIFICATION_STATUS_AWAITING_VERIFICATION

    # Cancel - should succeed (user can cancel if postcard is lost)
    with postal_verification_session(token) as pv:
        pv.CancelPostalVerification(
            postal_verification_pb2.CancelPostalVerificationReq(postal_verification_attempt_id=attempt_id)
        )

    # Verify status is cancelled
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.status == postal_verification_pb2.POSTAL_VERIFICATION_STATUS_CANCELLED
        assert not status.has_active_attempt


def test_postal_verification_list_attempts(db):
    """Test listing postal verification attempts."""
    user, token = generate_user()

    # Create first attempt and cancel it
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )
        attempt_id_1 = res.postal_verification_attempt_id

    with postal_verification_session(token) as pv:
        pv.CancelPostalVerification(
            postal_verification_pb2.CancelPostalVerificationReq(postal_verification_attempt_id=attempt_id_1)
        )

    # Move created time back to bypass rate limit
    with session_scope() as session:
        attempt = session.execute(
            select(PostalVerificationAttempt).where(PostalVerificationAttempt.id == attempt_id_1)
        ).scalar_one()
        attempt.created = now() - POSTAL_VERIFICATION_RATE_LIMIT - timedelta(days=1)

    # Create second attempt
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="456 Other St",
                    city="Other City",
                    country_code="CA",
                )
            )
        )
        attempt_id_2 = res.postal_verification_attempt_id

    # List attempts
    with postal_verification_session(token) as pv:
        res = pv.ListPostalVerificationAttempts(postal_verification_pb2.ListPostalVerificationAttemptsReq())
        assert len(res.attempts) == 2
        # Most recent first
        assert res.attempts[0].postal_verification_attempt_id == attempt_id_2
        assert res.attempts[1].postal_verification_attempt_id == attempt_id_1


def test_postal_verification_address_validation(db):
    """Test address validation errors."""
    user, token = generate_user()

    # Missing required fields
    with postal_verification_session(token) as pv:
        # Missing address_line_1
        with pytest.raises(grpc.RpcError) as e:
            pv.InitiatePostalVerification(
                postal_verification_pb2.InitiatePostalVerificationReq(
                    address=postal_verification_pb2.PostalAddress(
                        recipient_name="Test User",
                        city="Test City",
                        country_code="US",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        # Missing city
        with pytest.raises(grpc.RpcError) as e:
            pv.InitiatePostalVerification(
                postal_verification_pb2.InitiatePostalVerificationReq(
                    address=postal_verification_pb2.PostalAddress(
                        recipient_name="Test User",
                        address_line_1="123 Main St",
                        country_code="US",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        # Missing country
        with pytest.raises(grpc.RpcError) as e:
            pv.InitiatePostalVerification(
                postal_verification_pb2.InitiatePostalVerificationReq(
                    address=postal_verification_pb2.PostalAddress(
                        recipient_name="Test User",
                        address_line_1="123 Main St",
                        city="Test City",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT


def test_postal_verification_requires_recipient_name(db):
    user, token = generate_user()

    with postal_verification_session(token) as pv:
        for name in ["", "   "]:
            with pytest.raises(grpc.RpcError) as e:
                pv.InitiatePostalVerification(
                    postal_verification_pb2.InitiatePostalVerificationReq(
                        address=postal_verification_pb2.PostalAddress(
                            recipient_name=name,
                            address_line_1="123 Main St",
                            city="Test City",
                            country_code="US",
                        )
                    )
                )
            assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
            assert e.value.details() == "Full name is required."


def _run_postcard_job_again(attempt_id: int) -> None:
    """As the worker would on a retry, or after crashing mid-job."""
    send_postal_verification_postcard(
        jobs_pb2.SendPostalVerificationPostcardPayload(postal_verification_attempt_id=attempt_id)
    )


def _get_attempt(attempt_id: int) -> PostalVerificationAttempt:
    with session_scope() as session:
        attempt = session.execute(
            select(PostalVerificationAttempt).where(PostalVerificationAttempt.id == attempt_id)
        ).scalar_one()
        session.expunge(attempt)
        return attempt


def test_postal_verification_cannot_cancel_while_ordering(db):
    """Ordering can't be undone, so cancelling is refused until the postcard is recorded as sent."""
    user, token = generate_user()
    attempt_id = _confirmed_attempt_id(token)

    cancel_errors = []

    def send_postcard_while_member_cancels(**kwargs: Any) -> int:
        try:
            _cancel(token, attempt_id)
        except grpc.RpcError as e:
            cancel_errors.append(e.code())
        return 12345

    with patch("couchers.jobs.handlers.send_postcard", side_effect=send_postcard_while_member_cancels):
        while process_job():
            pass
    assert cancel_errors == [grpc.StatusCode.FAILED_PRECONDITION]

    # once it's recorded they can cancel, but it still counts towards the rate limit
    _cancel(token, attempt_id)
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert not status.can_initiate_new_attempt


def test_postal_verification_failed_order_is_flagged_not_retried(db):
    """MyPostcard may have taken an order even when the call fails, so we never order again automatically."""
    user, token = generate_user()
    attempt_id = _confirmed_attempt_id(token)

    with (
        patch("couchers.jobs.handlers.send_postcard", side_effect=Exception("timed out")) as mock_send,
        patch("couchers.helpers.postal_verification.send_slack_message") as mock_slack,
    ):
        while process_job():
            pass
        _run_postcard_job_again(attempt_id)

    assert mock_send.call_count == 1
    assert mock_slack.call_count == 2
    assert f"Attempt {attempt_id}" in mock_slack.call_args[0][1]

    attempt = _get_attempt(attempt_id)
    assert attempt.status == PostalVerificationStatus.in_progress
    assert attempt.postcard_order_started_at is not None
    assert attempt.mypostcard_job_id is None

    with pytest.raises(grpc.RpcError) as e:
        _cancel(token, attempt_id)
    assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION


def test_postal_verification_rejected_address_tells_member(db, push_collector: PushCollector):
    """A rejected address means nothing was ordered, so the member is told and can try again straight away."""
    user, token = generate_user()
    attempt_id = _confirmed_attempt_id(token)

    with (
        patch("couchers.jobs.handlers.send_postcard", side_effect=AddressRejectedError("adress data incomplete")),
        patch("couchers.helpers.postal_verification.send_slack_message") as mock_slack,
    ):
        while process_job():
            pass

    mock_slack.assert_not_called()
    attempt = _get_attempt(attempt_id)
    assert attempt.status == PostalVerificationStatus.failed
    assert attempt.fail_reason == PostalVerificationFailReason.address_rejected
    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.body == "We couldn't send a postcard to that address. Please check it and try again."

    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.address_rejected
        assert status.can_initiate_new_attempt


def test_postal_verification_auth_failure_is_retried(db, mypostcard_auth: MagicMock):
    """Nothing can be ordered without authenticating, so that's safe to retry."""
    user, token = generate_user()
    attempt_id = _confirmed_attempt_id(token)
    mypostcard_auth.side_effect = [Exception("MyPostcard down"), "auth-token"]

    with patch("couchers.jobs.handlers.send_postcard", return_value=12345) as mock_send:
        with pytest.raises(Exception, match="MyPostcard down"):
            process_job()
        assert _get_attempt(attempt_id).postcard_order_started_at is None

        _run_postcard_job_again(attempt_id)

    mock_send.assert_called_once()
    assert _get_attempt(attempt_id).status == PostalVerificationStatus.awaiting_verification


def test_postal_verification_order_recorded_even_if_notification_fails(db):
    user, token = generate_user()
    attempt_id = _confirmed_attempt_id(token)

    with (
        patch("couchers.jobs.handlers.send_postcard", return_value=12345),
        patch("couchers.jobs.handlers.notify", side_effect=Exception("notification failed")),
    ):
        with pytest.raises(Exception, match="notification failed"):
            process_job()

    attempt = _get_attempt(attempt_id)
    assert attempt.status == PostalVerificationStatus.awaiting_verification
    assert attempt.mypostcard_job_id == 12345


def test_stuck_postcard_shown_as_delayed_and_alerted(db):
    user, token = generate_user()
    stuck_id = _confirmed_attempt_id(token)
    _, other_token = generate_user()
    recent_id = _confirmed_attempt_id(other_token)

    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert not status.postcard_delayed

    with session_scope() as session:
        session.execute(
            update(PostalVerificationAttempt)
            .where(PostalVerificationAttempt.id == stuck_id)
            .values(address_confirmed_at=now() - POSTCARD_STUCK_AFTER - timedelta(minutes=1))
        )

    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.postcard_delayed

    with patch("couchers.helpers.postal_verification.send_slack_message") as mock_slack:
        alert_stuck_postcards(empty_pb2.Empty())
    message = mock_slack.call_args[0][1]
    assert f"Attempt {stuck_id}" in message
    assert f"Attempt {recent_id}" not in message


def _fail_order(attempt_id: int) -> None:
    with (
        patch("couchers.jobs.handlers.send_postcard", side_effect=Exception("timed out")),
        patch("couchers.helpers.postal_verification.send_slack_message"),
    ):
        while process_job():
            pass


def test_editor_record_postcard_order(db):
    """For when the MyPostcard dashboard shows the order did go through."""
    user, token = generate_user()
    _, editor_token = generate_user(is_editor=True)
    attempt_id = _confirmed_attempt_id(token)
    _fail_order(attempt_id)

    with real_editor_session(editor_token) as editor:
        editor.RecordPostcardOrder(
            editor_pb2.RecordPostcardOrderReq(postal_verification_attempt_id=attempt_id, mypostcard_job_id=999)
        )
        # it's no longer stuck, so it can't be recorded twice
        with pytest.raises(grpc.RpcError) as e:
            editor.RecordPostcardOrder(
                editor_pb2.RecordPostcardOrderReq(postal_verification_attempt_id=attempt_id, mypostcard_job_id=999)
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

    attempt = _get_attempt(attempt_id)
    assert attempt.status == PostalVerificationStatus.awaiting_verification
    assert attempt.mypostcard_job_id == 999
    assert attempt.postcard_sent_at == attempt.postcard_order_started_at


def test_editor_resend_postcard(db):
    """For when the MyPostcard dashboard shows no order."""
    user, token = generate_user()
    _, editor_token = generate_user(is_editor=True)
    attempt_id = _confirmed_attempt_id(token)
    _fail_order(attempt_id)

    with real_editor_session(editor_token) as editor:
        editor.ResendPostcard(editor_pb2.ResendPostcardReq(postal_verification_attempt_id=attempt_id))

    with patch("couchers.jobs.handlers.send_postcard", return_value=12345) as mock_send:
        while process_job():
            pass
    mock_send.assert_called_once()
    assert _get_attempt(attempt_id).status == PostalVerificationStatus.awaiting_verification


def test_postal_verification_code_case_insensitive(db):
    """Test that verification codes are case insensitive."""
    user, token = generate_user()

    # Initiate and confirm
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )
        attempt_id = res.postal_verification_attempt_id

    with postal_verification_session(token) as pv:
        pv.ConfirmPostalAddress(
            postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
        )

    # Process background job
    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        mock_send.return_value = 12345
        while process_job():
            pass

    # Get the code
    with session_scope() as session:
        attempt = session.execute(
            select(PostalVerificationAttempt).where(PostalVerificationAttempt.id == attempt_id)
        ).scalar_one()
        verification_code = attempt.verification_code
        assert verification_code

    # Verify with lowercase code
    with postal_verification_session(token) as pv:
        res = pv.VerifyPostalCode(postal_verification_pb2.VerifyPostalCodeReq(code=verification_code.lower()))
        assert res.success


def test_postal_verification_attempt_not_found(db):
    """Test accessing non-existent attempts."""
    user, token = generate_user()

    with postal_verification_session(token) as pv:
        # Try to confirm non-existent attempt
        with pytest.raises(grpc.RpcError) as e:
            pv.ConfirmPostalAddress(
                postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=999999)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        # Try to cancel non-existent attempt
        with pytest.raises(grpc.RpcError) as e:
            pv.CancelPostalVerification(
                postal_verification_pb2.CancelPostalVerificationReq(postal_verification_attempt_id=999999)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_postal_verification_other_user_attempt(db):
    """Test that users cannot access other users' attempts."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # User 1 creates an attempt
    with postal_verification_session(token1) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )
        attempt_id = res.postal_verification_attempt_id

    # User 2 tries to confirm user 1's attempt
    with postal_verification_session(token2) as pv:
        with pytest.raises(grpc.RpcError) as e:
            pv.ConfirmPostalAddress(
                postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    # User 2 tries to cancel user 1's attempt
    with postal_verification_session(token2) as pv:
        with pytest.raises(grpc.RpcError) as e:
            pv.CancelPostalVerification(
                postal_verification_pb2.CancelPostalVerificationReq(postal_verification_attempt_id=attempt_id)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_has_postal_verification_helper(db):
    """Test the has_postal_verification helper function."""
    user, token = generate_user()

    # Initially no verification
    with session_scope() as session:
        db_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert not has_postal_verification(session, db_user)

    # Complete verification
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )
        attempt_id = res.postal_verification_attempt_id

    with postal_verification_session(token) as pv:
        pv.ConfirmPostalAddress(
            postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
        )

    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        mock_send.return_value = 12345
        while process_job():
            pass

    with session_scope() as session:
        attempt = session.execute(
            select(PostalVerificationAttempt).where(PostalVerificationAttempt.id == attempt_id)
        ).scalar_one()
        verification_code = attempt.verification_code

    with postal_verification_session(token) as pv:
        pv.VerifyPostalCode(postal_verification_pb2.VerifyPostalCodeReq(code=verification_code))

    # Now should have verification
    with session_scope() as session:
        db_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert has_postal_verification(session, db_user)


def test_postal_verification_requires_donation(db):
    """Postcards cost money, so non-donors can't initiate. Mirrors phone verification."""
    user, token = generate_user(last_donated=None)

    with postal_verification_session(token) as pv:
        with pytest.raises(grpc.RpcError) as e:
            pv.InitiatePostalVerification(
                postal_verification_pb2.InitiatePostalVerificationReq(
                    address=postal_verification_pb2.PostalAddress(
                        recipient_name="Test User",
                        address_line_1="123 Main St",
                        city="Test City",
                        country_code="US",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You need to donate to Couchers.org before you can verify your address."

    # No attempt should have been created
    with session_scope() as session:
        assert not session.execute(
            select(PostalVerificationAttempt).where(PostalVerificationAttempt.user_id == user.id)
        ).scalar_one_or_none()


def _confirmed_attempt_id(token: str) -> int:
    """Takes a user through to `in_progress`, i.e. ready for the postcard-sending job."""
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    recipient_name="Test User",
                    address_line_1="123 Main St",
                    city="Test City",
                    state="CA",
                    postal_code="12345",
                    country_code="US",
                )
            )
        )
        attempt_id: int = res.postal_verification_attempt_id

    with postal_verification_session(token) as pv:
        pv.ConfirmPostalAddress(
            postal_verification_pb2.ConfirmPostalAddressReq(postal_verification_attempt_id=attempt_id)
        )

    return attempt_id


def test_bypass_emails_the_code_instead_of_posting(db, email_collector):
    """With the bypass set, no order is placed and the code is emailed instead."""
    user, token = generate_user()
    attempt_id = _confirmed_attempt_id(token)

    config.POSTAL_VERIFICATION_BYPASS_POST_AND_EMAIL_CODE_FOR_TESTING = True
    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        while process_job():
            pass
        mock_send.assert_not_called()

    with session_scope() as session:
        attempt = session.execute(
            select(PostalVerificationAttempt).where(PostalVerificationAttempt.id == attempt_id)
        ).scalar_one()
        assert attempt.status == PostalVerificationStatus.awaiting_verification
        assert attempt.postcard_sent_at is not None
        assert attempt.mypostcard_job_id is None
        verification_code = attempt.verification_code

    email = email_collector.pop_for_recipient(user.email)
    assert "[TESTING]" in email.subject
    # It must be unmistakable, right at the top, that this is a testing email
    assert "should only be sent out in testing environments" in email.plain.split("\n\n")[0]
    assert "support@couchers.org" in email.plain
    assert verification_code in email.plain

    assert len(email.attachments) == 1
    attachment = email.attachments[0]
    assert attachment.data[:4] == b"\x89PNG"
    assert 'filename="postcard.png"' in attachment.content_disposition

    # The emailed code still works, so the whole flow can be tested
    with postal_verification_session(token) as pv:
        assert pv.VerifyPostalCode(postal_verification_pb2.VerifyPostalCodeReq(code=verification_code)).success


def test_postcard_is_posted_when_bypass_is_unset(db):
    """With the bypass unset, an order is placed and its job ID recorded."""
    user, token = generate_user()
    attempt_id = _confirmed_attempt_id(token)

    config.POSTAL_VERIFICATION_BYPASS_POST_AND_EMAIL_CODE_FOR_TESTING = False
    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        mock_send.return_value = 12345
        while process_job():
            pass
        mock_send.assert_called_once()

    with session_scope() as session:
        attempt = session.execute(
            select(PostalVerificationAttempt).where(PostalVerificationAttempt.id == attempt_id)
        ).scalar_one()
        assert attempt.status == PostalVerificationStatus.awaiting_verification
        assert attempt.mypostcard_job_id == 12345


def test_check_mypostcard_jobs_skipped_when_bypassing(db):
    """The reconciliation job must not call the API when we never placed any orders."""
    config.POSTAL_VERIFICATION_BYPASS_POST_AND_EMAIL_CODE_FOR_TESTING = True
    with patch("couchers.jobs.handlers.get_order_ids") as mock_get_order_ids:
        check_mypostcard_jobs(empty_pb2.Empty())
        mock_get_order_ids.assert_not_called()


def test_generate_postcard_images():
    """
    Generates sample postcard front and back images for visual inspection.

    Output is written to test_artifacts/ (gitignored) and picked up by CI.
    """
    code = "ABC123"
    front = get_postcard_front_image()
    back = _generate_back_left_side_png(code)

    assert len(front) > 0
    assert len(back) > 0

    output_path = Path(__file__).resolve().parents[2] / "test_artifacts"
    output_path.mkdir(parents=True, exist_ok=True)
    (output_path / "postcard_front.png").write_bytes(front)
    (output_path / "postcard_back.png").write_bytes(back)
