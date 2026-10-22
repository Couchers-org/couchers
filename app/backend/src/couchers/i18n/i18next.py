"""
Implements localizing strings stored in the i18next json format.
"""

import re
from collections.abc import Mapping
from dataclasses import dataclass
from html import escape, unescape
from typing import Any

import babel
from markupsafe import Markup

PLURALIZABLE_VARIABLE_NAME = "count"
"""Special variable name for which i18next supports pluralization forms."""


# A dictionary of values to substitute placeholders with.
# str: Default case, will be escaped if localizing with markup.
# int: Supports plurals.
# Markup: Will be unescaped if localizing without markup.
SubstitutionDict = Mapping[str, str | int | Markup]


class I18Next:
    """Retrieves translated strings from their keys based on the i18next format."""

    def __init__(self) -> None:
        self.translations_by_locale: dict[str, Translation] = dict()

    def add_translation(self, locale: str, *, json_dict: dict[str, Any] | None = None) -> Translation:
        translation = Translation(babel_locale=babel.Locale.parse(locale, sep="-"))
        self.translations_by_locale[locale] = translation
        if json_dict:
            translation.load_json_dict(json_dict)
        return translation

    def find_string(self, key: str, locales: list[str], substitutions: SubstitutionDict | None = None) -> String | None:
        """Find the string that will be localized, trying each locale in order."""
        for locale in locales:
            if t := self.translations_by_locale.get(locale):
                if string := t.find_string(key, substitutions):
                    if string.template.can_render(substitutions):
                        return string

        raise LocalizationError(locales, key)

    def localize(self, string_key: str, locales: list[str], substitutions: SubstitutionDict | None = None) -> str:
        """Finds a translated string in the best matching locale and performs substitutions."""
        if string := self.find_string(string_key, locales, substitutions):
            return string.render(substitutions)
        else:
            raise LocalizationError(locales, string_key)

    def localize_with_markup(
        self, string_key: str, locales: list[str], substitutions: SubstitutionDict | None = None
    ) -> Markup:
        """
        Finds a translated string that might contain markup in the best matching locale,
        and performs substitutions in a way that results in a markup-safe string.
        """
        if string := self.find_string(string_key, locales, substitutions):
            return string.render_with_markup(substitutions)
        else:
            raise LocalizationError(locales, string_key)


class Translation:
    """A set of translated strings for a locale."""

    def __init__(self, *, babel_locale: babel.Locale) -> None:
        # The Babel library locale for this translation. Used to resolved plural forms.
        self.babel_locale = babel_locale
        self.strings_by_key: dict[str, String] = dict()

    @property
    def locale(self) -> str:
        return str(self.babel_locale).replace("_", "-")

    def load_json_dict(self, json_dict: Mapping[str, Any]) -> None:
        def add_strings(json_dict: Mapping[str, Any], key_prefix: str | None) -> None:
            for k, v in json_dict.items():
                full_key = f"{key_prefix}.{k}" if key_prefix else k
                if isinstance(v, str):
                    self.add_string(full_key, v)
                elif isinstance(v, dict):
                    add_strings(v, key_prefix=full_key)
                else:
                    raise ValueError(f"Unexpected value type in locale JSON: {type(v)}")

        add_strings(json_dict, key_prefix=None)

    def add_string(self, key: str, value: str) -> None:
        # Weblate and i18next consider an empty string as the absence of a translation.
        if value:
            self.strings_by_key[key] = String(key, StringTemplate.parse(value))

    def find_string(self, key: str, substitutions: SubstitutionDict | None = None) -> String | None:
        # if we have a numerical "count" substitution,
        # i18next will first search for a key with a suffix
        # based on the plural category suggested by the count
        # according to the current locale's rules.
        if substitutions:
            if count := substitutions.get(PLURALIZABLE_VARIABLE_NAME):
                if isinstance(count, int):
                    plural_key = key + "_" + self.babel_locale.plural_form(count)
                    if string := self.strings_by_key.get(plural_key):
                        return string
        return self.strings_by_key.get(key)

    def localize(self, string_key: str, substitutions: SubstitutionDict | None = None) -> str:
        string = self.find_string(string_key, substitutions)
        if string is None:
            raise LocalizationError(locales=[self.locale], string_key=string_key)
        return string.render(substitutions)

    def localize_with_markup(self, string_key: str, substitutions: SubstitutionDict | None = None) -> Markup:
        string = self.find_string(string_key, substitutions)
        if string is None:
            raise LocalizationError(locales=[self.locale], string_key=string_key)
        return string.render_with_markup(substitutions)


@dataclass(frozen=True, slots=True)
class String:
    """An i18next string key + template pair."""

    key: str
    template: StringTemplate

    def render(self, substitutions: SubstitutionDict | None) -> str:
        return self.template.render(substitutions)

    def render_with_markup(self, substitutions: SubstitutionDict | None) -> Markup:
        return self.template.render_with_markup(substitutions)


@dataclass(frozen=True, slots=True)
class StringTemplate:
    """A string value which may contain variable placeholders."""

    segments: list[StringSegment]

    def can_render(self, substitutions: SubstitutionDict | None) -> bool:
        for segment in self.segments:
            if segment.is_variable:
                if not substitutions or substitutions.get(segment.text) is None:
                    return False
        return True

    def render(self, substitutions: SubstitutionDict | None) -> str:
        return self._render(substitutions, with_markup=False)

    def render_with_markup(self, substitutions: SubstitutionDict | None) -> Markup:
        return Markup(self._render(substitutions, with_markup=True))

    def _render(self, substitutions: SubstitutionDict | None, with_markup: bool) -> str:
        substrings: list[str] = []
        for segment in self.segments:
            if segment.is_variable:
                if substitutions is not None and segment.text in substitutions:
                    value = substitutions[segment.text]
                    if with_markup and not isinstance(value, Markup) and not isinstance(value, int):
                        # Auto-escape since we're producing markup
                        substrings.append(escape(value))
                    elif isinstance(value, Markup) and not with_markup:
                        # We're producing a string where markup is not evaluated
                        # so resolve escape sequences like &quot;
                        substrings.append(unescape(value))
                    else:
                        substrings.append(str(value))
                else:
                    raise ValueError(f"Missing substitution for variable '{segment.text}'")
            else:
                substrings.append(segment.text)
        return "".join(substrings)

    @staticmethod
    def parse(value: str) -> StringTemplate:
        last_index = 0
        segments: list[StringSegment] = []
        for match in re.finditer(r"\{\{\s*([^\}]+?)\s*\}\}", value):
            if match.start() > last_index:
                segments.append(StringSegment(text=value[last_index : match.start()], is_variable=False))
            segments.append(StringSegment(text=match.group(1), is_variable=True))
            last_index = match.end()
        if last_index < len(value):
            segments.append(StringSegment(text=value[last_index:], is_variable=False))
        return StringTemplate(segments)


@dataclass(frozen=True, slots=True)
class StringSegment:
    """Either a literal text segment or a variable placeholder."""

    text: str
    is_variable: bool = False


class LocalizationError(Exception):
    """Raised failing to localize a string, e.g. if it is not found in any of the given locales."""

    def __init__(self, locales: list[str], string_key: str):
        self.locales = locales
        self.string_key = string_key
        super().__init__(f"Could not localize string {string_key} for locales {locales}")


def full_string_key(key: str, *, relative_base: str | None) -> str:
    """Resolves any relative string key (starting with '.') into a full string key."""
    if key.startswith("."):
        if relative_base is None:
            raise ValueError("Relative string key requires a relative base.")
        return relative_base + key
    return key
