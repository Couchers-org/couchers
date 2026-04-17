import logging
from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.event_log import log_event
from couchers.helpers.completed_profile import has_completed_profile
from couchers.models import Node, NodeType, User
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


def public_trip_to_pb(
    public_trip: PublicTrip, session: Session, context: CouchersContext
) -> public_trips_pb2.PublicTrip:
    return public_trips_pb2.PublicTrip(
        trip_id=public_trip.id,
        user=user_model_to_pb(public_trip.user, session, context),
        node_id=public_trip.node_id,
        from_date=date_to_api(public_trip.from_date),
        to_date=date_to_api(public_trip.to_date),
        description=public_trip.description,
        status=publictripstatus2api[public_trip.status],
        created=Timestamp_from_datetime(public_trip.created),
    )


class PublicTrips(public_trips_pb2_grpc.PublicTripsServicer):
    def CreatePublicTrip(
        self, request: public_trips_pb2.CreatePublicTripReq, context: CouchersContext, session: Session
    ) -> public_trips_pb2.PublicTrip:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if not has_completed_profile(session, user):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "incomplete_profile_create_public_trip")

        node = session.execute(select(Node).where(Node.id == request.node_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")

        # Disallow world- and macroregion-level communities (too broad for a trip).
        # Region/subregion/locality/sublocality are all acceptable.
        if node.node_type.value < NodeType.region.value:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "community_too_broad_for_public_trip")

        from_date = parse_date(request.from_date)
        to_date = parse_date(request.to_date)

        if not from_date or not to_date:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_date")

        today = today_in_timezone(user.timezone)

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
        public_trip = session.execute(
            where_users_column_visible(select(PublicTrip), context, PublicTrip.user_id).where(
                PublicTrip.id == request.trip_id
            )
        ).scalar_one_or_none()

        if not public_trip:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "public_trip_not_found")

        return public_trip_to_pb(public_trip, session, context)

    def ListPublicTrips(
        self, request: public_trips_pb2.ListPublicTripsReq, context: CouchersContext, session: Session
    ) -> public_trips_pb2.ListPublicTripsRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_page_id = int(request.page_token) if request.page_token else 0

        node = session.execute(select(Node).where(Node.id == request.community_id)).scalar_one_or_none()
        if not node:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")

        statement = (
            where_users_column_visible(select(PublicTrip), context, PublicTrip.user_id)
            .where(PublicTrip.node_id == node.id)
            .where(PublicTrip.status == PublicTripStatus.searching_for_host)
            .where(PublicTrip.to_date >= today())
            .where(or_(PublicTrip.id <= next_page_id, to_bool(next_page_id == 0)))
            .order_by(PublicTrip.id.desc())
            .limit(page_size + 1)
        )
        public_trips = session.execute(statement).scalars().all()

        return public_trips_pb2.ListPublicTripsRes(
            public_trips=[public_trip_to_pb(trip, session, context) for trip in public_trips[:page_size]],
            next_page_token=str(public_trips[-1].id) if len(public_trips) > page_size else None,
        )

    def ListPublicTripsByUser(
        self, request: public_trips_pb2.ListPublicTripsByUserReq, context: CouchersContext, session: Session
    ) -> public_trips_pb2.ListPublicTripsByUserRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_page_id = int(request.page_token) if request.page_token else 0

        is_self = request.user_id == context.user_id

        statement = where_users_column_visible(select(PublicTrip), context, PublicTrip.user_id).where(
            PublicTrip.user_id == request.user_id
        )
        if not is_self:
            # On other users' profiles show only active, upcoming trips
            statement = statement.where(PublicTrip.status == PublicTripStatus.searching_for_host).where(
                PublicTrip.to_date >= today()
            )
        statement = (
            statement.where(or_(PublicTrip.id <= next_page_id, to_bool(next_page_id == 0)))
            .order_by(PublicTrip.id.desc())
            .limit(page_size + 1)
        )
        public_trips = session.execute(statement).scalars().all()

        return public_trips_pb2.ListPublicTripsByUserRes(
            public_trips=[public_trip_to_pb(trip, session, context) for trip in public_trips[:page_size]],
            next_page_token=str(public_trips[-1].id) if len(public_trips) > page_size else None,
        )

    def UpdatePublicTrip(
        self, request: public_trips_pb2.UpdatePublicTripReq, context: CouchersContext, session: Session
    ) -> public_trips_pb2.PublicTrip:
        public_trip = session.execute(select(PublicTrip).where(PublicTrip.id == request.trip_id)).scalar_one_or_none()

        if not public_trip or public_trip.user_id != context.user_id:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "public_trip_not_found")

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        today_local = today_in_timezone(user.timezone)

        # Trip must not already be in the past
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

        new_description = public_trip.description
        if request.HasField("description"):
            if not request.description.strip():
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_public_trip_description")
            if len(request.description) > PUBLIC_TRIP_DESCRIPTION_MAX_LENGTH:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "public_trip_description_too_long")
            new_description = request.description

        public_trip.from_date = new_from_date
        public_trip.to_date = new_to_date
        public_trip.description = new_description

        log_event(
            context,
            session,
            "public_trip.updated",
            {
                "public_trip_id": public_trip.id,
                "from_date": str(new_from_date),
                "to_date": str(new_to_date),
            },
        )

        return public_trip_to_pb(public_trip, session, context)

    def UpdatePublicTripStatus(
        self, request: public_trips_pb2.UpdatePublicTripStatusReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        public_trip = session.execute(select(PublicTrip).where(PublicTrip.id == request.trip_id)).scalar_one_or_none()

        if not public_trip or public_trip.user_id != context.user_id:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "public_trip_not_found")

        new_status = publictripstatus2sql.get(request.status)
        if new_status is None:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_public_trip_status")

        # Only allow closing a trip (can't re-open a closed trip)
        if new_status != PublicTripStatus.closed:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_public_trip_status")

        public_trip.status = new_status

        log_event(
            context,
            session,
            "public_trip.status_updated",
            {
                "public_trip_id": public_trip.id,
                "new_status": new_status.name,
            },
        )

        return empty_pb2.Empty()
