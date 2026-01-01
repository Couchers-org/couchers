"""
Renders a Notification model into a localized push notification.
"""

import logging

from google.protobuf import empty_pb2

from couchers import urls
from couchers.models import Notification, User
from couchers.notifications.push import PushNotificationContent
from couchers.proto import events_pb2, notification_data_pb2
from couchers.templates.v2 import v2avatar, v2date, v2esc, v2phone, v2timestamp

logger = logging.getLogger(__name__)

# Best practices for push notification strings (Android/iOS lowest common denominator):
# Title:
#   Describe the event, e.g. "Payment Successful"
#   <= 30 chars (Android), most important info in first 20 chars
#   Title-style capitalization, no ending punctuation
# Body:
#   <= 80 chars (Android), first 40 visible when collapsed
#   Sentence-style capitalization with punctuation


# account_deletion:start
def _account_deletion_start(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="Account deletion initiated",
        body="Someone initiated the deletion of your Couchers.org account. To delete your account, please follow the link in the email we sent you.",
    )


# account_deletion:complete
def _account_deletion_complete(data: notification_data_pb2.AccountDeletionComplete) -> PushNotificationContent:
    return PushNotificationContent(
        title="Your Couchers.org account has been deleted",
        body=f"You can still undo this by following the link we emailed to you within {data.undelete_days} days.",
    )


# account_deletion:recovered
def _account_deletion_recovered(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="Your Couchers.org account has been recovered!",
        body="We have recovered your Couchers.org account as per your request! Welcome back!",
    )


# activeness:probe
def _activeness_probe(data: notification_data_pb2.ActivenessProbe) -> PushNotificationContent:
    return PushNotificationContent(
        title="Are you still open to hosting on Couchers.org?",
        body="Please log in to confirm your hosting status.",
    )


# address:change
def _address_change(data: notification_data_pb2.EmailAddressChange) -> PushNotificationContent:
    return PushNotificationContent(
        title="An email change was initiated on your account",
        body=f"An email change to the email {data.new_email} was initiated on your account.",
        action_url=urls.account_settings_link(),
    )


# address:verify
def _address_verify(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="Email change completed",
        body="Your new email address has been verified.",
        action_url=urls.account_settings_link(),
    )


# api_key:create
def _api_key_create(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="An API key was created for your account",
        body="Details were sent to you via email.",
        action_url=urls.app_link(),
    )


# badge:add
def _badge_add(data: notification_data_pb2.BadgeAdd) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"The {data.badge_name} badge was added to your profile",
        body="Check out your profile to see the new badge!",
        action_url=urls.profile_link(),
    )


# badge:remove
def _badge_remove(data: notification_data_pb2.BadgeRemove) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"The {data.badge_name} badge was removed from your profile",
        body="You can see all your badges on your profile.",
        action_url=urls.profile_link(),
    )


# birthdate:change
def _birthdate_change(data: notification_data_pb2.BirthdateChange, user: User) -> PushNotificationContent:
    return PushNotificationContent(
        title="Your date of birth was changed",
        body=f"Your date of birth on Couchers.org was changed to {v2date(data.birthdate, user)} by an admin.",
        action_url=urls.account_settings_link(),
    )


# chat:message
def _chat_message(data: notification_data_pb2.ChatMessage) -> PushNotificationContent:
    return PushNotificationContent(
        title=data.message,
        body=data.text,
        icon_url=v2avatar(data.author),
        action_url=urls.chat_link(chat_id=data.group_chat_id),
    )


# chat:missed_messages
def _chat_missed_messages(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="You have unseen messages on Couchers.org",
        body="Please check out any messages you missed.",
        action_url=urls.messages_link(),
    )


# donation:received
def _donation_received(data: notification_data_pb2.DonationReceived) -> PushNotificationContent:
    return PushNotificationContent(
        title="Thank you for your donation to Couchers.org!",
        body=f"Thank you so much for your donation of ${data.amount} to Couchers.org.",
        action_url=data.receipt_url,
    )


