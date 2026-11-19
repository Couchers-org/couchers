from typing import Any

from sqlalchemy import BigInteger, Enum, Numeric
from sqlalchemy.sql import and_, case, column, func, or_, select, table, type_coerce
from sqlalchemy.sql.elements import ColumnElement

from couchers.helpers.completed_profile import has_completed_profile_expression, has_filled_my_home_expression
from couchers.helpers.references import where_references_counted
from couchers.models import (
    HostingStatus,
    HostPool,
    HostRequest,
    HostRequestStatus,
    Message,
    Reference,
    StayProposalKind,
    User,
)

HOST_POOL_NEWBIE_MAX_REFERENCES = 1
HOST_POOL_NEWBIE_MAX_REQUESTS = 5
HOST_POOL_NEWBIE_MIN_RESPONSE96H = 0.66
# at least one of the first this many host requests must be accepted
HOST_POOL_NEWBIE_FIRST_REQUESTS = 3

# the user_response_rates materialized view, referenced by name because materialized_views imports this module for
# lite_users
_user_response_rates = table(
    "user_response_rates",
    column("user_id", BigInteger),
    column("requests96h", BigInteger),
    column("response96h", Numeric),
)


def _newbie_history_expressions() -> tuple[ColumnElement[bool], ColumnElement[bool], ColumnElement[bool]]:
    """
    Returns (has_good_record, accepted_early_enough, missed_early_acceptance) for the User in the enclosing query.

    accepted_early_enough and missed_early_acceptance differ while one of the first requests is still open.
    """
    # the count shown on the user's profile to someone logged out
    reference_count = where_references_counted(
        select(func.count(Reference.id)).where(Reference.to_user_id == User.id), None
    ).scalar_subquery()

    # a null response96h (nothing counted yet) doesn't disqualify
    has_disqualifying_response_rate = (
        select(_user_response_rates.c.user_id)
        .where(_user_response_rates.c.user_id == User.id)
        .where(
            or_(
                _user_response_rates.c.requests96h > HOST_POOL_NEWBIE_MAX_REQUESTS,
                _user_response_rates.c.response96h < HOST_POOL_NEWBIE_MIN_RESPONSE96H,
            )
        )
        .exists()
    )

    received_requests = (
        select(HostRequest.conversation_id)
        .where(HostRequest.host_user_id == User.id)
        .where(HostRequest.proposal_kind == StayProposalKind.request)
    )
    last_of_first_requests = (
        received_requests.order_by(HostRequest.conversation_id)
        .offset(HOST_POOL_NEWBIE_FIRST_REQUESTS - 1)
        .limit(1)
        .correlate(User)
        .scalar_subquery()
    )
    first_requests = received_requests.where(HostRequest.conversation_id <= last_of_first_requests)
    # the status may have moved on since, e.g. to cancelled
    accepted_a_first_request = first_requests.where(
        select(Message.id)
        .where(Message.conversation_id == HostRequest.conversation_id)
        .where(Message.host_request_status_target == HostRequestStatus.accepted)
        .exists()
    ).exists()
    has_open_first_request = (
        first_requests.where(HostRequest.status == HostRequestStatus.pending)
        .where(HostRequest.end_time > func.now())
        .exists()
    )
    has_had_first_requests = last_of_first_requests.is_not(None)

    return (
        and_(reference_count <= HOST_POOL_NEWBIE_MAX_REFERENCES, ~has_disqualifying_response_rate),
        or_(~has_had_first_requests, accepted_a_first_request),
        and_(has_had_first_requests, ~accepted_a_first_request, ~has_open_first_request),
    )


def newbie_pool_eligible_expression() -> ColumnElement[bool]:
    """
    Whether the User in the enclosing query can still get into (or stay in) the newbie pool.

    Only depends on their hosting history, and once false stays false.
    """
    has_good_record, _, missed_early_acceptance = _newbie_history_expressions()
    return and_(has_good_record, ~missed_early_acceptance)


def host_pool_expression() -> ColumnElement[Any]:
    """
    The host pool of the User in the enclosing query.

    Evaluated live for the user's own account info, and stored in lite_users for bulk reads.
    """
    has_good_record, accepted_early_enough, _ = _newbie_history_expressions()
    # nested so the history subqueries only run for the few users who meet the profile conditions
    return type_coerce(
        case(
            (
                and_(
                    User.hosting_status == HostingStatus.can_host,
                    has_completed_profile_expression(),
                    has_filled_my_home_expression(),
                ),
                case(
                    (and_(has_good_record, accepted_early_enough), HostPool.newbie.name),
                    else_=HostPool.normal.name,
                ),
            ),
            else_=HostPool.normal.name,
        ),
        Enum(HostPool, native_enum=False, create_constraint=False),
    )
