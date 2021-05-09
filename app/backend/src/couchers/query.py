from sqlalchemy import or_
from sqlalchemy.orm import Query, aliased

from couchers.utils import is_valid_email, is_valid_user_id, is_valid_username


class CouchersQuery(Query):
    # this class is required in models, but models require this
    # so to get around this, we have these variables here that you have to patch up after the models have been defined
    user_class = None
    user_block_class = None

    def blocked_users(self, session, user_id):
        """
        Gets list of blocked user IDs or users that have blocked this user: those should be hidden
        """
        relevant_user_blocks = (
            session.query(self.user_block_class)
            .filter(
                or_(self.user_block_class.blocking_user_id == user_id, self.user_block_class.blocked_user_id == user_id)
            )
            .all()
        )

        return [
            user_block.blocking_user_id if user_block.blocking_user_id != user_id else user_block.blocked_user_id
            for user_block in relevant_user_blocks
        ]

    def filter_by_username_or_email(self, field):
        if is_valid_username(field):
            return self.filter(self.user_class.username == field)
        elif is_valid_email(field):
            return self.filter(self.user_class.email == field)
        # no fields match, this will return no rows
        return self.filter(False)

    def filter_by_username_or_id(self, field):
        if is_valid_username(field):
            return self.filter(self.user_class.username == field)
        elif is_valid_user_id(field):
            return self.filter(self.user_class.id == field)
        # no fields match, this will return no rows
        return self.filter(False)

    def filter_users(self, context, table=None):
        """
        Filters out users that should not be visible: blocked, deleted, or banned

        Filters the given table, assuming it's already joined/selected from
        """
        if table is None:
            table = self.user_class
        hidden_users = self.blocked_users(self.session, context.user_id)
        return self.filter(table.is_visible).filter(~table.id.in_(hidden_users))

    def filter_users_column(self, context, column):
        """
        Filters the given a column, not yet joined/selected from
        """
        hidden_users = self.blocked_users(self.session, context.user_id)
        aliased_user = aliased(self.user_class)
        return (
            self.join(aliased_user, aliased_user.id == column)
            .filter(aliased_user.is_visible)
            .filter(~aliased_user.id.in_(hidden_users))
        )
