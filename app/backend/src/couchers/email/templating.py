from dataclasses import dataclass
import re
from typing import Any

from couchers.templates.v2 import template_folder, render_template, Context

@dataclass
class EmailContent:
    subject: str
    preview: str
    body: list[BodySection]
    unsubscribe_info: UnsubscribeInfo | None # None if security critical

@dataclass
class BodySection:
    """Base class for email sections."""
    pass

@dataclass
class TextSection(BodySection):
    text: str

@dataclass
class ButtonSection(BodySection):
    url: str
    text: str

@dataclass
class PersonSection(BodySection):
    name: str
    age: int
    city: str
    avatar_url: str
    text: str | None

@dataclass
class QuoteSection(BodySection):
    text: str

@dataclass
class UnsubscribeInfo:
    topic_text: str | None
    topic_url: str | None
    topic_action_text: str | None
    topic_action_url: str | None

@dataclass
class EmailTemplate:
    """jinja templates for the different parts of an email."""

    header: str | None
    footer: str | None
    text_section: str
    button_section: str
    person_section: str
    quote_section: str

_SECTION_RE = re.compile(r"""
<!-- begin-section:(?P<name>\w+) -->\s*
(?P<snippet>[\s\S]*?)
\s*<!-- end-section:(?P=name) -->
""".strip(), re.MULTILINE)

def load_html_template() -> EmailTemplate:
    full_template = (template_folder / "generated_html" / "prototype.html").read_text(encoding="utf8")
    section_matches = list(_SECTION_RE.finditer(full_template))

    header = full_template[:section_matches[0].start()]
    footer = full_template[section_matches[-1].end():]
    sections = { match.group("name"): match.group("snippet") for match in section_matches }

    return EmailTemplate(
        header=header,
        footer=footer,
        text_section=sections["text"],
        button_section=sections["button"],
        person_section=sections["person"],
        quote_section=sections["quote"],
    )

def load_text_template() -> EmailTemplate:
    return EmailTemplate(
        header="",
        footer=(template_folder / "_footer.txt").read_text("utf8"),
        text_section="{{ text }}",
        button_section="{{ label }}: {{ url }}",
        person_section="{{ name }}, {{ age }}\n{{ city }}",
        quote_section="> {{ text }}"
    )

def render_email(content: EmailContent, template: EmailTemplate, context: Context) -> str:
    email_str = ""

    if template.header:
        email_str = render_template(template.header, {
            "header_subject": content.subject,
            "header_preview": content.preview,
        }, context)

    email_str += "\n"
    email_str += "\n"

    for section in content.body:
        match section:
            case TextSection():
                email_str += render_template(template.text_section, {
                    "text": section.text
                }, context)
            case ButtonSection():
                email_str += render_template(template.button_section, {
                    "url": section.url,
                    "label": section.text
                }, context)
            case PersonSection():
                email_str += render_template(template.person_section, {
                    "name": section.name,
                    "age": section.age,
                    "city": section.city,
                    "avatar_url": section.avatar_url
                }, context)
            case QuoteSection():
                email_str += render_template(template.quote_section, {
                    "text": section.text
                }, context)
            case _:
                assert False, "Unexpected section!"

        email_str += "\n"
        email_str += "\n"

    if template.footer:
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

        email_str += render_template(template.footer, footer_args, context)

    return email_str

