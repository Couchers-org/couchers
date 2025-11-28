# Postal Verification Design Document

**NOTE:** This document was written by Claude.

## Overview

Postal verification is a new identity verification method for Couchers.org where users verify their physical address by receiving a postcard with a unique verification code. This provides an additional layer of trust by confirming the user has access to a real-world mailing address.

### Goals

1. Allow users to verify their physical address by receiving a postcard
2. Store history of all postal verification attempts (like Strong Verification)
3. Implement rate limiting: one initiation per month maximum
4. Support both QR code scanning and manual code entry
5. Award a badge upon successful verification

### User Flow

1. User enters their address
2. Backend validates/corrects address via Address Validation API
3. User confirms the corrected address
4. Backend generates a 6-character alphanumeric code (uppercase)
5. Backend calls Postcard API to send a postcard with the code
6. User waits for postcard to arrive (days to weeks)
7. User either scans QR code on postcard or manually enters code
8. On success: user receives badge, marked as postal-verified

---

## Database Models

### PostalVerificationStatus Enum

```python
class PostalVerificationStatus(enum.Enum):
    # User has initiated, awaiting address confirmation
    pending_address_confirmation = enum.auto()
    # Address confirmed, postcard being sent
    in_progress = enum.auto()
    # Postcard sent, awaiting user to enter code
    awaiting_verification = enum.auto()
    # Successfully verified
    succeeded = enum.auto()
    # Failed (too many wrong attempts or expired)
    failed = enum.auto()
    # Cancelled by user
    cancelled = enum.auto()
```

### PostalVerificationAttempt Model

```python
class PostalVerificationAttempt(Base):
    """
    An attempt to perform postal verification by sending a postcard with a code.
    """

    __tablename__ = "postal_verification_attempts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    status: Mapped[PostalVerificationStatus] = mapped_column(
        Enum(PostalVerificationStatus),
        default=PostalVerificationStatus.pending_address_confirmation,
    )

    # Address fields (normalized/validated)
    # Required: address_line_1, city, country
    # Optional: address_line_2, state, postal_code (varies by country)
    address_line_1: Mapped[str] = mapped_column(String)
    address_line_2: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str] = mapped_column(String)
    state: Mapped[str | None] = mapped_column(String, nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str] = mapped_column(String)  # ISO 3166-1 alpha-2

    # The original address as entered by user (for audit), stored as JSON
    original_address_json: Mapped[str | None] = mapped_column(String, nullable=True)

    # Verification code (6 chars, uppercase alphanumeric)
    verification_code: Mapped[str | None] = mapped_column(String, nullable=True)

    # Timestamps
    address_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    postcard_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Code entry attempts
    code_attempts: Mapped[int] = mapped_column(Integer, server_default=text("0"))

    # Hybrid properties
    @hybrid_property
    def is_valid(self) -> bool:
        return self.status == PostalVerificationStatus.succeeded

    @is_valid.expression
    @classmethod
    def is_valid(cls):
        return cls.status == PostalVerificationStatus.succeeded

    # Relationships
    user: Mapped["User"] = relationship("User")

    # Constraints
    __table_args__ = (
        # Only one active attempt per user at a time
        Index(
            "ix_postal_verification_one_active_per_user",
            user_id,
            unique=True,
            postgresql_where=(
                (status == PostalVerificationStatus.pending_address_confirmation)
                | (status == PostalVerificationStatus.in_progress)
                | (status == PostalVerificationStatus.awaiting_verification)
            ),
        ),
        # Index for looking up verification status for a user
        Index(
            "ix_postal_verification_attempts_current",
            user_id,
            postgresql_where=status == PostalVerificationStatus.succeeded,
        ),
        # Code must be set when in_progress or later (except cancelled)
        CheckConstraint(
            "(status IN ('pending_address_confirmation', 'cancelled') AND verification_code IS NULL) OR "
            "(status IN ('in_progress', 'awaiting_verification', 'succeeded', 'failed') AND verification_code IS NOT NULL)",
            name="postal_verification_code_status",
        ),
        # verified_at must be set when succeeded
        CheckConstraint(
            "(status != 'succeeded') OR (verified_at IS NOT NULL)",
            name="postal_verification_verified_at_status",
        ),
        # postcard_sent_at must be set when awaiting_verification or succeeded
        CheckConstraint(
            "(status NOT IN ('awaiting_verification', 'succeeded')) OR (postcard_sent_at IS NOT NULL)",
            name="postal_verification_postcard_sent_status",
        ),
    )
```

