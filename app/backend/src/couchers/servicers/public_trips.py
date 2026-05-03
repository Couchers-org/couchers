import logging
from datetime import timedelta

import grpc
from sqlalchemy import ColumnElement, or_, select
from sqlalchemy.orm import Session, selectinload

from couchers.constants import HOST_REQUEST_MIN_LENGTH_UTF16, PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16
from couchers.context import CouchersContext
from couchers.db import can_moderate_node
from couchers.event_log import log_event
from couchers.helpers.completed_profile import has_completed_profile
from couchers.models import (
    Conversation,
    HostRequest,
    HostRequestStatus,
    Message,
    MessageType,
    ModerationObjectType,
    Node,
    RateLimitAction,
    User,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.models.public_trips import PublicTrip, PublicTripStatus
from couchers.moderation.utils import create_moderation
from couchers.notifications.notify import notify
from couchers.proto import notification_data_pb2, public_trips_pb2, public_trips_pb2_grpc
from couchers.rate_limits.check import process_rate_limits_and_check_abort
from couchers.rate_limits.definitions import RATE_LIMIT_HOURS
from couchers.servicers.api import user_model_to_pb
from couchers.servicers.requests import _is_host_request_long_enough, host_request_to_pb
from couchers.sql import to_bool, users_visible, where_users_column_visible
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
    return public_trips_pb2.PublicTrip(
        trip_id=public_trip.id,
        user=user_model_to_pb(public_trip.user, session, context),
        node_id=public_trip.node_id,
        node_slug=public_trip.node.official_cluster.slug,
        from_date=date_to_api(public_trip.from_date),
        to_date=date_to_api(public_trip.to_date),
        description=public_trip.description,
        status=publictripstatus2api[public_trip.status],
        created=Timestamp_from_datetime(public_trip.created),
        same_gender_only=public_trip.same_gender_only,
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
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_page_id = int(request.page_token) if request.page_token else 0

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
        statement = (
            statement.where(or_(PublicTrip.id <= next_page_id, to_bool(next_page_id == 0)))
            .order_by(PublicTrip.id.desc())
            .limit(page_size + 1)
            .options(selectinload(PublicTrip.node, Node.official_cluster))
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

    def OfferToHost(
        self, request: public_trips_pb2.OfferToHostReq, context: CouchersContext, session: Session
    ) -> public_trips_pb2.OfferToHostRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if not has_completed_profile(session, user):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "incomplete_profile_offer_to_host")

        public_trip = session.execute(select(PublicTrip).where(PublicTrip.id == request.trip_id)).scalar_one_or_none()
        if not public_trip:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "public_trip_not_found")

        if public_trip.user_id == context.user_id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "cant_offer_self")

        if public_trip.status != PublicTripStatus.searching_for_host:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "public_trip_not_active")

        # The trip owner becomes the host request recipient (the surfer). Make sure they're visible.
        surfer = session.execute(
            select(User).where(users_visible(context, User)).where(User.id == public_trip.user_id)
        ).scalar_one_or_none()
        if not surfer:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        # Same-gender restriction (community moderators bypass)
        if (
            public_trip.same_gender_only
            and not can_moderate_node(session, context.user_id, public_trip.node_id)
            and user.gender != surfer.gender
        ):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "public_trip_same_gender_only")

        from_date = parse_date(request.from_date)
        to_date = parse_date(request.to_date)

        if not from_date or not to_date:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_date")

        # The stay happens at the host's place, so use their timezone for "today".
        today_local = today_in_timezone(user.timezone)

        if from_date < today_local:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_before_today")

        if from_date >= to_date:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_after_to")

        # Offered dates must lie within the trip's window (host can shorten, not extend)
        if from_date < public_trip.from_date or to_date > public_trip.to_date:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "public_trip_dates_out_of_range")

        if not _is_host_request_long_enough(request.text):
            context.abort_with_error_code(
                grpc.StatusCode.INVALID_ARGUMENT,
                "host_request_too_short2",
                substitutions={"count": HOST_REQUEST_MIN_LENGTH_UTF16},
            )

        if process_rate_limits_and_check_abort(
            session=session, user_id=context.user_id, action=RateLimitAction.host_request
        ):
            context.abort_with_error_code(
                grpc.StatusCode.RESOURCE_EXHAUSTED,
                "host_request_rate_limit2",
                substitutions={"count": RATE_LIMIT_HOURS},
            )

        # Prevent duplicate offers from the same host on the same trip
        existing_offer = session.execute(
            select(HostRequest)
            .where(HostRequest.public_trip_id == public_trip.id)
            .where(HostRequest.initiator_user_id == context.user_id)
        ).scalar_one_or_none()
        if existing_offer:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "duplicate_host_request_for_trip")

        conversation = Conversation()
        session.add(conversation)
        session.flush()

        session.add(
            Message(
                conversation_id=conversation.id,
                author_id=context.user_id,
                message_type=MessageType.chat_created,
            )
        )

        message = Message(
            conversation_id=conversation.id,
            author_id=context.user_id,
            text=request.text,
            message_type=MessageType.text,
        )
        session.add(message)
        session.flush()

        moderation_state = create_moderation(
            session=session,
            object_type=ModerationObjectType.host_request,
            object_id=conversation.id,
            creator_user_id=context.user_id,
        )

        host_request = HostRequest(
            conversation_id=conversation.id,
            initiator_user_id=context.user_id,
            recipient_user_id=surfer.id,
            moderation_state_id=moderation_state.id,
            from_date=from_date,
            to_date=to_date,
            status=HostRequestStatus.pending,
            initiator_last_seen_message_id=message.id,
            # Hosting location is the offering host's place (initiator), not the surfer's.
            hosting_city=user.city,
            hosting_location=user.geom,
            hosting_radius=user.geom_radius,
            public_trip_id=public_trip.id,
        )
        session.add(host_request)
        session.flush()

        notify(
            session,
            user_id=surfer.id,
            topic_action=NotificationTopicAction.host_request__offer_to_host,
            key=str(host_request.conversation_id),
            data=notification_data_pb2.HostRequestOfferToHost(
                host_request=host_request_to_pb(host_request, session, context),
                host=user_model_to_pb(user, session, context),
                text=request.text,
            ),
            moderation_state_id=moderation_state.id,
        )

        log_event(
            context,
            session,
            "public_trip.offer_to_host_created",
            {
                "host_request_id": host_request.conversation_id,
                "public_trip_id": public_trip.id,
                "surfer_id": surfer.id,
                "host_id": user.id,
                "from_date": str(from_date),
                "to_date": str(to_date),
                "nights": (to_date - from_date).days,
            },
        )

        return public_trips_pb2.OfferToHostRes(host_request_id=host_request.conversation_id)
