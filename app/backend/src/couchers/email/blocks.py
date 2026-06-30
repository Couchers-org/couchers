"""
Data model for emails built out of well-known blocks,
that can be rendered HTML and plaintext for any locale.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Self

from markupsafe import Markup

from couchers import urls
from couchers.email.locales import get_emails_i18next
from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import SubstitutionDict, full_string_key
from couchers.proto import api_pb2
from couchers.utils import now


@dataclass
class EmailBase(ABC):
    """
    Base class for email data models, which capture all the data required to render
    an email's subject line and body as HTML or plaintext, in any locale.
    """

    user_name: str

    @property
    @abstractmethod
    def string_key_base(self) -> str: ...

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        """Gets the subject line header of the email."""
        return self._localize(loc_context, ".subject")

    def get_preview_line(self, loc_context: LocalizationContext) -> str | None:
        """Gets the line that gets shown as a preview next to the title in users' inboxes."""
        return None

    @abstractmethod
    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        """Gets the blocks that form the body of the email."""
        ...

    def _body_builder(
        self,
        loc_context: LocalizationContext,
        *,
        default_greeting: bool = True,
        default_closing: bool = True,
        security_warning: bool = False,
    ) -> EmailBlocksBuilder:
        builder = EmailBlocksBuilder(locales=loc_context.locale_list, string_key_base=self.string_key_base)
        if default_greeting:
            builder.para("generic.greeting_line", {"name": self.user_name})
        if security_warning:
            builder.para("generic.security_warning_contact_support", epilogue=True)
        if default_closing:
            builder.para("generic.closing_lines.default", epilogue=True)
        return builder

    @classmethod
    @abstractmethod
    def test_instances(cls) -> list[Self]:
        """
        Returns dummy instances covering every distinct rendering variant of this email.

        Emails whose subject or body depends on internal state (e.g. a status enum or a
        boolean) build their localization keys dynamically, so a single dummy instance only
        exercises one branch. Such emails override this to return one instance per branch,
        ensuring the rendering tests resolve every localization key the class can produce.
        """
        ...

    # Helpers for localizing email-specific strings
    def _localize(
        self, loc_context: LocalizationContext, key: str, substitutions: SubstitutionDict | None = None
    ) -> str:
        key = full_string_key(key, relative_base=self.string_key_base)
        return loc_context.localize_string(key, i18next=get_emails_i18next(), substitutions=substitutions)


@dataclass
class EmailBlock:
    """Base class for building blocks of an email body, HTML/plaintext-agnostic."""

    pass


@dataclass(kw_only=True, slots=True)
class ParaBlock(EmailBlock):
    """A paragraph of text which may contain span-level HTML."""

    text: str | Markup


@dataclass(kw_only=True, slots=True)
class UserBlock(EmailBlock):
    """A banner with another user's profile information, for example preceding a quoted message."""

    info: UserInfo
    comment: str | Markup | None


@dataclass(kw_only=True, slots=True)
class UserInfo:
    name: str
    age: int
    city: str
    avatar_url: str
    profile_url: str

    @classmethod
    def from_protobuf(cls, user: api_pb2.User) -> Self:
        return cls(
            name=user.name,
            age=user.age,
            city=user.city,
            avatar_url=user.avatar_thumbnail_url or urls.icon_url(),
            profile_url=urls.user_link(username=user.username),
        )

    @staticmethod
    def dummy_bob() -> UserInfo:
        return UserInfo(
            name="Bob",
            age=30,
            city="Berlin, Germany",
            avatar_url="https://couchers.org/logo512.png",
            profile_url="https://couchers.org/user/bob",
        )


@dataclass(kw_only=True, slots=True)
class QuoteBlock(EmailBlock):
    """A quoted message, typically from another user. Either plaintext or markdown."""

    text: str
    markdown: bool


@dataclass(kw_only=True, slots=True)
class ActionBlock(EmailBlock):
    """An action that can be performed by the user in response to the email."""

    text: str
    target_url: str


class EmailBlocksBuilder:
    """
    Builder object for constructing a list of localized EmailBlock's to form the body of an email.
    """

    _locales: list[str]
    _string_key_base: str
    _blocks: list[EmailBlock]
    _epilogue: list[EmailBlock]

    def __init__(self, locales: list[str], string_key_base: str):
        self._locales = locales
        self._string_key_base = string_key_base
        self._blocks = []
        self._epilogue = []

    def build(self) -> list[EmailBlock]:
        return self._blocks + self._epilogue

    def para(self, key: str, substitutions: SubstitutionDict | None = None, epilogue: bool = False) -> Self:
        return self.block(ParaBlock(text=self._markup(key, substitutions)), epilogue=epilogue)

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

    def block(self, block: EmailBlock, epilogue: bool = False) -> Self:
        if epilogue:
            self._epilogue.append(block)
        else:
            self._blocks.append(block)
        return self

    def _text(self, key: str, substitutions: SubstitutionDict | None = None) -> str:
        key = full_string_key(key, relative_base=self._string_key_base)
        return get_emails_i18next().localize(key, self._locales, substitutions)

    def _markup(self, key: str, substitutions: SubstitutionDict | None = None) -> Markup:
        key = full_string_key(key, relative_base=self._string_key_base)
        return get_emails_i18next().localize_with_markup(key, self._locales, substitutions)


@dataclass(kw_only=True)
class EmailFooter:
    timezone_name: str
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
