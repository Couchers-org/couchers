import datetime
import json
from collections.abc import Mapping
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo

from google.protobuf.timestamp_pb2 import Timestamp
import phonenumbers

from couchers.i18n.constants import LANGUAGE_FALLBACKS
from couchers.i18n.i18next import I18Next
from couchers.i18n.plurals import PluralRules
from couchers.models.users import User
from couchers.utils import to_aware_datetime


@lru_cache(maxsize=1)
def get_i18next() -> I18Next:
    """
    Load all translation files from the locales directory and apply fallbacks.

    Returns:
        An I18Next object that can localize the application strings.

    The result is cached so that translations are only loaded once per process.
    """

    i18next = I18Next()

    # Load all locale JSON files from the locales directory
    locales_dir = Path(__file__).parent / "locales"
    for locale_file in locales_dir.glob("*.json"):
        lang_code = locale_file.stem  # e.g., "en" from "en.json"

        with open(locale_file, "r", encoding="utf-8") as f:
            translations = json.load(f)

        plural_rule = PluralRules.for_language(lang_code) or PluralRules.en
        language = i18next.add_language(lang_code, plural_rule)
        language.load_json_dict(translations)

    # English is our default for undefined languages
    en = i18next.languages_by_code.get("en")
    if en is None:
        raise RuntimeError("English translations must be loaded")
    i18next.default_language = en

    # Apply fallbacks
    for language in i18next.languages_by_code.values():
        if language == en:
            continue  # English has no fallback

        fallback_language = en
        if fallback_code := LANGUAGE_FALLBACKS.get(language.code):
            fallback_language = i18next.languages_by_code[fallback_code]
        language.fallback = fallback_language

    return i18next


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
    return get_i18next().localize(key, lang or "en", substitutions)


def localize_date(date: datetime.date, locale: str) -> str:
    """Formats a time- and timezone-agnostic date for the given locale."""
    # TODO(#7590): Account for locale
    return date.strftime("%A %-d %B %Y")


def localize_date_from_iso(date: str, locale: str) -> str:
    """Formats a date in ISO YYYY-MM-DD format for the given locale."""
    return localize_date(datetime.date.fromisoformat(date), locale)


def localize_time(time: datetime.time, locale: str) -> str:
    """Formats a date- and timezone-agnostic time for the given locale."""
    # TODO(#7590): Account for locale
    return time.strftime("%-I:%M %p (%H:%M)")


def localize_datetime(datetime: datetime.datetime | Timestamp, timezone: ZoneInfo | None, locale: str) -> str:
    """
    Formats a date and time for the given locale.

    Args:
        datetime: The datetime or timestamp to be formatted.
        timezone: An optional timezone in which to interpret the date. If None, uses datetime's timezone.
        locale: The locale for which to format the date.

    Returns:
        The localized date and time string.
    """
    if isinstance(datetime, Timestamp):
        datetime = to_aware_datetime(datetime)

    # A timezone-unaware datetime is almost certainly a bug, so we don't support it.
    assert datetime.tzinfo is not None, "Cannot localize a timezone-unaware datetime."

    if timezone is not None:
        datetime = datetime.astimezone(timezone)

    localized_date = localize_date(datetime.date(), locale)
    localized_time = localize_time(datetime.time(), locale)

    # TODO(#7590): Account for locale
    return f"{localized_date} at {localized_time}"


def localize_datetime_for_user(datetime: datetime.datetime | Timestamp, user: User) -> str:
    timezone = ZoneInfo(user.timezone or "Etc/UTC")
    return localize_datetime(datetime, timezone, user.ui_language_preference or "en")


def format_phone_number(value: str) -> str:
    """Formats a phone number from E.164 format to the international format."""
    return phonenumbers.format_number(phonenumbers.parse(value), phonenumbers.PhoneNumberFormat.INTERNATIONAL)
