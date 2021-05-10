import functools
import json
import logging
from pathlib import Path

from couchers.db import session_scope
from couchers.models import Language, Region

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
    with session_scope() as session:
        return {region.code: region.name for region in session.query(Region).all()}


def region_is_allowed(code):
    """
    Check a region code is valid
    """
    return code in get_region_dict()


@functools.cache
def get_language_dict():
    """
    Get list of allowed languages as a dictionary of {code: name}.
    """
    with session_scope() as session:
        return {language.code: language.name for language in session.query(Language).all()}


def language_is_allowed(code):
    """
    Check a language code is valid
    """
    return code in get_language_dict()


def copy_resources_to_database(session, testing_data=False):
    """
    Syncs the source-of-truth data from files into the database. Call this at the end of a migration.

    Foreign key constraints that refer to resource tables need to be set to DEFERRABLE.

    We sync as follows:

    1. Lock the table to be updated fully
    2. Defer all constraints
    3. Truncate the table
    4. Re-insert everything

    Truncating and recreating guarantees the data is fully in sync.

    If given testing_date=True, we add a few testing values for speed.
    """

    if not testing_data:
        with open(resources_folder / "regions.json", "r") as f:
            regions = [(region["alpha3"], region["name"]) for region in json.load(f)]

        with open(resources_folder / "languages.json", "r") as f:
            languages = [(language["code"], language["name"]) for language in json.load(f)]
    else:
        regions = [
            ("CXR", "Christmas Island"),
            ("EST", "Estonia"),
            ("FIN", "Finland"),
            ("FRA", "France"),
            ("ITA", "Italy"),
            ("NAM", "Namibia"),
            ("REU", "Réunion"),
            ("SWE", "Sweden"),
            ("USA", "United States"),
        ]
        languages = [("fin", "Finnish"), ("eng", "English"), ("swe", "Swedish")]

    session.execute("SET CONSTRAINTS ALL DEFERRED")

    # renders a truncate table
    session.query(Region).delete()
    for code, name in regions:
        session.add(Region(code=code, name=name))

    session.query(Language).delete()
    for code, name in languages:
        session.add(Language(code=code, name=name))
