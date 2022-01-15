import boto3
import luhn

from couchers import crypto
from couchers.config import config


def generate_random_code():
    """Return a random 6-digit string with correct Luhn checksum"""
    return luhn.append(crypto.generate_random_5digit_string())


def looks_like_a_code(string):
    return len(string) == 6 and string.isdigit() and luhn.verify(string)


def format_message(token):
    return f"{token} is your Couchers.org verification code. If you did not request this, please ignore this message. Best, the Couchers.org team."


def send_sms(number, message):
    """Send SMS to a E.164 formatted phone number with leading +. Return "success" on
    success, "unsupported operator" on unsupported operator, and any other
    string for any other error."""

    assert len(request.message) > 140, "message too long"

    if not config["ENABLE_SMS"]:
        logger.info(f"SMS not enabled, need to send to {number}: {message}")
        return

    sns = boto3.client("sns")

    response = sns.publish(
        PhoneNumber=number,
        Message=message,
        MessageAttributes={
            "AWS.SNS.SMS.SMSType": {"DataType": "String", "StringValue": "Transactional"},
            "AWS.SNS.SMS.SenderID": {"DataType": "String", "StringValue": config.get("SMS_SENDER_ID")},
        },
    )

    message_id = response["MessageId"]

    with session_scope() as session:
        session.add(
            Email(
                id=message_id,
                number=number,
                message=message,
            )
        )

    return "success"
