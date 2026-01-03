"""
Implements localizing strings stored in the i18next json format.
"""

import re
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

from couchers.i18n.plurals import PluralRule

PLURALIZABLE_VARIABLE_NAME = "count"
"""Special variable name for which i18next supports pluralization forms."""


@dataclass
class I18Next:
    """Retrieves translated strings from their keys based on the i18next format."""

    languages_by_code: dict[str, Language] = field(default_factory=dict)
    default_language: Language | None = None
    """The language used to look up strings in unsupported languages."""

    def add_language(self, code: str, plural_rule: PluralRule) -> Language:
        language = Language(code, plural_rule)
        self.languages_by_code[code] = language
        return language

    def find_string(
        self, key: str, language_code: str, substitutions: Mapping[str, str | int] | None = None
    ) -> String | None:
        """Find the string that will be localized, applying fallbacks and variant selection."""
        language = self.languages_by_code.get(language_code, self.default_language)
        while True:
            if language is None:
                raise LocalizationError(language_code, key)

            string = language.find_string(key, substitutions)
            if string is None or not string.template.can_render(substitutions):
                language = language.fallback
                continue

            return string

    def localize(
        self, string_key: str, language_code: str, substitutions: Mapping[str, str | int] | None = None
    ) -> str:
        if string := self.find_string(string_key, language_code, substitutions):
            return string.render(substitutions)
        else:
            raise LocalizationError(language_code, string_key)


@dataclass
class Language:
    """A set of translated strings for a language."""

    code: str
    """The language code, e.g. 'en'"""
    plural_rule: PluralRule
    """The rule for plurals in this language."""
    strings_by_key: dict[str, String] = field(default_factory=dict)
    fallback: Language | None = None

    def load_json_dict(self, json_dict: Mapping[str, Any]) -> None:
        def add_strings(json_dict: Mapping[str, Any], key_prefix: str | None) -> None:
            for k, v in json_dict.items():
                full_key = f"{key_prefix}.{k}" if key_prefix else k
                if isinstance(v, str):
                    self.add_string(full_key, v)
                elif isinstance(v, dict):
                    add_strings(v, key_prefix=full_key)
                else:
                    raise ValueError(f"Unexpected value type in language JSON: {type(v)}")

        add_strings(json_dict, key_prefix=None)

    def add_string(self, key: str, value: str) -> None:
        self.strings_by_key[key] = String(key, StringTemplate.parse(value))

    def find_string(self, key: str, substitutions: Mapping[str, str | int] | None = None) -> String | None:
        # if we have a numerical "count" substitution,
        # i18next will first search for a key with a suffix
        # based on the plural category suggested by the count
        # according to the current language's rules.
        if substitutions:
            if count := substitutions.get(PLURALIZABLE_VARIABLE_NAME):
                if isinstance(count, int):
                    plural_category = self.plural_rule(count)
                    plural_key = key + "_" + plural_category.value
                    if string := self.strings_by_key.get(plural_key):
                        return string
        return self.strings_by_key.get(key)

    def localize(self, string_key: str, substitutions: Mapping[str, str | int] | None = None) -> str:
        string = self.find_string(string_key, substitutions)
        if string is None:
            raise LocalizationError(language_code=self.code, string_key=string_key)
        return string.render(substitutions)


@dataclass(frozen=True, slots=True)
class String:
    """An i18next string key + template pair."""

    key: str
    template: StringTemplate

    def render(self, substitutions: Mapping[str, str | int] | None) -> str:
        return self.template.render(substitutions)


@dataclass(frozen=True, slots=True)
class StringTemplate:
    """A string value which may contain variable placeholders."""

    segments: list[StringSegment]

    def can_render(self, substitutions: Mapping[str, str | int] | None) -> bool:
        for segment in self.segments:
            if segment.is_variable:
                if not substitutions or substitutions.get(segment.text) is None:
                    return False
        return True

    def render(self, substitutions: Mapping[str, str | int] | None) -> str:
        substrings: list[str] = []
        for segment in self.segments:
            if segment.is_variable:
                if substitutions is not None and segment.text in substitutions:
                    substrings.append(str(substitutions[segment.text]))
                else:
                    raise ValueError(f"Missing substitution for variable '{segment.text}'")
            else:
                substrings.append(segment.text)
        return "".join(substrings)

    @staticmethod
    def parse(value: str) -> StringTemplate:
        last_index = 0
        segments: list[StringSegment] = []
        for match in re.finditer(r"\{\{([^\}]+)\}\}", value):
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
    """Raised failing to localize a string, e.g. if it is not found in any fallback language."""

    def __init__(self, language_code: str, string_key: str):
        self.language_code = language_code
        self.string_key = string_key
        super().__init__(f"Could not localize string {string_key} for language {language_code}")
