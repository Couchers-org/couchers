from dataclasses import dataclass
from datetime import UTC, date, datetime, time, tzinfo
from zoneinfo import ZoneInfo

from google.protobuf.timestamp_pb2 import Timestamp

from couchers.i18n.i18next import I18Next
from couchers.i18n.locales import DEFAULT_LOCALE
from couchers.i18n.localize import (
    get_main_i18next,
    localize_date,
    localize_date_from_iso,
    localize_datetime,
    localize_time,
    localize_timezone,
)
from couchers.models.users import User


@dataclass(frozen=True, slots=True, kw_only=True)
class LocalizationContext:
    """
    Specifies regional settings used for localization of strings and date/times.
    Future settings like 12/24h or format preferences would go here as well.
    """

    # The locale code (e.g. 'en', 'pt-BR'), used to lookup translations and format dates/numbers.
    # Note that a locale doesn't necessarily specify a region.
    locale: str

    # The timezone to use when formatting date-times and instants.
    timezone: tzinfo

    @property
    def localized_timezone(self) -> str:
        return localize_timezone(self.timezone, self.locale)

    def localize_string(
        self, key: str, *, i18next: I18Next | None = None, substitutions: dict[str, str | int] | None = None
    ) -> str:
        i18next = i18next or get_main_i18next()
        return i18next.localize(key, self.locale, substitutions=substitutions)

    def localize_date(self, value: date | datetime) -> str:
        if isinstance(value, datetime):
            value = value.astimezone(self.timezone).date()
        return localize_date(value, self.locale)

    def localize_date_from_iso(self, value: str) -> str:
        return localize_date_from_iso(value, self.locale)

    def localize_datetime(self, value: datetime | Timestamp) -> str:
        return localize_datetime(value, self.timezone, self.locale)

    def localize_time(self, value: datetime | time) -> str:
        if isinstance(value, datetime):
            value = value.astimezone(self.timezone).time()
        return localize_time(value, self.locale)

    @staticmethod
    def en_utc() -> LocalizationContext:
        return LocalizationContext(locale="en", timezone=UTC)

    @staticmethod
    def from_user(user: User) -> LocalizationContext:
        return LocalizationContext(
            locale=user.ui_language_preference or DEFAULT_LOCALE,
            timezone=ZoneInfo(user.timezone) if user.timezone else UTC,
        )
