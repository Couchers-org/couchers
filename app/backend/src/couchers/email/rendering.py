"""
Renders HTML and plaintext emails out of well-known blocks.
"""

import re
from dataclasses import dataclass
from functools import lru_cache
from html import unescape
from pathlib import Path
from typing import Any, Self

from markupsafe import Markup

from couchers import urls
from couchers.context import CouchersContext
from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import I18Next, SubstitutionDict
from couchers.i18n.locales import load_locales
from couchers.proto import api_pb2
from couchers.templating import Jinja2Template, _markdown, template_folder
from couchers.utils import now


@dataclass
class EmailBlock:
    """Base class for building blocks of an email body, HTML/plaintext-agnostic."""

    pass


@dataclass(kw_only=True)
class ParaBlock(EmailBlock):
    """A paragraph of text which may contain span-level HTML."""

    text: str | Markup


@dataclass(kw_only=True)
class UserBlock(EmailBlock):
    """A banner with another user's profile information, for example preceding a quoted message."""

    info: UserInfo
    comment: str | Markup | None


@dataclass(kw_only=True)
class UserInfo:
    name: str
    age: int
    city: str
    avatar_url: str
    profile_url: str

    @classmethod
    def from_protobuf(cls, context: CouchersContext, user: api_pb2.User) -> Self:
        return cls(
            name=user.name,
            age=user.age,
            city=user.city,
            avatar_url=user.avatar_thumbnail_url or urls.icon_url(context),
            profile_url=urls.user_link(context, username=user.username),
        )

    @staticmethod
    def dummy_bob() -> UserInfo:
        return UserInfo(
            name="Bob",
            age=30,
            city="Berlin",
            avatar_url="https://couchers.org/img/icon.png",
            profile_url="https://couchers.org/user/bob",
        )


@dataclass(kw_only=True)
class QuoteBlock(EmailBlock):
    """A quoted message, typically from another user. Either plaintext or markdown."""

    text: str
    markdown: bool


@dataclass(kw_only=True)
class ActionBlock(EmailBlock):
    """An action that can be performed by the user in response to the email."""

    text: str
    target_url: str


class EmailBlocksBuilder:
    """
    Builder object for constructing a list of EmailBlock's to form the body of an email.
    """

    _locale: str
    _string_key_prefix: str
    blocks: list[EmailBlock]

    def __init__(self, locale: str, string_key_prefix: str):
        self.blocks = []
        self._locale = locale
        self._string_key_prefix = string_key_prefix

    def para(self, key: str, substitutions: SubstitutionDict | None = None) -> Self:
        return self.block(ParaBlock(text=self._markup(key, substitutions)))

    def quote(self, text: str, *, markdown: bool) -> Self:
        return self.block(QuoteBlock(text=text, markdown=markdown))

    def user(
        self,
        info: UserInfo,
        comment_key: str | None = None,
        substitutions: SubstitutionDict | None = None,
    ) -> Self:
        comment = self._markup(comment_key, substitutions) if comment_key else None
        return self.block(UserBlock(info=info, comment=comment))

    def action(self, url: str, text_key: str, substitutions: SubstitutionDict | None = None) -> Self:
        return self.block(ActionBlock(text=self._text(text_key, substitutions), target_url=url))

    def do_not_reply_request_para(self) -> Self:
        line = get_emails_i18next().localize_with_markup("generic.do_not_reply_request", self._locale)
        return self.block(ParaBlock(text=line))

    def security_warning_para(self) -> Self:
        line = get_emails_i18next().localize_with_markup("generic.security_warning_contact_support", self._locale)
        return self.block(ParaBlock(text=line))

    def block(self, block: EmailBlock) -> Self:
        self.blocks.append(block)
        return self

    def _text(self, key: str, substitutions: SubstitutionDict | None = None) -> str:
        full_key = f"{self._string_key_prefix}.{key}"
        return get_emails_i18next().localize(full_key, self._locale, substitutions)

    def _markup(self, key: str, substitutions: SubstitutionDict | None = None) -> Markup:
        full_key = f"{self._string_key_prefix}.{key}"
        return get_emails_i18next().localize_with_markup(full_key, self._locale, substitutions)


@dataclass(kw_only=True)
class EmailFooter:
    timezone_name: str
    copyright_year: int = now().year
    unsubscribe_info: UnsubscribeInfo | None

    def to_template_args(self) -> dict[str, Any]:
        args: dict[str, Any] = {
            "footer_timezone_name": self.timezone_name,
            "footer_copyright_year": self.copyright_year,
            "footer_email_is_critical": self.unsubscribe_info is None,
        }

        if unsubscribe_info := self.unsubscribe_info:
            args.update(unsubscribe_info.to_template_args())

        return args


@dataclass(kw_only=True)
class UnsubscribeInfo:
    manage_notifications_url: str
    do_not_email_url: str
    topic_action_link: UnsubscribeLink
    topic_key_link: UnsubscribeLink | None = None

    def to_template_args(self) -> dict[str, Any]:
        args: dict[str, Any] = {
            "footer_manage_notifications_link": self.manage_notifications_url,
            "footer_do_not_email_link": self.do_not_email_url,
            "footer_notification_topic_action": self.topic_action_link.text,
            "footer_notification_topic_action_link": self.topic_action_link.url,
        }

        if topic_key_link := self.topic_key_link:
            args["footer_notification_topic_key"] = topic_key_link.text
            args["footer_notification_topic_key_link"] = topic_key_link.url

        return args


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
    """Renders the body of an email as HTML."""
    return HTMLRenderer.default().render(
        subject=subject, preview=preview, blocks=blocks, footer=footer, loc_context=loc_context
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
    footer_template_args = footer.to_template_args()
    return "".join(concat) + footer_template.render(footer_template_args, loc_context)


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


@dataclass
class HTMLRenderer:
    """Renders an email as HTML using template snippets for the header, footer and each block."""

    header_template: Jinja2Template
    footer_template: Jinja2Template
    para_block_template: Jinja2Template
    user_block_template: Jinja2Template
    quote_block_template: Jinja2Template
    action_block_template: Jinja2Template

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
                loc_context,
            )
        )

        # Render each block
        for block in blocks:
            match block:
                case ParaBlock():
                    concats.append(self.para_block_template.render(block.__dict__, loc_context))
                case UserBlock():
                    concats.append(
                        self.user_block_template.render(
                            {
                                "name": block.info.name,
                                "age": block.info.age,
                                "city": block.info.city,
                                "avatar_url": block.info.avatar_url,
                                "comment": block.comment,
                            },
                            loc_context,
                        )
                    )
                case QuoteBlock():
                    args = {"text": Markup(_markdown.render(block.text)) if block.markdown else block.text}
                    concats.append(self.quote_block_template.render(args, loc_context))
                case ActionBlock():
                    concats.append(self.action_block_template.render(block.__dict__, loc_context))
                case _:
                    raise TypeError(f"Unexpected email block type: {block.__class__}")

        # Render the footer
        footer_template_args = footer.to_template_args()
        concats.append(self.footer_template.render(footer_template_args, loc_context))

        return "\n".join(concats)

    @lru_cache(maxsize=1)
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
