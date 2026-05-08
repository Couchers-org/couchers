import logging
from typing import cast

import boto3
import luhn

from couchers import crypto
from couchers.config import Config
from couchers.db import session_scope
from couchers.models import SMS

logger = logging.getLogger(__name__)


def generate_random_code() -> str:
    """Return a random 6-digit string with correct Luhn checksum"""
    return cast(str, luhn.append(crypto.generate_random_5digit_string()))


def looks_like_a_code(string: str) -> bool:
    return len(string) == 6 and string.isdigit() and luhn.verify(string)


def format_message(token: str) -> str:
    return f"{token} is your Couchers.org verification code. If you did not request this, please ignore this message. Best, the Couchers.org team."


def send_sms(number: str, message: str) -> str:
    """Send SMS to a E.164 formatted phone number with leading +. Return "success" on
    success, "unsupported operator" on unsupported operator, and any other
    string for any other error."""

    assert len(message) <= 140, "Message too long"

    if not Config.current.enable_sms:
        logger.info(f"SMS not enabled, need to send to {number}: {message}")
        return "SMS not enabled."

    sns = boto3.client("sns")
    sender_id = Config.current.sms_sender_id

    response = sns.publish(
        PhoneNumber=number,
        Message=message,
        MessageAttributes={
            "AWS.SNS.SMS.SMSType": {"DataType": "String", "StringValue": "Transactional"},
            "AWS.SNS.SMS.SenderID": {"DataType": "String", "StringValue": sender_id},
        },
    )

    message_id = response["MessageId"]

    with session_scope() as session:
        session.add(
            SMS(
                message_id=message_id,
                number=number,
                message=message,
                sms_sender_id=sender_id,
            )
        )

    return "success"