# discussion:create
def _discussion_create(data: notification_data_pb2.DiscussionCreate) -> PushNotificationContent:
    return PushNotificationContent(
        title=data.discussion.title,
        body=f"{data.author.name} created a discussion in {data.discussion.owner_title}: {data.discussion.title}\n\n{data.discussion.content}",
        icon_url=v2avatar(data.author),
        action_url=urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug),
    )


# discussion:comment
def _discussion_comment(data: notification_data_pb2.DiscussionComment) -> PushNotificationContent:
    return PushNotificationContent(
        title=data.discussion.title,
        body=f"{data.author.name} commented:\n\n{data.reply.content}",
        icon_url=v2avatar(data.author),
        action_url=urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug),
    )


def _get_event_time_display(event: events_pb2.Event, user: User) -> str:
    return f"{v2timestamp(event.start_time, user)} - {v2timestamp(event.end_time, user)}"


# event:create_any
def _event_create_any(data: notification_data_pb2.EventCreate, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'{data.inviting_user.name} created an event called "{data.event.title}"',
        body=f"{time_display}\nCreated by {data.inviting_user.name}\n\n{data.event.content}",
        icon_url=v2avatar(data.inviting_user),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


# event:create_approved
def _event_create_approved(data: notification_data_pb2.EventCreate, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'{data.inviting_user.name} invited you to "{data.event.title}"',
        body=f"{time_display}\nInvited by {data.inviting_user.name}\n\n{data.event.content}",
        icon_url=v2avatar(data.inviting_user),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


# event:update
def _event_update(data: notification_data_pb2.EventUpdate, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    updated_text = ", ".join(data.updated_items)
    return PushNotificationContent(
        title=f'{data.updating_user.name} updated "{data.event.title}"',
        body=f"{time_display}\n{data.updating_user.name} updated: {updated_text}\n\n{data.event.content}",
        icon_url=v2avatar(data.updating_user),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


# event:invite_organizer
def _event_invite_organizer(data: notification_data_pb2.EventInviteOrganizer, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'{data.inviting_user.name} invited you to co-organize "{data.event.title}"',
        body=f"{time_display}\nInvited to co-organize by {data.inviting_user.name}\n\n{data.event.content}",
        icon_url=v2avatar(data.inviting_user),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


# event:action
def _event_action(data: notification_data_pb2.EventComment, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'{data.author.name} commented on "{data.event.title}"',
        body=f"{time_display}\n{data.author.name} commented:\n\n{data.reply.content}",
        icon_url=v2avatar(data.author),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


# event:reminder
def _event_reminder(data: notification_data_pb2.EventReminder, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'"{data.event.title}" starts soon',
        body=f"Don't forget your upcoming event on Couchers.org\n{time_display}\n{data.event.content}",
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


# event:cancel
def _event_cancel(data: notification_data_pb2.EventCancel, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'{data.cancelling_user.name} cancelled "{data.event.title}"',
        body=f"{time_display}\nThe event has been cancelled by {data.cancelling_user.name}.\n\n{data.event.content}",
        icon_url=v2avatar(data.cancelling_user),
        action_url=urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug),
    )


# event:delete
def _event_delete(data: notification_data_pb2.EventDelete, user: User) -> PushNotificationContent:
    time_display = _get_event_time_display(data.event, user)
    return PushNotificationContent(
        title=f'A moderator deleted "{data.event.title}"',
        body=f"{time_display}\nThe event has been deleted by the moderators.",
    )


# friend_request:create
def _friend_request_create(data: notification_data_pb2.FriendRequestCreate) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.other_user.name} wants to be your friend",
        body=f"You've received a friend request from {data.other_user.name}",
        icon_url=v2avatar(data.other_user),
        action_url=urls.friend_requests_link(),
    )


# friend_request:accept
def _friend_request_accept(data: notification_data_pb2.FriendRequestAccept) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.other_user.name} accepted your friend request!",
        body=f"{v2esc(data.other_user.name)} has accepted your friend request",
        icon_url=v2avatar(data.other_user),
        action_url=urls.user_link(username=data.other_user.username),
    )


# gender:change
def _gender_change(data: notification_data_pb2.GenderChange) -> PushNotificationContent:
    return PushNotificationContent(
        title="Your gender was changed",
        body=f"Your gender on Couchers.org was changed to {data.gender} by an admin.",
        action_url=urls.account_settings_link(),
    )


# general:new_blog_post
def _general_new_blog_post(data: notification_data_pb2.GeneralNewBlogPost) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"New blog post: {data.title}",
        body=data.blurb,
        action_url=data.url,
    )


# host_request:create
def _host_request_create(data: notification_data_pb2.HostRequestCreate, user: User) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.surfer.name} sent you a host request",
        body=f"Dates: {v2date(data.host_request.from_date, user)} to {v2date(data.host_request.to_date, user)}.\n\n{data.text}",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.surfer),
    )


