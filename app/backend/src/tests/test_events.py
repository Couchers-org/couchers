from datetime import timedelta

import grpc
import pytest
from google.protobuf import wrappers_pb2

from couchers import errors
from couchers.db import session_scope
from pb import events_pb2
from tests.test_fixtures import db, events_session, generate_user, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_CreateEvent(db):
    user, token = generate_user()

    with pages_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreatePlace(
                pages_pb2.CreatePlaceReq(
                    title=None,
                    content="dummy content",
                    address="dummy address",
                    location=pages_pb2.Coordinate(
                        lat=1,
                        lng=1,
                    ),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.MISSING_PAGE_TITLE
