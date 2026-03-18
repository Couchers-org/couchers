import json
import logging
from typing import Any

import requests

from couchers.config import config
from couchers.resources import resources_folder

logger = logging.getLogger(__name__)


def _get_postcard_front_image() -> bytes:
    """
    Returns the front image of the postcard as PNG bytes.
    """
    return (resources_folder / "postcard-front.png").read_bytes()


def _authenticate() -> str:
    """
    Authenticates with MyPostcard API and returns auth token.
    """
    response = requests.post(
        "https://www.mypostcard.com/api/v1/auth",
        data={
            "api_key": config["MYPOSTCARD_API_KEY"],
            "username": config["MYPOSTCARD_USERNAME"],
            "password": config["MYPOSTCARD_PASSWORD"],
        },
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()

    if "auth_token" not in data:
        raise Exception(f"MyPostcard auth failed: {data}")

    return str(data["auth_token"])


def _place_order(auth_token: str, recipient_data: dict[str, str], image_data: bytes) -> dict[str, Any]:
    """
    Places a postcard order with MyPostcard API.
    """
    job_data = {
        "job_details": {
            "fontName": "StoneHandwriting",
            "text": "",
            "textColor": "blue",
            "fontSize": "L",
        },
        "recipients": [recipient_data],
    }

    response = requests.post(
        "https://www.mypostcard.com/api/v1/place_order",
        data={
            "api_key": config["MYPOSTCARD_API_KEY"],
            "auth_token": auth_token,
            "product_code": config["MYPOSTCARD_PRODUCT_CODE"],
            "image_type": "png",
            "job_data": json.dumps(job_data),
            "campaign_id": config["MYPOSTCARD_CAMPAIGN_ID"],
        },
        files={
            "photo": ("postcard.png", image_data, "image/png"),
        },
        timeout=60,
    )
    response.raise_for_status()
    result: dict[str, Any] = response.json()
    return result


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
):
    """
    Sends a physical postcard with verification code via MyPostcard API.

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

    """
    # Load the postcard front image
    image_data = _get_postcard_front_image()

    # Build recipient address
    recipient = {
        "recipientName": recipient_name,
        "addressLine1": address_line_1,
        "city": city,
        "countryiso": country,
    }
    if address_line_2:
        recipient["addressLine2"] = address_line_2
    if postal_code:
        recipient["zip"] = postal_code
    if state:
        recipient["state"] = state

    # Authenticate
    auth_token = _authenticate()

    # Place the order
    result = _place_order(auth_token, recipient, image_data)
    logger.info(f"MyPostcard order placed successfully: {result}")
