from dataclasses import dataclass
from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from google.protobuf.timestamp_pb2 import Timestamp

from couchers.i18n.i18next import I18Next
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
class LocContext:
    """
    Specifies regional settings used for localization of strings and date/times.
    Future settings like 12/24h clock preference would go here as well.
    """

    # The language or locale code (e.g. 'en', 'pt-BR'), used to lookup translations and format dates/numbers.
    locale: str

    # The timezone to use when formatting instants.
    timezone: ZoneInfo

    @property
    def localized_timezone(self) -> str:
        return localize_timezone(self.timezone, self.locale)

    def localize_string(self, key: str, *, i18next: I18Next | None = None, substitutions: dict[str, str | int] | None = None) -> str:
        i18next = i18next or get_main_i18next()
        return i18next.localize(key, self.locale, substitutions=substitutions)

    def localize_date(self, value: date) -> str:
        return localize_date(value, self.locale)

    def localize_date_from_iso(self, value: str) -> str:
        return localize_date_from_iso(value, self.locale)

    def localize_datetime(self, value: datetime | Timestamp) -> str:
        return localize_datetime(value, self.locale, self.timezone)

    def localize_time(self, value: time) -> str:
        return localize_time(value, self.locale, self.timezone)

    @staticmethod
    def from_user(user: User) -> LocContext:
        return LocContext(
            locale=user.ui_language_preference or "en",
            timezone=ZoneInfo(user.timezone or "Etc/UTC"),
        )
