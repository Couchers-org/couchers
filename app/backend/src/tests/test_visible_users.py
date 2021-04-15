import pytest

from couchers.db import get_user_by_field
from couchers.models import User
from tests.test_fixtures import db, generate_user, session_scope


def test_visible_user_filter(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user(is_deleted=True)

    with session_scope() as session:
        user2 = get_user_by_field(session, user2.username)
        user2.is_banned = True
        session.commit()
        session.refresh(user2)
        session.expunge(user2)

        visible_users = session.query(User).filter(User.is_visible).all()
        assert len(visible_users) == 1
