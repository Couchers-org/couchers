from unittest.mock import patch

import grpc
import pytest
from sqlalchemy.sql import func

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, User, UserSession
from couchers.servicers.admin import Admin
from couchers.sql import couchers_select as select
from proto import admin_pb2, admin_pb2_grpc
from tests.test_fixtures import db, generate_user, get_user_id_and_token, real_session, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


NORMAL_USER_NAME = "normal_user"
SUPER_USER_NAME = "super_user"
NORMAL_USER_EMAIL = "normal@user.com"
COMMUNITY_NAME = "test community"
COMMUNITY_SLUG = "test-community"
COMMUNITY_DESCRIPTION = "community for testing"
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


def _admin_session(token: str):
    return real_session(token, admin_pb2_grpc.add_AdminServicer_to_server, Admin(), admin_pb2_grpc.AdminStub)


def _get_super_token():
    with session_scope() as session:
        _, super_token = get_user_id_and_token(session, SUPER_USER_NAME)
        return super_token


def _get_normal_user(session):
    return session.execute(select(User).where(User.username == NORMAL_USER_NAME)).scalar_one_or_none()


def _get_super_user(session):
    return session.execute(select(User).where(User.username == SUPER_USER_NAME)).scalar_one_or_none()


def _generate_normal_user(session):
    generate_user(username=NORMAL_USER_NAME, email=NORMAL_USER_EMAIL)


def _generate_super_user(session):
    generate_user(username=SUPER_USER_NAME, is_superuser=True)


def test_AccessByNormalUser(db):
    with session_scope() as session:
        _generate_normal_user(session)
        normal_user_id, normal_token = get_user_id_and_token(session, NORMAL_USER_NAME)
        with _admin_session(normal_token) as api:
            # all requests to the admin servicer should break when done by a non-super_user
            with pytest.raises(grpc.RpcError) as e:
                api.GetUserDetails(
                    admin_pb2.GetUserDetailsReq(
                        user=str(normal_user_id),
                    )
                )
            assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED


def test_GetUserDetails(db):
    with session_scope() as session:
        _generate_normal_user(session)
        _generate_super_user(session)
        normal_user = _get_normal_user(session)

        with _admin_session(_get_super_token()) as api:
            res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=str(normal_user.id)))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == normal_user.gender
        assert res.banned == False
        assert res.deleted == False

        with _admin_session(_get_super_token()) as api:
            res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.username))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == normal_user.gender
        assert res.banned == False
        assert res.deleted == False

        with _admin_session(_get_super_token()) as api:
            res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.email))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == normal_user.gender
        assert res.banned == False
        assert res.deleted == False


def test_ChangeUserGender(db):
    with session_scope() as session:
        _generate_normal_user(session)
        _generate_super_user(session)
        normal_user = _get_normal_user(session)

        with _admin_session(_get_super_token()) as api:
            res = api.ChangeUserGender(admin_pb2.ChangeUserGenderReq(user=normal_user.username, gender="Machine"))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == "Machine"
        assert res.banned == False
        assert res.deleted == False


def test_BanUser(db):
    with session_scope() as session:
        _generate_normal_user(session)
        _generate_super_user(session)
        normal_user = _get_normal_user(session)

        with _admin_session(_get_super_token()) as api:
            res = api.BanUser(admin_pb2.BanUserReq(user=normal_user.username))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == normal_user.gender
        assert res.banned == True
        assert res.deleted == False


def test_DeleteUser(db):
    with session_scope() as session:
        _generate_normal_user(session)
        _generate_super_user(session)
        normal_user = _get_normal_user(session)

        with _admin_session(_get_super_token()) as api:
            res = api.DeleteUser(admin_pb2.DeleteUserReq(user=normal_user.username))
        assert res.user_id == normal_user.id
        assert res.username == normal_user.username
        assert res.email == normal_user.email
        assert res.gender == normal_user.gender
        assert res.banned == False
        assert res.deleted == True


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
            with _admin_session(super_token) as api:
                res = api.CreateApiKey(admin_pb2.CreateApiKeyReq(user=normal_user.username))

        api_key = session.execute(
            select(UserSession).where(UserSession.is_api_key == True).where(UserSession.user_id == normal_user.id)
        ).scalar_one()

        assert mock.called_once_with(
            normal_user.email,
            "api_key",
            template_args={"user": normal_user, "token": api_key.token, "expiry": api_key.expiry},
        )


def test_CreateCommunityInvalidGeoJson(db):
    with session_scope() as session:
        _generate_normal_user(session)
        _generate_super_user(session)
        with _admin_session(_get_super_token()) as api:
            with pytest.raises(grpc.RpcError) as e:
                api.CreateCommunity(
                    admin_pb2.CreateCommunityReq(
                        name=COMMUNITY_NAME,
                        slug=COMMUNITY_SLUG,
                        description=COMMUNITY_DESCRIPTION,
                        admin_ids=[],
                        geojson=POINT_GEOJSON,
                    )
                )
            assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
            assert e.value.details() == errors.NO_MULTIPOLYGON


def test_CreateCommunity(db):
    with session_scope() as session:
        _generate_normal_user(session)
        _generate_super_user(session)
        with _admin_session(_get_super_token()) as api:
            api.CreateCommunity(
                admin_pb2.CreateCommunityReq(
                    name=COMMUNITY_NAME,
                    slug=COMMUNITY_SLUG,
                    description=COMMUNITY_DESCRIPTION,
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == COMMUNITY_NAME)).scalar_one()
            assert community.description == COMMUNITY_DESCRIPTION
            assert community.slug == COMMUNITY_SLUG
