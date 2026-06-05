"""
Defines data models for each email we sent out to users.
"""

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, replace
from datetime import UTC, date, datetime
from typing import Self, assert_never

from markupsafe import Markup, escape

from couchers import urls
from couchers.email.rendering import (
    ActionBlock,
    EmailBlock,
    EmailBlocksBuilder,
    ParaBlock,
    QuoteBlock,
    UserInfo,
    get_emails_i18next,
)
from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import SubstitutionDict, full_string_key
from couchers.i18n.localize import format_phone_number
from couchers.notifications.quick_links import generate_quick_decline_link
from couchers.proto import conversations_pb2, events_pb2, notification_data_pb2


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
        standard_greeting: bool = True,
        standard_closing: bool = True,
        security_warning: bool = False,
    ) -> EmailBlocksBuilder:
        builder = EmailBlocksBuilder(locale=loc_context.locale, string_key_base=self.string_key_base)
        if standard_greeting:
            builder.para("generic.greeting_line", {"name": self.user_name})
        if standard_closing:
            builder.para("generic.closing_line", epilogue=True)
        if security_warning:
            builder.para("generic.security_warning_contact_support", epilogue=True)
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
        return get_emails_i18next().localize(key, loc_context.locale, substitutions)


# Common string keys
_do_not_reply_request_string_key = "generic.do_not_reply_request"

# Specific email definitions


@dataclass(kw_only=True, slots=True)
class AccountDeletionStartedEmail(EmailBase):
    """Sent to a user to confirm their account deletion request."""

    deletion_link: str

    @property
    def string_key_base(self) -> str:
        return "account_deletion_started"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".request_description")
        builder.para(".confirmation_instructions")
        builder.action(self.deletion_link, ".confirm_action")
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.AccountDeletionStart, *, user_name: str) -> Self:
        return cls(
            user_name=user_name,
            deletion_link=urls.delete_account_link(account_deletion_token=data.deletion_token),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                deletion_link="https://couchers.org/delete-account?token=xxx",
            )
        ]


@dataclass(kw_only=True, slots=True)
class AccountDeletionCompletedEmail(EmailBase):
    """Sent to a user after their account has been deleted."""

    undelete_link: str
    days: int

    @property
    def string_key_base(self) -> str:
        return "account_deletion_completed"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".confirmation")
        builder.para(".farewell")
        builder.para(".recovery_instructions_days", {"count": self.days})
        builder.action(self.undelete_link, ".recover_action")
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.AccountDeletionComplete, *, user_name: str) -> Self:
        return cls(
            user_name=user_name,
            undelete_link=urls.recover_account_link(account_undelete_token=data.undelete_token),
            days=data.undelete_days,
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                undelete_link="https://couchers.org/recover-account?token=xxx",
                days=30,
            )
        ]


@dataclass(kw_only=True, slots=True)
class AccountDeletionRecoveredEmail(EmailBase):
    """Sent to a user after their account deletion has been cancelled."""

    @property
    def string_key_base(self) -> str:
        return "account_deletion_recovered"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".confirmation")
        builder.para(".login_instructions")
        builder.action(urls.app_link(), ".login_action")
        builder.para(".redelete_instructions")
        return builder.build()

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice")]


@dataclass(kw_only=True, slots=True)
class APIKeyIssuedEmail(EmailBase):
    """Sent to a user to notify them that their API key was issued."""

    api_key: str
    expiry: datetime

    @property
    def string_key_base(self) -> str:
        return "api_key_issued"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".header")
        builder.quote(self.api_key, markdown=False)
        builder.para(".expiry", {"datetime": loc_context.localize_datetime(self.expiry)})
        builder.para(".usage_warning")
        builder.para(".policy_warning")
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.ApiKeyCreate, *, user_name: str) -> Self:
        return cls(user_name=user_name, api_key=data.api_key, expiry=data.expiry.ToDatetime(tzinfo=UTC))

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice", api_key="my_api_key_123", expiry=datetime(2099, 12, 31, 23, 59, 59, tzinfo=UTC))]


@dataclass(kw_only=True, slots=True)
class BadgeChangedEmail(EmailBase):
    """Sent to a user to notify them that a badge was added or removed from their profile."""

    badge_name: str
    added: bool

    @property
    def string_key_base(self) -> str:
        return "badge_added" if self.added else "badge_removed"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"badge_name": self.badge_name})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"badge_name": self.badge_name})
        return builder.build()

    @classmethod
    def from_notification(
        cls, data: notification_data_pb2.BadgeAdd | notification_data_pb2.BadgeRemove, *, user_name: str
    ) -> Self:
        return cls(
            user_name=user_name, badge_name=data.badge_name, added=isinstance(data, notification_data_pb2.BadgeAdd)
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        prototype = cls(user_name="Alice", badge_name="Founder", added=True)
        return [replace(prototype, added=True), replace(prototype, added=False)]


@dataclass(kw_only=True, slots=True)
class BirthdateChangedEmail(EmailBase):
    """Sent to a user to notify them that their birthdate was changed."""

    new_birthdate: date

    @property
    def string_key_base(self) -> str:
        return "birthdate_changed"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".body", {"date": loc_context.localize_date(self.new_birthdate)})
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.BirthdateChange, *, user_name: str) -> Self:
        return cls(user_name=user_name, new_birthdate=date.fromisoformat(data.birthdate))

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                new_birthdate=date(1990, 1, 1),
            )
        ]


