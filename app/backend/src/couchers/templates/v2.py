"""
template mailer/push notification formatter v2
"""

import logging
import re
from dataclasses import dataclass
from datetime import date, datetime
from html import escape
from pathlib import Path
from typing import Any, ClassVar
from zoneinfo import ZoneInfo

from google.protobuf.timestamp_pb2 import Timestamp
from jinja2 import Environment, FileSystemLoader, pass_context
from jinja2.runtime import Context
from markdown_it import MarkdownIt
from sqlalchemy.orm import Session

from couchers import urls
from couchers.config import config
from couchers.email import queue_email
from couchers.i18n.i18n import format_phone_number, localize_date, localize_datetime, localize_string, localize_time
from couchers.utils import now

logger = logging.getLogger(__name__)

template_folder = Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2"

loader = FileSystemLoader(template_folder)
env = Environment(loader=loader, trim_blocks=True)

md = MarkdownIt("zero", {"typographer": True}).enable(["smartquotes", "heading", "hr", "list", "link", "emphasis"])


# Special context values expected by v2 filters
CONTEXT_YEAR_KEY = "_year"


@dataclass(slots=True, kw_only=True)
class FilterContext:
    """Context passed to filter functions."""

    KEY: ClassVar[str] = "_filter_context"

    timezone: ZoneInfo
    """The timezone to use when formatting times."""

    locale: str
    """The locale to use when localizing strings or formatting times."""

    plaintext: bool
    """If true, strips html tags from localized strings."""

    @staticmethod
    def get(jinja2_context: Context) -> FilterContext:
        filter_context: FilterContext = jinja2_context[FilterContext.KEY]
        return filter_context


def v2esc(value: Any) -> str:
    return escape(str(value))


def v2multiline(value: str) -> str:
    return "<br />".join(value.splitlines())


def v2sf(value: str) -> str:
    return value


def v2url(value: str) -> str:
    return value


def v2phone(value: str) -> str:
    return format_phone_number(value)


@pass_context
def v2date(context: Context, value: date | str) -> str:
    filter_context = FilterContext.get(context)
    if isinstance(value, str):
        value = date.fromisoformat(value)
    return localize_date(value, filter_context.locale)


@pass_context
def v2time(context: Context, value: datetime) -> str:
    filter_context = FilterContext.get(context)
    value = value.astimezone(filter_context.timezone)
    return localize_time(value.time(), filter_context.locale)


@pass_context
def v2timestamp(context: Context, value: Timestamp) -> str:
    filter_context = FilterContext.get(context)
    return localize_datetime(value, filter_context.timezone, filter_context.locale)


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


def replace_tag(match: re.Match[str]) -> str:
    tag = match.group(1)
    inner_text = match.group(2)
    if tag.lower() == "a":
        # <a href="url">text</a> -> <text>
        return f"<{inner_text}>"
    else:
        # <b>hello</b> -> hello
        return inner_text


@pass_context
def v2translate(context: Context, key: str, **kwargs: Any) -> str:
    """
    Jinja2 filter to translate a string key with substitutions.

    Usage in template:
        {{ "greeting_key"|v2translate(name=user.name) }}
    """

    filter_context = FilterContext.get(context)

    # Prevent html injection
    escaped_substitutions = {k: escape(str(v)) for k, v in kwargs.items()}

    translated = localize_string(filter_context.locale, key, substitutions=escaped_substitutions)

    # Translations may include simple formatting HTML like <b> or <a>,
    # but those should not appear in plain text emails.
    if filter_context.plaintext:
        # Doesn't support nesting, but should be sufficient for our needs
        translated = re.sub(r"<(\w+).*?>(.*?)</\1>", replace_tag, translated)
        translated = re.sub(r"<br\s*/?>", "\n", translated)

    else:
        # HTML support, email flavored
        # mjml rendering converts <br /> to <br>, so prefer that form.
        translated = translated.replace("\n", "<br>")

    return translated


def add_filters(env: Environment) -> None:
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


add_filters(env)


def send_simple_pretty_email(
    session: Session, recipient: str, subject: str, template_name: str, template_args: dict[str, Any]
) -> None:
    """
    This is a simplified version of couchers.notifications.background._send_email_notification

    It's for the few security emails where we don't have a user to email but send directly to an email address.
    """
    filter_context = FilterContext(
        # Not yet localizable
        timezone=ZoneInfo("Etc/UTC"),
        locale="en",
        plaintext=True,
    )

    template_args[FilterContext.KEY] = filter_context

    template_args[CONTEXT_YEAR_KEY] = now().year

    template_args["header_subject"] = subject
    template_args["footer_email_is_critical"] = True  # Results in no unsubscribe footer.

    plain_tmplt = (template_folder / f"{template_name}.txt").read_text()
    plain_tmplt_footer = (template_folder / "_footer.txt").read_text()
    filter_context.plaintext = True
    plain = env.from_string(plain_tmplt + plain_tmplt_footer).render(template_args)

    filter_context.plaintext = False
    html_tmplt = (template_folder / "generated_html" / f"{template_name}.html").read_text()
    html = env.from_string(html_tmplt).render(template_args)

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
