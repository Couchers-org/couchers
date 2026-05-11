"""
Helper for importing Couchsurfing™ data export into a Couchers user profile.

This module provides functionality to update an existing Couchers user profile
with data exported from Couchsurfing.com.

Couchsurfing™ is a trademark of Couchsurfing International, Inc.
"""

import json
import logging
from dataclasses import dataclass
from dataclasses import field as dataclass_field
from typing import Any

import cattrs
from attrs import define, field
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import InstrumentedAttribute

from couchers.i18n import LocalizationContext
from couchers.models import (
    CouchsurfingComImportAttempt,
    LanguageAbility,
    LanguageFluency,
    SleepingArrangement,
    SmokingLocation,
    User,
)
from couchers.resources import language_is_allowed
from couchers.utils import now

# Maximum JSON size in bytes (20MB)
MAX_JSON_SIZE = 20 * 1024 * 1024

# Couchsurfing.com section titles (English-only, matching the CS website)
# These are the exact titles users see when filling in their CS profile
CS_SECTION_MY_FAVORITE_MUSIC_MOVIES_BOOKS = "My Favorite Music, Movies & Books"
CS_SECTION_TEACH_LEARN_SHARE = "Teach, Learn, Share"
CS_SECTION_ONE_AMAZING_THING_IVE_DONE = "One Amazing Thing I've Done"
CS_SECTION_WHY_IM_ON_COUCHERS = "Why I'm on Couchers"
CS_SECTION_WHAT_I_CAN_SHARE_WITH_HOSTS = "What I Can Share With Hosts"
CS_SECTION_DESCRIPTION_OF_SLEEPING_ARRANGEMENT = "Description of Sleeping Arrangement"
CS_SECTION_ROOMMATE_SITUATION = "Roommate Situation"
CS_SECTION_PUBLIC_TRANSPORTATION_ACCESS = "Public Transportation Access"
CS_SECTION_WHAT_I_CAN_SHARE_WITH_GUESTS = "What I Can Share With Guests"
CS_SECTION_ADDITIONAL_INFORMATION = "Additional Information"


def _serialize_value(value: Any) -> Any:
    """Serialize a value for JSON storage in the import log."""
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (SleepingArrangement, SmokingLocation, LanguageFluency)):
        return value.name
    return str(value)


logger = logging.getLogger(__name__)


# --- Couchsurfing.com Data Schema (attrs classes for cattrs) ---


@define
class CouchsurfingComLanguages:
    """Languages from Couchsurfing.com profile."""

    fluent: list[str | None] = field(factory=list)
    learning: list[str | None] = field(factory=list)


@define
class CouchsurfingComProfile:
    """Profile data from Couchsurfing.com export."""

    first_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    occupation: str | None = None
    about_me: str | None = None
    interests: str | None = None
    media: str | None = None
    teach: str | None = None
    amazing_thing: str | None = None
    surf_reason: str | None = None
    offer_hosts: str | None = None
    languages: CouchsurfingComLanguages = field(factory=CouchsurfingComLanguages)
    address: str | None = None
    phone: str | None = None
    birth_date: str | None = None
    display_name: str | None = None
    locale: str | None = None
    emergency_contact: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    emergency_contact_email: str | None = None
    facebook_friends_number: int | None = None


@define
class CouchsurfingComAvailableDays:
    """Available days of the week from Couchsurfing.com."""

    mon: bool = True
    tue: bool = True
    wed: bool = True
    thu: bool = True
    fri: bool = True
    sat: bool = True
    sun: bool = True


@define
class CouchsurfingComCouch:
    """Couch/hosting data from Couchsurfing.com export."""

    id: int | None = None
    max_guests: int | None = None
    sleeping_arrangement: str | None = None
    couch_description: str | None = None
    offer_guests: str | None = None
    sleeping_description: str | None = None
    roommate: str | None = None
    wheelchair_accessible: bool | None = None
    public_transport_access: str | None = None
    can_host_children: bool | None = None
    smoking_ok: bool | None = None
    smokes: bool | None = None
    pets_ok: bool | None = None
    preferred_gender: str | None = None
    has_children: bool | None = None
    has_pets: bool | None = None
    allow_same_day_requests: bool | None = None
    allow_multiple_parties: bool | None = None
    available_days_of_week: CouchsurfingComAvailableDays = field(factory=CouchsurfingComAvailableDays)
    directions: str | None = None


