"""
Defines low-level localization functions for strings, dates, etc.
Most code should use the higher-level couchers.i18n.LocalizationContext object.
"""

import re
from collections.abc import Mapping
from datetime import date, datetime, time, tzinfo
from functools import lru_cache
from pathlib import Path
from typing import cast

import babel
import phonenumbers
from babel.dates import get_datetime_format, get_timezone_name, match_skeleton, parse_pattern

from couchers.i18n.i18next import I18Next
from couchers.i18n.locales import DEFAULT_LOCALE, load_locales


@lru_cache(maxsize=1)
def get_main_i18next() -> I18Next:
    """Gets the I18Next instance for the main locales files."""
    return load_locales(Path(__file__).parent / "locales")


def get_babel_locale(locale_list: list[str]) -> babel.Locale:
    """Resolves a babel.Locale object from a list of locale candidates."""
    for locale in locale_list:
        try:
            return babel.Locale.parse(locale, sep="-")
        except babel.UnknownLocaleError:
            continue
    raise LookupError(f"No babel locale found for locales {', '.join(locale_list)}")


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
    return get_main_i18next().localize(key, lang or DEFAULT_LOCALE, substitutions)


def localize_date(
    value: date, locale: babel.Locale, *, abbrev: bool = False, with_year: bool = True, with_day_of_week: bool = False
) -> str:
    """Formats a time- and timezone-agnostic date for the given locale."""
    pattern = _get_cldr_date_pattern(locale, abbrev=abbrev, with_year=with_year, with_day_of_week=with_day_of_week)
    return parse_pattern(pattern).apply(value, locale)


def localize_time(value: time, locale: babel.Locale, *, with_seconds: bool = False) -> str:
    """Formats a date- and timezone-agnostic time for the given locale."""
    pattern = _get_cldr_time_pattern(locale, with_seconds=with_seconds)
    return parse_pattern(pattern).apply(value, locale)


def localize_datetime(
    value: datetime,
    locale: babel.Locale,
    *,
    abbrev: bool = False,
    with_year: bool = True,
    with_day_of_week: bool = False,
    with_seconds: bool = False,
) -> str:
    """Formats a date and time for the given locale."""
    # A timezone-unaware datetime is almost certainly a bug, so we don't support it.
    assert value.tzinfo is not None, "Cannot localize a timezone-unaware datetime."

    pattern = _combine_cldr_date_time_patterns(
        locale,
        _get_cldr_date_pattern(locale, abbrev=abbrev, with_year=with_year, with_day_of_week=with_day_of_week),
        _get_cldr_time_pattern(locale, with_seconds=with_seconds),
    )
    return parse_pattern(pattern).apply(value, locale)


def _get_cldr_date_pattern(
    locale: babel.Locale, *, abbrev: bool = False, with_year: bool = True, with_day_of_week: bool = False
) -> str:
    # First build a Unicode CLDR datetime pattern skeleton, which is locale and order-agnostic,
    # and only indicates the components we're interested in formatting.
    # This is similar to Intl.DateTimeFormat in Javascript.
    # See https://cldr.unicode.org/translation/date-time/date-time-symbols.
    requested_skeleton = ""

    if with_year:
        requested_skeleton += "y"
    requested_skeleton += "MMM" if abbrev else "MMMM"
    requested_skeleton += "d"
    if with_day_of_week:
        requested_skeleton += "EEE" if abbrev else "EEEE"

    # Next, match that skeleton to a similar locale-supported skeleton,
    # which allows us to lower it to a datetime pattern (locale and order-specific).
    matched_skeleton = match_skeleton(requested_skeleton, options=locale.datetime_skeletons)
    if not matched_skeleton:
        raise ValueError(f"Locale {locale.english_name} has no matching datetime skeleton for '{requested_skeleton}'")

    pattern: str = locale.datetime_skeletons[matched_skeleton].pattern

    # By CLDR rules, skeleton matching might return a pattern with abbreviations where
    # we asked for non-abbreviated forms, in which case we can update the returned pattern.
    if not abbrev:
        # Abbreviated to non-abbreviated month (MMM = abbreviated)
        pattern = re.sub(r"(?<!M)MMM(?!M)", "MMMM", pattern)
        if with_day_of_week:
            # Abbreviated to non-abbreviated day of week (E = EEE = abbreviated)
            pattern = re.sub(r"(?<!E)E{1,3}(?!E)", "EEEE", pattern)

    return pattern


def _get_cldr_time_pattern(locale: babel.Locale, *, with_seconds: bool = False) -> str:
    # Use a reference format pattern to figure out if it's using 24h clock
    reference_time_pattern: str = locale.time_formats["medium"].pattern

    # Remove literals like 'of'
    reference_time_pattern = re.sub("'[^']*'", "", reference_time_pattern)

    # Extract only the hours, minutes and am/pm patterns.
    requested_skeleton = re.sub("[^hHkKma]+", "", reference_time_pattern)
    if with_seconds:
        requested_skeleton += "ss"

    # Next, match that skeleton to a similar locale-supported skeleton,
    # which allows us to lower it to a datetime pattern (locale and order-specific).
    matched_skeleton = match_skeleton(requested_skeleton, options=locale.datetime_skeletons)
    if not matched_skeleton:
        raise ValueError(f"Locale {locale.english_name} has no matching datetime skeleton for '{requested_skeleton}'")

    return cast(str, locale.datetime_skeletons[matched_skeleton].pattern)  # "pattern" is Any-typed


def _combine_cldr_date_time_patterns(locale: babel.Locale, date_pattern: str, time_pattern: str) -> str:
    # get_datetime_format's return value is statically mistyped
    combining_format = cast(str, get_datetime_format(locale=locale))

    # CLDR defines {0} to be the time and {1} to be the date
    return combining_format.replace("{1}", date_pattern).replace("{0}", time_pattern)


def localize_timezone(timezone: tzinfo, locale: babel.Locale, *, short: bool = False) -> str:
    return get_timezone_name(timezone, width="short" if short else "long", locale=locale)


def format_phone_number(value: str) -> str:
    """Formats a phone number from E.164 format to the international format."""
    return phonenumbers.format_number(phonenumbers.parse(value), phonenumbers.PhoneNumberFormat.INTERNATIONAL)
