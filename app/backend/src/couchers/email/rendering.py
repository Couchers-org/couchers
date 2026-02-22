"""
Provides a framework for building up HTML and plaintext emails out of well-known blocks.
"""

import re
from dataclasses import dataclass
from functools import lru_cache
from html import unescape
from pathlib import Path
from typing import Any

from markupsafe import Markup

from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import I18Next
from couchers.i18n.localize import load_locales
from couchers.templating import Jinja2Template, template_folder
from couchers.utils import now


@dataclass
class EmailBlock:
    pass


@dataclass(kw_only=True)
class ParaBlock(EmailBlock):
    # A paragraph which may contain span-level HTML.
    text: str | Markup


@dataclass(kw_only=True)
class UserInfo:
    name: str
    age: int
    city: str
    avatar_url: str
    profile_url: str


@dataclass(kw_only=True)
class UserBlock(EmailBlock):
    info: UserInfo
    comment: str | Markup | None


@dataclass(kw_only=True)
class QuoteBlock(EmailBlock):
    text: str


@dataclass(kw_only=True)
class ButtonBlock(EmailBlock):
    caption: str
    target_url: str


@dataclass(kw_only=True)
class EmailFooter:
    copyright_year: int = now().year
    unsubscribe_info: UnsubscribeInfo | None


@dataclass(kw_only=True)
class UnsubscribeInfo:
    manage_notifications_url: str
    do_not_email_url: str
    topic_action_link: UnsubscribeLink
    topic_key_link: UnsubscribeLink | None = None


@dataclass(kw_only=True)
class UnsubscribeLink:
    text: str
    url: str


@lru_cache(maxsize=1)
def get_emails_i18next() -> I18Next:
    return load_locales(Path(__file__).parent / "locales")


def render_html_body(
    *,
    subject: str,
    preview: str | None,
    blocks: list[EmailBlock],
    footer: EmailFooter,
    loc_context: LocalizationContext,
) -> str:
    """
    Renders the body of an email as HTML.
    """
    snippets = _HTMLSnippets.get()
    concats: list[str] = []

    # Render the header
    concats += snippets.header_template.render(
        {
            "header_subject": subject,
            "header_preview": preview or "",
        },
        loc_context,
    )

    # Render each block
    for block in blocks:
        match block:
            case ParaBlock():
                concats += snippets.paragraph_block_template.render(block.__dict__, loc_context)
            case ButtonBlock():
                concats += snippets.button_block_template.render(block.__dict__, loc_context)
            case UserBlock():
                concats += snippets.user_block_template.render(
                    {
                        "name": block.info.name,
                        "age": block.info.age,
                        "city": block.info.city,
                        "avatar_url": block.info.avatar_url,
                        "comment": block.comment,
                    },
                    loc_context,
                )
            case QuoteBlock():
                concats += snippets.quote_block_template.render(block.__dict__, loc_context)
            case _:
                raise AssertionError(f"Unexpected email block type: {block.__class__}")

    # Render the footer
    footer_args: dict[str, Any] = {}
    footer_args["footer_copyright_year"] = footer.copyright_year
    if unsubscribe_info := footer.unsubscribe_info:
        footer_args["footer_manage_notifications_link"] = unsubscribe_info.manage_notifications_url
        footer_args["footer_do_not_email_link"] = unsubscribe_info.do_not_email_url
        footer_args["footer_notification_topic_action"] = unsubscribe_info.topic_action_link.text
        footer_args["footer_notification_topic_action_link"] = unsubscribe_info.topic_action_link.url

        if topic_key_link := unsubscribe_info.topic_key_link:
            footer_args["footer_notification_topic_key"] = topic_key_link.text
            footer_args["footer_notification_topic_key_link"] = topic_key_link.url

    concats += snippets.footer_template.render(footer_args, loc_context)

    return "\n".join(concats)


def render_plaintext_body(*, blocks: list[EmailBlock], footer: EmailFooter, loc_context: LocalizationContext) -> str:
    """
    Renders the body of an email as plaintext.
    """
    lines: list[str] = []
    for block in blocks:
        match block:
            case ParaBlock():
                lines.append(_to_plaintext(block.text))
            case ButtonBlock():
                line = get_emails_i18next().localize(
                    "plaintext_formats.button", loc_context.locale, {"caption": block.caption, "url": block.target_url}
                )
                lines.append(line)
            case UserBlock():
                line = get_emails_i18next().localize(
                    "plaintext_formats.user",
                    loc_context.locale,
                    {"name": block.info.name, "age": str(block.info.age), "city": block.info.city},
                )
                lines.append(line)
                if block.comment:
                    lines.append(_to_plaintext(block.comment))
            case QuoteBlock():
                for line in block.text.splitlines():
                    lines.append(f"> {line}")
            case _:
                raise AssertionError(f"Unexpected email block type: {block.__class__}")
        lines.append("\n")
    return "\n".join(lines)


def _to_plaintext(text: str | Markup) -> str:
    return unescape(text) if isinstance(text, Markup) else text


@dataclass
class _HTMLSnippets:
    """Renders an email as HTML or plaintext using snippets for the header, footer and each block."""

    header_template: Jinja2Template
    footer_template: Jinja2Template
    paragraph_block_template: Jinja2Template
    button_block_template: Jinja2Template
    user_block_template: Jinja2Template
    quote_block_template: Jinja2Template

    @lru_cache(maxsize=1)
    @staticmethod
    def get() -> _HTMLSnippets:
        full_template = (template_folder / "generated_html" / "blocks.html").read_text(encoding="utf8")
        section_matches = list(_block_regex.finditer(full_template))

        header_template = full_template[: section_matches[0].start()]
        footer_template = full_template[section_matches[-1].end() :]
        block_templates = {match.group("name"): match.group("snippet") for match in section_matches}

        return _HTMLSnippets(
            header_template=Jinja2Template(source=header_template, html=True),
            footer_template=Jinja2Template(source=footer_template, html=True),
            paragraph_block_template=Jinja2Template(source=block_templates["paragraph"], html=True),
            button_block_template=Jinja2Template(source=block_templates["button"], html=True),
            user_block_template=Jinja2Template(source=block_templates["user"], html=True),
            quote_block_template=Jinja2Template(source=block_templates["quote"], html=True),
        )


# Matches a begin-block / end-block pair of comments in the html file containing template blocks.
_block_regex = re.compile(
    r"""
<!-- begin-block:(?P<name>\w+) -->\s*
(?P<snippet>[\s\S]*?)
\s*<!-- end-block:(?P=name) -->
""".strip(),
    re.MULTILINE,
)