@define
class CouchsurfingComUserData:
    """User data section from Couchsurfing.com export."""

    id: int | None = None
    email: str | None = None
    username: str | None = None
    current_sign_in_ip: str | None = None
    last_sign_in_ip: str | None = None
    profile: CouchsurfingComProfile = field(factory=CouchsurfingComProfile)
    couch: CouchsurfingComCouch = field(factory=CouchsurfingComCouch)


@define
class CouchsurfingComFriend:
    """Friend entry from Couchsurfing.com export."""

    profile: str | None = None


@define
class CouchsurfingComFriends:
    """Friends section from Couchsurfing.com export."""

    friends: list[CouchsurfingComFriend] = field(factory=list)


@define
class CouchsurfingComExport:
    """Root schema for Couchsurfing.com data export."""

    user_data: CouchsurfingComUserData = field(factory=CouchsurfingComUserData)
    friends: CouchsurfingComFriends = field(factory=CouchsurfingComFriends)
    # We don't parse verifications, messages, etc. as they're not used for profile import


def structure_couchsurfingcom_export(data: dict[str, Any]) -> CouchsurfingComExport:
    return cattrs.structure(data, CouchsurfingComExport)


COUCHSURFINGCOM_GENDER_MAP = {
    "male": "Man",
    "female": "Woman",
    "other": "Other",
}

COUCHSURFINGCOM_SLEEPING_ARRANGEMENT_MAP = {
    "private_room": SleepingArrangement.private,
    "public_room": SleepingArrangement.common,
    "shared_room": SleepingArrangement.shared_room,
    # We explicitly don't support "shared bed".
}


@dataclass(frozen=True, slots=True, kw_only=True)
class LanguageUpdate:
    language_code: str
    fluency: LanguageFluency


@dataclass(frozen=True, slots=True, kw_only=True)
class CouchsurfingComProfileUpdates:
    """Computed updates from Couchsurfing.com data, ready to be applied to a user."""

    # Profile fields (field_name -> new_value)
    field_updates: dict[str, Any]

    # Language abilities to set (replaces existing)
    language_updates: list[LanguageUpdate]

    # Warnings generated during computation
    warnings: list[str]


@dataclass(frozen=True, slots=True, kw_only=True)
class CouchsurfingComImportResult:
    """Result of importing Couchsurfing.com data."""

    success: bool
    fields_updated: list[str] = dataclass_field(default_factory=list)
    # Note: warnings are internal/debug strings (not localized), used for logging only
    warnings: list[str] = dataclass_field(default_factory=list)
    # errors are user-facing and must be localized
    errors: list[str] = dataclass_field(default_factory=list)
    # Old values before the import (for logging/rollback)
    old_values: dict[str, Any] = dataclass_field(default_factory=dict)
    # New values after the import (for logging)
    new_values: dict[str, Any] = dataclass_field(default_factory=dict)

    @classmethod
    def from_error(cls, e: _ImportError, lctx: LocalizationContext) -> CouchsurfingComImportResult:
        if isinstance(e, TooLarge):
            return CouchsurfingComImportResult(
                success=False,
                errors=[lctx.localize_string("couchsurfingcom_import.errors.json_too_large")],
            )
        elif isinstance(e, InvalidJson):
            return CouchsurfingComImportResult(
                success=False,
                errors=[lctx.localize_string("couchsurfingcom_import.errors.invalid_json")],
            )
        elif isinstance(e, ValidationError):
            return CouchsurfingComImportResult(
                success=False, errors=[lctx.localize_string("couchsurfingcom_import.errors.invalid_format")]
            )
        else:
            raise RuntimeError("Unknown error") from e


def _combine_text_sections(*sections: tuple[str, str | None]) -> str | None:
    """
    Combine multiple text sections with headers into one string.

    Each section is a tuple of (header, content).
    """
    parts = []
    for header, content in sections:
        if content and content.strip():
            parts.append(f"**{header}**\n\n{content.strip()}")
    return "\n\n---\n\n".join(parts) if parts else None


