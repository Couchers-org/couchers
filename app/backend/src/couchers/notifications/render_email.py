import logging
from dataclasses import dataclass, field
from datetime import date
from typing import Any

import couchers.email.emails as emails
from couchers import urls
from couchers.config import config
from couchers.email.calendar_events import create_host_request_attachment, create_host_request_cancellation_attachment
from couchers.email.rendering import (
    EmailFooter,
    UnsubscribeInfo,
    UnsubscribeLink,
    render_html_body,
    render_plaintext_body,
)
from couchers.i18n import LocalizationContext
from couchers.models import Notification, NotificationTopicAction, User
from couchers.notifications.quick_links import (
    can_unsubscribe_topic_key,
    generate_do_not_email,
    generate_quick_decline_link,
    generate_unsub_topic_action,
    generate_unsub_topic_key,
)
from couchers.proto import api_pb2
from couchers.proto.internal.jobs_pb2 import EmailAttachment
from couchers.templating import Jinja2Template, template_folder
from couchers.utils import now, to_aware_datetime

logger = logging.getLogger(__name__)


@dataclass(kw_only=True, slots=True)
class RenderedEmailNotification:
    subject: str
    body_plaintext: str
    body_html: str | None
    source_data: str | None
    list_unsubscribe_header: str | None
    attachments: list[EmailAttachment] = field(default_factory=list)


def render_email_notification(
    user: User, notification: Notification, loc_context: LocalizationContext
) -> RenderedEmailNotification:
    footer = get_email_footer(user, notification, loc_context)

    subject: str
    body_plaintext: str
    body_html: str
    source_data: str | None = None
    # Progressively migrate to the new email templating system in couchers.email.emails,
    # which supports localization and uses a single generic html template.
    if email := _get_generic_templated_email(user.name, notification):
        subject = email.get_subject_line(loc_context)
        preview = email.get_preview_line(loc_context)
        body_blocks = email.get_body_blocks(loc_context)
        body_plaintext = render_plaintext_body(blocks=body_blocks, footer=footer, loc_context=loc_context)
        body_html = render_html_body(
            subject=subject, preview=preview, blocks=body_blocks, footer=footer, loc_context=loc_context
        )
        source_data = f"notification; topic-action={notification.topic_action}; version={config['VERSION']}"
    else:
        # Email is still a custom-templated, nonlocalizable email.
        custom_templated = _get_custom_templated_email(notification, loc_context)
        subject = custom_templated.subject

        template_args = {
            **custom_templated.template_args,
            "header_subject": custom_templated.subject,
            "header_preview": custom_templated.preview,
            "user": user,
            "time": notification.created,
            **footer.to_template_args(),
        }

        # Format plaintext template
        plain_tmplt_body = (template_folder / f"{custom_templated.template_name}.txt").read_text()
        plain_tmplt_footer = (template_folder / "_footer.txt").read_text()
        plain_tmplt = Jinja2Template(source=plain_tmplt_body + plain_tmplt_footer, html=False)
        body_plaintext = plain_tmplt.render(template_args, loc_context)

        # Format html template
        html_tmplt = Jinja2Template(
            source=(template_folder / "generated_html" / f"{custom_templated.template_name}.html").read_text(),
            html=True,
        )
        body_html = html_tmplt.render(template_args, loc_context)

        source_data = config["VERSION"] + f"/{custom_templated.template_name}"

    list_unsubscribe_header = get_list_unsubscribe_header(notification)
    if config.get("ENABLE_EMAIL_ICS_ATTACHMENTS"):
        attachment = get_ics_attachment(notification, loc_context)
    else:
        attachment = None

    return RenderedEmailNotification(
        subject=subject,
        body_plaintext=body_plaintext,
        body_html=body_html,
        source_data=source_data,
        list_unsubscribe_header=list_unsubscribe_header,
        attachments=[attachment] if attachment else [],
    )


