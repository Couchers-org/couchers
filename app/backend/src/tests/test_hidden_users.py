from tests.test_fixtures import db, generate_user, session_scope

from couchers.standardized_queries import query_users_who_arent_hidden

def test_hidden_users(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user(is_deleted=True)
    #user3, token3 = generate_user(is_banned=True)
    user4, token4 = generate_user(accepted_tos=0)

    with session_scope() as session:
        unhidden_users = query_users_who_arent_hidden(session).all()
        assert len(unhidden_users) == 1


