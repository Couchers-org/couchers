import functools
import json
import logging
from pathlib import Path

from sqlalchemy.sql import delete, text

from couchers.config import config
from couchers.db import session_scope
from couchers.models import Language, Region, TimezoneArea
from couchers.sql import couchers_select as select
from proto import resources_pb2

logger = logging.getLogger(__name__)

resources_folder = Path(__file__).parent / ".." / ".." / "resources"


@functools.lru_cache
def get_terms_of_service():
    """
    Get the latest terms of service
    """
    with open(resources_folder / "terms_of_service.md", "r") as f:
        return f.read()


@functools.lru_cache
def get_community_guidelines():
    """
    Get the latest Community Guidelines
    """
    with open(resources_folder / "community_guidelines.json", "r") as f:
        community_guidelines = json.load(f)
    ret = []
    for cg in community_guidelines:
        with open(resources_folder / "icons" / cg["icon"], "r") as f:
            ret.append(
                resources_pb2.CommunityGuideline(
                    title=cg["title"],
                    guideline=cg["guideline"],
                    icon_svg=f.read(),
                )
            )
    return ret


@functools.lru_cache
def get_region_dict():
    """
    Get list of allowed regions as a dictionary of {alpha3: name}.
    """
    with session_scope() as session:
        return {region.code: region.name for region in session.execute(select(Region)).scalars().all()}


def region_is_allowed(code):
    """
    Check a region code is valid
    """
    return code in get_region_dict()


@functools.lru_cache
def get_language_dict():
    """
    Get list of allowed languages as a dictionary of {code: name}.
    """
    with session_scope() as session:
        return {language.code: language.name for language in session.execute(select(Language)).scalars().all()}


def language_is_allowed(code):
    """
    Check a language code is valid
    """
    return code in get_language_dict()


def copy_resources_to_database(session):
    """
    Syncs the source-of-truth data from files into the database. Call this at the end of a migration.

    Foreign key constraints that refer to resource tables need to be set to DEFERRABLE.

    We sync as follows:

    1. Lock the table to be updated fully
    2. Defer all constraints
    3. Truncate the table
    4. Re-insert everything

    Truncating and recreating guarantees the data is fully in sync.
    """
    with open(resources_folder / "regions.json", "r") as f:
        regions = [(region["alpha3"], region["name"]) for region in json.load(f)]

    with open(resources_folder / "languages.json", "r") as f:
        languages = [(language["code"], language["name"]) for language in json.load(f)]

    timezone_areas_file = resources_folder / "timezone_areas.sql"

    if not timezone_areas_file.exists():
        if not config["DEV"]:
            raise Exception("Missing timezone_areas.sql and not running in dev")

        timezone_areas_file = resources_folder / "timezone_areas.sql-fake"
        logger.info(f"Using fake timezone areas")

    with open(timezone_areas_file, "r") as f:
        tz_sql = f.read()

    # set all constraints marked as DEFERRABLE to be checked at the end of this transaction, not immediately
    session.execute(text("SET CONSTRAINTS ALL DEFERRED"))

    session.execute(delete(Region))
    for code, name in regions:
        session.add(Region(code=code, name=name))

    session.execute(delete(Language))
    for code, name in languages:
        session.add(Language(code=code, name=name))

    session.execute(delete(TimezoneArea))
    session.execute(text(tz_sql))
