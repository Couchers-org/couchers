import logging

logger = logger.getLogger(__name__)

def send_login_email(user, token, expiry_text):
    logger.info(f"Pretending to send login email to {user=}:")
    logger.info(f"Email for {user.username=} to {user.email=}")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    logger.info(f"Link is: http://localhost:8080/login/{token.token}")

def send_signup_email(email, token, expiry_text):
    logger.info(f"Pretending to send signup email to {email=}:")
    logger.info(f"Token: {token=} ({token.created=}, {token.expiry=}) ({expiry_text=})")
    logger.info(f"Link is: http://localhost:8080/signup/{token.token}")
