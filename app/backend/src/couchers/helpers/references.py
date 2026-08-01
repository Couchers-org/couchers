from typing import TYPE_CHECKING, Any

from sqlalchemy import select
from sqlalchemy.orm import InstrumentedAttribute, aliased
from sqlalchemy.sql import Select, exists, func, or_

from couchers.models import HostRequest, Reference, ReferenceType, User
from couchers.sql import _shadow_clause

if TYPE_CHECKING:
    from couchers.context import CouchersContext


def where_reference_user_visible[T: tuple[Any, ...]](
    statement: Select[T], context: CouchersContext, user_id_column: InstrumentedAttribute[int]
) -> Select[T]:
    """
    Filters references based on the visibility of the user in the given column (the writer
    or the subject of the reference).

    Deliberately weaker than users_visible: references involving deleted or blocked users
    stay visible so reference history is preserved; only banned or shadowed (to others)
    users hide their references. Both the reference list (ListReferences) and the reference
    count (get_num_references) must use this, otherwise the count diverges from the list.
    """
    return statement.where(
        exists(
            select(1)
            .select_from(User)
            .where(User.id == user_id_column)
            .where(User.banned_at.is_(None))
            .where(_shadow_clause(context, User))
            .correlate_except(User)
        )
    )


def where_references_not_hidden_by_reciprocity[T: tuple[Any, ...]](statement: Select[T]) -> Select[T]:
    """
    Filters out references that are still hidden by the reciprocal-reference rule.

    A host/surf reference stays hidden until either the recipient has written their
    reciprocal reference or the 2-week window to write one has closed; friend
    references are always visible.

    Apply this to any query that selects from Reference. Both the reference list
    (ListReferences) and the reference count (get_num_references) must use it,
    otherwise the count includes references the list hides, leaking the existence
    of a still-hidden reference.
    """
    other_reference = aliased(Reference)
    reciprocal_written = exists(
        select(other_reference.id)
        .where(other_reference.host_request_id == Reference.host_request_id)
        .where(other_reference.from_user_id == Reference.to_user_id)
        .where(other_reference.reference_type != ReferenceType.friend)
    )
    window_closed = exists(
        select(HostRequest.conversation_id)
        .where(HostRequest.conversation_id == Reference.host_request_id)
        .where(HostRequest.end_time_to_write_reference < func.now())
    )
    return statement.where(
        or_(
            Reference.reference_type == ReferenceType.friend,
            reciprocal_written,
            window_closed,
        )
    )
