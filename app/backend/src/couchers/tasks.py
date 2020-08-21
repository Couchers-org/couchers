import logging

from couchers import email
from couchers.config import config

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


def send_host_request_email(guest_user, host_user):
    pass


def send_message_received_email(user_sender, user_recipient):
    pass


def send_friend_request_email(user_sender, user_recipient):
    pass