def _get_generic_templated_email(user_name: str, notification: Notification) -> emails.EmailBase | None:
    data = notification.topic_action.data_type.FromString(notification.data)  # type: ignore[attr-defined]
    match notification.topic_action:
        case NotificationTopicAction.api_key__create:
            return emails.APIKeyIssuedEmail(user_name, api_key=data.api_key, expiry=data.expiry)
        case NotificationTopicAction.badge__add:
            return emails.BadgeChangedEmail(user_name, badge_name=data.badge_name, added=True)
        case NotificationTopicAction.badge__remove:
            return emails.BadgeChangedEmail(user_name, badge_name=data.badge_name, added=False)
        case NotificationTopicAction.birthdate__change:
            return emails.BirthdateChangedEmail(user_name, new_birthdate=date.fromisoformat(data.birthdate))
        case NotificationTopicAction.email_address__change:
            return emails.EmailAddressChangedEmail(user_name, new_email=data.new_email)
        case NotificationTopicAction.email_address__verify:
            return emails.EmailAddressVerifiedEmail(user_name)
        case NotificationTopicAction.gender__change:
            return emails.GenderChangedEmail(user_name, new_gender=data.gender)
        case NotificationTopicAction.modnote__create:
            return emails.ModeratorNoteEmail(user_name)
        case NotificationTopicAction.password__change:
            return emails.PasswordChangedEmail(user_name)
        case NotificationTopicAction.password_reset__complete:
            return emails.PasswordResetCompletedEmail(user_name)
        case NotificationTopicAction.password_reset__start:
            return emails.PasswordResetStartedEmail(
                user_name, password_reset_link=urls.password_reset_link(password_reset_token=data.password_reset_token)
            )
        case NotificationTopicAction.phone_number__change:
            return emails.PhoneNumberChangeEmail(user_name, new_phone_number=data.phone, completed=False)
        case NotificationTopicAction.phone_number__verify:
            return emails.PhoneNumberChangeEmail(user_name, new_phone_number=data.phone, completed=True)
        case NotificationTopicAction.postal_verification__failed:
            return emails.PostalVerificationFailedEmail(user_name, reason=data.reason)
        case NotificationTopicAction.postal_verification__postcard_sent:
            return emails.PostalVerificationPostcardSentEmail(user_name, city=data.city, country=data.country)
        case NotificationTopicAction.postal_verification__success:
            return emails.PostalVerificationSucceededEmail(user_name)
        case NotificationTopicAction.verification__sv_fail:
            return emails.StrongVerificationFailedEmail(user_name, reason=data.reason)
        case NotificationTopicAction.verification__sv_success:
            return emails.StrongVerificationSucceededEmail(
                user_name,
                donate_link=urls.donation_url() + "?utm_source=strong-verification-email",
            )
        case _:
            # Still implemented as a custom templated email
            return None


@dataclass(kw_only=True)
class CustomTemplatedEmail:
    # email subject
    subject: str
    # shows up when listing emails in many clients
    preview: str
    # corresponds to .mjml + .txt file in templates/v2
    template_name: str
    # other template args
    template_args: dict[str, Any]


