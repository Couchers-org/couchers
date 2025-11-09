
import json
from pathlib import Path
from couchers.i18n.constants import LANGUAGE_FALLBACKS,DEFAULT_FALLBACK

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
    Load all translation files from the i18n directory structure.
    Scans for components (subdirectories) and their locale JSON files.
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


# Load translations when the module is imported
_load_translations()

def get_string(lang: str, component: str, string_name: str, **subs) -> str:
    """
    Retrieves a translated string from the ALL_LANGS_ALL_STRINGS dictionary
    and performs variable substitutions. Uses language fallback hierarchy if
    the string is not found in the requested language.

    Args:
        lang: Language code (e.g., "en", "pt-BR")
        component: Component name (e.g., "errors")
        string_name: The key for the specific string
        **subs: Variable substitutions for the string (e.g., rate_limit_interval_string="24 hours")

    Returns:
        The translated string with substitutions applied
    """
    # Determine the fallback chain for this language
    fallback_chain = LANGUAGE_FALLBACKS.get(lang, DEFAULT_FALLBACK)
    languages_to_try = [lang] + fallback_chain

    # Try each language in the fallback chain
    template = None
    for try_lang in languages_to_try:
        try:
            template = ALL_LANGS_ALL_STRINGS[try_lang][component][string_name]
            break
        except KeyError:
            continue

    # If still not found, raise an exception
    if template is None:
        raise MissingTranslationError(lang, component, string_name)

    # Perform substitutions by replacing {{key}} with the corresponding value
    for key, value in subs.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))

    return template
