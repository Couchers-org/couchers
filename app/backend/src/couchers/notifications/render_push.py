"""
Renders a Notification model into a localized push notification.
"""

import logging
from typing import Any, assert_never

from couchers import urls
from couchers.i18n.i18n import format_phone_number, localize_date_from_iso, localize_datetime_for_user
from couchers.models import Notification, NotificationTopicAction, User
from couchers.notifications.push import PushNotificationContent
from couchers.proto import events_pb2, notification_data_pb2
from couchers.templates.v2 import v2avatar, v2esc

logger = logging.getLogger(__name__)

# Best practices for push notification strings (Android/iOS lowest common denominator):
# Title:
#   - Describe the event, e.g. "Payment Successful"
#   - <= 30 chars (Android), most important info in first 20 chars
#   - Title-style capitalization, no ending punctuation
# Body:
#   - <= 80 chars (Android), first 40 visible when collapsed
#   - Sentence-style capitalization with punctuation


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
            return _chat__missed_messages()
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
            return _event__update(data, user)
        case NotificationTopicAction.event__invite_organizer:
            return _event__invite_organizer(data, user)
        case NotificationTopicAction.event__comment:
            return _event__comment(data, user)
        case NotificationTopicAction.event__reminder:
            return _event__reminder(data, user)
        case NotificationTopicAction.event__cancel:
            return _event__cancel(data, user)
        case NotificationTopicAction.event__delete:
            return _event__delete(data, user)
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
            return _host_request__accept(data)
        case NotificationTopicAction.host_request__reject:
            return _host_request__reject(data)
        case NotificationTopicAction.host_request__cancel:
            return _host_request__cancel(data)
        case NotificationTopicAction.host_request__confirm:
            return _host_request__confirm(data)
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


def _account_deletion__start(data: notification_data_pb2.AccountDeletionStart) -> PushNotificationContent:
    return PushNotificationContent(
        title="Account deletion initiated",
        body="Someone initiated the deletion of your Couchers.org account. To delete your account, please follow the link in the email we sent you.",
    )


def _account_deletion__complete(data: notification_data_pb2.AccountDeletionComplete) -> PushNotificationContent:
    return PushNotificationContent(
        title="Your Couchers.org account has been deleted",
        body=f"You can still undo this by following the link we emailed to you within {data.undelete_days} days.",
    )


def _account_deletion__recovered() -> PushNotificationContent:
    return PushNotificationContent(
        title="Your Couchers.org account has been recovered!",
        body="We have recovered your Couchers.org account as per your request! Welcome back!",
    )


def _activeness__probe(data: notification_data_pb2.ActivenessProbe) -> PushNotificationContent:
    return PushNotificationContent(
        title="Are you still open to hosting on Couchers.org?",
        body="Please log in to confirm your hosting status.",
    )


def _api_key__create(data: notification_data_pb2.ApiKeyCreate) -> PushNotificationContent:
    return PushNotificationContent(
        title="An API key was created for your account",
        body="Details were sent to you via email.",
        action_url=urls.app_link(),
    )


def _badge__add(data: notification_data_pb2.BadgeAdd) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"The {data.badge_name} badge was added to your profile",
        body="Check out your profile to see the new badge!",
        action_url=urls.profile_link(),
    )


def _badge__remove(data: notification_data_pb2.BadgeRemove) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"The {data.badge_name} badge was removed from your profile",
        body="You can see all your badges on your profile.",
        action_url=urls.profile_link(),
    )


def _birthdate__change(data: notification_data_pb2.BirthdateChange, user: User) -> PushNotificationContent:
    birth_date = localize_date_from_iso(data.birthdate, user.ui_language_preference or "en")
    return PushNotificationContent(
        title="Your date of birth was changed",
        body=f"Your date of birth on Couchers.org was changed to {birth_date} by an admin.",
        action_url=urls.account_settings_link(),
    )


def _chat__message(data: notification_data_pb2.ChatMessage) -> PushNotificationContent:
    return PushNotificationContent(
        title=data.message,
        body=data.text,
        icon_url=v2avatar(data.author),
        action_url=urls.chat_link(chat_id=data.group_chat_id),
    )


def _chat__missed_messages() -> PushNotificationContent:
    return PushNotificationContent(
        title="You have unseen messages on Couchers.org",
        body="Please check out any messages you missed.",
        action_url=urls.messages_link(),
    )


def _donation__received(data: notification_data_pb2.DonationReceived) -> PushNotificationContent:
    return PushNotificationContent(
        title="Thank you for your donation to Couchers.org!",
        body=f"Thank you so much for your donation of ${data.amount} to Couchers.org.",
        action_url=data.receipt_url,
    )


