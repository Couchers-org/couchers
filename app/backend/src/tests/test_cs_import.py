import json

import pytest
from sqlalchemy import select

from couchers.couchsurfingcom_import import (
    MAX_JSON_SIZE,
    CouchsurfingComExport,
    InvalidJson,
    TooLarge,
    ValidationError,
    _serialize_value,
    apply_profile_updates,
    compute_profile_updates,
    import_couchsurfingcom_json,
    parse_couchsurfingcom_data,
    structure_couchsurfingcom_export,
)
from couchers.db import session_scope
from couchers.i18n import LocalizationContext
from couchers.models import CouchsurfingComImportAttempt, LanguageFluency, SleepingArrangement, SmokingLocation, User
from tests.fixtures.db import generate_user


@pytest.fixture
def lctx():
    """Localization context for tests."""
    return LocalizationContext.en_utc()


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


# --- Pure function tests (no database needed) ---


def test_compute_profile_updates_basic():
    """Test basic profile field computation from Couchsurfing.com data."""
    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "first_name": "John",
                "last_name": "Doe",
                "gender": "male",
                "occupation": "Software Developer",
                "about_me": "Hello, I love traveling!",
                "interests": "Hiking, coding, music",
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    assert updates.field_updates["name"] == "John Doe"
    assert updates.field_updates["gender"] == "Man"
    assert updates.field_updates["occupation"] == "Software Developer"
    assert updates.field_updates["about_me"] == "Hello, I love traveling!"
    assert updates.field_updates["things_i_like"] == "Hiking, coding, music"
    assert len(updates.warnings) == 0


