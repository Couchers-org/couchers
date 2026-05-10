from typing import TYPE_CHECKING, Any

from sqlalchemy import ColumnElement, and_, false, or_, select, true
from sqlalchemy.orm import InstrumentedAttribute, aliased
from sqlalchemy.sql import Select, exists, union

from couchers.context import CouchersContext
from couchers.models import (
    Comment,
    EventOccurrence,
    FriendRelationship,
    GroupChat,
    HostRequest,
    ModerationObjectType,
    ModerationState,
    ModerationVisibility,
    Reply,
    SignupFlow,
    User,
    UserBlock,
)
from couchers.utils import is_valid_email, is_valid_user_id, is_valid_username

if TYPE_CHECKING:
    from couchers.materialized_views import LiteUser

    type _UserLike = type[User | LiteUser | SignupFlow]
    type _User = type[User | LiteUser]
    type _ModeratedContent = type[HostRequest | GroupChat | FriendRelationship | EventOccurrence | Comment | Reply]


def username_or_email(value: str, table: _UserLike = User) -> ColumnElement[bool]:
    if is_valid_username(value):
        return table.username == value
    elif is_valid_email(value) and hasattr(table, "email"):
        return table.email == value
    # no fields match, this will return no rows
    return false()


def username_or_id(value: str, table: _UserLike = User) -> ColumnElement[bool]:
    if is_valid_username(value):
        return table.username == value
    elif is_valid_user_id(value):
        return table.id == int(value)
    # no fields match, this will return no rows
    return false()


def username_or_email_or_id(value: str) -> ColumnElement[bool]:
    # Should only be used for admin APIs, etc.
    if is_valid_username(value):
        return User.username == value
    elif is_valid_email(value):
        return User.email == value
    elif is_valid_user_id(value):
        return User.id == int(value)
    # no fields match, this will return no rows
    return false()


def _shadow_clause(context: CouchersContext, table: _User) -> ColumnElement[bool]:
    if context.is_logged_in():
        return or_(table.shadowed_at.is_(None), table.id == context.user_id)
    return table.shadowed_at.is_(None)


def users_visible(context: CouchersContext, table: _User = User) -> ColumnElement[bool]:
    """
    Filters out users that should not be visible: blocked, deleted, banned, or shadowed (to others).

    Filters the given table, assuming it's already joined/selected from
    """
    hidden_users = _relevant_user_blocks(context.user_id)
    return and_(table.is_visible, _shadow_clause(context, table), ~table.id.in_(hidden_users))


def where_users_column_visible[T: tuple[Any, ...]](
    query: Select[T], context: CouchersContext, column: InstrumentedAttribute[int]
) -> Select[T]:
    """
    Filters the given column, not yet joined/selected from
    """
    hidden_users = _relevant_user_blocks(context.user_id)
    aliased_user = aliased(User)
    return (
        query.join(aliased_user, aliased_user.id == column)
        .where(aliased_user.is_visible)
        .where(_shadow_clause(context, aliased_user))
        .where(~aliased_user.id.in_(hidden_users))
    )


def users_visible_to_each_other(*, self_user: _User, other_user: _User) -> ColumnElement[bool]:
    """
    Filters to ensure other_user is visible to self_user, and that they haven't blocked each other.

    Use this when both User tables are already joined/selected in the query.
    """
    return and_(
        self_user.is_visible,
        other_user.is_visible,
        other_user.shadowed_at.is_(None),
        ~exists(
            select(1)
            .select_from(UserBlock)
            .where(
                or_(
                    and_(UserBlock.blocking_user_id == self_user.id, UserBlock.blocked_user_id == other_user.id),
                    and_(UserBlock.blocking_user_id == other_user.id, UserBlock.blocked_user_id == self_user.id),
                )
            )
        ),
    )


def where_user_columns_visible_to_each_other[T: tuple[Any, ...]](
    query: Select[T], *, self_column: InstrumentedAttribute[int], other_column: InstrumentedAttribute[int]
) -> Select[T]:
    """
    Filters to ensure the user in other_column is visible to the user in self_column, and that they
    haven't blocked each other.

    Use this when you have two user_id columns that haven't been joined yet. This will join both
    User tables and apply the visibility checks.
    """
    self_user = aliased(User)
    other_user = aliased(User)
    return (
        query.join(self_user, self_user.id == self_column)
        .join(other_user, other_user.id == other_column)
        .where(self_user.is_visible)
        .where(other_user.is_visible)
        .where(other_user.shadowed_at.is_(None))
        .where(
            ~exists(
                select(1)
                .select_from(UserBlock)
                .where(
                    or_(
                        and_(UserBlock.blocking_user_id == self_user.id, UserBlock.blocked_user_id == other_user.id),
                        and_(UserBlock.blocking_user_id == other_user.id, UserBlock.blocked_user_id == self_user.id),
                    )
                )
            )
        )
    )


