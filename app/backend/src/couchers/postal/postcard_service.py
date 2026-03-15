import io
import json
import logging
from dataclasses import dataclass
from typing import Any

import qrcode
import requests
from PIL import Image, ImageDraw, ImageFont

from couchers.config import config

logger = logging.getLogger(__name__)

# MyPostcard API endpoints
MYPOSTCARD_AUTH_URL = "https://www.mypostcard.com/api/v1/auth"
MYPOSTCARD_PLACE_ORDER_URL = "https://www.mypostcard.com/api/v1/place_order"

# Postcard front image dimensions required by MyPostcard
POSTCARD_WIDTH = 1748
POSTCARD_HEIGHT = 1240


@dataclass
class PostcardResult:
    success: bool
    error_message: str | None


class PostcardServiceError(Exception):
    """Raised when postcard service fails."""

    pass


def _generate_postcard_image(verification_code: str, qr_code_url: str) -> bytes:
    """
    Generates the front image of the postcard (1748x1240 px JPEG).

    Contains the Couchers.org branding, verification code, and QR code.
    """
    img = Image.new("RGB", (POSTCARD_WIDTH, POSTCARD_HEIGHT), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Use default font at various sizes (Pillow's built-in bitmap font doesn't scale,
    # so we use truetype with the default font)
    font_large: ImageFont.FreeTypeFont | ImageFont.ImageFont
    font_code: ImageFont.FreeTypeFont | ImageFont.ImageFont
    font_medium: ImageFont.FreeTypeFont | ImageFont.ImageFont
    font_small: ImageFont.FreeTypeFont | ImageFont.ImageFont
    try:
        font_large = ImageFont.truetype("DejaVuSans-Bold.ttf", 80)
        font_code = ImageFont.truetype("DejaVuSans-Bold.ttf", 120)
        font_medium = ImageFont.truetype("DejaVuSans.ttf", 40)
        font_small = ImageFont.truetype("DejaVuSans.ttf", 32)
    except OSError:
        # Fallback to default font if DejaVu is not available
        font_large = ImageFont.load_default()
        font_code = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Background accent bar at top
    draw.rectangle([(0, 0), (POSTCARD_WIDTH, 200)], fill=(0, 107, 82))

    # Title
    draw.text(
        (POSTCARD_WIDTH // 2, 100),
        "Couchers.org",
        fill=(255, 255, 255),
        font=font_large,
        anchor="mm",
    )

    # Subtitle
    draw.text(
        (POSTCARD_WIDTH // 2, 300),
        "Address Verification",
        fill=(0, 107, 82),
        font=font_medium,
        anchor="mm",
    )

    # Verification code label
    draw.text(
        (POSTCARD_WIDTH // 2, 440),
        "Your verification code:",
        fill=(80, 80, 80),
        font=font_medium,
        anchor="mm",
    )

    # Verification code in a box
    code_y = 560
    code_bbox = draw.textbbox((POSTCARD_WIDTH // 2, code_y), verification_code, font=font_code, anchor="mm")
    padding = 30
    draw.rounded_rectangle(
        [
            (code_bbox[0] - padding, code_bbox[1] - padding),
            (code_bbox[2] + padding, code_bbox[3] + padding),
        ],
        radius=15,
        outline=(0, 107, 82),
        width=4,
        fill=(240, 248, 245),
    )
    draw.text(
        (POSTCARD_WIDTH // 2, code_y),
        verification_code,
        fill=(0, 80, 60),
        font=font_code,
        anchor="mm",
    )

    # QR code
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(qr_code_url)
    qr.make(fit=True)
    qr_pil_img: Image.Image = qr.make_image(fill_color="black", back_color="white").get_image().convert("RGB")
    qr_size = 280
    qr_pil_img = qr_pil_img.resize((qr_size, qr_size))
    qr_x = (POSTCARD_WIDTH - qr_size) // 2
    qr_y = 720
    img.paste(qr_pil_img, (qr_x, qr_y))

    # Instructions below QR code
    draw.text(
        (POSTCARD_WIDTH // 2, qr_y + qr_size + 40),
        "Scan the QR code or enter the code at couchers.org",
        fill=(100, 100, 100),
        font=font_small,
        anchor="mm",
    )

    # Bottom bar
    draw.rectangle([(0, POSTCARD_HEIGHT - 80), (POSTCARD_WIDTH, POSTCARD_HEIGHT)], fill=(0, 107, 82))
    draw.text(
        (POSTCARD_WIDTH // 2, POSTCARD_HEIGHT - 40),
        "Free, non-profit, community-owned couch surfing",
        fill=(255, 255, 255),
        font=font_small,
        anchor="mm",
    )

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    buf.seek(0)
    return buf.getvalue()


def _authenticate() -> str:
    """
    Authenticates with MyPostcard API and returns auth token.
    """
    response = requests.post(
        MYPOSTCARD_AUTH_URL,
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
        raise PostcardServiceError(f"MyPostcard auth failed: {data}")

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
        MYPOSTCARD_PLACE_ORDER_URL,
        data={
            "api_key": config["MYPOSTCARD_API_KEY"],
            "auth_token": auth_token,
            "product_code": config["MYPOSTCARD_PRODUCT_CODE"],
            "image_type": "jpg",
            "job_data": json.dumps(job_data),
            "campaign_id": config["MYPOSTCARD_CAMPAIGN_ID"],
        },
        files={
            "photo": ("postcard.jpg", image_data, "image/jpeg"),
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
) -> PostcardResult:
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
        PostcardResult with success status
    """
    try:
        # Generate the postcard front image
        image_data = _generate_postcard_image(verification_code, qr_code_url)

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

        return PostcardResult(success=True, error_message=None)

    except requests.RequestException as e:
        logger.error(f"MyPostcard API request failed: {e}")
        return PostcardResult(success=False, error_message=str(e))
    except PostcardServiceError as e:
        logger.error(f"MyPostcard service error: {e}")
        return PostcardResult(success=False, error_message=str(e))
