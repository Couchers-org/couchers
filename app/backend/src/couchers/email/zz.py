"""
Email zz ids: see which emails are useful, and help with spam classification.
"""

import base64
import html
import re
import secrets

from couchers.config import config
from couchers.utils import add_query_params

ZZ_PARAM = "zz"

ZZ_RE = re.compile(r"[A-Za-z0-9_-]{16}")

OPEN_PIXEL_GIF = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")


def generate_zz() -> str:
    return secrets.token_urlsafe(12)


def add_zz_to_html_links(body: str, zz: str) -> str:
    href_re = re.compile(r'(href=")(' + re.escape(config.BASE_URL) + r'(?:[/?#][^"]*)?)(")')
    return href_re.sub(
        lambda m: m.group(1) + html.escape(add_query_params(html.unescape(m.group(2)), {ZZ_PARAM: zz})) + m.group(3),
        body,
    )


def open_pixel_url(zz: str) -> str:
    return f"{config.BACKEND_BASE_URL}/email/open/{zz}"


def add_open_pixel(body: str, zz: str) -> str:
    pixel = f'<img src="{open_pixel_url(zz)}" width="1" height="1" alt="" style="display:block;border:0;">'
    head, body_end, tail = body.rpartition("</body>")
    if not body_end:
        return body + pixel
    return head + pixel + body_end + tail
