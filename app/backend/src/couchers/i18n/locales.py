import json
from pathlib import Path

from couchers.i18n.i18next import I18Next

# The default locale if a language or string is unavailable.
# Note: "en" is a valid locale even if it doesn't include a region.
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
        locale = locale_file.stem  # e.g., "en" from "en.json"

        with open(locale_file, "r", encoding="utf-8") as f:
            translations = json.load(f)

        translation = i18next.add_translation(locale)
        translation.load_json_dict(translations)

    # English is our default for undefined languages
    default_translation = i18next.translations_by_locale.get(DEFAULT_LOCALE)
    if default_translation is None:
        raise RuntimeError("English translations must be loaded")
    i18next.default_translation = default_translation

    # Apply fallbacks
    for translation in i18next.translations_by_locale.values():
        for fallback_locale in get_locale_fallbacks(translation.locale):
            translation.fallbacks.append(i18next.translations_by_locale[fallback_locale])

    return i18next
