"""
template mailer/push notification formatter v2
"""

import logging
import re
from dataclasses import dataclass, field
from datetime import date, datetime, time
from functools import lru_cache
from html import escape
from pathlib import Path
from typing import Any, ClassVar
from zoneinfo import ZoneInfo

from google.protobuf.timestamp_pb2 import Timestamp
from jinja2 import Environment, pass_context
from jinja2.runtime import Context as JinjaContext
from markdown_it import MarkdownIt
from markupsafe import Markup

from couchers.i18n.i18next import I18Next
from couchers.i18n.localize import get_main_i18next, localize_date, localize_datetime, localize_time

logger = logging.getLogger(__name__)

template_folder = Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2"

md = MarkdownIt("zero", {"typographer": True}).enable(["smartquotes", "heading", "hr", "list", "link", "emphasis"])


def render_template(template: str, args: dict[str, Any], context: Context) -> str:
    """Renders an a jinja2 template which may use our jinja2 filters."""

    args = {**args, Context.KEY: context}
    return _get_jinja_env().from_string(template).render(args)


@dataclass(frozen=True, slots=True, kw_only=True)
class Context:
    """Context available to filter functions during templating."""

    KEY: ClassVar[str] = "_filter_context"

    output_html: bool
    """If true, the output format supports HTML, so placeholders will be escaped by default."""

    locale: str
    """The locale to use when localizing strings or formatting times."""

    timezone: ZoneInfo
    """The timezone to use when formatting times."""

    i18next: I18Next = field(default_factory=get_main_i18next)
    """The I18Next instance to be used to resolve localized strings."""

    @staticmethod
    def from_jinja(jinja_context: JinjaContext) -> Context:
        context: Context = jinja_context[Context.KEY]
        return context


@lru_cache(maxsize=1)
def _get_jinja_env() -> Environment:
    env = Environment(trim_blocks=True)
    env.autoescape = False  # We do escaping in _finalize
    env.finalize = _finalize
    env.filters["multiline"] = _filter_multiline
    env.filters["quotelines"] = _filter_quotelines
    env.filters["markdown"] = _filter_markdown
    env.filters["html"] = _filter_html
    env.filters["date"] = _filter_date
    env.filters["time"] = _filter_time
    env.filters["datetime"] = _filter_datetime
    env.filters["translate"] = _filter_translate
    return env


@pass_context
def _finalize(jinja_context: JinjaContext, value: Any) -> str:
    return _format_default(value, Context.from_jinja(jinja_context))


def _format_default(value: Any, context: Context) -> str:
    """Formats a placeholder value into a jinja template with useful defaults."""
    match value:
        case date():
            return localize_date(value, context.locale)
        case datetime():
            return localize_datetime(value, context.timezone, context.locale)
        case time():
            return localize_time(value, context.locale)
        case Timestamp():
            return localize_datetime(value, context.timezone, context.locale)
        case Markup():
            return str(value)
        case _:
            return escape(str(value)) if context.output_html else str(value)


@pass_context
def _filter_multiline(jinja_context: JinjaContext, value: Any) -> str | Markup:
    """Converts newlines to HTML line breaks, if rendering HTML."""
    context = Context.from_jinja(jinja_context)
    if Context.from_jinja(jinja_context).output_html:
        value = _format_default(value, context)  # Escape input HTML unless Markup()
        return Markup(value.replace("\n", "<br>"))
    elif isinstance(value, Markup):
        return value
    else:
        return _format_default(value, context)


@pass_context
def _filter_quotelines(jinja_context: JinjaContext, value: str | Markup) -> str | Markup:
    """If plaintext, prefixes each line to indicate a quote."""
    if Context.from_jinja(jinja_context).output_html:
        return value
    else:
        return "\n".join(f"> {line}" for line in value.splitlines())


@pass_context
def _filter_markdown(jinja_context: JinjaContext, value: str) -> Markup:
    """Renders markdown into html."""
    context = Context.from_jinja(jinja_context)
    if context.output_html:
        return Markup(md.render(value))
    else:
        return Markup(value)


def _filter_html(value: Any) -> Markup:
    """Marks a string as safely containing HTML, so it won't get escaped."""
    return Markup(value)


@pass_context
def _filter_date(jinja_context: JinjaContext, value: date | datetime | str) -> str:
    """Formats a date using the context's locale."""
    context = Context.from_jinja(jinja_context)
    if isinstance(value, str):
        value = date.fromisoformat(value)
    if isinstance(value, datetime):
        value = value.astimezone(context.timezone).date()
    return localize_date(value, context.locale)


@pass_context
def _filter_time(jinja_context: JinjaContext, value: datetime | time) -> str:
    """Formats a time using the context's locale."""
    context = Context.from_jinja(jinja_context)
    if isinstance(value, datetime):
        value = value.astimezone(context.timezone).time()
    return localize_time(value, context.locale)


@pass_context
def _filter_datetime(jinja_context: JinjaContext, value: datetime | Timestamp) -> str:
    """Formats a date+time using the context's locale and timezone."""
    context = Context.from_jinja(jinja_context)
    return localize_datetime(value, context.timezone, context.locale)


@pass_context
def _filter_translate(jinja_context: JinjaContext, key: str, **kwargs: Any) -> Markup:
    """
    Looks up a localized string, applying substitutions.

    Usage in template:
        {{ "greeting_key"|translate(name=user.name) }}
    """

    context = Context.from_jinja(jinja_context)

    # Stringify substitutions, applying default formatting and
    # escaping unless they have been marked as safely containing HTML.
    substitutions: dict[str, str | int] = {}
    for k, v in kwargs.items():
        match v:
            case int():
                substitutions[k] = v
            case _:
                substitutions[k] = _format_default(v, context)

    value = context.i18next.localize(key, context.locale, substitutions)

    # Translated strings are trusted to contain simple HTML tags,
    # they can also have newlines for translator convenience.
    if context.output_html:
        # Turn newlines into HTML line breaks.
        value = value.replace("\n", "<br>")
    else:
        # Strip HTML tags that came from the strings since we're not outputting HTML.
        # Doesn't support nesting, but should be sufficient for our needs.
        value = re.sub(r"<(?P<name>\w+)(?P<attrs>[^>]*)>(?P<inner>.*?)</(?P=name)>", _replace_html_tag_match, value)
        value = re.sub(r"<br\s*/?>", "\n", value)

    return Markup(value)


def _replace_html_tag_match(match: re.Match[str]) -> str:
    inner_text = match.group("inner")
    if match.group("name").lower() == "a":
        # <a href="url">text</a> -> <url>
        # If no url, fallback to text.
        href_attr = re.search(r'\bhref="([^"]+)"', match.group("attrs"))
        link_text: str
        if href_attr:
            link_text = href_attr.group(1).removeprefix("mailto:")
        else:
            link_text = inner_text
        return f"<{link_text}>"
    else:
        # <b>hello</b> -> hello
        return inner_text
