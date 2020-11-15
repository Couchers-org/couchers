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
    target_email = config["REPORTS_EMAIL_RECIPIENT"]

    logger.info(f"Sending report email to {target_email=}")
    logger.info(f"User {complaint=} reporting user {complaint.reported_user.username=}")
    logger.info(f"Reason: {complaint.reason=}")
    logger.info(f"Description:")
    logger.info(f"{complaint.description=}")
    return email.send_email_template(
        target_email,
        "User Report",
        "report",
        template_args={
            "complaint": complaint,
        },
    )


def send_host_request_email(host_request):
    host_request_link = f"{config['BASE_URL']}/hostrequests/"

    logger.info(f"Sending host request email to {host_request.to_user=}:")
    logger.info(f"Host request sent by {host_request.from_user}")
    logger.info(f"Email for {host_request.to_user.username=} sent to {host_request.to_user.email=}")

    return email.send_email_template(
        host_request.to_user.email,
        "You've received a host request!",
        "host_request",
        template_args={
            "host_request": host_request,
            "host_request_link": host_request_link,
        },
    )


def send_message_received_email(user_recipient):
    messages_link = f"{config['BASE_URL']}/messages/"
    logger.info(f"Sending message received email to {user_recipient=}:")
    logger.info(f"Email for {user_recipient.username=} sent to {user_recipient.email=}")

    return email.send_email_template(
        user_recipient.email,
        "You've got mail!",
        "message_received",
        template_args={
            "user": user_recipient,
            "messages_link": messages_link,
        },
    )


def send_friend_request_email(friend_relationship):
    friend_requests_link = f"{config['BASE_URL']}/friends/"

    logger.info(f"Sending friend request email to {friend_relationship.to_user=}:")
    logger.info(f"Email for {friend_relationship.to_user.username=} sent to {friend_relationship.to_user.email=}")
    logger.info(f"Friend request sent by {friend_relationship.from_user.username=}")

    return email.send_email_template(
        friend_relationship.to_user.email,
        "Someone wants to be your friend!",
        "friend_request",
        template_args={
            "friend_relationship": friend_relationship,
            "friend_requests_link": friend_requests_link,
        },
    )