@dataclass(kw_only=True, slots=True)
class ChatMessageReceivedEmail(EmailBase):
    """Sent to a user when they receive a new chat message."""

    group_chat_title: str | None  # None if direct message
    author: UserInfo
    text: str
    view_url: str

    @property
    def string_key_base(self) -> str:
        return f"chat_message_received.{'direct' if self.group_chat_title is None else 'group'}"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(
            loc_context, ".subject", {"author": self.author.name, "group": self.group_chat_title or ""}
        )

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"author": self.author.name, "group": self.group_chat_title or ""})
        builder.user(self.author)
        builder.quote(self.text, markdown=False)
        builder.action(self.view_url, ".view_action")
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.ChatMessage, *, user_name: str) -> Self:
        group_chat_title: str | None = data.group_chat_title
        if not group_chat_title:
            # Backcompat (2026-05): The group name previously was formatted in the message string
            # msg = f"{message.author.name} sent a message in {group_chat.title}"
            if match := re.search(" sent a message in (.+)$", data.message or ""):
                group_chat_title = match[1]
            else:
                group_chat_title = None

        return cls(
            user_name,
            author=UserInfo.from_protobuf(data.author),
            text=data.text,
            group_chat_title=group_chat_title,
            view_url=urls.chat_link(chat_id=data.group_chat_id),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        prototype = cls(
            user_name="Alice",
            group_chat_title=None,
            author=UserInfo.dummy_bob(),
            text="Hi Alice!",
            view_url="https://couchers.org/messages/chats/123",
        )
        return [
            replace(prototype, group_chat_title=None),
            replace(prototype, group_chat_title="Best friends"),
        ]


@dataclass(kw_only=True, slots=True)
class ChatMessagesMissedEmail(EmailBase):
    """Sent to a user after they've missed new chat messages."""

    @dataclass(kw_only=True, slots=True)
    class Entry:
        """Entry for each chat with missed messages."""

        group_chat_title: str | None  # None if direct message
        missed_count: int
        latest_message_author: UserInfo
        latest_message_text: str
        view_url: str

    entries: list[Entry]

    @property
    def string_key_base(self) -> str:
        return "chat_messages_missed"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject")

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        for entry in self.entries:
            if entry.group_chat_title:
                builder.para(".in_group", {"count": entry.missed_count, "group": entry.group_chat_title})
            else:
                builder.para(".in_dm", {"count": entry.missed_count, "author": entry.latest_message_author.name})
            builder.user(entry.latest_message_author)
            builder.quote(entry.latest_message_text, markdown=False)
            builder.action(entry.view_url, ".view_action")
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.ChatMissedMessages, *, user_name: str) -> Self:
        missed_entries = []
        for message in data.messages:
            group_chat_title: str | None = message.group_chat_title
            missed_count: int = message.unseen_count

            # Backcompat (2026-05): The group name and unseen count were previously was formatted in the message string
            # msg = f"You missed {unseen_count} message(s) in {group_chat.title}"
            if not group_chat_title or not missed_count:
                if match := re.search(" message(s) in (.+)$", message.message or ""):
                    group_chat_title = match[1]
                else:
                    group_chat_title = None

                if match := re.search(r"^You missed (\d+) message(s)", message.message or ""):
                    missed_count = int(match[1])
                else:
                    missed_count = 1

            missed_entries.append(
                cls.Entry(
                    group_chat_title=group_chat_title,
                    missed_count=missed_count,
                    latest_message_author=UserInfo.from_protobuf(message.author),
                    latest_message_text=message.text,
                    view_url=urls.chat_link(chat_id=message.group_chat_id),
                )
            )

        return cls(user_name, entries=missed_entries)

    @classmethod
    def test_instances(cls) -> list[Self]:
        entry_prototype = ChatMessagesMissedEmail.Entry(
            group_chat_title=None,
            missed_count=1,
            latest_message_author=UserInfo.dummy_bob(),
            latest_message_text="Hello!",
            view_url="https://couchers.org/messages/chats/123",
        )
        return [
            cls(
                user_name="Alice",
                entries=[
                    replace(entry_prototype, group_chat_title=None),
                    replace(entry_prototype, group_chat_title="Best friends"),
                ],
            )
        ]


@dataclass(kw_only=True, slots=True)
class DiscussionCreatedEmail(EmailBase):
    """Sent to a user when a new discussion is created in a community they follow."""

    author: UserInfo
    title: str
    parent_context: str  # Community or group name
    markdown_text: str
    view_link: str

    @property
    def string_key_base(self) -> str:
        return "discussion_created"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"author": self.author.name, "title": self.title})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(
            ".body",
            {
                "author": self.author.name,
                "title": self.title,
                "parent_context": self.parent_context,
            },
        )
        builder.user(self.author)
        builder.quote(self.markdown_text, markdown=True)
        builder.action(self.view_link, ".view_action")
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.DiscussionCreate, *, user_name: str) -> Self:
        discussion = data.discussion
        return cls(
            user_name=user_name,
            author=UserInfo.from_protobuf(data.author),
            title=discussion.title,
            parent_context=discussion.owner_title,
            markdown_text=discussion.content,
            view_link=urls.discussion_link(discussion_id=discussion.discussion_id, slug=discussion.slug),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                author=UserInfo.dummy_bob(),
                title="Best hiking trails near Berlin",
                parent_context="Berlin",
                markdown_text="I've been exploring the area and found some **great** spots...",
                view_link="https://couchers.org/discussions/123",
            )
        ]


