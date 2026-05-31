"""
Renders a Notification model into a localized push notification.
"""

import logging
from datetime import date
from typing import Any, assert_never

from google.protobuf.timestamp_pb2 import Timestamp

from couchers import urls
from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import LocalizationError
from couchers.i18n.localize import format_phone_number
from couchers.models import Notification, NotificationTopicAction
from couchers.notifications.locales import get_notifs_i18next
from couchers.notifications.push import PushNotificationContent
from couchers.proto import api_pb2, notification_data_pb2

logger = logging.getLogger(__name__)

# See PushNotificationContent's documentation for notification writing guidelines.


def render_push_notification(notification: Notification, loc_context: LocalizationContext) -> PushNotificationContent:
    data: Any = notification.topic_action.data_type.FromString(notification.data)  # type: ignore[attr-defined]

    match notification.topic_action:
        # Using a match statement enable mypy's exhaustiveness checking.
        # Every case is has its own function so that they can declare different types for "data",
        # as mypy wouldn't allow that in a single function.
        # Keep topics sorted (actions can follow logical ordering)
        case NotificationTopicAction.account_deletion__start:
            return _render_account_deletion__start(data, loc_context)
        case NotificationTopicAction.account_deletion__complete:
            return _render_account_deletion__complete(data, loc_context)
        case NotificationTopicAction.account_deletion__recovered:
            return _render_account_deletion__recovered(loc_context)
        case NotificationTopicAction.activeness__probe:
            return _render_activeness__probe(data, loc_context)
        case NotificationTopicAction.api_key__create:
            return _render_api_key__create(data, loc_context)
        case NotificationTopicAction.badge__add:
            return _render_badge__add(data, loc_context)
        case NotificationTopicAction.badge__remove:
            return _render_badge__remove(data, loc_context)
        case NotificationTopicAction.birthdate__change:
            return _render_birthdate__change(data, loc_context)
        case NotificationTopicAction.chat__message:
            return _render_chat__message(data, loc_context)
        case NotificationTopicAction.chat__missed_messages:
            return _render_chat__missed_messages(data, loc_context)
        case NotificationTopicAction.donation__received:
            return _render_donation__received(data, loc_context)
        case NotificationTopicAction.discussion__create:
            return _render_discussion__create(data, loc_context)
        case NotificationTopicAction.discussion__comment:
            return _render_discussion__comment(data, loc_context)
        case NotificationTopicAction.email_address__change:
            return _render_email_address__change(data, loc_context)
        case NotificationTopicAction.email_address__verify:
            return _render_email_address__verify(loc_context)
        case NotificationTopicAction.event__create_any:
            return _render_event__create_any(data, loc_context)
        case NotificationTopicAction.event__create_approved:
            return _render_event__create_approved(data, loc_context)
        case NotificationTopicAction.event__update:
            return _render_event__update(data, loc_context)
        case NotificationTopicAction.event__invite_organizer:
            return _render_event__invite_organizer(data, loc_context)
        case NotificationTopicAction.event__comment:
            return _render_event__comment(data, loc_context)
        case NotificationTopicAction.event__reminder:
            return _render_event__reminder(data, loc_context)
        case NotificationTopicAction.event__cancel:
            return _render_event__cancel(data, loc_context)
        case NotificationTopicAction.event__delete:
            return _render_event__delete(data, loc_context)
        case NotificationTopicAction.friend_request__create:
            return _render_friend_request__create(data, loc_context)
        case NotificationTopicAction.friend_request__accept:
            return _render_friend_request__accept(data, loc_context)
        case NotificationTopicAction.gender__change:
            return _render_gender__change(data, loc_context)
        case NotificationTopicAction.general__new_blog_post:
            return _render_general__new_blog_post(data, loc_context)
        case NotificationTopicAction.host_request__create:
            return _render_host_request__create(data, loc_context)
        case NotificationTopicAction.host_request__message:
            return _render_host_request__message(data, loc_context)
        case NotificationTopicAction.host_request__missed_messages:
            return _render_host_request__missed_messages(data, loc_context)
        case NotificationTopicAction.host_request__reminder:
            return _render_host_request__reminder(data, loc_context)
        case NotificationTopicAction.host_request__accept:
            return _render_host_request__accept(data, loc_context)
        case NotificationTopicAction.host_request__reject:
            return _render_host_request__reject(data, loc_context)
        case NotificationTopicAction.host_request__cancel:
            return _render_host_request__cancel(data, loc_context)
        case NotificationTopicAction.host_request__confirm:
            return _render_host_request__confirm(data, loc_context)
        case NotificationTopicAction.modnote__create:
            return _render_modnote__create(loc_context)
        case NotificationTopicAction.onboarding__reminder:
            return _render_onboarding__reminder(notification.key, loc_context)
        case NotificationTopicAction.password__change:
            return _render_password__change(loc_context)
        case NotificationTopicAction.password_reset__start:
            return _render_password_reset__start(data, loc_context)
        case NotificationTopicAction.password_reset__complete:
            return _render_password_reset__complete(loc_context)
        case NotificationTopicAction.phone_number__change:
            return _render_phone_number__change(data, loc_context)
        case NotificationTopicAction.phone_number__verify:
            return _render_phone_number__verify(data, loc_context)
        case NotificationTopicAction.postal_verification__postcard_sent:
            return _render_postal_verification__postcard_sent(data, loc_context)
        case NotificationTopicAction.postal_verification__success:
            return _render_postal_verification__success(loc_context)
        case NotificationTopicAction.postal_verification__failed:
            return _render_postal_verification__failed(data, loc_context)
        case NotificationTopicAction.reference__receive_friend:
            return _render_reference__receive_friend(data, loc_context)
        case NotificationTopicAction.reference__receive_hosted:
            return _render_reference__receive_hosted(data, loc_context)
        case NotificationTopicAction.reference__receive_surfed:
            return _render_reference__receive_surfed(data, loc_context)
        case NotificationTopicAction.reference__reminder_hosted:
            return _render_reference__reminder_hosted(data, loc_context)
        case NotificationTopicAction.reference__reminder_surfed:
            return _render_reference__reminder_surfed(data, loc_context)
        case NotificationTopicAction.thread__reply:
            return _render_thread__reply(data, loc_context)
        case NotificationTopicAction.verification__sv_success:
            return _render_verification__sv_success(loc_context)
        case NotificationTopicAction.verification__sv_fail:
            return _render_verification__sv_fail(data, loc_context)
        case _:
            # Enables mypy's exhaustiveness checking for the cases above.
            assert_never(notification.topic_action)


