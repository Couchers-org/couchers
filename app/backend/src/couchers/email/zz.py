"""
Email zz ids: see which emails are useful, and help with spam classification.
"""

import base64
import re
import secrets

from couchers.config import config

ZZ_PARAM = "zz"

ZZ_RE = re.compile(r"[A-Za-z0-9_-]{16}")

OPEN_PIXEL_GIF = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")

# trailing punctuation is far more likely to end the sentence than the URL
_TRAILING_PUNCTUATION = ".,;:!?)"


def generate_zz() -> str:
    return secrets.token_urlsafe(12)


def _site_url_pattern() -> re.Pattern[str]:
    return re.compile(re.escape(config.BASE_URL) + r"(?:[/?#][^\s<>\"']*)?(?![^\s<>\"'/?#])")


def _add_param(url: str, zz: str, *, amp: str) -> str:
    url, hash_sign, fragment = url.partition("#")
    separator = amp if "?" in url else "?"
    return f"{url}{separator}{ZZ_PARAM}={zz}{hash_sign}{fragment}"


def add_zz_to_plaintext_links(plain: str, zz: str) -> str:
    def replace(match: re.Match[str]) -> str:
        url = match.group(0)
        stripped = url.rstrip(_TRAILING_PUNCTUATION)
        return _add_param(stripped, zz, amp="&") + url[len(stripped) :]

    return _site_url_pattern().sub(replace, plain)


def add_zz_to_html_links(html: str, zz: str) -> str:
    href_re = re.compile(r'(href=")(' + _site_url_pattern().pattern + r')(")')
    return href_re.sub(lambda m: m.group(1) + _add_param(m.group(2), zz, amp="&amp;") + m.group(3), html)


def open_pixel_url(zz: str) -> str:
    return f"{config.BACKEND_BASE_URL}/email/open/{zz}"


def add_open_pixel(html: str, zz: str) -> str:
    pixel = f'<img src="{open_pixel_url(zz)}" width="1" height="1" alt="" style="display:block;border:0;">'
    head, body_end, tail = html.rpartition("</body>")
    if not body_end:
        return html + pixel
    return head + pixel + body_end + tail
