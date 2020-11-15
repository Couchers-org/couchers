import logging

from couchers import email
from couchers.config import config
from couchers.models import FriendRelationship, HostRequest, User

logger = logging.getLogger(__name__)


def send_signup_email(email_address, token, expiry_text):
    logger.info(f"Sending signup email to {email_address=}:")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    signup_link = f"{config['BASE_URL']}/signup/{token.token}"
    logger.info(f"Link is: {signup_link}")
    return email.send_email_template(
        email_address, "Finish signing up for Couchers.org", "signup", template_args={"signup_link": signup_link}
    )


def send_login_email(user, token, expiry_text):
    logger.info(f"Sending login email to {user=}:")
    logger.info(f"Email for {user.username=} to {user.email=}")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    login_link = f"{config['BASE_URL']}/login/{token.token}"
    logger.info(f"Link is: {login_link}")
    return email.send_email_template(
        user.email, "Your login link for Couchers.org", "login", template_args={"user": user, "login_link": login_link}
    )


def send_report_email(complaint):
    subject = "User Report"
    username_author = complaint.author_user.username
    username_reported = complaint.reported_user.username
    reason = complaint.reason
    description = complaint.description
    target_email = config["REPORTS_EMAIL_RECIPIENT"]

    logger.info(f"Sending report email to {target_email=}")
    logger.info(f"User {username_author=} reporting user {username_reported=}")
    logger.info(f"Reason: {reason=}")
    logger.info(f"Description:")
    logger.info(f"{description=}")
    return email.send_email_template(
        target_email,
        subject,
        "report",
        template_args={
            "username_author": username_author,
            "username_reported": username_reported,
            "reason": reason,
            "description": description,
        },
    )


def send_host_request_email(host_request):
    subject = "You've received a host request!"
    from_user = host_request.from_user
    to_user = host_request.to_user
    host_request_link = f"{config['BASE_URL']}/hostrequests/"

    logger.info(f"Sending host request email to {to_user=}:")
    logger.info(f"Host request sent by {from_user}")
    logger.info(f"Email for {to_user.username=} sent to {to_user.email=}")

    return email.send_email_template(
        to_user.email,
        subject,
        "host_request",
        template_args={
            "name_host": to_user.name,
            "name_guest": from_user.name,
            "from_date": host_request.from_date,
            "to_date": host_request.to_date,
            "host_request_link": host_request_link,
            "profile_picture_or_avatar": from_user.avatar_url,
        },
    )


def send_message_received_email(user_recipient):
    subject = "You've got mail!"
    messages_link = f"{config['BASE_URL']}/messages/"
    logger.info(f"Sending message received email to {user_recipient=}:")
    logger.info(f"Email for {user_recipient.username=} sent to {user_recipient.email=}")

    return email.send_email_template(
        user_recipient.email,
        subject,
        "message_received",
        template_args={"name": user_recipient.name, "messages_link": messages_link},
    )


def send_friend_request_email(friend_relationship):
    subject = "Someone wants to be your friend!"
    from_user = friend_relationship.from_user
    to_user = friend_relationship.to_user
    friend_requests_link = f"{config['BASE_URL']}/friends/"

    logger.info(f"Sending friend request email to {to_user=}:")
    logger.info(f"Email for {to_user.username=} sent to {to_user.email=}")
    logger.info(f"Friend request sent by {from_user.username=}")

    return email.send_email_template(
        to_user.email,
        subject,
        "friend_request",
        template_args={
            "name_recipient": to_user.name,
            "name_sender": from_user.name,
            "friend_requests_link": friend_requests_link,
            "profile_picture_or_avatar": from_user.avatar_url,
        },
    )
