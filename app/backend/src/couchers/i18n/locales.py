import json
from collections.abc import Callable
from functools import lru_cache
from pathlib import Path

import babel

from couchers.i18n.i18next import I18Next

# The default locale if a language or string is unavailable.
# Note: "en" is a valid locale even if it doesn't include a region.
DEFAULT_LOCALE = "en"

# Locales that we support for regional formatting,
# but don't have dedicated translations.
NON_TRANSLATED_LOCALES: list[str] = ["en-US"]

# Locale fallbacks (for those that don't fallback to English).
# If a string is not found in the requested language, we try the provided one before English
# Some mutually intelligible language variants fallback to each other.
_LOCALE_FALLBACKS: dict[str, str] = {
    "pt-BR": "pt",
    "pt": "pt-BR",
    "en-US": "en",
    "es-419": "es",
    "es": "es-419",
    "fr-CA": "fr",
}


def get_locales_with_translations() -> list[str]:
    """Gets the list of locales which have translations."""
    return list(get_main_i18next().translations_by_locale.keys())


def is_locale_with_translations(locale: str) -> bool:
    """Checks if we have translations for a given locale."""
    return locale in get_main_i18next().translations_by_locale.keys()


def get_supported_locales() -> list[str]:
    """Gets the list of locales supported."""
    return get_locales_with_translations() + NON_TRANSLATED_LOCALES


def is_supported_locale(locale: str) -> bool:
    """Checks if a locale is supported."""
    return locale in get_supported_locales()


def to_supported_locale(locale: str) -> str:
    """Converts a locale to the closest supported one."""

    if is_supported_locale(locale):
        return locale

    # Normalize casing in case that's why we don't have a match (e.g., "en-us" vs "en-US")
    try:
        # Locale.parse returns either a 4-tuple or a 5-tuple
        result_tuple = babel.parse_locale(locale, sep="-")
        if len(result_tuple) == 4:
            result = (*result_tuple, None)  # Normalize to 5-tuple for unpacking
        language, territory, script, _, _ = result
    except ValueError:
        return DEFAULT_LOCALE

    language = language.lower()
    territory = territory.upper() if territory else None  # pt-BR, fr-CA
    script = script.title() if script else None  # zh-Hans, zh-Hant

    normalized_locale = "-".join(filter(None, [language, territory, script]))
    if is_supported_locale(normalized_locale):
        return normalized_locale

    if is_supported_locale(language):
        return language

    return DEFAULT_LOCALE


def get_locale_chain(locale: str) -> list[str]:
    """Gets the ordered list of locales to try when looking up a string, starting with the given locale."""
    if fallback := _LOCALE_FALLBACKS.get(locale):
        return [locale, fallback, DEFAULT_LOCALE]
    if locale == DEFAULT_LOCALE:
        return [locale]
    return [locale, DEFAULT_LOCALE]


def get_babel_locale(locale: str) -> babel.Locale:
    """
    Returns the babel locale object for a given locale string.
    Guaranteed by tests to succeed for supported locales.
    """
    # TODO(#9184): Once we have en-US available, "en" should return the babel locale for "en-001" (Global English)
    return babel.Locale.parse(locale, sep="-")


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

    return i18next


@lru_cache(maxsize=1)
def get_main_i18next() -> I18Next:
    """Gets the I18Next instance for the main locales files."""
    return load_locales(Path(__file__).parent / "locales")


@lru_cache(maxsize=1)
def get_admin_i18next() -> I18Next:
    """Gets the I18Next instance for the admin/editor locales files (English only)."""
    return load_locales(Path(__file__).parent / "admin_locales")


# Maps a translation component name to the I18Next instance that holds its strings. Servicers select
# the component when localizing (e.g. admin/editor errors live in their own English-only component).
_TRANSLATION_COMPONENTS: dict[str, Callable[[], I18Next]] = {
    "main": get_main_i18next,
    "admin": get_admin_i18next,
}


def get_translation_component(component: str) -> I18Next:
    """Gets the I18Next instance for a named translation component."""
    return _TRANSLATION_COMPONENTS[component]()
