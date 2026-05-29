import pytest

from couchers.i18n.locales import (
    DEFAULT_LOCALE,
    get_babel_locale,
    get_main_i18next,
    get_supported_locales,
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
    assert to_supported_locale("fr-CA") == "fr-CA"
    assert to_supported_locale("zh-Hans") == "zh-Hans"

    # Normalization
    assert to_supported_locale("") == DEFAULT_LOCALE
    assert to_supported_locale("xx") == DEFAULT_LOCALE
    assert to_supported_locale("FR-ca") == "fr-CA"
    assert to_supported_locale("en-UK") == "en"
    assert to_supported_locale("en-Shorthand") == "en"
    assert to_supported_locale("fr-CA-Shorthand") == "fr-CA"


def test_all_supported_locales_have_babel_locales():
    for locale in get_supported_locales():
        assert get_babel_locale(locale), f"Locale {locale} does not have a valid Babel locale"


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
