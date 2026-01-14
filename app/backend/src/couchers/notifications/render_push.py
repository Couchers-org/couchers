"""
Renders a Notification model into a localized push notification.
"""

import logging
from dataclasses import dataclass
from datetime import date
from typing import Any, assert_never
from zoneinfo import ZoneInfo

from couchers import urls
from couchers.i18n.localize import (
    format_phone_number,
    get_i18next,
    localize_date_from_iso,
    localize_datetime,
    localize_string,
)
from couchers.models import Notification, NotificationTopicAction, User
from couchers.notifications.push import PushNotificationContent
from couchers.proto import api_pb2, notification_data_pb2

logger = logging.getLogger(__name__)

# See PushNotificationContent's documentation for notification writing guidelines.


def render_push_notification(user: User, notification: Notification) -> PushNotificationContent:
    data: Any = notification.topic_action.data_type.FromString(notification.data)  # type: ignore[attr-defined]
    renderer = _Renderer(locale=user.ui_language_preference or "en", timezone=ZoneInfo(user.timezone or "Etc/UTC"))
    return renderer.render(notification.topic_action, data, notification.key)


@dataclass(frozen=True)
class _Renderer:
    """Provides context accessible when rendering any notification kind."""

    locale: str
    timezone: ZoneInfo

    def render(self, topic_action: NotificationTopicAction, data: Any, key: str) -> PushNotificationContent:
        match topic_action:
            # Using a match statement enable mypy's exhaustiveness checking.
            # Every case is has its own function so that they can declare different types for "data",
            # as mypy wouldn't allow that in a single function.
            # Keep topics sorted (actions can follow logical ordering)
            case NotificationTopicAction.account_deletion__start:
                return self.account_deletion__start(data)
            case NotificationTopicAction.account_deletion__complete:
                return self.account_deletion__complete(data)
            case NotificationTopicAction.account_deletion__recovered:
                return self.account_deletion__recovered()
            case NotificationTopicAction.activeness__probe:
                return self.activeness__probe(data)
            case NotificationTopicAction.api_key__create:
                return self.api_key__create(data)
            case NotificationTopicAction.badge__add:
                return self.badge__add(data)
            case NotificationTopicAction.badge__remove:
                return self.badge__remove(data)
            case NotificationTopicAction.birthdate__change:
                return self.birthdate__change(data)
            case NotificationTopicAction.chat__message:
                return self.chat__message(data)
            case NotificationTopicAction.chat__missed_messages:
                return self.chat__missed_messages(data)
            case NotificationTopicAction.donation__received:
                return self.donation__received(data)
            case NotificationTopicAction.discussion__create:
                return self.discussion__create(data)
            case NotificationTopicAction.discussion__comment:
                return self.discussion__comment(data)
            case NotificationTopicAction.email_address__change:
                return self.email_address__change(data)
            case NotificationTopicAction.email_address__verify:
                return self.email_address__verify()
            case NotificationTopicAction.event__create_any:
                return self.event__create_any(data)
            case NotificationTopicAction.event__create_approved:
                return self.event__create_approved(data)
            case NotificationTopicAction.event__update:
                return self.event__update(data)
            case NotificationTopicAction.event__invite_organizer:
                return self.event__invite_organizer(data)
            case NotificationTopicAction.event__comment:
                return self.event__comment(data)
            case NotificationTopicAction.event__reminder:
                return self.event__reminder(data)
            case NotificationTopicAction.event__cancel:
                return self.event__cancel(data)
            case NotificationTopicAction.event__delete:
                return self.event__delete(data)
            case NotificationTopicAction.friend_request__create:
                return self.friend_request__create(data)
            case NotificationTopicAction.friend_request__accept:
                return self.friend_request__accept(data)
            case NotificationTopicAction.gender__change:
                return self.gender__change(data)
            case NotificationTopicAction.general__new_blog_post:
                return self.general__new_blog_post(data)
            case NotificationTopicAction.host_request__create:
                return self.host_request__create(data)
            case NotificationTopicAction.host_request__message:
                return self.host_request__message(data)
            case NotificationTopicAction.host_request__missed_messages:
                return self.host_request__missed_messages(data)
            case NotificationTopicAction.host_request__reminder:
                return self.host_request__reminder(data)
            case NotificationTopicAction.host_request__accept:
                return self.host_request__accept(data)
            case NotificationTopicAction.host_request__reject:
                return self.host_request__reject(data)
            case NotificationTopicAction.host_request__cancel:
                return self.host_request__cancel(data)
            case NotificationTopicAction.host_request__confirm:
                return self.host_request__confirm(data)
            case NotificationTopicAction.modnote__create:
                return self.modnote__create()
            case NotificationTopicAction.onboarding__reminder:
                return self.onboarding__reminder(key)
            case NotificationTopicAction.password__change:
                return self.password__change()
            case NotificationTopicAction.password_reset__start:
                return self.password_reset__start(data)
            case NotificationTopicAction.password_reset__complete:
                return self.password_reset__complete()
            case NotificationTopicAction.phone_number__change:
                return self.phone_number__change(data)
            case NotificationTopicAction.phone_number__verify:
                return self.phone_number__verify(data)
            case NotificationTopicAction.postal_verification__postcard_sent:
                return self.postal_verification__postcard_sent(data)
            case NotificationTopicAction.postal_verification__success:
                return self.postal_verification__success()
            case NotificationTopicAction.postal_verification__failed:
                return self.postal_verification__failed(data)
            case NotificationTopicAction.reference__receive_friend:
                return self.reference__receive_friend(data)
            case NotificationTopicAction.reference__receive_hosted:
                return self.reference__receive_hosted(data)
            case NotificationTopicAction.reference__receive_surfed:
                return self.reference__receive_surfed(data)
            case NotificationTopicAction.reference__reminder_hosted:
                return self.reference__reminder_hosted(data)
            case NotificationTopicAction.reference__reminder_surfed:
                return self.reference__reminder_surfed(data)
            case NotificationTopicAction.thread__reply:
                return self.thread__reply(data)
            case NotificationTopicAction.verification__sv_success:
                return self.verification__sv_success()
            case NotificationTopicAction.verification__sv_fail:
                return self.verification__sv_fail(data)
            case _:
                # Enables mypy's exhaustiveness checking for the cases above.
                assert_never(topic_action)

    def _get_content(
        self,
        string_group: NotificationTopicAction | str,
        title: str | None = None,
        ios_title: str | None = None,
        ios_subtitle: str | None = None,
        body: str | None = None,
        substitutions: dict[str, str | int] | None = None,
        icon_user: api_pb2.User | None = None,
        action_url: str | None = None,
    ) -> PushNotificationContent:
        """
        Fills a PushNotificationContent by looking up localized
        string based on the topic_action key, unless other strings
        are provided by the caller.

        Localized strings have the provided substitutions applied.
        """
        key_prefix = self._get_string_key_prefix(string_group)

        # Look up the localized string for any string that was not provided
        if title is None:
            title = localize_string(self.locale, f"{key_prefix}.title", substitutions=substitutions)
        if ios_title is None:
            ios_title = localize_string(self.locale, f"{key_prefix}.ios_title", substitutions=substitutions)
        if ios_subtitle is None:
            # The subtitle is optional, so only check if a string exists
            string = get_i18next().find_string(f"{key_prefix}.ios_subtitle", self.locale, substitutions=substitutions)
            if string is not None:
                ios_subtitle = string.render(substitutions=substitutions)
        if body is None:
            body = localize_string(self.locale, f"{key_prefix}.body", substitutions=substitutions)

        icon_url = self._avatar_url_or_default(icon_user) if icon_user else None

        return PushNotificationContent(
            title=title, ios_title=title, ios_subtitle=ios_subtitle, body=body, icon_url=icon_url, action_url=action_url
        )

    def _get_string(
        self, string_group: NotificationTopicAction | str, key: str, substitutions: dict[str, str | int] | None = None
    ) -> str:
        key = f"{self._get_string_key_prefix(string_group)}.{key}"
        return localize_string(self.locale, key, substitutions=substitutions)

    def _get_string_key_prefix(self, string_group: NotificationTopicAction | str) -> str:
        if isinstance(string_group, NotificationTopicAction):
            string_group = string_group.display.replace(":", "__")
        return f"push_notifs.{string_group}"

    def _avatar_url_or_default(self, user: api_pb2.User) -> str:
        return user.avatar_thumbnail_url or urls.icon_url()

    def account_deletion__start(self, data: notification_data_pb2.AccountDeletionStart) -> PushNotificationContent:
        return self._get_content(NotificationTopicAction.account_deletion__start)

    def account_deletion__complete(
        self, data: notification_data_pb2.AccountDeletionComplete
    ) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.account_deletion__complete, substitutions={"count": data.undelete_days}
        )

    def account_deletion__recovered(self) -> PushNotificationContent:
        return self._get_content(NotificationTopicAction.account_deletion__recovered)

    def activeness__probe(self, data: notification_data_pb2.ActivenessProbe) -> PushNotificationContent:
        return self._get_content(NotificationTopicAction.activeness__probe)

    def api_key__create(self, data: notification_data_pb2.ApiKeyCreate) -> PushNotificationContent:
        return self._get_content(NotificationTopicAction.api_key__create)

    def badge__add(self, data: notification_data_pb2.BadgeAdd) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.badge__add,
            substitutions={"badge_name": data.badge_name},
            action_url=urls.profile_link(),
        )

    def badge__remove(self, data: notification_data_pb2.BadgeRemove) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.badge__remove,
            substitutions={"badge_name": data.badge_name},
            action_url=urls.profile_link(),
        )

    def birthdate__change(self, data: notification_data_pb2.BirthdateChange) -> PushNotificationContent:
        birth_date = localize_date_from_iso(data.birthdate, self.locale)
        return self._get_content(
            NotificationTopicAction.birthdate__change,
            substitutions={"birthdate": birth_date},
            action_url=urls.account_settings_link(),
        )

    def chat__message(self, data: notification_data_pb2.ChatMessage) -> PushNotificationContent:
        # All strings are dynamic, no need to use _get_content
        return PushNotificationContent(
            title=data.author.name,
            ios_title=data.author.name,
            body=data.text,
            icon_url=self._avatar_url_or_default(data.author),
            action_url=urls.chat_link(chat_id=data.group_chat_id),
        )

    def chat__missed_messages(self, data: notification_data_pb2.ChatMissedMessages) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.chat__missed_messages,
            substitutions={"count": len(data.messages)},
            action_url=urls.messages_link(),
        )

    def donation__received(self, data: notification_data_pb2.DonationReceived) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.donation__received,
            # Other currencies are not yet supported
            substitutions={"amount_with_currency": f"${data.amount}"},
            action_url=data.receipt_url,
        )

    def discussion__create(self, data: notification_data_pb2.DiscussionCreate) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.discussion__create,
            substitutions={
                "title": data.discussion.title,
                "user": data.author.name,
                "group_or_community": data.discussion.owner_title,
            },
            icon_user=data.author,
            action_url=urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug),
        )

    def discussion__comment(self, data: notification_data_pb2.DiscussionComment) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.discussion__comment,
            ios_title=data.author.name,
            ios_subtitle=data.discussion.title,
            body=data.reply.content,
            substitutions={"user": data.author.name, "title": data.discussion.title},
            icon_user=data.author,
            action_url=urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug),
        )

    def email_address__change(self, data: notification_data_pb2.EmailAddressChange) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.email_address__change,
            substitutions={"email": data.new_email},
            action_url=urls.account_settings_link(),
        )

    def email_address__verify(self) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.email_address__verify,
            action_url=urls.account_settings_link(),
        )

    def event__create_any(self, data: notification_data_pb2.EventCreate) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.event__create_any,
            substitutions={
                "title": data.event.title,
                "user": data.inviting_user.name,
                "date_and_time": localize_datetime(data.event.start_time, self.timezone, self.locale),
            },
            action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
        )

    def event__create_approved(self, data: notification_data_pb2.EventCreate) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.event__create_approved,
            substitutions={
                "title": data.event.title,
                "user": data.inviting_user.name,
                "date_and_time": localize_datetime(data.event.start_time, self.timezone, self.locale),
            },
            action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
        )

    def event__update(self, data: notification_data_pb2.EventUpdate) -> PushNotificationContent:
        # updated_items can include: title, content, start_time, end_time, location,
        # but a list like that is tricky to localize.
        return self._get_content(
            NotificationTopicAction.event__update,
            substitutions={
                "title": data.event.title,
                "user": data.updating_user.name,
            },
            action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
        )

    def event__invite_organizer(self, data: notification_data_pb2.EventInviteOrganizer) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.event__invite_organizer,
            substitutions={
                "title": data.event.title,
                "user": data.inviting_user.name,
            },
            action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
        )

    def event__comment(self, data: notification_data_pb2.EventComment) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.event__comment,
            substitutions={
                "title": data.event.title,
                "user": data.author.name,
            },
            body=data.reply.content,
            icon_user=data.author,
            action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
        )

    def event__reminder(self, data: notification_data_pb2.EventReminder) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.event__reminder,
            substitutions={
                "title": data.event.title,
                "date_and_time": localize_datetime(data.event.start_time, self.timezone, self.locale),
            },
            action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
        )

    def event__cancel(self, data: notification_data_pb2.EventCancel) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.event__cancel,
            substitutions={
                "title": data.event.title,
                "user": data.cancelling_user.name,
            },
            action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
        )

    def event__delete(self, data: notification_data_pb2.EventDelete) -> PushNotificationContent:
        return self._get_content(NotificationTopicAction.event__delete, substitutions={"title": data.event.title})

    def friend_request__create(self, data: notification_data_pb2.FriendRequestCreate) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.friend_request__create,
            substitutions={"from_user": data.other_user.name},
            icon_user=data.other_user,
            action_url=urls.friend_requests_link(),
        )

    def friend_request__accept(self, data: notification_data_pb2.FriendRequestAccept) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.friend_request__accept,
            substitutions={"friend": data.other_user.name},
            icon_user=data.other_user,
            action_url=urls.user_link(username=data.other_user.username),
        )

    def gender__change(self, data: notification_data_pb2.GenderChange) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.gender__change,
            substitutions={"gender": data.gender},
            action_url=urls.account_settings_link(),
        )

    def general__new_blog_post(self, data: notification_data_pb2.GeneralNewBlogPost) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.general__new_blog_post,
            body=data.blurb,
            substitutions={"title": data.title},
            action_url=data.url,
        )

    def host_request__create(self, data: notification_data_pb2.HostRequestCreate) -> PushNotificationContent:
        days = (
            date.fromisoformat(data.host_request.to_date) - date.fromisoformat(data.host_request.from_date)
        ).days + 1
        return self._get_content(
            NotificationTopicAction.host_request__create,
            substitutions={
                "user": data.surfer.name,
                "start_date": localize_date_from_iso(data.host_request.from_date, self.locale),
                "count": days,
            },
            icon_user=data.surfer,
            action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    def host_request__message(self, data: notification_data_pb2.HostRequestMessage) -> PushNotificationContent:
        # All strings are dynamic, no need to use _get_content
        return PushNotificationContent(
            title=data.user.name,
            ios_title=data.user.name,
            body=data.text,
            action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
            icon_url=self._avatar_url_or_default(data.user),
        )

    def host_request__missed_messages(
        self, data: notification_data_pb2.HostRequestMissedMessages
    ) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.host_request__missed_messages,
            substitutions={"user": data.user.name},
            icon_user=data.user,
            action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    def host_request__reminder(self, data: notification_data_pb2.HostRequestReminder) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.host_request__reminder,
            substitutions={"user": data.surfer.name},
            icon_user=data.surfer,
            action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    def host_request__accept(self, data: notification_data_pb2.HostRequestAccept) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.host_request__accept,
            substitutions={
                "user": data.host.name,
                "date": localize_date_from_iso(data.host_request.from_date, self.locale),
            },
            icon_user=data.host,
            action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    def host_request__reject(self, data: notification_data_pb2.HostRequestReject) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.host_request__reject,
            substitutions={
                "user": data.host.name,
                "date": localize_date_from_iso(data.host_request.from_date, self.locale),
            },
            icon_user=data.host,
            action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    def host_request__cancel(self, data: notification_data_pb2.HostRequestCancel) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.host_request__cancel,
            substitutions={
                "user": data.surfer.name,
                "date": localize_date_from_iso(data.host_request.from_date, self.locale),
            },
            icon_user=data.surfer,
            action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    def host_request__confirm(self, data: notification_data_pb2.HostRequestConfirm) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.host_request__confirm,
            substitutions={
                "user": data.surfer.name,
                "date": localize_date_from_iso(data.host_request.from_date, self.locale),
            },
            icon_user=data.surfer,
            action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        )

    def modnote__create(self) -> PushNotificationContent:
        return self._get_content(NotificationTopicAction.modnote__create)

    def onboarding__reminder(self, key: str) -> PushNotificationContent:
        string_group = NotificationTopicAction.onboarding__reminder.display.replace(":", "__")
        string_group += "."
        string_group += "first" if key == "1" else "subsequent"
        return self._get_content(
            string_group,
            action_url=urls.edit_profile_link(),
        )

    def password__change(self) -> PushNotificationContent:
        return self._get_content(NotificationTopicAction.password__change, action_url=urls.account_settings_link())

    def password_reset__start(self, data: notification_data_pb2.PasswordResetStart) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.password_reset__start,
            action_url=urls.account_settings_link(),
        )

    def password_reset__complete(self) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.password_reset__complete,
            action_url=urls.account_settings_link(),
        )

    def phone_number__change(self, data: notification_data_pb2.PhoneNumberChange) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.phone_number__change,
            substitutions={"phone_number": format_phone_number(data.phone)},
            action_url=urls.account_settings_link(),
        )

    def phone_number__verify(self, data: notification_data_pb2.PhoneNumberVerify) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.phone_number__verify,
            substitutions={"phone_number": format_phone_number(data.phone)},
            action_url=urls.account_settings_link(),
        )

    def postal_verification__postcard_sent(
        self,
        data: notification_data_pb2.PostalVerificationPostcardSent,
    ) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.postal_verification__postcard_sent,
            substitutions={"city": data.city, "country": data.country},
            action_url=urls.account_settings_link(),
        )

    def postal_verification__success(self) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.postal_verification__success,
            action_url=urls.account_settings_link(),
        )

    def postal_verification__failed(
        self, data: notification_data_pb2.PostalVerificationFailed
    ) -> PushNotificationContent:
        body_key: str
        match data.reason:
            case notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED:
                body_key = "body_code_expired"
            case notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_TOO_MANY_ATTEMPTS:
                body_key = "body_too_many_attempts"
            case _:
                body_key = "body_generic"

        return self._get_content(
            NotificationTopicAction.postal_verification__failed,
            body=self._get_string(NotificationTopicAction.postal_verification__failed, body_key),
            action_url=urls.account_settings_link(),
        )

    def reference__receive_friend(self, data: notification_data_pb2.ReferenceReceiveFriend) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.reference__receive_friend,
            body=data.text,
            substitutions={"user": data.from_user.name},
            icon_user=data.from_user,
            action_url=urls.profile_references_link(),
        )

    def reference__receive(
        self, data: notification_data_pb2.ReferenceReceiveHostRequest, leave_reference_type: str
    ) -> PushNotificationContent:
        body: str
        if data.text:
            body = data.text
            action_url = urls.profile_references_link()
        else:
            body = self._get_string(
                "reference__receive", "body_must_write_yours", substitutions={"user": data.from_user.name}
            )
            action_url = urls.leave_reference_link(
                reference_type=leave_reference_type,
                to_user_id=data.from_user.user_id,
                host_request_id=str(data.host_request_id),
            )
        return self._get_content(
            string_group="reference__receive",
            body=body,
            substitutions={"user": data.from_user.name},
            icon_user=data.from_user,
            action_url=action_url,
        )

    def reference__receive_hosted(
        self, data: notification_data_pb2.ReferenceReceiveHostRequest
    ) -> PushNotificationContent:
        # Receiving a hosted reminder means I need to leave a surfed reference
        return self.reference__receive(data, leave_reference_type="surfed")

    def reference__receive_surfed(
        self, data: notification_data_pb2.ReferenceReceiveHostRequest
    ) -> PushNotificationContent:
        return self.reference__receive(data, leave_reference_type="hosted")

    def reference__reminder(
        self, data: notification_data_pb2.ReferenceReminder, leave_reference_type: str
    ) -> PushNotificationContent:
        leave_reference_link = urls.leave_reference_link(
            reference_type=leave_reference_type,
            to_user_id=data.other_user.user_id,
            host_request_id=str(data.host_request_id),
        )
        return self._get_content(
            string_group="reference__reminder",
            substitutions={"count": data.days_left, "user": data.other_user.name},
            icon_user=data.other_user,
            action_url=leave_reference_link,
        )

    def reference__reminder_surfed(self, data: notification_data_pb2.ReferenceReminder) -> PushNotificationContent:
        # Surfed reminder means I need to leave a surfed reference
        return self.reference__reminder(data, leave_reference_type="surfed")

    def reference__reminder_hosted(self, data: notification_data_pb2.ReferenceReminder) -> PushNotificationContent:
        return self.reference__reminder(data, leave_reference_type="hosted")

    def thread__reply(self, data: notification_data_pb2.ThreadReply) -> PushNotificationContent:
        parent_title: str
        view_link: str
        match data.WhichOneof("reply_parent"):
            case "event":
                parent_title = data.event.title
                view_link = urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug)
            case "discussion":
                parent_title = data.discussion.title
                view_link = urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug)
            case _:
                raise Exception("Can only do replies to events and discussions")

        return self._get_content(
            NotificationTopicAction.thread__reply,
            body=data.reply.content,
            substitutions={"user": data.author.name, "title": parent_title},
            icon_user=data.author,
            action_url=view_link,
        )

    def verification__sv_success(self) -> PushNotificationContent:
        return self._get_content(
            NotificationTopicAction.verification__sv_success,
            action_url=urls.account_settings_link(),
        )

    def verification__sv_fail(self, data: notification_data_pb2.VerificationSVFail) -> PushNotificationContent:
        body_key: str
        match data.reason:
            case notification_data_pb2.SV_FAIL_REASON_WRONG_BIRTHDATE_OR_GENDER:
                body_key = "body_wrong_birthdate_gender"
            case notification_data_pb2.SV_FAIL_REASON_NOT_A_PASSPORT:
                body_key = "body_not_a_passport"
            case notification_data_pb2.SV_FAIL_REASON_DUPLICATE:
                body_key = "body_duplicate"
            case _:
                raise Exception("Shouldn't get here")

        return self._get_content(
            NotificationTopicAction.verification__sv_success,
            body=self._get_string(NotificationTopicAction.verification__sv_fail, body_key),
            action_url=urls.account_settings_link(),
        )
