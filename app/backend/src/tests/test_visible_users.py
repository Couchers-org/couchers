from sqlalchemy import not_

from couchers.models import User
from tests.test_fixtures import db, generate_user, session_scope


def test_hidden_users(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user(is_deleted=True)
    # user3, token3 = generate_user(is_banned=True)
    user4, token4 = generate_user(accepted_tos=0)

    with session_scope() as session:
        visible_users = session.query(User).filter(User.is_visible_for_sql).all()
        assert len(visible_users) == 1
