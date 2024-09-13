import pytest
from google.protobuf import empty_pb2

from tests.test_fixtures import db, resources_session, testconfig  # noqa


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


def test_GetLanguages(db):
    with resources_session() as api:
        languages = api.GetLanguages(empty_pb2.Empty()).languages
        languages_list = [(r.code, r.name) for r in languages]
        assert ("fin", "Finnish") in languages_list
        assert ("swe", "Swedish") in languages_list
        assert ("???", "Nonexistent language") not in languages_list
