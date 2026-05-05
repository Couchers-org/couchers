"""
Defines data models for each email we sent out to users.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date, datetime, UTC
from enum import Enum
from typing import Self

from couchers.email.rendering import (
    EmailBlock,
    EmailBlocksBuilder,
    get_emails_i18next,
)
from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import SubstitutionDict
from couchers.i18n.localize import format_phone_number


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

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        """Gets the blocks that form the body of the email."""
        builder = EmailBlocksBuilder(locale=loc_context.locale, string_key_prefix=self._localize_key_prefix)
        self._build_body(builder, loc_context)
        return builder.blocks

    @abstractmethod
    def _build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        ...

    @classmethod
    @abstractmethod
    def dummy_data(cls) -> Self:
        """Returns an instance filled with dummy data that can be used for testing."""
        ...

    # Helpers for localizing email-specific strings
    @property
    @abstractmethod
    def _localize_key_prefix(self) -> str: ...

    def _localize(self, loc_context: LocalizationContext, key: str, substitutions: SubstitutionDict | None = None) -> str:
        key = f"{self._localize_key_prefix}.{key}"
        return get_emails_i18next().localize(key, loc_context.locale, substitutions)

    def _body_builder(self, loc_context: LocalizationContext) -> EmailBlocksBuilder:
        return EmailBlocksBuilder(locale=loc_context.locale, string_key_prefix=self._localize_key_prefix)


@dataclass(kw_only=True, slots=True)
class APIKeyIssuedEmail(EmailBase):
    """Sent to a user to notify them that their API key was issued."""
    api_key: str
    expiry: datetime

    @property
    def _localize_key_prefix(self) -> str:
        return "api_key_issued"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "subject")

    def _build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.greeting_line(self.user_name)
        builder.para("header")
        builder.quote(self.api_key)
        builder.para("expiry", {"datetime": loc_context.localize_datetime(self.expiry) })
        builder.para("usage_warning")
        builder.para("policy_warning")
        builder.security_warning_line()
        builder.closing_line()

    @classmethod
    def dummy_data(cls) -> APIKeyIssuedEmail:
        return APIKeyIssuedEmail(
            user_name="Alice",
            api_key="my_api_key_123",
            expiry=datetime(2099, 12, 31, 23, 59, 59, tzinfo=UTC)
        )

@dataclass(kw_only=True, slots=True)
class BirthdateChangedEmail(EmailBase):
    """Sent to a user to notify them that their birthdate was changed."""
    new_birthdate: date

    @property
    def _localize_key_prefix(self) -> str:
        return "birthdate_changed"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "subject")

    def _build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.greeting_line(self.user_name)
        builder.para("body", {"date": loc_context.localize_date(self.new_birthdate) })
        builder.security_warning_line()
        builder.closing_line()

    @classmethod
    def dummy_data(cls) -> BirthdateChangedEmail:
        return BirthdateChangedEmail(
            user_name="Alice",
            new_birthdate=date(1990, 1, 1),
        )

@dataclass(kw_only=True, slots=True)
class EmailAddressChangedEmail(EmailBase):
    """Sent to a user to notify them that their email address was changed."""
    new_email: str

    @property
    def _localize_key_prefix(self) -> str:
        return "email_address_change_initiated"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "subject")

    def _build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.greeting_line(self.user_name)
        builder.para("body", {"email_address": self.new_email})
        builder.security_warning_line()
        builder.closing_line()

    @classmethod
    def dummy_data(cls) -> EmailAddressChangedEmail:
        return EmailAddressChangedEmail(
            user_name="Alice",
            new_email="alice@example.com"
        )

@dataclass(kw_only=True, slots=True)
class GenderChangedEmail(EmailBase):
    """Sent to a user to notify them that their gender was changed."""
    new_gender: str

    @property
    def _localize_key_prefix(self) -> str:
        return "gender_changed"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "subject")

    def _build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.greeting_line(self.user_name)
        builder.para("body", {"gender": self.new_gender})
        builder.security_warning_line()
        builder.closing_line()

    @classmethod
    def dummy_data(cls) -> GenderChangedEmail:
        return GenderChangedEmail(
            user_name="Alice",
            new_gender="Male",
        )

@dataclass(kw_only=True, slots=True)
class PhoneNumberChangeEmail(EmailBase):
    """Sent to a user to notify them that their phone number verification status was changed."""
    new_phone_number: str
    completed: bool # False = started, True = completed

    @property
    def _localize_key_prefix(self) -> str:
        return "phone_number_verified" if self.completed else "phone_number_verification_started"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "subject")

    def _build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.greeting_line(self.user_name)
        builder.para("body", {"phone_number": format_phone_number(self.new_phone_number) })
        builder.security_warning_line()
        builder.closing_line()

    @classmethod
    def dummy_data(cls) -> PhoneNumberChangeEmail:
        return PhoneNumberChangeEmail(
            user_name="Alice",
            new_phone_number="+12223334444",
            completed=False,
        )

class UnparameterizedEmailType(Enum):
    def __init__(self, string_key_prefix: str, security_warning: bool = False):
        self.string_key_prefix = string_key_prefix
        self.security_warning = security_warning

    EMAIL_ADDRESS_VERIFIED = ("email_address_verified", True)

@dataclass(kw_only=True, slots=True)
class UnparameterizedEmail(EmailBase):
    """An email with a subject line and a single paragraph body, without string substitutions."""

    type: UnparameterizedEmailType

    @property
    def _localize_key_prefix(self) -> str:
        return self.type.string_key_prefix

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "subject")

    def _build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.greeting_line(self.user_name)
        builder.para("body")
        if self.type.security_warning:
            builder.security_warning_line()
        builder.closing_line()

    @classmethod
    def dummy_data(cls) -> UnparameterizedEmail:
        return UnparameterizedEmail(user_name="Alice", type=UnparameterizedEmailType.EMAIL_ADDRESS_VERIFIED)
