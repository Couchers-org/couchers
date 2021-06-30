from sqlalchemy import func

from couchers.models import FriendRelationship, User
from couchers.query import couchers_select as select
from tests.test_fixtures import (  # noqa
    db,
    generate_user,
    make_friends,
    make_user_block,
    make_user_invisible,
    session_scope,
)


class _FakeContext:
    def __init__(self, user_id):
        self.user_id = user_id


# Also tests different ways to make users invisible
def test_is_visible_property(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()
    user5, token5 = generate_user(make_invisible=True)

    with session_scope() as session:
        session.execute(select(User).filter(User.id == user2.id)).scalar_one().is_banned = True
        session.execute(select(User).filter(User.id == user3.id)).scalar_one().is_deleted = True

        make_user_invisible(user4.id)

        visible_users = session.execute(select(User).filter(User.is_visible)).scalars().all()
        assert len(visible_users) == 1


def test_select_dot_filter_users(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user(make_invisible=True)
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    make_user_block(user1, user3)
    make_user_block(user4, user1)

    context = _FakeContext(user1.id)
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count()).select_from(User).filter_users(session=session, context=context)
            ).scalar_one()
            == 1
        )


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

    context = _FakeContext(user1.id)
    with session_scope() as session:
        assert (
            session.execute(
                select(func.count())
                .select_from(FriendRelationship)
                .filter_users_column(session=session, context=context, column=FriendRelationship.to_user_id)
            ).scalar_one()
            == 1
        )
