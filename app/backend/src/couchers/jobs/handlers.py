"""
Background job servicers
"""

import logging
from time import sleep

from couchers import config
from couchers.db import session_scope
from couchers.email.dev import print_dev_email
from couchers.email.smtp import send_smtp_email
from couchers.models import LoginToken

logger = logging.getLogger(__name__)


def process_send_email(payload):
    logger.info(f"Sending email with subject '{payload.subject}' to '{payload.recipient}'")
    sender = send_smtp_email if config.config["ENABLE_EMAIL"] else print_dev_email
    email = sender(
        sender_name=payload.sender_name,
        sender_email=payload.sender_email,
        recipient=payload.recipient,
        subject=payload.subject,
        plain=payload.plain,
        html=payload.html,
    )
    with session_scope() as session:
        session.add(email)


def process_purge_login_tokens(payload):
    logger.info(f"Purging login tokens")
    with session_scope() as session:
        session.query(LoginToken).filter(LoginToken.is_valid == False).delete(synchronize_session=False)


def process_sleep_and_log(payload):
    logger.info(f"About to sleep for a bit...")
    sleep(2.4)
    logger.info(f"Done sleeping")
