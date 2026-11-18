import re
from html.parser import HTMLParser
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
    converter.close()
    return converter.plaintext


_BLOCK_TAGS = frozenset({"p", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "blockquote"})


class _HTMLToPlaintext(HTMLParser):
    """
    Converts HTML to plaintext.
    Separate block elements with double blank lines.
    Converts (nested) lists to markdown-like plaintext.
    """

    def __init__(self) -> None:
        super().__init__()
        self._strs: list[str] = []
        self._pending_newlines = 0  # Newlines to emit before the next text
        self._lists: list[int | None] = []  # Stack of next ordinal for <ol>, None for <ul>

    @property
    def plaintext(self) -> str:
        return "".join(self._strs).strip()

    def _write(self, text: str) -> None:
        if self._pending_newlines:
            self._strs.append("\n" * self._pending_newlines)
            self._pending_newlines = 0
        self._strs.append(text)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "br":
            self._write("\n")
        elif tag == "li":
            # Write the indented list item prefix
            indent = "  " * (len(self._lists) - 1)
            ordinal = self._lists[-1] if self._lists else None
            if ordinal is None:
                self._write(f"{indent}- ")
            else:
                self._write(f"{indent}{ordinal}. ")
                self._lists[-1] = ordinal + 1
        elif tag in {"ul", "ol"}:
            if self._lists:
                # Nested lists start on the line after their parent item's text
                self._pending_newlines = 1
            if tag == "ol":
                # Get the starting ordinal from the "start" attribute, defaulting to 1
                start = dict(attrs).get("start")
                self._lists.append(int(start) if start and start.isdigit() else 1)
            else:
                self._lists.append(None)
        elif tag in _BLOCK_TAGS:
            self._pending_newlines = 2

    def handle_endtag(self, tag: str) -> None:
        # Block tag ends imply newline separators
        if tag == "li":
            self._pending_newlines = 1
        elif tag in {"ul", "ol"}:
            if self._lists:
                self._lists.pop()
            if not self._lists:
                self._pending_newlines = 2
        elif tag in _BLOCK_TAGS:
            self._pending_newlines = 2

    def handle_data(self, data: str) -> None:
        # Escapes have already been unescaped. Newlines in html are meaningless.
        text = data.replace("\n", "")
        if text:
            self._write(text)


def html_mailto_link(email: str, subject: str | None = None) -> Markup:
    url = f"mailto:{email}"
    if subject:
        query = {"subject": subject}
        url += f"?{urlencode(query)}"
    return html_link(url, text=email)


def html_link(url: str, *, text: str | None = None) -> Markup:
    return Markup(f'<a href="{escape(url)}">{escape(text or url)}</a>')