@dataclass(kw_only=True, slots=True)
class DiscussionCommentEmail(EmailBase):
    """Sent to a user when someone comments on a discussion they follow."""

    author: UserInfo
    discussion_title: str
    discussion_parent_context: str  # Community or group name
    markdown_text: str
    view_link: str

    @property
    def string_key_base(self) -> str:
        return "discussion_comment"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(
            loc_context, ".subject", {"author": self.author.name, "discussion_title": self.discussion_title}
        )

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(
            ".body",
            {
                "author": self.author.name,
                "discussion_title": self.discussion_title,
                "parent_context": self.discussion_parent_context,
            },
        )
        builder.user(self.author)
        builder.quote(self.markdown_text, markdown=True)
        builder.action(self.view_link, ".view_action")
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.DiscussionComment, *, user_name: str) -> Self:
        discussion = data.discussion
        return cls(
            user_name=user_name,
            author=UserInfo.from_protobuf(data.author),
            discussion_title=discussion.title,
            discussion_parent_context=discussion.owner_title,
            markdown_text=data.reply.content,
            view_link=urls.discussion_link(discussion_id=discussion.discussion_id, slug=discussion.slug),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                author=UserInfo.dummy_bob(),
                discussion_title="Best hiking trails near Berlin",
                discussion_parent_context="Berlin",
                markdown_text="Great recommendations, I also **love** the Grünewald forest!",
                view_link="https://couchers.org/discussions/123",
            )
        ]


@dataclass(kw_only=True, slots=True)
class EmailAddressChangedEmail(EmailBase):
    """Sent to a user to notify them that their email address was changed."""

    new_email: str

    @property
    def string_key_base(self) -> str:
        return "email_address_change_initiated"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".body", {"email_address": self.new_email})
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.EmailAddressChange, *, user_name: str) -> Self:
        return cls(user_name=user_name, new_email=data.new_email)

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice", new_email="alice@example.com")]


@dataclass(kw_only=True, slots=True)
class EmailAddressChangeConfirmationEmail(EmailBase):
    """Sent to a user to confirm their new email address."""

    old_email: str
    confirm_url: str

    @property
    def string_key_base(self) -> str:
        return "email_address_change_confirmation"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".context", {"old_email": self.old_email})
        builder.para(".instructions")
        builder.action(self.confirm_url, ".confirm_action")
        return builder.build()

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice", old_email="alice@example.com", confirm_url="https://example.com")]


@dataclass(kw_only=True, slots=True)
class EmailAddressVerifiedEmail(EmailBase):
    """Sent to a user to notify them that their new email address has been verified."""

    @property
    def string_key_base(self) -> str:
        return "email_address_verified"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".body")
        return builder.build()

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice")]


@dataclass(kw_only=True, slots=True)
class EventInfo:
    """Common display fields for an event, extracted from its proto representation."""

    title: str
    start_time: datetime
    end_time: datetime
    online_link: str | None
    address: str | None
    view_url: str
    description_markdown: str

    def get_details_block(self, loc_context: LocalizationContext) -> EmailBlock:
        # TODO(#8695): Support localized time ranges
        start_time_display = loc_context.localize_datetime(self.start_time, with_year=False, with_day_of_week=True)
        end_time_display = loc_context.localize_datetime(self.end_time, with_year=False, with_day_of_week=True)
        time_range_display = f"{start_time_display} - {end_time_display}"

        # Format the following. Only "Online" is translated and it's on its own line,
        # so the string concatenation is fine.
        # **<title>**
        # <datetime-range>
        # *<address> / [Online](<online_link>)*
        html = f"<b>{escape(self.title)}</b>"
        html += "<br>"
        html += time_range_display
        if self.online_link:
            html += "<br>"
            online_link_text = get_emails_i18next().localize("event.generic.online_link", loc_context.locale)
            html += f'<i><a href="{escape(self.online_link)}">{escape(online_link_text)}</a></i>'
        elif self.address:
            html += "<br>"
            html += f"<i>{escape(self.address)}</i>"

        return ParaBlock(text=Markup(html))

    def get_description_block(self) -> EmailBlock:
        return QuoteBlock(text=Markup(self.description_markdown), markdown=True)

    def get_view_action_block(self, loc_context: LocalizationContext) -> EmailBlock:
        view_action_text = get_emails_i18next().localize("event.generic.view_action", loc_context.locale)
        return ActionBlock(text=view_action_text, target_url=self.view_url)

    @classmethod
    def from_proto(cls, event: events_pb2.Event) -> EventInfo:
        return cls(
            title=event.title,
            start_time=event.start_time.ToDatetime(tzinfo=UTC),
            end_time=event.end_time.ToDatetime(tzinfo=UTC),
            online_link=event.online_information.link or None,
            address=event.offline_information.address or None,
            view_url=urls.event_link(occurrence_id=event.event_id, slug=event.slug),
            description_markdown=event.content or "",
        )

    @staticmethod
    def dummy() -> EventInfo:
        return EventInfo(
            title="Berlin Meetup",
            start_time=datetime(2025, 7, 15, 18, 0, 0, tzinfo=UTC),
            end_time=datetime(2025, 7, 15, 21, 0, 0, tzinfo=UTC),
            online_link=None,
            address="Alexanderplatz, Berlin",
            view_url="https://couchers.org/events/123/berlin-community-meetup",
            description_markdown="Come join us for our monthly meetup!",
        )


