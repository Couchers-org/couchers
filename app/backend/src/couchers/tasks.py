import logging

from couchers import email

logger = logging.getLogger(__name__)

def send_signup_email(email, token, expiry_text):
    logger.info(f"Pretending to send signup email to {email=}:")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    signup_link = f"http://localhost:8080/signup/{token.token}"
    logger.info(f"Link is: {signup_link}")
    email.send_email(email, "Finish signing up for Couchers.org", "signup", template_args={"signup_link": signup_link})


def send_login_email(user, token, expiry_text):
    logger.info(f"Pretending to send login email to {user=}:")
    logger.info(f"Email for {user.username=} to {user.email=}")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    login_link = f"http://localhost:8080/login/{token.token}"
    logger.info(f"Link is: {login_link}")
    email.send_email(user.email, "Your login link for Couchers.org", "login", template_args={"user": user, "login_link": login_link})


def send_report_email(author_user_id, reported_user_id, reason, description):
    logger.info(f"Pretending to send report email to admin:")
    logger.info(f"{author_user_id=}, {reported_user_id=}")