def _discussion__create(data: notification_data_pb2.DiscussionCreate) -> PushNotificationContent:
    return PushNotificationContent(
        title=data.discussion.title,
        body=f"{data.author.name} created a discussion in {data.discussion.owner_title}: {data.discussion.title}\n\n{data.discussion.content}",
        icon_url=v2avatar(data.author),
        action_url=urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug),
    )


def _discussion__comment(data: notification_data_pb2.DiscussionComment) -> PushNotificationContent:
    return PushNotificationContent(
        title=data.discussion.title,
        body=f"{data.author.name} commented:\n\n{data.reply.content}",
        icon_url=v2avatar(data.author),
        action_url=urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug),
    )


def _email_address__change(data: notification_data_pb2.EmailAddressChange) -> PushNotificationContent:
    return PushNotificationContent(
        title="An email change was initiated on your account",
        body=f"An email change to the email {data.new_email} was initiated on your account.",
        action_url=urls.account_settings_link(),
    )


def _email_address__verify() -> PushNotificationContent:
    return PushNotificationContent(
        title="Email change completed",
        body="Your new email address has been verified.",
        action_url=urls.account_settings_link(),
    )


def _get_event_time_display(event: events_pb2.Event, user: User) -> str:
    start_time = localize_datetime_for_user(event.start_time, user)
    end_time = localize_datetime_for_user(event.end_time, user)
    return f"{start_time} - {end_time}"


def _event__create_any(data: notification_data_pb2.EventCreate, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'{data.inviting_user.name} created an event called "{data.event.title}"',
        body=f"{time_display}\nCreated by {data.inviting_user.name}\n\n{data.event.content}",
        icon_url=v2avatar(data.inviting_user),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__create_approved(data: notification_data_pb2.EventCreate, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'{data.inviting_user.name} invited you to "{data.event.title}"',
        body=f"{time_display}\nInvited by {data.inviting_user.name}\n\n{data.event.content}",
        icon_url=v2avatar(data.inviting_user),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__update(data: notification_data_pb2.EventUpdate, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    updated_text = ", ".join(data.updated_items)
    return PushNotificationContent(
        title=f'{data.updating_user.name} updated "{data.event.title}"',
        body=f"{time_display}\n{data.updating_user.name} updated: {updated_text}\n\n{data.event.content}",
        icon_url=v2avatar(data.updating_user),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__invite_organizer(data: notification_data_pb2.EventInviteOrganizer, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'{data.inviting_user.name} invited you to co-organize "{data.event.title}"',
        body=f"{time_display}\nInvited to co-organize by {data.inviting_user.name}\n\n{data.event.content}",
        icon_url=v2avatar(data.inviting_user),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__comment(data: notification_data_pb2.EventComment, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'{data.author.name} commented on "{data.event.title}"',
        body=f"{time_display}\n{data.author.name} commented:\n\n{data.reply.content}",
        icon_url=v2avatar(data.author),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__reminder(data: notification_data_pb2.EventReminder, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'"{data.event.title}" starts soon',
        body=f"Don't forget your upcoming event on Couchers.org\n{time_display}\n{data.event.content}",
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__cancel(data: notification_data_pb2.EventCancel, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'{data.cancelling_user.name} cancelled "{data.event.title}"',
        body=f"{time_display}\nThe event has been cancelled by {data.cancelling_user.name}.\n\n{data.event.content}",
        icon_url=v2avatar(data.cancelling_user),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


def _event__delete(data: notification_data_pb2.EventDelete, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'A moderator deleted "{data.event.title}"',
        body=f"{time_display}\nThe event has been deleted by the moderators.",
    )


def _friend_request__create(data: notification_data_pb2.FriendRequestCreate) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.other_user.name} wants to be your friend",
        body=f"You've received a friend request from {data.other_user.name}",
        icon_url=v2avatar(data.other_user),
        action_url=urls.friend_requests_link(),
    )


def _friend_request__accept(data: notification_data_pb2.FriendRequestAccept) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.other_user.name} accepted your friend request!",
        body=f"{v2esc(data.other_user.name)} has accepted your friend request",
        icon_url=v2avatar(data.other_user),
        action_url=urls.user_link(username=data.other_user.username),
    )


def _gender__change(data: notification_data_pb2.GenderChange) -> PushNotificationContent:
    return PushNotificationContent(
        title="Your gender was changed",
        body=f"Your gender on Couchers.org was changed to {data.gender} by an admin.",
        action_url=urls.account_settings_link(),
    )


def _general__new_blog_post(data: notification_data_pb2.GeneralNewBlogPost) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"New blog post: {data.title}",
        body=data.blurb,
        action_url=data.url,
    )


def _host_request__create(data: notification_data_pb2.HostRequestCreate, user: User) -> PushNotificationContent:
    from_date = localize_date_from_iso(data.host_request.from_date, user.ui_language_preference or "en")
    to_date = localize_date_from_iso(data.host_request.to_date, user.ui_language_preference or "en")
    return PushNotificationContent(
        title=f"{data.surfer.name} sent you a host request",
        body=f"Dates: {from_date} to {to_date}.\n\n{data.text}",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.surfer),
    )


def _host_request__message(data: notification_data_pb2.HostRequestMessage, user: User) -> PushNotificationContent:
    if data.am_host:
        title = f"{data.user.name} sent you a message in their host request"
    else:
        title = f"{data.user.name} sent you a message in your host request"
    from_date = localize_date_from_iso(data.host_request.from_date, user.ui_language_preference or "en")
    to_date = localize_date_from_iso(data.host_request.to_date, user.ui_language_preference or "en")
    return PushNotificationContent(
        title=title,
        body=f"Dates: {from_date} to {to_date}.\n\n{data.text}",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.user),
    )


def _host_request__missed_messages(data: notification_data_pb2.HostRequestMissedMessages) -> PushNotificationContent:
    their_your = "their" if data.am_host else "your"
    return PushNotificationContent(
        title=f"{data.user.name} sent you message(s) in {their_your} host request",
        body="Check the app for more info.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.user),
    )


def _host_request__reminder(data: notification_data_pb2.HostRequestReminder) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"You have a pending host request from {data.surfer.name}!",
        body="Please respond to the request!",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.surfer),
    )


