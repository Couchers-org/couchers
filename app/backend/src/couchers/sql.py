from typing import TYPE_CHECKING, Any, Self

from sqlalchemy import and_, false, or_
from sqlalchemy.orm import InstrumentedAttribute, aliased
from sqlalchemy.sql import Select, exists, union

from couchers.context import CouchersContext
from couchers.models import SignupFlow, User, UserBlock
from couchers.utils import is_valid_email, is_valid_user_id, is_valid_username

if TYPE_CHECKING:
    from couchers.materialized_views import LiteUser

    type _UserLike = type[User | LiteUser | SignupFlow]
    type _User = type[User | LiteUser]


class CouchersSelect(Select[Any]):
    """
    This method construct provided directly by the developers
    They intend to implement a better option in the near future
    See issue here: https://github.com/sqlalchemy/sqlalchemy/issues/6700
    """

    inherit_cache = True

    def where_username_or_email(self, value: str, table: "_UserLike" = User) -> Self:
        if is_valid_username(value):
            return self.where(table.username == value)
        elif is_valid_email(value) and hasattr(table, "email"):
            return self.where(table.email == value)
        # no fields match, this will return no rows
        return self.where(false())

    def where_username_or_id(self, value: str, table: "_UserLike" = User) -> Self:
        if is_valid_username(value):
            return self.where(table.username == value)
        elif is_valid_user_id(value):
            return self.where(table.id == value)
        # no fields match, this will return no rows
        return self.where(false())

    def where_username_or_email_or_id(self, value: str) -> Self:
        # Should only be used for admin APIs, etc.
        if is_valid_username(value):
            return self.where(User.username == value)
        elif is_valid_email(value):
            return self.where(User.email == value)
        elif is_valid_user_id(value):
            return self.where(User.id == value)
        # no fields match, this will return no rows
        return self.where(false())

    def where_users_visible(self, context: CouchersContext, table: "_User" = User) -> Self:
        """
        Filters out users that should not be visible: blocked, deleted, or banned

        Filters the given table, assuming it's already joined/selected from
        """
        hidden_users = _relevant_user_blocks(context.user_id)
        return self.where(table.is_visible).where(~table.id.in_(hidden_users))

    def where_users_column_visible(self, context: CouchersContext, column: InstrumentedAttribute[int]) -> Self:
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

    def where_users_visible_to_each_other(self, user1: "_User", user2: "_User") -> Self:
        """
        Filters to ensure two users are mutually visible to each other.

        Checks that:
        - Both users are visible (not deleted/banned)
        - Neither user has blocked the other (bidirectional check)

        Use this when both User tables are already joined/selected in the query.
        """
        return (
            self.where(user1.is_visible)
            .where(user2.is_visible)
            .where(
                ~exists(
                    couchers_select(1)
                    .select_from(UserBlock)
                    .where(
                        or_(
                            and_(UserBlock.blocking_user_id == user1.id, UserBlock.blocked_user_id == user2.id),
                            and_(UserBlock.blocking_user_id == user2.id, UserBlock.blocked_user_id == user1.id),
                        )
                    )
                )
            )
        )

    def where_user_columns_visible_to_each_other(
        self, column1: InstrumentedAttribute[int], column2: InstrumentedAttribute[int]
    ) -> Self:
        """
        Filters to ensure two users are mutually visible to each other.

        Checks that:
        - Both users are visible (not deleted/banned)
        - Neither user has blocked the other (bidirectional check)

        Use this when you have two user_id columns that haven't been joined yet.
        This will join both User tables and apply the visibility checks.
        """
        user1 = aliased(User)
        user2 = aliased(User)
        return (
            self.join(user1, user1.id == column1)
            .join(user2, user2.id == column2)
            .where(user1.is_visible)
            .where(user2.is_visible)
            .where(
                ~exists(
                    couchers_select(1)
                    .select_from(UserBlock)
                    .where(
                        or_(
                            and_(UserBlock.blocking_user_id == user1.id, UserBlock.blocked_user_id == user2.id),
                            and_(UserBlock.blocking_user_id == user2.id, UserBlock.blocked_user_id == user1.id),
                        )
                    )
                )
            )
        )


def couchers_select(*expr: Any) -> CouchersSelect:
    return CouchersSelect(*expr)


def _relevant_user_blocks(user_id: int) -> CouchersSelect:
    """
    Gets a list of blocked user IDs or users that have blocked this user: those should be hidden
    """
    blocked_users = couchers_select(UserBlock.blocked_user_id).where(UserBlock.blocking_user_id == user_id)

    blocking_users = couchers_select(UserBlock.blocking_user_id).where(UserBlock.blocked_user_id == user_id)

    return couchers_select(union(blocked_users, blocking_users).subquery())
