"""
template mailer/push notification formatter v2
"""

import logging
from datetime import date
from html import escape
from pathlib import Path
from zoneinfo import ZoneInfo

import phonenumbers
from jinja2 import Environment, FileSystemLoader

from couchers import urls
from couchers.config import config
from couchers.email import queue_email
from couchers.utils import get_tz_as_text, now, to_aware_datetime

logger = logging.getLogger(__name__)

template_folder = Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2"

loader = FileSystemLoader(template_folder)
env = Environment(loader=loader, trim_blocks=True)


def v2esc(value):
    return escape(str(value))


def v2multiline(value):
    return "<br />".join(value.splitlines())


def v2sf(value):
    return value


def v2url(value):
    return value


def v2phone(value):
    return phonenumbers.format_number(phonenumbers.parse(value), phonenumbers.PhoneNumberFormat.INTERNATIONAL)


def v2date(value, user):
    # todo: user locale-based date formatting
    if isinstance(value, str):
        value = date.fromisoformat(value)
    return value.strftime("%A %-d %B %Y")


def v2time(value, user):
    tz = ZoneInfo(user.timezone or "Etc/UTC")
    return value.astimezone(tz=tz).strftime("%-I:%M %p (%H:%M)")


def v2timestamp(value, user):
    tz = ZoneInfo(user.timezone or "Etc/UTC")
    return to_aware_datetime(value).astimezone(tz=tz).strftime("%A %-d %B %Y at %-I:%M %p (%H:%M)")


def v2avatar(user):
    if not user.avatar_thumbnail_url:
        return urls.icon_url()
    return user.avatar_thumbnail_url


def v2quote(value):
    """
    Multiline quote
    """
    return "\n> ".join([""] + value.splitlines())


def add_filters(env):
    env.filters["v2esc"] = v2esc
    env.filters["v2multiline"] = v2multiline
    env.filters["v2sf"] = v2sf
    env.filters["v2url"] = v2url
    env.filters["v2phone"] = v2phone
    env.filters["v2date"] = v2date
    env.filters["v2time"] = v2time
    env.filters["v2timestamp"] = v2timestamp
    env.filters["v2avatar"] = v2avatar
    env.filters["v2quote"] = v2quote


add_filters(env)


def send_simple_pretty_email(session, recipient, subject, template_name, template_args):
    """
    This is a simplified version of couchers.notifications.background._send_email_notification

    It's for the few security emails where we don't have a user to email but send directly to an email address.
    """
    template_args["_year"] = now().year
    template_args["_timezone_display"] = get_tz_as_text("Etc/UTC")

    plain_unsub_section = "\n\n---\n\nThis is a security email, you cannot unsubscribe from it."
    html_unsub_section = "This is a security email, you cannot unsubscribe from it."

    plain_tmplt = (template_folder / f"{template_name}.txt").read_text()
    plain = env.from_string(plain_tmplt + plain_unsub_section).render(template_args)
    html_tmplt = (template_folder / "generated_html" / f"{template_name}.html").read_text()
    html = env.from_string(html_tmplt.replace("___UNSUB_SECTION___", html_unsub_section)).render(template_args)

    queue_email(
        session,
        sender_name=config["NOTIFICATION_EMAIL_SENDER"],
        sender_email=config["NOTIFICATION_EMAIL_ADDRESS"],
        recipient=recipient,
        subject=config["NOTIFICATION_PREFIX"] + subject,
        plain=plain,
        html=html,
        source_data=config["VERSION"] + f"/{template_name}",
    )
