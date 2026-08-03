import babel
import pytest
from markupsafe import Markup

from couchers.i18n.i18next import I18Next, LocalizationError, full_string_key


def test_lookup():
    i18next = I18Next()
    i18next.add_translation("en").add_string("greeting", "hello")
    assert i18next.localize("greeting", ["en"]) == "hello"


def test_substitution():
    i18next = I18Next()
    i18next.add_translation("en").add_string("greeting", "hello {{name}}!")
    assert i18next.localize("greeting", ["en"], {"name": "world"}) == "hello world!"


def test_placeholder_with_spacing():
    i18next = I18Next()
    i18next.add_translation("en").add_string("greeting", "hello {{ name }}!")
    assert i18next.localize("greeting", ["en"], {"name": "world"}) == "hello world!"


def test_localized():
    i18next = I18Next()
    en = i18next.add_translation("en")
    en.add_string("greeting", "hello")
    fr = i18next.add_translation("fr")
    fr.add_string("greeting", "bonjour")
    assert i18next.localize("greeting", ["fr", "en"]) == "bonjour"


def test_fallback():
    i18next = I18Next()
    en = i18next.add_translation("en")
    en.add_string("greeting", "hello")
    i18next.add_translation("fr")
    assert i18next.localize("greeting", ["xx", "fr", "en"]) == "hello"


def test_mutual_fallback():
    i18next = I18Next()
    pt_pt = i18next.add_translation("pt-PT")
    pt_pt.add_string("greeting", "olá")
    pt_br = i18next.add_translation("pt-BR")
    pt_br.add_string("farewell", "tchau")
    assert i18next.localize("greeting", ["pt-BR", "pt-PT"]) == "olá"
    assert i18next.localize("farewell", ["pt-PT", "pt-BR"]) == "tchau"


def test_plural_suffixes():
    i18next = I18Next()
    en = i18next.add_translation("en")
    en.add_string("apples_one", "{{count}} apple")
    en.add_string("apples_other", "{{count}} apples")
    assert i18next.localize("apples", ["en"], {"count": 1}) == "1 apple"
    assert i18next.localize("apples", ["en"], {"count": 2}) == "2 apples"


def test_plural_suffix_fallback():
    i18next = I18Next()
    en = i18next.add_translation("en")
    en.add_string("apples", "{{count}} apples")
    en.add_string("apples_one", "{{count}} apple")
    assert i18next.localize("apples", ["en"], {"count": 1}) == "1 apple"
    assert i18next.localize("apples", ["en"], {"count": 2}) == "2 apples"


def test_plural_no_count():
    i18next = I18Next()
    en = i18next.add_translation("en")
    en.add_string("apples_one", "apple")
    en.add_string("apples_other", "apples")
    assert i18next.localize("apples", ["en"], {"count": 1}) == "apple"
    assert i18next.localize("apples", ["en"], {"count": 2}) == "apples"


def test_missing_babel_locale():
    i18next = I18Next()

    with pytest.raises(babel.UnknownLocaleError):
        i18next.add_translation("piglatin")


def test_load_simple_json():
    i18next = I18Next()
    en = i18next.add_translation("en")
    en.load_json_dict({"greeting": "hello"})
    assert i18next.localize("greeting", ["en"]) == "hello"


def test_load_nested_json():
    i18next = I18Next()
    en = i18next.add_translation("en")
    en.load_json_dict({"greeting": {"short": "hi"}})
    assert i18next.localize("greeting.short", ["en"]) == "hi"


# An empty string in a translation should be considered as the lack of a string,
# since this is how Weblate/i18next interpret it.
def test_fallback_on_empty_string():
    i18next = I18Next()
    en = i18next.add_translation("en", json_dict={"greeting": "hello"})
    i18next.add_translation("fr", json_dict={"greeting": ""})
    assert i18next.localize("greeting", ["fr", "en"]) == "hello"


def test_missing_locale():
    i18next = I18Next()
    with pytest.raises(LocalizationError) as raised:
        i18next.localize("greeting", ["en"])
    assert raised.value.locales == ["en"]
    assert raised.value.string_key == "greeting"


def test_missing_string():
    i18next = I18Next()
    i18next.add_translation("en")
    with pytest.raises(LocalizationError) as raised:
        i18next.localize("greeting", ["en"])
    assert raised.value.locales == ["en"]
    assert raised.value.string_key == "greeting"


def test_missing_plural_form():
    i18next = I18Next()
    en = i18next.add_translation("en")
    en.add_string("apples_one", "{{count}} apple")
    assert i18next.localize("apples", ["en"], {"count": 1}) == "1 apple"
    with pytest.raises(LocalizationError) as raised:
        i18next.localize("apples", ["en"], {"count": 2})
    assert raised.value.locales == ["en"]
    assert raised.value.string_key == "apples"


def test_extra_substitution():
    i18next = I18Next()
    i18next.add_translation("en").add_string("greeting", "hello")
    assert i18next.localize("greeting", ["en"], substitutions={"e": "mc2"})


def test_missing_substitution():
    i18next = I18Next()
    i18next.add_translation("en").add_string("greeting", "hello {{name}}")
    with pytest.raises(LocalizationError) as raised:
        i18next.localize("greeting", ["en"])
    assert raised.value.locales == ["en"]
    assert raised.value.string_key == "greeting"


def test_missing_substitution_fallback():
    i18next = I18Next()
    en = i18next.add_translation("en")
    en.add_string("greeting", "hello {{name}}")
    fr = i18next.add_translation("fr")
    fr.add_string("greeting", "bonjour {{nom}}")
    assert i18next.localize("greeting", ["fr", "en"], substitutions={"name": "world"}) == "hello world"


def test_escaping():
    i18next = I18Next()
    i18next.add_translation("en", json_dict={"greeting": "hello {{name}}"})

    # localize returns an str, which is considered untrusted for markup,
    # so it can contain tags because the renderer is resposible for escaping them.
    # Markup in this context is unescaped back into plaintext to avoid double-escaping.
    assert i18next.localize("greeting", ["en"], substitutions={"name": "<script/>"}) == "hello <script/>"
    assert i18next.localize("greeting", ["en"], substitutions={"name": Markup("&lt;script/&gt;")}) == "hello <script/>"

    # localize_with_markup returns a Markup object, which is considered trusted for markup,
    # so it can only interpolate tags if they are also trusted, and otherwise will escape them.
    assert (
        i18next.localize_with_markup("greeting", ["en"], substitutions={"name": "<script/>"}) == "hello &lt;script/&gt;"
    )
    assert (
        i18next.localize_with_markup("greeting", ["en"], substitutions={"name": Markup("<script/>")})
        == "hello <script/>"
    )


def test_full_string_key():
    assert full_string_key("key", relative_base=None) == "key"
    assert full_string_key("key", relative_base="base") == "key"
    assert full_string_key(".key", relative_base="base") == "base.key"
    with pytest.raises(ValueError):
        assert full_string_key(".key", relative_base=None)
