import pytest

from couchers.i18n.i18next import I18Next, LocalizationError
from couchers.i18n.plurals import PluralRules


def test_lookup():
    i18next = I18Next()
    i18next.add_language("en", PluralRules.en).add_string("greeting", "hello")
    assert i18next.localize("greeting", "en") == "hello"


def test_substitution():
    i18next = I18Next()
    i18next.add_language("en", PluralRules.en).add_string("greeting", "hello {{name}}!")
    assert i18next.localize("greeting", "en", {"name": "world"}) == "hello world!"


def test_localized():
    i18next = I18Next()
    en = i18next.add_language("en", PluralRules.en)
    en.add_string("greeting", "hello")
    fr = i18next.add_language("fr", PluralRules.en)
    fr.add_string("greeting", "bonjour")
    fr.fallbacks.append(en)
    assert i18next.localize("greeting", "fr") == "bonjour"


def test_fallback():
    i18next = I18Next()
    en = i18next.add_language("en", PluralRules.en)
    en.add_string("greeting", "hello")
    fr = i18next.add_language("fr", PluralRules.en)
    fr.fallbacks.append(en)
    assert i18next.localize("greeting", "fr") == "hello"


def test_mutual_fallback():
    i18next = I18Next()
    pt_pt = i18next.add_language("pt-PT", PluralRules.en)
    pt_pt.add_string("greeting", "olá")
    pt_br = i18next.add_language("pt-BR", PluralRules.en)
    pt_br.add_string("farewell", "tchau")
    pt_pt.fallbacks.append(pt_br)
    pt_br.fallbacks.append(pt_pt)
    assert i18next.localize("greeting", "pt-BR") == "olá"
    assert i18next.localize("farewell", "pt-PT") == "tchau"


def test_plural_suffixes():
    i18next = I18Next()
    en = i18next.add_language("en", PluralRules.en)
    en.add_string("apples_one", "{{count}} apple")
    en.add_string("apples_other", "{{count}} apples")
    assert i18next.localize("apples", "en", {"count": 1}) == "1 apple"
    assert i18next.localize("apples", "en", {"count": 2}) == "2 apples"


def test_plural_suffix_fallback():
    i18next = I18Next()
    en = i18next.add_language("en", PluralRules.en)
    en.add_string("apples", "{{count}} apples")
    en.add_string("apples_one", "{{count}} apple")
    assert i18next.localize("apples", "en", {"count": 1}) == "1 apple"
    assert i18next.localize("apples", "en", {"count": 2}) == "2 apples"


def test_plural_no_count():
    i18next = I18Next()
    en = i18next.add_language("en", PluralRules.en)
    en.add_string("apples_one", "apple")
    en.add_string("apples_other", "apples")
    assert i18next.localize("apples", "en", {"count": 1}) == "apple"
    assert i18next.localize("apples", "en", {"count": 2}) == "apples"


def test_load_simple_json():
    i18next = I18Next()
    en = i18next.add_language("en", PluralRules.en)
    en.load_json_dict({"greeting": "hello"})
    assert i18next.localize("greeting", "en") == "hello"


def test_load_nested_json():
    i18next = I18Next()
    en = i18next.add_language("en", PluralRules.en)
    en.load_json_dict({"greeting": {"short": "hi"}})
    assert i18next.localize("greeting.short", "en") == "hi"


def test_fallback_locale():
    i18next = I18Next()
    en = i18next.add_language("en", PluralRules.en)
    en.add_string("greeting", "hello")
    i18next.default_language = en
    assert i18next.localize("greeting", "fr") == "hello"


def test_missing_locale():
    i18next = I18Next()
    with pytest.raises(LocalizationError) as raised:
        i18next.localize("greeting", "en")
    assert raised.value.language_code == "en"
    assert raised.value.string_key == "greeting"


def test_missing_string():
    i18next = I18Next()
    i18next.add_language("en", PluralRules.en)
    with pytest.raises(LocalizationError) as raised:
        i18next.localize("greeting", "en")
    assert raised.value.language_code == "en"
    assert raised.value.string_key == "greeting"


def test_missing_plural_form():
    i18next = I18Next()
    en = i18next.add_language("en", PluralRules.en)
    en.add_string("apples_one", "{{count}} apple")
    assert i18next.localize("apples", "en", {"count": 1}) == "1 apple"
    with pytest.raises(LocalizationError) as raised:
        i18next.localize("apples", "en", {"count": 2})
    assert raised.value.language_code == "en"
    assert raised.value.string_key == "apples"


def test_extra_substitution():
    i18next = I18Next()
    i18next.add_language("en", PluralRules.en).add_string("greeting", "hello")
    assert i18next.localize("greeting", "en", substitutions={"e": "mc2"})


def test_missing_substitution():
    i18next = I18Next()
    i18next.add_language("en", PluralRules.en).add_string("greeting", "hello {{name}}")
    with pytest.raises(LocalizationError) as raised:
        i18next.localize("greeting", "en")
    assert raised.value.language_code == "en"
    assert raised.value.string_key == "greeting"


def test_missing_substitution_fallback():
    i18next = I18Next()
    en = i18next.add_language("en", PluralRules.en)
    en.add_string("greeting", "hello {{name}}")
    fr = i18next.add_language("fr", PluralRules.fr)
    fr.add_string("greeting", "bonjour {{nom}}")
    fr.fallbacks.append(en)
    assert i18next.localize("greeting", "fr", substitutions={"name": "world"}) == "hello world"
