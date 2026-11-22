"""
Email zz ids: see which emails are useful, and help with spam classification.
"""

import base64
import html
import re
import secrets
from collections.abc import Callable
from urllib.parse import urlsplit, urlunsplit

from markupsafe import Markup

from couchers.config import config

ZZ_PARAM = "zz"

ZZ_RE = re.compile(r"[A-Za-z0-9_-]{16}")

OPEN_PIXEL_GIF = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")


def generate_zz() -> str:
    return secrets.token_urlsafe(12)


def _our_url_re() -> re.Pattern[str]:
    return re.compile(re.escape(config.BASE_URL) + r'(?:[/?#][^"]*)?')


def _get_param(url: str) -> str | None:
    for part in urlsplit(url).query.split("&"):
        if part.startswith(f"{ZZ_PARAM}="):
            return part.removeprefix(f"{ZZ_PARAM}=")
    return None


def _set_param(url: str, value: str | None) -> str:
    parts = urlsplit(url)
    query = [part for part in parts.query.split("&") if part and not part.startswith(f"{ZZ_PARAM}=")]
    if value is not None:
        query.append(f"{ZZ_PARAM}={value}")
    return urlunsplit(parts._replace(query="&".join(query)))


def _sub_our_hrefs(body: str, fn: Callable[[str], str]) -> str:
    href_re = re.compile(r'(href=")(' + _our_url_re().pattern + r')(")')
    return href_re.sub(lambda m: m.group(1) + html.escape(fn(html.unescape(m.group(2)))) + m.group(3), body)


def label_link(url: str, label: str) -> str:
    if not _our_url_re().fullmatch(url):
        return url
    return _set_param(url, label)


def label_html_links(body: Markup, label: str) -> Markup:
    return Markup(_sub_our_hrefs(body, lambda url: _set_param(url, label)))


def add_zz_to_html_links(body: str, zz: str) -> str:
    def add_zz(url: str) -> str:
        label = _get_param(url)
        return _set_param(url, f"{zz}.{label}" if label else zz)

    return _sub_our_hrefs(body, add_zz)


def remove_zz_labels(body: str) -> str:
    return _sub_our_hrefs(body, lambda url: _set_param(url, None))


def open_pixel_url(zz: str) -> str:
    return f"{config.BACKEND_BASE_URL}/email/open/{zz}"


def add_open_pixel(body: str, zz: str) -> str:
    pixel = f'<img src="{open_pixel_url(zz)}" width="1" height="1" alt="" style="display:block;border:0;">'
    head, body_end, tail = body.rpartition("</body>")
    if not body_end:
        return body + pixel
    return head + pixel + body_end + tail
