from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

import grpc
import pytest
from sqlalchemy import select

import couchers.servicers.postal_verification
from couchers.config import config
from couchers.constants import (
    POSTAL_VERIFICATION_CODE_LIFETIME,
    POSTAL_VERIFICATION_MAX_ATTEMPTS,
    POSTAL_VERIFICATION_RATE_LIMIT,
)
from couchers.db import session_scope
from couchers.helpers.postal_verification import generate_postal_verification_code, has_postal_verification
from couchers.jobs.worker import process_job
from couchers.models import User
from couchers.models.postal_verification import PostalVerificationAttempt
from couchers.postal.my_postcard import _generate_back_left_side_png
from couchers.proto import postal_verification_pb2
from couchers.resources import get_postcard_front_image
from couchers.utils import now
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import postal_verification_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _monkeypatch_postal_verification_config(monkeypatch):
    new_config = config.copy()
    new_config["ENABLE_POSTAL_VERIFICATION"] = True
    monkeypatch.setattr(couchers.servicers.postal_verification, "config", new_config)


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


def test_postal_verification_disabled(db):
    """Test that postal verification is disabled by default."""
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


def test_postal_verification_happy_path(db, monkeypatch):
    """Test the complete happy path for postal verification."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_wrong_code(db, monkeypatch):
    """Test entering wrong verification codes."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_code_expiry(db, monkeypatch):
    """Test that codes expire after the configured lifetime."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_rate_limit(db, monkeypatch):
    """Test rate limiting on postal verification attempts."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_already_in_progress(db, monkeypatch):
    """Test that you can't start a new attempt while one is in progress."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_cancel(db, monkeypatch):
    """Test cancelling a postal verification attempt."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_can_cancel_after_postcard_sent(db, monkeypatch):
    """Test that you CAN cancel after the postcard is sent (e.g., if postcard is lost)."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_list_attempts(db, monkeypatch):
    """Test listing postal verification attempts."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_address_validation(db, monkeypatch):
    """Test address validation errors."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_postcard_send_failure(db, monkeypatch):
    """Test handling of postcard send failure."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_code_case_insensitive(db, monkeypatch):
    """Test that verification codes are case insensitive."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_attempt_not_found(db, monkeypatch):
    """Test accessing non-existent attempts."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_postal_verification_other_user_attempt(db, monkeypatch):
    """Test that users cannot access other users' attempts."""
    _monkeypatch_postal_verification_config(monkeypatch)

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


def test_has_postal_verification_helper(db, monkeypatch):
    """Test the has_postal_verification helper function."""
    _monkeypatch_postal_verification_config(monkeypatch)

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