def _host_request__accept(data: notification_data_pb2.HostRequestAccept) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.host.name} accepted your host request",
        body="Check the app for more info.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.host),
    )


def _host_request__reject(data: notification_data_pb2.HostRequestReject) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.host.name} rejected your host request",
        body="Check the app for more info.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.host),
    )


def _host_request__cancel(data: notification_data_pb2.HostRequestCancel) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.surfer.name} cancelled their host request",
        body="Check the app for more info.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.surfer),
    )


def _host_request__confirm(data: notification_data_pb2.HostRequestConfirm) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.surfer.name} confirmed their host request",
        body="Check the app for more info.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.surfer),
    )


def _modnote__create() -> PushNotificationContent:
    return PushNotificationContent(
        title="You received a mod note",
        body="You need to read and acknowledge the note before continuing to use the platform.",
    )


def _onboarding__reminder(key: str, user: User) -> PushNotificationContent:
    if key == "1":
        return PushNotificationContent(
            title="Welcome to Couchers.org and the future of couch surfing",
            body=f"Hi {v2esc(user.name)}! We are excited that you have joined us! Please take a moment to complete your profile with a picture and a bit of text about yourself!",
            action_url=urls.edit_profile_link(),
        )
    elif key == "2":
        return PushNotificationContent(
            title="Please complete your profile on Couchers.org!",
            body=f"Hi {v2esc(user.name)}! We would ask one big favour of you: please fill out your profile by adding a photo and some text.",
            action_url=urls.edit_profile_link(),
        )
    else:
        raise NotImplementedError(f"Unknown onboarding reminder key: {key}")


def _password__change() -> PushNotificationContent:
    return PushNotificationContent(
        title="Your password was changed",
        body="Your login password for Couchers.org was changed.",
        action_url=urls.account_settings_link(),
    )


def _password_reset__start(data: notification_data_pb2.PasswordResetStart) -> PushNotificationContent:
    return PushNotificationContent(
        title="A password reset was initiated on your account",
        body="Someone initiated a password change on your account.",
        action_url=urls.account_settings_link(),
    )


def _password_reset__complete() -> PushNotificationContent:
    return PushNotificationContent(
        title="Your password was successfully reset",
        body="Your password on Couchers.org was changed. If that was you, then no further action is needed.",
        action_url=urls.account_settings_link(),
    )


def _phone_number__change(data: notification_data_pb2.PhoneNumberChange) -> PushNotificationContent:
    return PushNotificationContent(
        title="Phone verification started",
        body=f"You started phone number verification with the number {format_phone_number(data.phone)}.",
        action_url=urls.feature_preview_link(),
    )


def _phone_number__verify(data: notification_data_pb2.PhoneNumberVerify) -> PushNotificationContent:
    return PushNotificationContent(
        title="Phone successfully verified",
        body=f"Your phone was successfully verified as {format_phone_number(data.phone)} on Couchers.org.",
        action_url=urls.feature_preview_link(),
    )


