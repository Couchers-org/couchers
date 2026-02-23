"""
Defines data models for each email we sent out to users.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import Self

from markupsafe import Markup

from couchers.email.rendering import (
    ActionBlock,
    EmailBlock,
    ParaBlock,
    QuoteBlock,
    UserBlock,
    UserInfo,
    get_emails_i18next,
)
from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import SubstitutionDict


@dataclass
class EmailBase(ABC):
    """
    Base class for email data models, which capture all the data required to render
    an email's subject line and body as HTML or plaintext, in any locale.
    """

    user_name: str

    @abstractmethod
    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        """Gets the subject line header of the email."""
        ...

    def get_preview_line(self, loc_context: LocalizationContext) -> str | None:
        """Gets the line that gets shown as a preview next to the title in users' inboxes."""
        return None

    @abstractmethod
    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        """Gets the blocks that form the body of the email."""
        ...

    @staticmethod
    @abstractmethod
    def dummy_data() -> Self:
        """Returns an instance filled with dummy data that can be used for testing."""
        ...

    # Helpers for localizing email-specific strings
    @property
    @abstractmethod
    def _localize_key_prefix(self) -> str: ...

    def _text(self, loc_context: LocalizationContext, key: str, substitutions: SubstitutionDict | None = None) -> str:
        if "." not in key:
            key = f"{self._localize_key_prefix}.{key}"
        return get_emails_i18next().localize(key, loc_context.locale, substitutions)

    def _markup(
        self, loc_context: LocalizationContext, key: str, substitutions: SubstitutionDict | None = None
    ) -> Markup:
        if "." not in key:
            key = f"{self._localize_key_prefix}.{key}"
        return get_emails_i18next().localize_with_markup(key, loc_context.locale, substitutions)

    # Helpers for creating common blocks
    def _greeting_line(self, loc_context: LocalizationContext) -> ParaBlock:
        line = get_emails_i18next().localize("generic.greeting_line", loc_context.locale, {"name": self.user_name})
        return ParaBlock(text=line)

    def _para(
        self, loc_context: LocalizationContext, key: str, substitutions: SubstitutionDict | None = None
    ) -> ParaBlock:
        return ParaBlock(text=self._markup(loc_context, key, substitutions))

    def _user(
        self,
        info: UserInfo,
        loc_context: LocalizationContext,
        comment_key: str,
        substitutions: SubstitutionDict | None = None,
    ) -> UserBlock:
        return UserBlock(info=info, comment=self._markup(loc_context, comment_key, substitutions))

    def _quote(self, text: str) -> QuoteBlock:
        return QuoteBlock(text=text)

    def _action(self, url: str, loc_context: LocalizationContext, text_key: str,
        substitutions: SubstitutionDict | None = None) -> ActionBlock:
        return ActionBlock(text=self._text(loc_context, text_key, substitutions), target_url=url)


@dataclass
class HostRequestReceived(EmailBase):
    """Sent to a host to notify them they have received a request from a surfer."""

    surfer: UserInfo
    from_date: date
    to_date: date
    text: str
    view_url: str
    quick_decline_url: str

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._text(loc_context, "subject", {"name": self.surfer.name})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        return [
            self._greeting_line(loc_context),
            self._para(loc_context, "event_description", {"name": self.surfer.name}),
            self._user(
                self.surfer,
                loc_context,
                "requested_dates",
                {
                    "from_date": loc_context.localize_date(self.from_date),
                    "to_date": loc_context.localize_date(self.to_date),
                },
            ),
            self._quote(self.text),
            self._action(self.view_url, loc_context, "view_request_link"),
            self._action(self.quick_decline_url, loc_context, "quick_decline_link"),
        ]

    @property
    def _localize_key_prefix(self) -> str:
        return "host_request_received"

    @staticmethod
    def dummy_data() -> HostRequestReceived:
        return HostRequestReceived(
            user_name="Alice",
            surfer=UserInfo(name="Bob", age=42, city="Tokyo", avatar_url="https://example.com/users/bob/avatar.jpg", profile_url="https://example.com/users/bob"),
            from_date=date(2000, 1, 1),
            to_date=date(2000, 1, 2),
            text="Hello world!",
            view_url="https://example.com/requests",
            quick_decline_url="https://example.com/quick-decline",
        )
