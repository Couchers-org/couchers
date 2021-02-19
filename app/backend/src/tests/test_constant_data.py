import grpc
import pytest
from google.protobuf import empty_pb2

from couchers.db import session_scope
from couchers.models import Language
from tests.test_fixtures import constant_data_session, db, generate_user, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_get_language_list(db):
    user, token = generate_user("tester")

    with constant_data_session(token) as api:
        res = api.GetLanguageList(empty_pb2.Empty())
        assert len(res.languages) == 0

    with session_scope() as session:
        session.add(Language(code="eng", name="English"))
        session.add(Language(code="fin", name="Finnish"))
        session.add(Language(code="swe", name="Swedish"))

    with constant_data_session(token) as api:
        res = api.GetLanguageList(empty_pb2.Empty())
        assert len(res.languages) == 3
        assert res.languages[0].code == "eng"
        assert res.languages[0].name == "English"
        assert res.languages[1].code == "fin"
        assert res.languages[1].name == "Finnish"
        assert res.languages[2].code == "swe"
        assert res.languages[2].name == "Swedish"
