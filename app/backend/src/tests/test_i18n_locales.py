import pytest

from couchers.i18n.locales import (
    DEFAULT_LOCALE,
    get_babel_locale,
    get_locale_chain,
    get_main_i18next,
    get_supported_locales,
    is_locale_with_translations,
    is_supported_locale,
    to_supported_locale,
)


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


def test_to_supported_locale():
    # No-ops
    assert to_supported_locale("en") == "en"
    assert to_supported_locale("fr") == "fr"
    assert to_supported_locale("fr-CA") == "fr"  # We don't have a separate fr-CA translation anymore
    assert to_supported_locale("zh-Hans") == "zh-Hans"

    # Supported locale with no translations
    assert is_supported_locale("en-US") and not is_locale_with_translations("en-US")
    assert to_supported_locale("en-US") == "en-US"

    # Bogus locales
    assert to_supported_locale("") == DEFAULT_LOCALE
    assert to_supported_locale("xx") == DEFAULT_LOCALE
    assert to_supported_locale("------------------") == DEFAULT_LOCALE

    # Normalization
    assert to_supported_locale("PT-br") == "pt-BR"
    assert to_supported_locale("en-UK") == "en"
    assert to_supported_locale("en-Shorthand") == "en"
    assert to_supported_locale("pt-BR-Shorthand") == "pt-BR"


def test_all_supported_locales_have_babel_locales():
    for locale in get_supported_locales():
        babel_locale = get_babel_locale(locale)
        assert babel_locale, f"Locale {locale} does not have a valid Babel locale"

        # Ensure minimal support for the i18n operations we care about
        assert babel_locale.date_formats
        assert babel_locale.datetime_formats
        assert babel_locale.datetime_skeletons
        assert babel_locale.list_patterns
        assert babel_locale.languages
        assert babel_locale.time_zones
        assert babel_locale.zone_formats
        assert babel_locale.territories


def test_get_locale_chain():
    """Test that fallbacks are correctly set up"""
    assert get_locale_chain("en") == ["en"]
    assert get_locale_chain("en-US") == ["en-US", "en"]
    assert get_locale_chain("pl") == ["pl", "en"]
    assert get_locale_chain("xx") == ["xx", "en"]
    assert get_locale_chain("pt") == ["pt", "pt-BR", "en"]
    assert get_locale_chain("pt-BR") == ["pt-BR", "pt", "en"]
