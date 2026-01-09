from typing import cast

from sqlalchemy import select, update
from sqlalchemy.sql import func

from couchers.context import CouchersContext
from couchers.db import session_scope
from couchers.models import FriendRelationship, User
from couchers.sql import users_visible, where_users_column_visible
from tests.fixtures.db import generate_user, make_friends, make_user_block, make_user_invisible


class _FakeContext:
    def __init__(self, user_id):
        self.user_id = user_id


# Also tests different ways to make users invisible
def test_is_visible_property(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user(delete_user=True)

    with session_scope() as session:
        session.execute(update(User).where(User.id == user2.id).values(is_banned=True))
        session.execute(update(User).where(User.id == user3.id).values(is_deleted=True))
        session.execute(update(User).where(User.id == user4.id).values(is_banned=True))

        visible_users = session.execute(select(User.id).where(User.is_visible)).scalars().all()

        assert visible_users[0] == user1.id


def test_select_dot_where_users_visible(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user(delete_user=True)
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_user_block(user1, user3)
    make_user_block(user4, user1)

    context = cast(CouchersContext, _FakeContext(user1.id))
    with session_scope() as session:
        assert session.execute(select(func.count()).select_from(User).where(users_visible(context))).scalar_one() == 1


def test_select_dot_where_users_column_visible(db):
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

    context = cast(CouchersContext, _FakeContext(user1.id))
    with session_scope() as session:
        assert (
            session.execute(
                where_users_column_visible(
                    select(func.count()).select_from(FriendRelationship), context, FriendRelationship.to_user_id
                )
            ).scalar_one()
            == 1
        )
