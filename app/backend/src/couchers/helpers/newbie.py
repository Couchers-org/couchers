from datetime import timedelta
from typing import Any

from sqlalchemy import Enum
from sqlalchemy.sql import and_, case, func, or_, select, type_coerce
from sqlalchemy.sql.elements import ColumnElement

from couchers.helpers.completed_profile import has_completed_profile_expression
from couchers.helpers.references import where_references_counted
from couchers.materialized_views import UserResponseRate
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

HOST_POOL_NEWBIE_MIN_ABOUT_PLACE_LENGTH = 50
HOST_POOL_NEWBIE_MAX_REFERENCES = 1
HOST_POOL_NEWBIE_MAX_REQUESTS = 5
HOST_POOL_NEWBIE_MAX_RESPONSE_TIME_66P = timedelta(hours=96)
# at least one of the first this many host requests must be accepted
HOST_POOL_NEWBIE_FIRST_REQUESTS = 3

def host_profile_ready_expression() -> ColumnElement[bool]:
    """
    Whether the User in the enclosing query has done everything they can themselves to get into the newbie pool.
    """
    return and_(
        User.hosting_status == HostingStatus.can_host,
        has_completed_profile_expression(),
        func.coalesce(func.length(User.about_place), 0) > HOST_POOL_NEWBIE_MIN_ABOUT_PLACE_LENGTH,
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

    # no row means the user has never received a request. Unanswered requests count as a 1000 day response time in the
    # 66th percentile, so the response time check means at least ~66% of requests were responded to within the cutoff
    has_disqualifying_response_rate = (
        select(UserResponseRate.user_id)
        .where(UserResponseRate.user_id == User.id)
        .where(
            or_(
                UserResponseRate.requests > HOST_POOL_NEWBIE_MAX_REQUESTS,
                UserResponseRate.response_time_66p > HOST_POOL_NEWBIE_MAX_RESPONSE_TIME_66P,
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
    """
    has_good_record, accepted_early_enough, _ = _newbie_history_expressions()
    # nested so the history subqueries only run for the few users with a ready host profile
    return type_coerce(
        case(
            (
                host_profile_ready_expression(),
                case(
                    (and_(has_good_record, accepted_early_enough), HostPool.newbie.name),
                    else_=HostPool.normal.name,
                ),
            ),
            else_=HostPool.normal.name,
        ),
        Enum(HostPool, native_enum=False, create_constraint=False),
    )