# host_request:message
def _host_request_message(data: notification_data_pb2.HostRequestMessage, user: User) -> PushNotificationContent:
    if data.am_host:
        title = f"{data.user.name} sent you a message in their host request"
    else:
        title = f"{data.user.name} sent you a message in your host request"
    return PushNotificationContent(
        title=title,
        body=f"Dates: {v2date(data.host_request.from_date, user)} to {v2date(data.host_request.to_date, user)}.\n\n{data.text}",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.user),
    )


# host_request:missed_messages
def _host_request_missed_messages(data: notification_data_pb2.HostRequestMissedMessages) -> PushNotificationContent:
    their_your = "their" if data.am_host else "your"
    return PushNotificationContent(
        title=f"{data.user.name} sent you message(s) in {their_your} host request",
        body="Check the app for more info.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.user),
    )


# host_request:reminder
def _host_request_reminder(data: notification_data_pb2.HostRequestReminder) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"You have a pending host request from {data.surfer.name}!",
        body="Please respond to the request!",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.surfer),
    )


# host_request:accept
def _host_request_accept(data: notification_data_pb2.HostRequestAccept) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.host.name} accepted your host request",
        body="Check the app for more info.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.host),
    )


# host_request:reject
def _host_request_reject(data: notification_data_pb2.HostRequestReject) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.host.name} rejected your host request",
        body="Check the app for more info.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.host),
    )


# host_request:cancel
def _host_request_cancel(data: notification_data_pb2.HostRequestCancel) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.surfer.name} cancelled their host request",
        body="Check the app for more info.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.surfer),
    )


# host_request:confirm
def _host_request_confirm(data: notification_data_pb2.HostRequestConfirm) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"{data.surfer.name} confirmed their host request",
        body="Check the app for more info.",
        action_url=urls.host_request(host_request_id=data.host_request.host_request_id),
        icon_url=v2avatar(data.surfer),
    )


# modnote:create
def _modnote_create(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="You received a mod note",
        body="You need to read and acknowledge the note before continuing to use the platform.",
    )


# onboarding:reminder
def _onboarding_reminder(data: empty_pb2.Empty, key: str, user: User) -> PushNotificationContent:
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


# password:change
def _password_change(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="Your password was changed",
        body="Your login password for Couchers.org was changed.",
        action_url=urls.account_settings_link(),
    )


# password_reset:start
def _password_reset_start(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="A password reset was initiated on your account",
        body="Someone initiated a password change on your account.",
        action_url=urls.account_settings_link(),
    )


# password_reset:complete
def _password_reset_complete(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="Your password was successfully reset",
        body="Your password on Couchers.org was changed. If that was you, then no further action is needed.",
        action_url=urls.account_settings_link(),
    )


