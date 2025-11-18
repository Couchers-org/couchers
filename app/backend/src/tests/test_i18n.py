import pytest

from couchers.i18n.i18n import MissingTranslationError, get_raw_translation_string, get_translations
from tests.test_fixtures import testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_translations_loaded():
    """Test that translations are loaded from JSON files"""
    # Should have at least English errors loaded
    assert "en" in get_translations()
    assert "errors" in get_translations()["en"]
    assert len(get_translations()["en"]["errors"]) > 0


def test_get_string_simple():
    """Test simple string retrieval without substitutions"""
    result = get_raw_translation_string("en", "errors", "cant_write_reference_indicated_didnt_meetup")
    expected = "You can't write a reference for that host request because you indicated that you didn't meet up."
    assert result == expected


def test_get_string_with_substitution():
    """Test string retrieval with variable substitutions"""
    result = get_raw_translation_string("en", "errors", "chat_initiation_rate_limit", substitutions={"hours": 24})
    expected = "You have messaged a lot of users in the past 24 hours. To avoid spam, you can't contact any more users for now."
    assert result == expected


def test_get_string_fallback_to_english():
    """Test that non-existent languages fall back to English"""
    # Request in pt-BR which doesn't exist, should fall back to pt, then to en
    result = get_raw_translation_string("pt-BR", "errors", "cant_write_reference_indicated_didnt_meetup")
    expected = "You can't write a reference for that host request because you indicated that you didn't meet up."
    assert result == expected


def test_get_string_fallback_chain():
    """Test language fallback chain works correctly"""
    # Test pt-PT -> pt-BR -> en fallback chain
    result = get_raw_translation_string("pt-PT", "errors", "user_not_found")
    expected = "Couldn't find that user."
    assert result == expected


def test_get_string_missing():
    """Test that missing strings raise MissingTranslationError"""
    with pytest.raises(MissingTranslationError) as exc_info:
        get_raw_translation_string("en", "errors", "nonexistent_string_key_12345")

    assert exc_info.value.lang == "en"
    assert exc_info.value.component == "errors"
    assert exc_info.value.string_name == "nonexistent_string_key_12345"
    assert "en.errors.nonexistent_string_key_12345" in str(exc_info.value)


def test_get_string_missing_component():
    """Test that missing components raise MissingTranslationError"""
    with pytest.raises(MissingTranslationError) as exc_info:
        get_raw_translation_string("en", "nonexistent_component", "some_string")

    assert exc_info.value.lang == "en"
    assert exc_info.value.component == "nonexistent_component"
    assert exc_info.value.string_name == "some_string"
    assert "en.nonexistent_component.some_string" in str(exc_info.value)


def test_get_string_multiple_substitutions():
    """Test string with multiple variable substitutions"""
    # Using a string that exists, even though this particular one has only one substitution
    result = get_raw_translation_string("en", "errors", "chat_initiation_rate_limit", substitutions={"hours": 48})
    assert "2 days" in result
    assert "messaged a lot of users" in result


def test_fallbacks():
    """Test that en_CORP uses its custom translation"""
    result = get_raw_translation_string("en_CORP", "errors", "account_not_found")
    expected = "The requested account could not be located."
    assert result == expected

    # Verify it's different from the English version
    result_en = get_raw_translation_string("en", "errors", "account_not_found")
    assert result != result_en

    # user_not_found is not translated in en_CORP, so it should fall back to en
    result = get_raw_translation_string("en_CORP", "errors", "user_not_found")
    expected = "Couldn't find that user."
    assert result == expected
