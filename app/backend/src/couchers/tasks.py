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


def send_report_email(complaint):
    user_author = complaint.author_user_id
    user_reported = complaint.reported_user_id
    reason = complaint.reason
    description = complaint.description
    target_email = config['REPORTS_EMAIL_RECIPIENT']

    logger.info(f"Sending report email to {target_email}")
    logger.info(f"User {user_author.username=} reporting user {user_reported.username}")
    logger.info(f"Reason: {reason=}")
    logger.info(f"Description:")
    logger.info(f"{description=}")
    subject = "User Report"
    return email.send_email_template(target_email, subject, "report", template_args={"user_author": user_author.username, "reported_user": user_reported.username, "reason": reason, "description": description})
