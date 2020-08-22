import logging

from couchers import email
from couchers.config import config
from couchers.models import User, FriendRelationship, HostRequest

logger = logging.getLogger(__name__)


def send_signup_email(email_address, token, expiry_text):
    logger.info(f"Sending signup email to {email_address=}:")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    signup_link = f"{config['BASE_URL']}/signup/{token.token}"
    logger.info(f"Link is: {signup_link}")
    return email.send_email_template(email_address, "Finish signing up for Couchers.org", "signup", template_args={"signup_link": signup_link})


def send_login_email(user, token, expiry_text):
    logger.info(f"Sending login email to {user=}:")
    logger.info(f"Email for {user.username=} to {user.email=}")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    login_link = f"{config['BASE_URL']}/login/{token.token}"
    logger.info(f"Link is: {login_link}")
    return email.send_email_template(user.email, "Your login link for Couchers.org", "login", template_args={"user": user, "login_link": login_link})


def send_report_email(author_user, reported_user, reason, description):
    target_email = config['REPORTS_EMAIL_RECIPIENT']
    logger.info(f"Sending report email to {target_email}")
    logger.info(f"User {author_user.username=} reporting user {reported_user.username}")
    logger.info(f"Reason: {reason=}")
    logger.info(f"Description:")
    logger.info(f"{description=}")
    return email.send_email_template(target_email, "User Report", "report", template_args={"author": author_user.username, "reported_user": reported_user.username, "reason": reason, "description": description})


def send_host_request_email(host_request):
    user_guest = host_request.from_user
    user_host = host_request.to_user

    logger.info(f"Sending host request email to {user_host=}:")
    logger.info(f"Host request sent by {user_guest}")
    logger.info(f"Email for {user_host.username=} sent to {user_host.email=}")
    host_request_link = f"{config['BASE_URL']}/hostrequests/"
    subject = "You've received a host request!"
    return email.send_email_template(user_host.email, subject, "host_request", template_args={"name_host": user_host.name,
                                        "name_guest": user_guest.name, "from_date": host_request.from_date,
                                        "to_date": host_request.to_date, "host_request_link": host_request_link,
                                        "profile_picture_or_avatar": user_guest.avatar_url})


def send_message_received_email(user_recipient):
    logger.info(f"Sending message received email to {user_recipient=}:")
    logger.info(f"Email for {user_recipient.username=} sent to {user_recipient.email=}")
    messages_link = f"{config['BASE_URL']}/messages/"
    subject = "You've got mail!"
    return email.send_email_template(user_recipient.email, subject, "message_received", template_args={"name": user_recipient.name, "messages_link": messages_link})


def send_friend_request_email(friend_relationship):
    user_sender = friend_relationship.from_user
    user_recipient = friend_relationship.to_user

    logger.info(f"Sending friend request email to {user_recipient=}:")
    logger.info(f"Email for {user_recipient.username=} sent to {user_recipient.email=}")
    logger.info(f"Friend request sent by {user_sender.username=}")
    friend_requests_link = f"{config['BASE_URL']}/friends/"
    subject = "Someone wants to be your friend!"
    return email.send_email_template(user_recipient.email, subject, "friend_request", template_args={"name_recipient": user_recipient.name,
                                        "name_sender": user_sender.name, "friend_requests_link": friend_requests_link,
                                        "profile_picture_or_avatar": user_sender.avatar_filename})
