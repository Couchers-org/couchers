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
