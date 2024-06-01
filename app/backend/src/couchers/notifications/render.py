import logging
from dataclasses import dataclass

from couchers import urls
from couchers.notifications.unsubscribe import generate_unsub
from couchers.templates.v2 import v2avatar, v2date, v2phone, v2timestamp

logger = logging.getLogger(__name__)


@dataclass
class RenderedNotification:
    # whether the notification is critical and cannot be turned off
    is_critical: bool
    # email subject
    email_subject: str
    # shows up when listing emails in many clients
    email_preview: str
    # corresponds to .mjml + .txt file in templates/v2
    email_template_name: str
    # other template args
    email_template_args: dict
    # push notification title
    push_title: str
    # push notification content
    push_body: str
    # url to an icon for push notifications
    push_icon: str
    # url to where clicking on the notification should take you
    push_url: str
    # url to unsubscribe with one click
    list_unsubscribe_url: str = None


def render_notification(user, notification, data) -> RenderedNotification:
    if notification.topic == "host_request":
        view_link = urls.host_request(host_request_id=data.host_request_info.host_request_id)
        if notification.action in ["create", "message"]:
            if notification.action == "create":
                other = data.surfer_info
                message = f"{other.name} sent you a host request"
            elif notification.action == "message":
                other = data.user_info
                message = (
                    f"{other.name} sent you a message in " + ("their" if data.am_host else "your") + " host request"
                )
            return RenderedNotification(
                is_critical=False,
                email_subject=message,
                email_preview=message,
                email_template_name="host_request__message",
                email_template_args={
                    "view_link": view_link,
                    "host_request_info": data.host_request_info,
                    "message": message,
                    "other": other,
                    "text": data.text,
                },
                push_title=f"{message}",
                push_body=f"Dates: {v2date(data.host_request_info.from_date, user)} to {v2date(data.host_request_info.to_date, user)}.\n\n{data.text}",
                push_icon=v2avatar(other),
                push_url=view_link,
            )
        elif notification.action in ["accept", "reject", "confirm", "cancel"]:
            if notification.action in ["accept", "reject"]:
                other = data.host_info
                their_your = "your"
            else:
                other = data.surfer_info
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
                is_critical=False,
                email_subject=message,
                email_preview=message,
                email_template_name="host_request__plain",
                email_template_args={
                    "view_link": view_link,
                    "host_request_info": data.host_request_info,
                    "message": message,
                    "other": other,
                },
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
            push_body=message,
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
            email_subject="Your Couchers.org API key",
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
            is_critical=False,
            email_subject=title,
            email_preview=title,
            email_template_name="badge",
            email_template_args={
                "badge_name": data.badge_name,
                "actioned": actioned,
                "unsub_type": "badge additions" if notification.action == "add" else "badge removals",
            },
            push_title=title,
            push_body="Check out your profile to see the new badge!",
            push_icon=urls.icon_url(),
            push_url=urls.profile_link(),
            list_unsubscribe_url=generate_unsub(user, notification, "topic_action"),
        )
    elif notification.topic_action.display == "donation:received":
        title = f"Thank you for your donation to Couchers.org!"
        message = f"Thank you so much for your donation of ${amount} to Couchers.org."
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
        other = data.other_user_info
        title = f"{other.name} wants to be your friend on Couchers.org!"
        preview = f"You've received a friend request from {other.name}"
        return RenderedNotification(
            is_critical=False,
            email_subject=title,
            email_preview=preview,
            email_template_name="friend_request",
            email_template_args={
                "friend_requests_link": urls.friend_requests_link(),
                "other": other,
            },
            push_title=title,
            push_body=preview,
            push_icon=v2avatar(other),
            push_url=urls.friend_requests_link(),
        )
    elif notification.topic_action.display == "friend_request:accept":
        other = data.other_user_info
        title = f"{other.name} accepted your friend request!"
        preview = f"{other.name} has accepted your friend request"
        return RenderedNotification(
            is_critical=False,
            email_subject=title,
            email_preview=preview,
            email_template_name="friend_request_accepted",
            email_template_args={
                "other_user_link": urls.user_link(username=other.username),
                "other": other,
            },
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
            is_critical=True,
            email_subject=data.message,
            email_preview=f"You received a message on Couchers.org!",
            email_template_name="chat_message",
            email_template_args={
                "author": data.author_info,
                "message": data.message,
                "text": data.text,
                "view_link": urls.chat_link(chat_id=data.group_chat_id),
            },
            push_title=data.message,
            push_body=data.text,
            push_icon=v2avatar(data.author_info),
            push_url=urls.chat_link(chat_id=data.group_chat_id),
        )
    elif notification.topic_action.display in ["event:create_approved", "event:create_any"]:
        event = data.event_info.event
        time_display = f"{v2timestamp(event.start_time, user)} - {v2timestamp(event.start_time, user)}"
        body = f"<b>{time_display}</b>\n"
        body += f"Invited by {data.inviting_user.name}\n\n"
        body += event.content
        event_link = urls.event_link(occurrence_id=event.event_id, slug=event.slug)
        community_link = (
            urls.community_link(node_id=data.in_community.community_id, slug=data.in_community.slug)
            if data.in_community
            else None
        )
        return RenderedNotification(
            is_critical=False,
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
            push_title=f'{data.inviting_user.name} invited you to "{event.title}"',
            push_body=body,
            push_icon=v2avatar(data.inviting_user),
            push_url=event_link,
        )
    else:
        raise NotImplementedError(f"Unknown topic-action: {notification.topic}:{notification.action}")