def test_compute_profile_updates_couch_settings():
    """Test couch/hosting preferences computation."""
    couchsurfingcom_data = {
        "user_data": {
            "profile": {},
            "couch": {
                "max_guests": 3,
                "sleeping_arrangement": "shared_room",
                "wheelchair_accessible": True,
                "can_host_children": True,
                "smoking_ok": False,
                "smokes": False,
                "pets_ok": True,
                "has_pets": True,
                "has_children": False,
                "allow_same_day_requests": True,
                "public_transport_access": "5 min walk to metro",
                "couch_description": "Comfy couch",
                "sleeping_description": "You get your own room",
            },
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    assert updates.field_updates["max_guests"] == 3
    assert updates.field_updates["sleeping_arrangement"] == SleepingArrangement.shared_room
    assert updates.field_updates["wheelchair_accessible"] is True
    assert updates.field_updates["accepts_kids"] is True
    assert updates.field_updates["smoking_allowed"] == SmokingLocation.no
    assert updates.field_updates["smokes_at_home"] is False
    assert updates.field_updates["accepts_pets"] is True
    assert updates.field_updates["has_pets"] is True
    assert updates.field_updates["has_kids"] is False
    assert updates.field_updates["last_minute"] is True
    assert updates.field_updates["area"] == "5 min walk to metro"
    assert "Comfy couch" in updates.field_updates["sleeping_details"]
    assert "You get your own room" in updates.field_updates["sleeping_details"]


def test_compute_profile_updates_languages():
    """Test language abilities computation."""
    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "languages": {
                    "fluent": ["eng", "fra"],
                    "learning": ["deu"],
                }
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    lang_updates = {lu.language_code: lu.fluency for lu in updates.language_updates}
    assert lang_updates["eng"] == LanguageFluency.fluent
    assert lang_updates["fra"] == LanguageFluency.fluent
    assert lang_updates["deu"] == LanguageFluency.beginner


def test_compute_profile_updates_unknown_language():
    """Test that unknown language codes are reported as warnings."""
    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "languages": {
                    "fluent": ["unknown_lang_code"],
                }
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    assert any("unknown_lang_code" in w for w in updates.warnings)
    # Unknown language should not be in language_updates
    assert not any(lu.language_code == "unknown_lang_code" for lu in updates.language_updates)


def test_compute_profile_updates_gender_mapping():
    """Test gender mapping from Couchsurfing.com format to Couchers format."""
    for cs_gender, couchers_gender in [("male", "Man"), ("female", "Woman"), ("other", "Other")]:
        couchsurfingcom_data = {
            "user_data": {
                "profile": {"gender": cs_gender},
                "couch": {},
            }
        }

        couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
        updates = compute_profile_updates(couchsurfingcom_export)

        assert updates.field_updates["gender"] == couchers_gender


def test_compute_profile_updates_additional_info_combined():
    """Test that additional info sections are combined properly."""
    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "media": "I love jazz",
                "teach": "Python programming",
                "amazing_thing": "Climbed a mountain",
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    additional_info = updates.field_updates["additional_information"]
    assert "I love jazz" in additional_info
    assert "Python programming" in additional_info
    assert "Climbed a mountain" in additional_info


def test_compute_profile_updates_roommate_details():
    """Test that roommate text is computed as housemate_details."""
    couchsurfingcom_data = {
        "user_data": {
            "profile": {},
            "couch": {"roommate": "I live alone with my cat"},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    assert updates.field_updates["housemate_details"] == "I live alone with my cat"


def test_parse_couchsurfingcom_data_invalid_json():
    """Test that invalid JSON raises InvalidJson."""
    with pytest.raises(InvalidJson):
        parse_couchsurfingcom_data("not valid json {")


def test_parse_couchsurfingcom_data_too_large():
    """Test that JSON over 20MB raises TooLarge."""
    large_json = "x" * (MAX_JSON_SIZE + 1)

    with pytest.raises(TooLarge):
        parse_couchsurfingcom_data(large_json)


def test_structure_couchsurfingcom_export_full():
    """Test cattrs schema parsing with a complete CS export structure."""
    raw_data = {
        "user_data": {
            "id": 12345,
            "email": "test@example.com",
            "username": "testuser",
            "profile": {
                "first_name": "Test",
                "last_name": "User",
                "gender": "male",
                "occupation": "Developer",
                "about_me": "About me text",
                "interests": "Coding",
                "media": "Music",
                "teach": "Programming",
                "amazing_thing": "Built something",
                "surf_reason": "Travel",
                "offer_hosts": "Conversation",
                "languages": {
                    "fluent": ["eng", "fra"],
                    "learning": ["deu", None],
                },
                "birth_date": "1990-01-15T00:00:00.000Z",
            },
            "couch": {
                "id": 12345,
                "max_guests": 2,
                "sleeping_arrangement": "shared_room",
                "couch_description": "Comfy couch",
                "wheelchair_accessible": False,
                "smoking_ok": True,
                "has_pets": True,
                "available_days_of_week": {
                    "mon": True,
                    "tue": True,
                    "wed": False,
                },
            },
        },
        "friends": {
            "friends": [
                {"profile": "https://example.com/user/1"},
                {"profile": "https://example.com/user/2"},
            ]
        },
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(raw_data)

    # Verify it's the correct type
    assert isinstance(couchsurfingcom_export, CouchsurfingComExport)

    # Verify user_data
    assert couchsurfingcom_export.user_data.id == 12345
    assert couchsurfingcom_export.user_data.email == "test@example.com"
    assert couchsurfingcom_export.user_data.username == "testuser"

    # Verify profile
    profile = couchsurfingcom_export.user_data.profile
    assert profile.first_name == "Test"
    assert profile.last_name == "User"
    assert profile.gender == "male"
    assert profile.occupation == "Developer"
    assert profile.about_me == "About me text"
    assert profile.languages.fluent == ["eng", "fra"]
    assert profile.languages.learning == ["deu", None]

    # Verify couch
    couch = couchsurfingcom_export.user_data.couch
    assert couch.max_guests == 2
    assert couch.sleeping_arrangement == "shared_room"
    assert couch.smoking_ok is True
    assert couch.has_pets is True
    assert couch.available_days_of_week.mon is True
    assert couch.available_days_of_week.wed is False

    # Verify friends
    assert len(couchsurfingcom_export.friends.friends) == 2
    assert couchsurfingcom_export.friends.friends[0].profile == "https://example.com/user/1"


def test_structure_couchsurfingcom_export_minimal():
    """Test cattrs schema parsing with minimal data."""
    raw_data: dict[str, object] = {}

    couchsurfingcom_export = structure_couchsurfingcom_export(raw_data)

    assert isinstance(couchsurfingcom_export, CouchsurfingComExport)
    # Should have default empty values
    assert couchsurfingcom_export.user_data.profile.first_name is None
    assert couchsurfingcom_export.user_data.couch.max_guests is None
    assert couchsurfingcom_export.friends.friends == []


def test_structure_couchsurfingcom_export_ignores_unknown_fields():
    """Test that cattrs schema ignores unknown fields in the input."""
    raw_data = {
        "user_data": {
            "profile": {
                "first_name": "Test",
                "unknown_field": "should be ignored",
                "another_unknown": 12345,
            },
            "couch": {},
        },
        "unknown_top_level": "ignored",
    }

    # Should not raise an exception
    couchsurfingcom_export = structure_couchsurfingcom_export(raw_data)

    assert couchsurfingcom_export.user_data.profile.first_name == "Test"


# --- Database-dependent tests ---


def test_apply_profile_updates_no_overwrite(db, lctx):
    """Test that existing fields are not overwritten when overwrite_existing=False."""
    user, token = generate_user()

    # Set initial value
    with session_scope() as session:
        db_user = session.get(User, user.id)
        assert db_user is not None
        db_user.about_me = "My original about me"
        session.commit()

    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "about_me": "New about me from Couchsurfing.com",
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    with session_scope() as session:
        result = apply_profile_updates(session, user.id, updates, lctx, overwrite_existing=False)

        assert result.success
        assert User.about_me.key not in result.fields_updated

        updated_user = session.get(User, user.id)
        assert updated_user is not None
        assert updated_user.about_me == "My original about me"


def test_apply_profile_updates_with_overwrite(db, lctx):
    """Test that existing fields are overwritten when overwrite_existing=True."""
    user, token = generate_user()

    # Set initial value
    with session_scope() as session:
        db_user = session.get(User, user.id)
        assert db_user is not None
        db_user.about_me = "My original about me"
        session.commit()

    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "about_me": "New about me from Couchsurfing.com",
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    with session_scope() as session:
        result = apply_profile_updates(session, user.id, updates, lctx, overwrite_existing=True)

        assert result.success
        assert User.about_me.key in result.fields_updated

        updated_user = session.get(User, user.id)
        assert updated_user is not None
        assert updated_user.about_me == "New about me from Couchsurfing.com"


def test_apply_profile_updates_user_not_found(db, lctx):
    """Test error handling when user is not found."""
    couchsurfingcom_data: dict[str, dict[str, dict[str, str]]] = {"user_data": {"profile": {}, "couch": {}}}
    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    with session_scope() as session:
        result = apply_profile_updates(session, 999999, updates, lctx)

        assert not result.success
        assert len(result.errors) == 1
        assert "not found" in result.errors[0]


def test_import_couchsurfingcom_json_invalid_json(db, lctx):
    """Test error handling for invalid JSON."""
    user, token = generate_user()

    with session_scope() as session:
        result = import_couchsurfingcom_json(session, user.id, "not valid json {", lctx)

        assert not result.success
        assert any("not valid JSON" in e for e in result.errors)


def test_import_couchsurfingcom_json_success(db, lctx):
    """Test successful import from JSON string."""
    user, token = generate_user()

    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "first_name": "Test",
                "last_name": "User",
                "about_me": "Test about me",
            },
            "couch": {},
        }
    }

    with session_scope() as session:
        # Use overwrite_existing=True since generate_user() populates default values
        result = import_couchsurfingcom_json(
            session, user.id, json.dumps(couchsurfingcom_data), lctx, overwrite_existing=True
        )

        assert result.success
        assert User.name.key in result.fields_updated
        assert User.about_me.key in result.fields_updated

        updated_user = session.get(User, user.id)
        assert updated_user is not None
        assert updated_user.name == "Test User"
        assert updated_user.about_me == "Test about me"


def test_apply_profile_updates_with_structured_data(db, lctx):
    """Test apply_profile_updates with structured CouchsurfingComExport data."""
    user, token = generate_user()

    raw_data = {
        "user_data": {
            "profile": {
                "first_name": "Direct",
                "last_name": "Object",
                "about_me": "Testing CouchsurfingComExport object",
            },
            "couch": {
                "max_guests": 5,
            },
        },
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(raw_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    with session_scope() as session:
        result = apply_profile_updates(session, user.id, updates, lctx, overwrite_existing=True)

        assert result.success
        assert User.name.key in result.fields_updated
        assert User.max_guests.key in result.fields_updated

        updated_user = session.get(User, user.id)
        assert updated_user is not None
        assert updated_user.name == "Direct Object"
        assert updated_user.max_guests == 5


def test_import_couchsurfingcom_json_sets_flag(db, lctx):
    """Test that successful import creates a CouchsurfingImportLog entry."""
    user, token = generate_user()

    # Verify no successful import log exists initially
    with session_scope() as session:
        log_entry = session.execute(
            select(CouchsurfingComImportAttempt)
            .where(CouchsurfingComImportAttempt.user_id == user.id)
            .where(CouchsurfingComImportAttempt.success == True)
        ).scalar_one_or_none()
        assert log_entry is None

    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "first_name": "Test",
                "about_me": "Test about me",
            },
            "couch": {},
        }
    }

    with session_scope() as session:
        result = import_couchsurfingcom_json(
            session, user.id, json.dumps(couchsurfingcom_data), lctx, overwrite_existing=True
        )
        assert result.success

    # Verify successful import log now exists
    with session_scope() as session:
        log_entry = session.execute(
            select(CouchsurfingComImportAttempt)
            .where(CouchsurfingComImportAttempt.user_id == user.id)
            .where(CouchsurfingComImportAttempt.success == True)
        ).scalar_one_or_none()
        assert log_entry is not None


def test_import_couchsurfingcom_json_creates_log(db, lctx):
    """Test that import creates a log entry in CouchsurfingImportLog."""
    user, token = generate_user()

    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "first_name": "LogTest",
                "about_me": "Testing log entry",
            },
            "couch": {"max_guests": 3},
        }
    }

    json_str = json.dumps(couchsurfingcom_data)

    with session_scope() as session:
        result = import_couchsurfingcom_json(session, user.id, json_str, lctx, overwrite_existing=True)
        assert result.success

    # Verify log entry was created
    with session_scope() as session:
        log_entry = session.execute(
            select(CouchsurfingComImportAttempt).where(CouchsurfingComImportAttempt.user_id == user.id)
        ).scalar_one()

        assert log_entry.success is True
        # Old values should be captured
        assert "name" in log_entry.old_values
        # New values should be captured
        assert log_entry.new_values.get("name") == "LogTest"
        assert log_entry.new_values.get("about_me") == "Testing log entry"
        assert log_entry.new_values.get("max_guests") == 3


