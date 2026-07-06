import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select

from couchers.db import session_scope
from couchers.models import Language
from couchers.resources import copy_resources_to_database
from tests.fixtures.sessions import resources_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_GetTermsOfService():
    # make sure it works and we get out a bunch of text
    with resources_session() as api:
        res = api.GetTermsOfService(empty_pb2.Empty()).terms_of_service
        assert len(res) > 100
        assert "couchers, inc." in res.lower()


def test_GetCommunityGuidelines():
    # make sure it works and we get out a bunch of text
    with resources_session() as api:
        res = api.GetCommunityGuidelines(empty_pb2.Empty()).community_guidelines
        assert len(res) == 4
        assert res[2].title == "Be safe and sensible"
        assert "inappropriate content" in res[2].guideline
        assert "stroke" in res[2].icon_svg


def test_GetRegions(db):
    with resources_session() as api:
        regions = api.GetRegions(empty_pb2.Empty()).regions
        regions_list = [(r.alpha3, r.name) for r in regions]
        assert ("FIN", "Finland") in regions_list
        assert ("SWE", "Sweden") in regions_list
        assert ("???", "Nonexistent region") not in regions_list

    with resources_session(locale="es") as api:
        regions = api.GetRegions(empty_pb2.Empty()).regions
        regions_list = [(r.alpha3, r.name) for r in regions]
        assert ("FIN", "Finlandia") in regions_list
        assert ("FIN", "Finland") not in regions_list


def test_GetLanguages(db):
    with resources_session() as api:
        languages = api.GetLanguages(empty_pb2.Empty()).languages
        languages_list = [(r.code, r.name) for r in languages]
        assert ("fin", "Finnish") in languages_list
        assert ("swe", "Swedish") in languages_list
        assert ("???", "Nonexistent language") not in languages_list

    with resources_session(locale="es") as api:
        languages = api.GetLanguages(empty_pb2.Empty()).languages
        languages_list = [(r.code, r.name) for r in languages]
        assert ("swe", "Sueco") in languages_list
        assert ("swe", "Swedish") not in languages_list


def test_languages_resource_drops_deprecated_ajp(db):
    # Load the real languages.json (not the hardcoded testing fixture) so a future bad code is caught.
    # Mirrors test_add_dummy_data's pattern of calling copy_resources_to_database directly.
    with session_scope() as session:
        copy_resources_to_database(session)
        codes = set(session.execute(select(Language.code)).scalars().all())
    assert "ajp" not in codes  # deprecated; ISO 639-3 CR 2022-006 merged it into apc
    assert "apc" in codes


def test_GetBadges(db):
    with resources_session() as api:
        badges = api.GetBadges(empty_pb2.Empty()).badges
        badges_dict = {b.id: b for b in badges}

        # Check that all expected badges are present
        expected_badge_ids = {
            "founder",
            "board_member",
            "past_board_member",
            "moderator",
            "volunteer",
            "past_volunteer",
            "donor",
            "phone_verified",
            "strong_verification",
            "swagster",
        }
        assert set(badges_dict.keys()) == expected_badge_ids

        # Check that a specific badge has the correct properties
        founder = badges_dict["founder"]
        assert founder.id == "founder"
        assert founder.name == "Founder"
        assert founder.description == "This user is one of the two founders of Couchers.org"
        assert founder.color == "#e47701"

        # Check another badge to ensure translations are working
        moderator = badges_dict["moderator"]
        assert moderator.id == "moderator"
        assert moderator.name == "Moderator"
        assert moderator.description == "This user is a moderator of Couchers.org"
        assert moderator.color == "#c74f5b"

        # Check strong_verification badge
        strong_verification = badges_dict["strong_verification"]
        assert strong_verification.id == "strong_verification"
        assert strong_verification.name == "Strong Verification"
        assert (
            strong_verification.description
            == "This user has verified their gender and date of birth with a biometric passport"
        )
        assert strong_verification.color == "#1b8aa0"