def _postal_verification__postcard_sent(
    data: notification_data_pb2.PostalVerificationPostcardSent,
) -> PushNotificationContent:
    return PushNotificationContent(
        title="Your verification postcard is on its way",
        body=f"Postcard sent to {data.city}, {data.country}. Expect it within 1-3 weeks.",
        action_url=urls.account_settings_link(),
    )


def _postal_verification__success() -> PushNotificationContent:
    return PushNotificationContent(
        title="Postal Verification succeeded",
        body="You have been verified with Postal Verification! Your address has been confirmed.",
        action_url=urls.account_settings_link(),
    )


def _postal_verification__failed(data: notification_data_pb2.PostalVerificationFailed) -> PushNotificationContent:
    if data.reason == notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED:
        reason_message = "Your verification code has expired. Codes are valid for 90 days after the postcard is sent. You can start a new verification attempt."
    elif data.reason == notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_TOO_MANY_ATTEMPTS:
        reason_message = "Too many incorrect code attempts. You can start a new verification attempt."
    else:
        reason_message = "Your postal verification attempt has failed. You can start a new verification attempt."
    return PushNotificationContent(
        title="Postal Verification failed",
        body=reason_message,
        action_url=urls.account_settings_link(),
    )


def _reference__receive_friend(data: notification_data_pb2.ReferenceReceiveFriend) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"You've received a friend reference from {data.from_user.name}!",
        body=data.text,
        icon_url=v2avatar(data.from_user),
        action_url=urls.profile_references_link(),
    )


def _reference__receive(
    data: notification_data_pb2.ReferenceReceiveHostRequest, reference_type: str
) -> PushNotificationContent:
    if data.text:
        body = v2esc(data.text)
        action_url = urls.profile_references_link()
    else:
        body = (
            "Please go and write a reference for them too. It's a nice gesture and helps us build a community together!"
        )
        action_url = urls.leave_reference_link(
            reference_type=reference_type,
            to_user_id=data.from_user.user_id,
            host_request_id=str(data.host_request_id),
        )
    return PushNotificationContent(
        title=f"You've received a reference from {data.from_user.name}!",
        body=body,
        icon_url=v2avatar(data.from_user),
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
        title=f"You have {data.days_left} days to write a reference for {data.other_user.name}!",
        body="It's a nice gesture to write references and helps us build a community together! References will become visible 2 weeks after the stay, or when you've both written a reference for each other, whichever happens first.",
        icon_url=v2avatar(data.other_user),
        action_url=leave_reference_link,
    )


def _reference__reminder_surfed(data: notification_data_pb2.ReferenceReminder) -> PushNotificationContent:
    # I surfed with them if I get a surfed reminder
    return _reference__reminder(data, reference_type="surfed")


def _reference__reminder_hosted(data: notification_data_pb2.ReferenceReminder) -> PushNotificationContent:
    return _reference__reminder(data, reference_type="hosted")


def _thread__reply(data: notification_data_pb2.ThreadReply) -> PushNotificationContent:
    parent = data.WhichOneof("reply_parent")
    if parent == "event":
        title = data.event.title
        view_link = urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug)
    elif parent == "discussion":
        title = data.discussion.title
        view_link = urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug)
    else:
        raise Exception("Can only do replies to events and discussions")

    return PushNotificationContent(
        title=title,
        body=f"{data.author.name} replied:\n\n{data.reply.content}",
        icon_url=v2avatar(data.author),
        action_url=view_link,
    )


def _verification__sv_success() -> PushNotificationContent:
    return PushNotificationContent(
        title="Strong Verification succeeded",
        body="You have been verified with Strong Verification! You will now see a tick next to your name on the platform.",
        action_url=urls.account_settings_link(),
    )


def _verification__sv_fail(data: notification_data_pb2.VerificationSVFail) -> PushNotificationContent:
    if data.reason == notification_data_pb2.SV_FAIL_REASON_WRONG_BIRTHDATE_OR_GENDER:
        reason_message = "The date of birth or gender on your profile does not match the date of birth or sex on your passport. Please contact the support team to update your date of birth or gender, or if your passport sex does not match your gender identity."
    elif data.reason == notification_data_pb2.SV_FAIL_REASON_NOT_A_PASSPORT:
        reason_message = "You tried to verify with a document that is not a passport. You can only use a passport for Strong Verification."
    elif data.reason == notification_data_pb2.SV_FAIL_REASON_DUPLICATE:
        reason_message = "You tried to verify with a passport that has already been used for verification. Please use another passport."
    else:
        raise Exception("Shouldn't get here")
    return PushNotificationContent(
        title="Strong Verification failed",
        body=reason_message,
        action_url=urls.account_settings_link(),
    )