def test_import_couchsurfingcom_json_logs_invalid_json(db, lctx):
    """Test that invalid JSON imports create a failed log entry."""
    user, token = generate_user()

    invalid_json = "not valid json {"

    with session_scope() as session:
        result = import_couchsurfingcom_json(session, user.id, invalid_json, lctx)
        assert not result.success

    # Verify a failed log entry was created
    with session_scope() as session:
        log_entry = session.execute(
            select(CouchsurfingComImportAttempt).where(CouchsurfingComImportAttempt.user_id == user.id)
        ).scalar_one()

        assert log_entry.success is False
        assert len(log_entry.errors) > 0
        assert any("not valid JSON" in e for e in log_entry.errors)
        # Raw JSON is stored as the original string
        assert log_entry.raw_json == invalid_json


def test_import_couchsurfingcom_json_captures_old_values(db, lctx):
    """Test that old values are correctly captured before import."""
    user, token = generate_user()

    # Set initial values
    with session_scope() as session:
        db_user = session.get(User, user.id)
        assert db_user is not None
        db_user.about_me = "Original about me"
        db_user.occupation = "Original occupation"
        session.commit()

    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "about_me": "New about me",
                "occupation": "New occupation",
            },
            "couch": {},
        }
    }

    with session_scope() as session:
        result = import_couchsurfingcom_json(
            session, user.id, json.dumps(couchsurfingcom_data), lctx, overwrite_existing=True
        )
        assert result.success

    # Verify old values were captured in log
    with session_scope() as session:
        log_entry = session.execute(
            select(CouchsurfingComImportAttempt).where(CouchsurfingComImportAttempt.user_id == user.id)
        ).scalar_one()

        assert log_entry.old_values.get("about_me") == "Original about me"
        assert log_entry.old_values.get("occupation") == "Original occupation"
        assert log_entry.new_values.get("about_me") == "New about me"
        assert log_entry.new_values.get("occupation") == "New occupation"


