import re
from html.parser import HTMLParser
from typing import Any
from urllib.parse import urlencode

from markdown_it import MarkdownIt
from markdown_it.rules_inline import StateInline
from markupsafe import Markup, escape

_BR_TAG_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)


def _br_tag_rule(state: StateInline, silent: bool) -> bool:
    """
    Processes inline text for <br> tags to preserve them as line breaks,
    since our MarkdownIt is otherwise configured to escape html tags.
    """
    # match is anchored at state.pos, so the tag must start there.
    # posMax bounds it to the current inline block.
    match = _BR_TAG_RE.match(state.src, state.pos, state.posMax)
    if not match:
        return False
    if not silent:
        state.push("hardbreak", "br", 0)
    state.pos = match.end()
    return True


# Markdown config should match frontend's MarkdownNoSSR component,
# which strips all HTML except <br> tags.
_markdown = MarkdownIt(
    "zero",  # Base configuration disables all features
    options_update={
        "typographer": True,  # Enable some language-neutral replacement + quotes beautification
        "breaks": True,  # Convert '\n' in paragraphs into <br>
    },
).enable(
    [
        "emphasis",  # Process *this* and _that_
        "heading",  # Headings (#, ##, ...)
        "hr",  # Horizontal rule
        "link",  # Process [link](<to> "stuff")
        "list",  # Lists
        "newline",  # Process '\n'
        "smartquotes",  # Convert straight quotation marks to typographic ones
    ]
)
_markdown.inline.ruler.before("newline", "br_tag", _br_tag_rule)


def markdown_to_html(text: str) -> Markup:
    return Markup(_markdown.render(text))


def markdown_to_plaintext(text: str) -> str:
    return html_to_plaintext(markdown_to_html(text))


def html_to_plaintext(html: str | Markup) -> str:
    """
    Renders a plaintext version of HTML by extracting inner HTML and converting entities+newlines.
    Do not use for sanitization. The resulting string may not be markup-safe.
    """

    if isinstance(html, Markup):
        html = str(html)

    converter = _HTMLToPlaintext()
    converter.feed(html)
    return converter.plaintext


class _HTMLToPlaintext(HTMLParser):
    plaintext: str

    def __init__(self) -> None:
        super().__init__()
        self.plaintext = ""

    def handle_starttag(self, tag: str, attrs: Any) -> None:
        if tag == "br":
            self.plaintext += "\n"

    def handle_data(self, data: str) -> None:
        # Escapes have already been unescaped
        self.plaintext += data.replace("\n", "")  # Newlines in html are meaningless


def html_mailto_link(email: str, subject: str | None = None) -> Markup:
    url = f"mailto:{email}"
    if subject:
        query = {"subject": subject}
        url += f"?{urlencode(query)}"
    return html_link(url, text=email)


def html_link(url: str, *, text: str | None = None) -> Markup:
    return Markup(f'<a href="{escape(url)}">{escape(text or url)}</a>')
