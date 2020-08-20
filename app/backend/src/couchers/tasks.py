import logging

from couchers import email
from couchers.config import config
from couchers.models import User, FriendRelationship

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


def send_host_request_email(user_guest, user_host):
    logger.info(f"Sending host request email to {user_host=}:")
    logger.info(f"Host request sent by {user_guest}")
    logger.info(f"Email for {user_host.username=} sent to {user_host.email=}")
    host_request_link = f"{config['BASE_URL']}/hostrequests/"
    subject = "You've received a host request!"
    return email.send_email_template(user_host.email, subject, "host_request", template_args={"user": user_host, "host_request_link": host_request_link})


def send_message_received_email(user_recipient):
    logger.info(f"Sending message received email to {user_recipient=}:")
    logger.info(f"Email for {user_recipient.username=} sent to {user_recipient.email=}")
    messages_link = f"{config['BASE_URL']}/messages/"
    subject = "You've got mail!"
    return email.send_email_template(user_recipient.email, subject, "message_received", template_args={"user": user_recipient, "messages_link": messages_link})


def send_friend_request_email(FriendRelationship, session):
    user_sender_id = FriendRelationship.from_user_id
    user_recipient_id = FriendRelationship.to_user_id
    user_sender = session.query(User).filter(User.id == user_sender_id).one()
    user_recipient = session.query(User).filter(User.id == user_recipient_id).one()

    logger.info(f"Sending friend request email to {user_recipient=}:")
    logger.info(f"Email for {user_recipient.username=} sent to {user_recipient.email=}")
    logger.info(f"Friend request sent by {user_sender=}")
    friend_requests_link = f"{config['BASE_URL']}/friends/"
    subject = "Someone wants to be your friend!"
    return email.send_email_template(user_recipient.email, subject, "friend_request", template_args={"user": user_recipient, "friend_requests_link": friend_requests_link})