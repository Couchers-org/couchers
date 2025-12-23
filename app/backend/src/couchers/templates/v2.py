"""
template mailer/push notification formatter v2
"""

import logging
import re
from dataclasses import dataclass
from datetime import date, datetime
from functools import lru_cache
from html import escape
from pathlib import Path
from typing import Any, ClassVar
from zoneinfo import ZoneInfo

import phonenumbers
from google.protobuf.timestamp_pb2 import Timestamp
from jinja2 import Environment, FileSystemLoader, pass_context
from jinja2.runtime import Context
from markdown_it import MarkdownIt
from sqlalchemy.orm import Session

from couchers import urls
from couchers.config import config
from couchers.email import queue_email
from couchers.i18n.i18n import get_raw_translation_string
from couchers.models import User
from couchers.utils import get_tz_as_text, now, to_aware_datetime

logger = logging.getLogger(__name__)

_template_folder = Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2"

md = MarkdownIt("zero", {"typographer": True}).enable(["smartquotes", "heading", "hr", "list", "link", "emphasis"])


@dataclass
class FilterContext:
    """Context passed to filter functions."""

    KEY: ClassVar[str] = "_filter_context"

    timezone: ZoneInfo
    language: str
    plaintext: bool

    @staticmethod
    def get(jinja2_context: Context) -> "FilterContext":
        return jinja2_context[FilterContext.KEY]


def v2esc(value: Any) -> str:
    return escape(str(value))


def v2multiline(value: str) -> str:
    return "<br />".join(value.splitlines())


def v2sf(value: str) -> str:
    return value


def v2url(value: str) -> str:
    return value


def v2phone(value: str) -> str:
    return phonenumbers.format_number(phonenumbers.parse(value), phonenumbers.PhoneNumberFormat.INTERNATIONAL)


def v2date(value: date | str, user: User | None = None) -> str:
    # todo: user locale-based date formatting
    if isinstance(value, str):
        value = date.fromisoformat(value)
    return value.strftime("%A %-d %B %Y")


@pass_context
def v2time(context: Context, value: datetime) -> str:
    tz = FilterContext.get(context).timezone
    return value.astimezone(tz=tz).strftime("%-I:%M %p (%H:%M)")


@pass_context
def v2timestamp(context: Context, value: Timestamp) -> str:
    tz = FilterContext.get(context).timezone
    return to_aware_datetime(value).astimezone(tz=tz).strftime("%A %-d %B %Y at %-I:%M %p (%H:%M)")


def v2avatar(user: Any) -> str:
    if not user.avatar_thumbnail_url:
        return urls.icon_url()
    return user.avatar_thumbnail_url  # type: ignore[no-any-return]


def v2quote(value: str) -> str:
    """
    Multiline quote, use in place of markdown in plaintext emails
    """
    return "\n> ".join([""] + value.splitlines())


def v2markdown(value: str) -> str:
    return md.render(value)  # type: ignore[no-any-return]


@pass_context
def v2translate(context: Context, key: str, **kwargs: Any) -> str:
    """
    Jinja2 filter to translate a string key with substitutions.

    Usage in template:
        {{ "greeting_key"|v2translate(name=user.name) }}
    """

    filter_context = FilterContext.get(context)

    key_separator = key.find(".")
    component = key[0:key_separator]
    key = key[key_separator + 1 :]

    # Prevent html injection
    escaped_substitutions = {k: escape(str(v)) for k, v in kwargs.items()}

    translated = get_raw_translation_string(
        filter_context.language, component, key, substitutions=escaped_substitutions
    )

    # Translations may include simple formatting HTML like <b> or <a>,
    # but those should not appear in plain text emails.
    if filter_context.plaintext:

        def replace_tag(match: re.Match) -> str:
            tag = match.group(1)
            inner_text = match.group(2)
            if tag.lower() == "a":
                # <a href="url">text</a> -> <text>
                return f"<{inner_text}>"
            else:
                # <b>hello</b> -> hello
                return inner_text

        # Doesn't support nesting, but should be sufficient for our needs
        translated = re.sub(r"<(\w+).*?>(.*?)</\1>", replace_tag, translated)
        translated = re.sub(r"<br\s*/?>", "\n", translated)

    else:
        # HTML support, email flavored
        # mjml rendering converts <br /> to <br>, so prefer that form.
        translated = translated.replace("\n", "<br>")

    return translated


@lru_cache(maxsize=1)
def _get_jinja2_env() -> Environment:
    loader = FileSystemLoader(_template_folder)
    env = Environment(loader=loader, trim_blocks=True)
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
    env.filters["v2markdown"] = v2markdown
    env.filters["v2translate"] = v2translate
    return env


@dataclass
class NotificationManagement:
    settings_url: str
    topic_action_text: str | None
    topic_action_url: str | None
    topic_key_text: str | None
    topic_key_url: str | None
    do_not_email_url: str


def render_email(
    name: str,
    args: dict,
    lang: str,
    timezone: ZoneInfo,
    notification_management: NotificationManagement | None,
    plaintext: bool,
) -> str:
    if plaintext:
        template = (_template_folder / f"{name}.txt").read_text()
        template += (_template_folder / "_footer.txt").read_text()
    else:
        template = (_template_folder / "generated_html" / f"{name}.html").read_text()

    args = args.copy()

    # Fill in footer vars
    args["footer_copyright_year"] = now().year
    args["footer_timezone_display"] = get_tz_as_text(timezone.key)

    if notification_management is not None:
        args["footer_manage_notifications_link"] = notification_management.settings_url
        args["footer_do_not_email_link"] = notification_management.do_not_email_url
        if notification_management.topic_action_text:
            args["footer_notification_topic_action"] = notification_management.topic_action_text
            args["footer_notification_topic_action_link"] = notification_management.topic_action_url
        if notification_management.topic_key_text:
            args["footer_notification_topic_key"] = notification_management.topic_key_text
            args["footer_notification_topic_key_link"] = notification_management.topic_key_url

    return render_template(template, args, lang=lang, timezone=timezone, plaintext=plaintext)


def render_template(template: str, args: dict, lang: str, timezone: ZoneInfo, plaintext: bool) -> str:
    """Renders an email template string that potentially uses jinja2 filters."""

    # Append to the context values used by filters
    args = {**args, FilterContext.KEY: FilterContext(timezone=timezone, language=lang, plaintext=plaintext)}

    env = _get_jinja2_env()
    return env.from_string(template).render(args)


def send_simple_pretty_email(
    session: Session, recipient: str, subject: str, template_name: str, template_args: dict[str, Any]
) -> None:
    """
    This is a simplified version of couchers.notifications.background._send_email_notification

    It's for the few security emails where we don't have a user to email but send directly to an email address.
    """

    def render(plaintext: bool):
        return render_email(
            template_name,
            template_args,
            lang="en",
            timezone=ZoneInfo("Etc/UTC"),
            notification_management=None,
            plaintext=plaintext,
        )

    plain = render(plaintext=True)
    html = render(plaintext=False)

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
