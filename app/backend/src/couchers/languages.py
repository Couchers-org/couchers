import functools
import json
from pathlib import Path


@functools.cache
def get_language_list():
    """
    Get list of allowed languages as a set.
    """
    with open(Path(__file__).parent / "constant_data" / "languages.json", "r") as f:
        return set(language["code"] for language in json.load(f))


def language_is_allowed(code):
    """
    Check a language code is valid
    """
    return code in get_language_list()