# phone_number:change
def _phone_number_change(data: notification_data_pb2.PhoneNumberChange) -> PushNotificationContent:
    return PushNotificationContent(
        title="Phone verification started",
        body=f"You started phone number verification with the number {v2phone(data.phone)}.",
        action_url=urls.feature_preview_link(),
    )


# phone_number:verify
def _phone_number_verify(data: notification_data_pb2.PhoneNumberVerify) -> PushNotificationContent:
    return PushNotificationContent(
        title="Phone successfully verified",
        body=f"Your phone was successfully verified as {v2phone(data.phone)} on Couchers.org.",
        action_url=urls.feature_preview_link(),
    )


# postal_verification:postcard_sent
def _postal_verification_postcard_sent(
    data: notification_data_pb2.PostalVerificationPostcardSent,
) -> PushNotificationContent:
    return PushNotificationContent(
        title="Your verification postcard is on its way",
        body=f"Postcard sent to {data.city}, {data.country}. Expect it within 1-3 weeks.",
        action_url=urls.account_settings_link(),
    )


# postal_verification:success
def _postal_verification_success(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="Postal Verification succeeded",
        body="You have been verified with Postal Verification! Your address has been confirmed.",
        action_url=urls.account_settings_link(),
    )


# postal_verification:failed
def _postal_verification_failed(data: notification_data_pb2.PostalVerificationFailed) -> PushNotificationContent:
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


# reference:receive_friend
def _reference_receive_friend(data: notification_data_pb2.ReferenceReceiveFriend) -> PushNotificationContent:
    return PushNotificationContent(
        title=f"You've received a friend reference from {data.from_user.name}!",
        body=data.text,
        icon_url=v2avatar(data.from_user),
        action_url=urls.profile_references_link(),
    )


# reference:receive_hosted, reference:receive_surfed
def _reference_receive(data: notification_data_pb2.ReferenceReceiveHostRequest, action: str) -> PushNotificationContent:
    if data.text:
        body = v2esc(data.text)
        action_url = urls.profile_references_link()
    else:
        body = (
            "Please go and write a reference for them too. It's a nice gesture and helps us build a community together!"
        )
        # what was my type? i surfed with them if i received a "hosted" request
        surfed = action == "receive_hosted"
        action_url = urls.leave_reference_link(
            reference_type="surfed" if surfed else "hosted",
            to_user_id=data.from_user.user_id,
            host_request_id=str(data.host_request_id),
        )
    return PushNotificationContent(
        title=f"You've received a reference from {data.from_user.name}!",
        body=body,
        icon_url=v2avatar(data.from_user),
        action_url=action_url,
    )


# reference:reminder_hosted, reference:reminder_surfed
def _reference_reminder(data: notification_data_pb2.ReferenceReminder, action: str) -> PushNotificationContent:
    # what was my type? i surfed with them if i get a surfed reminder
    surfed = action == "reminder_surfed"
    leave_reference_link = urls.leave_reference_link(
        reference_type="surfed" if surfed else "hosted",
        to_user_id=data.other_user.user_id,
        host_request_id=str(data.host_request_id),
    )
    return PushNotificationContent(
        title=f"You have {data.days_left} days to write a reference for {data.other_user.name}!",
        body="It's a nice gesture to write references and helps us build a community together! References will become visible 2 weeks after the stay, or when you've both written a reference for each other, whichever happens first.",
        icon_url=v2avatar(data.other_user),
        action_url=leave_reference_link,
    )


# thread:reply
def _thread_reply(data: notification_data_pb2.ThreadReply) -> PushNotificationContent:
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


# verification:sv_success
def _verification_sv_success(data: empty_pb2.Empty) -> PushNotificationContent:
    return PushNotificationContent(
        title="Strong Verification succeeded",
        body="You have been verified with Strong Verification! You will now see a tick next to your name on the platform.",
        action_url=urls.account_settings_link(),
    )


