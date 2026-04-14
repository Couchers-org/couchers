from typing import TYPE_CHECKING, Any

from sqlalchemy import ColumnElement, and_, false, or_, select, true
from sqlalchemy.orm import InstrumentedAttribute, aliased
from sqlalchemy.sql import Select, exists, union

from couchers.context import CouchersContext
from couchers.models import (
    EventOccurrence,
    FriendRelationship,
    GroupChat,
    HostRequest,
    ModerationObjectType,
    ModerationState,
    ModerationVisibility,
    SignupFlow,
    User,
    UserBlock,
)
from couchers.utils import is_valid_email, is_valid_user_id, is_valid_username

if TYPE_CHECKING:
    from couchers.materialized_views import LiteUser

    type _UserLike = type[User | LiteUser | SignupFlow]
    type _User = type[User | LiteUser]
    type _ModeratedContent = type[HostRequest | GroupChat | FriendRelationship | EventOccurrence]


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
        return table.id == value
    # no fields match, this will return no rows
    return false()


def username_or_email_or_id(value: str) -> ColumnElement[bool]:
    # Should only be used for admin APIs, etc.
    if is_valid_username(value):
        return User.username == value
    elif is_valid_email(value):
        return User.email == value
    elif is_valid_user_id(value):
        return User.id == value
    # no fields match, this will return no rows
    return false()


def users_visible(context: CouchersContext, table: _User = User) -> ColumnElement[bool]:
    """
    Filters out users that should not be visible: blocked, deleted, or banned

    Filters the given table, assuming it's already joined/selected from
    """
    hidden_users = _relevant_user_blocks(context.user_id)
    return and_(table.is_visible, ~table.id.in_(hidden_users))


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
        .where(~aliased_user.id.in_(hidden_users))
    )


def users_visible_to_each_other(user1: _User, user2: _User) -> ColumnElement[bool]:
    """
    Filters to ensure two users are mutually visible to each other.

    Checks that:
    - Both users are visible (not deleted/banned)
    - Neither user has blocked the other (bidirectional check)

    Use this when both User tables are already joined/selected in the query.
    """
    return and_(
        user1.is_visible,
        user2.is_visible,
        ~exists(
            select(1)
            .select_from(UserBlock)
            .where(
                or_(
                    and_(UserBlock.blocking_user_id == user1.id, UserBlock.blocked_user_id == user2.id),
                    and_(UserBlock.blocking_user_id == user2.id, UserBlock.blocked_user_id == user1.id),
                )
            )
        ),
    )


def where_user_columns_visible_to_each_other[T: tuple[Any, ...]](
    query: Select[T], column1: InstrumentedAttribute[int], column2: InstrumentedAttribute[int]
) -> Select[T]:
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
        query.join(user1, user1.id == column1)
        .join(user2, user2.id == column2)
        .where(user1.is_visible)
        .where(user2.is_visible)
        .where(
            ~exists(
                select(1)
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
