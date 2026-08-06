from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select

from couchers.config import config
from couchers.constants import (
    POSTAL_VERIFICATION_CODE_LIFETIME,
    POSTAL_VERIFICATION_MAX_ATTEMPTS,
    POSTAL_VERIFICATION_RATE_LIMIT,
)
from couchers.db import session_scope
from couchers.helpers.postal_verification import generate_postal_verification_code, has_postal_verification
from couchers.jobs.handlers import check_mypostcard_jobs
from couchers.jobs.worker import process_job
from couchers.models import User
from couchers.models.postal_verification import PostalVerificationAttempt, PostalVerificationStatus
from couchers.postal.my_postcard import _generate_back_left_side_png
from couchers.proto import postal_verification_pb2
from couchers.resources import get_postcard_front_image
from couchers.utils import now
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import postal_verification_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


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


def test_postal_verification_disabled(db, feature_flags):
    """Test that postal verification is disabled."""
    feature_flags.set("postal_verification_enabled", False)
    user, token = generate_user()

    with postal_verification_session(token) as pv:
        with pytest.raises(grpc.RpcError) as e:
            pv.InitiatePostalVerification(
                postal_verification_pb2.InitiatePostalVerificationReq(
                    address=postal_verification_pb2.PostalAddress(
                        address_line_1="123 Main St",
                        city="Test City",
                        country_code="US",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.UNAVAILABLE


def test_postal_verification_confirm_disabled(db, feature_flags):
    """Confirming (which queues the paid postcard) must respect the flag, not just initiation."""
    feature_flags.set("postal_verification_enabled", False)
    user, token = generate_user()

    # Seed a pending attempt directly, since initiation is gated by the same flag.
    with session_scope() as session:
        attempt = PostalVerificationAttempt(
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


def test_postal_verification_code_expiry(db):
    """Test that codes expire after the configured lifetime."""
    user, token = generate_user()

    # Initiate and confirm
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
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


def test_postal_verification_rate_limit(db):
    """Test rate limiting on postal verification attempts."""
    user, token = generate_user()

    # First attempt
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
                    address_line_1="123 Main St",
                    city="Test City",
                    country_code="US",
                )
            )
        )
        attempt_id = res.postal_verification_attempt_id

    # Cancel the first attempt
    with postal_verification_session(token) as pv:
        pv.CancelPostalVerification(
            postal_verification_pb2.CancelPostalVerificationReq(postal_verification_attempt_id=attempt_id)
        )

    # Try to initiate again immediately - should be rate limited
    with postal_verification_session(token) as pv:
        with pytest.raises(grpc.RpcError) as e:
            pv.InitiatePostalVerification(
                postal_verification_pb2.InitiatePostalVerificationReq(
                    address=postal_verification_pb2.PostalAddress(
                        address_line_1="456 Other St",
                        city="Test City",
                        country_code="US",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED

    # Check status shows rate limit info
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert not status.can_initiate_new_attempt
        assert status.next_attempt_allowed_at.seconds > 0


def test_postal_verification_already_in_progress(db):
    """Test that you can't start a new attempt while one is in progress."""
    user, token = generate_user()

    # First attempt
    with postal_verification_session(token) as pv:
        pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
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
                        address_line_1="123 Main St",
                        city="Test City",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT


def test_postal_verification_postcard_send_failure(db):
    """Test handling of postcard send failure."""
    user, token = generate_user()

    # Initiate and confirm
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
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

    # Simulate postcard send failure
    with patch("couchers.jobs.handlers.send_postcard") as mock_send:
        mock_send.side_effect = Exception("API error")
        with pytest.raises(Exception, match="API error"):
            process_job()

    # Attempt should still be in_progress (job failed, not the attempt)
    with postal_verification_session(token) as pv:
        status = pv.GetPostalVerificationStatus(postal_verification_pb2.GetPostalVerificationStatusReq())
        assert status.status == postal_verification_pb2.POSTAL_VERIFICATION_STATUS_IN_PROGRESS


def test_postal_verification_code_case_insensitive(db):
    """Test that verification codes are case insensitive."""
    user, token = generate_user()

    # Initiate and confirm
    with postal_verification_session(token) as pv:
        res = pv.InitiatePostalVerification(
            postal_verification_pb2.InitiatePostalVerificationReq(
                address=postal_verification_pb2.PostalAddress(
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
                        address_line_1="123 Main St",
                        city="Test City",
                        country_code="US",
                    )
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "Please complete a donation to verify your address by post."

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


def test_simulated_postcard_emails_the_user_instead_of_mailing(db, email_collector):
    """With MYPOSTCARD_LIVE off, no order is placed and the postcard is emailed to the user instead."""
    config.MYPOSTCARD_LIVE = False
    user, token = generate_user()
    attempt_id = _confirmed_attempt_id(token)

    with patch("couchers.postal.my_postcard._place_order") as mock_order:
        while process_job():
            pass
        mock_order.assert_not_called()

    with session_scope() as session:
        attempt = session.execute(
            select(PostalVerificationAttempt).where(PostalVerificationAttempt.id == attempt_id)
        ).scalar_one()
        assert attempt.status == PostalVerificationStatus.awaiting_verification
        assert attempt.postcard_sent_at is not None
        assert attempt.mypostcard_job_id is None
        verification_code = attempt.verification_code

    email = email_collector.pop_for_recipient(user.email)
    # The email must be unmistakably an example from a test server, right at the top
    assert "EXAMPLE" in email.subject
    assert "THIS IS AN EXAMPLE. NO POSTCARD WAS PRINTED OR MAILED." in email.plain.split("Hi ")[0]
    assert "nothing has been charged" in email.plain
    assert verification_code in email.plain

    assert len(email.attachments) == 1
    attachment = email.attachments[0]
    assert attachment.data[:4] == b"\x89PNG"
    assert 'filename="example-postcard.png"' in attachment.content_disposition

    # The emailed code still works, so the whole flow can be tested
    with postal_verification_session(token) as pv:
        assert pv.VerifyPostalCode(postal_verification_pb2.VerifyPostalCodeReq(code=verification_code)).success


def test_live_postcard_places_a_real_order(db):
    """With MYPOSTCARD_LIVE on, an order is placed and its job ID recorded."""
    config.MYPOSTCARD_LIVE = True
    user, token = generate_user()
    attempt_id = _confirmed_attempt_id(token)

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


def test_check_mypostcard_jobs_skipped_when_not_live(db):
    """The reconciliation job must not call the API when we never placed any orders."""
    config.MYPOSTCARD_LIVE = False

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