def test_import_couchsurfingcom_json_stores_raw_json(db, lctx):
    """Test that the raw JSON is stored in the log entry."""
    user, token = generate_user()

    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "first_name": "Test",
                "about_me": "Test about me",
            },
            "couch": {},
        },
        "friends": {"friends": [{"profile": "https://example.com/user/1"}]},
    }

    json_str = json.dumps(couchsurfingcom_data)

    with session_scope() as session:
        result = import_couchsurfingcom_json(session, user.id, json_str, lctx, overwrite_existing=True)
        assert result.success

    # Verify raw_json is stored as the original string
    with session_scope() as session:
        log_entry = session.execute(
            select(CouchsurfingComImportAttempt).where(CouchsurfingComImportAttempt.user_id == user.id)
        ).scalar_one()

        assert log_entry.raw_json == json_str


def test_import_couchsurfingcom_json_too_large(db, lctx):
    """Test that JSON over 20MB is rejected."""
    user, token = generate_user()

    # Create a JSON string that's over 20MB
    large_json = "x" * (MAX_JSON_SIZE + 1)

    with session_scope() as session:
        result = import_couchsurfingcom_json(session, user.id, large_json, lctx)
        assert not result.success
        assert len(result.errors) > 0

    # Verify a failed log entry was created
    with session_scope() as session:
        log_entry = session.execute(
            select(CouchsurfingComImportAttempt).where(CouchsurfingComImportAttempt.user_id == user.id)
        ).scalar_one()

        assert log_entry.success is False
        # Raw JSON is truncated to MAX_JSON_SIZE
        assert log_entry.raw_json == large_json[:MAX_JSON_SIZE]


