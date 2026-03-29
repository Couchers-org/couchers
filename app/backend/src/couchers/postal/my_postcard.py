import io
import json
import logging
from datetime import date
from typing import Any

import qrcode
import requests
from PIL import Image, ImageDraw, ImageFont

from couchers import urls
from couchers.config import config
from couchers.resources import get_postcard_back_template, get_postcard_font, get_postcard_front_image

logger = logging.getLogger(__name__)

API_BASE = "https://www.mypostcard.com/api/v1"


def _generate_back_left_side(verification_code: str) -> bytes:
    """
    Generates the back left side image (780x1016 px PNG at 300 DPI).

    Overlays a QR code and verification code onto the postcard-back.png template.
    """
    # Load template
    template_bytes = get_postcard_back_template()
    img = Image.open(io.BytesIO(template_bytes)).convert("RGBA")
    draw = ImageDraw.Draw(img)

    # QR code box position/size from template, extended to cover border
    qr_l, qr_t, qr_r, qr_b = 227, 419, 539, 731
    qr_extend = 5

    # Generate QR code
    qr = qrcode.QRCode(box_size=10, border=0)
    qr.add_data(urls.postal_verification_link(code=verification_code))
    qr.make(fit=True)
    qr_img: Image.Image = qr.make_image(fill_color="black", back_color="white").get_image().convert("RGBA")

    # Size and paste the QR code into the extended box area
    qr_size = min(qr_r - qr_l, qr_b - qr_t) + 2 * qr_extend
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.NEAREST)
    img.paste(qr_img, (qr_l - qr_extend, qr_t - qr_extend))

    # Verification code box position/size from template
    code_box_x, code_box_y, code_box_w, code_box_h = 251, 761, 264, 80
    code_cx = code_box_x + code_box_w // 2
    code_cy = code_box_y + code_box_h // 2

    font = ImageFont.truetype(io.BytesIO(get_postcard_font()), 58)

    draw.text((code_cx, code_cy), verification_code, fill=(255, 255, 255), font=font, anchor="mm")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


def _credentials() -> dict[str, str]:
    return {
        "api_key": config["MYPOSTCARD_API_KEY"],
        "username": config["MYPOSTCARD_USERNAME"],
        "password": config["MYPOSTCARD_PASSWORD"],
    }


def _authenticate() -> str:
    response = requests.post(
        f"{API_BASE}/auth",
        data=_credentials(),
        timeout=30,
    )
    response.raise_for_status()
    return str(response.json()["auth_token"])


def _place_order(
    auth_token: str, recipient_data: dict[str, str], front_page: bytes, back_left_side: bytes
) -> dict[str, Any]:
    """
    Places a postcard order with MyPostcard API.

    Args:
        auth_token: Authentication token from _authenticate()
        recipient_data: Recipient address fields
        front_page: PNG image for the front of the postcard (1772x1264 px at 300 DPI)
        back_left_side: PNG image for the left side of the back (780x1016 px at 300 DPI)
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
        f"{API_BASE}/place_order",
        data={
            "api_key": config["MYPOSTCARD_API_KEY"],
            "auth_token": auth_token,
            "product_code": config["MYPOSTCARD_PRODUCT_CODE"],
            "image_type": "png",
            "job_data": json.dumps(job_data),
            "campaign_id": config["MYPOSTCARD_CAMPAIGN_ID"],
        },
        files={
            "photo": ("postcard.png", front_page, "image/png"),
            "logo_addon": ("logo.png", back_left_side, "image/png"),
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def send_postcard(
    recipient_name: str,
    address_line_1: str,
    address_line_2: str | None,
    city: str,
    state: str | None,
    postal_code: str | None,
    country: str,
    verification_code: str,
) -> int:
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

    Returns:
        The MyPostcard job ID
    """

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

    result = _place_order(
        _authenticate(), recipient, get_postcard_front_image(), _generate_back_left_side(verification_code)
    )
    logger.info(f"MyPostcard order placed successfully: {result}")
    return int(result["job_id"])


def get_orders(date_from: date, date_to: date) -> Any:
    """
    Fetch all orders in a given time frame.
    """
    response = requests.post(
        f"{API_BASE}/request_orders",
        data={
            **_credentials(),
            "date_from": date_from.strftime("%Y-%m-%d"),
            "date_to": date_to.strftime("%Y-%m-%d"),
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def download_pdf(job_id: int) -> bytes:
    """
    Download the PDF for a given job ID.

    Args:
        job_id: The MyPostcard job ID

    Returns:
        PDF file contents as bytes
    """
    response = requests.post(
        f"{API_BASE}/download_pdf",
        data={
            **_credentials(),
            "job_id": job_id,
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.content
