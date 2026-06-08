"""
Provides string templating functionality using jinja2.
"""

from dataclasses import dataclass
from functools import cache
from html import escape
from typing import Any

from jinja2 import Environment, pass_context
from jinja2.runtime import Context as JinjaContext
from markupsafe import Markup

_OUTPUT_HTML_CONTEXT_KEY = "_output_html"


@dataclass(frozen=True, slots=True, kw_only=True)
class Jinja2Template:
    """A jinja2 template string, optionally producing HTML."""

    source: str
    """The jinja2 template source code."""

    html: bool
    """If true, the template will be treated as HTML, so placeholders will be escaped by default."""

    def render(self, args: dict[str, Any]) -> str:
        args = {**args, _OUTPUT_HTML_CONTEXT_KEY: self.html}
        return _get_jinja_env().from_string(self.source).render(args)


@cache
def _get_jinja_env() -> Environment:
    env = Environment(trim_blocks=True)
    env.autoescape = False  # We do escaping in _finalize
    env.finalize = _finalize
    return env


@pass_context
def _finalize(jinja_context: JinjaContext, value: Any) -> str:
    """
    Converts a value into a string for interpolation into the template,
    ensuring that only safe markup is preserved if the output is html.
    """

    output_html: bool = jinja_context[_OUTPUT_HTML_CONTEXT_KEY]
    match value:
        case Markup():
            return str(value)
        case _:
            if output_html:
                # Plaintext rendered in HTML context: escape markup and preserve newlines.
                return escape(str(value)).replace("\n", "<br>")
            else:
                return str(value)
