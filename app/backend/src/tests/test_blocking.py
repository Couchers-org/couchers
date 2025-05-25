import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.models import UserBlock
from couchers.sql import couchers_select as select
from proto import blocking_pb2
from tests.test_fixtures import blocking_session, db, generate_user, make_user_block, session_scope, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_BlockUser(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        blocked_user_list = (
            session.execute(select(UserBlock).where(UserBlock.blocking_user_id == user1.id)).scalars().all()
        )
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
        blocked_user_list = (
            session.execute(select(UserBlock).where(UserBlock.blocking_user_id == user1.id)).scalars().all()
        )
        assert len(blocked_user_list) == 1


def test_make_user_block(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_user_block(user1, user2)

    with session_scope() as session:
        blocked_user_list = (
            session.execute(select(UserBlock).where(UserBlock.blocking_user_id == user1.id)).scalars().all()
        )
        assert len(blocked_user_list) == 1


def test_UnblockUser(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_user_block(user1, user2)

    with blocking_session(token1) as user_blocks:
        user_blocks.UnblockUser(blocking_pb2.UnblockUserReq(username=user2.username))

    with session_scope() as session:
        blocked_users = session.execute(select(UserBlock).where(UserBlock.blocking_user_id == user1.id)).scalars().all()
        assert len(blocked_users) == 0

    with blocking_session(token1) as user_blocks:
        with pytest.raises(grpc.RpcError) as e:
            user_blocks.UnblockUser(blocking_pb2.UnblockUserReq(username=user2.username))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.USER_NOT_BLOCKED

        # Test re-blocking
        user_blocks.BlockUser(blocking_pb2.BlockUserReq(username=user2.username))

    with session_scope() as session:
        blocked_users = session.execute(select(UserBlock).where(UserBlock.blocking_user_id == user1.id)).scalars().all()
        assert len(blocked_users) == 1


def test_GetBlockedUsers(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()

    with blocking_session(token1) as user_blocks:
        # Check no blocked users to start
        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_users) == 0

        make_user_block(user1, user2)
        make_user_block(user1, user3)
        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_users) == 2

        blocked_usernames = [user.username for user in blocked_user_list.blocked_users]
        blocked_names = [user.name for user in blocked_user_list.blocked_users]
        blocked_avatar_urls = [user.avatar_thumbnail_url for user in blocked_user_list.blocked_users]

        assert user2.username in blocked_usernames
        assert user3.username in blocked_usernames
        assert user2.name in blocked_names
        assert user3.name in blocked_names
        assert user2.avatar.thumbnail_url in blocked_avatar_urls
        assert user3.avatar.thumbnail_url in blocked_avatar_urls


def test_relationships_userblock_dot_user(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_user_block(user1, user2)

    with session_scope() as session:
        block = session.execute(
            select(UserBlock).where((UserBlock.blocking_user_id == user1.id) & (UserBlock.blocked_user_id == user2.id))
        ).scalar_one_or_none()
        assert block.blocking_user.username == user1.username
        assert block.blocked_user.username == user2.username
        assert block.blocking_user.name == user1.name
        assert block.blocked_user.name == user2.name
        assert block.blocking_user.avatar.thumbnail_url == user1.avatar.thumbnail_url
        assert block.blocked_user.avatar.thumbnail_url == user2.avatar.thumbnail_url
