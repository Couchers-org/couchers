import logging

from couchers.crypto import random_hex
from couchers.models import Email
from couchers.proto.internal import jobs_pb2

logger = logging.getLogger(__name__)


def print_dev_email(payload: jobs_pb2.SendEmailPayload) -> Email:
    """
    Generates a dummy Email object and prints the plain email contents to the logger

    This allows developing easier by not having to spin up any email infrastructure, and it spits out login links, etc.

    Returns a models.Email object that can be straight away added to the database.
    """
    message_id = random_hex()

    logger.info("Dev email:")
    logger.info(payload.plain)

    return Email(
        message_id=message_id,
        sender_name=payload.sender_name,
        sender_email=payload.sender_email,
        recipient=payload.recipient,
        subject=payload.subject,
        plain=payload.plain,
        html=payload.html,
        list_unsubscribe_header=payload.list_unsubscribe_header,
        source_data=payload.source_data,
    )