# verification:sv_fail
def _verification_sv_fail(data: notification_data_pb2.VerificationSVFail) -> PushNotificationContent:
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


def render_push_notification(user: User, notification: Notification) -> PushNotificationContent:
    data: empty_pb2.Empty = notification.topic_action.data_type.FromString(notification.data)  # type: ignore[attr-defined]
    # Keep topics sorted (action can follow logical ordering)
    match notification.topic_action:
        case "account_deletion:start":
            return _account_deletion_start(data)
        case "account_deletion:complete":
            return _account_deletion_complete(data)
        case "account_deletion:recovered":
            return _account_deletion_recovered(data)
        case "activeness:probe":
            return _activeness_probe(data)
        case "address:change":
            return _address_change(data)
        case "address:verify":
            return _address_verify(data)
        case "api_key:create":
            return _api_key_create(data)
        case "badge:add":
            return _badge_add(data)
        case "badge:remove":
            return _badge_remove(data)
        case "birthdate:change":
            return _birthdate_change(data, user)
        case "chat:message":
            return _chat_message(data, user)
        case "chat:missed_messages":
            return _chat_missed_messages(data, user)
        case "donation:received":
            return _donation_received(data)
        case "discussion:create":
            return _discussion_create(data)
        case "discussion:comment":
            return _discussion_comment(data)
        case "event:create_any":
            return _event_create_any(data, user)
        case "event:create_approved":
            return _event_create_approved(data, user)
        case "event:create_update":
            return _event_update(data, user)
        case "event:create_invite_organizer":
            return _event_invite_organizer(data, user)
        case "event:create_action":
            return _event_action(data, user)
        case "event:create_reminder":
            return _event_reminder(data, user)
        case "event:create_cancel":
            return _event_cancel(data, user)
        case "event:create_delete":
            return _event_delete(data, user)
        case "friend_request:create":
            return _friend_request_create(data)
        case "friend_request:accept":
            return _friend_request_accept(data)
        case "gender:change":
            return _gender_change(data)
        case "general:new_blog_post":
            return _general_new_blog_post(data)
        case "host_request:create":
            return _host_request_create(data, user)
        case "host_request:message":
            return _host_request_message(data, user)
        case "host_request:missed_messages":
            return _host_request_missed_messages(data)
        case "host_request:reminder":
            return _host_request_reminder(data)
        case "host_request:accept":
            return _host_request_accept(data)
        case "host_request:reject":
            return _host_request_reject(data)
        case "host_request:cancel":
            return _host_request_cancel(data)
        case "host_request:confirm":
            return _host_request_confirm(data)
        case "modnote:create":
            return _modnote_create(data)
        case "onboarding:reminder":
            return _onboarding_reminder(data)
        case "password:change":
            return _password_change(data)
        case "password_reset:start":
            return _password_reset_start(data)
        case "password_reset:complete":
            return _password_reset_complete(data)
        case "phone_number:change":
            return _phone_number_change(data)
        case "phone_number:verify":
            return _phone_number_verify(data)
        case "postal_verification:postcard_sent":
            return _postal_verification_postcard_sent(data)
        case "postal_verification:success":
            return _postal_verification_success(data)
        case "postal_verification:failed":
            return _postal_verification_failed(data)
        case "reference:receive_friend":
            return _reference_receive_friend(data)
        case "reference:receive_hosted":
            return _reference_receive(data, action=notification.action)
        case "reference:receive_surfed":
            return _reference_receive(data, action=notification.action)
        case "reference:reminder_hosted":
            return _reference_reminder(data, action=notification.action)
        case "reference:reminder_surfed":
            return _reference_reminder(data, action=notification.action)
        case "thread:reply":
            return _thread_reply(data)
        case "verification:sv_success":
            return _verification_sv_success(data)
        case "verification:sv_fail":
            return _verification_sv_fail(data)
        case _:
            raise NotImplementedError(f"Unknown topic-action: {notification.topic}:{notification.action}")
