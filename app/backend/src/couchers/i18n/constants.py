# Language fallback hierarchy
# If a string is not found in the requested language, fall back to these languages in order
LANGUAGE_FALLBACKS: dict[str, list[str]] = {
    "pt-BR": ["pt", "en"],
    "pt-PT": ["pt-BR", "en"],
    "es-419": ["es", "en"],
    "fr-CA": ["fr", "en"],
    "zh": ["zh-Hans", "en"],
}
DEFAULT_FALLBACK = ["en"]