def compute_profile_updates(
    couchsurfingcom_data: CouchsurfingComExport,
) -> CouchsurfingComProfileUpdates:
    field_updates: dict[InstrumentedAttribute[Any], Any] = {}
    warnings = []
    language_updates = []
    profile = couchsurfingcom_data.user_data.profile
    couch = couchsurfingcom_data.user_data.couch

    # --- Profile Fields ---

    # Name
    first_name = profile.first_name or ""
    last_name = profile.last_name or ""
    if first_name or last_name:
        full_name = f"{first_name} {last_name}".strip()
        field_updates[User.name] = full_name

    # Gender
    if profile.gender:
        couchers_gender = COUCHSURFINGCOM_GENDER_MAP.get(profile.gender.lower())
        if couchers_gender:
            field_updates[User.gender] = couchers_gender
        else:
            warnings.append(f"Unknown gender value: {profile.gender}")

    # Simple profile fields
    field_updates[User.occupation] = profile.occupation
    field_updates[User.about_me] = profile.about_me
    field_updates[User.things_i_like] = profile.interests

    # Additional information (combine multiple CS fields)
    additional_sections = [
        (CS_SECTION_MY_FAVORITE_MUSIC_MOVIES_BOOKS, profile.media),
        (CS_SECTION_TEACH_LEARN_SHARE, profile.teach),
        (CS_SECTION_ONE_AMAZING_THING_IVE_DONE, profile.amazing_thing),
        (CS_SECTION_WHY_IM_ON_COUCHERS, profile.surf_reason),
        (CS_SECTION_WHAT_I_CAN_SHARE_WITH_HOSTS, profile.offer_hosts),
    ]
    combined_additional = _combine_text_sections(*additional_sections)
    field_updates[User.additional_information] = combined_additional

    # --- Couch/Hosting Fields ---

    field_updates[User.max_guests] = couch.max_guests

    # Sleeping arrangement
    if couch.sleeping_arrangement:
        sleeping = COUCHSURFINGCOM_SLEEPING_ARRANGEMENT_MAP.get(couch.sleeping_arrangement)
        if sleeping:
            field_updates[User.sleeping_arrangement] = sleeping
        else:
            warnings.append(f"Unknown sleeping arrangement: {couch.sleeping_arrangement}")

    # Combine both sleeping description fields under one CS section header
    sleeping_texts = [t for t in (couch.couch_description, couch.sleeping_description) if t and t.strip()]
    combined_sleeping_content = "\n\n".join(sleeping_texts) if sleeping_texts else None
    sleeping_sections = [(CS_SECTION_DESCRIPTION_OF_SLEEPING_ARRANGEMENT, combined_sleeping_content)]
    combined_sleeping = _combine_text_sections(*sleeping_sections)
    field_updates[User.sleeping_details] = combined_sleeping

    # We can't update "has_housemates", because "roommate" is a text field
    # and can contain anything, including "I live alone" or whatever.
    field_updates[User.housemate_details] = couch.roommate

    field_updates[User.area] = couch.public_transport_access
    field_updates[User.other_host_info] = couch.directions
    field_updates[User.about_place] = couch.offer_guests

    # Hosting preferences
    field_updates[User.wheelchair_accessible] = couch.wheelchair_accessible
    field_updates[User.accepts_kids] = couch.can_host_children
    field_updates[User.has_kids] = couch.has_children
    field_updates[User.accepts_pets] = couch.pets_ok
    field_updates[User.has_pets] = couch.has_pets
    field_updates[User.last_minute] = couch.allow_same_day_requests
    field_updates[User.smokes_at_home] = couch.smokes

    if couch.smoking_ok is not None:
        field_updates[User.smoking_allowed] = SmokingLocation.yes if couch.smoking_ok else SmokingLocation.no

    # --- Language Abilities ---
    added_languages = set[str]()

    # Add fluent languages
    for lang_code in profile.languages.fluent:
        if lang_code and lang_code not in added_languages:
            if language_is_allowed(lang_code):
                language_updates.append(LanguageUpdate(language_code=lang_code, fluency=LanguageFluency.fluent))
                added_languages.add(lang_code)
            else:
                warnings.append(f"Unknown language code: {lang_code}")

    # Add learning languages (as beginner)
    for lang_code in profile.languages.learning:
        if lang_code and lang_code not in added_languages:
            if language_is_allowed(lang_code):
                language_updates.append(LanguageUpdate(language_code=lang_code, fluency=LanguageFluency.beginner))
                added_languages.add(lang_code)
            else:
                warnings.append(f"Unknown language code: {lang_code}")

    return CouchsurfingComProfileUpdates(
        field_updates={col.name: v for col, v in field_updates.items() if v is not None},
        warnings=warnings,
        language_updates=language_updates,
    )


