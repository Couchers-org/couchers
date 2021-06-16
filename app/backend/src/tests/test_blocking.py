import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.models import User, UserBlock
from proto import blocking_pb2
from tests.test_fixtures import (  # noqa
    blocking_session,
    db,
    generate_user,
    make_user_block,
    session_scope,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_BlockUser(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        blocked_user_list = session.query(UserBlock).filter(UserBlock.blocking_user_id == user1.id).all()
        assert len(blocked_user_list) == 0

    with blocking_session(token1) as user_blocks:
        with pytest.raises(grpc.RpcError) as e:
            user_blocks.BlockUser(blocking_pb2.BlockUserReq(username=user1.username))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_BLOCK_SELF

        user_blocks.BlockUser(blocking_pb2.BlockUserReq(username=user2.username))

        with pytest.raises(grpc.RpcError) as e:
            user_blocks.BlockUser(blocking_pb2.BlockUserReq(username=user2.username))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.USER_ALREADY_BLOCKED

    with session_scope() as session:
        blocked_user_list = session.query(UserBlock).filter(UserBlock.blocking_user_id == user1.id).all()
        assert len(blocked_user_list) == 1


def test_make_user_block(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_user_block(user1, user2)

    with session_scope() as session:
        blocked_user_list = session.query(UserBlock).filter(UserBlock.blocking_user_id == user1.id).all()
        assert len(blocked_user_list) == 1


def test_UnblockUser(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_user_block(user1, user2)

    with blocking_session(token1) as user_blocks:
        user_blocks.UnblockUser(blocking_pb2.UnblockUserReq(username=user2.username))

    with session_scope() as session:
        blocked_users = session.query(UserBlock).filter(UserBlock.blocking_user_id == user1.id).all()
        assert len(blocked_users) == 0

    with blocking_session(token1) as user_blocks:
        with pytest.raises(grpc.RpcError) as e:
            user_blocks.UnblockUser(blocking_pb2.UnblockUserReq(username=user2.username))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.USER_NOT_BLOCKED

        # Test re-blocking
        user_blocks.BlockUser(blocking_pb2.BlockUserReq(username=user2.username))

    with session_scope() as session:
        blocked_users = session.query(UserBlock).filter(UserBlock.blocking_user_id == user1.id).all()
        assert len(blocked_users) == 1


def test_GetBlockedUsers(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    with blocking_session(token1) as user_blocks:
        # Check no blocked users to start
        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_usernames) == 0

        make_user_block(user1, user2)
        make_user_block(user1, user3)
        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_usernames) == 2


def test_relationships_in_userblock_model(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    make_user_block(user1, user2)
    make_user_block(user1, user3)
    make_user_block(user2, user3)

    set_users_blocked_by_user_1 = {user2.id, user3.id}
    set_users_blocking_user_3 = {user1.id, user2.id}
    with session_scope() as session:
        user1_from_db = session.query(User).filter(User.id == user1.id).one()
        new_set = set(block.blocked_user_id for block in user1_from_db.is_blocking_user)
        assert set_users_blocked_by_user_1 == new_set

        user3_from_db = session.query(User).filter(User.id == user3.id).one()
        new_set = set(block.blocking_user_id for block in user3_from_db.is_blocked_user)
        assert set_users_blocking_user_3 == new_set


def test_blocking_relationships_in_user_model(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_user_block(user1, user2)

    with session_scope() as session:
        block = (
            session.query(UserBlock)
            .filter((UserBlock.blocking_user_id == user1.id) & (UserBlock.blocked_user_id == user2.id))
            .one_or_none()
        )
        assert block.blocking_user.username == user1.username
        assert block.blocked_user.username == user2.username
