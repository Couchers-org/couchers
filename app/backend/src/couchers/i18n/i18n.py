import json
from pathlib import Path

from couchers.i18n.constants import DEFAULT_FALLBACK, LANGUAGE_FALLBACKS


class MissingTranslationError(Exception):
    """Raised when a translation template is not found in any fallback language."""

    def __init__(self, lang: str, component: str, string_name: str):
        self.lang = lang
        self.component = component
        self.string_name = string_name
        super().__init__(f"Missing translation: {lang}.{component}.{string_name}")


# This will be populated from `{lang}.json` files
# Structure: lang -> component -> (string -> translated string)
ALL_LANGS_ALL_STRINGS: dict[str, dict[str, dict[str, str]]] = {}


def _load_translations():
    """
    Load all translation files from the i18n directory structure and apply fallbacks.
    Scans for components (subdirectories) and their locale JSON files, then prebakes
    language fallbacks so every language has complete coverage using English as the
    base and applying fallbacks in the correct precedence order.
    """
    i18n_dir = Path(__file__).parent

    # Scan for component directories
    for component_dir in i18n_dir.iterdir():
        if not component_dir.is_dir() or component_dir.name.startswith("_"):
            continue

        component_name = component_dir.name
        locales_dir = component_dir / "locales"

        if not locales_dir.exists():
            continue

        # Load all locale JSON files for this component
        for locale_file in locales_dir.glob("*.json"):
            lang = locale_file.stem  # e.g., "en" from "en.json"

            with open(locale_file, "r", encoding="utf-8") as f:
                translations = json.load(f)

            # Initialize nested dictionaries if needed
            if lang not in ALL_LANGS_ALL_STRINGS:
                ALL_LANGS_ALL_STRINGS[lang] = {}
            if component_name not in ALL_LANGS_ALL_STRINGS[lang]:
                ALL_LANGS_ALL_STRINGS[lang][component_name] = {}

            # Store the translations
            ALL_LANGS_ALL_STRINGS[lang][component_name] = translations

    # Apply fallbacks: English is our source of truth - must exist
    if "en" not in ALL_LANGS_ALL_STRINGS:
        raise RuntimeError("English translations must be loaded")

    en_strings = ALL_LANGS_ALL_STRINGS["en"]

    # Get all languages we need to process (loaded languages + those in fallback config)
    all_languages = set(ALL_LANGS_ALL_STRINGS.keys()) | set(LANGUAGE_FALLBACKS.keys())

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
            if fallback_lang in ALL_LANGS_ALL_STRINGS:
                for component in ALL_LANGS_ALL_STRINGS[fallback_lang]:
                    if component not in lang_strings:
                        lang_strings[component] = {}
                    lang_strings[component].update(ALL_LANGS_ALL_STRINGS[fallback_lang][component])

        # Finally, apply the language's own translations (highest priority)
        if lang in ALL_LANGS_ALL_STRINGS:
            for component in ALL_LANGS_ALL_STRINGS[lang]:
                if component not in lang_strings:
                    lang_strings[component] = {}
                lang_strings[component].update(ALL_LANGS_ALL_STRINGS[lang][component])

        # Replace the language entry with the complete version
        ALL_LANGS_ALL_STRINGS[lang] = lang_strings


# Load translations and apply fallbacks when the module is imported
_load_translations()


def get_string(lang: str, component: str, string_name: str, **subs) -> str:
    """
    Retrieves a translated string from the ALL_LANGS_ALL_STRINGS dictionary
    and performs variable substitutions. Fallbacks have been prebaked during
    module initialization, so this is now a simple lookup.

    Args:
        lang: Language code (e.g., "en", "pt-BR")
        component: Component name (e.g., "errors")
        string_name: The key for the specific string
        **subs: Variable substitutions for the string (e.g., rate_limit_interval_string="24 hours")

    Returns:
        The translated string with substitutions applied
    """
    # Fallback to English if the requested language doesn't exist
    if lang not in ALL_LANGS_ALL_STRINGS:
        lang = "en"

    # Direct lookup (fallbacks already applied during initialization)
    try:
        template = ALL_LANGS_ALL_STRINGS[lang][component][string_name]
    except KeyError:
        raise MissingTranslationError(lang, component, string_name) from None

    # Perform substitutions by replacing {{key}} with the corresponding value
    for key, value in subs.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))

    return template
