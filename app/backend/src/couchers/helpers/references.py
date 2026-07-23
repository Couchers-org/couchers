from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import aliased
from sqlalchemy.sql import Select, exists, func, or_

from couchers.models import HostRequest, Reference, ReferenceType


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
