import io
import json
import logging
from typing import Any

import qrcode
import requests
from PIL import Image, ImageDraw, ImageFont

from couchers.config import config
from couchers.resources import get_postcard_back_template, get_postcard_font, get_postcard_front_image

logger = logging.getLogger(__name__)

API_BASE = "https://www.mypostcard.com/api/v1"


def _generate_back_left_side(verification_code: str, qr_code_url: str) -> bytes:
    """
    Generates the back left side image (780x1016 px PNG at 300 DPI).

    Overlays a QR code and verification code onto the postcard-back.png template.
    """
    # Load template
    template_bytes = get_postcard_back_template()
    img = Image.open(io.BytesIO(template_bytes)).convert("RGBA")
    draw = ImageDraw.Draw(img)

    # QR code box position/size from template, inset 5px on each side
    qr_box_x = 227 + 5
    qr_box_y = 419 + 5
    qr_box_w = 312 - 10
    qr_box_h = 312 - 10

    # Generate QR code with white background and padding
    qr_padding = 8
    qr = qrcode.QRCode(version=1, box_size=10, border=0)
    qr.add_data(qr_code_url)
    qr.make(fit=True)
    qr_img: Image.Image = qr.make_image(fill_color="black", back_color="white").get_image().convert("RGBA")

    # Size the QR code to fit inside the box minus padding
    qr_content_size = min(qr_box_w, qr_box_h) - 2 * qr_padding
    qr_img = qr_img.resize((qr_content_size, qr_content_size), Image.NEAREST)

    # Create white background for the full QR box area
    qr_bg = Image.new("RGBA", (qr_box_w, qr_box_h), (255, 255, 255, 255))
    qr_bg.paste(qr_img, (qr_padding, qr_padding))
    img.paste(qr_bg, (qr_box_x, qr_box_y))

    # Verification code box position/size from template
    code_box_x = 251
    code_box_y = 761
    code_box_w = 264
    code_box_h = 80
    code_cx = code_box_x + code_box_w // 2
    code_cy = code_box_y + code_box_h // 2

    # Pick font size to fill ~80% of the box width
    font_bytes = io.BytesIO(get_postcard_font())
    target_w = int(code_box_w * 0.8)
    font_size = 100
    while font_size > 8:
        font_bytes.seek(0)
        font = ImageFont.truetype(font_bytes, font_size)
        bbox = draw.textbbox((0, 0), verification_code, font=font)
        tw = bbox[2] - bbox[0]
        if tw <= target_w:
            break
        font_size -= 1

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
    logger.info(response.text)
    logger.info(response.json())
    logger.info(response.status_code)
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
) -> str:
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

    Returns:
        The MyPostcard job ID
    """
    front_page = get_postcard_front_image()
    back_left_side = _generate_back_left_side(verification_code, qr_code_url)

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

    auth_token = _authenticate()

    result = _place_order(auth_token, recipient, front_page, back_left_side)
    logger.info(f"MyPostcard order placed successfully: {result}")
    return str(result["job_id"])


def get_orders(date_from: str, date_to: str) -> Any:
    """
    Fetch all orders in a given time frame.

    Args:
        date_from: Start date (YYYY-MM-DD)
        date_to: End date (YYYY-MM-DD)
    """
    response = requests.post(
        f"{API_BASE}/request_orders",
        data={
            **_credentials(),
            "date_from": date_from,
            "date_to": date_to,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def download_pdf(job_id: str) -> bytes:
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