def where_moderated_content_visible_to_user_column[T: tuple[Any, ...]](
    query: Select[T],
    table: _ModeratedContent,
    user_id_column: InstrumentedAttribute[int],
    is_list_operation: bool = False,
) -> Select[T]:
    aliased_mod_state = aliased(ModerationState)
    conditions = [aliased_mod_state.visibility == ModerationVisibility.visible]

    # UNLISTED content is visible in single-item operations but not in lists
    if not is_list_operation:
        conditions.append(aliased_mod_state.visibility == ModerationVisibility.unlisted)

    # Authors can always see their own SHADOWED content
    conditions.append(
        and_(
            aliased_mod_state.visibility == ModerationVisibility.shadowed,
            getattr(table, table.__moderation_author_column__) == user_id_column,
        )
    )

    return query.join(aliased_mod_state, aliased_mod_state.id == table.moderation_state_id).where(or_(*conditions))


def where_moderated_content_visible[T: tuple[Any, ...]](
    query: Select[T],
    context: CouchersContext,
    table: _ModeratedContent,
    is_list_operation: bool = False,
) -> Select[T]:
    aliased_mod_state = aliased(ModerationState)
    conditions = [aliased_mod_state.visibility == ModerationVisibility.visible]

    # UNLISTED content is visible in single-item operations but not in lists
    if not is_list_operation:
        conditions.append(aliased_mod_state.visibility == ModerationVisibility.unlisted)

    # Authors can always see their own SHADOWED content
    if context.is_logged_in():
        conditions.append(
            and_(
                aliased_mod_state.visibility == ModerationVisibility.shadowed,
                getattr(table, table.__moderation_author_column__) == context.user_id,
            )
        )

    return query.join(aliased_mod_state, aliased_mod_state.id == table.moderation_state_id).where(or_(*conditions))


def moderation_state_column_visible(
    context: CouchersContext,
    column: InstrumentedAttribute[int | None],
) -> ColumnElement[bool]:
    """
    Filters based on whether the moderation state referenced by the column is visible.

    Use this when you have a moderation_state_id column on a table that's not the moderated
    content itself (e.g., Notification.moderation_state_id).

    The condition evaluates to True when:
    - The column is NULL (non-moderated content), OR
    - The linked moderation state has visibility 'visible' or 'unlisted', OR
    - The linked moderation state has visibility 'shadowed' and the current user is the author
    """
    aliased_mod_state = aliased(ModerationState)

    # For 'shadowed' content, check if the user is the author by looking up the content table
    # using object_type and object_id on the moderation_state row
    shadowed_conditions: list[ColumnElement[bool]] = []
    if context.is_logged_in():
        shadowed_conditions = [
            and_(
                aliased_mod_state.visibility == ModerationVisibility.shadowed,
                or_(
                    and_(
                        aliased_mod_state.object_type == ModerationObjectType.host_request,
                        exists(
                            select(HostRequest.conversation_id).where(
                                HostRequest.conversation_id == aliased_mod_state.object_id,
                                HostRequest.initiator_user_id == context.user_id,
                            )
                        ),
                    ),
                    and_(
                        aliased_mod_state.object_type == ModerationObjectType.group_chat,
                        exists(
                            select(GroupChat.conversation_id).where(
                                GroupChat.conversation_id == aliased_mod_state.object_id,
                                GroupChat.creator_id == context.user_id,
                            )
                        ),
                    ),
                    and_(
                        aliased_mod_state.object_type == ModerationObjectType.friend_request,
                        exists(
                            select(FriendRelationship.id).where(
                                FriendRelationship.id == aliased_mod_state.object_id,
                                FriendRelationship.from_user_id == context.user_id,
                            )
                        ),
                    ),
                    and_(
                        aliased_mod_state.object_type == ModerationObjectType.event_occurrence,
                        exists(
                            select(EventOccurrence.id).where(
                                EventOccurrence.id == aliased_mod_state.object_id,
                                EventOccurrence.creator_user_id == context.user_id,
                            )
                        ),
                    ),
                    and_(
                        aliased_mod_state.object_type == ModerationObjectType.comment,
                        exists(
                            select(Comment.id).where(
                                Comment.id == aliased_mod_state.object_id,
                                Comment.author_user_id == context.user_id,
                            )
                        ),
                    ),
                    and_(
                        aliased_mod_state.object_type == ModerationObjectType.reply,
                        exists(
                            select(Reply.id).where(
                                Reply.id == aliased_mod_state.object_id,
                                Reply.author_user_id == context.user_id,
                            )
                        ),
                    ),
                ),
            )
        ]

    return or_(
        column.is_(None),
        exists(
            select(aliased_mod_state.id).where(
                aliased_mod_state.id == column,
                or_(
                    aliased_mod_state.visibility == ModerationVisibility.visible,
                    aliased_mod_state.visibility == ModerationVisibility.unlisted,
                    *shadowed_conditions,
                ),
            )
        ),
    )


def _relevant_user_blocks(user_id: int) -> Select[tuple[int]]:
    """
    Gets a list of blocked user IDs or users that have blocked this user: those should be hidden
    """
    blocked_users = select(UserBlock.blocked_user_id).where(UserBlock.blocking_user_id == user_id)
    blocking_users = select(UserBlock.blocking_user_id).where(UserBlock.blocked_user_id == user_id)

    return select(union(blocked_users, blocking_users).subquery())


def to_bool(value: bool) -> ColumnElement[bool]:
    return true() if value else false()
