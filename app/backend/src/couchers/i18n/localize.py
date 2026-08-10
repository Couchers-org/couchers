"""
Defines low-level localization functions for strings, dates, etc.
Most code should use the higher-level couchers.i18n.LocalizationContext object.
"""

import re
from collections.abc import Sequence
from datetime import date, datetime, time, tzinfo
from typing import cast

import babel
import phonenumbers
from babel.dates import get_datetime_format, get_timezone_name, match_skeleton, parse_pattern
from babel.lists import format_list

from couchers.resources import get_region_code_iso3166_alpha3_to_alpha2


def localize_list(items: Sequence[str], locales: list[babel.Locale]) -> str:
    for locale in locales:
        try:
            return format_list(items, locale=locale)
        except ValueError:  # Raised if the locale doesn't support list formatting
            continue
    return format_list(items, locale=babel.Locale.parse("en"))


def try_localize_language_name_from_iso639(
    code: str, locales: list[babel.Locale], standalone: bool = False
) -> str | None:
    """
    Attempts to localize the name of a language expressed as an ISO639 code.

    Args:
        code: The ISO639 language code.
        locales: The acceptable locales to render the language name in.
        standalone: The result won't be part of a larger sentence and should be capitalized if the language has capitals.

    Returns:
        The localized name, or None if no localized name is available.
    """
    for locale in locales:
        try:
            name = babel.Locale.parse(code).get_language_name(locale)
            if name is None:
                continue
            if standalone:
                # The Unicode CLDR returns a casing that allows embedding in a larger sentence, e.g. "español".
                # If we're displaying the language name on its own, capitalize its first letter if applicable.
                # An LLM prompt revealed that this holds for all major languages.
                # It is a no-op for scripts that don't have capital letters.
                name = name[:1].title() + name[1:]
            return name
        except ValueError, babel.UnknownLocaleError:
            continue
    return None


def try_localize_region_name_from_iso3166(code: str, locales: list[babel.Locale]) -> str | None:
    """
    Gets a region name specified as an ISO3166 alpha2 or alpha3 code,
    localized in the first acceptable locale provided.
    """
    # The Unicode CLDR uses alpha2 codes as keys (all alpha3 codes have a corresponding alpha2 code)
    code = get_region_code_iso3166_alpha3_to_alpha2().get(code, code)
    for locale in locales:
        region_name: str | None = locale.territories.get(code, None)
        if region_name is not None:
            return region_name
    return None


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


def localize_timezone(timezone: tzinfo, locales: list[babel.Locale], *, short: bool = False) -> str:
    # From the implementation, get_timezone_name has no failure condition for unsupported locales,
    # so just used the preferred locale.
    return get_timezone_name(timezone, width="short" if short else "long", locale=locales[0])


def format_phone_number(value: str) -> str:
    """Formats a phone number from E.164 format to the international format."""
    return phonenumbers.format_number(phonenumbers.parse(value), phonenumbers.PhoneNumberFormat.INTERNATIONAL)
