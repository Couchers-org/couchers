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


# A port of stripMarkdown in app/web/utils/stripMarkdown.ts with its default options, kept regex for regex so that
# the server and the web client produce the same text.
_STRIP_MARKDOWN_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"^(-\s*?|\*\s*?|_\s*?){3,}\s*$", re.MULTILINE), ""),
    (re.compile(r"^([\s\t]*)([*\-+]|\d+\.)\s+", re.MULTILINE), r"\1"),
    (re.compile(r"\n={2,}"), "\n"),
    (re.compile(r"~{3}.*\n"), ""),
    (re.compile(r"~~"), ""),
    (re.compile(r"`{3}.*\n"), ""),
    (re.compile(r"<[^>]*>"), ""),
    (re.compile(r"^[=-]{2,}\s*\Z"), ""),
    (re.compile(r"\[\^.+?\](: .*?\Z)?"), ""),
    (re.compile(r"\s{0,2}\[.*?\]: .*?\Z"), ""),
    (re.compile(r"!\[(.*?)\][\[(].*?[\])]"), r"\1"),
    (re.compile(r"\[(.*?)\][\[(].*?[\])]"), r"\1"),
    (re.compile(r"^\s{0,3}>\s?"), ""),
    (re.compile(r"^\s{1,2}\[(.*?)\]: (\S+)( \".*?\")?\s*\Z"), ""),
    (re.compile(r"^(\n)?\s{0,}#{1,6}\s+| {0,}(\n)?\s{0,}#{0,} {0,}(\n)?\s{0,}$", re.MULTILINE), r"\1\2\3"),
    (re.compile(r"([*_]{1,3})(\S.*?\S{0,1})\1"), r"\2"),
    (re.compile(r"([*_]{1,3})(\S.*?\S{0,1})\1"), r"\2"),
    (re.compile(r"(`{3,})(.*?)\1", re.MULTILINE), r"\2"),
    (re.compile(r"`(.+?)`"), r"\1"),
    (re.compile(r"\n{2,}"), "\n\n"),
]


def strip_markdown(text: str) -> str:
    for pattern, replacement in _STRIP_MARKDOWN_RULES:
        text = pattern.sub(replacement, text)
    return text


def plaintext_snippet(markdown: str, max_length: int) -> str:
    text = strip_markdown(markdown).strip()
    if len(text) <= max_length:
        return text
    match = re.match(rf"(.{{1,{max_length}}})\s", text, re.DOTALL)
    cut = match.group(1) if match else text[:max_length]
    return cut.rstrip() + "…"


def html_mailto_link(email: str, subject: str | None = None) -> Markup:
    url = f"mailto:{email}"
    if subject:
        query = {"subject": subject}
        url += f"?{urlencode(query)}"
    return html_link(url, text=email)


def html_link(url: str, *, text: str | None = None) -> Markup:
    return Markup(f'<a href="{escape(url)}">{escape(text or url)}</a>')
