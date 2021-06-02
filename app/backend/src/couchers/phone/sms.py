import luhn

from couchers import crypto, errors


def generate_random_code():
    """Return a random 6-digit string with correct Luhn checksum"""
    return luhn.append(crypto.generate_random_5digit_string())


def looks_like_a_code(string):
    return len(string) == 6 and string.isdigit() and luhn.verify(string)


def format_message(token):
    return f"{token} is your Couchers.org verification code. If you did not request this, please ignore this message. Best, the Couchers.org team."


def send_sms(number, message):
    """Send SMS to a E.164 formatted phone number with leading +. Return "success" on
    success, on failure return an error string for any other error."""
    return errors.UNSUPPORTED_OPERATOR
