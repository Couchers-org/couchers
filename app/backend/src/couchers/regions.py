import functools
import json
from pathlib import Path


@functools.cache
def get_region_list():
    """
    Get list of allowed regions as a set.
    """
    with open(Path(__file__).parent / "constant_data" / "regions.json", "r") as f:
        return set(regions["code"] for regions in json.load(f))


def region_is_allowed(code):
    """
    Check a region code is valid
    """
    return code in get_region_list()
