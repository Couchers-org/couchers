from couchers import urls
from couchers.email.v2 import email_user
from couchers.models import Notification, User
from couchers.notifications.unsubscribe import (
    generate_do_not_email,
    generate_unsub,
    generate_unsub_topic_action,
    generate_unsub_topic_key,
)


def get_template_and_args(notification, data):
    if notification.topic == "host_request":
        args = {
            "view_link": urls.host_request(host_request_id=data.host_request_info.host_request_id),
            "host_request_info": data.host_request_info,
        }
        if notification.action == "create":
            args["other"] = data.surfer_info
            args["text"] = data.text
            args["message"] = "sent you a host request"
            return "host_request__message", args
        elif notification.action == "message":
            args["other"] = data.user_info
            args["text"] = data.text
            args["message"] = "sent you a message in " + ("their" if data.am_host else "your") + " host request"
            return "host_request__message", args
        elif notification.action in ["accept", "reject", "confirm", "cancel"]:
            if notification.action in ["accept", "reject"]:
                args["other"] = data.host_info
                their_your = "your"
            else:
                args["other"] = data.surfer_info
                their_your = "their"
            actioned = {
                "accept": "accepted",
                "reject": "rejected",
                "confirm": "confirmed",
                "cancel": "cancelled",
            }[notification.action]
            # "Aapeli rejected your host request", or similar
            args["message"] = f"{actioned} {their_your} host request"
            return "host_request__plain", args
    elif notification.topic_action.display == "password:change":
        args = {
            "title": "Your password was changed",
            "message": "Your login password for Couchers.org was changed.",
        }
        return "security", args
    elif notification.topic_action.display == "email_address:change":
        args = {
            "title": "Email change was initiated",
            "message": f"An email change to the email <b>{data.new_email}</b> was initiated on your account.",
            "preview": f"An email change was initiated on your account.",
        }
        return "security", args
    elif notification.topic_action.display == "email_address:verify":
        args = {
            "title": "Email change completed",
            "message": f"Your new email address has been verified.",
            "preview": f"Your new email address has been verified.",
        }
        return "security", args
    elif notification.topic_action.display == "phone_number:change":
        args = {
            "title": "Phone verification started",
            "message": f"You started phone number verification with the number <b>{data.phone}</b>.",
            "preview": f"You started phone number verification.",
        }
        return "security", args
    elif notification.topic_action.display == "phone_number:verify":
        args = {
            "title": "Phone verification successful",
            "message": f"Your phone was successfully verified as <b>{data.phone}</b> on Couchers.org.",
            "preview": f"Your phone was successfully verified.",
        }
        return "security", args
    elif notification.topic_action.display == "gender:change":
        args = {
            "title": "Your gender was changed",
            "message": f"Your gender on Couchers.org was changed by an admin to <b>{data.gender}</b>.",
            "preview": f"Your gender on Couchers.org was changed by an admin.",
        }
        return "security", args
    elif notification.topic_action.display == "birthdate:change":
        args = {
            "title": "Your date of birth was changed",
            "message": f"Your date of birth on Couchers.org was changed by an admin to <b>{data.birthdate}</b>.",
            "preview": f"Your date of birth on Couchers.org was changed by an admin.",
        }
        return "security", args
    elif notification.topic_action.display in ["badge:add", "badge:remove"]:
        args = {
            "badge_name": data.badge_name,
            "actioned": "added to" if notification.action == "add" else "removed from",
            "unsub_type": "badge additions" if notification.action == "add" else "badge removals",
        }
        return "badge", args
    else:
        raise NotImplementedError(f"Unknown topic-action: {notification.topic}:{notification.action}")


def _render_template(notification):
    pass


def send_email_notification(user: User, notification: Notification):
    def _generate_unsub(type, one_click=False):
        return generate_unsub(user, notification, type, one_click)

    data = notification.topic_action.data_type.FromString(notification.data)
    template_name, args = get_template_and_args(notification, data)
    default_args = {
        "user": user,
        "time": notification.created,
        "_unsub": _generate_unsub,
        "_unsub_do_not_email": generate_do_not_email(notification.user_id),
        "_unsub_topic_key": generate_unsub_topic_key(notification),
        "_unsub_topic_action": generate_unsub_topic_action(notification),
        "_manage_notification_settings": urls.feature_preview_link(),
    }
    email_user(user, template_name, {**default_args, **args})