---

## Configuration

Add to `config.py`:

```python
# Postal verification feature flag
("ENABLE_POSTAL_VERIFICATION", bool),
```

Add to `constants.py`:

```python
# Postal verification constants
POSTAL_VERIFICATION_CODE_LENGTH = 6
POSTAL_VERIFICATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # No I, O, 0, 1 for clarity
POSTAL_VERIFICATION_CODE_LIFETIME = timedelta(days=90)  # Code valid for 90 days
POSTAL_VERIFICATION_MAX_ATTEMPTS = 5  # Max wrong code attempts
POSTAL_VERIFICATION_RATE_LIMIT_DAYS = 30  # Can only initiate once per 30 days
```

---

## Proto Definitions

Create new file `postal_verification.proto`:

```protobuf
syntax = "proto3";

package org.couchers.api.postal_verification;

import "google/protobuf/empty.proto";
import "google/protobuf/timestamp.proto";

import "annotations.proto";

service PostalVerification {
  option (auth_level) = AUTH_LEVEL_SECURE;

  // Step 1: Submit address for validation
  rpc InitiatePostalVerification(InitiatePostalVerificationReq) returns (InitiatePostalVerificationRes) {
    // Validates and normalizes the address. Returns a corrected address for user confirmation.
    // Returns FAILED_PRECONDITION if there's already an active attempt.
    // Returns RESOURCE_EXHAUSTED if rate limited (one attempt per 30 days).
  }

  // Step 2: Confirm the (possibly corrected) address and send postcard
  rpc ConfirmPostalAddress(ConfirmPostalAddressReq) returns (ConfirmPostalAddressRes) {
    // Confirms the address and queues postcard for sending.
    // Returns NOT_FOUND if attempt doesn't exist.
    // Returns FAILED_PRECONDITION if attempt is not in pending_address_confirmation state.
  }

  // Get current postal verification status
  rpc GetPostalVerificationStatus(GetPostalVerificationStatusReq) returns (GetPostalVerificationStatusRes) {
    // Returns the user's postal verification status and current/latest attempt details.
  }

  // Submit verification code (from postcard or QR code)
  rpc VerifyPostalCode(VerifyPostalCodeReq) returns (VerifyPostalCodeRes) {
    // Verifies the code from the postcard.
    // Returns NOT_FOUND if attempt doesn't exist.
    // Returns FAILED_PRECONDITION if attempt is not in awaiting_verification state.
  }

  // Cancel an in-progress attempt
  rpc CancelPostalVerification(CancelPostalVerificationReq) returns (google.protobuf.Empty) {
    // Cancels an active postal verification attempt.
    // Returns NOT_FOUND if attempt doesn't exist.
    // Returns FAILED_PRECONDITION if attempt is not cancellable.
  }

  // List all postal verification attempts (history)
  rpc ListPostalVerificationAttempts(ListPostalVerificationAttemptsReq) returns (ListPostalVerificationAttemptsRes) {
    // Returns all postal verification attempts for the user.
  }
}

enum PostalVerificationStatus {
  POSTAL_VERIFICATION_STATUS_UNKNOWN = 0;
  POSTAL_VERIFICATION_STATUS_PENDING_ADDRESS_CONFIRMATION = 1;
  POSTAL_VERIFICATION_STATUS_IN_PROGRESS = 2;
  POSTAL_VERIFICATION_STATUS_AWAITING_VERIFICATION = 3;
  POSTAL_VERIFICATION_STATUS_SUCCEEDED = 4;
  POSTAL_VERIFICATION_STATUS_FAILED = 5;
  POSTAL_VERIFICATION_STATUS_CANCELLED = 6;
}

// Postal address for international mail delivery.
// Required fields: address_line_1, city, country
// Optional fields: address_line_2, state, postal_code (varies by country)
message PostalAddress {
  // Required: street address, house number, building name, etc.
  string address_line_1 = 1;
  // Optional: apartment, suite, unit, floor, etc. Empty string if not provided.
  string address_line_2 = 2;
  // Required: city, town, or locality name
  string city = 3;
  // Optional: state, province, region, prefecture, etc. Empty string if not applicable.
  string state = 4;
  // Optional: postal/ZIP code. Empty string if country doesn't use postal codes.
  string postal_code = 5;
  // Required: ISO 3166-1 alpha-2 country code (e.g., "US", "DE", "JP")
  string country = 6;
}

// Step 1: Submit address for validation
message InitiatePostalVerificationReq {
  PostalAddress address = 1;
}

message InitiatePostalVerificationRes {
  // The ID of the created postal verification attempt
  int64 postal_verification_attempt_id = 1;
  // The validated/corrected address
  PostalAddress corrected_address = 2;
  // Whether the address needed correction
  bool address_was_corrected = 3;
}

// Step 2: Confirm the (possibly corrected) address and send postcard
message ConfirmPostalAddressReq {
  int64 postal_verification_attempt_id = 1;
}

message ConfirmPostalAddressRes {
  // Empty on success, postcard will be sent
}

// Get current postal verification status
message GetPostalVerificationStatusReq {
  // Optional: if 0 or not provided, returns latest attempt
  int64 postal_verification_attempt_id = 1;
}

message GetPostalVerificationStatusRes {
  // Whether user has any successful postal verification
  bool has_postal_verification = 1;

  // Current/latest attempt details (if any)
  bool has_active_attempt = 2;
  int64 postal_verification_attempt_id = 3;
  PostalVerificationStatus status = 4;
  PostalAddress address = 5;
  google.protobuf.Timestamp created = 6;
  // Set when postcard was sent. Zero value if not yet sent.
  google.protobuf.Timestamp postcard_sent_at = 7;

  // Rate limit info
  bool can_initiate_new_attempt = 8;
  // If rate limited, when user can try again. Zero value if not rate limited.
  google.protobuf.Timestamp next_attempt_allowed_at = 9;
}

// Submit verification code (from postcard or QR code)
message VerifyPostalCodeReq {
  // 6-character alphanumeric code from the postcard.
  // The attempt is looked up from the user's active attempt.
  string code = 1;
}

message VerifyPostalCodeRes {
  bool success = 1;
  // If failed, how many attempts remaining before lockout
  int32 remaining_attempts = 2;
}

// Cancel an in-progress attempt
message CancelPostalVerificationReq {
  int64 postal_verification_attempt_id = 1;
}

// List all postal verification attempts (history)
message ListPostalVerificationAttemptsReq {
  // No pagination needed for now - users won't have many attempts
}

message ListPostalVerificationAttemptsRes {
  repeated PostalVerificationAttemptSummary attempts = 1;
}

message PostalVerificationAttemptSummary {
  int64 postal_verification_attempt_id = 1;
  PostalVerificationStatus status = 2;
  PostalAddress address = 3;
  google.protobuf.Timestamp created = 4;
  // Set when verification succeeded. Zero value if not verified.
  google.protobuf.Timestamp verified_at = 5;
}
```

