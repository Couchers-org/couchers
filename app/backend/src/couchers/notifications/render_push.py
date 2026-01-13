"""
Renders a Notification model into a localized push notification.
"""

import logging
from datetime import date
from typing import Any, assert_never

from couchers import urls
from couchers.i18n.localize import format_phone_number, localize_date_from_iso, localize_datetime_for_user
from couchers.models import Notification, NotificationTopicAction, User
from couchers.notifications.push import PushNotificationContent
from couchers.proto import api_pb2, notification_data_pb2

logger = logging.getLogger(__name__)

# See PushNotificationContent's documentation for notification writing guidelines.


def render_push_notification(user: User, notification: Notification) -> PushNotificationContent:
    # Any-typed so it implicitly converts when calling the methods below
    data: Any = notification.topic_action.data_type.FromString(notification.data)  # type: ignore[attr-defined]
    match notification.topic_action:
        # Using a match statement enable mypy's exhaustiveness checking.
        # Every case is has its own function so that they can declare different types for "data",
        # as mypy wouldn't allow that in a single function.
        # Keep topics sorted (actions can follow logical ordering)
        case NotificationTopicAction.account_deletion__start:
            return _account_deletion__start(data)
        case NotificationTopicAction.account_deletion__complete:
            return _account_deletion__complete(data)
        case NotificationTopicAction.account_deletion__recovered:
            return _account_deletion__recovered()
        case NotificationTopicAction.activeness__probe:
            return _activeness__probe(data)
        case NotificationTopicAction.api_key__create:
            return _api_key__create(data)
        case NotificationTopicAction.badge__add:
            return _badge__add(data)
        case NotificationTopicAction.badge__remove:
            return _badge__remove(data)
        case NotificationTopicAction.birthdate__change:
            return _birthdate__change(data, user)
        case NotificationTopicAction.chat__message:
            return _chat__message(data)
        case NotificationTopicAction.chat__missed_messages:
            return _chat__missed_messages(data)
        case NotificationTopicAction.donation__received:
            return _donation__received(data)
        case NotificationTopicAction.discussion__create:
            return _discussion__create(data)
        case NotificationTopicAction.discussion__comment:
            return _discussion__comment(data)
        case NotificationTopicAction.email_address__change:
            return _email_address__change(data)
        case NotificationTopicAction.email_address__verify:
            return _email_address__verify()
        case NotificationTopicAction.event__create_any:
            return _event__create_any(data, user)
        case NotificationTopicAction.event__create_approved:
            return _event__create_approved(data, user)
        case NotificationTopicAction.event__update:
            return _event__update(data)
        case NotificationTopicAction.event__invite_organizer:
            return _event__invite_organizer(data)
        case NotificationTopicAction.event__comment:
            return _event__comment(data)
        case NotificationTopicAction.event__reminder:
            return _event__reminder(data, user)
        case NotificationTopicAction.event__cancel:
            return _event__cancel(data)
        case NotificationTopicAction.event__delete:
            return _event__delete(data)
        case NotificationTopicAction.friend_request__create:
            return _friend_request__create(data)
        case NotificationTopicAction.friend_request__accept:
            return _friend_request__accept(data)
        case NotificationTopicAction.gender__change:
            return _gender__change(data)
        case NotificationTopicAction.general__new_blog_post:
            return _general__new_blog_post(data)
        case NotificationTopicAction.host_request__create:
            return _host_request__create(data, user)
        case NotificationTopicAction.host_request__message:
            return _host_request__message(data, user)
        case NotificationTopicAction.host_request__missed_messages:
            return _host_request__missed_messages(data)
        case NotificationTopicAction.host_request__reminder:
            return _host_request__reminder(data)
        case NotificationTopicAction.host_request__accept:
            return _host_request__accept(data, user)
        case NotificationTopicAction.host_request__reject:
            return _host_request__reject(data, user)
        case NotificationTopicAction.host_request__cancel:
            return _host_request__cancel(data, user)
        case NotificationTopicAction.host_request__confirm:
            return _host_request__confirm(data, user)
        case NotificationTopicAction.modnote__create:
            return _modnote__create()
        case NotificationTopicAction.onboarding__reminder:
            return _onboarding__reminder(notification.key, user)
        case NotificationTopicAction.password__change:
            return _password__change()
        case NotificationTopicAction.password_reset__start:
            return _password_reset__start(data)
        case NotificationTopicAction.password_reset__complete:
            return _password_reset__complete()
        case NotificationTopicAction.phone_number__change:
            return _phone_number__change(data)
        case NotificationTopicAction.phone_number__verify:
            return _phone_number__verify(data)
        case NotificationTopicAction.postal_verification__postcard_sent:
            return _postal_verification__postcard_sent(data)
        case NotificationTopicAction.postal_verification__success:
            return _postal_verification__success()
        case NotificationTopicAction.postal_verification__failed:
            return _postal_verification__failed(data)
        case NotificationTopicAction.reference__receive_friend:
            return _reference__receive_friend(data)
        case NotificationTopicAction.reference__receive_hosted:
            return _reference__receive_hosted(data)
        case NotificationTopicAction.reference__receive_surfed:
            return _reference__receive_surfed(data)
        case NotificationTopicAction.reference__reminder_hosted:
            return _reference__reminder_hosted(data)
        case NotificationTopicAction.reference__reminder_surfed:
            return _reference__reminder_surfed(data)
        case NotificationTopicAction.thread__reply:
            return _thread__reply(data)
        case NotificationTopicAction.verification__sv_success:
            return _verification__sv_success()
        case NotificationTopicAction.verification__sv_fail:
            return _verification__sv_fail(data)
        case _:
            # Enables mypy's exhaustiveness checking for the cases above.
            assert_never(notification.topic_action)


