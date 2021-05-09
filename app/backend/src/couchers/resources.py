import functools
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

resources_folder = Path(__file__).parent / ".." / ".." / "resources"


@functools.cache
def get_terms_of_service():
    """
    Get the latest terms of service
    """
    with open(resources_folder / "terms_of_service.md", "r") as f:
        return f.read()


@functools.cache
def get_region_dict():
    """
    Get list of allowed regions as a dictionary of {alpha3: name}.
    """
    with open(resources_folder / "regions.json", "r") as f:
        return {region["alpha3"]: region["name"] for region in json.load(f)}


@functools.cache
def get_region_set():
    """
    Get list of allowed regions as a set.
    """
    return set(get_region_dict.keys())


def region_is_allowed(code):
    """
    Check a region code is valid
    """
    return code in get_region_set()


@functools.cache
def get_language_dict():
    """
    Get list of allowed languages as a dictionary of {code: name}.
    """
    with open(resources_folder / "languages.json", "r") as f:
        return {language["code"]: language["name"] for language in json.load(f)}


@functools.cache
def get_language_set():
    """
    Get list of allowed languages as a set.
    """
    return set(get_language_dict.keys())


def language_is_allowed(code):
    """
    Check a language code is valid
    """
    return code in get_language_set()