# Gets the data necessary to template an email for which we have a custom template,
# e.g. not yet using couchers.email.emails.
def _get_custom_templated_email(notification: Notification, loc_context: LocalizationContext) -> CustomTemplatedEmail:
    data = notification.topic_action.data_type.FromString(notification.data)  # type: ignore[attr-defined]
    if notification.topic == "host_request":
        view_link = urls.host_request(host_request_id=data.host_request.host_request_id)
        if notification.action == "missed_messages":
            their_your = "their" if data.am_host else "your"
            other = data.user
            # "declined your host request", or similar
            message = f"{other.name} sent you message(s) in {their_your} host request"
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
    elif notification.topic_action == NotificationTopicAction.donation__received:
        title = loc_context.localize_string("notifications.donation_received.title")
        message = loc_context.localize_string(
            "notifications.donation_received.thanks_amount",
            substitutions={
                "amount": data.amount,
            },
        )
        return CustomTemplatedEmail(
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
        return CustomTemplatedEmail(
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
        return CustomTemplatedEmail(
            subject=title,
            preview=preview,
            template_name="friend_request_accepted",
            template_args={
                "other": UserTemplateArgs.from_protobuf_user(other),
            },
        )
    elif notification.topic_action == NotificationTopicAction.account_deletion__start:
        return CustomTemplatedEmail(
            subject="Confirm your Couchers.org account deletion",
            preview="Please confirm that you want to delete your Couchers.org account.",
            template_name="account_deletion_start",
            template_args={
                "deletion_link": urls.delete_account_link(account_deletion_token=data.deletion_token),
            },
        )
    elif notification.topic_action == NotificationTopicAction.account_deletion__complete:
        title = "Your Couchers.org account has been deleted"
        return CustomTemplatedEmail(
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
        return CustomTemplatedEmail(
            subject=title,
            preview=subtitle,
            template_name="account_deletion_recovered",
            template_args={
                "app_link": urls.app_link(),
            },
        )
    elif notification.topic_action == NotificationTopicAction.chat__message:
        return CustomTemplatedEmail(
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
        return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
                subject=f'A moderator deleted "{event.title}"',
                preview="An event you are subscribed to has been deleted.",
                template_name="event_delete",
                template_args={
                    "time_display": time_display,
                    "event": event,
                },
            )
        elif notification.action == "invite_organizer":
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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

        return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
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
            return CustomTemplatedEmail(
                subject="Welcome to Couchers.org and the future of couch surfing",
                preview="We are so excited to have you join our community!",
                template_name="onboarding1",
                template_args={
                    "app_link": urls.app_link(),
                    "edit_profile_link": urls.edit_profile_link(),
                },
            )
        elif notification.key == "2":
            return CustomTemplatedEmail(
                subject="Complete your profile on Couchers.org",
                preview="We would ask one big favour of you: please fill out your profile by adding a photo and some text.",
                template_name="onboarding2",
                template_args={
                    "edit_profile_link": urls.edit_profile_link(),
                },
            )
    elif notification.topic_action == NotificationTopicAction.activeness__probe:
        title = "Are you still open to hosting on Couchers.org?"
        return CustomTemplatedEmail(
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
        return CustomTemplatedEmail(
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


def get_ics_attachment(notification: Notification, loc_context: LocalizationContext) -> EmailAttachment | None:
    data = notification.topic_action.data_type.FromString(notification.data)  # type: ignore[attr-defined]
    if notification.topic_action == NotificationTopicAction.host_request__accept:
        # Caveat: The surfer technically still hasn't confirmed, but when they do they don't receive an email,
        # so the accept notification is our last opportunity to provide them with a calendar event.
        return create_host_request_attachment(
            data.host_request, other_name=data.host.name, hosting=False, loc_context=loc_context
        )
    elif notification.topic_action == NotificationTopicAction.host_request__confirm:
        return create_host_request_attachment(
            data.host_request, other_name=data.surfer.name, hosting=True, loc_context=loc_context
        )
    elif notification.topic_action == NotificationTopicAction.host_request__cancel:
        # Caveat: only the party getting cancelled receives this notification,
        # we have no opportunity to provide the cancelling party with a cancelled ics attachment.
        return create_host_request_cancellation_attachment(
            data.host_request, other_name=data.surfer.name, hosting=True, loc_context=loc_context
        )
    else:
        return None


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


def get_topic_action_unsubscribe_text(topic_action: NotificationTopicAction) -> str:
    assert not topic_action.is_critical
    # Not localized because the design will change so avoid useless work by translators.
    match topic_action:
        case NotificationTopicAction.host_request__missed_messages:
            return "missed messages in host requests"
        case NotificationTopicAction.host_request__create:
            return "new host requests"
        case NotificationTopicAction.host_request__message:
            return "messages in host request"
        case NotificationTopicAction.host_request__accept:
            return "accepted host requests"
        case NotificationTopicAction.host_request__reject:
            return "declined host requests"
        case NotificationTopicAction.host_request__confirm:
            return "confirmed host requests"
        case NotificationTopicAction.host_request__cancel:
            return "cancelled host requests"
        case NotificationTopicAction.host_request__reminder:
            return "Pending host request reminders"
        case NotificationTopicAction.reference__receive_friend:
            return "new references from friends"
        case NotificationTopicAction.reference__receive_hosted:
            return "new references from hosts"
        case NotificationTopicAction.reference__receive_surfed:
            return "new references from surfers"
        case NotificationTopicAction.reference__reminder_hosted:
            return "hosted reference reminders"
        case NotificationTopicAction.reference__reminder_surfed:
            return "surfed reference reminders"
        case NotificationTopicAction.badge__add:
            return "badge additions"
        case NotificationTopicAction.badge__remove:
            return "badge removals"
        case NotificationTopicAction.chat__message:
            return "new chat messages"
        case NotificationTopicAction.chat__missed_messages:
            return "unseen chat messages"
        case NotificationTopicAction.event__create_approved:
            return "invitations to events (approved by moderators)"
        case NotificationTopicAction.event__create_any:
            return "new events by community members"
        case NotificationTopicAction.event__update:
            return "event updates"
        case NotificationTopicAction.event__cancel:
            return "event cancellations"
        case NotificationTopicAction.event__delete:
            return "event deletions"
        case NotificationTopicAction.event__invite_organizer:
            return "invitations to co-organize events"
        case NotificationTopicAction.event__reminder:
            return "event reminders"
        case NotificationTopicAction.event__comment:
            return "event comments"
        case NotificationTopicAction.discussion__create:
            return "new discussions"
        case NotificationTopicAction.discussion__comment:
            return "discussion comments"
        case NotificationTopicAction.thread__reply:
            return "comment replies"
        case NotificationTopicAction.friend_request__create:
            return "new friend requests"
        case NotificationTopicAction.friend_request__accept:
            return "accepted friend requests"
        case NotificationTopicAction.onboarding__reminder:
            return "onboarding emails"
        case NotificationTopicAction.postal_verification__postcard_sent:
            return "postal verification postcards"
        case NotificationTopicAction.general__new_blog_post:
            return "new blog post alerts"
        case _:
            raise ValueError(f"No topic-action unsubscribe text for {topic_action}")


def get_topic_key_unsubscribe_text(topic_action: NotificationTopicAction) -> str:
    assert can_unsubscribe_topic_key(topic_action)
    # Not localized because the design will change so avoid useless work by translators.
    match topic_action:
        case NotificationTopicAction.chat__message:
            return "this chat (mute)"
        case _:
            raise AssertionError(f"No topic-key description for {topic_action}")


def get_email_footer(user: User, notification: Notification, loc_context: LocalizationContext) -> EmailFooter:
    return EmailFooter(
        timezone_name=loc_context.localized_timezone,
        copyright_year=now().year,
        unsubscribe_info=UnsubscribeInfo(
            manage_notifications_url=urls.notification_settings_link(),
            do_not_email_url=generate_do_not_email(user),
            topic_action_link=UnsubscribeLink(
                text=get_topic_action_unsubscribe_text(notification.topic_action),
                url=generate_unsub_topic_action(notification),
            ),
            topic_key_link=UnsubscribeLink(
                text=get_topic_key_unsubscribe_text(notification.topic_action),
                url=generate_unsub_topic_key(notification),
            )
            if can_unsubscribe_topic_key(notification.topic_action)
            else None,
        )
        if not notification.topic_action.is_critical
        else None,
    )


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
