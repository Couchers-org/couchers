# Tests jinja template rendering

from dataclasses import dataclass
from typing import Any
from couchers.i18n.i18n import perform_substitutions
from couchers.templates.v2 import add_filters, CONTEXT_LANGUAGE_KEY, CONTEXT_COMPONENT_KEY, CONTEXT_PLAINTEXT_KEY
from jinja2 import Environment
from unittest.mock import patch

_env = Environment()
add_filters(_env)

def _render_template(template_str: str, translation_dict: dict, template_args: dict[str, Any] | None = None, plain: bool = False, lang: str = "en") -> str:
    template = _env.from_string(template_str)
    template_args = {
        **(template_args or {}),
        CONTEXT_LANGUAGE_KEY: lang,
        CONTEXT_COMPONENT_KEY: "test_component", # Ignored in mocking
    }
    if plain:
        template_args[CONTEXT_PLAINTEXT_KEY] = True

    def mock_get_translation(lang: str, component: str, string_name: str, *, substitutions: dict[str, str] | None = None) -> str:
        template = translation_dict[lang][string_name]
        return perform_substitutions(template, substitutions)

    with patch("couchers.templates.v2.get_raw_translation_string", new=mock_get_translation):
        return template.render(template_args)


def test_v2translate_no_substitutions() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}',
        translation_dict={
            "en" : {"greeting": "Hello!"}
        }
    )
    assert translated == "Hello!"

def test_v2translate_multiple_languages() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}',
        lang="fr",
        translation_dict={
            "en" : {"greeting": "Hello!"},
            "fr" : {"greeting": "Bonjour!"}
        }
    )
    assert translated == "Bonjour!"

def test_v2translate_with_substitutions() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate(name=user_name) }}',
        template_args={"user_name": "Jack"},
        translation_dict={
            "en" : {"greeting": "Hello, {{name}}!"}
        }
    )
    assert translated == "Hello, Jack!"

def test_v2translate_escaping() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate(name=name) }}',
        template_args={"name": "<script />"},
        translation_dict={
            "en" : {"greeting": "Hello, {{name}}!"}
        }
    )
    assert translated == "Hello, &lt;script /&gt;!"

def test_v2translate_translation_tags() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}',
        translation_dict={
            "en" : {"greeting": "<b>Hello!</b>"}
        }
    )
    assert translated == "<b>Hello!</b>"

def test_v2translate_newlines_br() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}',
        translation_dict={
            "en" : {"greeting": "Hello!\nWelcome!"}
        }
    )
    assert translated == "Hello!<br />Welcome!"

def test_v2translate_plain_strip_tags() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}',
        plain=True,
        translation_dict={
            "en" : {"greeting": "<b>Hello!</b>"}
        }
    )
    assert translated == "Hello!"

def test_v2translate_plain_strip_links() -> None:
    translated = _render_template(
        template_str='{{ "greeting"|v2translate }}',
        plain=True,
        translation_dict={
            "en" : {"greeting": '<a href="#foo">Hello!</a>'}
        }
    )
    assert translated == "<Hello!>"
