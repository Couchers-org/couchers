from datetime import timedelta

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.db import get_user_by_field
from couchers.models import User
from couchers.utils import now
from pb import api_pb2, requests_pb2
from tests.test_fixtures import api_session, db, generate_user, make_friends, requests_session, session_scope


@pytest.fixture
def generate_invisible_users(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(is_deleted=True)
    user4, token4 = generate_user(accepted_tos=0)
    with session_scope() as session:
        user2 = get_user_by_field(session, user2.username)
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)


def test_visible_user_filter(generate_invisible_users):
    with session_scope() as session:
        visible_users = session.query(User).filter(User.is_visible).all()
        assert len(visible_users) == 1


def test_get_invisible_users(generate_invisible_users):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(is_deleted=True)
    user4, token4 = generate_user(accepted_tos=0)
    with session_scope() as session:
        user2 = get_user_by_field(session, user2.username)
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

    # Test get invisible user by username
    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetUser(api_pb2.GetUserReq(user=user2.username))
    assert e.value.code() == grpc.StatusCode.NOT_FOUND
    assert e.value.details() == errors.USER_NOT_FOUND

    # Test get invisible user by id
    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetUser(api_pb2.GetUserReq(user=str(user3.id)))
    assert e.value.code() == grpc.StatusCode.NOT_FOUND
    assert e.value.details() == errors.USER_NOT_FOUND

    # Test get invisible user by email
    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetUser(api_pb2.GetUserReq(user=user4.email))
    assert e.value.code() == grpc.StatusCode.NOT_FOUND
    assert e.value.details() == errors.USER_NOT_FOUND


def test_friend_requests_with_invisible_users(generate_invisible_users):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(is_deleted=True)
    user4, token4 = generate_user(accepted_tos=0)
    with session_scope() as session:
        user2 = get_user_by_field(session, user2.username)
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

    # Test send friend request to invisible user
    # Necessary?
    with api_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.SendFriendRequest(
                api_pb2.SendFriendRequestReq(
                    user_id=user2.id,
                )
            )
    assert e.value.code() == grpc.StatusCode.NOT_FOUND
    assert e.value.details() == errors.USER_NOT_FOUND

    # Test view all active friend requests, hide requests from invisible users
    # TODO

    # Test view friend request from invisible user
    # Necessary?
    # TODO

    # Test reply friend request from invisible user
    # Necessary?
    # TODO

    # Test cancel friend request to invisible user
    # Necessary?
    # TODO


def test_friend_list_with_invisible_users(generate_invisible_users):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(is_deleted=True)
    user4, token4 = generate_user(accepted_tos=0)
    with session_scope() as session:
        user2 = get_user_by_field(session, user2.username)
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

    user5, token5 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user1, user4)
    make_friends(user1, user5)

    with api_session(token1) as api:
        res = api.ListFriends(empty_pb2.Empty())
        assert len(res.user_ids) == 1


def test_host_requests_with_invisible_user(generate_invisible_users):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(is_deleted=True)
    user4, token4 = generate_user(accepted_tos=0)
    with session_scope() as session:
        user2 = get_user_by_field(session, user2.username)
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

    today_plus_2 = (now() + timedelta(days=2)).strftime("%Y-%m-%d")
    today_plus_3 = (now() + timedelta(days=3)).strftime("%Y-%m-%d")

    # Test send host request to invisible user
    # Necessary?
    with requests_session(token1) as requests:
        with pytest.raises(grpc.RpcError) as e:
            requests.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    to_user_id=user2.id, from_date=today_plus_2, to_date=today_plus_3, text="Test request"
                )
            )
    assert e.value.code() == grpc.StatusCode.NOT_FOUND
    assert e.value.details() == errors.USER_NOT_FOUND

    # Test view all host requests excluding invisible users
    # TODO

    # Test get host request from invisible user
    # TODO

    # Test reply host request from invisible user
    # Necessary?
    # TODO


def test_messages_with_invisible_users(generate_invisible_users):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(is_deleted=True)
    user4, token4 = generate_user(accepted_tos=0)
    with session_scope() as session:
        user2 = get_user_by_field(session, user2.username)
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

    # Test send message
    # Necessary?
    # TODO

    # Test view messages from invisible user
    # Desired behavior?
    # TODO

    # Test group chat where one user gets banned
    # Desired behavior?
    # TODO


def test_references_invisible_users(generate_invisible_users):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(is_deleted=True)
    user4, token4 = generate_user(accepted_tos=0)
    with session_scope() as session:
        user2 = get_user_by_field(session, user2.username)
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

    # Test invisible user writes reference
    # Necessary?
    # TODO

    # Test user writes reference for invisible user
    # Necessary?
    # TODO


def test_search_function_invisible_users(generate_invisible_users):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(is_deleted=True)
    user4, token4 = generate_user(accepted_tos=0)
    with session_scope() as session:
        user2 = get_user_by_field(session, user2.username)
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

    # Test search
    # TODO


"""
Future testing:
Event attendance lists
Group member lists
Other lists of users?
"""
