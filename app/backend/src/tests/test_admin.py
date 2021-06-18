from couchers.models import User
from couchers.servicers.admin import Admin
from couchers import errors
import grpc
from couchers.db import session_scope
from tests.test_fixtures import admin_session, real_session, generate_user, get_user_id_and_token, recreate_database, testconfig
from proto import admin_pb2, admin_pb2_grpc
import pytest

@pytest.fixture(autouse=True)
def _(testconfig):
    pass

NORMAL_USER_NAME="normal_user"
SUPER_USER_NAME="super_user"
NORMAL_USER_EMAIL="normal@user.com"

def _session(token: str):
    return real_session(token, admin_pb2_grpc.add_AdminServicer_to_server, Admin(), admin_pb2_grpc.AdminStub)

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
        with _session(normal_token) as api:

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
            with _session(_get_super_token()) as api:
                res = api.GetUserEmailById(
                    admin_pb2.GetUserEmailByIdRequest(
                        user_id=normal_user.id
                    )
                )
     
            assert res.email == NORMAL_USER_EMAIL 
            assert res.user_id ==  normal_user.id

    @staticmethod
    def test_GetEmailByUserName(testing_admin_api):
        with session_scope() as session:
            normal_user = _get_normal_user(session)
            with _session(_get_super_token()) as api:
                res = api.GetUserEmailByName(
                    admin_pb2.GetUserEmailByNameRequest(
                        username=normal_user.username
                        )
                )
                assert res.email == NORMAL_USER_EMAIL 
                assert res.user_id == normal_user.id 
    
    @staticmethod
    def test_GetBanUser(testing_admin_api):
        with session_scope() as session:
            with _session(_get_super_token()) as api:
                normal_user = _get_normal_user(session)
                api.BanUser(
                    admin_pb2.BlockUserRequest(
                           user_id=normal_user.id   
                        )
                )
                normal_user.refresh()
                assert normal_user.is_banned