@dataclass(kw_only=True, slots=True)
class EventCreatedEmail(EmailBase):
    """Sent when a user is invited to an event (create_approved) or a new event is created (create_any)."""

    inviting_user: UserInfo
    event_info: EventInfo
    community_name: str | None
    community_url: str | None
    is_invite: bool  # True = create_approved (invitation), False = create_any

    @property
    def string_key_base(self) -> str:
        return f"event.created.{'invitation' if self.is_invite else 'notification'}"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(
            loc_context, ".subject", {"user": self.inviting_user.name, "title": self.event_info.title}
        )

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        if self.community_name:
            builder.para(".body_with_community", {"community": self.community_name})
        else:
            builder.para(".body_no_community")
        builder.block(self.event_info.get_details_block(loc_context))
        builder.user(self.inviting_user)
        builder.block(self.event_info.get_description_block())
        builder.block(self.event_info.get_view_action_block(loc_context))
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.EventCreate, *, user_name: str, is_invite: bool) -> Self:
        has_community = bool(data.in_community.community_id)
        community_url = (
            urls.community_link(node_id=data.in_community.community_id, slug=data.in_community.slug)
            if has_community
            else None
        )
        return cls(
            user_name=user_name,
            inviting_user=UserInfo.from_protobuf(data.inviting_user),
            event_info=EventInfo.from_proto(data.event),
            community_name=data.in_community.name if has_community else None,
            community_url=community_url,
            is_invite=is_invite,
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        prototype = cls(
            user_name="Alice",
            inviting_user=UserInfo.dummy_bob(),
            event_info=EventInfo.dummy(),
            community_name="Berlin",
            community_url="https://couchers.org/community/1/berlin-community",
            is_invite=True,
        )
        return [
            replace(prototype, is_invite=True),
            replace(prototype, is_invite=True, community_name=None, community_url=None),
            replace(prototype, is_invite=False),
            replace(prototype, is_invite=False, community_name=None, community_url=None),
        ]


@dataclass(kw_only=True, slots=True)
class EventUpdatedEmail(EmailBase):
    """Sent to subscribers when an event is updated."""

    updating_user: UserInfo
    event_info: EventInfo
    updated_items: list[str]

    @property
    def string_key_base(self) -> str:
        return "event.updated"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(
            loc_context, ".subject", {"user": self.updating_user.name, "title": self.event_info.title}
        )

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body")

        # TODO(#8875): Localize the updated items
        updated_items_text = ", ".join(self.updated_items)
        builder.para(".updated_items", {"items_list": updated_items_text})
        builder.block(self.event_info.get_details_block(loc_context))
        builder.user(self.updating_user)
        builder.block(self.event_info.get_description_block())
        builder.block(self.event_info.get_view_action_block(loc_context))
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.EventUpdate, *, user_name: str) -> Self:
        return cls(
            user_name=user_name,
            updating_user=UserInfo.from_protobuf(data.updating_user),
            event_info=EventInfo.from_proto(data.event),
            updated_items=list(data.updated_items),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                updating_user=UserInfo.dummy_bob(),
                event_info=EventInfo.dummy(),
                updated_items=["time", "location"],
            )
        ]


@dataclass(kw_only=True, slots=True)
class EventOrganizerInvitedEmail(EmailBase):
    """Sent when a user is invited to co-organize an event."""

    inviting_user: UserInfo
    event_info: EventInfo

    @property
    def string_key_base(self) -> str:
        return "event.organizer_invited"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(
            loc_context,
            ".subject",
            {"user": self.inviting_user.name, "title": self.event_info.title},
        )

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"user": self.inviting_user.name, "title": self.event_info.title})
        builder.block(self.event_info.get_details_block(loc_context))
        builder.user(self.inviting_user, comment_key=".user_card_text")
        builder.block(self.event_info.get_description_block())
        builder.block(self.event_info.get_view_action_block(loc_context))
        builder.para(_do_not_reply_request_string_key)
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.EventInviteOrganizer, *, user_name: str) -> Self:
        return cls(
            user_name=user_name,
            inviting_user=UserInfo.from_protobuf(data.inviting_user),
            event_info=EventInfo.from_proto(data.event),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice", inviting_user=UserInfo.dummy_bob(), event_info=EventInfo.dummy())]


@dataclass(kw_only=True, slots=True)
class EventCommentEmail(EmailBase):
    """Sent to subscribers when someone comments on an event."""

    author: UserInfo
    event_info: EventInfo
    comment_markdown: str

    @property
    def string_key_base(self) -> str:
        return "event.comment"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"author": self.author.name, "title": self.event_info.title})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"author": self.author.name, "title": self.event_info.title})
        builder.user(self.author)
        builder.quote(self.comment_markdown, markdown=True)
        builder.para(".event_details")
        builder.block(self.event_info.get_details_block(loc_context))
        builder.block(self.event_info.get_view_action_block(loc_context))
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.EventComment, *, user_name: str) -> Self:
        return cls(
            user_name=user_name,
            author=UserInfo.from_protobuf(data.author),
            event_info=EventInfo.from_proto(data.event),
            comment_markdown=data.reply.content,
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                author=UserInfo.dummy_bob(),
                event_info=EventInfo.dummy(),
                comment_markdown="Looking forward to it, see you all there!",
            )
        ]


