import pytest

from couchers.i18n.localize import get_i18next


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_translations_loaded():
    """Test that translations are loaded from JSON files"""
    i18next = get_i18next()

    # Should have at least English errors loaded
    en_lang = i18next.languages_by_code.get("en")
    assert en_lang is not None
    assert en_lang.strings_by_key.get("errors.account_not_found") is not None

    # Other languages should also exist
    assert len(i18next.languages_by_code) > 1


def test_fallback_chain():
    """Test that fallbacks are correctly set up"""
    i18next = get_i18next()

    # Example: fr-CA should fallback to fr, which should fallback to en
    fr_CA = i18next.languages_by_code["fr-CA"]
    fr = i18next.languages_by_code["fr"]
    en = i18next.languages_by_code["en"]

    assert fr_CA.fallback == fr
    assert fr.fallback == en
    assert en.fallback is None

    assert i18next.default_language == en
