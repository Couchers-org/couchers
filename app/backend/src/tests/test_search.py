import pytest

from couchers.utils import create_coordinate
from couchers.db import session_scope
from couchers.crypto import random_hex
from proto import search_pb2
from couchers.models import Upload, User

from tests.test_communities import testing_communities  # noqa
from tests.test_fixtures import db, generate_user, search_session, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_Search(testing_communities):
    user, token = generate_user()
    with search_session(token) as api:
        res = api.Search(
            search_pb2.SearchReq(
                query="Country 1, Region 1",
                include_users=True,
                include_communities=True,
                include_groups=True,
                include_places=True,
                include_guides=True,
            )
        )
        res = api.Search(
            search_pb2.SearchReq(
                query="Country 1, Region 1, Attraction",
                title_only=True,
                include_users=True,
                include_communities=True,
                include_groups=True,
                include_places=True,
                include_guides=True,
            )
        )


def test_UserSearch(testing_communities):
    user, token = generate_user()
    with search_session(token) as api:
        res = api.UserSearch(search_pb2.UserSearchReq())
        assert len(res.results) > 0


def test_regression_search_in_area(db):
    """
    Makes sure search_in_area works.

    At the equator/prime meridian intersection (0,0), one degree is roughly 111 km.
    """

    # outside
    user1, token1 = generate_user(geom=create_coordinate(1, 0), geom_radius=100)
    # outside
    user2, token2 = generate_user(geom=create_coordinate(0, 1), geom_radius=100)
    # inside
    user3, token3 = generate_user(geom=create_coordinate(0.1, 0), geom_radius=100)
    # inside
    user4, token4 = generate_user(geom=create_coordinate(0, 0.1), geom_radius=100)
    # outside
    user5, token5 = generate_user(geom=create_coordinate(10, 10), geom_radius=100)

    with search_session(token5) as api:
        res = api.UserSearch(
            search_pb2.UserSearchReq(
                search_in_area=search_pb2.Area(
                    lat=0,
                    lng=0,
                    radius=100000,
                )
            )
        )
        assert [result.user.user_id for result in res.results] == [user3.id, user4.id]


def test_user_filter_complete_profile(db):
    """
    Make sure the completed profile flag returns only completed user profile
    """
    uploader_user, _ = generate_user()
    with session_scope() as session:
        key = random_hex(32)
        filename = random_hex(32) + ".jpg"
        session.add(
            Upload(
                key=key,
                filename=filename,
                creator_user_id=uploader_user.id,
            )
        )
        session.commit()

    with session_scope() as session:
        key2 = random_hex(32)
        filename = random_hex(32) + ".jpg"
        session.add(
            Upload(
                key=key2,
                filename=filename,
                creator_user_id=uploader_user.id,
            )
        )
        session.commit()

    user_complete_profile, token6 = generate_user(about_me="this profile is complete", avatar_key=key)

    user_incomplete_profile, token7 = generate_user(about_me="", avatar_key=key2)

    with search_session(token6) as api:
        req = search_pb2.UserSearchReq()
        req.profile_completed = True
        res = api.UserSearch(req)
        assert [result.user.user_id for result in res.results] == [user_complete_profile]

    with search_session(token7) as api:
        req = search_pb2.UserSearchReq()
        req.profile_completed = False
        assert [result.user.user_id for result in res.results] == [user_incomplete_profile]
