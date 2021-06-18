from couchers import errors
import grpc
from couchers.db import session_scope
from tests.test_fixtures import admin_session, generate_user, get_user_id_and_token, recreate_database, testconfig
from proto import admin_pb2
import pytest

@pytest.fixture(autouse=True)
def _(testconfig):
    pass


@pytest.fixture(scope="class")
def testing_admin_api():
    recreate_database()
    generate_user(username="super_user", is_superuser=True) 
    generate_user(username="normal_user")

class TestAdmin:
    @staticmethod
    def test_AccessByNormalUser(testing_admin_api):
        with session_scope() as session:
            normal_user, normal_token = get_user_id_and_token(session, "normal_user")
        with admin_session(normal_token) as api:

            # all requests to the admin servicer should break when done by a non-super_user 
            with pytest.raises(grpc.RpcError) as e:
                api.GetUserEmailById(
                    admin_pb2.BlockUserRequest(
                        user_id=normal_user,
                    )
                )
            assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED




