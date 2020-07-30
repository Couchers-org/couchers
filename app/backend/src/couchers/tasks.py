import logging

from couchers import emails

logger = logging.getLogger(__name__)

def send_login_email(user, token, expiry_text):
    emails.render_email("recipient@dev.couchers.org", "Finish signing up for Couchers.org", "signup.md", template_args={"signup_link": "https://app.couchers.org/signup/uniquelink"})
    logger.info(f"Pretending to send login email to {user=}:")
    logger.info(f"Email for {user.username=} to {user.email=}")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    logger.info(f"Link is: http://localhost:8080/login/{token.token}")

def send_signup_email(email, token, expiry_text):
    logger.info(f"Pretending to send signup email to {email=}:")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    logger.info(f"Link is: http://localhost:8080/signup/{token.token}")


def send_report_email(author_user_id, reported_user_id, reason, description):
    logger.info(f"Pretending to send report email to admin:")
    logger.info(f"{author_user_id=}, {reported_user_id=}")
