import logging

from couchers.crypto import random_hex
from couchers.models import Email

logger = logging.getLogger(__name__)


def print_dev_email(sender_name, sender_email, recipient, subject, plain, html, list_unsubscribe_header, source_data):
    """
    Generates a dummy Email object and prints the plain email contents to the logger

    This allows developing easier by not having to spin up any email infrastructure, and it spits out login links, etc.

    Returns a models.Email object that can be straight away added to the database.
    """
    message_id = random_hex()

    logger.info("Dev email:")
    logger.info(plain)

    return Email(
        id=message_id,
        sender_name=sender_name,
        sender_email=sender_email,
        recipient=recipient,
        subject=subject,
        plain=plain,
        html=html,
        list_unsubscribe_header=list_unsubscribe_header,
        source_data=source_data,
    )
