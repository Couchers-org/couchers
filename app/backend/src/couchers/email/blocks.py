"""
Provides a framework for building up HTML and plaintext emails out of well-known blocks.
"""

from dataclasses import dataclass, field
from functools import lru_cache
from markupsafe import Markup
import re
from typing import Any

from couchers.i18n import LocalizationContext
from couchers.templating import Jinja2Template, template_folder
from couchers.utils import now


@dataclass(kw_only=True)
class EmailContent:
    subject: str
    preview: str | None
    blocks: list[Block] = field(default_factory=list)


@dataclass
class Block:
    pass


@dataclass(kw_only=True)
class ParagraphBlock(Block):
    # A paragraph which may contain span-level HTML.
    text: Markup


@dataclass(kw_only=True)
class UserInfo:
    name: str
    age: int
    city: str
    avatar_url: str
    profile_url: str


@dataclass(kw_only=True)
class UserBlock(Block):
    info: UserInfo
    comment: Markup | None


@dataclass(kw_only=True)
class QuoteBlock(Block):
    text: str


@dataclass(kw_only=True)
class ButtonBlock(Block):
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


@dataclass
class EmailRenderer:
    """Renders an email as HTML or plaintext using snippets for the header, footer and each block."""

    header_template: Jinja2Template | None
    footer_template: Jinja2Template | None
    paragraph_block_template: Jinja2Template
    button_block_template: Jinja2Template
    user_block_template: Jinja2Template
    quote_block_template: Jinja2Template

    def render(self, content: EmailContent, footer: EmailFooter, loc_context: LocalizationContext) -> str:
        email_str = ""

        # Render the header
        if self.header_template:
            email_str = self.header_template.render(
                {
                    "header_subject": content.subject,
                    "header_preview": content.preview or "",
                },
                loc_context,
            )
            email_str += "\n"

        # Render each block
        for block in content.blocks:
            match block:
                case ParagraphBlock():
                    email_str += self.paragraph_block_template.render(block.__dict__, loc_context)
                case ButtonBlock():
                    email_str += self.button_block_template.render(block.__dict__, loc_context)
                case UserBlock():
                    email_str += self.user_block_template.render(
                        {
                            "name": block.info.name,
                            "age": block.info.age,
                            "city": block.info.city,
                            "avatar_url": block.info.avatar_url,
                            "comment": block.comment
                        },
                        loc_context,
                    )
                case QuoteBlock():
                    email_str += self.quote_block_template.render(block.__dict__, loc_context)
                case _:
                    assert False, "Unexpected email block!"
            email_str += "\n"

        # Render the footer
        if self.footer_template:
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

            email_str += self.footer_template.render(footer_args, loc_context)

        return email_str


_block_regex = re.compile(
    r"""
<!-- begin-block:(?P<name>\w+) -->\s*
(?P<snippet>[\s\S]*?)
\s*<!-- end-block:(?P=name) -->
""".strip(),
    re.MULTILINE,
)


@lru_cache(maxsize=1)
def get_html_renderer() -> EmailRenderer:
    full_template = (template_folder / "generated_html" / "blocks.html").read_text(encoding="utf8")
    section_matches = list(_block_regex.finditer(full_template))

    header_template = full_template[: section_matches[0].start()]
    footer_template = full_template[section_matches[-1].end() :]
    block_templates = {match.group("name"): match.group("snippet") for match in section_matches}

    return EmailRenderer(
        header_template=Jinja2Template(source=header_template, html=True),
        footer_template=Jinja2Template(source=footer_template, html=True),
        paragraph_block_template=Jinja2Template(source=block_templates["paragraph"], html=True),
        button_block_template=Jinja2Template(source=block_templates["button"], html=True),
        user_block_template=Jinja2Template(source=block_templates["user"], html=True),
        quote_block_template=Jinja2Template(source=block_templates["quote"], html=True),
    )


@lru_cache(maxsize=1)
def get_plaintext_renderer() -> EmailRenderer:
    footer_template_source = (template_folder / "_footer.txt").read_text("utf8")
    return EmailRenderer(
        header_template=None,
        footer_template=Jinja2Template(source=footer_template_source, html=False),
        paragraph_block_template=Jinja2Template(source="{{ text }}\n", html=False),
        button_block_template=Jinja2Template(source="{{ caption }}: {{ target_url }}\n", html=False),
        user_block_template=Jinja2Template(source="{{ name }}, {{ age }}, {{ city }}\n", html=False),
        quote_block_template=Jinja2Template(source="{{ text|quotelines }}\n", html=False),
    )
