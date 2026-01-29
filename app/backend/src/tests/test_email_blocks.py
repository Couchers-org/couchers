import logging
from pathlib import Path

from couchers.email.blocks import EmailContent, TextBlock, ButtonBlock, QuoteBlock, get_html_renderer, get_text_renderer
from couchers.templates.v2 import Context

logger = logging.getLogger(__name__)

def test_email_templating() -> None:
    email = EmailContent(
        subject="New host request from Bob",
        preview="Preview",
        blocks=[
            TextBlock(text="You received a request from Bob"),
            QuoteBlock(text="Yo can you host me?"),
            ButtonBlock(url="https://foo", text="Accept"),
            TextBlock(text="Yours truly, Couchers"),
        ],
        unsubscribe_info=None
    )

    html = get_html_renderer().render(email, Context(timezone=None, locale="en", plaintext=False))
    Path(__file__ + ".out.html").write_text(html, encoding="utf8")

    plaintext = get_text_renderer().render(email, Context(timezone=None, locale="en", plaintext=True))
    Path(__file__ + ".out.txt").write_text(plaintext, encoding="utf8")

