import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select

from couchers.db import session_scope
from couchers.models import User, UserBlock
from couchers.proto import blocking_pb2
from couchers.servicers.blocking import is_not_visible
from couchers.utils import now
from tests.fixtures.db import generate_user, make_user_block
from tests.fixtures.sessions import blocking_session


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
        assert e.value.details() == "You can't block yourself."

        user_blocks.BlockUser(blocking_pb2.BlockUserReq(username=user2.username))

        with pytest.raises(grpc.RpcError) as e:
            user_blocks.BlockUser(blocking_pb2.BlockUserReq(username=user2.username))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Target user has already been blocked."

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
        assert e.value.details() == "Target user is not blocked."

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

        assert user2.username in blocked_usernames
        assert user3.username in blocked_usernames
        assert user2.name in blocked_names
        assert user3.name in blocked_names


def test_relationships_userblock_dot_user(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    make_user_block(user1, user2)

    with session_scope() as session:
        block = session.execute(
            select(UserBlock).where((UserBlock.blocking_user_id == user1.id) & (UserBlock.blocked_user_id == user2.id))
        ).scalar_one()

        blocking_user_username = block.blocking_user.username
        blocking_user_name = block.blocking_user.name

        blocked_user_username = block.blocked_user.username
        blocked_user_name = block.blocked_user.name

    assert blocking_user_username == user1.username
    assert blocked_user_username == user2.username
    assert blocking_user_name == user1.name
    assert blocked_user_name == user2.name


def test_is_not_visible(db):
    """
    Comprehensive tests for is_not_visible function covering:
    1. Normal visible users (not blocked, not banned, not deleted) - should be visible to each other
    2. User1 blocks User2 - not visible
    3. User2 blocks User1 - not visible
    4. Mutual blocking - not visible
    5. User1 is deleted - not visible
    6. User2 is deleted - not visible
    7. Both users deleted - not visible
    8. User1 is banned - not visible
    9. User2 is banned - not visible
    10. Both users banned - not visible
    11. Mixed: User1 deleted and User2 banned - not visible
    12. None user_id cases with visible users
    13. None user_id cases with hidden users (banned/deleted)
    14. Ensure we have extra users in DB to avoid edge cases with empty database
    """

    # Create extra users to ensure the database is not empty - these should remain visible
    extra_user1, _ = generate_user()
    extra_user2, _ = generate_user()
    extra_user3, _ = generate_user()

    # Create users for testing - all start as visible
    normal_user1, _ = generate_user()
    normal_user2, _ = generate_user()

    # Users for blocking tests
    blocker_user, _ = generate_user()
    blockee_user, _ = generate_user()

    # Users for reverse blocking tests
    reverse_blocker, _ = generate_user()
    reverse_blockee, _ = generate_user()

    # Users for mutual blocking tests
    mutual_blocker1, _ = generate_user()
    mutual_blocker2, _ = generate_user()

    # Users for deletion tests
    deleted_user1, _ = generate_user()
    visible_for_deleted, _ = generate_user()
    deleted_user2, _ = generate_user()
    both_deleted1, _ = generate_user()
    both_deleted2, _ = generate_user()

    # Users for ban tests
    banned_user1, _ = generate_user()
    visible_for_banned, _ = generate_user()
    banned_user2, _ = generate_user()
    both_banned1, _ = generate_user()
    both_banned2, _ = generate_user()

    # User for mixed test
    mixed_deleted, _ = generate_user()
    mixed_banned, _ = generate_user()

    # Users for shadow tests
    shadowed_user, _ = generate_user()
    visible_for_shadowed, _ = generate_user()

    with session_scope() as session:
        # Test 1: Two normal visible users - should be visible to each other
        assert not is_not_visible(session, normal_user1.id, normal_user2.id)
        assert not is_not_visible(session, normal_user2.id, normal_user1.id)

        # Test 2: User1 blocks User2 - should not be visible
        make_user_block(blocker_user, blockee_user)
        assert is_not_visible(session, blocker_user.id, blockee_user.id)
        assert is_not_visible(session, blockee_user.id, blocker_user.id)  # symmetric

        # Test 3: User2 blocks User1 (reverse block) - should not be visible
        make_user_block(reverse_blockee, reverse_blocker)
        assert is_not_visible(session, reverse_blocker.id, reverse_blockee.id)
        assert is_not_visible(session, reverse_blockee.id, reverse_blocker.id)  # symmetric

        # Test 4: Mutual blocking - should not be visible
        make_user_block(mutual_blocker1, mutual_blocker2)
        make_user_block(mutual_blocker2, mutual_blocker1)
        assert is_not_visible(session, mutual_blocker1.id, mutual_blocker2.id)
        assert is_not_visible(session, mutual_blocker2.id, mutual_blocker1.id)

        # Test 5: User1 is deleted - should not be visible
        deleted_user1_db = session.get_one(User, deleted_user1.id)
        deleted_user1_db.deleted_at = now()
        session.commit()
        assert is_not_visible(session, deleted_user1.id, visible_for_deleted.id)
        assert is_not_visible(session, visible_for_deleted.id, deleted_user1.id)

        # Test 6: User2 is deleted - should not be visible
        deleted_user2_db = session.get_one(User, deleted_user2.id)
        deleted_user2_db.deleted_at = now()
        session.commit()
        assert is_not_visible(session, normal_user1.id, deleted_user2.id)
        assert is_not_visible(session, deleted_user2.id, normal_user1.id)

        # Test 7: Both users deleted - should not be visible
        both_deleted1_db = session.get_one(User, both_deleted1.id)
        both_deleted2_db = session.get_one(User, both_deleted2.id)
        both_deleted1_db.deleted_at = now()
        both_deleted2_db.deleted_at = now()
        session.commit()
        assert is_not_visible(session, both_deleted1.id, both_deleted2.id)
        assert is_not_visible(session, both_deleted2.id, both_deleted1.id)

        # Test 8: User1 is banned - should not be visible
        banned_user1_db = session.get_one(User, banned_user1.id)
        banned_user1_db.banned_at = now()
        session.commit()
        assert is_not_visible(session, banned_user1.id, visible_for_banned.id)
        assert is_not_visible(session, visible_for_banned.id, banned_user1.id)

        # Test 9: User2 is banned - should not be visible
        banned_user2_db = session.get_one(User, banned_user2.id)
        banned_user2_db.banned_at = now()
        session.commit()
        assert is_not_visible(session, normal_user2.id, banned_user2.id)
        assert is_not_visible(session, banned_user2.id, normal_user2.id)

        # Test 10: Both users banned - should not be visible
        both_banned1_db = session.get_one(User, both_banned1.id)
        both_banned2_db = session.get_one(User, both_banned2.id)
        both_banned1_db.banned_at = now()
        both_banned2_db.banned_at = now()
        session.commit()
        assert is_not_visible(session, both_banned1.id, both_banned2.id)
        assert is_not_visible(session, both_banned2.id, both_banned1.id)

        # Test 11: Mixed - one deleted, one banned - should not be visible
        mixed_deleted_db = session.get_one(User, mixed_deleted.id)
        mixed_banned_db = session.get_one(User, mixed_banned.id)
        mixed_deleted_db.deleted_at = now()
        mixed_banned_db.banned_at = now()
        session.commit()
        assert is_not_visible(session, mixed_deleted.id, mixed_banned.id)
        assert is_not_visible(session, mixed_banned.id, mixed_deleted.id)

        # Test 12: None user_id cases with visible users - should be visible
        assert not is_not_visible(session, None, normal_user1.id)
        assert not is_not_visible(session, normal_user1.id, None)
        assert not is_not_visible(session, None, None)

        # Test 13: None user_id cases with hidden users (deleted/banned) - should not be visible
        assert is_not_visible(session, None, deleted_user1.id)
        assert is_not_visible(session, deleted_user1.id, None)
        assert is_not_visible(session, None, banned_user1.id)
        assert is_not_visible(session, banned_user1.id, None)

        # Test 14: Verify extra users are still visible (database not empty)
        assert not is_not_visible(session, extra_user1.id, extra_user2.id)
        assert not is_not_visible(session, extra_user2.id, extra_user3.id)
        assert not is_not_visible(session, extra_user1.id, extra_user3.id)

        # Additional edge case: Check that normal users are still visible to each other after all the above
        assert not is_not_visible(session, normal_user1.id, normal_user2.id)
        assert not is_not_visible(session, normal_user1.id, extra_user1.id)

        # Test 15: Shadowed target is hidden from other users and from anonymous viewers,
        # but visible to themselves
        shadowed_user_db = session.get_one(User, shadowed_user.id)
        shadowed_user_db.shadowed_at = now()
        session.commit()
        assert is_not_visible(session, visible_for_shadowed.id, shadowed_user.id)
        assert is_not_visible(session, None, shadowed_user.id)
        assert not is_not_visible(session, shadowed_user.id, shadowed_user.id)
        # Shadowed viewer can still see other (visible) users
        assert not is_not_visible(session, shadowed_user.id, visible_for_shadowed.id)
        assert not is_not_visible(session, shadowed_user.id, None)