def apply_profile_updates(
    session: Session,
    user_id: int,
    updates: CouchsurfingComProfileUpdates,
    lctx: LocalizationContext,
    *,
    overwrite_existing: bool = False,
) -> CouchsurfingComImportResult:
    user = session.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        return CouchsurfingComImportResult(
            success=False,
            fields_updated=[],
            warnings=updates.warnings,
            errors=[lctx.localize_string("couchsurfingcom_import.errors.user_not_found")],
        )

    fields_updated: list[str] = []
    old_values: dict[str, Any] = {}
    new_values: dict[str, Any] = {}

    # Capture old language abilities before any changes
    old_languages = [{"code": la.language_code, "fluency": la.fluency.name} for la in user.language_abilities]

    # Apply field updates
    for field_name, new_value in updates.field_updates.items():
        current_value = getattr(user, field_name)
        should_update = overwrite_existing or current_value is None
        if should_update:
            old_values[field_name] = _serialize_value(current_value)
            new_values[field_name] = _serialize_value(new_value)
            fields_updated.append(field_name)
            setattr(user, field_name, new_value)

    # Apply language updates
    has_existing_languages = bool(user.language_abilities)
    if overwrite_existing or not has_existing_languages:
        for ability in list(user.language_abilities):
            session.delete(ability)
        session.flush()

        new_languages = []
        for lang_update in updates.language_updates:
            session.add(
                LanguageAbility(
                    user_id=user.id,
                    language_code=lang_update.language_code,
                    fluency=lang_update.fluency,
                )
            )
            fluency_name = "fluent" if lang_update.fluency == LanguageFluency.fluent else "beginner"
            fields_updated.append(f"language:{lang_update.language_code}:{fluency_name}")
            new_languages.append({"code": lang_update.language_code, "fluency": fluency_name})

        if new_languages:
            old_values["languages"] = old_languages
            new_values["languages"] = new_languages

    if fields_updated:
        user.profile_last_updated = now()

    user.has_imported_from_couchsurfing_com = True

    session.flush()

    return CouchsurfingComImportResult(
        success=True,
        fields_updated=fields_updated,
        warnings=updates.warnings,
        errors=[],
        old_values=old_values,
        new_values=new_values,
    )


class _ImportError(Exception): ...


class TooLarge(_ImportError):
    pass


class InvalidJson(_ImportError):
    pass


class ValidationError(_ImportError):
    pass


def parse_couchsurfingcom_data(json_data: str) -> CouchsurfingComExport:
    if len(json_data) > MAX_JSON_SIZE:
        raise TooLarge()

    try:
        data: dict[str, Any] = json.loads(json_data)
    except json.JSONDecodeError as e:
        raise InvalidJson() from e

    relevant_data = {key: data[key] for key in ("user_data", "friends") if key in data}

    try:
        structured = structure_couchsurfingcom_export(relevant_data)
    except Exception as e:
        raise ValidationError() from e

    return structured


def import_couchsurfingcom_json(
    session: Session,
    user_id: int,
    json_data: str,
    lctx: LocalizationContext,
    *,
    overwrite_existing: bool = False,
) -> CouchsurfingComImportResult:
    """
    Import Couchsurfing.com profile data from a JSON string.

    Args:
        session: Database session
        user_id: ID of user to update
        json_data: JSON string containing Couchsurfing.com export data
        lctx: Localization context for generating localized errors
        overwrite_existing: Whether to overwrite existing profile fields

    Returns:
        CouchsurfingComImportResult with success status, updated fields, warnings, and errors
    """
    try:
        couchsurfingcom_data = parse_couchsurfingcom_data(json_data)
        updates = compute_profile_updates(couchsurfingcom_data)
        result = apply_profile_updates(session, user_id, updates, lctx, overwrite_existing=overwrite_existing)
    except _ImportError as e:
        result = CouchsurfingComImportResult.from_error(e, lctx)

    session.add(
        CouchsurfingComImportAttempt(
            user_id=user_id,
            success=result.success,
            raw_json=json_data[:MAX_JSON_SIZE],
            old_values=result.old_values,
            new_values=result.new_values,
            warnings=result.warnings,
            errors=result.errors,
        )
    )

    return result
