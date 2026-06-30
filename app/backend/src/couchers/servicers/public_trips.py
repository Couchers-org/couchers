import logging
from datetime import date, timedelta

import grpc
from sqlalchemy import ColumnElement, and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from couchers.constants import PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16
from couchers.context import CouchersContext
from couchers.db import can_moderate_node
from couchers.event_log import log_event
from couchers.helpers.completed_profile import has_completed_profile
from couchers.models import Node, User
from couchers.models.host_requests import HostRequest, HostRequestStatus
from couchers.models.public_trips import PublicTrip, PublicTripStatus
from couchers.proto import public_trips_pb2, public_trips_pb2_grpc
from couchers.servicers.api import user_model_to_pb
from couchers.sql import to_bool, where_users_column_visible
from couchers.utils import Timestamp_from_datetime, date_to_api, parse_date, today, today_in_timezone

logger = logging.getLogger(__name__)

MAX_PAGINATION_LENGTH = 25
PUBLIC_TRIP_DESCRIPTION_MAX_LENGTH = 10_000

publictripstatus2api = {
    PublicTripStatus.searching_for_host: public_trips_pb2.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
    PublicTripStatus.closed: public_trips_pb2.PUBLIC_TRIP_STATUS_CLOSED,
}

publictripstatus2sql = {
    public_trips_pb2.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST: PublicTripStatus.searching_for_host,
    public_trips_pb2.PUBLIC_TRIP_STATUS_CLOSED: PublicTripStatus.closed,
}


def _is_description_long_enough(text: str) -> bool:
    # Match Javascript's string.length (utf16 code units) rather than Python's len()
    # so the backend check aligns with the frontend character counter.
    text_length_utf16 = len(text.encode("utf-16-le")) // 2
    return text_length_utf16 >= PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16


def _parse_page_token(page_token: str) -> tuple[date | None, int | None]:
    """Parse a page token into (from_date, trip_id). Returns (None, None) for first page."""
    if not page_token:
        return None, None
    date_str, id_str = page_token.rsplit(":", 1)
    return date.fromisoformat(date_str), int(id_str)


def _same_gender_filter(context: CouchersContext) -> ColumnElement[bool]:
    # Show the trip if same_gender_only is off or the viewer's gender matches the poster's gender.
    # Moderator bypass is handled by callers via can_moderate_node before applying this filter.
    # Uses scalar subqueries rather than extra joins since where_users_column_visible
    # already joins User on PublicTrip.user_id.
    viewer_gender = select(User.gender).where(User.id == context.user_id).scalar_subquery()
    poster_gender = select(User.gender).where(User.id == PublicTrip.user_id).scalar_subquery()
    return or_(~PublicTrip.same_gender_only, poster_gender == viewer_gender)


def public_trip_to_pb(
    public_trip: PublicTrip, session: Session, context: CouchersContext
) -> public_trips_pb2.PublicTrip:
    pb = public_trips_pb2.PublicTrip(
        trip_id=public_trip.id,
        user=user_model_to_pb(public_trip.user, session, context),
        community_id=public_trip.node_id,
        community_slug=public_trip.node.official_cluster.slug,
        community_name=public_trip.node.official_cluster.name,
        from_date=date_to_api(public_trip.from_date),
        to_date=date_to_api(public_trip.to_date),
        description=public_trip.description,
        status=publictripstatus2api[public_trip.status],
        created=Timestamp_from_datetime(public_trip.created),
        same_gender_only=public_trip.same_gender_only,
    )
    if public_trip.user_id == context.user_id:
        pb.offers_count = session.execute(
            select(func.count())
            .select_from(HostRequest)
            .where(HostRequest.public_trip_id == public_trip.id)
            .where(HostRequest.status != HostRequestStatus.cancelled)
        ).scalar_one()
        # Per-status tally of offers, for the trip owner's grouped view.
        counts_by_status: dict[HostRequestStatus, int] = dict(
            session.execute(  # type: ignore[arg-type]
                select(HostRequest.status, func.count())
                .where(HostRequest.public_trip_id == public_trip.id)
                .where(HostRequest.status != HostRequestStatus.cancelled)
                .group_by(HostRequest.status)
            ).all()
        )
        pb.offer_tally.CopyFrom(
            public_trips_pb2.PublicTripOfferTally(
                pending=counts_by_status.get(HostRequestStatus.pending, 0),
                accepted=counts_by_status.get(HostRequestStatus.accepted, 0)
                + counts_by_status.get(HostRequestStatus.confirmed, 0),
                declined=counts_by_status.get(HostRequestStatus.rejected, 0),
            )
        )
    else:
        # The viewer's own existing offer on this trip (if any), so the client can
        # show an "already offered" state and link to the thread.
        pb.viewer_host_request_id = (
            session.execute(
                select(HostRequest.conversation_id)
                .where(HostRequest.public_trip_id == public_trip.id)
                .where(HostRequest.initiator_user_id == context.user_id)
                .where(HostRequest.status != HostRequestStatus.cancelled)
            ).scalar_one_or_none()
            or 0
        )
    return pb