@dataclass(kw_only=True, slots=True)
class EventReminderEmail(EmailBase):
    """Sent to subscribers as a reminder that an event starts soon."""

    event_info: EventInfo

    @property
    def string_key_base(self) -> str:
        return "event.reminder"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"title": self.event_info.title})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body")
        builder.block(self.event_info.get_details_block(loc_context))
        builder.block(self.event_info.get_description_block())
        builder.block(self.event_info.get_view_action_block(loc_context))
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.EventReminder, *, user_name: str) -> Self:
        return cls(
            user_name=user_name,
            event_info=EventInfo.from_proto(data.event),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice", event_info=EventInfo.dummy())]


@dataclass(kw_only=True, slots=True)
class EventCancelledEmail(EmailBase):
    """Sent to subscribers when an event is cancelled."""

    cancelling_user: UserInfo
    event_info: EventInfo

    @property
    def string_key_base(self) -> str:
        return "event.cancel"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(
            loc_context,
            ".subject",
            {"user": self.cancelling_user.name, "title": self.event_info.title},
        )

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body")
        builder.block(self.event_info.get_details_block(loc_context))
        builder.user(self.cancelling_user, ".user_card_text")
        builder.quote(self.event_info.description_markdown, markdown=True)
        builder.block(self.event_info.get_view_action_block(loc_context))
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.EventCancel, *, user_name: str) -> Self:
        return cls(
            user_name=user_name,
            cancelling_user=UserInfo.from_protobuf(data.cancelling_user),
            event_info=EventInfo.from_proto(data.event),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice", cancelling_user=UserInfo.dummy_bob(), event_info=EventInfo.dummy())]


@dataclass(kw_only=True, slots=True)
class EventDeletedEmail(EmailBase):
    """Sent to subscribers when a moderator deletes an event."""

    event_info: EventInfo

    @property
    def string_key_base(self) -> str:
        return "event.deleted"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"title": self.event_info.title})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body")
        builder.block(self.event_info.get_details_block(loc_context))
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.EventDelete, *, user_name: str) -> Self:
        return cls(
            user_name=user_name,
            event_info=EventInfo.from_proto(data.event),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                event_info=EventInfo.dummy(),
            )
        ]


@dataclass(kw_only=True, slots=True)
class FriendRequestReceivedEmail(EmailBase):
    """Sent to a user when they receive a friend request."""

    befriender: UserInfo

    @property
    def string_key_base(self) -> str:
        return "friend_request_received"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"name": self.befriender.name})

    def get_preview_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".body", {"name": self.befriender.name})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"name": self.befriender.name})
        builder.user(self.befriender)
        builder.action(urls.friend_requests_link(), ".view_action")
        builder.para(".closing")
        builder.para(_do_not_reply_request_string_key)
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.FriendRequestCreate, *, user_name: str) -> Self:
        return cls(user_name=user_name, befriender=UserInfo.from_protobuf(data.other_user))

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                befriender=UserInfo.dummy_bob(),
            )
        ]


@dataclass(kw_only=True, slots=True)
class FriendRequestAcceptedEmail(EmailBase):
    """Sent to a user when their friend request is accepted."""

    new_friend: UserInfo

    @property
    def string_key_base(self) -> str:
        return "friend_request_accepted"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"name": self.new_friend.name})

    def get_preview_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".body", {"name": self.new_friend.name})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"name": self.new_friend.name})
        builder.user(self.new_friend)
        builder.action(self.new_friend.profile_url, ".view_action")
        builder.para(".closing")
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.FriendRequestAccept, *, user_name: str) -> Self:
        return cls(user_name=user_name, new_friend=UserInfo.from_protobuf(data.other_user))

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                new_friend=UserInfo.dummy_bob(),
            )
        ]


@dataclass(kw_only=True, slots=True)
class GenderChangedEmail(EmailBase):
    """Sent to a user to notify them that their gender was changed."""

    new_gender: str

    @property
    def string_key_base(self) -> str:
        return "gender_changed"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".body", {"gender": self.new_gender})
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.GenderChange, *, user_name: str) -> Self:
        return cls(user_name=user_name, new_gender=data.gender)

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                new_gender="Male",
            )
        ]


@dataclass(kw_only=True, slots=True)
class HostRequestCreatedEmail(EmailBase):
    """Sent to a host when a surfer sends them a new host request."""

    surfer: UserInfo
    from_date: date
    to_date: date
    text: str
    quick_decline_link: str
    view_link: str

    @property
    def string_key_base(self) -> str:
        return "host_request_created"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"surfer_name": self.surfer.name})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"surfer_name": self.surfer.name})
        builder.user(
            self.surfer,
            "host_request_generic.date_range",
            {
                "from_date": _localize_host_request_date(self.from_date, loc_context),
                "to_date": _localize_host_request_date(self.to_date, loc_context),
            },
        )
        builder.quote(self.text, markdown=False)
        builder.action(self.view_link, "host_request_generic.view_action")
        builder.action(self.quick_decline_link, ".quick_decline_action")
        builder.para(".respond_encouragement")
        builder.para(_do_not_reply_request_string_key)
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.HostRequestCreate, *, user_name: str) -> Self:
        return cls(
            user_name,
            surfer=UserInfo.from_protobuf(data.surfer),
            from_date=date.fromisoformat(data.host_request.from_date),
            to_date=date.fromisoformat(data.host_request.to_date),
            text=data.text,
            quick_decline_link=generate_quick_decline_link(data.host_request),
            view_link=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                surfer=UserInfo.dummy_bob(),
                from_date=date(2025, 6, 1),
                to_date=date(2025, 6, 7),
                text="Hey, I'd love to stay for a few nights!",
                quick_decline_link="https://couchers.org/requests/123/decline?token=xxx",
                view_link="https://couchers.org/requests/123",
            )
        ]


