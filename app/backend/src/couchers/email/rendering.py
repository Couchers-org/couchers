"""
Renders blocks-based emails to HTML or plaintext emails for a locale.
"""

import re
from dataclasses import asdict, dataclass
from email.headerregistry import Address
from functools import cache
from html import unescape
from pathlib import Path
from typing import Any

from markdown_it import MarkdownIt
from markupsafe import Markup

from couchers.config import config
from couchers.email.blocks import ActionBlock, EmailBase, EmailBlock, EmailFooter, ParaBlock, QuoteBlock, UserBlock
from couchers.email.locales import get_emails_i18next
from couchers.email.smtp import embed_html_relative_images
from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import SubstitutionDict, full_string_key
from couchers.proto.internal import jobs_pb2
from couchers.templating import Jinja2Template

template_folder = Path(__file__).parent.parent.parent.parent / "templates" / "v2"

_markdown = MarkdownIt("zero", {"typographer": True}).enable(
    ["smartquotes", "heading", "hr", "list", "link", "emphasis"]
)


@dataclass(kw_only=True, slots=True)
class RenderedEmail:
    subject: str
    body_plaintext: str
    body_html: str
    html_image_parts: list[jobs_pb2.EmailPart]


def render_email(
    email: EmailBase, footer: EmailFooter, loc_context: LocalizationContext, *, embed_images: bool = True
) -> RenderedEmail:
    """Renders an EmailBase object to subject and body strings."""
    subject = email.get_subject_line(loc_context)
    preview = email.get_preview_line(loc_context)
    body_blocks = email.get_body_blocks(loc_context)

    body_plaintext = render_plaintext_body(blocks=body_blocks, footer=footer, loc_context=loc_context)
    body_html = render_html_body(
        subject=subject, preview=preview, blocks=body_blocks, footer=footer, loc_context=loc_context
    )

    related_parts: list[jobs_pb2.EmailPart] = []
    if embed_images:
        content_id_domain = Address(addr_spec=config.NOTIFICATION_EMAIL_ADDRESS).domain
        body_html, related_parts = embed_html_relative_images(
            body_html, base_dir=template_folder, content_id_domain=content_id_domain
        )

    return RenderedEmail(
        subject=subject, body_plaintext=body_plaintext, body_html=body_html, html_image_parts=related_parts
    )


def render_plaintext_body(*, blocks: list[EmailBlock], footer: EmailFooter, loc_context: LocalizationContext) -> str:
    """Renders the body of an email as plaintext."""
    concat: list[str] = []

    previous_block: EmailBlock | None = None
    for block in blocks:
        # Blank line between every two blocks except subsequent actions.
        if previous_block is not None:
            if isinstance(block, ActionBlock) and isinstance(previous_block, ActionBlock):
                concat.append("\n")
            else:
                concat.append("\n\n")

        match block:
            case ParaBlock():
                concat.append(_to_plaintext(block.text))
            case UserBlock():
                line = get_emails_i18next().localize(
                    "plaintext_formats.user",
                    loc_context.locale,
                    {"name": block.info.name, "age": str(block.info.age), "city": block.info.city},
                )
                concat.append(line)
                if block.comment:
                    concat.append("\n")
                    concat.append(_to_plaintext(block.comment))
            case QuoteBlock():
                for line in block.text.splitlines():
                    concat.append(f"> {line}")
            case ActionBlock():
                line = get_emails_i18next().localize(
                    "plaintext_formats.action", loc_context.locale, {"text": block.text, "url": block.target_url}
                )
                concat.append(line)
            case _:
                raise TypeError(f"Unexpected email block type: {block.__class__}")
        previous_block = block

    concat.append("\n\n")

    footer_template = Jinja2Template(
        source=(template_folder / "_footer.txt").read_text(encoding="utf8").strip(), html=False
    )
    footer_template_args = _get_footer_template_args(footer, loc_context)
    concat.append(footer_template.render(footer_template_args))

    return "".join(concat)


def _to_plaintext(text: str | Markup) -> str:
    """
    Converts any markup in its plaintext equivalent, allowing reuse of translations that have span-level markup
    like <b> when formatting as plaintext email bodies.
    """
    if not isinstance(text, Markup):  # Markup derives from str so can't test for isinstance(, str)
        return text

    # Convert markup to its plaintext equivalent.
    # This code is not security-sensitive since we're producing a plaintext string where markup will not be evaluated.

    # Strip/convert any markup since we can't render it in plaintext.
    text = text.replace("\n", "")  # Newlines are irrelevant in markup
    text = re.sub(r"<br\s*/?>", "\n", text)  # But <br>'s should be newlines in plaintext

    # Keep the content of span-level markup (assume no nesting)
    text = re.sub(
        r"<(?P<name>\w+)(?P<attrs>[^>]*)>(?P<inner>.*?)</(?P=name)>", lambda match: match.group("inner"), text
    )
    text = re.sub(r"<\w+[^/>]*/>", "", text)  # Remove any other self-closing tag

    # We've handled tags but still have escapes like "&gt;", convert those to plaintext.
    return unescape(text)