def _avatar_url_or_default(user: api_pb2.User) -> str:
    return user.avatar_thumbnail_url or urls.icon_url()


def _account_deletion__start(data: notification_data_pb2.AccountDeletionStart) -> PushNotificationContent:
    return PushNotificationContent(
        title="Account deletion requested",
        ios_title="Account Deletion Requested",
        body="Use the link we emailed you to confirm.",
    )


def _account_deletion__complete(data: notification_data_pb2.AccountDeletionComplete) -> PushNotificationContent:
    return PushNotificationContent(
        title="Account deleted",
        ios_title="Acccount Deleted",
        body=f"You can restore it within {data.undelete_days} days using the link we emailed you.",
    )


def _account_deletion__recovered() -> PushNotificationContent:
    return PushNotificationContent(
        title="Account restored",
        ios_title="Account Restored",
        body="Welcome back!",
    )


def _activeness__probe(data: notification_data_pb2.ActivenessProbe) -> PushNotificationContent:
    return PushNotificationContent(
        title="Still open to hosting?",
        ios_title="Still Open to Hosting?",
        body="Log in to confirm your hosting status.",
    )


def _api_key__create(data: notification_data_pb2.ApiKeyCreate) -> PushNotificationContent:
    return PushNotificationContent(
        title="API key created",
        ios_title="API Key Created",
        body="Details were sent to you via email.",
    )


def _badge__add(data: notification_data_pb2.BadgeAdd) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"New profile badge: {data.badge_name}",
        ios_title="New Profile Badge",
        body=f"The {data.badge_name} badge was added to your profile.",
        action_url=urls.profile_link(),
    )


def _badge__remove(data: notification_data_pb2.BadgeRemove) -> PushNotificationContent:
    return PushNotificationContent(
        title="Profile badge removed",
        ios_title="Profile Badge Removed",
        body=f"The {data.badge_name} badge was removed from your profile.",
        action_url=urls.profile_link(),
    )


def _birthdate__change(data: notification_data_pb2.BirthdateChange, user: User) -> PushNotificationContent:
    birth_date = localize_date_from_iso(data.birthdate, user.ui_language_preference or "en")
    return PushNotificationContent(
        title="Birthdate changed",
        ios_title="Birthdate Changed",
        body=f"An admin changed your date of birth to {birth_date}.",
        action_url=urls.account_settings_link(),
    )


def _chat__message(data: notification_data_pb2.ChatMessage) -> PushNotificationContent:
    return PushNotificationContent(
        title=data.author.name,
        ios_title=data.author.name,
        body=data.text,
        icon_url=_avatar_url_or_default(data.author),
        action_url=urls.chat_link(chat_id=data.group_chat_id),
    )


