# Tests jinja template rendering

from datetime import date
from markupsafe import Markup
from typing import Any
from zoneinfo import ZoneInfo

from couchers.i18n.i18next import I18Next
from couchers.i18n.plurals import PluralRules
from couchers.templates.v2 import (
    Context,
    render_template,
)


def _render_template(
    template_str: str,
    *,
    args: dict[str, Any] | None = None,
    translation_dict: dict[str, dict[str, str]] | None = None,
    output_html: bool = True,
    lang: str = "en",
) -> str:
    mock_i18next = I18Next()
    if translation_dict:
        for lang_code, strings in translation_dict.items():
            language = mock_i18next.add_language(lang_code, PluralRules.en)
            language.load_json_dict(strings)

    context = Context(
        output_html=output_html,
        i18next=mock_i18next,
        locale=lang,
        timezone=ZoneInfo("Etc/UTC"))

    return render_template(template_str, args or {}, context)

def test_multiline() -> None:
    rendered = _render_template(
        "{{ text|multiline }}",
        args={ "text": "a\nb" },
        output_html=False)
    assert rendered == "a\nb"

    rendered = _render_template(
        "{{ text|multiline }}",
        args={ "text": "a\nb" },
        output_html=True)
    assert rendered == "a<br>b"

def test_quotelines() -> None:
    rendered = _render_template(
        "{{ text|quotelines }}",
        args={ "text": "a\nb" },
        output_html=False)
    assert rendered == "> a\n> b"

def test_html_escaping() -> None:
    rendered = _render_template(
        "Hello {{ name }}!",
        args={ "name": "<script />" },
        output_html=True)
    assert rendered == "Hello &lt;script /&gt;!"

def test_safe_html() -> None:
    rendered = _render_template(
        "Hello {{ name|html }}!",
        args={ "name": "<script />" },
        output_html=True)
    assert rendered == "Hello <script />!"

def test_date_formatting() -> None:
    the_date = date(1970, 1, 1)
    rendered = _render_template("Date: {{ date }}",
        args={ "date": the_date },
        lang="en")
    assert rendered == "Date: Thursday 1 January 1970"


def _greeting_dict(value: str) -> dict[str, dict[str, str]]:
    return {"en": {"greeting": value}}


def test_translate_no_substitutions() -> None:
    rendered = _render_template('{{ "greeting"|translate }}', translation_dict=_greeting_dict("Hello!"))
    assert rendered == "Hello!"


def test_translate_multiple_languages() -> None:
    rendered = _render_template(
        '{{ "greeting"|translate }}',
        translation_dict={"en": {"greeting": "Hello!"}, "fr": {"greeting": "Bonjour!"}},
        lang="fr",
    )
    assert rendered == "Bonjour!"


def test_translate_with_substitutions() -> None:
    rendered = _render_template(
        '{{ "greeting"|translate(name=user_name) }}',
        args={"user_name": "Jack"},
        translation_dict=_greeting_dict("Hello, {{name}}!"),
    )
    assert rendered == "Hello, Jack!"


def test_translate_substitution_escaping() -> None:
    rendered = _render_template(
        '{{ "greeting"|translate(name=name) }}',
        args={"name": "<script />"},
        translation_dict=_greeting_dict("Hello, {{name}}!"),
        output_html=True
    )
    assert rendered == "Hello, &lt;script /&gt;!"


def test_translate_substitution_safe_html() -> None:
    rendered = _render_template(
        '{{ "greeting"|translate(name=name) }}',
        args={"name": Markup("<script />") },
        translation_dict=_greeting_dict("Hello, {{name}}!"),
        output_html=True
    )
    assert rendered == "Hello, <script />!"


def test_translate_translation_tags() -> None:
    rendered = _render_template(
        '{{ "greeting"|translate }}',
        translation_dict=_greeting_dict("<b>Hello!</b>"),
        output_html=True
    )
    assert rendered == "<b>Hello!</b>"


def test_translate_newlines_br() -> None:
    rendered = _render_template(
        '{{ "greeting"|translate }}',
        translation_dict=_greeting_dict("Hello!\nWelcome!"),
        output_html=True
    )
    assert rendered == "Hello!<br>Welcome!"


def test_translate_plain_strip_tags() -> None:
    rendered = _render_template(
        '{{ "greeting"|translate }}',
        translation_dict=_greeting_dict("<b>Hello!</b>"),
        output_html=False
    )
    assert rendered == "Hello!"


def test_translate_plain_strip_links() -> None:
    rendered = _render_template(
        '{{ "greeting"|translate }}',
        translation_dict=_greeting_dict('<a href="https://example.com">Hello!</a>'),
        output_html=False
    )
    assert rendered == "<https://example.com>"