def _get_footer_template_args(footer: EmailFooter, loc_context: LocalizationContext) -> dict[str, Any]:
    i18n = get_emails_i18next()

    def localize(key: str, substitutions: SubstitutionDict | None = None) -> Markup:
        key = full_string_key(key, relative_base="generic.footer")
        return i18n.localize_with_markup(key, loc_context.locale, substitutions)

    args: dict[str, Any] = {
        "received_because": localize(".received_because"),
        "contact_support": localize(".contact_support"),
        "timezone_note": localize(".timezone_note", {"timezone": footer.timezone_name}),
        "copyright_year": footer.copyright_year,
        "donate_link": localize(".donate_link"),
        "volunteer_link": localize(".volunteer_link"),
        "blog_link": localize(".blog_link"),
        "nonprofit_note": localize(".nonprofit_note"),
        "is_critical": footer.unsubscribe_info is None,
    }

    if unsubscribe_info := footer.unsubscribe_info:
        # TODO(#7420): Localize "Turn off emails for: " text, avoiding string concatenations.
        args.update(
            {
                "notification_settings_link": localize(".notification_settings_link"),
                "manage_notifications_url": unsubscribe_info.manage_notifications_url,
                "do_not_email_link": localize(".do_not_email_link"),
                "do_not_email_url": unsubscribe_info.do_not_email_url,
                "topic_action_description": unsubscribe_info.topic_action_link.text,
                "unsubscribe_topic_action_url": unsubscribe_info.topic_action_link.url,
            }
        )

        if topic_key_link := unsubscribe_info.topic_key_link:
            args["topic_key_description"] = topic_key_link.text
            args["unsubscribe_topic_key_url"] = topic_key_link.url
    else:
        args["security_email_note"] = localize(".security_email_note")

    return args


def render_html_body(
    *,
    subject: str,
    preview: str | None,
    blocks: list[EmailBlock],
    footer: EmailFooter,
    loc_context: LocalizationContext,
) -> str:
    """Renders the body of an email as HTML."""
    return HTMLRenderer.default().render(
        subject=subject, preview=preview, blocks=blocks, footer=footer, loc_context=loc_context
    )


@dataclass(kw_only=True, slots=True)
class TwoButtonHTMLBlock(EmailBlock):
    """An HTML-only block used internally for rendering as side-by-side buttons."""

    text_1: str
    target_url_1: str
    text_2: str
    target_url_2: str


# Matches a begin-block / end-block pair of comments in the html file containing template
_block_regex = re.compile(
    r"""
<!-- begin-block:(?P<name>[\w-]+) -->\s*
(?P<snippet>[\s\S]*?)
\s*<!-- end-block:(?P=name) -->
""".strip(),
    re.MULTILINE,
)


@dataclass
class HTMLRenderer:
    """Renders an email as HTML using template snippets for the header, footer and each block."""

    header_template: Jinja2Template
    footer_template: Jinja2Template
    para_block_template: Jinja2Template
    user_block_template: Jinja2Template
    quote_block_template: Jinja2Template
    action_block_template: Jinja2Template
    two_buttons_block_template: Jinja2Template

    def render(
        self,
        *,
        subject: str,
        preview: str | None,
        blocks: list[EmailBlock],
        footer: EmailFooter,
        loc_context: LocalizationContext,
    ) -> str:
        concats: list[str] = []

        # Render the header
        concats.append(
            self.header_template.render(
                {
                    "header_subject": subject,
                    "header_preview": preview or "",
                },
            )
        )

        # Render each block
        for block in type(self)._merge_action_blocks(blocks):
            match block:
                case ParaBlock():
                    concats.append(self.para_block_template.render(asdict(block)))
                case UserBlock():
                    concats.append(
                        self.user_block_template.render(
                            {
                                "name": block.info.name,
                                "age": block.info.age,
                                "city": block.info.city,
                                "profile_url": block.info.profile_url,
                                "avatar_url": block.info.avatar_url,
                                "comment": block.comment,
                            },
                        )
                    )
                case QuoteBlock():
                    args = {"text": Markup(_markdown.render(block.text)) if block.markdown else block.text}
                    concats.append(self.quote_block_template.render(args))
                case ActionBlock():
                    concats.append(self.action_block_template.render(asdict(block)))
                case TwoButtonHTMLBlock():
                    concats.append(self.two_buttons_block_template.render(asdict(block)))
                case _:
                    raise TypeError(f"Unexpected email block type: {block.__class__}")

        # Render the footer
        footer_template_args = _get_footer_template_args(footer, loc_context)
        concats.append(self.footer_template.render(footer_template_args))

        return "\n".join(concats)

    @staticmethod
    def _merge_action_blocks(blocks: list[EmailBlock]) -> list[EmailBlock]:
        """Merge any two subsequent action blocks into a single two-button block."""
        blocks = blocks.copy()

        block_index = 0
        while block_index + 1 < len(blocks):
            block = blocks[block_index]
            next_block = blocks[block_index + 1]
            if isinstance(block, ActionBlock) and isinstance(next_block, ActionBlock):
                blocks[block_index] = TwoButtonHTMLBlock(
                    target_url_1=block.target_url,
                    text_1=block.text,
                    target_url_2=next_block.target_url,
                    text_2=next_block.text,
                )
                blocks.pop(block_index + 1)

            block_index += 1

        return blocks

    @cache
    @staticmethod
    def default() -> HTMLRenderer:
        template = (template_folder / "generated_html" / "blocks.html").read_text(encoding="utf8")
        return HTMLRenderer.from_template(template)

    @staticmethod
    def from_template(template: str) -> HTMLRenderer:
        section_matches = list(_block_regex.finditer(template))

        header_template = template[: section_matches[0].start()]
        footer_template = template[section_matches[-1].end() :]
        block_templates = {match.group("name"): match.group("snippet") for match in section_matches}

        return HTMLRenderer(
            header_template=Jinja2Template(source=header_template, html=True),
            footer_template=Jinja2Template(source=footer_template, html=True),
            para_block_template=Jinja2Template(source=block_templates["para"], html=True),
            user_block_template=Jinja2Template(source=block_templates["user"], html=True),
            quote_block_template=Jinja2Template(source=block_templates["quote"], html=True),
            action_block_template=Jinja2Template(source=block_templates["action"], html=True),
            two_buttons_block_template=Jinja2Template(source=block_templates["two-buttons"], html=True),
        )
