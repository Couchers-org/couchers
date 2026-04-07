from dataclasses import dataclass


@dataclass
class ValidatedAddress:
    address_line_1: str
    address_line_2: str | None
    city: str
    state: str | None
    postal_code: str | None
    country_code: str  # ISO 3166-1 alpha-2
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
        country_code=country.strip().upper(),
        was_corrected=False,  # Stub always returns false
        is_deliverable=True,  # Stub always returns true
    )
