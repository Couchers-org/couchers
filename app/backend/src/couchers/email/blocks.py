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

@dataclass
class Email:
    subject: str
    preview: str | None
    blocks: list[Block] = field(default_factory=list)

@dataclass
class Block:
    pass

@dataclass
class ParagraphBlock(Block):
    # A paragraph which may contain span-level HTML.
    text: Markup

@dataclass
class UserInfo:
    name: str
    age: int
    city: str
    avatar_url: str
    profile_url: str

@dataclass
class UserBlock(Block):
    info: UserInfo
    comment: Markup | None

@dataclass
class QuoteBlock(Block):
    text: str

@dataclass
class ButtonBlock(Block):
    caption: str
    target_url: str

@dataclass
class EmailRenderer:
    """jinja templates for the different parts of an email."""

    header_template: Jinja2Template | None
    footer_template: Jinja2Template | None
    paragraph_block_template: Jinja2Template
    button_block_template: Jinja2Template
    user_block_template: Jinja2Template
    quote_block_template: Jinja2Template

    def render(self, email: Email, loc_context: LocalizationContext) -> str:
        email_str = ""

        if self.header_template:
            email_str = self.header_template.render({
                "header_subject": email.subject,
                "header_preview": email.preview,
            }, loc_context)

        for block in email.blocks:
            match block:
                case ParagraphBlock():
                    email_str += self.paragraph_block_template.render({
                        "text": block.text
                    }, loc_context)
                case ButtonBlock():
                    email_str += self.button_block_template.render({
                        "caption": block.caption,
                        "target_url": block.target_url
                    }, loc_context)
                case UserBlock():
                    email_str += self.user_block_template({
                        "name": block.info.name,
                        "age": block.info.age,
                        "city": block.info.city,
                        "avatar_url": block.info.avatar_url
                    }, loc_context)
                case QuoteBlock():
                    email_str += self.quote_block_template({
                        "text": block.text
                    }, loc_context)
                case _:
                    assert False, "Unexpected email block!"

        if self.footer_template:
            footer_args: dict[str, Any] = {}
            # if content.unsubscribe_info:
            #     footer_args["footer_manage_notifications_link"] = urls.notification_settings_link()
            #     footer_args["footer_notification_topic_action"] = rendered.topic_action_unsubscribe_text
            #     footer_args["footer_notification_topic_action_link"] = generate_unsub_topic_action(notification)
            #     footer_args["footer_notification_topic_key"] = rendered.topic_key_unsubscribe_text
            #     footer_args["footer_notification_topic_key_link"] = generate_unsub_topic_key(notification)
            #     footer_args["footer_do_not_email_link"] = generate_do_not_email(user)

            email_str += self.footer_template.render(footer_args, loc_context)

        return email_str

_SECTION_RE = re.compile(r"""
<!-- begin-block:(?P<name>\w+) -->\s*
(?P<snippet>[\s\S]*?)
\s*<!-- end-block:(?P=name) -->
""".strip(), re.MULTILINE)


@lru_cache(maxsize=1)
def get_html_renderer() -> EmailRenderer:
    full_template = (template_folder / "generated_html" / "blocks.html").read_text(encoding="utf8")
    section_matches = list(_SECTION_RE.finditer(full_template))

    header_template = full_template[:section_matches[0].start()] + "\n\n"
    footer_template = "\n\n" + full_template[section_matches[-1].end():]
    block_templates = { match.group("name"): match.group("snippet") for match in section_matches }

    return EmailRenderer(
        header_template=header_template,
        footer_template=footer_template,
        paragraph_block_template=block_templates["paragraph"],
        button_block_template=block_templates["button"],
        user_block_template=block_templates["user"],
        quote_block_template=block_templates["quote"],
    )

@lru_cache(maxsize=1)
def get_plaintext_renderer() -> EmailRenderer:
    return EmailRenderer(
        header_template="",
        footer_template=(template_folder / "_footer.txt").read_text("utf8"),
        paragraph_block_template="{{ text }}\n\n",
        button_block_template="{{ caption }}: {{ target_url }}\n\n",
        person_block_template="{{ name }}, {{ age }}, {{ city }}\n\n",
        quote_block_template="{{ text|quotelines }}\n\n"
    )
