"""
Defines data models for each email we sent out to users.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import Self

from couchers import urls
from couchers.email.rendering import (
    EmailBlock,
    EmailBlocksBuilder,
    ParaBlock,
    UserBlock,
    UserInfo,
    get_emails_i18next,
)
from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import SubstitutionDict
from couchers.i18n.localize import format_phone_number
from couchers.proto import notification_data_pb2


@dataclass
class EmailBase(ABC):
    """
    Base class for email data models, which capture all the data required to render
    an email's subject line and body as HTML or plaintext, in any locale.
    """

    user_name: str

    @property
    @abstractmethod
    def string_key_prefix(self) -> str: ...

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        """Gets the subject line header of the email."""
        return self._localize(loc_context, "subject")

    def get_preview_line(self, loc_context: LocalizationContext) -> str | None:
        """Gets the line that gets shown as a preview next to the title in users' inboxes."""
        return None

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        """Gets the blocks that form the body of the email."""

        # Delegate to build_body, but wrap with greetings and closing lines common to all emails.
        i18next = get_emails_i18next()
        builder = EmailBlocksBuilder(locale=loc_context.locale, string_key_prefix=self.string_key_prefix)
        builder.block(
            ParaBlock(text=i18next.localize("generic.greeting_line", loc_context.locale, {"name": self.user_name}))
        )
        self.build_body(builder, loc_context)
        builder.block(ParaBlock(text=i18next.localize("generic.closing_line", loc_context.locale)))
        return builder.blocks

    @abstractmethod
    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None: ...

    @classmethod
    @abstractmethod
    def dummy_data(cls) -> Self:
        """Returns an instance filled with dummy data that can be used for testing."""
        ...

    # Helpers for localizing email-specific strings
    def _localize(
        self, loc_context: LocalizationContext, key: str, substitutions: SubstitutionDict | None = None
    ) -> str:
        key = f"{self.string_key_prefix}.{key}"
        return get_emails_i18next().localize(key, loc_context.locale, substitutions)

    def _body_builder(self, loc_context: LocalizationContext) -> EmailBlocksBuilder:
        return EmailBlocksBuilder(locale=loc_context.locale, string_key_prefix=self.string_key_prefix)


# Specific email definitions


@dataclass(kw_only=True, slots=True)
class APIKeyIssuedEmail(EmailBase):
    """Sent to a user to notify them that their API key was issued."""

    api_key: str
    expiry: datetime

    @property
    def string_key_prefix(self) -> str:
        return "api_key_issued"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("header")
        builder.quote(self.api_key)
        builder.para("expiry", {"datetime": loc_context.localize_datetime(self.expiry)})
        builder.para("usage_warning")
        builder.para("policy_warning")
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> APIKeyIssuedEmail:
        return APIKeyIssuedEmail(
            user_name="Alice", api_key="my_api_key_123", expiry=datetime(2099, 12, 31, 23, 59, 59, tzinfo=UTC)
        )


@dataclass(kw_only=True, slots=True)
class BadgeChangedEmail(EmailBase):
    """Sent to a user to notify them that a badge was added or removed from their profile."""

    badge_name: str
    added: bool

    @property
    def string_key_prefix(self) -> str:
        return "badge_added" if self.added else "badge_removed"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "subject", {"badge_name": self.badge_name})

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body", {"badge_name": self.badge_name})

    @classmethod
    def dummy_data(cls) -> BadgeChangedEmail:
        return BadgeChangedEmail(user_name="Alice", badge_name="Founder", added=True)


@dataclass(kw_only=True, slots=True)
class BirthdateChangedEmail(EmailBase):
    """Sent to a user to notify them that their birthdate was changed."""

    new_birthdate: date

    @property
    def string_key_prefix(self) -> str:
        return "birthdate_changed"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body", {"date": loc_context.localize_date(self.new_birthdate)})
        builder.security_warning_para()

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
    def string_key_prefix(self) -> str:
        return "email_address_change_initiated"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body", {"email_address": self.new_email})
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> EmailAddressChangedEmail:
        return EmailAddressChangedEmail(user_name="Alice", new_email="alice@example.com")