class PublicTrips(public_trips_pb2_grpc.PublicTripsServicer):
    def CreatePublicTrip(
        self, request: public_trips_pb2.CreatePublicTripReq, context: CouchersContext, session: Session
    ) -> public_trips_pb2.PublicTrip:
        if not context.get_boolean_value("public_trips_enabled", False):
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "public_trips_disabled")

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if not has_completed_profile(session, user):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "incomplete_profile_create_public_trip")

        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")

        if not node.official_cluster.small_community_features_enabled:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "public_trips_not_enabled")

        from_date = parse_date(request.from_date)
        to_date = parse_date(request.to_date)

        if not from_date or not to_date:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_date")

        today = today_in_timezone(node.timezone)

        if from_date < today:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_before_today")

        if from_date > to_date:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_after_to")

        if from_date - today > timedelta(days=365):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_after_one_year")

        if to_date - from_date > timedelta(days=365):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_to_after_one_year")

        if not request.description.strip():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_public_trip_description")

        if not _is_description_long_enough(request.description):
            context.abort_with_error_code(
                grpc.StatusCode.INVALID_ARGUMENT,
                "public_trip_description_too_short",
                substitutions={"count": PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16},
            )

        if len(request.description) > PUBLIC_TRIP_DESCRIPTION_MAX_LENGTH:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "public_trip_description_too_long")

        # Disallow overlapping active trips by the same user in the same community
        existing = session.execute(
            select(PublicTrip)
            .where(PublicTrip.user_id == context.user_id)
            .where(PublicTrip.node_id == node.id)
            .where(PublicTrip.status == PublicTripStatus.searching_for_host)
            .where(PublicTrip.to_date >= from_date)
            .where(PublicTrip.from_date <= to_date)
        ).scalar_one_or_none()
        if existing:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "overlapping_public_trip_exists")

        public_trip = PublicTrip(
            user_id=context.user_id,
            node_id=node.id,
            from_date=from_date,
            to_date=to_date,
            description=request.description,
            same_gender_only=request.same_gender_only,
        )
        session.add(public_trip)
        session.flush()

        log_event(
            context,
            session,
            "public_trip.created",
            {
                "public_trip_id": public_trip.id,
                "node_id": node.id,
                "from_date": str(from_date),
                "to_date": str(to_date),
                "nights": (to_date - from_date).days,
            },
        )

        return public_trip_to_pb(public_trip, session, context)

    def GetPublicTrip(
        self, request: public_trips_pb2.GetPublicTripReq, context: CouchersContext, session: Session
    ) -> public_trips_pb2.PublicTrip:
        if not context.get_boolean_value("public_trips_enabled", False):
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "public_trips_disabled")

        trip_node_id = session.execute(
            select(PublicTrip.node_id).where(PublicTrip.id == request.trip_id)
        ).scalar_one_or_none()
        viewer_is_moderator = trip_node_id is not None and can_moderate_node(session, context.user_id, trip_node_id)

        statement = (
            where_users_column_visible(select(PublicTrip), context, PublicTrip.user_id)
            .where(PublicTrip.id == request.trip_id)
            .options(selectinload(PublicTrip.node, Node.official_cluster))
        )
        if not viewer_is_moderator:
            statement = statement.where(_same_gender_filter(context))
        public_trip = session.execute(statement).scalar_one_or_none()

        if not public_trip:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "public_trip_not_found")

        return public_trip_to_pb(public_trip, session, context)

    def ListPublicTrips(
        self, request: public_trips_pb2.ListPublicTripsReq, context: CouchersContext, session: Session
    ) -> public_trips_pb2.ListPublicTripsRes:
        if not context.get_boolean_value("public_trips_enabled", False):
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "public_trips_disabled")

        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_page_id = int(request.page_token) if request.page_token else 0

        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")

        viewer_is_moderator = can_moderate_node(session, context.user_id, node.id)

        statement = (
            where_users_column_visible(select(PublicTrip), context, PublicTrip.user_id)
            .where(PublicTrip.node_id == node.id)
            .where(PublicTrip.status == PublicTripStatus.searching_for_host)
            .where(PublicTrip.to_date >= today())
            .where(or_(PublicTrip.id <= next_page_id, to_bool(next_page_id == 0)))
            .order_by(PublicTrip.id.desc())
            .limit(page_size + 1)
            .options(selectinload(PublicTrip.node, Node.official_cluster))
        )
        if not viewer_is_moderator:
            statement = statement.where(_same_gender_filter(context))
        public_trips = session.execute(statement).scalars().all()

        return public_trips_pb2.ListPublicTripsRes(
            public_trips=[public_trip_to_pb(trip, session, context) for trip in public_trips[:page_size]],
            next_page_token=str(public_trips[-1].id) if len(public_trips) > page_size else None,
        )

    def ListPublicTripsByUser(
        self, request: public_trips_pb2.ListPublicTripsByUserReq, context: CouchersContext, session: Session
    ) -> public_trips_pb2.ListPublicTripsByUserRes:
        if not context.get_boolean_value("public_trips_enabled", False):
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "public_trips_disabled")

        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        cursor_date, cursor_id = _parse_page_token(request.page_token)
        ascending = request.ascending
        is_self = request.user_id == context.user_id

        statement = where_users_column_visible(select(PublicTrip), context, PublicTrip.user_id).where(
            PublicTrip.user_id == request.user_id
        )

        if not is_self:
            # On other users' profiles show only active, upcoming trips that the viewer is allowed to see.
            # Check moderation against each distinct node the user has active trips in.
            active_node_ids = (
                session.execute(
                    select(PublicTrip.node_id)
                    .where(PublicTrip.user_id == request.user_id)
                    .where(PublicTrip.status == PublicTripStatus.searching_for_host)
                    .where(PublicTrip.to_date >= today())
                    .distinct()
                )
                .scalars()
                .all()
            )
            viewer_is_moderator = any(can_moderate_node(session, context.user_id, nid) for nid in active_node_ids)

            statement = statement.where(PublicTrip.status == PublicTripStatus.searching_for_host).where(
                PublicTrip.to_date >= today()
            )
            if not viewer_is_moderator:
                statement = statement.where(_same_gender_filter(context))
        elif request.statuses_in:
            statuses = [publictripstatus2sql[s] for s in request.statuses_in if s in publictripstatus2sql]
            if statuses:
                statement = statement.where(PublicTrip.status.in_(statuses))

        # Cursor-based pagination using (from_date, id) composite key
        if cursor_date is not None and cursor_id is not None:
            if ascending:
                statement = statement.where(
                    or_(
                        PublicTrip.from_date > cursor_date,
                        and_(PublicTrip.from_date == cursor_date, PublicTrip.id > cursor_id),
                    )
                )
            else:
                statement = statement.where(
                    or_(
                        PublicTrip.from_date < cursor_date,
                        and_(PublicTrip.from_date == cursor_date, PublicTrip.id < cursor_id),
                    )
                )
        if ascending:
            statement = statement.order_by(PublicTrip.from_date.asc(), PublicTrip.id.asc())
        else:
            statement = statement.order_by(PublicTrip.from_date.desc(), PublicTrip.id.desc())

        statement = statement.limit(page_size + 1).options(selectinload(PublicTrip.node, Node.official_cluster))
        public_trips = session.execute(statement).scalars().all()

        next_page_token = None
        if len(public_trips) > page_size:
            last = public_trips[page_size - 1]
            next_page_token = f"{last.from_date.isoformat()}:{last.id}"

        return public_trips_pb2.ListPublicTripsByUserRes(
            public_trips=[public_trip_to_pb(trip, session, context) for trip in public_trips[:page_size]],
            next_page_token=next_page_token,
        )

    def UpdatePublicTrip(
        self, request: public_trips_pb2.UpdatePublicTripReq, context: CouchersContext, session: Session
    ) -> public_trips_pb2.PublicTrip:
        if not context.get_boolean_value("public_trips_enabled", False):
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "public_trips_disabled")

        public_trip = session.execute(select(PublicTrip).where(PublicTrip.id == request.trip_id)).scalar_one_or_none()

        if not public_trip or public_trip.user_id != context.user_id:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "public_trip_not_found")

        editing_content = (
            request.HasField("from_date") or request.HasField("to_date") or request.HasField("description")
        )

        if editing_content:
            today_local = today_in_timezone(public_trip.node.timezone)

            if public_trip.to_date < today_local:
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "public_trip_in_past")

            new_from_date = public_trip.from_date
            new_to_date = public_trip.to_date

            if request.HasField("from_date"):
                parsed = parse_date(request.from_date)
                if not parsed:
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_date")
                new_from_date = parsed

            if request.HasField("to_date"):
                parsed = parse_date(request.to_date)
                if not parsed:
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_date")
                new_to_date = parsed

            if new_from_date < today_local:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_before_today")

            if new_from_date > new_to_date:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_after_to")

            if new_from_date - today_local > timedelta(days=365):
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_after_one_year")

            if new_to_date - new_from_date > timedelta(days=365):
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_to_after_one_year")

            if request.HasField("description"):
                if not request.description.strip():
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_public_trip_description")
                if not _is_description_long_enough(request.description):
                    context.abort_with_error_code(
                        grpc.StatusCode.INVALID_ARGUMENT,
                        "public_trip_description_too_short",
                        substitutions={"count": PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16},
                    )
                if len(request.description) > PUBLIC_TRIP_DESCRIPTION_MAX_LENGTH:
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "public_trip_description_too_long")
                public_trip.description = request.description

            public_trip.from_date = new_from_date
            public_trip.to_date = new_to_date

        if request.HasField("same_gender_only"):
            public_trip.same_gender_only = request.same_gender_only

        if request.HasField("status"):
            new_status = publictripstatus2sql.get(request.status)
            if new_status == PublicTripStatus.searching_for_host:
                # Reopening is only allowed if the trip hasn't started yet, matching creation logic.
                today_local = today_in_timezone(public_trip.node.timezone)
                if public_trip.from_date < today_local:
                    context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "public_trip_in_past")
            elif new_status != PublicTripStatus.closed:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_public_trip_status")
            public_trip.status = new_status

        log_event(
            context,
            session,
            "public_trip.updated",
            {
                "public_trip_id": public_trip.id,
                "from_date": str(public_trip.from_date),
                "to_date": str(public_trip.to_date),
                "status": public_trip.status.name,
            },
        )

        return public_trip_to_pb(public_trip, session, context)
