import pytest

from couchers.i18n.i18n import get_i18next
from tests.test_fixtures import testconfig  # noqa


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
