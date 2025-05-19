import json
from math import sqrt

import pytest
from google.protobuf import empty_pb2

from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.models import (
    ProfilePublicVisibility,
)
from tests.test_fixtures import (  # noqa
    db,
    generate_user,
    process_jobs,
    public_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_GetPublicMapLayer(db):
    user1, _ = generate_user()
    user2, _ = generate_user(username="user2", public_visibility=ProfilePublicVisibility.nothing)
    user3, _ = generate_user()
    user4, _ = generate_user(username="user4", public_visibility=ProfilePublicVisibility.limited)
    user5, _ = generate_user()

    # these are hardcoded in test_fixtures
    test_user_coordinates = [-73.9740, 40.7108]

    with session_scope() as session:
        queue_job(session, "update_randomized_locations", empty_pb2.Empty())

    process_jobs()

    with public_session() as public:
        http_body = public.GetPublicUsers(empty_pb2.Empty())
        assert http_body.content_type == "application/json"
        data = json.loads(http_body.data)
        print(data)
        assert data == {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-73.974, 40.7108]},
                    "properties": {"username": "user4"},
                },
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-73.928380198, 40.729706144]},
                    "properties": {"username": None},
                },
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-74.042643848, 40.706241098]},
                    "properties": {"username": None},
                },
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-73.955417734, 40.691831306]},
                    "properties": {"username": None},
                },
            ],
        }

        for user in data["features"]:
            coords = user["geometry"]["coordinates"]
            if user["properties"]["username"]:
                assert coords == test_user_coordinates
            else:
                xdiff = coords[0] - test_user_coordinates[0]
                ydiff = coords[1] - test_user_coordinates[1]
                dist = sqrt(xdiff**2 + ydiff**2)
                assert dist > 0.02 and dist < 0.1
