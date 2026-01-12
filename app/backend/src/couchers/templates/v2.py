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

from google.protobuf.timestamp_pb2 import Timestamp
from jinja2 import Environment, FileSystemLoader, pass_context
from jinja2.runtime import Context as JinjaContext
from markdown_it import MarkdownIt

from couchers.i18n.localize import format_phone_number, localize_date, localize_datetime, localize_string, localize_time

logger = logging.getLogger(__name__)

template_folder = Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2"

md = MarkdownIt("zero", {"typographer": True}).enable(["smartquotes", "heading", "hr", "list", "link", "emphasis"])


# Special context values expected by v2 filters
CONTEXT_YEAR_KEY = "_year"


@dataclass(frozen=True, slots=True, kw_only=True)
class Context:
    """Context available to filter functions during templating."""

    KEY: ClassVar[str] = "_filter_context"

    timezone: ZoneInfo
    """The timezone to use when formatting times."""

    locale: str
    """The locale to use when localizing strings or formatting times."""

    plaintext: bool
    """If true, strips html tags from localized strings."""

    @staticmethod
    def from_jinja(jinja_context: JinjaContext) -> Context:
        context: Context = jinja_context[Context.KEY]
        return context


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
def v2date(jinja_context: JinjaContext, value: date | str) -> str:
    context = Context.from_jinja(jinja_context)
    if isinstance(value, str):
        value = date.fromisoformat(value)
    return localize_date(value, context.locale)


@pass_context
def v2time(jinja_context: JinjaContext, value: datetime) -> str:
    context = Context.from_jinja(jinja_context)
    value = value.astimezone(context.timezone)
    return localize_time(value.time(), context.locale)


@pass_context
def v2timestamp(jinja_context: JinjaContext, value: Timestamp) -> str:
    context = Context.from_jinja(jinja_context)
    return localize_datetime(value, context.timezone, context.locale)


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
def v2translate(jinja_context: JinjaContext, key: str, **kwargs: Any) -> str:
    """
    Jinja2 filter to translate a string key with substitutions.

    Usage in template:
        {{ "greeting_key"|v2translate(name=user.name) }}
    """

    context = Context.from_jinja(jinja_context)

    # Prevent html injection
    escaped_substitutions = {k: escape(str(v)) for k, v in kwargs.items()}

    translated = localize_string(context.locale, key, substitutions=escaped_substitutions)

    # Translations may include simple formatting HTML like <b> or <a>,
    # but those should not appear in plain text emails.
    if context.plaintext:
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
    loader = FileSystemLoader(template_folder)
    env = Environment(loader=loader, trim_blocks=True)
    env.filters["v2esc"] = v2esc
    env.filters["v2multiline"] = v2multiline
    env.filters["v2sf"] = v2sf
    env.filters["v2url"] = v2url
    env.filters["v2phone"] = v2phone
    env.filters["v2date"] = v2date
    env.filters["v2time"] = v2time
    env.filters["v2timestamp"] = v2timestamp
    env.filters["v2quote"] = v2quote
    env.filters["v2markdown"] = v2markdown
    env.filters["v2translate"] = v2translate
    return env


def render_template(template: str, args: dict[str, Any], context: Context) -> str:
    """Renders an a jinja2 template which may use our jinja2 filters."""

    # Append to the context values used by filters
    env = _get_jinja2_env()
    args = {**args, Context.KEY: context}
    return env.from_string(template).render(args)
