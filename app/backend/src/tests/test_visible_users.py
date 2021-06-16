import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.models import User
from proto import api_pb2
from tests.test_fixtures import ( # noqa
    api_session,
    db,
    generate_user,
    make_friends,
    make_user_block,
    make_user_invisible,
    session_scope,
)


# Also tests different ways to make users invisible
def test_is_visible_property(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user(make_invisible=True)

    with session_scope() as session:
        session.query(User).filter(User.id == user2.id).one().is_banned = True
        session.query(User).filter(User.id == user3.id).one().is_deleted = True

        make_user_invisible(user4.id)

        visible_users = session.query(User).filter(User.is_visible).all()
        assert len(visible_users) == 1


def test_query_dot_filter_users(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user(make_invisible=True)
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_user_block(user1, user3)
    make_user_block(user4, user1)

    users = [user2, user3, user4]
    # exemplary api call to to test query.filter_users() filters invisible users
    with api_session(token1) as api:
        for user in users:
            with pytest.raises(grpc.RpcError) as e:
                api.SendFriendRequest(
                    api_pb2.SendFriendRequestReq(
                        user_id=user.id,
                    )
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == errors.USER_NOT_FOUND


def test_query_dot_filter_users_column(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user()

    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user4)
    make_friends(user1, user5)

    make_user_invisible(user3.id)
    make_user_block(user1, user4)
    make_user_block(user5, user1)

    # exemplary api call to to test query.filter_users_column() filters invisible users
    with api_session(token1) as api:
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 1
        assert user2.id in res.user_ids
