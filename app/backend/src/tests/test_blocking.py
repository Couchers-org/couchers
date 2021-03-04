import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from pb import api_pb2, user_blocks_pb2
from tests.test_fixtures import api_session, db, generate_user, testconfig, user_blocks_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_user_blocking(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # Test blocking
    with user_blocks_session(token1) as user_blocks:
        with pytest.raises(grpc.RpcError) as e:
            user_blocks.BlockUser(user_blocks_pb2.BlockUserReq(user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_BLOCK_SELF

        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_user_ids) == 0

        user_blocks.BlockUser(user_blocks_pb2.BlockUserReq(user_id=user2.id))

        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_user_ids) == 1

        with pytest.raises(grpc.RpcError) as e:
            user_blocks.BlockUser(user_blocks_pb2.BlockUserReq(user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.USER_ALREADY_BLOCKED

    with api_session(token1) as api:
        """""
        with pytest.raises(grpc.RpcError) as e:
            api.GetUser(
                api_pb2.GetUserReq(user=user2.username)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(
                api_pb2.SendFriendRequestReq(user_id=user2.id)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND
        """

    # Test bi-directional invisibility
    with api_session(token2) as api:
        """ "
        with pytest.raises(grpc.RpcError) as e:
            api.GetUser(
                api_pb2.GetUserReq(useruser1.username)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND

        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(
                api_pb2.SendFriendRequestReq(user_id=user1.id)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.USER_NOT_FOUND
        """

    # Test Unblocking
    with user_blocks_session(token1) as user_blocks:
        with pytest.raises(grpc.RpcError) as e:
            user_blocks.UnblockUser(user_blocks_pb2.UnblockUserReq(user_id=user1.id))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.CANT_UNBLOCK_SELF

        user_blocks.UnblockUser(user_blocks_pb2.UnblockUserReq(user_id=user2.id))

        with pytest.raises(grpc.RpcError) as e:
            user_blocks.UnblockUser(user_blocks_pb2.UnblockUserReq(user_id=user2.id))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.USER_NOT_BLOCKED

        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_user_ids) == 0

    with api_session(token1) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user2.username))
        assert res.user_id == user2.id

        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    with api_session(token2) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.pending_friend_request_count == 1

    # Test re-blocking
    with user_blocks_session(token1) as user_blocks:
        user_blocks.BlockUser(user_blocks_pb2.BlockUserReq(user_id=user2.id))

        blocked_user_list = user_blocks.GetBlockedUsers(empty_pb2.Empty())
        assert len(blocked_user_list.blocked_user_ids) == 1
