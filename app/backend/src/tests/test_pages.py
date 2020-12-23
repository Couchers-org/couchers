import grpc
import pytest
import pytz
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy import select

from couchers import errors
from couchers.models import User
from couchers.utils import now, to_aware_datetime
from pb import api_pb2, pages_pb2
from tests.test_fixtures import api_session, db, generate_user, make_friends, page_session, testconfig

# @pytest.fixture(autouse=True)
# def _(testconfig):
#     pass
#


def test_create_page(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user2, user1)
    make_friends(user1, user3)

    with page_session(token1) as c:
        result = c.CreatePage(pages_pb2.CreatePageReq(type="point_of_interest"))


def test_edit_page(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_friends(user2, user1)
    make_friends(user1, user3)

    with page_session(token1) as c:
        req = pages_pb2.EditPageReq(
            page_id=1, title="test title", content="test content", geom=pages_pb2.Point(lat=1, lng=1)
        )
        result = c.EditPage(req)
