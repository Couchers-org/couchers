from dataclasses import dataclass
from datetime import UTC, date, datetime, time, tzinfo
from zoneinfo import ZoneInfo

import babel
from google.protobuf.timestamp_pb2 import Timestamp

from couchers.i18n.i18next import I18Next
from couchers.i18n.locales import DEFAULT_LOCALE, get_locale_fallbacks
from couchers.i18n.localize import (
    get_babel_locale,
    get_main_i18next,
    localize_date,
    localize_datetime,
    localize_time,
    localize_timezone,
)
from couchers.models.users import User
from couchers.utils import to_aware_datetime


@dataclass(init=False)
class LocalizationContext:
    """
    Specifies regional settings used for localization of strings and date/times.
    Future settings like 12/24h or format preferences would go here as well.
    """

    # The locale code (e.g. 'en', 'pt-BR'), used to lookup translations and format dates/numbers.
    # Note that a locale doesn't necessarily specify a region.
    locale: str

    # The locale code and all of its fallbacks.
    locale_list: list[str]

    # The timezone to use when formatting date-times and instants.
    timezone: tzinfo

    # The Babel locale used for datetime formatting and other Unicode CLDR usage.
    babel_locale: babel.Locale

    def __init__(self, locale: str, timezone: tzinfo) -> None:
        self.locale = locale
        self.locale_list = [self.locale] + get_locale_fallbacks(self.locale)
        self.timezone = timezone
        self.babel_locale = get_babel_locale(self.locale_list)

    @property
    def localized_timezone(self) -> str:
        return localize_timezone(self.timezone, self.babel_locale)

    def localize_string(
        self, key: str, *, i18next: I18Next | None = None, substitutions: dict[str, str | int] | None = None
    ) -> str:
        i18next = i18next or get_main_i18next()
        return i18next.localize(key, self.locale, substitutions=substitutions)

    def localize_date(
        self, value: date | datetime, *, abbrev: bool = False, with_year: bool = True, with_day_of_week: bool = False
    ) -> str:
        if isinstance(value, datetime):
            value = value.astimezone(self.timezone).date()
        return localize_date(
            value, self.babel_locale, abbrev=abbrev, with_year=with_year, with_day_of_week=with_day_of_week
        )

    def localize_date_from_iso(
        self, value: str, *, abbrev: bool = False, with_year: bool = True, with_day_of_week: bool = False
    ) -> str:
        return self.localize_date(
            date.fromisoformat(value),
            abbrev=abbrev,
            with_year=with_year,
            with_day_of_week=with_day_of_week,
        )

    def localize_datetime(
        self,
        value: datetime | Timestamp,
        *,
        abbrev: bool = False,
        with_year: bool = True,
        with_day_of_week: bool = False,
        with_seconds: bool = False,
    ) -> str:
        if isinstance(value, Timestamp):
            value = to_aware_datetime(value)
        else:
            value = value.astimezone(self.timezone)

        return localize_datetime(
            value,
            self.babel_locale,
            abbrev=abbrev,
            with_year=with_year,
            with_day_of_week=with_day_of_week,
            with_seconds=with_seconds,
        )

    def localize_time(self, value: datetime | time, *, with_seconds: bool = False) -> str:
        if isinstance(value, datetime):
            value = value.astimezone(self.timezone).time()
        return localize_time(value, self.babel_locale, with_seconds=with_seconds)

    @staticmethod
    def en_utc() -> LocalizationContext:
        return LocalizationContext(locale="en", timezone=UTC)

    @staticmethod
    def from_user(user: User) -> LocalizationContext:
        return LocalizationContext(
            locale=user.ui_language_preference or DEFAULT_LOCALE,
            timezone=ZoneInfo(user.timezone) if user.timezone else UTC,
        )
