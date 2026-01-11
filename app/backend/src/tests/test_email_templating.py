import logging
from pathlib import Path

from couchers.email.templating import EmailContent, EmailTemplate, TextSection, ButtonSection, QuoteSection, load_html_template, load_text_template, render_email
from couchers.templates.v2 import Context, template_folder

logger = logging.getLogger(__name__)

def test_email_templating() -> None:
    email = EmailContent(
        subject="New host request from Bob",
        preview="Preview",
        body=[
            TextSection(text="You received a request from Bob"),
            QuoteSection(text="Yo can you host me?"),
            ButtonSection(url="https://foo", text="Accept"),
            TextSection(text="Yours truly, Couchers"),
        ],
        unsubscribe_info=None
    )

    html_template = load_html_template()
    html = render_email(email, html_template, Context(timezone=None, locale="en", plaintext=False))
    Path(__file__ + ".out.html").write_text(html, encoding="utf8")

    plaintext_template = EmailTemplate(
        header="",
        footer=(template_folder / "_footer.txt").read_text("utf8"),
        text_section="{{ text }}",
        button_section="{{ label }}: {{ url }}",
        person_section="{{ name }}, {{ age }}\n{{ city }}",
        quote_section="> {{ text }}"
    )

    plaintext_template = load_text_template()
    plaintext = render_email(email, plaintext_template, Context(timezone=None, locale="en", plaintext=True))
    Path(__file__ + ".out.txt").write_text(plaintext, encoding="utf8")

