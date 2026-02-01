"""
Defines low-level localization functions for strings, dates, etc.
Most code should use the higher-level couchers.i18n.LocalizationContext object.
"""

from collections.abc import Mapping
from datetime import date, datetime, time
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo

import phonenumbers
from google.protobuf.timestamp_pb2 import Timestamp

from couchers.i18n.i18next import I18Next
from couchers.i18n.locales import load_locales
from couchers.utils import to_aware_datetime


@lru_cache(maxsize=1)
def get_main_i18next() -> I18Next:
    """Gets the I18Next instance for the main locales files."""
    return load_locales(Path(__file__).parent / "locales")


def localize_string(lang: str | None, key: str, *, substitutions: Mapping[str, str | int] | None = None) -> str:
    """
    Retrieves a translated string and performs substitutions.

    Args:
        lang: Language code (e.g., "en", "pt-BR"). If None, defaults to the default fallback language ("en")
        key: The key for the string to be looked up.
        substitutions: Dictionary of variable substitutions for the string (e.g., {"hours": 24})

    Returns:
        The translated string with substitutions applied
    """
    return get_main_i18next().localize(key, lang or "en", substitutions)


def localize_date(value: date, locale: str) -> str:
    """Formats a time- and timezone-agnostic date for the given locale."""
    # TODO(#7590): Account for locale
    return value.strftime("%A %-d %B %Y")


def localize_date_from_iso(value: str, locale: str) -> str:
    """Formats a date in ISO YYYY-MM-DD format for the given locale."""
    return localize_date(date.fromisoformat(value), locale)


def localize_time(value: time, locale: str) -> str:
    """Formats a date- and timezone-agnostic time for the given locale."""
    # TODO(#7590): Account for locale
    return value.strftime("%-I:%M %p (%H:%M)")


def localize_datetime(value: datetime | Timestamp, timezone: ZoneInfo | None, locale: str) -> str:
    """
    Formats a date and time for the given locale.

    Args:
        datetime: The datetime or timestamp to be formatted.
        timezone: An optional timezone in which to interpret the date. If None, uses datetime's timezone.
        locale: The locale for which to format the date.

    Returns:
        The localized date and time string.
    """
    if isinstance(value, Timestamp):
        value = to_aware_datetime(value)

    # A timezone-unaware datetime is almost certainly a bug, so we don't support it.
    assert value.tzinfo is not None, "Cannot localize a timezone-unaware datetime."

    if timezone is not None:
        value = value.astimezone(timezone)

    localized_date = localize_date(value.date(), locale)
    localized_time = localize_time(value.time(), locale)

    # TODO(#7590): Account for locale
    return f"{localized_date} at {localized_time}"


def localize_timezone(timezone: ZoneInfo, locale: str) -> str:
    # TODO(#7590): Account for locale
    return datetime.now(tz=timezone).strftime("%Z/UTC%z")


def format_phone_number(value: str) -> str:
    """Formats a phone number from E.164 format to the international format."""
    return phonenumbers.format_number(phonenumbers.parse(value), phonenumbers.PhoneNumberFormat.INTERNATIONAL)
