# Tests jinja template rendering

from typing import Any
from unittest.mock import patch

from jinja2 import Environment

from couchers.templates.v2 import (
    CONTEXT_PLAINTEXT_KEY,
    CONTEXT_TRANSLATION_COMPONENT_KEY,
    CONTEXT_TRANSLATION_LANGUAGE_KEY,
    add_filters,
)

_env = Environment()
add_filters(_env)


def _render_template(
    template_str: str,
    translation_dict: dict,
    template_args: dict[str, Any] | None = None,
    plain: bool = False,
    component: str = "component",
    lang: str = "en",
) -> str:
    template = _env.from_string(template_str)
    template_args = {
        **(template_args or {}),
        CONTEXT_TRANSLATION_LANGUAGE_KEY: lang,
        CONTEXT_TRANSLATION_COMPONENT_KEY: component,
    }
    if plain:
        template_args[CONTEXT_PLAINTEXT_KEY] = True

    with patch("couchers.i18n.i18n.get_translations", new=lambda: translation_dict):
        return template.render(template_args)


def _greeting_dict(value: str) -> dict:
    return {"en": {"component": {"greeting": value}}}


def test_v2translate_no_substitutions() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}', translation_dict=_greeting_dict("Hello!")
    )
    assert translated == "Hello!"


def test_v2translate_multiple_languages() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}',
        lang="fr",
        translation_dict={"en": {"component": {"greeting": "Hello!"}}, "fr": {"component": {"greeting": "Bonjour!"}}},
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