---

## External API Stubs

### Address Validation Service

File: `couchers/postal/address_validation.py`

```python
from dataclasses import dataclass


@dataclass
class ValidatedAddress:
    address_line_1: str
    address_line_2: str | None
    city: str
    state: str | None
    postal_code: str | None
    country: str  # ISO 3166-1 alpha-2
    was_corrected: bool
    is_deliverable: bool


class AddressValidationError(Exception):
    """Raised when address cannot be validated or is undeliverable."""

    pass


def validate_address(
    address_line_1: str,
    address_line_2: str | None,
    city: str,
    state: str | None,
    postal_code: str | None,
    country: str,
) -> ValidatedAddress:
    """
    Validates and normalizes a postal address.

    In production, this would call an external service like:
    - Google Address Validation API
    - Smarty (formerly SmartyStreets)
    - Melissa

    Args:
        address_line_1: Street address (required)
        address_line_2: Apartment/suite/unit (optional)
        city: City or locality (required)
        state: State/province/region (optional, varies by country)
        postal_code: Postal/ZIP code (optional, some countries don't have them)
        country: ISO 3166-1 alpha-2 country code (required)

    Returns:
        ValidatedAddress with normalized fields and deliverability status.

    Raises:
        AddressValidationError: If address is completely invalid/undeliverable
    """
    # STUB IMPLEMENTATION
    # For now, just normalize and return as-is
    return ValidatedAddress(
        address_line_1=address_line_1.strip(),
        address_line_2=address_line_2.strip() if address_line_2 else None,
        city=city.strip(),
        state=state.strip() if state else None,
        postal_code=postal_code.strip() if postal_code else None,
        country=country.strip().upper(),
        was_corrected=False,  # Stub always returns false
        is_deliverable=True,  # Stub always returns true
    )
```