@dataclass(kw_only=True, slots=True)
class HostRequestReminderEmail(EmailBase):
    """Sent to a host as a reminder to respond to a pending host request."""

    surfer: UserInfo
    from_date: date
    to_date: date
    view_link: str

    @property
    def string_key_base(self) -> str:
        return "host_request_reminder"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"surfer_name": self.surfer.name})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body")
        builder.user(
            self.surfer,
            "host_request_generic.date_range",
            {
                "from_date": _localize_host_request_date(self.from_date, loc_context),
                "to_date": _localize_host_request_date(self.to_date, loc_context),
            },
        )
        builder.action(self.view_link, "host_request_generic.view_action")
        builder.para(_do_not_reply_request_string_key)
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.HostRequestReminder, *, user_name: str) -> Self:
        return cls(
            user_name,
            surfer=UserInfo.from_protobuf(data.surfer),
            from_date=date.fromisoformat(data.host_request.from_date),
            to_date=date.fromisoformat(data.host_request.to_date),
            view_link=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                surfer=UserInfo.dummy_bob(),
                from_date=date(2025, 6, 1),
                to_date=date(2025, 6, 7),
                view_link="https://couchers.org/requests/123",
            )
        ]


@dataclass(kw_only=True, slots=True)
class HostRequestMessageEmail(EmailBase):
    """Sent when a user sends a message in an existing host request."""

    other_user: UserInfo
    from_date: date
    to_date: date
    text: str
    from_host: bool
    view_link: str

    @property
    def string_key_base(self) -> str:
        variant = "from_host" if self.from_host else "from_surfer"
        return f"host_request_message.{variant}"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"other_name": self.other_user.name})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"other_name": self.other_user.name})
        builder.user(
            self.other_user,
            "host_request_generic.date_range",
            {
                "from_date": _localize_host_request_date(self.from_date, loc_context),
                "to_date": _localize_host_request_date(self.to_date, loc_context),
            },
        )
        builder.quote(self.text, markdown=False)
        builder.action(self.view_link, "host_request_generic.view_action")
        builder.para(_do_not_reply_request_string_key)
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.HostRequestMessage, *, user_name: str) -> Self:
        return cls(
            user_name,
            other_user=UserInfo.from_protobuf(data.user),
            from_date=date.fromisoformat(data.host_request.from_date),
            to_date=date.fromisoformat(data.host_request.to_date),
            text=data.text,
            from_host=not data.am_host,
            view_link=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        prototype = cls(
            user_name="Alice",
            other_user=UserInfo.dummy_bob(),
            from_date=date(2025, 6, 1),
            to_date=date(2025, 6, 7),
            text="Looking forward to it, see you soon!",
            from_host=True,
            view_link="https://couchers.org/requests/123",
        )
        return [replace(prototype, from_host=True), replace(prototype, from_host=False)]


@dataclass(kw_only=True, slots=True)
class HostRequestMissedMessagesEmail(EmailBase):
    """Sent as a digest when a user has missed messages in a host request."""

    other_user: UserInfo
    from_date: date
    to_date: date
    from_host: bool
    view_link: str

    @property
    def string_key_base(self) -> str:
        variant = "from_host" if self.from_host else "from_surfer"
        return f"host_request_missed_messages.{variant}"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"other_name": self.other_user.name})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"other_name": self.other_user.name})
        builder.user(
            self.other_user,
            "host_request_generic.date_range",
            {
                "from_date": _localize_host_request_date(self.from_date, loc_context),
                "to_date": _localize_host_request_date(self.to_date, loc_context),
            },
        )
        builder.action(self.view_link, "host_request_generic.view_action")
        builder.para(_do_not_reply_request_string_key)
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.HostRequestMissedMessages, *, user_name: str) -> Self:
        return cls(
            user_name,
            other_user=UserInfo.from_protobuf(data.user),
            from_date=date.fromisoformat(data.host_request.from_date),
            to_date=date.fromisoformat(data.host_request.to_date),
            from_host=not data.am_host,
            view_link=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        prototype = cls(
            user_name="Alice",
            other_user=UserInfo.dummy_bob(),
            from_date=date(2025, 6, 1),
            to_date=date(2025, 6, 7),
            from_host=True,
            view_link="https://couchers.org/requests/123",
        )
        return [replace(prototype, from_host=True), replace(prototype, from_host=False)]


@dataclass(kw_only=True, slots=True)
class HostRequestStatusChangedEmail(EmailBase):
    """Sent when a host request is accepted, declined, confirmed, or cancelled."""

    other_user: UserInfo
    from_date: date
    to_date: date
    new_status: conversations_pb2.HostRequestStatus.ValueType
    view_link: str

    @property
    def string_key_base(self) -> str:
        base_key = "host_request_status_changed"
        match self.new_status:
            case conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED:
                return f"{base_key}.accepted_by_host"
            case conversations_pb2.HOST_REQUEST_STATUS_REJECTED:
                return f"{base_key}.declined_by_host"
            case conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED:
                return f"{base_key}.confirmed_by_surfer"
            case conversations_pb2.HOST_REQUEST_STATUS_CANCELLED:
                return f"{base_key}.cancelled_by_surfer"
            case _:
                raise ValueError(f"Unexpected host request status: {self.new_status}")

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, ".subject", {"other_name": self.other_user.name})

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"other_name": self.other_user.name})
        builder.user(
            self.other_user,
            "host_request_generic.date_range",
            {
                "from_date": _localize_host_request_date(self.from_date, loc_context),
                "to_date": _localize_host_request_date(self.to_date, loc_context),
            },
        )
        builder.action(self.view_link, "host_request_generic.view_action")
        builder.para(_do_not_reply_request_string_key)
        return builder.build()

    @classmethod
    def from_notification(
        cls,
        data: notification_data_pb2.HostRequestAccept
        | notification_data_pb2.HostRequestReject
        | notification_data_pb2.HostRequestConfirm
        | notification_data_pb2.HostRequestCancel,
        *,
        user_name: str,
    ) -> Self:
        other_user: UserInfo
        new_status: conversations_pb2.HostRequestStatus.ValueType
        match data:
            case notification_data_pb2.HostRequestAccept():
                other_user = UserInfo.from_protobuf(data.host)
                new_status = conversations_pb2.HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED
            case notification_data_pb2.HostRequestReject():
                other_user = UserInfo.from_protobuf(data.host)
                new_status = conversations_pb2.HostRequestStatus.HOST_REQUEST_STATUS_REJECTED
            case notification_data_pb2.HostRequestConfirm():
                other_user = UserInfo.from_protobuf(data.surfer)
                new_status = conversations_pb2.HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED
            case notification_data_pb2.HostRequestCancel():
                other_user = UserInfo.from_protobuf(data.surfer)
                new_status = conversations_pb2.HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED
            case _:
                # Enable mypy's exhaustiveness checking
                assert_never("Unexpected host request status changed notification data type.")

        return cls(
            user_name,
            other_user=other_user,
            from_date=date.fromisoformat(data.host_request.from_date),
            to_date=date.fromisoformat(data.host_request.to_date),
            new_status=new_status,
            view_link=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        prototype = cls(
            user_name="Alice",
            other_user=UserInfo.dummy_bob(),
            from_date=date(2025, 6, 1),
            to_date=date(2025, 6, 7),
            new_status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
            view_link="https://couchers.org/requests/123",
        )
        return [
            replace(prototype, new_status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED),
            replace(prototype, new_status=conversations_pb2.HOST_REQUEST_STATUS_REJECTED),
            replace(prototype, new_status=conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED),
            replace(prototype, new_status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED),
        ]


@dataclass(kw_only=True, slots=True)
class ModeratorNoteEmail(EmailBase):
    """Sent to a user to notify them they have received a moderator note."""

    @property
    def string_key_base(self) -> str:
        return "moderator_note"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body")
        return builder.build()

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice")]


@dataclass(kw_only=True, slots=True)
class PasswordChangedEmail(EmailBase):
    """Sent to a user to notify them that their login password was changed."""

    @property
    def string_key_base(self) -> str:
        return "password_changed"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".body")
        return builder.build()

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice")]