def _chat__missed_messages(data: notification_data_pb2.ChatMissedMessages) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{len(data.messages)} missed messages",
        ios_title=f"{len(data.messages)} missed messages",
        body="You have new unseen messages.",
        action_url=urls.messages_link(),
    )


def _donation__received(data: notification_data_pb2.DonationReceived) -> PushNotificationContent:
    return PushNotificationContent(
        title="Donation Received",
        ios_title="Donation Received",
        body=f"Thank you so much for your donation of ${data.amount}!",
        action_url=data.receipt_url,
    )


def _discussion__create(data: notification_data_pb2.DiscussionCreate) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"New discussion: {data.discussion.title}",
        ios_title="New Discussion",
        ios_subtitle=data.discussion.title,
        body=f"{data.author.name} started the discussion in {data.discussion.owner_title}.",
        icon_url=_avatar_url_or_default(data.author),
        action_url=urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug),
    )


def _discussion__comment(data: notification_data_pb2.DiscussionComment) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.author.name} • {data.discussion.title}",
        ios_title=data.author.name,
        ios_subtitle=data.discussion.title,
        body=data.reply.content,
        icon_url=_avatar_url_or_default(data.author),
        action_url=urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug),
    )


def _email_address__change(data: notification_data_pb2.EmailAddressChange) -> PushNotificationContent:
    return PushNotificationContent(
        title="Email change requested",
        ios_title="Email Change Requested",
        body=f"Use the link we sent to {data.new_email} to confirm your new address.",
        action_url=urls.account_settings_link(),
    )


def _email_address__verify() -> PushNotificationContent:
    return PushNotificationContent(
        title="Email verified",
        ios_title="Email Verified",
        body="Your new email address has been verified.",
        action_url=urls.account_settings_link(),
    )


def _event__create_any(data: notification_data_pb2.EventCreate, user: User) -> PushNotificationContent:
    datetime_display = localize_datetime_for_user(data.event.start_time, user)
    return PushNotificationContent(
        title=f"New Event: {data.event.title}",
        ios_title="New Event",
        ios_subtitle=data.event.title,
        body=f"{data.inviting_user.name} created the event on {datetime_display}.",
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__create_approved(data: notification_data_pb2.EventCreate, user: User) -> PushNotificationContent:
    datetime_display = localize_datetime_for_user(data.event.start_time, user)
    return PushNotificationContent(
        title=f"New Event: {data.event.title}",
        ios_title="New Event",
        ios_subtitle=data.event.title,
        body=f"{data.inviting_user.name} invited you to the event on {datetime_display}.",
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__update(data: notification_data_pb2.EventUpdate) -> PushNotificationContent:
    # updated_items can include: title, content, start_time, end_time, location,
    # but a list like that is tricky to localize.
    return PushNotificationContent(
        title=f"Event updated: {data.event.title}",
        ios_title="Event Updated",
        ios_subtitle=data.event.title,
        body=f"{data.updating_user.name} updated the event.",
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__invite_organizer(data: notification_data_pb2.EventInviteOrganizer) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"Event updated: {data.event.title}",
        ios_title="Event Updated",
        ios_subtitle=data.event.title,
        body=f"{data.inviting_user.name} added you as an event co-organizer.",
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__comment(data: notification_data_pb2.EventComment) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.author.name} • {data.event.title}",
        ios_title=data.author.name,
        ios_subtitle=f"Commented on {data.event.title}",
        body=data.reply.content,
        icon_url=_avatar_url_or_default(data.author),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__reminder(data: notification_data_pb2.EventReminder, user: User) -> PushNotificationContent:
    time_display = localize_datetime_for_user(data.event.start_time, user)
    return PushNotificationContent(
        title=f"Upcoming event: {data.event.title}",
        ios_title="Upcoming Event",
        ios_subtitle=data.event.title,
        body=f"The event starts at {time_display}.",
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__cancel(data: notification_data_pb2.EventCancel) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"Event cancelled: {data.event.title}",
        ios_title="Event Cancelled",
        ios_subtitle=data.event.title,
        body=f"{data.cancelling_user.name} cancelled the event.",
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__delete(data: notification_data_pb2.EventDelete) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"Event deleted: {data.event.title}",
        ios_title="Event Deleted",
        ios_subtitle=data.event.title,
        body="A moderator deleted the event.",
    )


def _friend_request__create(data: notification_data_pb2.FriendRequestCreate) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"Friend request from {data.other_user.name}",
        ios_title=data.other_user.name,
        ios_subtitle="Friend Request",
        body=f"{data.other_user.name} wants to be your friend.",
        icon_url=_avatar_url_or_default(data.other_user),
        action_url=urls.friend_requests_link(),
    )


def _friend_request__accept(data: notification_data_pb2.FriendRequestAccept) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.other_user.name} accepted your friend request",
        ios_title=data.other_user.name,
        ios_subtitle="Accepted Your Friend Request",
        body=f"You are now friends with {data.other_user.name}.",
        icon_url=_avatar_url_or_default(data.other_user),
        action_url=urls.user_link(username=data.other_user.username),
    )


