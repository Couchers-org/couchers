# Language fallback hierarchy
# If a string is not found in the requested language, transitively fall back to these languages.
# Other languages implicitly fallback to English.

LANGUAGE_FALLBACKS: dict[str, str] = {
    "pt-BR": "pt",
    "pt-PT": "pt-BR",
    "es-419": "es",
    "fr-CA": "fr",
    "zh": "zh-Hans",
}
