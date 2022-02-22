from datetime import date
from unittest.mock import patch

import grpc
import pytest
from sqlalchemy.sql import func

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, UserSession
from couchers.sql import couchers_select as select
from couchers.utils import parse_date
from proto import admin_pb2
from tests.test_fixtures import db, generate_user, get_user_id_and_token, real_admin_session, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_access_by_normal_user(db):
    with session_scope() as session:
        normal_user, normal_token = generate_user()

        with real_admin_session(normal_token) as api:
            # all requests to the admin servicer should break when done by a non-super_user
            with pytest.raises(grpc.RpcError) as e:
                api.GetUserDetails(
                    admin_pb2.GetUserDetailsReq(
                        user=str(normal_user.id),
                    )
                )
            assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED


def test_GetUserDetails(db):
    with session_scope() as session:
        super_user, super_token = generate_user(is_superuser=True)
        normal_user, normal_token = generate_user()

        with real_admin_session(super_token) as api:
            res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=str(normal_user.id)))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == normal_user.gender
        assert parse_date(res.birthdate) == normal_user.birthdate
        assert not res.banned
        assert not res.deleted

        with real_admin_session(super_token) as api:
            res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.username))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == normal_user.gender
        assert parse_date(res.birthdate) == normal_user.birthdate
        assert not res.banned
        assert not res.deleted

        with real_admin_session(super_token) as api:
            res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.email))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == normal_user.gender
        assert parse_date(res.birthdate) == normal_user.birthdate
        assert not res.banned
        assert not res.deleted


def test_ChangeUserGender(db):
    with session_scope() as session:
        super_user, super_token = generate_user(is_superuser=True)
        normal_user, normal_token = generate_user()

        with real_admin_session(super_token) as api:
            res = api.ChangeUserGender(admin_pb2.ChangeUserGenderReq(user=normal_user.username, gender="Machine"))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == "Machine"
        assert parse_date(res.birthdate) == normal_user.birthdate
        assert not res.banned
        assert not res.deleted


def test_ChangeUserBirthdate(db):
    with session_scope() as session:
        super_user, super_token = generate_user(is_superuser=True)
        normal_user, normal_token = generate_user(birthdate=date(year=2000, month=1, day=1))

        with real_admin_session(super_token) as api:
            res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.username))
            assert parse_date(res.birthdate) == date(year=2000, month=1, day=1)

            res = api.ChangeUserBirthdate(
                admin_pb2.ChangeUserBirthdateReq(user=normal_user.username, birthdate="1990-05-25")
            )

        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.birthdate == "1990-05-25"
        assert res.gender == normal_user.gender
        assert not res.banned
        assert not res.deleted


def test_BanUser(db):
    with session_scope() as session:
        super_user, super_token = generate_user(is_superuser=True)
        normal_user, normal_token = generate_user()

        with real_admin_session(super_token) as api:
            res = api.BanUser(admin_pb2.BanUserReq(user=normal_user.username))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == normal_user.gender
        assert parse_date(res.birthdate) == normal_user.birthdate
        assert res.banned
        assert not res.deleted


def test_DeleteUser(db):
    with session_scope() as session:
        super_user, super_token = generate_user(is_superuser=True)
        normal_user, normal_token = generate_user()

        with real_admin_session(super_token) as api:
            res = api.DeleteUser(admin_pb2.DeleteUserReq(user=normal_user.username))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == normal_user.gender
        assert parse_date(res.birthdate) == normal_user.birthdate
        assert not res.banned
        assert res.deleted


def test_CreateApiKey(db):
    with session_scope() as session:
        super_user, super_token = generate_user(is_superuser=True)
        normal_user, normal_token = generate_user()

        assert (
            session.execute(
                select(func.count())
                .select_from(UserSession)
                .where(UserSession.is_api_key == True)
                .where(UserSession.user_id == normal_user.id)
            ).scalar_one()
            == 0
        )

    with patch("couchers.email.enqueue_email_from_template") as mock:
        with real_admin_session(super_token) as api:
            res = api.CreateApiKey(admin_pb2.CreateApiKeyReq(user=normal_user.username))

    with session_scope() as session:
        api_key = session.execute(
            select(UserSession)
            .where(UserSession.is_valid)
            .where(UserSession.is_api_key == True)
            .where(UserSession.user_id == normal_user.id)
        ).scalar_one()

        assert mock.called_once_with(
            normal_user.email,
            "api_key",
            template_args={"user": normal_user, "token": api_key.token, "expiry": api_key.expiry},
        )


VALID_GEOJSON_MULTIPOLYGON = """
    {
      "type": "MultiPolygon",
      "coordinates":
       [
        [
          [
            [
              -73.98114904754641,
              40.7470284264813
            ],
            [
              -73.98314135177611,
              40.73416844413217
            ],
            [
              -74.00538969848634,
              40.734314779027144
            ],
            [
              -74.00479214294432,
              40.75027851544338
            ],
            [
              -73.98114904754641,
              40.7470284264813
            ]
          ]
        ]
      ]
    }
"""

POINT_GEOJSON = """
{ "type": "Point", "coordinates": [100.0, 0.0] }
"""


def test_CreateCommunity_invalid_geojson(db):
    with session_scope() as session:
        super_user, super_token = generate_user(is_superuser=True)
        normal_user, normal_token = generate_user()
        with real_admin_session(super_token) as api:
            with pytest.raises(grpc.RpcError) as e:
                api.CreateCommunity(
                    admin_pb2.CreateCommunityReq(
                        name="test community",
                        slug="test-community",
                        description="community for testing",
                        admin_ids=[],
                        geojson=POINT_GEOJSON,
                    )
                )
            assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
            assert e.value.details() == errors.NO_MULTIPOLYGON


def test_CreateCommunity(db):
    with session_scope() as session:
        super_user, super_token = generate_user(is_superuser=True)
        normal_user, normal_token = generate_user()
        with real_admin_session(super_token) as api:
            api.CreateCommunity(
                admin_pb2.CreateCommunityReq(
                    name="test community",
                    slug="test-community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == "test community")).scalar_one()
            assert community.description == "community for testing"
            assert community.slug == "test-community"
