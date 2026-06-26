from datetime import UTC, date, datetime, time
from zoneinfo import ZoneInfo

import babel

from couchers.i18n.localize import (
    localize_date,
    localize_datetime,
    localize_list,
    localize_time,
    localize_timezone,
    try_localize_language_name,
    try_localize_iso3166_region_name,
)

babel_en = babel.Locale.parse("en")
babel_es = babel.Locale.parse("es")
babel_fr = babel.Locale.parse("fr")
babel_zh = babel.Locale.parse("zh")


def test_localize_language_name() -> None:
    assert try_localize_language_name("en", babel_en) == "English"
    assert try_localize_language_name("es", babel_en) == "Spanish"

    assert try_localize_language_name("en", babel_es) == "inglés"
    assert try_localize_language_name("es", babel_es) == "español"

    assert try_localize_language_name("en", babel_es, standalone=True) == "Inglés"  # Sentence case
    assert try_localize_language_name("eng", babel_es) == "inglés"  # ISO639-3 code
    assert try_localize_language_name("xx", babel_en) is None


def test_localize_region_name() -> None:
    assert try_localize_iso3166_region_name("US", babel_en) == "United States"
    assert try_localize_iso3166_region_name("DE", babel_en) == "Germany"

    assert try_localize_iso3166_region_name("US", babel_es) == "Estados Unidos"
    assert try_localize_iso3166_region_name("DE", babel_es) == "Alemania"

    assert try_localize_iso3166_region_name("USA", babel_en) == "United States"  # alpha3 code

    assert try_localize_iso3166_region_name("xx", babel_en) is None


def test_localize_date() -> None:
    assert localize_date(date(2000, 1, 2), babel_en) == "January 2, 2000"
    assert localize_date(date(2000, 1, 2), babel_es, abbrev=True) == "2 ene 2000"
    assert localize_date(date(2000, 1, 2), babel_fr, with_day_of_week=True) == "dimanche 2 janvier 2000"
    assert localize_date(date(2000, 1, 2), babel_zh, with_year=False) == "1月2日"
    assert localize_date(date(2000, 1, 2), babel_en, with_year=False, with_day_of_week=True) == "Sunday, January 2"


def test_localize_time() -> None:
    assert localize_time(time(14, 5), babel_en) == "2:05 PM"
    assert localize_time(time(14, 5), babel_fr) == "14:05"
    assert localize_time(time(14, 5), babel_es, with_seconds=True) == "14:05:00"


def test_localize_datetime() -> None:
    value = datetime(2000, 1, 2, 14, 5, tzinfo=UTC)
    assert localize_datetime(value, babel_en) == "January 2, 2000, 2:05 PM"
    assert localize_datetime(value, babel_fr) == "2 janvier 2000, 14:05"


def test_localize_timezone() -> None:
    assert localize_timezone(ZoneInfo("Europe/London"), babel_en) == "United Kingdom Time"
    assert localize_timezone(ZoneInfo("Europe/London"), babel_es) == "hora de Reino Unido"


def test_localize_list() -> None:
    abc = ["a", "b", "c"]
    assert localize_list(abc, babel_en) == "a, b, and c"
    assert localize_list(abc, babel_es) == "a, b y c"
    assert localize_list(abc, babel_zh) == "a、b和c"