@dataclass(kw_only=True, slots=True)
class EmailAddressVerifiedEmail(EmailBase):
    """Sent to a user to notify them that their new email address has been verified."""

    @property
    def string_key_prefix(self) -> str:
        return "email_address_verified"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body")
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> EmailAddressVerifiedEmail:
        return EmailAddressVerifiedEmail(user_name="Alice")


@dataclass(kw_only=True, slots=True)
class GenderChangedEmail(EmailBase):
    """Sent to a user to notify them that their gender was changed."""

    new_gender: str

    @property
    def string_key_prefix(self) -> str:
        return "gender_changed"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body", {"gender": self.new_gender})
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> GenderChangedEmail:
        return GenderChangedEmail(
            user_name="Alice",
            new_gender="Male",
        )


@dataclass(kw_only=True, slots=True)
class ModeratorNoteEmail(EmailBase):
    """Sent to a user to notify them they have received a moderator note."""

    @property
    def string_key_prefix(self) -> str:
        return "moderator_note"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body")

    @classmethod
    def dummy_data(cls) -> ModeratorNoteEmail:
        return ModeratorNoteEmail(user_name="Alice")


@dataclass(kw_only=True, slots=True)
class PasswordChangedEmail(EmailBase):
    """Sent to a user to notify them that their login password was changed."""

    @property
    def string_key_prefix(self) -> str:
        return "password_changed"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body")
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> PasswordChangedEmail:
        return PasswordChangedEmail(user_name="Alice")


@dataclass(kw_only=True, slots=True)
class PasswordResetCompletedEmail(EmailBase):
    """Sent to a user to confirm their password was successfully reset."""

    @property
    def string_key_prefix(self) -> str:
        return "password_reset_completed"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body")
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> PasswordResetCompletedEmail:
        return PasswordResetCompletedEmail(user_name="Alice")


@dataclass(kw_only=True, slots=True)
class PasswordResetStartedEmail(EmailBase):
    """Sent to a user with a link to complete their password reset."""

    password_reset_link: str

    @property
    def string_key_prefix(self) -> str:
        return "password_reset_started"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("request_description")
        builder.para("confirmation_instructions")
        builder.action(self.password_reset_link, "reset_action")
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> PasswordResetStartedEmail:
        return PasswordResetStartedEmail(user_name="Alice", password_reset_link="https://couchers.org/reset-password")


@dataclass(kw_only=True, slots=True)
class PhoneNumberChangeEmail(EmailBase):
    """Sent to a user to notify them that their phone number verification status was changed."""

    new_phone_number: str
    completed: bool  # False = started, True = completed

    @property
    def string_key_prefix(self) -> str:
        return "phone_number_verified" if self.completed else "phone_number_verification_started"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body", {"phone_number": format_phone_number(self.new_phone_number)})
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> PhoneNumberChangeEmail:
        return PhoneNumberChangeEmail(
            user_name="Alice",
            new_phone_number="+12223334444",
            completed=False,
        )


@dataclass(kw_only=True, slots=True)
class PostalVerificationFailedEmail(EmailBase):
    """Sent to a user when their postal verification attempt has failed."""

    reason: notification_data_pb2.PostalVerificationFailReason.ValueType

    @property
    def string_key_prefix(self) -> str:
        return "postal_verification_failed"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        match self.reason:
            case notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED:
                reason_string_key = "reason_code_expired"
            case notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_TOO_MANY_ATTEMPTS:
                reason_string_key = "reason_too_many_attempts"
            case _:
                reason_string_key = "reason_unknown"
        builder.para(reason_string_key)
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> PostalVerificationFailedEmail:
        return PostalVerificationFailedEmail(
            user_name="Alice",
            reason=notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED,
        )


@dataclass(kw_only=True, slots=True)
class PostalVerificationPostcardSentEmail(EmailBase):
    """Sent to a user to notify them that their verification postcard has been sent."""

    city: str
    country: str

    @property
    def string_key_prefix(self) -> str:
        return "postal_verification_postcard_sent"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body", {"city": self.city, "country": self.country})
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> PostalVerificationPostcardSentEmail:
        return PostalVerificationPostcardSentEmail(user_name="Alice", city="New York", country="United States")


