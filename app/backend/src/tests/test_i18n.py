import pytest
from babel import Locale, UnknownLocaleError

from couchers.i18n.localize import get_main_i18next


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_translations_loaded():
    """Test that translations are loaded from JSON files"""
    i18next = get_main_i18next()

    # Should have at least English errors loaded
    en_translation = i18next.translations_by_locale.get("en")
    assert en_translation is not None
    assert en_translation.strings_by_key.get("errors.account_not_found") is not None

    # Other languages should also exist
    assert len(i18next.translations_by_locale) > 1


def test_fallback_chain():
    """Test that fallbacks are correctly set up"""
    i18next = get_main_i18next()

    # Example: fr-CA should fallback to fr, which should fallback to en
    fr_CA = i18next.translations_by_locale["fr-CA"]
    fr = i18next.translations_by_locale["fr"]
    en = i18next.translations_by_locale["en"]

    assert fr_CA.fallbacks == [fr, en]
    assert fr.fallbacks == [en]
    assert en.fallbacks == []

    assert i18next.default_translation == en


def test_babel_locales():
    """Documents which locales are not supported/recognized by the Babel library's CLDR."""
    unknown_locales: set[str] = set()
    i18next = get_main_i18next()
    for locale in i18next.translations_by_locale.keys():
        try:
            Locale(locale.replace("-", "_"))
        except UnknownLocaleError:
            unknown_locales.add(locale)
    assert unknown_locales == {"en_CORP"}
