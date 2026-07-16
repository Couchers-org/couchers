from html.parser import HTMLParser
from typing import Any
from urllib.parse import urlencode

from markdown_it import MarkdownIt
from markupsafe import Markup, escape

# Markdown config should match frontend's MarkdownNoSSR component.
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
