import pytest

from couchers.models import User
from tests.test_fixtures import db, generate_user, make_user_invisible, session_scope


def test_visible_user_filter(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user(make_invisible=True)

    with session_scope() as session:
        session.query(User).filter(User.id == user2.id).one().is_banned = True

        make_user_invisible(user3.id)

        visible_users = session.query(User).filter(User.is_visible).all()
        assert len(visible_users) == 1
