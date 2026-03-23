from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from couchers.i18n.localize import localize_date, localize_datetime, localize_time, localize_timezone


def test_localize_date() -> None:
    assert localize_date(date(2000, 1, 2), "en-US") == "Jan 2, 2000"
    assert localize_date(date(2000, 1, 2), "fr-FR") == "2 janv. 2000"


def test_localize_time() -> None:
    assert localize_time(time(14, 5), "en-US") == "2:05:00 PM"
    assert localize_time(time(14, 5), "fr-FR") == "14:05:00"


def test_localize_datetime() -> None:
    utc = ZoneInfo("Etc/UTC")
    value = datetime(2000, 1, 2, 14, 5, tzinfo=utc)
    assert localize_datetime(value, utc, "en-US") == "Jan 2, 2000, 2:05:00 PM"
    assert localize_datetime(value, utc, "fr-FR") == "2 janv. 2000, 14:05:00"


def test_localize_timezone() -> None:
    assert localize_timezone(ZoneInfo("Europe/London"), "en") == "United Kingdom Time"
    assert localize_timezone(ZoneInfo("Europe/London"), "es") == "hora de Reino Unido"
