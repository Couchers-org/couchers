from typing import Any

from sqlalchemy import Enum
from sqlalchemy.sql import and_, case, func, or_, select, type_coerce
from sqlalchemy.sql.elements import ColumnElement

from couchers.helpers.completed_profile import has_completed_profile_expression
from couchers.helpers.references import where_references_counted
from couchers.materialized_views import UserResponseRate
from couchers.models import HostingStatus, HostPool, Reference, User

HOST_POOL_NEWBIE_MAX_REFERENCES = 1
HOST_POOL_NEWBIE_MAX_REQUESTS = 5
HOST_POOL_NEWBIE_MIN_RESPONSE96H = 0.66
# once this many requests are counted, at least one of them must have been accepted
HOST_POOL_NEWBIE_REQUESTS_BEFORE_ACCEPTANCE = 3


def newbie_pool_eligible_expression() -> ColumnElement[bool]:
    """
    Whether the hosting history of the User in the enclosing query lets them into the newbie pool.
    """
    # the count shown on the user's profile
    reference_count = where_references_counted(
        select(func.count(Reference.id)).where(Reference.to_user_id == User.id), None
    ).scalar_subquery()

    # nulls (nothing counted yet) don't disqualify
    has_disqualifying_response_rate = (
        select(UserResponseRate.user_id)
        .where(UserResponseRate.user_id == User.id)
        .where(
            or_(
                UserResponseRate.requests96h > HOST_POOL_NEWBIE_MAX_REQUESTS,
                UserResponseRate.response96h < HOST_POOL_NEWBIE_MIN_RESPONSE96H,
                and_(
                    UserResponseRate.requests168h >= HOST_POOL_NEWBIE_REQUESTS_BEFORE_ACCEPTANCE,
                    UserResponseRate.accept168h == 0,
                ),
            )
        )
        .exists()
    )

    return and_(reference_count <= HOST_POOL_NEWBIE_MAX_REFERENCES, ~has_disqualifying_response_rate)


def host_pool_expression() -> ColumnElement[Any]:
    """
    The host pool of the User in the enclosing query.
    """
    # nested so the history subqueries only run for the few users who meet the profile conditions
    return type_coerce(
        case(
            (
                and_(
                    User.hosting_status == HostingStatus.can_host,
                    has_completed_profile_expression(),
                    User.has_completed_my_home,
                ),
                case(
                    (newbie_pool_eligible_expression(), HostPool.newbie.name),
                    else_=HostPool.normal.name,
                ),
            ),
            else_=HostPool.normal.name,
        ),
        Enum(HostPool, native_enum=False, create_constraint=False),
    )