def _gender__change(data: notification_data_pb2.GenderChange) -> PushNotificationContent:
    return PushNotificationContent(
        title="Gender changed",
        ios_title="Gender Changed",
        body=f"An admin changed your gender to {data.gender}.",
        action_url=urls.account_settings_link(),
    )


def _general__new_blog_post(data: notification_data_pb2.GeneralNewBlogPost) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"New blog post: {data.title}",
        ios_title="New Blog Post",
        ios_subtitle=data.title,
        body=data.blurb,
        action_url=data.url,
    )


def _host_request__create(data: notification_data_pb2.HostRequestCreate, user: User) -> PushNotificationContent:
    from_date = localize_date_from_iso(data.host_request.from_date, user.ui_language_preference or "en")
    days = (date.fromisoformat(data.host_request.to_date) - date.fromisoformat(data.host_request.from_date)).days + 1
    return PushNotificationContent(
        title=f"New host request from {data.surfer.name}",
        ios_title=data.surfer.name,
        ios_subtitle="New Host Request",
        body=f"{data.surfer.name} wants to stay from {from_date} for {days} days.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=_avatar_url_or_default(data.surfer),
    )


def _host_request__message(data: notification_data_pb2.HostRequestMessage, user: User) -> PushNotificationContent:
    return PushNotificationContent(
        title=data.user.name,
        ios_title=data.user.name,
        body=data.text,
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=_avatar_url_or_default(data.user),
    )


def _host_request__missed_messages(data: notification_data_pb2.HostRequestMissedMessages) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"New messages from {data.user.name}",
        ios_title=data.user.name,
        ios_subtitle="Missed Messages",
        body=f"You have new unseen messages from {data.user.name}.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=_avatar_url_or_default(data.user),
    )


def _host_request__reminder(data: notification_data_pb2.HostRequestReminder) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"Pending request by {data.surfer.name}",
        ios_title="Host Request Pending",
        ios_subtitle=data.surfer.name,
        body=f"{data.surfer.name} is waiting for your response, please accept or decline the request.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=_avatar_url_or_default(data.surfer),
    )


def _host_request__accept(data: notification_data_pb2.HostRequestAccept, user: User) -> PushNotificationContent:
    date = localize_date_from_iso(data.host_request.from_date, user.ui_language_preference or "en")
    return PushNotificationContent(
        title=f"{data.host.name} accepted your request",
        ios_title=data.host.name,
        ios_subtitle="Host Request Accepted",
        body=f"{data.host.name} accepted your host request for {date}.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=_avatar_url_or_default(data.host),
    )


def _host_request__reject(data: notification_data_pb2.HostRequestReject, user: User) -> PushNotificationContent:
    date = localize_date_from_iso(data.host_request.from_date, user.ui_language_preference or "en")
    return PushNotificationContent(
        title=f"{data.host.name} declined your request",
        ios_title=data.host.name,
        ios_subtitle="Host Request Declined",
        body=f"{data.host.name} declined your host request for {date}.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=_avatar_url_or_default(data.host),
    )


def _host_request__cancel(data: notification_data_pb2.HostRequestCancel, user: User) -> PushNotificationContent:
    date = localize_date_from_iso(data.host_request.from_date, user.ui_language_preference or "en")
    return PushNotificationContent(
        title=f"{data.surfer.name} cancelled their request",
        ios_title=data.surfer.name,
        ios_subtitle="Host Request Cancelled",
        body=f"{data.surfer.name} cancelled their host request for {date}.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=_avatar_url_or_default(data.surfer),
    )


