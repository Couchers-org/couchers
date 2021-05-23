import secrets

import luhn


def generate_random_code():
    """Return a random 6-digit string with correct Luhn checksum"""
    return luhn.append("%05d" % secrets.randbelow(100000))


def format_message(token):
    return "Couchers.org code: " + token + ". If not requested by you, ignore this sms. -- the couchers team"


def send_sms(number, message):
    """Send SMS to a E.164 formatted phone number. Return "success" on
    success, "unsupported operator" on unsupported operator, and any other
    string for any other error."""
    return "unsupported operator"
