import grapheme


def human_perceived_length(s: str) -> int:
    """Returns the human-perceived length of a message, which differs from len(s)."""
    # Python's len(str) counts utf-8 code units, e.g. len("á") == 2
    # Javascript's string.length counts utf-16 code units, e.g. "𠮷".length == 2
    # Neither corresponds to the human expectation.
    # Grapheme clusters are the best approximation of what a human perceives as a single character.
    # Ignoring whitespace helps to avoid burdening users of CJK scripts where spaces are not typically used.
    length = 0
    for g in grapheme.graphemes(s):
        if not g[0].isspace():
            length += 1
    return length