def test_compute_profile_updates_unknown_gender():
    """Test that unknown gender values are reported as warnings."""
    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "gender": "unknown_gender_value",
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    assert any("Unknown gender value" in w for w in updates.warnings)
    assert "gender" not in updates.field_updates


def test_compute_profile_updates_unknown_sleeping_arrangement():
    """Test that unknown sleeping arrangement values are reported as warnings."""
    couchsurfingcom_data = {
        "user_data": {
            "profile": {},
            "couch": {
                "sleeping_arrangement": "shared_bed",  # Not supported
            },
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    assert any("Unknown sleeping arrangement" in w for w in updates.warnings)
    assert "sleeping_arrangement" not in updates.field_updates


def test_compute_profile_updates_unknown_learning_language():
    """Test that unknown language codes in learning list are reported as warnings."""
    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "languages": {
                    "fluent": ["eng"],
                    "learning": ["unknown_learning_lang"],
                }
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    assert any("unknown_learning_lang" in w for w in updates.warnings)
    # Unknown language should not be in language_updates
    assert not any(lu.language_code == "unknown_learning_lang" for lu in updates.language_updates)
    # Valid language should still be added
    assert any(lu.language_code == "eng" for lu in updates.language_updates)


def test_compute_profile_updates_null_language_codes():
    """Test that None language codes in lists are skipped without error."""
    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "languages": {
                    "fluent": [None, "eng", None],
                    "learning": [None, "fra"],
                }
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    # Should only include valid languages
    lang_codes = [lu.language_code for lu in updates.language_updates]
    assert "eng" in lang_codes
    assert "fra" in lang_codes
    assert len(lang_codes) == 2
    # No warnings about None values
    assert not any("None" in w for w in updates.warnings)


def test_apply_profile_updates_preserves_languages_when_not_overwriting(db, lctx):
    """Test that existing languages are preserved when overwrite_existing=False."""
    user, token = generate_user(
        language_abilities=[
            ("fin", LanguageFluency.fluent),
        ]
    )

    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "languages": {
                    "fluent": ["eng"],
                }
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    with session_scope() as session:
        result = apply_profile_updates(session, user.id, updates, lctx, overwrite_existing=False)

        assert result.success
        # Languages should NOT be updated since user has existing languages
        assert not any("language:" in f for f in result.fields_updated)

        # Verify existing language is preserved
        db_user = session.get(User, user.id)
        assert db_user is not None
        lang_codes = [la.language_code for la in db_user.language_abilities]
        assert "fin" in lang_codes
        assert "eng" not in lang_codes


def test_apply_profile_updates_replaces_languages_when_overwriting(db, lctx):
    """Test that existing languages are replaced when overwrite_existing=True."""
    user, token = generate_user(
        language_abilities=[
            ("fin", LanguageFluency.fluent),
        ]
    )

    couchsurfingcom_data = {
        "user_data": {
            "profile": {
                "languages": {
                    "fluent": ["eng"],
                }
            },
            "couch": {},
        }
    }

    couchsurfingcom_export = structure_couchsurfingcom_export(couchsurfingcom_data)
    updates = compute_profile_updates(couchsurfingcom_export)

    with session_scope() as session:
        result = apply_profile_updates(session, user.id, updates, lctx, overwrite_existing=True)

        assert result.success
        # Languages should be updated
        assert any("language:eng:fluent" in f for f in result.fields_updated)

    # Verify old language was replaced in a fresh session
    with session_scope() as session:
        db_user = session.get(User, user.id)
        assert db_user is not None
        lang_codes = [la.language_code for la in db_user.language_abilities]
        assert "eng" in lang_codes
        assert "fin" not in lang_codes


def test_import_couchsurfingcom_json_validation_error(db, lctx):
    """Test that invalid JSON structure (valid JSON but wrong schema) returns validation error."""
    user, token = generate_user()

    # Valid JSON but with wrong types that cause cattrs to fail
    # max_guests should be an int, not a string
    invalid_structure = {"user_data": {"couch": {"max_guests": "not an int"}}}

    with session_scope() as session:
        result = import_couchsurfingcom_json(session, user.id, json.dumps(invalid_structure), lctx)

        assert not result.success
        assert any("does not match" in e for e in result.errors)

    # Verify a failed log entry was created
    with session_scope() as session:
        log_entry = session.execute(
            select(CouchsurfingComImportAttempt).where(CouchsurfingComImportAttempt.user_id == user.id)
        ).scalar_one()

        assert log_entry.success is False


def test_parse_couchsurfingcom_data_validation_error():
    """Test that invalid structure raises ValidationError."""
    # Valid JSON but with wrong types that cause cattrs to fail
    # max_guests should be an int, not a string
    invalid_structure = {"user_data": {"couch": {"max_guests": "not an int"}}}

    with pytest.raises(ValidationError):
        parse_couchsurfingcom_data(json.dumps(invalid_structure))


def test_serialize_value_fallback():
    """Test _serialize_value fallback for non-standard types."""
    # Test with types that aren't explicitly handled
    assert _serialize_value([1, 2, 3]) == "[1, 2, 3]"
    assert _serialize_value({"key": "value"}) == "{'key': 'value'}"

    # Standard types should pass through
    assert _serialize_value("string") == "string"
    assert _serialize_value(42) == 42
    assert _serialize_value(3.14) == 3.14
    assert _serialize_value(True) is True
    assert _serialize_value(None) is None

    # Enum types should return their name
    assert _serialize_value(SleepingArrangement.private) == "private"
    assert _serialize_value(SmokingLocation.yes) == "yes"
    assert _serialize_value(LanguageFluency.fluent) == "fluent"