@dataclass(kw_only=True, slots=True)
class PasswordResetCompletedEmail(EmailBase):
    """Sent to a user to confirm their password was successfully reset."""

    @property
    def string_key_base(self) -> str:
        return "password_reset_completed"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".body")
        return builder.build()

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice")]


@dataclass(kw_only=True, slots=True)
class PasswordResetStartedEmail(EmailBase):
    """Sent to a user with a link to complete their password reset."""

    password_reset_link: str

    @property
    def string_key_base(self) -> str:
        return "password_reset_started"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".request_description")
        builder.para(".confirmation_instructions")
        builder.action(self.password_reset_link, ".reset_action")
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.PasswordResetStart, *, user_name: str) -> Self:
        return cls(
            user_name=user_name,
            password_reset_link=urls.password_reset_link(password_reset_token=data.password_reset_token),
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice", password_reset_link="https://couchers.org/reset-password")]


@dataclass(kw_only=True, slots=True)
class PhoneNumberChangeEmail(EmailBase):
    """Sent to a user to notify them that their phone number verification status was changed."""

    new_phone_number: str
    completed: bool  # False = started, True = completed

    @property
    def string_key_base(self) -> str:
        return "phone_number_verified" if self.completed else "phone_number_verification_started"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".body", {"phone_number": format_phone_number(self.new_phone_number)})
        return builder.build()

    @classmethod
    def from_change_notification(cls, data: notification_data_pb2.PhoneNumberChange, *, user_name: str) -> Self:
        return cls(user_name=user_name, new_phone_number=data.phone, completed=False)

    @classmethod
    def from_verify_notification(cls, data: notification_data_pb2.PhoneNumberVerify, *, user_name: str) -> Self:
        return cls(user_name=user_name, new_phone_number=data.phone, completed=True)

    @classmethod
    def test_instances(cls) -> list[Self]:
        prototype = cls(
            user_name="Alice",
            new_phone_number="+12223334444",
            completed=False,
        )
        return [replace(prototype, completed=False), replace(prototype, completed=True)]


@dataclass(kw_only=True, slots=True)
class PostalVerificationFailedEmail(EmailBase):
    """Sent to a user when their postal verification attempt has failed."""

    reason: notification_data_pb2.PostalVerificationFailReason.ValueType

    @property
    def string_key_base(self) -> str:
        return "postal_verification_failed"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        match self.reason:
            case notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED:
                reason_string_key = ".reason_code_expired"
            case notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_TOO_MANY_ATTEMPTS:
                reason_string_key = ".reason_too_many_attempts"
            case _:
                reason_string_key = ".reason_unknown"
        builder.para(reason_string_key)
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.PostalVerificationFailed, *, user_name: str) -> Self:
        return cls(user_name=user_name, reason=data.reason)

    @classmethod
    def test_instances(cls) -> list[Self]:
        prototype = cls(
            user_name="Alice",
            reason=notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED,
        )
        return [
            replace(prototype, reason=notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED),
            replace(prototype, reason=notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_TOO_MANY_ATTEMPTS),
            replace(prototype, reason=notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_UNKNOWN),
        ]


@dataclass(kw_only=True, slots=True)
class PostalVerificationPostcardSentEmail(EmailBase):
    """Sent to a user to notify them that their verification postcard has been sent."""

    city: str
    country: str

    @property
    def string_key_base(self) -> str:
        return "postal_verification_postcard_sent"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".body", {"city": self.city, "country": self.country})
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.PostalVerificationPostcardSent, *, user_name: str) -> Self:
        return cls(user_name=user_name, city=data.city, country=data.country)

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice", city="New York", country="United States")]