def _host_request__confirm(data: notification_data_pb2.HostRequestConfirm, user: User) -> PushNotificationContent:
    date = localize_date_from_iso(data.host_request.from_date, user.ui_language_preference or "en")
    return PushNotificationContent(
        title=f"{data.surfer.name} confirmed their host request",
        ios_title=data.surfer.name,
        ios_subtitle="Host Request Confirmed",
        body=f"{data.surfer.name} confirmed their host request for {date}.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=_avatar_url_or_default(data.surfer),
    )


def _modnote__create() -> PushNotificationContent:
    return PushNotificationContent(
        title="New moderator note",
        ios_title="New Moderator Note",
        body="You received a moderator note. Read and acknowledge it to continue using the platform.",
    )


def _onboarding__reminder(key: str, user: User) -> PushNotificationContent:
    if key == "1":
        return PushNotificationContent(
            title="Welcome to Couchers!",
            ios_title="Welcome to Couchers!",
            body="Please complete your profile with a picture and a bit of text about yourself.",
            action_url=urls.edit_profile_link(),
        )
    elif key == "2":
        return PushNotificationContent(
            title="Remember to complete your profile",
            ios_title="Profile Reminder",
            body="Please complete your profile with a picture and a bit of text about yourself.",
            action_url=urls.edit_profile_link(),
        )
    else:
        raise NotImplementedError(f"Unknown onboarding reminder key: {key}")


def _password__change() -> PushNotificationContent:
    return PushNotificationContent(
        title="Password changed",
        ios_title="Password Changed",
        body="Your password was changed.",
        action_url=urls.account_settings_link(),
    )


def _password_reset__start(data: notification_data_pb2.PasswordResetStart) -> PushNotificationContent:
    return PushNotificationContent(
        title="Password reset requested",
        ios_title="Password Reset Requested",
        body="Use the link we sent by email to complete it.",
        action_url=urls.account_settings_link(),
    )


def _password_reset__complete() -> PushNotificationContent:
    return PushNotificationContent(
        title="Password reset",
        ios_title="Password Reset",
        body="Your password was successfully reset.",
        action_url=urls.account_settings_link(),
    )


def _phone_number__change(data: notification_data_pb2.PhoneNumberChange) -> PushNotificationContent:
    return PushNotificationContent(
        title="Phone verification started",
        ios_title="Phone Verification Started",
        body=f"You started phone number verification with the number {format_phone_number(data.phone)}.",
        action_url=urls.feature_preview_link(),
    )


def _phone_number__verify(data: notification_data_pb2.PhoneNumberVerify) -> PushNotificationContent:
    return PushNotificationContent(
        title="Phone verification completed",
        ios_title="Phone Verification completed",
        body=f"Your phone number was successfully verified as {format_phone_number(data.phone)}.",
        action_url=urls.feature_preview_link(),
    )


def _postal_verification__postcard_sent(
    data: notification_data_pb2.PostalVerificationPostcardSent,
) -> PushNotificationContent:
    return PushNotificationContent(
        title="Postal verification started",
        ios_title="Postal Verification Started",
        body=f"Your postcard is on its way to {data.city}, {data.country}. Expect it within 1-3 weeks.",
        action_url=urls.account_settings_link(),
    )


def _postal_verification__success() -> PushNotificationContent:
    return PushNotificationContent(
        title="Postal verification completed",
        ios_title="Postal Verification Completed",
        body="Your address is now verified.",
        action_url=urls.account_settings_link(),
    )


def _postal_verification__failed(data: notification_data_pb2.PostalVerificationFailed) -> PushNotificationContent:
    if data.reason == notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED:
        body = "Your verification code has expired. Codes are valid for 90 days after the postcard is sent. You can request a new postcard."
    elif data.reason == notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_TOO_MANY_ATTEMPTS:
        body = "Too many incorrect code attempts. You can request a new postcard."
    else:
        body = "Your postal verification attempt has failed. You can request a new postcard."
    return PushNotificationContent(
        title="Postal verification failed",
        ios_title="Postal Verification Failed",
        body=body,
        action_url=urls.account_settings_link(),
    )


def _reference__receive_friend(data: notification_data_pb2.ReferenceReceiveFriend) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"New friend reference from {data.from_user.name}",
        ios_title=data.from_user.name,
        ios_subtitle="New Friend Reference",
        body=data.text,
        icon_url=_avatar_url_or_default(data.from_user),
        action_url=urls.profile_references_link(),
    )


