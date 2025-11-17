import json
from functools import lru_cache
from pathlib import Path

from couchers.i18n.constants import DEFAULT_FALLBACK, LANGUAGE_FALLBACKS


class MissingTranslationError(Exception):
    """Raised when a translation template is not found in any fallback language."""

    def __init__(self, lang: str, component: str, string_name: str):
        self.lang = lang
        self.component = component
        self.string_name = string_name
        super().__init__(f"Missing translation: {lang}.{component}.{string_name}")


@lru_cache(maxsize=1)
def get_translations() -> dict[str, dict[str, dict[str, str]]]:
    """
    Load all translation files from the locales directory and apply fallbacks.
    Each locale JSON file contains components as top-level keys that map to
    dictionaries of string translations. Fallbacks are prebaked so every language
    has complete coverage using English as the base and applying fallbacks in the
    correct precedence order.

    Returns:
        Dictionary structure: lang -> component -> (string -> translated string)

    The result is cached so that translations are only loaded once per process.
    """
    all_langs_all_strings: dict[str, dict[str, dict[str, str]]] = {}

    locales_dir = Path(__file__).parent / "locales"

    # Load all locale JSON files from the locales directory
    for locale_file in locales_dir.glob("*.json"):
        lang = locale_file.stem  # e.g., "en" from "en.json"

        with open(locale_file, "r", encoding="utf-8") as f:
            translations = json.load(f)

        # Initialize the language dictionary if needed
        if lang not in all_langs_all_strings:
            all_langs_all_strings[lang] = {}

        # Each top-level key in the JSON file is a component
        for component_name, component_translations in translations.items():
            if component_name not in all_langs_all_strings[lang]:
                all_langs_all_strings[lang][component_name] = {}

            # Store the translations for this component
            all_langs_all_strings[lang][component_name] = component_translations

    # Apply fallbacks: English is our source of truth - must exist
    if "en" not in all_langs_all_strings:
        raise RuntimeError("English translations must be loaded")

    en_strings = all_langs_all_strings["en"]

    # Get all languages we need to process (loaded languages + those in fallback config)
    all_languages = set(all_langs_all_strings.keys()) | set(LANGUAGE_FALLBACKS.keys())

    for lang in all_languages:
        if lang == "en":
            continue  # English is already complete

        # Start with a complete copy of English as the base
        lang_strings = {}
        for component in en_strings:
            lang_strings[component] = en_strings[component].copy()

        # Get fallback chain for this language
        fallback_chain = LANGUAGE_FALLBACKS.get(lang, DEFAULT_FALLBACK)

        # Apply fallbacks in reverse order (so more specific overrides less specific)
        # For pt-BR with fallbacks ["pt", "en"]: Apply "en" (already done) → then "pt"
        for fallback_lang in reversed(fallback_chain):
            if fallback_lang in all_langs_all_strings:
                for component in all_langs_all_strings[fallback_lang]:
                    if component not in lang_strings:
                        lang_strings[component] = {}
                    lang_strings[component].update(all_langs_all_strings[fallback_lang][component])

        # Finally, apply the language's own translations (highest priority)
        if lang in all_langs_all_strings:
            for component in all_langs_all_strings[lang]:
                if component not in lang_strings:
                    lang_strings[component] = {}
                lang_strings[component].update(all_langs_all_strings[lang][component])

        # Replace the language entry with the complete version
        all_langs_all_strings[lang] = lang_strings

    return all_langs_all_strings


def get_raw_translation_string(
    lang: str | None, component: str, string_name: str, *, substitutions: dict[str, str] | None = None
) -> str:
    """
    Retrieves a translated string from the all_langs_all_strings dictionary
    and performs variable substitutions. Fallbacks have been prebaked during
    module initialization, so this is now a simple lookup.

    Args:
        lang: Language code (e.g., "en", "pt-BR"). If None, defaults to the default fallback language ("en")
        component: Component name (e.g., "errors")
        string_name: The key for the specific string
        substitutions: Dictionary of variable substitutions for the string (e.g., {"rate_limit_interval_string": "24 hours"})

    Returns:
        The translated string with substitutions applied
    """
    # Get translations (cached)
    all_langs_all_strings = get_translations()

    # Use default fallback language if lang is None or doesn't exist
    if lang is None or lang not in all_langs_all_strings:
        lang = "en"

    # Direct lookup (fallbacks already applied during initialization)
    try:
        template = all_langs_all_strings[lang][component][string_name]
    except KeyError as e:
        raise MissingTranslationError(lang, component, string_name) from e

    # Perform substitutions by replacing {{key}} with the corresponding value
    if substitutions:
        for key, value in substitutions.items():
            template = template.replace(f"{{{{{key}}}}}", str(value))

    return template
