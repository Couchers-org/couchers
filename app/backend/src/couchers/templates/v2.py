"""
template mailer/push notification formatter v2
"""

import logging
import re
from dataclasses import dataclass, field
from datetime import date, datetime, time
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
from couchers.i18n.localize import get_i18next, localize_date, localize_datetime, localize_time

logger = logging.getLogger(__name__)

template_folder = Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2"

md = MarkdownIt("zero", {"typographer": True}).enable(["smartquotes", "heading", "hr", "list", "link", "emphasis"])


def render_template(template: str, args: dict[str, Any], context: Context) -> str:
    """Renders an a jinja2 template which may use our jinja2 filters."""

    env = Environment(trim_blocks=True)
    env.autoescape = context.output_html
    env.finalize = lambda value: _finalize(value, context)
    env.filters["multiline"] = _filter_multiline
    env.filters["quotelines"] = _filter_quotelines
    env.filters["markdown"] = _filter_markdown
    env.filters["html"] = _filter_html
    env.filters["date"] = _filter_date
    env.filters["time"] = _filter_time
    env.filters["datetime"] = _filter_datetime
    env.filters["translate"] = _filter_translate

    args = {**args, Context.KEY: context}
    return env.from_string(template).render(args)


@dataclass(frozen=True, slots=True, kw_only=True)
class Context:
    """Context available to filter functions during templating."""

    KEY: ClassVar[str] = "_filter_context"

    output_html: bool = True

    i18next: I18Next = field(default_factory=get_i18next)

    locale: str
    """The locale to use when localizing strings or formatting times."""

    timezone: ZoneInfo
    """The timezone to use when formatting times."""

    @staticmethod
    def from_jinja(jinja_context: JinjaContext) -> Context:
        context: Context = jinja_context[Context.KEY]
        return context


def _finalize(value: Any, context: Context) -> Any:
    match value:
        case date():
            return localize_date(value, context.locale)
        case datetime():
            return localize_datetime(value, context.timezone, context.locale)
        case time():
            return localize_time(value, context.locale)
        case Timestamp():
            return localize_datetime(value, context.timezone, context.locale)
        case _:
            return value


@pass_context
def _filter_multiline(jinja_context: JinjaContext, value: str) -> str | Markup:
    # Escape the HTML but render newlines as HTML.
    if Context.from_jinja(jinja_context).output_html:
        return Markup(escape(value).replace("\n", "<br>"))
    else:
        return value


@pass_context
def _filter_quotelines(jinja_context: JinjaContext, value: str) -> str:
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


@pass_context
def _filter_html(jinja_context: JinjaContext, value: Any) -> Markup:
    """Marks a string as safely containing HTML, so it won't get escaped."""
    return Markup(value)


@pass_context
def _filter_date(jinja_context: JinjaContext, value: date | str) -> str:
    context = Context.from_jinja(jinja_context)
    if isinstance(value, str):
        value = date.fromisoformat(value)
    return localize_date(value, context.locale)


@pass_context
def _filter_time(jinja_context: JinjaContext, value: datetime | time) -> str:
    context = Context.from_jinja(jinja_context)
    if isinstance(value, datetime):
        value = value.astimezone(context.timezone).time()
    return localize_time(value, context.locale)


@pass_context
def _filter_datetime(jinja_context: JinjaContext, value: datetime | Timestamp) -> str:
    context = Context.from_jinja(jinja_context)
    return localize_datetime(value, context.timezone, context.locale)


@pass_context
def _filter_translate(jinja_context: JinjaContext, key: str, **kwargs: Any) -> Markup:
    """
    Jinja2 filter to translate a string key with substitutions.

    Usage in template:
        {{ "greeting_key"|translate(name=user.name) }}
    """

    context = Context.from_jinja(jinja_context)

    # Translated strings are trusted and may include HTML tags,
    # but substitutions are untrusted and shouldn't.

    substitutions = kwargs
    if context.output_html:
        substitutions = {k: escape(str(v)) for k, v in kwargs.items()}

    value = context.i18next.get_string(key, context.locale, substitutions)

    if context.output_html:
        # Translated strings may contain newlines for convenience.
        # Turn them into HTML like breaks.
        value = value.replace("\n", "<br>")
    else:
        # Translated strings may contain simple and trusted tags.
        # But since we're not outputting HTML, strip them.
        # Doesn't support nesting, but should be sufficient for our needs.
        value = re.sub(r"<(\w+).*?>(.*?)</\1>", _replace_html_tag_match, value)
        value = re.sub(r"<br\s*/?>", "\n", value)

    return Markup(value)


def _replace_html_tag_match(match: re.Match[str]) -> str:
    tag = match.group(1)
    inner_text = match.group(2)
    if tag.lower() == "a":
        # <a href="url">text</a> -> <text>
        return f"<{inner_text}>"
    else:
        # <b>hello</b> -> hello
        return inner_text
