import logging
from dataclasses import dataclass
from typing import Any

from couchers import urls
from couchers.i18n import LocalizationContext
from couchers.i18n.localize import format_phone_number
from couchers.models import Notification, NotificationTopicAction
from couchers.notifications.quick_links import (
    generate_quick_decline_link,
    generate_unsub_topic_action,
    generate_unsub_topic_key,
)
from couchers.notifications.utils import can_unsubscribe_topic_key
from couchers.proto import api_pb2, notification_data_pb2
from couchers.utils import now, to_aware_datetime

logger = logging.getLogger(__name__)


@dataclass(kw_only=True)
class RenderedEmailNotification:
    # email subject
    subject: str
    # shows up when listing emails in many clients
    preview: str
    # corresponds to .mjml + .txt file in templates/v2
    template_name: str
    # other template args
    template_args: dict[str, Any]


def render_email_notification(
    notification: Notification, loc_context: LocalizationContext
) -> RenderedEmailNotification:
    data = notification.topic_action.data_type.FromString(notification.data)  # type: ignore[attr-defined]
    if notification.topic == "host_request":
        view_link = urls.host_request(host_request_id=data.host_request.host_request_id)
        if notification.action == "missed_messages":
            their_your = "their" if data.am_host else "your"
            other = data.user
            # "declined your host request", or similar
            message = f"{other.name} sent you message(s) in {their_your} host request"
            return RenderedEmailNotification(
                subject=message,
                preview=message,
                template_name="host_request__plain",
                template_args={
                    "view_link": view_link,
                    "host_request": data.host_request,
                    "message": message,
                    "other": UserTemplateArgs.from_protobuf_user(other),
                },
            )
        elif notification.action == "create":
            other = data.surfer
            message = f"{other.name} sent you a host request"
            return RenderedEmailNotification(
                subject=message,
                preview=message,
                template_name="host_request__new",
                template_args={
                    "view_link": view_link,
                    "quick_decline_link": generate_quick_decline_link(data.host_request),
                    "host_request": data.host_request,
                    "message": message,
                    "other": UserTemplateArgs.from_protobuf_user(other),
                    "text": data.text,
                },
            )
        elif notification.action == "message":
            other = data.user
            if data.am_host:
                message = f"{other.name} sent you a message in their host request"
            else:
                message = f"{other.name} sent you a message in your host request"
            return RenderedEmailNotification(
                subject=message,
                preview=message,
                template_name="host_request__message",
                template_args={
                    "view_link": view_link,
                    "host_request": data.host_request,
                    "message": message,
                    "other": UserTemplateArgs.from_protobuf_user(other),
                    "text": data.text,
                },
            )
        elif notification.action in ["accept", "reject", "confirm", "cancel"]:
            if notification.action in ["accept", "reject"]:
                other = data.host
                their_your = "your"
            else:
                other = data.surfer
                their_your = "their"
            actioned = {
                "accept": "accepted",
                "reject": "declined",
                "confirm": "confirmed",
                "cancel": "cancelled",
            }[notification.action]
            # "declined your host request", or similar
            message = f"{other.name} {actioned} {their_your} host request"
            return RenderedEmailNotification(
                subject=message,
                preview=message,
                template_name="host_request__plain",
                template_args={
                    "view_link": view_link,
                    "host_request": data.host_request,
                    "message": message,
                    "other": UserTemplateArgs.from_protobuf_user(other),
                },
            )
        elif notification.action == "reminder":
            message = f"You have a pending host request from {data.surfer.name}!"
            description = "Please respond to the request!"
            return RenderedEmailNotification(
                subject=message,
                preview=description,
                template_name="host_request__plain",
                template_args={
                    "view_link": view_link,
                    "host_request": data.host_request,
                    "message": description,
                    "other": UserTemplateArgs.from_protobuf_user(data.surfer),
                },
            )
    elif notification.topic_action == NotificationTopicAction.password__change:
        title = "Your password was changed"
        message = "Your login password for Couchers.org was changed."
        return RenderedEmailNotification(
            subject=title,
            preview=message,
            template_name="security",
            template_args={
                "title": title,
                "message": message,
            },
        )
    elif notification.topic_action == NotificationTopicAction.password_reset__start:
        message = "Someone initiated a password change on your account."
        return RenderedEmailNotification(
            subject="Reset your Couchers.org password",
            preview=message,
            template_name="password_reset",
            template_args={
                "password_reset_link": urls.password_reset_link(password_reset_token=data.password_reset_token)
            },
        )
    elif notification.topic_action == NotificationTopicAction.password_reset__complete:
        title = "Your password was successfully reset"
        message = "Your password on Couchers.org was changed. If that was you, then no further action is needed."
        return RenderedEmailNotification(
            subject=title,
            preview=title,
            template_name="security",
            template_args={
                "title": title,
                "message": message,
            },
        )
    elif notification.topic_action == NotificationTopicAction.email_address__change:
        title = "An email change was initiated on your account"
        message = f"An email change to the email <b>{data.new_email}</b> was initiated on your account."
        return RenderedEmailNotification(
            subject=title,
            preview=title,
            template_name="security",
            template_args={
                "title": title,
                "message": message,
            },
        )
    elif notification.topic_action == NotificationTopicAction.email_address__verify:
        title = "Email change completed"
        message = "Your new email address has been verified."
        return RenderedEmailNotification(
            subject=title,
            preview=message,
            template_name="security",
            template_args={
                "title": title,
                "message": message,
            },
        )
    elif notification.topic_action == NotificationTopicAction.phone_number__change:
        title = "Phone verification started"
        message = f"You started phone number verification with the number <b>{format_phone_number(data.phone)}</b>."
        return RenderedEmailNotification(
            subject=title,
            preview=message,
            template_name="security",
            template_args={
                "title": title,
                "message": message,
            },
        )
    elif notification.topic_action == NotificationTopicAction.phone_number__verify:
        title = "Phone successfully verified"
        message = f"Your phone was successfully verified as <b>{format_phone_number(data.phone)}</b> on Couchers.org."
        message_plain = f"Your phone was successfully verified as {format_phone_number(data.phone)} on Couchers.org."
        return RenderedEmailNotification(
            subject=title,
            preview=message_plain,
            template_name="security",
            template_args={
                "title": title,
                "message": message,
            },
        )
    elif notification.topic_action == NotificationTopicAction.gender__change:
        title = "Your gender was changed"
        message = f"Your gender on Couchers.org was changed to <b>{data.gender}</b> by an admin."
        message_plain = f"Your gender on Couchers.org was changed to {data.gender} by an admin."
        return RenderedEmailNotification(
            subject=title,
            preview=message_plain,
            template_name="security",
            template_args={
                "title": title,
                "message": message,
            },
        )
    elif notification.topic_action == NotificationTopicAction.birthdate__change:
        title = "Your date of birth was changed"
        birthdate = loc_context.localize_date_from_iso(data.birthdate)
        message = f"Your date of birth on Couchers.org was changed to <b>{birthdate}</b> by an admin."
        message_plain = f"Your date of birth on Couchers.org was changed to {birthdate} by an admin."
        return RenderedEmailNotification(
            subject=title,
            preview=message_plain,
            template_name="security",
            template_args={
                "title": title,
                "message": message,
            },
        )
    elif notification.topic_action == NotificationTopicAction.api_key__create:
        return RenderedEmailNotification(
            subject="Your API key for Couchers.org",
            preview="We have issued you an API key as per your request.",
            template_name="api_key",
            template_args={
                "api_key": data.api_key,
                "expiry": data.expiry,
            },
        )
    elif notification.topic_action.display in ["badge:add", "badge:remove"]:
        actioned = "added to" if notification.action == "add" else "removed from"
        title = f"The {data.badge_name} badge was {actioned} your profile"
        return RenderedEmailNotification(
            subject=title,
            preview=title,
            template_name="badge",
            template_args={
                "badge_name": data.badge_name,
                "actioned": actioned,
                "unsub_type": "badge additions" if notification.action == "add" else "badge removals",
            },
        )
    elif notification.topic_action == NotificationTopicAction.donation__received:
        title = loc_context.localize_string("notifications.donation_received.title")
        message = loc_context.localize_string(
            "notifications.donation_received.thanks_amount",
            substitutions={
                "amount": data.amount,
            },
        )
        return RenderedEmailNotification(
            subject=title,
            preview=message,
            template_name="donation_received",
            template_args={
                "amount": data.amount,
                "receipt_url": data.receipt_url,
            },
        )
    elif notification.topic_action == NotificationTopicAction.friend_request__create:
        other = data.other_user
        preview = f"You've received a friend request from {other.name}"
        return RenderedEmailNotification(
            subject=f"{other.name} wants to be your friend on Couchers.org!",
            preview=preview,
            template_name="friend_request",
            template_args={
                "friend_requests_link": urls.friend_requests_link(),
                "other": UserTemplateArgs.from_protobuf_user(other),
            },
        )
    elif notification.topic_action == NotificationTopicAction.friend_request__accept:
        other = data.other_user
        title = f"{other.name} accepted your friend request!"
        preview = f"{other.name} has accepted your friend request"
        return RenderedEmailNotification(
            subject=title,
            preview=preview,
            template_name="friend_request_accepted",
            template_args={
                "other": UserTemplateArgs.from_protobuf_user(other),
            },
        )
    elif notification.topic_action == NotificationTopicAction.account_deletion__start:
        return RenderedEmailNotification(
            subject="Confirm your Couchers.org account deletion",
            preview="Please confirm that you want to delete your Couchers.org account.",
            template_name="account_deletion_start",
            template_args={
                "deletion_link": urls.delete_account_link(account_deletion_token=data.deletion_token),
            },
        )
    elif notification.topic_action == NotificationTopicAction.account_deletion__complete:
        title = "Your Couchers.org account has been deleted"
        return RenderedEmailNotification(
            subject=title,
            preview="We have deleted your Couchers.org account, to undo, follow the link in this email.",
            template_name="account_deletion_complete",
            template_args={
                "undelete_link": urls.recover_account_link(account_undelete_token=data.undelete_token),
                "days": data.undelete_days,
            },
        )
    elif notification.topic_action == NotificationTopicAction.account_deletion__recovered:
        title = "Your Couchers.org account has been recovered!"
        subtitle = "We have recovered your Couchers.org account as per your request! Welcome back!"
        return RenderedEmailNotification(
            subject=title,
            preview=subtitle,
            template_name="account_deletion_recovered",
            template_args={
                "app_link": urls.app_link(),
            },
        )
    elif notification.topic_action == NotificationTopicAction.chat__message:
        return RenderedEmailNotification(
            subject=data.message,
            preview="You received a message on Couchers.org!",
            template_name="chat_message",
            template_args={
                "author": UserTemplateArgs.from_protobuf_user(data.author),
                "message": data.message,
                "text": data.text,
                "view_link": urls.chat_link(chat_id=data.group_chat_id),
            },
        )
    elif notification.topic_action == NotificationTopicAction.chat__missed_messages:
        return RenderedEmailNotification(
            subject="You have unseen messages on Couchers.org!",
            preview="You missed some messages on the platform.",
            template_name="chat_unseen_messages",
            template_args={
                "items": [
                    {
                        "author": UserTemplateArgs.from_protobuf_user(item.author),
                        "message": item.message,
                        "text": item.text,
                        "view_link": urls.chat_link(chat_id=item.group_chat_id),
                    }
                    for item in data.messages
                ]
            },
        )
    elif notification.topic == "event":
        event = data.event
        start_time = loc_context.localize_datetime(event.start_time)
        end_time = loc_context.localize_datetime(event.end_time)
        time_display = f"{start_time} - {end_time}"
        event_link = urls.event_link(occurrence_id=event.event_id, slug=event.slug)
        if notification.action in ["create_approved", "create_any"]:
            # create_approved = invitation, approved by mods
            # create_any = new event created by anyone (no need for approval) -- off by default
            if notification.action == "create_approved":
                subject = f'{data.inviting_user.name} invited you to "{event.title}"'
                start_text = "You've been invited to a new event"
            elif notification.action == "create_any":
                subject = f'{data.inviting_user.name} created an event called "{event.title}"'
                start_text = "A new event was created"
            community_link = (
                urls.community_link(node_id=data.in_community.community_id, slug=data.in_community.slug)
                if data.in_community
                else None
            )
            return RenderedEmailNotification(
                subject=subject,
                preview=f"{start_text} on Couchers.org!",
                template_name="event_create",
                template_args={
                    "inviting_user": UserTemplateArgs.from_protobuf_user(data.inviting_user),
                    "time_display": time_display,
                    "start_text": start_text,
                    "nearby": "nearby" if data.nearby else None,
                    "community": data.in_community if data.in_community else None,
                    "community_link": community_link,
                    "event": event,
                    "view_link": event_link,
                },
            )
        elif notification.action == "update":
            updated_text = ", ".join(data.updated_items)
            return RenderedEmailNotification(
                subject=f'{data.updating_user.name} updated "{event.title}"',
                preview="An event you are subscribed to was updated.",
                template_name="event_update",
                template_args={
                    "updating_user": UserTemplateArgs.from_protobuf_user(data.updating_user),
                    "time_display": time_display,
                    "event": event,
                    "updated_text": updated_text,
                    "view_link": event_link,
                },
            )
        elif notification.action == "cancel":
            return RenderedEmailNotification(
                subject=f'{data.cancelling_user.name} cancelled "{event.title}"',
                preview="An event you are subscribed to has been cancelled.",
                template_name="event_cancel",
                template_args={
                    "cancelling_user": UserTemplateArgs.from_protobuf_user(data.cancelling_user),
                    "time_display": time_display,
                    "event": event,
                    "view_link": event_link,
                },
            )
        elif notification.action == "delete":
            return RenderedEmailNotification(
                subject=f'A moderator deleted "{event.title}"',
                preview="An event you are subscribed to has been deleted.",
                template_name="event_delete",
                template_args={
                    "time_display": time_display,
                    "event": event,
                },
            )
        elif notification.action == "invite_organizer":
            return RenderedEmailNotification(
                subject=f'{data.inviting_user.name} invited you to co-organize "{event.title}"',
                preview="You were invited to co-organize an event on Couchers.org.",
                template_name="event_invite_organizer",
                template_args={
                    "inviting_user": UserTemplateArgs.from_protobuf_user(data.inviting_user),
                    "time_display": time_display,
                    "event": event,
                    "view_link": event_link,
                },
            )
        elif notification.action == "comment":
            return RenderedEmailNotification(
                subject=f'{data.author.name} commented on "{event.title}"',
                preview="Someone commented on an event you are attending.",
                template_name="event_comment",
                template_args={
                    "author": UserTemplateArgs.from_protobuf_user(data.author),
                    "time_display": time_display,
                    "event": event,
                    "content": data.reply.content,
                    "view_link": event_link,
                },
            )
        elif notification.action == "reminder":
            return RenderedEmailNotification(
                subject=f'Reminder: "{data.event.title}" starts soon',
                preview="Don't forget your upcoming event on Couchers.org",
                template_name="event_reminder",
                template_args={
                    "time_display": time_display,
                    "event": event,
                    "view_link": event_link,
                },
            )
    elif notification.topic == "discussion":
        discussion = data.discussion
        discussion_link = urls.discussion_link(discussion_id=discussion.discussion_id, slug=discussion.slug)
        if notification.action == "create":
            return RenderedEmailNotification(
                subject=f'{data.author.name} created a discussion: "{discussion.title}"',
                preview="Someone created a discussion in a community or group you are subscribed to.",
                template_name="discussion_create",
                template_args={
                    "author": UserTemplateArgs.from_protobuf_user(data.author),
                    "discussion": discussion,
                    "view_link": discussion_link,
                },
            )
        elif notification.action == "comment":
            return RenderedEmailNotification(
                subject=f'{data.author.name} commented on "{discussion.title}"',
                preview="Someone commented on your discussion.",
                template_name="discussion_comment",
                template_args={
                    "author": UserTemplateArgs.from_protobuf_user(data.author),
                    "discussion": discussion,
                    "reply": data.reply,
                    "view_link": discussion_link,
                },
            )
    elif notification.topic_action == NotificationTopicAction.thread__reply:
        parent = data.WhichOneof("reply_parent")
        if parent == "event":
            title = data.event.title
            view_link = urls.event_link(occurrence_id=data.event.event_id, slug=data.event.slug)
        elif parent == "discussion":
            title = data.discussion.title
            view_link = urls.discussion_link(discussion_id=data.discussion.discussion_id, slug=data.discussion.slug)
        else:
            raise Exception("Can only do replies to events and discussions")

        return RenderedEmailNotification(
            subject=f'{data.author.name} replied in "{title}"',
            preview="Someone replied in a comment thread you have participated in.",
            template_name="comment_reply",
            template_args={
                "author": UserTemplateArgs.from_protobuf_user(data.author),
                "title": title,
                "reply": data.reply,
                "view_link": view_link,
            },
        )
    elif notification.topic == "reference":
        if notification.action == "receive_friend":
            title = f"You've received a friend reference from {data.from_user.name}!"
            return RenderedEmailNotification(
                subject=title,
                preview=data.text,
                template_name="friend_reference",
                template_args={
                    "from_user": UserTemplateArgs.from_protobuf_user(data.from_user),
                    "profile_references_link": urls.profile_references_link(),
                    "text": data.text,
                },
            )
        elif notification.action in ["receive_hosted", "receive_surfed"]:
            title = f"You've received a reference from {data.from_user.name}!"
            # what was my type? i surfed with them if i received a "hosted" request
            surfed = notification.action == "receive_hosted"
            leave_reference_link = urls.leave_reference_link(
                reference_type="surfed" if surfed else "hosted",
                to_user_id=data.from_user.user_id,
                host_request_id=data.host_request_id,
            )
            profile_references_link = urls.profile_references_link()
            if data.text:
                preview = data.text
            else:
                preview = "Please go and write a reference for them too. It's a nice gesture and helps us build a community together!"
            return RenderedEmailNotification(
                subject=title,
                preview=preview,
                template_name="host_reference",
                template_args={
                    "from_user": UserTemplateArgs.from_protobuf_user(data.from_user),
                    "leave_reference_link": leave_reference_link,
                    "profile_references_link": profile_references_link,
                    "text": data.text,
                    "both_written": True if data.text else False,
                    "surfed": surfed,
                },
            )
        elif notification.action in ["reminder_hosted", "reminder_surfed"]:
            # what was my type? i surfed with them if i get a surfed reminder
            surfed = notification.action == "reminder_surfed"
            leave_reference_link = urls.leave_reference_link(
                reference_type="surfed" if surfed else "hosted",
                to_user_id=data.other_user.user_id,
                host_request_id=data.host_request_id,
            )
            title = f"You have {data.days_left} days to write a reference for {data.other_user.name}!"
            preview = "It's a nice gesture to write references and helps us build a community together! References will become visible 2 weeks after the stay, or when you've both written a reference for each other, whichever happens first."
            return RenderedEmailNotification(
                subject=title,
                preview=preview,
                template_name="reference_reminder",
                template_args={
                    "other_user": UserTemplateArgs.from_protobuf_user(data.other_user),
                    "leave_reference_link": leave_reference_link,
                    "days_left": str(data.days_left),
                    "surfed": surfed,
                },
            )
    elif notification.topic_action == NotificationTopicAction.onboarding__reminder:
        if notification.key == "1":
            return RenderedEmailNotification(
                subject="Welcome to Couchers.org and the future of couch surfing",
                preview="We are so excited to have you join our community!",
                template_name="onboarding1",
                template_args={
                    "app_link": urls.app_link(),
                    "edit_profile_link": urls.edit_profile_link(),
                },
            )
        elif notification.key == "2":
            return RenderedEmailNotification(
                subject="Complete your profile on Couchers.org",
                preview="We would ask one big favour of you: please fill out your profile by adding a photo and some text.",
                template_name="onboarding2",
                template_args={
                    "edit_profile_link": urls.edit_profile_link(),
                },
            )
    elif notification.topic_action == NotificationTopicAction.modnote__create:
        title = "You have received a mod note"
        message = "You have received an important note from the moderators. You must read and acknowledge it before continuing to use the platform."
        return RenderedEmailNotification(
            subject=title,
            preview=message,
            template_name="mod_note",
            template_args={"title": title},
        )
    elif notification.topic_action == NotificationTopicAction.verification__sv_success:
        title = "Strong Verification succeeded"
        message = "You have been verified with Strong Verification! You will now see a tick next to your name on the platform."
        return RenderedEmailNotification(
            subject=title,
            preview=message,
            template_name="strong_verification_success",
            template_args={
                "message": message,
            },
        )
    elif notification.topic_action == NotificationTopicAction.verification__sv_fail:
        title = "Strong Verification failed"
        if data.reason == notification_data_pb2.SV_FAIL_REASON_WRONG_BIRTHDATE_OR_GENDER:
            reason_message = "The date of birth or gender on your profile does not match the date of birth or sex on your passport. Please contact the support team to update your date of birth or gender, or if your passport sex does not match your gender identity."
        elif data.reason == notification_data_pb2.SV_FAIL_REASON_NOT_A_PASSPORT:
            reason_message = "You tried to verify with a document that is not a passport. You can only use a passport for Strong Verification."
        elif data.reason == notification_data_pb2.SV_FAIL_REASON_DUPLICATE:
            reason_message = "You tried to verify with a passport that has already been used for verification. Please use another passport."
        else:
            raise Exception("Shouldn't get here")
        return RenderedEmailNotification(
            subject=title,
            preview=title,
            template_name="security",
            template_args={
                "title": title,
                "message": reason_message,
            },
        )
    elif notification.topic == "postal_verification":
        if notification.action == "postcard_sent":
            title = "Your verification postcard is on its way"
            message = f"We've sent a postcard with your verification code to {data.city}, {data.country}. It should arrive within 1-3 weeks depending on your location. Once it arrives, enter the code on the platform to complete verification."
            return RenderedEmailNotification(
                subject=title,
                preview=message,
                template_name="security",
                template_args={
                    "title": title,
                    "message": message,
                },
            )
        elif notification.action == "success":
            title = "Postal Verification succeeded"
            message = "You have been verified with Postal Verification! Your address has been confirmed."
            return RenderedEmailNotification(
                subject=title,
                preview=message,
                template_name="security",
                template_args={
                    "title": title,
                    "message": message,
                },
            )
        elif notification.action == "failed":
            title = "Postal Verification failed"
            if data.reason == notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_CODE_EXPIRED:
                reason_message = "Your verification code has expired. Codes are valid for 90 days after the postcard is sent. You can start a new verification attempt."
            elif data.reason == notification_data_pb2.POSTAL_VERIFICATION_FAIL_REASON_TOO_MANY_ATTEMPTS:
                reason_message = "Too many incorrect code attempts. You can start a new verification attempt."
            else:
                reason_message = (
                    "Your postal verification attempt has failed. You can start a new verification attempt."
                )
            return RenderedEmailNotification(
                subject=title,
                preview=title,
                template_name="security",
                template_args={
                    "title": title,
                    "message": reason_message,
                },
            )
    elif notification.topic_action == NotificationTopicAction.activeness__probe:
        title = "Are you still open to hosting on Couchers.org?"
        return RenderedEmailNotification(
            subject=title,
            preview=title,
            template_name="activeness_probe",
            template_args={
                "app_link": urls.app_link(),
                "days_left": (to_aware_datetime(data.deadline) - now()).days,
            },
        )
    elif notification.topic_action == NotificationTopicAction.general__new_blog_post:
        title = f"New blog post: {data.title}"
        return RenderedEmailNotification(
            subject=title,
            preview=data.blurb,
            template_name="new_blog_post",
            template_args={
                "title": data.title,
                "blurb": data.blurb,
                "url": data.url,
            },
        )

    raise NotImplementedError(f"Unknown topic-action: {notification.topic}:{notification.action}")


def get_list_unsubscribe_header(notification: Notification) -> str | None:
    if notification.topic_action.is_critical:
        return None

    # We can only have one List-Unsubscribe header.
    # Prefer topic-key unsubscription as it is more specific than topic-action (e.g. current chat, not all chats).
    list_unsubscribe_url: str
    if can_unsubscribe_topic_key(notification.topic_action):
        list_unsubscribe_url = generate_unsub_topic_key(notification)
    else:
        list_unsubscribe_url = generate_unsub_topic_action(notification)

    return f"<{list_unsubscribe_url}>"


@dataclass(frozen=True, slots=True, kw_only=True)
class UserTemplateArgs:
    """
    A user's information for email template placeholders.
    Allows decoupling from protocol buffer objects.
    """

    name: str
    age: int
    city: str
    avatar_url: str
    profile_url: str

    @staticmethod
    def from_protobuf_user(user: api_pb2.User) -> UserTemplateArgs:
        return UserTemplateArgs(
            name=user.name,
            age=user.age,
            city=user.city,
            avatar_url=user.avatar_thumbnail_url or urls.icon_url(),
            profile_url=urls.user_link(username=user.username),
        )
