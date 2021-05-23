import luhn

from couchers import crypto
import boto3

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

    if not config["ENABLE_SMS"]:
        logger.info(f"SMS not emabled, need to send to {number}: {message}")
        return

    if len(request.message) > 140:
        return "message too long"

    sns = boto3.client("sns")
    sns.set_sms_attributes(
        attributes={"DefaultSenderID": config.get("SMS_SENDER_ID"), "DefaultSMSType": "Transactional"}
    )

    response = sns.publish(
        PhoneNumber=number,
        Message=message,
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
>>>>>>> 353176348 (Add SMS sending code)
