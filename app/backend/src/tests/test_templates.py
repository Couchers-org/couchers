# Tests jinja template rendering

from datetime import date
from typing import Any
from zoneinfo import ZoneInfo

from markupsafe import Markup

from couchers.i18n import LocalizationContext
from couchers.i18n.i18next import I18Next
from couchers.i18n.plurals import PluralRules
from couchers.templating import Jinja2Template


def _render_en_utc(template: Jinja2Template, args: dict[str, Any]) -> str:
    return template.render(args, LocalizationContext.en_utc(), i18next=I18Next())


def test_multiline() -> None:
    template = Jinja2Template(source="{{ text|multiline }}", html=False)
    rendered = _render_en_utc(template, {"text": "a\nb"})
    assert rendered == "a\nb"

    template = Jinja2Template(source="{{ text|multiline }}", html=True)
    rendered = _render_en_utc(template, {"text": "a\nb"})
    assert rendered == "a<br>b"


def test_quotelines() -> None:
    template = Jinja2Template(source="{{ text|quotelines }}", html=False)
    rendered = _render_en_utc(template, {"text": "a\nb"})
    assert rendered == "> a\n> b"


def test_html_escaping() -> None:
    template = Jinja2Template(source="Hello {{ name }}!", html=True)
    rendered = _render_en_utc(template, {"name": "<script />"})
    assert rendered == "Hello &lt;script /&gt;!"


def test_safe_html() -> None:
    template = Jinja2Template(source="Hello {{ name|html }}!", html=True)
    rendered = _render_en_utc(template, {"name": "<script />"})
    assert rendered == "Hello <script />!"


def test_date_formatting() -> None:
    the_date = date(1970, 1, 1)
    template = Jinja2Template(source="Date: {{ date }}", html=False)
    rendered = _render_en_utc(template, {"date": the_date})
    assert rendered == "Date: Thursday 1 January 1970"


def _greeting_i18next(value: str) -> I18Next:
    i18next = I18Next()
    language = i18next.add_language("en", PluralRules.en)
    language.add_string("greeting", value)
    return i18next


def test_translate_no_substitutions() -> None:
    template = Jinja2Template(source='{{ "greeting"|translate }}', html=False)
    i18next = _greeting_i18next("Hello!")
    rendered = template.render({}, LocalizationContext.en_utc(), i18next)
    assert rendered == "Hello!"


def test_translate_multiple_languages() -> None:
    template = Jinja2Template(source='{{ "greeting"|translate }}', html=False)
    i18next = I18Next()
    i18next.add_language("en", PluralRules.en).add_string("greeting", "Hello!")
    i18next.add_language("fr", PluralRules.en).add_string("greeting", "Bonjour!")
    fr_loc_context = LocalizationContext(locale="fr", timezone=ZoneInfo("Etc/UTC"))
    rendered = template.render({}, fr_loc_context, i18next)
    assert rendered == "Bonjour!"


def test_translate_with_substitutions() -> None:
    template = Jinja2Template(source='{{ "greeting"|translate(name=user_name) }}', html=False)
    i18next = _greeting_i18next("Hello, {{name}}!")
    rendered = template.render({"user_name": "Jack"}, LocalizationContext.en_utc(), i18next)
    assert rendered == "Hello, Jack!"


def test_translate_substitution_escaping() -> None:
    template = Jinja2Template(source='{{ "greeting"|translate(name=name) }}', html=True)
    i18next = _greeting_i18next("Hello, {{name}}!")
    rendered = template.render({"name": "<script />"}, LocalizationContext.en_utc(), i18next)
    assert rendered == "Hello, &lt;script /&gt;!"


def test_translate_substitution_safe_html() -> None:
    template = Jinja2Template(source='{{ "greeting"|translate(name=name) }}', html=True)
    i18next = _greeting_i18next("Hello, {{name}}!")
    rendered = template.render({"name": Markup("<script />")}, LocalizationContext.en_utc(), i18next)
    assert rendered == "Hello, <script />!"


def test_translate_translation_tags() -> None:
    template = Jinja2Template(source='{{ "greeting"|translate }}', html=True)
    i18next = _greeting_i18next("<b>Hello!</b>")
    rendered = template.render({}, LocalizationContext.en_utc(), i18next)
    assert rendered == "<b>Hello!</b>"


def test_translate_newlines_br() -> None:
    template = Jinja2Template(source='{{ "greeting"|translate }}', html=True)
    i18next = _greeting_i18next("Hello!\nWelcome!")
    rendered = template.render({}, LocalizationContext.en_utc(), i18next)
    assert rendered == "Hello!<br>Welcome!"


def test_translate_plain_strip_tags() -> None:
    template = Jinja2Template(source='{{ "greeting"|translate }}', html=False)
    i18next = _greeting_i18next("<b>Hello!</b>")
    rendered = template.render({}, LocalizationContext.en_utc(), i18next)
    assert rendered == "Hello!"


def test_translate_plain_strip_links() -> None:
    template = Jinja2Template(source='{{ "greeting"|translate }}', html=False)
    i18next = _greeting_i18next('<a href="https://example.com">Hello!</a>')
    rendered = template.render({}, LocalizationContext.en_utc(), i18next)
    assert rendered == "<https://example.com>"


def test_translate_plain_strip_mailto() -> None:
    template = Jinja2Template(source='{{ "greeting"|translate }}', html=False)
    i18next = _greeting_i18next('<a href="mailto:me@example.com">Hello!</a>')
    rendered = template.render({}, LocalizationContext.en_utc(), i18next)
    assert rendered == "<me@example.com>"
