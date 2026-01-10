# Tests jinja template rendering

from typing import Any
from unittest.mock import patch
from zoneinfo import ZoneInfo

from jinja2 import Environment

from couchers.i18n.i18next import I18Next
from couchers.i18n.plurals import PluralRules
from couchers.templates.v2 import (
    FilterContext,
    add_filters,
)

_env = Environment()
add_filters(_env)


def _render_template(
    template_str: str,
    translation_dict: dict[str, dict[str, str]],
    template_args: dict[str, Any] | None = None,
    plain: bool = False,
    lang: str = "en",
) -> str:
    template = _env.from_string(template_str)
    template_args = (template_args or {}).copy()
    template_args[FilterContext.KEY] = FilterContext(timezone=ZoneInfo("Etc/UTC"), locale=lang, plaintext=plain)

    mock_i18next = I18Next()
    for lang_code, strings in translation_dict.items():
        language = mock_i18next.add_language(lang_code, PluralRules.en)
        language.load_json_dict(strings)

    with patch("couchers.i18n.localize.get_i18next", new=lambda: mock_i18next):
        return template.render(template_args)


def _greeting_dict(value: str) -> dict[str, dict[str, str]]:
    return {"en": {"greeting": value}}


def test_v2translate_no_substitutions() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}', translation_dict=_greeting_dict("Hello!")
    )
    assert translated == "Hello!"


def test_v2translate_multiple_languages() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}',
        lang="fr",
        translation_dict={"en": {"greeting": "Hello!"}, "fr": {"greeting": "Bonjour!"}},
    )
    assert translated == "Bonjour!"


def test_v2translate_with_substitutions() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate(name=user_name) }}',
        template_args={"user_name": "Jack"},
        translation_dict=_greeting_dict("Hello, {{name}}!"),
    )
    assert translated == "Hello, Jack!"


def test_v2translate_escaping() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate(name=name) }}',
        template_args={"name": "<script />"},
        translation_dict=_greeting_dict("Hello, {{name}}!"),
    )
    assert translated == "Hello, &lt;script /&gt;!"


def test_v2translate_translation_tags() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}', translation_dict=_greeting_dict("<b>Hello!</b>")
    )
    assert translated == "<b>Hello!</b>"


def test_v2translate_newlines_br() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}', translation_dict=_greeting_dict("Hello!\nWelcome!")
    )
    assert translated == "Hello!<br>Welcome!"


def test_v2translate_plain_strip_tags() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}', plain=True, translation_dict=_greeting_dict("<b>Hello!</b>")
    )
    assert translated == "Hello!"


def test_v2translate_plain_strip_links() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}',
        plain=True,
        translation_dict=_greeting_dict('<a href="#foo">Hello!</a>'),
    )
    assert translated == "<Hello!>"
