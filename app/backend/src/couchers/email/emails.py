from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import Self

from markupsafe import Markup

from couchers.email.rendering import (
    ButtonBlock,
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
    """Base class for email data models, which can be rendered to HTML or plaintext."""

    user_name: str

    @abstractmethod
    def get_subject_line(self, loc_context: LocalizationContext) -> str: ...

    def get_preview_line(self, loc_context: LocalizationContext) -> str | None:
        return None

    @abstractmethod
    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]: ...

    @property
    @abstractmethod
    def _localize_key_prefix(self) -> str: ...

    def _text(
        self, key: str, loc_context: LocalizationContext, substitutions: SubstitutionDict | None = None
    ) -> str:
        if "." not in key:
            key = f"{self._localize_key_prefix}.{key}"
        return get_emails_i18next().localize(key, loc_context.locale, substitutions)

    def _markup(
        self, key: str, loc_context: LocalizationContext, substitutions: SubstitutionDict | None = None
    ) -> Markup:
        if "." not in key:
            key = f"{self._localize_key_prefix}.{key}"
        return get_emails_i18next().localize_with_markup(key, loc_context.locale, substitutions)

    def _greeting_line(self, loc_context: LocalizationContext) -> ParaBlock:
        line = get_emails_i18next().localize("generic.greeting_line", loc_context.locale, { "name": self.user_name })
        return ParaBlock(text=line)

    def _para(
        self, key: str, loc_context: LocalizationContext, substitutions: SubstitutionDict | None = None
    ) -> ParaBlock:
        return ParaBlock(text=self._localize_with_markup(key, loc_context, substitutions))

    @staticmethod
    @abstractmethod
    def test_data() -> Self: ...


@dataclass
class HostRequestReceived(EmailBase):
    surfer: UserInfo
    from_date: date
    to_date: date
    text: str
    view_url: str
    quick_decline_url: str

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._text("subject", loc_context, {"name": self.surfer.name})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        return [
            self._greeting_line(loc_context),
            self._para("event_description", loc_context, {"name": self.surfer.name}),
            UserBlock(
                info=self.surfer,
                comment=self._markup(
                    "requested_dates",
                    loc_context,
                    {
                        "from_date": loc_context.localize_date(self.from_date),
                        "to_date": loc_context.localize_date(self.to_date),
                    },
                ),
            ),
            QuoteBlock(text=self.text),
            ButtonBlock(caption=self._text("view_request_link"), url=self.view_url),
            ButtonBlock(caption=self._text("quick_decline_link"), url=self.quick_decline_url),
        ]

    @property
    def _localize_key_prefix(self) -> str:
        return "host_request_received"

    @staticmethod
    def test_data() -> HostRequestReceived:
        return HostRequestReceived(
            user_name="Alice",
            surfer=UserInfo(name="Bob", age=42, city="Tokyo", avatar_url="", profile_url=""),
            from_date=date(2000, 1, 1),
            to_date=date(2000, 1, 2),
            text="Hello world!",
            view_url="http://example.com/requests",
            quick_decline_url="http://example.com/quick-decline",
        )