### Postcard Service

File: `couchers/postal/postcard_service.py`

```python
from dataclasses import dataclass

from couchers.config import config


@dataclass
class PostcardResult:
    success: bool
    error_message: str | None


class PostcardServiceError(Exception):
    """Raised when postcard service fails."""

    pass


def send_postcard(
    recipient_name: str,
    address_line_1: str,
    address_line_2: str | None,
    city: str,
    state: str | None,
    postal_code: str | None,
    country: str,
    verification_code: str,
    qr_code_url: str,
) -> PostcardResult:
    """
    Sends a physical postcard with verification code.

    Args:
        recipient_name: Name to print on the postcard
        address_line_1: Street address
        address_line_2: Apartment/suite (optional)
        city: City
        state: State/province (optional)
        postal_code: Postal code (optional)
        country: ISO 3166-1 alpha-2 country code
        verification_code: The 6-character code to print
        qr_code_url: URL to encode in QR code

    Returns:
        PostcardResult with success status
    """
    if not config["ENABLE_POSTAL_VERIFICATION"]:
        return PostcardResult(
            success=False,
            error_message="Postal verification is disabled",
        )

    # STUB IMPLEMENTATION
    # In production, would make API call to postcard service
    return PostcardResult(
        success=True,
        error_message=None,
    )
```

---

## Helper Functions

File: `couchers/helpers/postal_verification.py`:

```python
import secrets

from sqlalchemy.orm import Session

from couchers.constants import (
    POSTAL_VERIFICATION_CODE_ALPHABET,
    POSTAL_VERIFICATION_CODE_LENGTH,
)
from couchers.models import PostalVerificationAttempt, User
from couchers.sql import couchers_select as select


def generate_postal_verification_code() -> str:
    """
    Generates a random 6-character uppercase alphanumeric code.
    Uses a reduced alphabet to avoid confusion (no I, O, 0, 1).
    """
    return "".join(secrets.choice(POSTAL_VERIFICATION_CODE_ALPHABET) for _ in range(POSTAL_VERIFICATION_CODE_LENGTH))


def has_postal_verification(session: Session, user: User) -> bool:
    """
    Check if user has valid postal verification.

    Similar to strong verification, we query the database rather than
    storing a denormalized flag on the user.
    """
    attempt = session.execute(
        select(PostalVerificationAttempt)
        .where(PostalVerificationAttempt.user_id == user.id)
        .where(PostalVerificationAttempt.is_valid)
        .limit(1)
    ).scalar_one_or_none()
    return attempt is not None
```

---

## Servicer Implementation

Create new file `couchers/servicers/postal_verification.py`:

```python
def InitiatePostalVerification(
    self,
    request: postal_verification_pb2.InitiatePostalVerificationReq,
    context: CouchersContext,
    session: Session,
) -> postal_verification_pb2.InitiatePostalVerificationRes:
    """
    Step 1: User submits address for validation.
    """
    if not config["ENABLE_POSTAL_VERIFICATION"]:
        context.abort_with_error_code(errors.POSTAL_VERIFICATION_DISABLED)

    user = session.get(User, context.user_id)

    # Check rate limit: one initiation per 30 days
    latest_attempt = session.execute(
        select(PostalVerificationAttempt)
        .where(PostalVerificationAttempt.user_id == user.id)
        .order_by(PostalVerificationAttempt.created.desc())
        .limit(1)
    ).scalar_one_or_none()

    if latest_attempt:
        # Check if there's an active attempt
        if latest_attempt.status in [
            PostalVerificationStatus.pending_address_confirmation,
            PostalVerificationStatus.in_progress,
            PostalVerificationStatus.awaiting_verification,
        ]:
            context.abort_with_error_code(errors.POSTAL_VERIFICATION_ALREADY_IN_PROGRESS)

        # Check rate limit
        days_since_last = (now() - latest_attempt.created).days
        if days_since_last < POSTAL_VERIFICATION_RATE_LIMIT_DAYS:
            context.abort_with_error_code(errors.POSTAL_VERIFICATION_RATE_LIMITED)

    # Validate address
    try:
        validated = validate_address(
            address_line_1=request.address.address_line_1,
            address_line_2=request.address.address_line_2 or None,
            city=request.address.city,
            state=request.address.state or None,
            postal_code=request.address.postal_code or None,
            country=request.address.country,
        )
    except AddressValidationError:
        context.abort_with_error_code(errors.POSTAL_ADDRESS_INVALID)

    if not validated.is_deliverable:
        context.abort_with_error_code(errors.POSTAL_ADDRESS_UNDELIVERABLE)

    # Create attempt
    attempt = PostalVerificationAttempt(
        user_id=user.id,
        status=PostalVerificationStatus.pending_address_confirmation,
        address_line_1=validated.address_line_1,
        address_line_2=validated.address_line_2,
        city=validated.city,
        state=validated.state,
        postal_code=validated.postal_code,
        country=validated.country,
        original_address_json=json.dumps({
            "address_line_1": request.address.address_line_1,
            "address_line_2": request.address.address_line_2,
            "city": request.address.city,
            "state": request.address.state,
            "postal_code": request.address.postal_code,
            "country": request.address.country,
        }),
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
            country=validated.country,
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
        context.abort_with_error_code(errors.NOT_FOUND)

    if attempt.status != PostalVerificationStatus.pending_address_confirmation:
        context.abort_with_error_code(errors.POSTAL_VERIFICATION_WRONG_STATE)

    # Generate verification code
    code = generate_postal_verification_code()

    attempt.verification_code = code
    attempt.status = PostalVerificationStatus.in_progress
    attempt.address_confirmed_at = now()

    session.flush()

    # Queue background job to send postcard
    queue_job(
        session,
        "send_postal_verification_postcard",
        jobs_pb2.SendPostalVerificationPostcardPayload(
            postal_verification_attempt_id=attempt.id,
        ),
    )

    return postal_verification_pb2.ConfirmPostalAddressRes()


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
        context.abort_with_error_code(errors.NOT_FOUND)

    # Check code expiry
    if attempt.postcard_sent_at and (now() - attempt.postcard_sent_at) > POSTAL_VERIFICATION_CODE_LIFETIME:
        attempt.status = PostalVerificationStatus.failed
        context.abort_with_error_code(errors.POSTAL_VERIFICATION_CODE_EXPIRED)

    # Normalize submitted code
    submitted_code = request.code.strip().upper()

    if submitted_code != attempt.verification_code:
        attempt.code_attempts += 1
        remaining = POSTAL_VERIFICATION_MAX_ATTEMPTS - attempt.code_attempts

        if remaining <= 0:
            attempt.status = PostalVerificationStatus.failed
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

    # Send notification
    notify(
        session,
        user_id=context.user_id,
        topic_action="postal_verification:success",
        data=notification_data_pb2.PostalVerificationSuccess(),
    )

    return postal_verification_pb2.VerifyPostalCodeRes(
        success=True,
        remaining_attempts=0,
    )
```

---

## Background Job

Add to `jobs.proto`:

```protobuf
message SendPostalVerificationPostcardPayload {
  int64 postal_verification_attempt_id = 1;
}
```

Add to `handlers.py`:

```python
def send_postal_verification_postcard(payload: jobs_pb2.SendPostalVerificationPostcardPayload):
    """
    Sends the postcard via external API and updates attempt status.
    """
    with session_scope() as session:
        attempt = session.get(PostalVerificationAttempt, payload.postal_verification_attempt_id)

        if not attempt or attempt.status != PostalVerificationStatus.in_progress:
            return

        user = session.get(User, attempt.user_id)

        # Generate QR code URL (only contains the code, user must be logged in)
        qr_url = postal_verification_link(code=attempt.verification_code)

        result = send_postcard(
            recipient_name=user.name,
            address_line_1=attempt.address_line_1,
            address_line_2=attempt.address_line_2,
            city=attempt.city,
            state=attempt.state,
            postal_code=attempt.postal_code,
            country=attempt.country,
            verification_code=attempt.verification_code,
            qr_code_url=qr_url,
        )

        if result.success:
            attempt.status = PostalVerificationStatus.awaiting_verification
            attempt.postcard_sent_at = now()

            # Notify user that postcard is on its way
            notify(
                session,
                user_id=user.id,
                topic_action="postal_verification:postcard_sent",
                data=notification_data_pb2.PostalVerificationPostcardSent(
                    address_city=attempt.city,
                    address_country=attempt.country,
                ),
            )
        else:
            # Could retry or fail - for now, fail
            attempt.status = PostalVerificationStatus.failed
            logger.error(f"Postcard send failed: {result.error_message}")


send_postal_verification_postcard.PAYLOAD = jobs_pb2.SendPostalVerificationPostcardPayload
```

