"""
Measuring user-entered texts the same way the frontend does.

Minimum lengths (host request texts, trip descriptions, "about me") are shown to the user as a live character counter
in the browser, so the backend has to count exactly like Javascript does, otherwise a text the frontend happily accepts
gets rejected by the backend -- or, worse for profiles, silently leaves the account incomplete.

Two things differ from the naive `len(text)`:

* Javascript's string.length counts utf16 code units while Python's len() counts code points, so any character outside
  the BMP (emoji, most historic scripts, mathematical alphanumerics) counts twice in the browser and once here.
* Surrounding whitespace doesn't count at all: it's invisible to the user, so padding a text with spaces or newlines
  must not get it over the line.
"""

# the code points Javascript's String.prototype.trim() strips: Unicode White_Space plus U+FEFF. Neither Python's
# str.strip() nor Postgres' regexp character classes cover exactly this set, so it's spelled out here and reused for
# both. Written as code points because the characters themselves are invisible (and mostly indistinguishable) in source.
_JS_WHITESPACE_CODE_POINTS = (
    0x09,
    0x0A,
    0x0B,
    0x0C,
    0x0D,
    0x20,
    0xA0,
    0x1680,
    *range(0x2000, 0x200B),
    0x2028,
    0x2029,
    0x202F,
    0x205F,
    0x3000,
    0xFEFF,
)

JS_WHITESPACE = "".join(chr(code_point) for code_point in _JS_WHITESPACE_CODE_POINTS)

# the same set as a regexp character class, e.g. [\u0009\u000A...]. The escapes are left for postgres' regexp engine
# to resolve rather than written out as characters so that schema dumps stay ascii and legible
_JS_WHITESPACE_SQL_CLASS = "[" + "".join(f"\\u{code_point:04X}" for code_point in _JS_WHITESPACE_CODE_POINTS) + "]"
_TRIM_SQL_REGEX = f"'^{_JS_WHITESPACE_SQL_CLASS}+|{_JS_WHITESPACE_SQL_CLASS}+$'"

# matches everything except the code points that Javascript stores as a surrogate pair, so counting what's left over
# after stripping them counts the extra code unit each of those contributes
_NON_ASTRAL_SQL_REGEX = r"'[^\U00010000-\U0010FFFF]'"


def trimmed_utf16_length(text: str | None) -> int:
    """
    The length of a user-entered text as the frontend counts it: surrounding whitespace stripped, then measured in
    utf16 code units.
    """
    if not text:
        return 0
    # utf-16-le, unlike utf-16, doesn't prefix a BOM code unit
    return len(text.strip(JS_WHITESPACE).encode("utf-16-le")) // 2


def trimmed_utf16_length_sql(column: str) -> str:
    """
    The SQL counterpart of trimmed_utf16_length(), for generated columns and queries. Null texts count as zero.
    """
    trimmed = f"regexp_replace({column}, {_TRIM_SQL_REGEX}, '', 'g')"
    return (
        f"coalesce(character_length({trimmed}) "
        f"+ character_length(regexp_replace({trimmed}, {_NON_ASTRAL_SQL_REGEX}, '', 'g')), 0)"
    )
