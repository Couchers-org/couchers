import functools
import json
from pathlib import Path


@functools.cache
def get_country_list():
    """
    Get list of allowed countries as a set.
    """
    with open(Path(__file__).parent / "constant_data" / "countries.json", "r") as f:
        return set(country["code"] for country in json.load(f))


def country_is_allowed(code):
    """
    Check a country code is valid
    """
    return code in get_country_list()