@dataclass(kw_only=True, slots=True)
class PostalVerificationSucceededEmail(EmailBase):
    """Sent to a user when their postal verification has succeeded."""

    @property
    def string_key_prefix(self) -> str:
        return "postal_verification_succeeded"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body")
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> PostalVerificationSucceededEmail:
        return PostalVerificationSucceededEmail(user_name="Alice")


@dataclass(kw_only=True, slots=True)
class StrongVerificationFailedEmail(EmailBase):
    """Sent to a user when their strong verification attempt has failed."""

    reason: notification_data_pb2.SVFailReason.ValueType

    @property
    def string_key_prefix(self) -> str:
        return "strong_verification_failed"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        match self.reason:
            case notification_data_pb2.SV_FAIL_REASON_WRONG_BIRTHDATE_OR_GENDER:
                reason_string_key = "reason_wrong_birthdate_or_gender"
            case notification_data_pb2.SV_FAIL_REASON_NOT_A_PASSPORT:
                reason_string_key = "reason_not_a_passport"
            case notification_data_pb2.SV_FAIL_REASON_DUPLICATE:
                reason_string_key = "reason_duplicate"
            case _:
                raise Exception("Shouldn't get here")
        builder.para(reason_string_key)
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> StrongVerificationFailedEmail:
        return StrongVerificationFailedEmail(
            user_name="Alice",
            reason=notification_data_pb2.SV_FAIL_REASON_NOT_A_PASSPORT,
        )


@dataclass(kw_only=True, slots=True)
class StrongVerificationSucceededEmail(EmailBase):
    """Sent to a user when their strong verification has succeeded."""

    @property
    def string_key_prefix(self) -> str:
        return "strong_verification_succeeded"

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("success_message")
        builder.para("thanks_message")
        builder.para("cost_explanation")
        builder.para("donation_request")
        donate_link = urls.donation_url() + "?utm_source=strong-verification-email"
        builder.action(donate_link, "donate_action")
        builder.security_warning_para()

    @classmethod
    def dummy_data(cls) -> StrongVerificationSucceededEmail:
        return StrongVerificationSucceededEmail(
            user_name="Alice"
        )


@dataclass(kw_only=True, slots=True)
class FriendRequestReceivedEmail(EmailBase):
    """Sent to a user when they receive a friend request."""

    befriender: UserInfo

    @property
    def string_key_prefix(self) -> str:
        return "friend_request_received"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "subject", {"name": self.befriender.name})

    def get_preview_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "body", {"name": self.befriender.name})

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body", {"name": self.befriender.name})
        builder.user(self.befriender)
        builder.action(urls.friend_requests_link(), "view_action")
        builder.para("closing")
        builder.do_not_reply_request_para()

    @classmethod
    def dummy_data(cls) -> FriendRequestReceivedEmail:
        return FriendRequestReceivedEmail(
            user_name="Alice",
            befriender=UserInfo(
                name="Bob",
                age=30,
                city="Berlin",
                avatar_url="https://couchers.org/img/icon.png",
                profile_url="https://couchers.org/user/bob",
            )
        )


@dataclass(kw_only=True, slots=True)
class FriendRequestAcceptedEmail(EmailBase):
    """Sent to a user when their friend request is accepted."""

    new_friend: UserInfo

    @property
    def string_key_prefix(self) -> str:
        return "friend_request_accepted"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "subject", {"name": self.new_friend.name})

    def get_preview_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "body", {"name": self.new_friend.name})

    def build_body(self, builder: EmailBlocksBuilder, loc_context: LocalizationContext) -> None:
        builder.para("body", {"name": self.new_friend.name})
        builder.user(self.new_friend)
        builder.action(self.new_friend.profile_url, "view_action")
        builder.para("closing")

    @classmethod
    def dummy_data(cls) -> FriendRequestAcceptedEmail:
        return FriendRequestAcceptedEmail(
            user_name="Alice",
            new_friend=UserInfo(
                name="Bob",
                age=30,
                city="Berlin",
                avatar_url="https://couchers.org/img/icon.png",
                profile_url="https://couchers.org/user/bob",
            ),
        )
