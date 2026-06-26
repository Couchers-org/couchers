import functools
import json
import logging
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import delete, text

from couchers.config import config
from couchers.db import session_scope
from couchers.models import Language, Region, TimezoneArea

logger = logging.getLogger(__name__)

resources_folder = Path(__file__).parent / ".." / ".." / "resources"


@functools.cache
def get_terms_of_service() -> str:
    """
    Get the latest terms of service
    """
    with open(resources_folder / "terms_of_service.md", "r") as f:
        return f.read()


@functools.cache
def get_icon(name: str) -> str:
    """
    Get an icon SVG by name
    """
    return (resources_folder / "icons" / name).read_text()


@functools.cache
def get_region_dict() -> dict[str, str]:
    """
    Get a list of allowed regions as a dictionary of {alpha3: name}.
    """
    with session_scope() as session:
        return {region.code: region.name for region in session.execute(select(Region)).scalars().all()}


@functools.cache
def get_region_code_iso3166_alpha3_to_alpha2() -> Mapping[str, str]:
    with open(resources_folder / "regions.json", "r") as f:
        json_regions = json.load(f)
    return {region["alpha3"]: region["alpha2"] for region in json_regions if "alpha2" in region}


def region_is_allowed(code: str) -> bool:
    """
    Check a region code is valid
    """
    return code in get_region_dict()


@functools.cache
def get_language_dict() -> Mapping[str, str]:
    """
    Get a list of allowed languages as a dictionary of {code: name}.
    """
    with session_scope() as session:
        return {language.code: language.name for language in session.execute(select(Language)).scalars().all()}


@functools.cache
def get_language_codes_iso639_3_to_1() -> Mapping[str, str]:
    """
    Gets a mapping from ISO639-3 (three char) to ISO639-1 (two char) codes,
    where there is an equivalence.
    """
    with open(resources_folder / "languages-iso639.json", "r") as file:
        entries: list[dict[str, str]] = json.load(file)
    return {entry["set3"]: entry["set1"] for entry in entries if "set1" in entry}


@functools.cache
def get_badge_data() -> Mapping[str, Any]:
    """
    Get a list of profile badges in form {id: Badge}
    """
    with open(resources_folder / "badges.json", "r") as f:
        data = json.load(f)
        return cast(dict[str, Any], data)


@dataclass(frozen=True, slots=True, kw_only=True)
class Badge:
    """Defines a profile badge that can be awarded to users."""

    id: str
    color: str
    admin_editable: bool
    # if set, the badge is only awarded while this feature flag is on (the flag defaults to on, so
    # the badge keeps being awarded until the flag is turned off)
    flag: str | None = None


@functools.cache
def get_badge_dict() -> Mapping[str, Badge]:
    """
    Get a list of profile badges in form {id: Badge}
    """
    badges = [Badge(**b) for b in get_badge_data()["badges"]]
    return {badge.id: badge for badge in badges}


@functools.cache
def get_static_badge_dict() -> Mapping[str, list[int]]:
    """
    Get a list of static badges in form {id: list(user_ids)}
    """
    data = get_badge_data()["static_badges"]
    return cast(dict[str, list[int]], data)


def language_is_allowed(code: str) -> bool:
    """
    Check a language code is valid
    """
    return code in get_language_dict()


@functools.cache
def get_postcard_front_image() -> bytes:
    """
    Returns the front image of the postcard as PNG bytes.
    """
    return (resources_folder / "postcard-front.png").read_bytes()


@functools.cache
def get_postcard_font() -> bytes:
    """
    Returns the font file for postcard text rendering.
    """
    return (resources_folder / "hack-bold.ttf").read_bytes()


@functools.cache
def get_postcard_metadata() -> Mapping[str, Any]:
    """
    Returns the postcard metadata (coordinates, sizes, etc.) from postcard-metadata.json.
    """
    return cast(dict[str, Any], json.loads((resources_folder / "postcard-metadata.json").read_text()))


@functools.cache
def get_postcard_back_left_template() -> bytes:
    """
    Returns the back left side template image for the postcard as PNG bytes.
    """
    return (resources_folder / "postcard-back-left.png").read_bytes()


def copy_resources_to_database(session: Session) -> None:
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

    with open(resources_folder / "languages-iso639.json", "r") as f:
        languages = [(language["set3"], language["name"]) for language in json.load(f)]

    timezone_areas_file = resources_folder / "timezone_areas.sql"

    if not timezone_areas_file.exists():
        if not config.DEV:
            raise Exception("Missing timezone_areas.sql and not running in dev")

        timezone_areas_file = resources_folder / "timezone_areas.sql-fake"
        logger.info("Using fake timezone areas")

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
