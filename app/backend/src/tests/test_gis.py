import json

import pytest
from google.protobuf import empty_pb2

from couchers.materialized_views import refresh_materialized_views, refresh_materialized_views_rapid
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import gis_session
from tests.test_communities import testing_communities  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


class TestGIS:
    @staticmethod
    def test_GetUsers(testing_communities):
        _, token = generate_user()

        refresh_materialized_views_rapid(empty_pb2.Empty())

        with gis_session(token) as gis:
            http_body = gis.GetUsers(empty_pb2.Empty())
            assert http_body.content_type == "application/json"
            data = json.loads(http_body.data)
            print(data)
            assert data["type"] == "FeatureCollection"
            assert len(data["features"]) > 1

    @staticmethod
    def test_GetClusteredUsers(testing_communities):
        _, token = generate_user()

        refresh_materialized_views(empty_pb2.Empty())

        with gis_session(token) as gis:
            http_body = gis.GetClusteredUsers(empty_pb2.Empty())
            assert http_body.content_type == "application/json"
            data = json.loads(http_body.data)
            print(data)
            assert data["type"] == "FeatureCollection"
            assert len(data["features"]) > 1