@dataclass(kw_only=True, slots=True)
class PostalVerificationSucceededEmail(EmailBase):
    """Sent to a user when their postal verification has succeeded."""

    @property
    def string_key_base(self) -> str:
        return "postal_verification_succeeded"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".body")
        return builder.build()

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice")]


@dataclass(kw_only=True, slots=True)
class SignupVerifyEmail(EmailBase):
    """Sent to a user to verify their email address."""

    verify_url: str

    @property
    def string_key_base(self) -> str:
        return "signup.verify"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "signup.subject")

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".thanks")
        builder.para(".instructions")
        builder.action(self.verify_url, ".confirm_action")
        builder.para("signup.closing")
        return builder.build()

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice", verify_url="https://example.com")]


@dataclass(kw_only=True, slots=True)
class SignupContinueEmail(EmailBase):
    """Sent to a user to ask them to continue the signup process."""

    continue_url: str

    @property
    def string_key_base(self) -> str:
        return "signup.continue"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(loc_context, "signup.subject")

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".request")
        builder.para(".instructions")
        builder.action(self.continue_url, ".continue_action")
        builder.para("signup.closing")
        builder.para(".ignore_if_unexpected")
        return builder.build()

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice", continue_url="https://example.com")]


@dataclass(kw_only=True, slots=True)
class StrongVerificationFailedEmail(EmailBase):
    """Sent to a user when their strong verification attempt has failed."""

    reason: notification_data_pb2.SVFailReason.ValueType

    @property
    def string_key_base(self) -> str:
        return "strong_verification_failed"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        match self.reason:
            case notification_data_pb2.SV_FAIL_REASON_WRONG_BIRTHDATE_OR_GENDER:
                reason_string_key = ".reason_wrong_birthdate_or_gender"
            case notification_data_pb2.SV_FAIL_REASON_NOT_A_PASSPORT:
                reason_string_key = ".reason_not_a_passport"
            case notification_data_pb2.SV_FAIL_REASON_DUPLICATE:
                reason_string_key = ".reason_duplicate"
            case _:
                raise Exception("Shouldn't get here")
        builder.para(reason_string_key)
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.VerificationSVFail, *, user_name: str) -> Self:
        return cls(user_name=user_name, reason=data.reason)

    @classmethod
    def test_instances(cls) -> list[Self]:
        prototype = cls(
            user_name="Alice",
            reason=notification_data_pb2.SV_FAIL_REASON_NOT_A_PASSPORT,
        )
        return [
            replace(prototype, reason=notification_data_pb2.SV_FAIL_REASON_WRONG_BIRTHDATE_OR_GENDER),
            replace(prototype, reason=notification_data_pb2.SV_FAIL_REASON_NOT_A_PASSPORT),
            replace(prototype, reason=notification_data_pb2.SV_FAIL_REASON_DUPLICATE),
        ]


@dataclass(kw_only=True, slots=True)
class StrongVerificationSucceededEmail(EmailBase):
    """Sent to a user when their strong verification has succeeded."""

    @property
    def string_key_base(self) -> str:
        return "strong_verification_succeeded"

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context, security_warning=True)
        builder.para(".success_message")
        builder.para(".thanks_message")
        builder.para(".cost_explanation")
        builder.para(".donation_request")
        donate_link = urls.donation_url() + "?utm_source=strong-verification-email"
        builder.action(donate_link, ".donate_action")
        return builder.build()

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [cls(user_name="Alice")]


@dataclass(kw_only=True, slots=True)
class ThreadReplyEmail(EmailBase):
    """Sent to a user when someone replies in a comment thread they participated in."""

    author: UserInfo
    parent_context: str  # Title of the event or discussion being replied in
    markdown_text: str
    view_link: str

    @property
    def string_key_base(self) -> str:
        return "thread_reply"

    def get_subject_line(self, loc_context: LocalizationContext) -> str:
        return self._localize(
            loc_context, ".subject", {"author": self.author.name, "parent_context": self.parent_context}
        )

    def get_body_blocks(self, loc_context: LocalizationContext) -> list[EmailBlock]:
        builder = self._body_builder(loc_context)
        builder.para(".body", {"author": self.author.name, "parent_context": self.parent_context})
        builder.user(self.author)
        builder.quote(self.markdown_text, markdown=True)
        builder.action(self.view_link, ".view_action")
        return builder.build()

    @classmethod
    def from_notification(cls, data: notification_data_pb2.ThreadReply, *, user_name: str) -> Self:
        parent = data.WhichOneof("reply_parent")
        if parent == "event":
            parent_context = data.event.title
            view_link = urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug)
        elif parent == "discussion":
            parent_context = data.discussion.title
            view_link = urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug)
        else:
            raise Exception("Can only do replies to events and discussions")
        return cls(
            user_name=user_name,
            author=UserInfo.from_protobuf(data.author),
            parent_context=parent_context,
            markdown_text=data.reply.content,
            view_link=view_link,
        )

    @classmethod
    def test_instances(cls) -> list[Self]:
        return [
            cls(
                user_name="Alice",
                author=UserInfo.dummy_bob(),
                parent_context="Best hiking trails near Berlin",
                markdown_text="I agree, the Grünewald is **amazing**!",
                view_link="https://couchers.org/discussions/123",
            )
        ]


def _localize_host_request_date(value: date, loc_context: LocalizationContext) -> str:
    return loc_context.localize_date(value, with_year=False, with_day_of_week=True)
