from sqlalchemy import not_

from couchers.models import User


def query_users_who_arent_hidden(session):
    return session.query(User).filter(not_(User.is_hidden_for_sql))