---

## URLs

Add to `couchers/urls.py`:

```python
def postal_verification_link(*, code: str) -> str:
    return f"{config['BASE_URL']}/verify-postal?code={code}"
```

---

## Error Codes

Add to error codes:

```python
POSTAL_VERIFICATION_DISABLED = ...
POSTAL_VERIFICATION_ALREADY_IN_PROGRESS = ...
POSTAL_VERIFICATION_RATE_LIMITED = ...
POSTAL_ADDRESS_INVALID = ...
POSTAL_ADDRESS_UNDELIVERABLE = ...
POSTAL_VERIFICATION_WRONG_STATE = ...
POSTAL_VERIFICATION_CODE_EXPIRED = ...
POSTAL_VERIFICATION_MAX_ATTEMPTS = ...
```

---

## State Machine Diagram

```
                    ┌─────────────────┐
                    │     (start)     │
                    └────────┬────────┘
                             │ InitiatePostalVerification()
                             ▼
            ┌────────────────────────────────┐
            │  pending_address_confirmation  │
            └───────────┬───────────┬────────┘
                        │           │
    ConfirmPostalAddress()         CancelPostalVerification()
                        │           │
                        ▼           ▼
            ┌───────────────┐  ┌───────────┐
            │  in_progress  │  │ cancelled │
            └───────┬───────┘  └───────────┘
                    │
       send_postcard job (success)
                    │
                    ▼
        ┌────────────────────────┐
        │  awaiting_verification │
        └───────────┬────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    correct    wrong code   code expired
      code      (5x max)     (90 days)
        │           │           │
        ▼           ▼           ▼
   ┌──────────┐  ┌────────┐  ┌────────┐
   │ succeeded│  │ failed │  │ failed │
   └──────────┘  └────────┘  └────────┘
```

---

## Migration Plan

1. Create migration for:
   - `PostalVerificationStatus` enum
   - `postal_verification_attempts` table
   - Indexes and constraints

2. Update proto files and run `make protos`

3. Implement servicer methods

4. Add background job

5. Add config flags

6. Add tests

---

## Files to Create/Modify

### New Files
- `app/proto/postal_verification.proto` - New proto service definition
- `couchers/models/postal_verification.py` - New model
- `couchers/servicers/postal_verification.py` - New servicer
- `couchers/postal/__init__.py` - New package
- `couchers/postal/address_validation.py` - Address validation stub
- `couchers/postal/postcard_service.py` - Postcard service stub
- `couchers/helpers/postal_verification.py` - Helper functions
- `migrations/versions/xxxx_add_postal_verification.py` - Migration
- `tests/test_postal_verification.py` - Tests

### Modified Files
- `couchers/config.py` - Add config flag
- `couchers/constants.py` - Add constants
- `couchers/urls.py` - Add postal verification link
- `app/backend/proto/internal/jobs.proto` - Add job payload
- `couchers/jobs/handlers.py` - Add background job

---

## Security Considerations

1. **Rate Limiting**: 30-day cooldown prevents abuse of postal service
2. **Code Entropy**: 6 chars from 32-char alphabet = ~1.07 billion combinations
3. **Attempt Limiting**: 5 wrong attempts = automatic failure
4. **Code Expiry**: 90-day validity prevents indefinite guessing
5. **Address Privacy**: Original address stored for audit, validated address used
6. **QR Code Security**: QR code URL only contains the verification code (no attempt ID), user must be logged in to verify
7. **Single Active Attempt**: Database constraint ensures only one active attempt per user
8. **Sequential IDs**: Using sequential IDs is safe since attempts are user-scoped and require authentication

---

## Questions for Review

1. Should we allow users to request a re-send of the postcard (adds complexity, cost)?
2. Should verified addresses be visible to hosts/guests for trust-building?
3. Should postal verification expire (like phone verification does after 2 years)?
4. Do we need webhook callbacks from the postcard service (delivery confirmation)?