def render_adhoc_push_notification(name: str, loc_context: LocalizationContext) -> PushNotificationContent:
    """Renders a push notification that doesn't have an assigned topic-action."""
    return _get_content(string_group=f"_adhoc.{name}.push", loc_context=loc_context)


def _get_content(
    string_group: NotificationTopicAction | str,
    loc_context: LocalizationContext,
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
    # Look up the localized string for any string that was not provided
    if title is None:
        title = _get_string(string_group, "title", loc_context, substitutions)
    if ios_title is None:
        ios_title = _get_string(string_group, "ios_title", loc_context, substitutions)
    if ios_subtitle is None:
        try:
            ios_subtitle = _get_string(string_group, "ios_subtitle", loc_context, substitutions)
        except LocalizationError:
            # Not all notifications have subtitles
            pass
    if body is None:
        body = _get_string(string_group, "body", loc_context, substitutions)

    icon_url = _avatar_url_or_default(icon_user) if icon_user else None

    return PushNotificationContent(
        title=title, ios_title=ios_title, ios_subtitle=ios_subtitle, body=body, icon_url=icon_url, action_url=action_url
    )


def _get_string(
    string_group: NotificationTopicAction | str,
    key: str,
    loc_context: LocalizationContext,
    substitutions: dict[str, str | int] | None = None,
) -> str:
    if isinstance(string_group, NotificationTopicAction):
        full_key = f"{string_group.topic}.{string_group.action}.push.{key}"
    else:
        full_key = f"{string_group}.{key}"
    return get_notifs_i18next().localize(full_key, loc_context.locale, substitutions)


def _avatar_url_or_default(user: api_pb2.User) -> str:
    return user.avatar_thumbnail_url or urls.icon_url()


def _render_account_deletion__start(
    data: notification_data_pb2.AccountDeletionStart, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(NotificationTopicAction.account_deletion__start, loc_context)


def _render_account_deletion__complete(
    data: notification_data_pb2.AccountDeletionComplete, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.account_deletion__complete, loc_context, substitutions={"count": data.undelete_days}
    )


def _render_account_deletion__recovered(loc_context: LocalizationContext) -> PushNotificationContent:
    return _get_content(NotificationTopicAction.account_deletion__recovered, loc_context)


def _render_activeness__probe(
    data: notification_data_pb2.ActivenessProbe, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(NotificationTopicAction.activeness__probe, loc_context)


def _render_api_key__create(
    data: notification_data_pb2.ApiKeyCreate, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(NotificationTopicAction.api_key__create, loc_context)


def _render_badge__add(
    data: notification_data_pb2.BadgeAdd, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.badge__add,
        loc_context,
        substitutions={"badge_name": data.badge_name},
        action_url=urls.profile_link(),
    )


def _render_badge__remove(
    data: notification_data_pb2.BadgeRemove, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.badge__remove,
        loc_context,
        substitutions={"badge_name": data.badge_name},
        action_url=urls.profile_link(),
    )


def _render_birthdate__change(
    data: notification_data_pb2.BirthdateChange, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.birthdate__change,
        loc_context,
        substitutions={"birthdate": loc_context.localize_date_from_iso(data.birthdate)},
        action_url=urls.account_settings_link(),
    )


def _render_chat__message(
    data: notification_data_pb2.ChatMessage, loc_context: LocalizationContext
) -> PushNotificationContent:
    # All strings are dynamic, no need to use _get_content
    return PushNotificationContent(
        title=data.author.name,
        ios_title=data.author.name,
        body=data.text,
        icon_url=_avatar_url_or_default(data.author),
        action_url=urls.chat_link(chat_id=data.group_chat_id),
    )


def _render_chat__missed_messages(
    data: notification_data_pb2.ChatMissedMessages, loc_context: LocalizationContext
) -> PushNotificationContent:
    # Each message is from a different chat, so this counts conversations.
    missed_count: int = len(data.messages)

    # Newer version of protos include a per-chat unseen message count (1 or more)
    if data.messages and data.messages[0].unseen_count:
        missed_count = sum(message.unseen_count for message in data.messages)

    return _get_content(
        NotificationTopicAction.chat__missed_messages,
        loc_context,
        substitutions={"count": missed_count},
        action_url=urls.messages_link(),
    )


def _render_donation__received(
    data: notification_data_pb2.DonationReceived, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.donation__received,
        loc_context,
        # Other currencies are not yet supported
        substitutions={"amount_with_currency": f"${data.amount}"},
        action_url=data.receipt_url,
    )


def _render_discussion__create(
    data: notification_data_pb2.DiscussionCreate, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.discussion__create,
        loc_context,
        substitutions={
            "title": data.discussion.title,
            "user": data.author.name,
            "group_or_community": data.discussion.owner_title,
        },
        icon_user=data.author,
        action_url=urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug),
    )


def _render_discussion__comment(
    data: notification_data_pb2.DiscussionComment, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.discussion__comment,
        loc_context,
        ios_title=data.author.name,
        ios_subtitle=data.discussion.title,
        body=data.reply.content,
        substitutions={"user": data.author.name, "title": data.discussion.title},
        icon_user=data.author,
        action_url=urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug),
    )


def _render_email_address__change(
    data: notification_data_pb2.EmailAddressChange, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.email_address__change,
        loc_context,
        substitutions={"email": data.new_email},
        action_url=urls.account_settings_link(),
    )


def _render_email_address__verify(loc_context: LocalizationContext) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.email_address__verify,
        loc_context,
        action_url=urls.account_settings_link(),
    )


def _render_event__create_any(
    data: notification_data_pb2.EventCreate, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.event__create_any,
        loc_context,
        substitutions={
            "title": data.event.title,
            "user": data.inviting_user.name,
            "date_and_time": _format_event_start_datetime(data.event.start_time, loc_context),
        },
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _render_event__create_approved(
    data: notification_data_pb2.EventCreate, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.event__create_approved,
        loc_context,
        substitutions={
            "title": data.event.title,
            "user": data.inviting_user.name,
            "date_and_time": _format_event_start_datetime(data.event.start_time, loc_context),
        },
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _render_event__update(
    data: notification_data_pb2.EventUpdate, loc_context: LocalizationContext
) -> PushNotificationContent:
    # updated_items can include: title, content, start_time, end_time, location,
    # but a list like that is tricky to localize.
    return _get_content(
        NotificationTopicAction.event__update,
        loc_context,
        substitutions={
            "title": data.event.title,
            "user": data.updating_user.name,
        },
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _render_event__invite_organizer(
    data: notification_data_pb2.EventInviteOrganizer, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.event__invite_organizer,
        loc_context,
        substitutions={
            "title": data.event.title,
            "user": data.inviting_user.name,
        },
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _render_event__comment(
    data: notification_data_pb2.EventComment, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.event__comment,
        loc_context,
        substitutions={
            "title": data.event.title,
            "user": data.author.name,
        },
        body=data.reply.content,
        icon_user=data.author,
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _render_event__reminder(
    data: notification_data_pb2.EventReminder, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.event__reminder,
        loc_context,
        substitutions={
            "title": data.event.title,
            "date_and_time": _format_event_start_datetime(data.event.start_time, loc_context),
        },
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _render_event__cancel(
    data: notification_data_pb2.EventCancel, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.event__cancel,
        loc_context,
        substitutions={
            "title": data.event.title,
            "user": data.cancelling_user.name,
        },
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _render_event__delete(
    data: notification_data_pb2.EventDelete, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(NotificationTopicAction.event__delete, loc_context, substitutions={"title": data.event.title})


def _render_friend_request__create(
    data: notification_data_pb2.FriendRequestCreate, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.friend_request__create,
        loc_context,
        substitutions={"from_user": data.other_user.name},
        icon_user=data.other_user,
        action_url=urls.friend_requests_link(from_user_id=data.other_user.user_id),
    )


def _render_friend_request__accept(
    data: notification_data_pb2.FriendRequestAccept, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.friend_request__accept,
        loc_context,
        substitutions={"friend": data.other_user.name},
        icon_user=data.other_user,
        action_url=urls.user_link(username=data.other_user.username),
    )


def _render_gender__change(
    data: notification_data_pb2.GenderChange, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.gender__change,
        loc_context,
        substitutions={"gender": data.gender},
        action_url=urls.account_settings_link(),
    )


def _render_general__new_blog_post(
    data: notification_data_pb2.GeneralNewBlogPost, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.general__new_blog_post,
        loc_context,
        body=data.blurb,
        substitutions={"title": data.title},
        action_url=data.url,
    )


def _render_host_request__create(
    data: notification_data_pb2.HostRequestCreate, loc_context: LocalizationContext
) -> PushNotificationContent:
    night_count = (date.fromisoformat(data.host_request.to_date) - date.fromisoformat(data.host_request.from_date)).days
    return _get_content(
        NotificationTopicAction.host_request__create,
        loc_context,
        substitutions={
            "user": data.surfer.name,
            "start_date": _format_host_request_start_date(data.host_request.from_date, loc_context),
            "count": night_count,
        },
        icon_user=data.surfer,
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
    )


def _render_host_request__message(
    data: notification_data_pb2.HostRequestMessage, loc_context: LocalizationContext
) -> PushNotificationContent:
    # All strings are dynamic, no need to use _get_content
    return PushNotificationContent(
        title=data.user.name,
        ios_title=data.user.name,
        body=data.text,
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=_avatar_url_or_default(data.user),
    )


def _render_host_request__missed_messages(
    data: notification_data_pb2.HostRequestMissedMessages, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.host_request__missed_messages,
        loc_context,
        substitutions={"user": data.user.name},
        icon_user=data.user,
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
    )


def _render_host_request__reminder(
    data: notification_data_pb2.HostRequestReminder, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.host_request__reminder,
        loc_context,
        substitutions={"user": data.surfer.name},
        icon_user=data.surfer,
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
    )


def _render_host_request__accept(
    data: notification_data_pb2.HostRequestAccept, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.host_request__accept,
        loc_context,
        substitutions={
            "user": data.host.name,
            "date": _format_host_request_start_date(data.host_request.from_date, loc_context),
        },
        icon_user=data.host,
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
    )


def _render_host_request__reject(
    data: notification_data_pb2.HostRequestReject, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.host_request__reject,
        loc_context,
        substitutions={
            "user": data.host.name,
            "date": _format_host_request_start_date(data.host_request.from_date, loc_context),
        },
        icon_user=data.host,
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
    )


def _render_host_request__cancel(
    data: notification_data_pb2.HostRequestCancel, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.host_request__cancel,
        loc_context,
        substitutions={
            "user": data.surfer.name,
            "date": _format_host_request_start_date(data.host_request.from_date, loc_context),
        },
        icon_user=data.surfer,
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
    )


def _render_host_request__confirm(
    data: notification_data_pb2.HostRequestConfirm, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.host_request__confirm,
        loc_context,
        substitutions={
            "user": data.surfer.name,
            "date": _format_host_request_start_date(data.host_request.from_date, loc_context),
        },
        icon_user=data.surfer,
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
    )


def _render_modnote__create(loc_context: LocalizationContext) -> PushNotificationContent:
    return _get_content(NotificationTopicAction.modnote__create, loc_context)


def _render_onboarding__reminder(key: str, loc_context: LocalizationContext) -> PushNotificationContent:
    variant = "first" if key == "1" else "subsequent"
    return _get_content(
        f"onboarding.reminder.push.{variant}",
        loc_context,
        action_url=urls.edit_profile_link(),
    )


def _render_password__change(loc_context: LocalizationContext) -> PushNotificationContent:
    return _get_content(NotificationTopicAction.password__change, loc_context, action_url=urls.account_settings_link())


def _render_password_reset__start(
    data: notification_data_pb2.PasswordResetStart, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.password_reset__start,
        loc_context,
        action_url=urls.account_settings_link(),
    )


def _render_password_reset__complete(loc_context: LocalizationContext) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.password_reset__complete,
        loc_context,
        action_url=urls.account_settings_link(),
    )


def _render_phone_number__change(
    data: notification_data_pb2.PhoneNumberChange, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.phone_number__change,
        loc_context,
        substitutions={"phone_number": format_phone_number(data.phone)},
        action_url=urls.account_settings_link(),
    )


def _render_phone_number__verify(
    data: notification_data_pb2.PhoneNumberVerify, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.phone_number__verify,
        loc_context,
        substitutions={"phone_number": format_phone_number(data.phone)},
        action_url=urls.account_settings_link(),
    )


def _render_postal_verification__postcard_sent(
    data: notification_data_pb2.PostalVerificationPostcardSent, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.postal_verification__postcard_sent,
        loc_context,
        substitutions={"city": data.city, "country": data.country},
        action_url=urls.account_settings_link(),
    )


def _render_postal_verification__success(loc_context: LocalizationContext) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.postal_verification__success,
        loc_context,
        action_url=urls.account_settings_link(),
    )


def _render_postal_verification__failed(
    data: notification_data_pb2.PostalVerificationFailed, loc_context: LocalizationContext
) -> PushNotificationContent:
    body_key: str
    match data.reason:
        case notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED:
            body_key = "body_code_expired"
        case notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_TOO_MANY_ATTEMPTS:
            body_key = "body_too_many_attempts"
        case _:
            body_key = "body_generic"

    return _get_content(
        NotificationTopicAction.postal_verification__failed,
        loc_context,
        body=_get_string(NotificationTopicAction.postal_verification__failed, body_key, loc_context),
        action_url=urls.account_settings_link(),
    )


def _render_reference__receive_friend(
    data: notification_data_pb2.ReferenceReceiveFriend, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.reference__receive_friend,
        loc_context,
        body=data.text,
        substitutions={"user": data.from_user.name},
        icon_user=data.from_user,
        action_url=urls.profile_references_link(),
    )


def _render_reference__receive(
    data: notification_data_pb2.ReferenceReceiveHostRequest, leave_reference_type: str, loc_context: LocalizationContext
) -> PushNotificationContent:
    body: str
    if data.text:
        body = data.text
        action_url = urls.profile_references_link()
    else:
        body = _get_string(
            "reference._receive_any.push",
            "body_must_write_yours",
            loc_context,
            substitutions={"user": data.from_user.name},
        )
        action_url = urls.leave_reference_link(
            reference_type=leave_reference_type,
            to_user_id=data.from_user.user_id,
            host_request_id=str(data.host_request_id),
        )
    return _get_content(
        string_group="reference._receive_any.push",
        loc_context=loc_context,
        body=body,
        substitutions={"user": data.from_user.name},
        icon_user=data.from_user,
        action_url=action_url,
    )


def _render_reference__receive_hosted(
    data: notification_data_pb2.ReferenceReceiveHostRequest, loc_context: LocalizationContext
) -> PushNotificationContent:
    # Receiving a hosted reminder means I need to leave a surfed reference
    return _render_reference__receive(data, leave_reference_type="surfed", loc_context=loc_context)


def _render_reference__receive_surfed(
    data: notification_data_pb2.ReferenceReceiveHostRequest, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _render_reference__receive(data, leave_reference_type="hosted", loc_context=loc_context)


def _render_reference__reminder(
    data: notification_data_pb2.ReferenceReminder, leave_reference_type: str, loc_context: LocalizationContext
) -> PushNotificationContent:
    leave_reference_link = urls.leave_reference_link(
        reference_type=leave_reference_type,
        to_user_id=data.other_user.user_id,
        host_request_id=str(data.host_request_id),
    )
    return _get_content(
        string_group="reference._reminder_any.push",
        loc_context=loc_context,
        substitutions={"count": data.days_left, "user": data.other_user.name},
        icon_user=data.other_user,
        action_url=leave_reference_link,
    )


def _render_reference__reminder_surfed(
    data: notification_data_pb2.ReferenceReminder, loc_context: LocalizationContext
) -> PushNotificationContent:
    # Surfed reminder means I need to leave a surfed reference
    return _render_reference__reminder(data, leave_reference_type="surfed", loc_context=loc_context)


def _render_reference__reminder_hosted(
    data: notification_data_pb2.ReferenceReminder, loc_context: LocalizationContext
) -> PushNotificationContent:
    return _render_reference__reminder(data, leave_reference_type="hosted", loc_context=loc_context)


def _render_thread__reply(
    data: notification_data_pb2.ThreadReply, loc_context: LocalizationContext
) -> PushNotificationContent:
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

    return _get_content(
        NotificationTopicAction.thread__reply,
        loc_context=loc_context,
        body=data.reply.content,
        substitutions={"user": data.author.name, "title": parent_title},
        icon_user=data.author,
        action_url=view_link,
    )


def _render_verification__sv_success(loc_context: LocalizationContext) -> PushNotificationContent:
    return _get_content(
        NotificationTopicAction.verification__sv_success,
        loc_context,
        action_url=urls.account_settings_link(),
    )


def _render_verification__sv_fail(
    data: notification_data_pb2.VerificationSVFail, loc_context: LocalizationContext
) -> PushNotificationContent:
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

    return _get_content(
        NotificationTopicAction.verification__sv_fail,
        loc_context,
        body=_get_string(NotificationTopicAction.verification__sv_fail, body_key, loc_context),
        action_url=urls.account_settings_link(),
    )


def _format_host_request_start_date(date: str, loc_context: LocalizationContext) -> str:
    # Events are typically in the near future future,
    # so the year is not useful but the day of week is.
    return loc_context.localize_date_from_iso(date, with_year=False, with_day_of_week=True)


def _format_event_start_datetime(timestamp: Timestamp, loc_context: LocalizationContext) -> str:
    # Events are typically in the near future future,
    # so the year is not useful but the day of week is.
    return loc_context.localize_datetime(timestamp, with_year=False, with_day_of_week=True)
