import json
from pathlib import Path

from couchers.i18n.i18next import I18Next
from couchers.i18n.plurals import PluralRules

# The default locale if a language or string is unavailable.
DEFAULT_LOCALE = "en"

# Locale fallbacks (for those that don't fallback to English).
# If a string is not found in the requested language, we try the provided one before English
# Some mutually intelligible language variants fallback to each other.
_LOCALE_FALLBACKS: dict[str, str] = {
    "pt-BR": "pt",
    "pt": "pt-BR",
    "es-419": "es",
    "es": "es-419",
    "fr-CA": "fr",
}

def get_locale_fallbacks(locale: str) -> list[str]:
    """Gets the list of locales to which to fallback to if the given one is unavailable."""
    if fallback := _LOCALE_FALLBACKS.get(locale):
        return [fallback, DEFAULT_LOCALE]
    if locale == DEFAULT_LOCALE:
        return []
    return [DEFAULT_LOCALE]


def load_locales(directory: Path) -> I18Next:
    """Load all translation files from a locales directory and apply fallbacks."""

    i18next = I18Next()

    # Load all locale JSON files from the locales directory
    for locale_file in directory.glob("*.json"):
        lang_code = locale_file.stem  # e.g., "en" from "en.json"

        with open(locale_file, "r", encoding="utf-8") as f:
            translations = json.load(f)

        plural_rule = PluralRules.for_language(lang_code) or PluralRules.en
        language = i18next.add_language(lang_code, plural_rule)
        language.load_json_dict(translations)

    # English is our default for undefined languages
    en = i18next.languages_by_code.get("en")
    if en is None:
        raise RuntimeError("English translations must be loaded")
    i18next.default_language = en

    # Apply fallbacks
    for language in i18next.languages_by_code.values():
        for fallback_code in get_locale_fallbacks(language.code):
            language.fallbacks.append(i18next.languages_by_code[fallback_code])

    return i18next
