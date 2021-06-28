import grpc
import pytest

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, User
from couchers.servicers.admin import Admin
from proto import admin_pb2, admin_pb2_grpc
from tests.test_fixtures import generate_user, get_user_id_and_token, realadmin_session, recreate_database


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
INVALID_GEOJSON = """
    {
        "bla": "blah"
    }
"""


def admin_session(token: str):
    return realadmin_session(token, admin_pb2_grpc.add_AdminServicer_to_server, Admin(), admin_pb2_grpc.AdminStub)


def _get_super_token():
    with session_scope() as session:
        _, super_token = get_user_id_and_token(session, SUPER_USER_NAME)
        return super_token


def _get_normal_user(session):
    return session.query(User).filter(User.username == NORMAL_USER_NAME).one()


@pytest.fixture(scope="class")
def testing_admin_api():
    recreate_database()
    generate_user(username=SUPER_USER_NAME, is_superuser=True)
    generate_user(username=NORMAL_USER_NAME, email=NORMAL_USER_EMAIL)


class TestAdmin:
    @staticmethod
    def test_AccessByNormalUser(testing_admin_api):
        with session_scope() as session:
            normal_user_id, normal_token = get_user_id_and_token(session, NORMAL_USER_NAME)
        with admin_session(normal_token) as api:

            # all requests to the admin servicer should break when done by a non-super_user
            with pytest.raises(grpc.RpcError) as e:
                api.GetUserEmailById(
                    admin_pb2.GetUserEmailByIdRequest(
                        user_id=normal_user_id,
                    )
                )
            assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED

    @staticmethod
    def test_GetEmailByUserId(testing_admin_api):
        with session_scope() as session:
            normal_user = _get_normal_user(session)
            with admin_session(_get_super_token()) as api:
                res = api.GetUserEmailById(admin_pb2.GetUserEmailByIdRequest(user_id=normal_user.id))

            assert res.email == NORMAL_USER_EMAIL
            assert res.user_id == normal_user.id

    @staticmethod
    def test_GetEmailByUserName(testing_admin_api):
        with session_scope() as session:
            normal_user = _get_normal_user(session)
            with admin_session(_get_super_token()) as api:
                res = api.GetUserEmailByUserName(admin_pb2.GetUserEmailByUserNameRequest(username=normal_user.username))
                assert res.email == NORMAL_USER_EMAIL
                assert res.user_id == normal_user.id

    @staticmethod
    def test_GetBanUser(testing_admin_api):
        with session_scope() as session:
            with admin_session(_get_super_token()) as api:
                normal_user = _get_normal_user(session)
                api.BanUser(admin_pb2.BanUserRequest(user_id=normal_user.id))
                session.refresh(normal_user)
                assert normal_user.is_banned

    @staticmethod
    def test_GetDeleteUser(testing_admin_api):
        with session_scope() as session:
            with admin_session(_get_super_token()) as api:
                normal_user = _get_normal_user(session)
                api.DeleteUser(admin_pb2.DeleteUserRequest(user_id=normal_user.id))
                session.refresh(normal_user)
                assert normal_user.is_deleted

    @staticmethod
    def test_CreateCommunityInvalidGeoJson(testing_admin_api):
        with admin_session(_get_super_token()) as api:
            with pytest.raises(grpc.RpcError) as e:
                api.CreateCommunity(
                    admin_pb2.CreateCommunityReq(
                        name=COMMUNITY_NAME,
                        slug=COMMUNITY_SLUG,
                        description=COMMUNITY_DESCRIPTION,
                        admin_ids=[],
                        geojson=INVALID_GEOJSON,
                    )
                )
            assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
            assert e.value.details() == errors.INVALID_MULTIPOLYGON

    @staticmethod
    def test_CreateCommunity(testing_admin_api):
        with session_scope() as session:
            with admin_session(_get_super_token()) as api:
                api.CreateCommunity(
                    admin_pb2.CreateCommunityReq(
                        name=COMMUNITY_NAME,
                        slug=COMMUNITY_SLUG,
                        description=COMMUNITY_DESCRIPTION,
                        admin_ids=[],
                        geojson=VALID_GEOJSON_MULTIPOLYGON,
                    )
                )
                community = session.query(Cluster).filter(Cluster.name == COMMUNITY_NAME).one()
                assert community.description == COMMUNITY_DESCRIPTION
                assert community.slug == COMMUNITY_SLUG
