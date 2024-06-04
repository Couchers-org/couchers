import logging
from dataclasses import dataclass

from couchers import urls
from couchers.notifications.unsubscribe import generate_unsub
from couchers.templates.v2 import v2avatar, v2date, v2esc, v2phone, v2timestamp

logger = logging.getLogger(__name__)


@dataclass(kw_only=True)
class RenderedNotification:
    # whether the notification is critical and cannot be turned off
    is_critical: bool = False
    # email subject
    email_subject: str
    # shows up when listing emails in many clients
    email_preview: str
    # corresponds to .mjml + .txt file in templates/v2
    email_template_name: str
    # other template args
    email_template_args: dict
    # the link label on the topic_action unsubscribe link
    email_topic_action_unsubscribe_text: str = None
    # the link label on the topic_key unsubscribe link
    email_topic_key_unsubscribe_text: str = None
    # url to unsubscribe with one click
    email_list_unsubscribe_url: str = None
    # push notification title
    push_title: str
    # push notification content
    push_body: str
    # url to an icon for push notifications
    push_icon: str
    # url to where clicking on the notification should take you
    push_url: str


def render_notification(user, notification) -> RenderedNotification:
    data = notification.topic_action.data_type.FromString(notification.data)
    if notification.topic == "host_request":
        view_link = urls.host_request(host_request_id=data.host_request.host_request_id)
        if notification.action in ["create", "message"]:
            if notification.action == "create":
                other = data.surfer
                message = f"{other.name} sent you a host request"
                topic_action_unsub_text = "new host requests"
            elif notification.action == "message":
                other = data.user
                if data.am_host:
                    message = f"{other.name} sent you a message in their host request"
                else:
                    message = f"{other.name} sent you a message in your host request"
                topic_action_unsub_text = "messages in host request"
            return RenderedNotification(
                email_subject=message,
                email_preview=message,
                email_template_name="host_request__message",
                email_template_args={
                    "view_link": view_link,
                    "host_request": data.host_request,
                    "message": message,
                    "other": other,
                    "text": data.text,
                },
                email_topic_action_unsubscribe_text=topic_action_unsub_text,
                push_title=f"{message}",
                push_body=f"Dates: {v2date(data.host_request.from_date, user)} to {v2date(data.host_request.to_date, user)}.\n\n{data.text}",
                push_icon=v2avatar(other),
                push_url=view_link,
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
                "reject": "rejected",
                "confirm": "confirmed",
                "cancel": "cancelled",
            }[notification.action]
            # "rejected your host request", or similar
            message = f"{other.name} {actioned} {their_your} host request"
            return RenderedNotification(
                email_subject=message,
                email_preview=message,
                email_template_name="host_request__plain",
                email_template_args={
                    "view_link": view_link,
                    "host_request": data.host_request,
                    "message": message,
                    "other": other,
                },
                email_topic_action_unsubscribe_text=f"{actioned} host requests",
                push_title=message,
                push_body="Check the app for more info.",
                push_icon=v2avatar(other),
                push_url=view_link,
            )
    elif notification.topic_action.display == "password:change":
        title = "Your password was changed"
        message = "Your login password for Couchers.org was changed."
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview=message,
            email_template_name="security",
            email_template_args={
                "title": title,
                "message": message,
            },
            push_title=title,
            push_body=message,
            push_icon=urls.icon_url(),
            push_url=urls.account_settings_link(),
        )
    elif notification.topic_action.display == "password_reset:start":
        message = "Someone initiated a password change on your account."
        return RenderedNotification(
            is_critical=True,
            email_subject="Reset your Couchers.org password",
            email_preview=message,
            email_template_name="password_reset",
            email_template_args={
                "password_reset_link": urls.password_reset_link(password_reset_token=data.password_reset_token)
            },
            push_title="A password reset was initiated on your account",
            push_body=message,
            push_icon=urls.icon_url(),
            push_url=urls.account_settings_link(),
        )
    elif notification.topic_action.display == "password_reset:complete":
        title = "Your password was successfully reset"
        message = "Your password on Couchers.org was changed. If that was you, then no further action is needed."
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview=title,
            email_template_name="security",
            email_template_args={
                "title": title,
                "message": message,
            },
            push_title=title,
            push_body=message,
            push_icon=urls.icon_url(),
            push_url=urls.account_settings_link(),
        )
    elif notification.topic_action.display == "email_address:change":
        title = "An email change was initiated on your account"
        message = f"An email change to the email <b>{data.new_email}</b> was initiated on your account."
        message_plain = f"An email change to the email {data.new_email} was initiated on your account."
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview=title,
            email_template_name="security",
            email_template_args={
                "title": title,
                "message": message,
            },
            push_title=title,
            push_body=message_plain,
            push_icon=urls.icon_url(),
            push_url=urls.account_settings_link(),
        )
    elif notification.topic_action.display == "email_address:verify":
        title = "Email change completed"
        message = "Your new email address has been verified."
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview=message,
            email_template_name="security",
            email_template_args={
                "title": title,
                "message": message,
            },
            push_title=title,
            push_body=message,
            push_icon=urls.icon_url(),
            push_url=urls.account_settings_link(),
        )
    elif notification.topic_action.display == "phone_number:change":
        title = "Phone verification started"
        message = f"You started phone number verification with the number <b>{v2phone(data.phone)}</b>."
        message_plain = f"You started phone number verification with the number {v2phone(data.phone)}."
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview=message,
            email_template_name="security",
            email_template_args={
                "title": title,
                "message": message,
            },
            push_title=title,
            push_body=message_plain,
            push_icon=urls.icon_url(),
            push_url=urls.feature_preview_link(),
        )
    elif notification.topic_action.display == "phone_number:verify":
        title = "Phone successfully verified"
        message = f"Your phone was successfully verified as <b>{v2phone(data.phone)}</b> on Couchers.org."
        message_plain = f"Your phone was successfully verified as {v2phone(data.phone)} on Couchers.org."
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview=message_plain,
            email_template_name="security",
            email_template_args={
                "title": title,
                "message": message,
            },
            push_title=title,
            push_body=message_plain,
            push_icon=urls.icon_url(),
            push_url=urls.feature_preview_link(),
        )
    elif notification.topic_action.display == "gender:change":
        title = "Your gender was changed"
        message = f"Your gender on Couchers.org was changed to <b>{data.gender}</b> by an admin."
        message_plain = f"Your gender on Couchers.org was changed to {data.gender} by an admin."
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview=message_plain,
            email_template_name="security",
            email_template_args={
                "title": title,
                "message": message,
            },
            push_title=title,
            push_body=message_plain,
            push_icon=urls.icon_url(),
            push_url=urls.account_settings_link(),
        )
    elif notification.topic_action.display == "birthdate:change":
        title = "Your date of birth was changed"
        message = (
            f"Your date of birth on Couchers.org was changed to <b>{v2date(data.birthdate, user)}</b> by an admin."
        )
        message_plain = f"Your date of birth on Couchers.org was changed to {v2date(data.birthdate, user)} by an admin."
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview=message_plain,
            email_template_name="security",
            email_template_args={
                "title": title,
                "message": message,
            },
            push_title=title,
            push_body=message_plain,
            push_icon=urls.icon_url(),
            push_url=urls.account_settings_link(),
        )
    elif notification.topic_action.display == "api_key:create":
        return RenderedNotification(
            is_critical=True,
            email_subject="Your API key for Couchers.org",
            email_preview="We have issued you an API key as per your request.",
            email_template_name="api_key",
            email_template_args={
                "api_key": data.api_key,
                "expiry": data.expiry,
            },
            push_title="An API key was created for your account",
            push_body="Details were sent to you via email.",
            push_icon=urls.icon_url(),
            push_url=urls.app_link(),
        )
    elif notification.topic_action.display in ["badge:add", "badge:remove"]:
        actioned = "added to" if notification.action == "add" else "removed from"
        title = f"The {data.badge_name} badge was {actioned} your profile"
        return RenderedNotification(
            email_subject=title,
            email_preview=title,
            email_template_name="badge",
            email_template_args={
                "badge_name": data.badge_name,
                "actioned": actioned,
                "unsub_type": "badge additions" if notification.action == "add" else "badge removals",
            },
            email_topic_action_unsubscribe_text="badge additions" if notification.action == "add" else "badge removals",
            push_title=title,
            push_body=(
                "Check out your profile to see the new badge!"
                if notification.action == "add"
                else "You can see all your badges on your profile."
            ),
            push_icon=urls.icon_url(),
            push_url=urls.profile_link(),
            email_list_unsubscribe_url=generate_unsub(user, notification, "topic_action"),
        )
    elif notification.topic_action.display == "donation:received":
        title = f"Thank you for your donation to Couchers.org!"
        message = f"Thank you so much for your donation of ${data.amount} to Couchers.org."
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview=message,
            email_template_name="donation_received",
            email_template_args={
                "amount": data.amount,
                "receipt_url": data.receipt_url,
            },
            push_title=title,
            push_body=message,
            push_icon=urls.icon_url(),
            push_url=data.receipt_url,
        )
    elif notification.topic_action.display == "friend_request:create":
        other = data.other_user
        preview = f"You've received a friend request from {other.name}"
        return RenderedNotification(
            email_subject=f"{other.name} wants to be your friend on Couchers.org!",
            email_preview=preview,
            email_template_name="friend_request",
            email_template_args={
                "friend_requests_link": urls.friend_requests_link(),
                "other": other,
            },
            email_topic_action_unsubscribe_text="new friend requests",
            push_title=f"{other.name} wants to be your friend",
            push_body=preview,
            push_icon=v2avatar(other),
            push_url=urls.friend_requests_link(),
        )
    elif notification.topic_action.display == "friend_request:accept":
        other = data.other_user
        title = f"{other.name} accepted your friend request!"
        preview = f"{v2esc(other.name)} has accepted your friend request"
        return RenderedNotification(
            email_subject=title,
            email_preview=preview,
            email_template_name="friend_request_accepted",
            email_template_args={
                "other_user_link": urls.user_link(username=other.username),
                "other": other,
            },
            email_topic_action_unsubscribe_text="accepted friend requests",
            push_title=title,
            push_body=preview,
            push_icon=v2avatar(other),
            push_url=urls.user_link(username=other.username),
        )
    elif notification.topic_action.display == "account_deletion:start":
        return RenderedNotification(
            is_critical=True,
            email_subject="Confirm your Couchers.org account deletion",
            email_preview="Please confirm that you want to delete your Couchers.org account.",
            email_template_name="account_deletion_start",
            email_template_args={
                "deletion_link": urls.delete_account_link(account_deletion_token=data.deletion_token),
            },
            push_title="Account deletion initiated",
            push_body="Someone initiated the deletion of your Couchers.org account. To delete your account, please follow the link in the email we sent you.",
            push_icon=urls.icon_url(),
            push_url=urls.app_link(),
        )
    elif notification.topic_action.display == "account_deletion:complete":
        title = f"Your Couchers.org account has been deleted"
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview="We have deleted your Couchers.org account, to undo, follow the link in this email.",
            email_template_name="account_deletion_complete",
            email_template_args={
                "undelete_link": urls.recover_account_link(account_undelete_token=data.undelete_token),
                "days": data.undelete_days,
            },
            push_title=title,
            push_body=f"You can still undo this by following the link we emailed to you within {data.undelete_days} days.",
            push_icon=urls.icon_url(),
            push_url=urls.app_link(),
        )
    elif notification.topic_action.display == "account_deletion:recovered":
        title = f"Your Couchers.org account has been recovered!"
        subtitle = f"We have recovered your Couchers.org account as per your request! Welcome back!"
        return RenderedNotification(
            is_critical=True,
            email_subject=title,
            email_preview=subtitle,
            email_template_name="account_deletion_recovered",
            email_template_args={
                "app_link": urls.app_link(),
            },
            push_title=title,
            push_body=subtitle,
            push_icon=urls.icon_url(),
            push_url=urls.app_link(),
        )
    elif notification.topic_action.display == "chat:message":
        return RenderedNotification(
            email_subject=data.message,
            email_preview=f"You received a message on Couchers.org!",
            email_template_name="chat_message",
            email_template_args={
                "author": data.author,
                "message": data.message,
                "text": data.text,
                "view_link": urls.chat_link(chat_id=data.group_chat_id),
            },
            email_topic_action_unsubscribe_text="new chat messages",
            email_topic_key_unsubscribe_text="this chat (mute)",
            push_title=data.message,
            push_body=data.text,
            push_icon=v2avatar(data.author),
            push_url=urls.chat_link(chat_id=data.group_chat_id),
        )
    elif notification.topic == "event":
        event = data.event
        time_display = f"{v2timestamp(event.start_time, user)} - {v2timestamp(event.end_time, user)}"
        event_link = urls.event_link(occurrence_id=event.event_id, slug=event.slug)
        if notification.action in ["create_approved", "create_any"]:
            body = f"{time_display}\n"
            body += f"Invited by {data.inviting_user.name}\n\n"
            body += event.content
            community_link = (
                urls.community_link(node_id=data.in_community.community_id, slug=data.in_community.slug)
                if data.in_community
                else None
            )
            return RenderedNotification(
                email_subject=f'{data.inviting_user.name} invited you to "{event.title}"',
                email_preview=f"You've been invited to a new event on Couchers.org!",
                email_template_name="event_create",
                email_template_args={
                    "inviting_user": data.inviting_user,
                    "time_display": time_display,
                    "nearby": "nearby" if data.nearby else None,
                    "community": data.in_community if data.in_community else None,
                    "community_link": community_link,
                    "nearby_or_community_text_plain": (
                        "nearby" if data.nearby else f"in the {data.in_community.name} community"
                    ),
                    "event": event,
                    "view_link": event_link,
                },
                email_topic_action_unsubscribe_text=(
                    "new events by community members"
                    if notification.action == "create_any"
                    else "new events approved by moderators"
                ),
                push_title=f'{data.inviting_user.name} invited you to "{event.title}"',
                push_body=body,
                push_icon=v2avatar(data.inviting_user),
                push_url=event_link,
            )
        elif notification.action == "update":
            updated_text = ", ".join(data.updated_items)
            body = f"{time_display}\n"
            body += f"{data.updating_user.name} updated: {updated_text}\n\n"
            body += event.content
            return RenderedNotification(
                email_subject=f'{data.updating_user.name} updated "{event.title}"',
                email_preview=f"An event you are subscribed to was updated.",
                email_template_name="event_update",
                email_template_args={
                    "updating_user": data.updating_user,
                    "time_display": time_display,
                    "event": event,
                    "updated_text": updated_text,
                    "view_link": event_link,
                },
                email_topic_action_unsubscribe_text="event updates",
                push_title=f'{data.updating_user.name} updated "{event.title}"',
                push_body=body,
                push_icon=v2avatar(data.updating_user),
                push_url=event_link,
            )
        elif notification.action == "invite_organizer":
            body = f"{time_display}\n"
            body += f"Invited to co-organize by {data.inviting_user.name}\n\n"
            body += event.content
            return RenderedNotification(
                email_subject=f'{data.inviting_user.name} invited you to co-organize "{event.title}"',
                email_preview=f"You were invited to co-organize an event on Couchers.org.",
                email_template_name="event_invite_organizer",
                email_template_args={
                    "inviting_user": data.inviting_user,
                    "time_display": time_display,
                    "event": event,
                    "view_link": event_link,
                },
                email_topic_action_unsubscribe_text="invitations to co-organize",
                push_title=f'{data.inviting_user.name} invited you to co-organize "{event.title}"',
                push_body=body,
                push_icon=v2avatar(data.inviting_user),
                push_url=event_link,
            )
    elif notification.topic == "reference":
        if notification.action == "receive_friend":
            title = f"You've received a friend reference from {data.from_user.name}!"
            return RenderedNotification(
                email_subject=title,
                email_preview=v2esc(data.text),
                email_template_name="friend_reference",
                email_template_args={
                    "from_user": data.from_user,
                    "profile_references_link": urls.profile_references_link(),
                    "text": data.text,
                },
                email_topic_action_unsubscribe_text="new references from friends",
                push_title=title,
                push_body=data.text,
                push_icon=v2avatar(data.from_user),
                push_url=urls.profile_references_link(),
            )
        elif notification.action in ["receive_hosted", "receive_surfed"]:
            title = f"You've received a reference from {data.from_user.name}!"
            # what was my type? i surfed with them if i received a "hosted" request
            surfed = (notification.action == "receive_hosted",)
            leave_reference_link = urls.leave_reference_link(
                reference_type="surfed" if surfed else "hosted",
                to_user_id=data.from_user.user_id,
                host_request_id=data.host_request_id,
            )
            profile_references_link = urls.profile_references_link()
            if data.text:
                body = v2esc(data.text)
                push_url = profile_references_link
            else:
                body = "Please go and write a reference for them too. It's a nice gesture and helps us build a community together!"
                push_url = leave_reference_link
            return RenderedNotification(
                email_subject=title,
                email_preview=body,
                email_template_name="host_reference",
                email_template_args={
                    "from_user": data.from_user,
                    "leave_reference_link": leave_reference_link,
                    "profile_references_link": profile_references_link,
                    "text": data.text,
                    "both_written": True if data.text else False,
                    "surfed": surfed,
                },
                email_topic_action_unsubscribe_text="new references from " + "hosts" if surfed else "surfers",
                push_title=title,
                push_body=body,
                push_icon=v2avatar(data.from_user),
                push_url=push_url,
            )
        elif notification.action in ["reminder_hosted", "reminder_surfed"]:
            # what was my type? i surfed with them if i get a surfed reminder
            surfed = (notification.action == "reminder_surfed",)
            leave_reference_link = urls.leave_reference_link(
                reference_type="surfed" if surfed else "hosted",
                to_user_id=data.other_user.user_id,
                host_request_id=data.host_request_id,
            )
            title = f"You have {data.days_left} days to write a reference for {data.other_user.name}!"
            preview = "It's a nice gesture to write references and helps us build a community together! References will become visible 2 weeks after the stay, or when you've both written a reference for each other, whichever happens first."
            return RenderedNotification(
                email_subject=title,
                email_preview=preview,
                email_template_name="reference_reminder",
                email_template_args={
                    "other_user": data.other_user,
                    "leave_reference_link": leave_reference_link,
                    "days_left": str(data.days_left),
                    "surfed": surfed,
                },
                email_topic_action_unsubscribe_text="surfed" if surfed else "hosted" + " reference reminders",
                push_title=title,
                push_body=preview,
                push_icon=v2avatar(data.other_user),
                push_url=leave_reference_link,
            )
    else:
        raise NotImplementedError(f"Unknown topic-action: {notification.topic}:{notification.action}")
