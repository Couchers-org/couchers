import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.db import get_user_by_field
from couchers.models import UserBlocks
from pb import api_pb2, blocking_pb2
from tests.test_fixtures import api_session, blocking_session, db, generate_user, session_scope, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_block_user(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with blocking_session(token1) as user_blocks:
        with pytest.raises(grpc.RpcError) as e:
            user_blocks.BlockUser(blocking_pb2.BlockUserReq(user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_BLOCK_SELF

        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_user_ids) == 0

        user_blocks.BlockUser(blocking_pb2.BlockUserReq(user_id=user2.id))

        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_user_ids) == 1

        with pytest.raises(grpc.RpcError) as e:
            user_blocks.BlockUser(blocking_pb2.BlockUserReq(user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.USER_ALREADY_BLOCKED


def test_unblock_user(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        user_block = UserBlocks(
            blocking_user_id=user1.id,
            blocked_user_id=user2.id,
        )
        session.add(user_block)
        session.commit()

    with blocking_session(token1) as user_blocks:
        with pytest.raises(grpc.RpcError) as e:
            user_blocks.UnblockUser(blocking_pb2.UnblockUserReq(user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_UNBLOCK_SELF

        user_blocks.UnblockUser(blocking_pb2.UnblockUserReq(user_id=user2.id))

        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_user_ids) == 0

        with pytest.raises(grpc.RpcError) as e:
            user_blocks.UnblockUser(blocking_pb2.UnblockUserReq(user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.USER_NOT_BLOCKED

    # Test re-blocking
    with blocking_session(token1) as user_blocks:
        user_blocks.BlockUser(blocking_pb2.BlockUserReq(user_id=user2.id))

        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_user_ids) == 1


def test_blocking_relationships(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    with blocking_session(token1) as blocking:
        blocking.BlockUser(blocking_pb2.BlockUserReq(user_id=user2.id))
        blocking.BlockUser(blocking_pb2.BlockUserReq(user_id=user3.id))

    with blocking_session(token2) as blocking:
        blocking.BlockUser(blocking_pb2.BlockUserReq(user_id=user3.id))

    set_users_blocked_by_user_1 = {2, 3}
    set_users_blocking_user_3 = {1, 2}
    with session_scope() as session:
        user = get_user_by_field(session, user1.username)
        for user_block in user.blocked:
            set_users_blocked_by_user_1.remove(user_block.blocked_user_id)
        assert not set_users_blocked_by_user_1

        user3 = get_user_by_field(session, user3.username)
        for user_block in user3.blocking:
            set_users_blocking_user_3.remove(user_block.blocking_user_id)
        assert not set_users_blocking_user_3

        block = (
            session.query(UserBlocks)
            .filter((UserBlocks.blocking_user_id == user1.id) & (UserBlocks.blocked_user_id == user2.id))
            .one_or_none()
        )
        assert block.blocking_user.username == user1.username
        assert block.blocked_user.username == user2.username
