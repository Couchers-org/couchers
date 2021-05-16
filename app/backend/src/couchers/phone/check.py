import phonenumbers


def is_e164_format(phone):
    """Return true if string is in E.164 format, for example "46701740605" """
    return phone.isdigit() and len(phone) <= 15


def is_known_operator(phone):
    """Return true if phone is in E.164 format, and has the correct amount
    of digits considering the country and operator."""

    if not is_e164_format(phone):
        return False

    z = phonenumbers.parse("+" + phone)
    return phonenumbers.is_valid_number(z)
