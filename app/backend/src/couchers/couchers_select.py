from sqlalchemy import union
from sqlalchemy.orm import Query, aliased
from sqlalchemy.sql import Select

from couchers.models import User, UserBlock
from couchers.utils import is_valid_email, is_valid_user_id, is_valid_username


def _relevant_user_blocks(user_id):
    """
    Gets list of blocked user IDs or users that have blocked this user: those should be hidden
    """
    blocked_users = couchers_select(UserBlock.blocked_user_id).where(UserBlock.blocking_user_id == user_id)

    blocking_users = couchers_select(UserBlock.blocking_user_id).where(UserBlock.blocked_user_id == user_id)

    return couchers_select(union(blocked_users, blocking_users).subquery())


"""
This method construct provided directly by the developers
They intend to implement a better option in the near future
See issue here: https://github.com/sqlalchemy/sqlalchemy/issues/6700
"""


def couchers_select(*expr):
    return CouchersSelect._create_future_select(*expr)


class CouchersSelect(Select):
    def where_valid_username_or_email(self, field):
        if is_valid_username(field):
            return self.where(User.username == field)
        elif is_valid_email(field):
            return self.where(User.email == field)
        # no fields match, this will return no rows
        return self.where(False)

    def where_valid_username_or_id(self, field):
        if is_valid_username(field):
            return self.where(User.username == field)
        elif is_valid_user_id(field):
            return self.where(User.id == field)
        # no fields match, this will return no rows
        return self.where(False)

    def where_users_visible(self, context, table=User):
        """
        Filters out users that should not be visible: blocked, deleted, or banned

        Filters the given table, assuming it's already joined/selected from
        """
        hidden_users = _relevant_user_blocks(context.user_id)
        return self.where(table.is_visible).where(~table.id.in_(hidden_users))

    def where_users_column_visible(self, context, column):
        """
        Filters the given column, not yet joined/selected from
        """
        hidden_users = _relevant_user_blocks(context.user_id)
        aliased_user = aliased(User)
        return (
            self.join(aliased_user, aliased_user.id == column)
            .where(aliased_user.is_visible)
            .where(~aliased_user.id.in_(hidden_users))
        )


class CouchersQuery(Query):
    def where_users_visible(self, context, table=User):
        """
        Filters out users that should not be visible: blocked, deleted, or banned

        Filters the given table, assuming it's already joined/selected from
        """
        hidden_users = _relevant_user_blocks(context.user_id)
        return self.where(table.is_visible).where(~table.id.in_(hidden_users))

    def where_users_column_visible(self, context, column):
        """
        Filters the given column, not yet joined/selected from
        """
        hidden_users = _relevant_user_blocks(context.user_id)
        aliased_user = aliased(User)
        return (
            self.join(aliased_user, aliased_user.id == column)
            .where(aliased_user.is_visible)
            .where(~aliased_user.id.in_(hidden_users))
        )