def _reference__receive(
    data: notification_data_pb2.ReferenceReceiveHostRequest, reference_type: str
) -> PushNotificationContent:
    if data.text:
        body = data.text
        action_url = urls.profile_references_link()
    else:
        body = f"{data.from_user.name} left you a reference, now it's your turn to write theirs!"
        action_url = urls.leave_reference_link(
            reference_type=reference_type,
            to_user_id=data.from_user.user_id,
            host_request_id=str(data.host_request_id),
        )
    return PushNotificationContent(
        title=f"New reference from {data.from_user.name}",
        ios_title=data.from_user.name,
        ios_subtitle="New Reference",
        body=body,
        icon_url=_avatar_url_or_default(data.from_user),
        action_url=action_url,
    )


def _reference__receive_hosted(data: notification_data_pb2.ReferenceReceiveHostRequest) -> PushNotificationContent:
    # I surfed with them if I received a "hosted" request
    return _reference__receive(data, reference_type="surfed")


def _reference__receive_surfed(data: notification_data_pb2.ReferenceReceiveHostRequest) -> PushNotificationContent:
    return _reference__receive(data, reference_type="hosted")


def _reference__reminder(data: notification_data_pb2.ReferenceReminder, reference_type: str) -> PushNotificationContent:
    leave_reference_link = urls.leave_reference_link(
        reference_type=reference_type,
        to_user_id=data.other_user.user_id,
        host_request_id=str(data.host_request_id),
    )
    return PushNotificationContent(
        title=f"Write your reference for {data.other_user.name}",
        ios_title="Write Your Reference",
        ios_subtitle=data.other_user.name,
        body=f"You still have {data.days_left} days to write a reference for {data.other_user.name}.",
        icon_url=_avatar_url_or_default(data.other_user),
        action_url=leave_reference_link,
    )


def _reference__reminder_surfed(data: notification_data_pb2.ReferenceReminder) -> PushNotificationContent:
    # I surfed with them if I get a surfed reminder
    return _reference__reminder(data, reference_type="surfed")


def _reference__reminder_hosted(data: notification_data_pb2.ReferenceReminder) -> PushNotificationContent:
    return _reference__reminder(data, reference_type="hosted")


def _thread__reply(data: notification_data_pb2.ThreadReply) -> PushNotificationContent:
    parent = data.WhichOneof("reply_parent")
    parent_title: str
    if parent == "event":
        parent_title = data.event.title
        view_link = urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug)
    elif parent == "discussion":
        parent_title = data.discussion.title
        view_link = urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug)
    else:
        raise Exception("Can only do replies to events and discussions")

    return PushNotificationContent(
        title=f"{data.author.name} • {parent_title}",
        ios_title=data.author.name,
        ios_subtitle=parent_title,
        body=data.reply.content,
        icon_url=_avatar_url_or_default(data.author),
        action_url=view_link,
    )


def _verification__sv_success() -> PushNotificationContent:
    return PushNotificationContent(
        title="Strong Verification completed",
        ios_title="Strong Verification Completed",
        body="You have been verified with Strong Verification.",
        action_url=urls.account_settings_link(),
    )


def _verification__sv_fail(data: notification_data_pb2.VerificationSVFail) -> PushNotificationContent:
    if data.reason == notification_data_pb2.SV_FAIL_REASON_WRONG_BIRTHDATE_OR_GENDER:
        reason_message = "The date of birth or gender on your profile does not match the date of birth or sex on your passport. Please contact the support team to update your date of birth or gender, or if your passport sex does not match your gender identity."
    elif data.reason == notification_data_pb2.SV_FAIL_REASON_NOT_A_PASSPORT:
        reason_message = (
            "You used a document other than a passport. You can only use a passport for Strong Verification."
        )
    elif data.reason == notification_data_pb2.SV_FAIL_REASON_DUPLICATE:
        reason_message = "You used a passport that has already been used for verification. Please use another passport."
    else:
        raise Exception("Shouldn't get here")
    return PushNotificationContent(
        title="Strong Verification failed",
        ios_title="Strong Verification Failed",
        body=reason_message,
        action_url=urls.account_settings_link(),
    )
