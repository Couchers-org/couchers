import json
from collections.abc import Mapping
from functools import lru_cache
from pathlib import Path

from couchers.i18n.constants import LANGUAGE_FALLBACKS
from couchers.i18n.i18next import I18Next
from couchers.i18n.plurals import PluralRules


@lru_cache(maxsize=1)
def get_i18next() -> I18Next:
    """
    Load all translation files from the locales directory and apply fallbacks.

    Returns:
        An I18Next object that can localize the application strings.

    The result is cached so that translations are only loaded once per process.
    """

    i18next = I18Next()

    # Load all locale JSON files from the locales directory
    locales_dir = Path(__file__).parent / "locales"
    for locale_file in locales_dir.glob("*.json"):
        lang_code = locale_file.stem  # e.g., "en" from "en.json"

        with open(locale_file, "r", encoding="utf-8") as f:
            translations = json.load(f)

        plural_rule = PluralRules.for_language(lang_code) or PluralRules.en
        language = i18next.add_language(lang_code, plural_rule)
        language.load_json_dict(translations)

    # Apply ultimate fallback: English is our source of truth - must exist
    en = i18next.languages_by_code.get("en")
    if en is None:
        raise RuntimeError("English translations must be loaded")
    i18next.fallback_language = en

    # Apply other fallbacks
    for from_lang_code, to_lang_code in LANGUAGE_FALLBACKS:
        from_lang = i18next.languages_by_code.get(from_lang_code)
        to_lang = i18next.languages_by_code.get(to_lang_code)
        if from_lang is not None and to_lang is not None:
            from_lang.fallback = to_lang.fallback

    return i18next


def localize_string(
    lang: str | None, key: str, *, substitutions: Mapping[str, str | int] | None = None
) -> str:
    """
    Retrieves a translated string and performs substitutions.

    Args:
        lang: Language code (e.g., "en", "pt-BR"). If None, defaults to the default fallback language ("en")
        key: The key for the string to be looked up.
        substitutions: Dictionary of variable substitutions for the string (e.g., {"hours": 24})

    Returns:
        The translated string with substitutions applied
    """
    return get_i18next().localize(key, lang or "en", substitutions)
