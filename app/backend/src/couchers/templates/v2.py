"""
template mailer/push notification formatter v2
"""

import logging
import re
from dataclasses import dataclass
from datetime import date, datetime, time
from functools import lru_cache
from html import escape
from pathlib import Path
from typing import Any, ClassVar

from google.protobuf.timestamp_pb2 import Timestamp
from jinja2 import Environment, pass_context
from jinja2.runtime import Context as JinjaContext
from markdown_it import MarkdownIt
from markupsafe import Markup

from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import I18Next
from couchers.i18n.localize import get_main_i18next

logger = logging.getLogger(__name__)

template_folder = Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2"

md = MarkdownIt("zero", {"typographer": True}).enable(["smartquotes", "heading", "hr", "list", "link", "emphasis"])


@dataclass(frozen=True, slots=True, kw_only=True)
class Jinja2Template:
    """Context available to filter functions during templating."""

    source: str
    """The jinja2 template source code."""

    html: bool
    """If true, the template will be treated as HTML, so placeholders will be escaped by default."""

    def render(self, args: dict[str, Any], loc_context: LocalizationContext, i18next: I18Next | None = None) -> str:
        filter_context = _FilterContext(
            output_html=self.html, i18next=i18next or get_main_i18next(), loc_context=loc_context
        )
        args = {**args, _FilterContext.KEY: filter_context}
        return _get_jinja_env().from_string(self.source).render(args)


@dataclass(frozen=True, slots=True, kw_only=True)
class _FilterContext:
    """Context available to filter functions during templating."""

    KEY: ClassVar[str] = "_filter_context"

    output_html: bool
    i18next: I18Next
    loc_context: LocalizationContext

    @staticmethod
    def from_jinja(jinja_context: JinjaContext) -> _FilterContext:
        context: _FilterContext = jinja_context[_FilterContext.KEY]
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
    """
    Converts a placeholder value into a string for output in a jinja template.
    For example, "{{ my_date }}" will honor the context's locale and timezone.
    """
    return _format_default(value, _FilterContext.from_jinja(jinja_context))


def _format_default(value: Any, filter_context: _FilterContext) -> str:
    """Formats a placeholder value into a string with useful defaults."""
    match value:
        case date():
            return filter_context.loc_context.localize_date(value)
        case datetime():
            return filter_context.loc_context.localize_datetime(value)
        case time():
            return filter_context.loc_context.localize_time(value)
        case Timestamp():
            return filter_context.loc_context.localize_datetime(value)
        case Markup():
            return str(value)
        case _:
            return escape(str(value)) if filter_context.output_html else str(value)


@pass_context
def _filter_multiline(jinja_context: JinjaContext, value: Any) -> str | Markup:
    """Converts newlines to HTML line breaks, if rendering HTML."""
    filter_context = _FilterContext.from_jinja(jinja_context)
    if filter_context.output_html:
        value = _format_default(value, filter_context)  # Escape input HTML unless Markup()
        return Markup(value.replace("\n", "<br>"))
    elif isinstance(value, Markup):
        return value
    else:
        return _format_default(value, filter_context)


@pass_context
def _filter_quotelines(jinja_context: JinjaContext, value: str | Markup) -> str | Markup:
    """If plaintext, prefixes each line to indicate a quote."""
    if _FilterContext.from_jinja(jinja_context).output_html:
        return value
    else:
        return "\n".join(f"> {line}" for line in value.splitlines())


@pass_context
def _filter_markdown(jinja_context: JinjaContext, value: str) -> Markup:
    """Renders markdown into html."""
    filter_context = _FilterContext.from_jinja(jinja_context)
    if filter_context.output_html:
        return Markup(md.render(value))
    else:
        return Markup(value)


def _filter_html(value: Any) -> Markup:
    """Marks a string as safely containing HTML, so it won't get escaped."""
    return Markup(value)


@pass_context
def _filter_date(jinja_context: JinjaContext, value: date | datetime | str) -> str:
    """Formats a date using the context's locale."""
    filter_context = _FilterContext.from_jinja(jinja_context)
    if isinstance(value, str):
        value = date.fromisoformat(value)
    return filter_context.loc_context.localize_date(value)


@pass_context
def _filter_time(jinja_context: JinjaContext, value: datetime | time) -> str:
    """Formats a time using the context's locale."""
    filter_context = _FilterContext.from_jinja(jinja_context)
    return filter_context.loc_context.localize_time(value)


@pass_context
def _filter_datetime(jinja_context: JinjaContext, value: datetime | Timestamp) -> str:
    """Formats a date+time using the context's locale and timezone."""
    filter_context = _FilterContext.from_jinja(jinja_context)
    return filter_context.loc_context.localize_datetime(value)


@pass_context
def _filter_translate(jinja_context: JinjaContext, key: str, **kwargs: Any) -> Markup:
    """
    Looks up a localized string, applying substitutions.

    Usage in template:
        {{ "greeting_key"|translate(name=user.name) }}
    """

    filter_context = _FilterContext.from_jinja(jinja_context)

    # Stringify substitutions, applying default formatting and
    # escaping unless they have been marked as safely containing HTML.
    substitutions: dict[str, str | int] = {}
    for k, v in kwargs.items():
        match v:
            case int():
                substitutions[k] = v
            case _:
                substitutions[k] = _format_default(v, filter_context)

    value = filter_context.i18next.localize(key, filter_context.loc_context.locale, substitutions)

    # Translated strings are trusted to contain simple HTML tags,
    # they can also have newlines for translator convenience.
    if filter_context.output_html:
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
