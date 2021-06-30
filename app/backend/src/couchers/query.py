from sqlalchemy import or_
from sqlalchemy.orm import Query, aliased
from sqlalchemy.sql import Select

from couchers.models import User, UserBlock
from couchers.utils import is_valid_email, is_valid_user_id, is_valid_username


def _blocked_users(session, user_id):
    """
    Gets list of blocked user IDs or users that have blocked this user: those should be hidden
    """
    relevant_user_blocks = (
        session.query(UserBlock)
        .filter(or_(UserBlock.blocking_user_id == user_id, UserBlock.blocked_user_id == user_id))
        .all()
    )

    return [
        user_block.blocking_user_id if user_block.blocking_user_id != user_id else user_block.blocked_user_id
        for user_block in relevant_user_blocks
    ]


"""
This method construct provided directly by the developers
They intend to implement a better option in the near future
See issue here: https://github.com/sqlalchemy/sqlalchemy/issues/6700
"""


def couchers_select(*expr):
    return CouchersSelect._create_future_select(*expr)


class CouchersSelect(Select):
    def filter_by_username_or_email(self, field):
        if is_valid_username(field):
            return self.filter(User.username == field)
        elif is_valid_email(field):
            return self.filter(User.email == field)
        # no fields match, this will return no rows
        return self.filter(False)

    def filter_by_username_or_id(self, field):
        if is_valid_username(field):
            return self.filter(User.username == field)
        elif is_valid_user_id(field):
            return self.filter(User.id == field)
        # no fields match, this will return no rows
        return self.filter(False)


class CouchersQuery(Query):
    def filter_users(self, context, table=User):
        """
        Filters out users that should not be visible: blocked, deleted, or banned

        Filters the given table, assuming it's already joined/selected from
        """
        hidden_users = _blocked_users(self.session, context.user_id)
        return self.filter(table.is_visible).filter(~table.id.in_(hidden_users))

    def filter_users_column(self, context, column):
        """
        Filters the given a column, not yet joined/selected from
        """
        hidden_users = _blocked_users(self.session, context.user_id)
        aliased_user = aliased(User)
        return (
            self.join(aliased_user, aliased_user.id == column)
            .filter(aliased_user.is_visible)
            .filter(~aliased_user.id.in_(hidden_users))
        )
