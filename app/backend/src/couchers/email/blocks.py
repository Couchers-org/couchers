"""
Exposes a framework for constructing emails out of well-known blocks,
and rendering them to either HTML or plaintext.
"""

from dataclasses import dataclass
from functools import lru_cache
import re
from typing import Any

from couchers.templates.v2 import template_folder, render_template, Context

@dataclass
class EmailContent:
    subject: str
    preview: str
    blocks: list[EmailBlock]
    unsubscribe_info: UnsubscribeInfo | None # None if security critical

@dataclass
class EmailBlock:
    """Base class for email blocks."""
    pass

@dataclass
class TextBlock(EmailBlock):
    text: str

@dataclass
class ButtonBlock(EmailBlock):
    url: str
    text: str

@dataclass
class PersonBlock(EmailBlock):
    name: str
    age: int
    city: str
    avatar_url: str
    text: str | None

@dataclass
class QuoteBlock(EmailBlock):
    text: str

@dataclass
class UnsubscribeInfo:
    topic_text: str | None
    topic_url: str | None
    topic_action_text: str | None
    topic_action_url: str | None

@dataclass
class EmailRenderer:
    """jinja templates for the different parts of an email."""

    header_template: str | None
    footer_template: str | None
    text_block_template: str
    button_block_template: str
    person_block_template: str
    quote_block_template: str

    def render(self, content: EmailContent, context: Context) -> str:
        email_str = ""

        if self.header_template:
            email_str = render_template(self.header, {
                "header_subject": content.subject,
                "header_preview": content.preview,
            }, context)

        email_str += "\n"
        email_str += "\n"

        for block in content.blocks:
            match block:
                case TextBlock():
                    email_str += render_template(self.text_block_template, {
                        "text": block.text
                    }, context)
                case ButtonBlock():
                    email_str += render_template(self.button_block_template, {
                        "url": block.url,
                        "label": block.text
                    }, context)
                case PersonBlock():
                    email_str += render_template(self.person_block_template, {
                        "name": block.name,
                        "age": block.age,
                        "city": block.city,
                        "avatar_url": block.avatar_url
                    }, context)
                case QuoteBlock():
                    email_str += render_template(self.quote_block_template, {
                        "text": block.text
                    }, context)
                case _:
                    assert False, "Unexpected email block!"

            email_str += "\n"
            email_str += "\n"

        if self.footer_template:
            footer_args: dict[str, Any] = {
                "footer_email_is_critical": content.unsubscribe_info is None
            }
            # if content.unsubscribe_info:
            #     footer_args["footer_manage_notifications_link"] = urls.notification_settings_link()
            #     footer_args["footer_notification_topic_action"] = rendered.topic_action_unsubscribe_text
            #     footer_args["footer_notification_topic_action_link"] = generate_unsub_topic_action(notification)
            #     footer_args["footer_notification_topic_key"] = rendered.topic_key_unsubscribe_text
            #     footer_args["footer_notification_topic_key_link"] = generate_unsub_topic_key(notification)
            #     footer_args["footer_do_not_email_link"] = generate_do_not_email(user)

            email_str += render_template(self.footer_template, footer_args, context)

        return email_str


_SECTION_RE = re.compile(r"""
<!-- begin-block:(?P<name>\w+) -->\s*
(?P<snippet>[\s\S]*?)
\s*<!-- end-block:(?P=name) -->
""".strip(), re.MULTILINE)


@lru_cache(maxsize=1)
def get_html_renderer() -> EmailRenderer:
    full_template = (template_folder / "generated_html" / "prototype.html").read_text(encoding="utf8")
    section_matches = list(_SECTION_RE.finditer(full_template))

    header_template = full_template[:section_matches[0].start()]
    footer_template = full_template[section_matches[-1].end():]
    block_templates = { match.group("name"): match.group("snippet") for match in section_matches }

    return EmailRenderer(
        header_template=header_template,
        footer_template=footer_template,
        text_block_template=block_templates["text"],
        button_block_template=block_templates["button"],
        person_block_template=block_templates["person"],
        quote_block_template=block_templates["quote"],
    )


@lru_cache(maxsize=1)
def get_text_renderer() -> EmailRenderer:
    return EmailRenderer(
        header_template="",
        footer_template=(template_folder / "_footer.txt").read_text("utf8"),
        text_block_template="{{ text }}",
        button_block_template="{{ label }}: {{ url }}",
        person_block_template="{{ name }}, {{ age }}\n{{ city }}",
        quote_block_template="> {{ text }}"
    )
