import logging
from dataclasses import dataclass

from couchers import urls
from couchers.models import Notification, User
from couchers.notifications.push import push_to_user
from couchers.notifications.unsubscribe import (
    generate_do_not_email,
    generate_unsub,
    generate_unsub_topic_action,
    generate_unsub_topic_key,
)
from couchers.templates.v2 import email_user, v2avatar, v2date, v2phone

logger = logging.getLogger(__name__)


@dataclass
class NotificationData:
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


def get_notification_data(user, notification, data) -> NotificationData:
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
            return NotificationData(
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
            return NotificationData(
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
        return NotificationData(
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
        return NotificationData(
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
        return NotificationData(
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
        return NotificationData(
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
        return NotificationData(
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
        return NotificationData(
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
        return NotificationData(
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
    elif notification.topic_action.display in ["badge:add", "badge:remove"]:
        actioned = "added to" if notification.action == "add" else "removed from"
        title = f"The {data.badge_name} badge was {actioned} your profile"
        return NotificationData(
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
    else:
        raise NotImplementedError(f"Unknown topic-action: {notification.topic}:{notification.action}")


def _render_template(notification):
    pass


def send_email_notification(user: User, notification: Notification):
    def _generate_unsub(type, one_click=False):
        return generate_unsub(user, notification, type, one_click)

    data = notification.topic_action.data_type.FromString(notification.data)
    notification_data = get_notification_data(user, notification, data)
    default_args = {
        "user": user,
        "time": notification.created,
        "_unsub": _generate_unsub,
        "_unsub_do_not_email": generate_do_not_email(notification.user_id),
        "_unsub_topic_key": generate_unsub_topic_key(notification),
        "_unsub_topic_action": generate_unsub_topic_action(notification),
        "_manage_notification_settings": urls.feature_preview_link(),
    }

    frontmatter = {
        "is_critical": notification_data.is_critical,
        "subject": notification_data.email_subject,
        "preview": notification_data.email_preview,
    }

    email_user(
        user,
        notification_data.email_template_name,
        {**default_args, **notification_data.email_template_args},
        frontmatter=frontmatter,
    )


def send_push_notification(user: User, notification: Notification):
    logger.debug(f"Formatting push notification for {user}")

    data = notification.topic_action.data_type.FromString(notification.data)
    notification_data = get_notification_data(user, notification, data)

    push_to_user(
        user.id,
        title=notification_data.push_title,
        body=notification_data.push_body,
        icon=notification_data.push_icon,
        # url=notification_data.push_url,
    )
