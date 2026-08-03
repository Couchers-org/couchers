import logging
from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import exists, select
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import and_, func, or_

from couchers.constants import HOST_REQUEST_DUPLICATE_WINDOW_HOURS, HOST_REQUEST_MIN_LENGTH_UTF16
from couchers.context import CouchersContext, make_notification_user_context
from couchers.db import can_moderate_node
from couchers.event_log import log_event
from couchers.helpers.completed_profile import has_completed_profile
from couchers.helpers.host_requests import HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS
from couchers.helpers.messages import api2hostrequeststatus, hostrequeststatus2api, message_to_pb
from couchers.materialized_views import UserResponseRate
from couchers.metrics import (
    account_age_on_host_request_create_histogram,
    host_request_first_response_histogram,
    host_request_responses_counter,
    host_requests_sent_counter,
    sent_messages_counter,
)
from couchers.models import (
    Conversation,
    HostRequest,
    HostRequestFeedback,
    HostRequestQuality,
    HostRequestStatus,
    Message,
    MessageType,
    ModerationObjectType,
    RateLimitAction,
    User,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.models.public_trips import PublicTrip, PublicTripStatus
from couchers.moderation.utils import create_moderation
from couchers.notifications.notify import mark_notifications_seen, notify
from couchers.proto import (
    messages_pb2,
    notification_data_pb2,
    requests_pb2,
    requests_pb2_grpc,
)
from couchers.rate_limits.check import process_rate_limits_and_check_abort
from couchers.rate_limits.definitions import RATE_LIMIT_HOURS
from couchers.servicers.api import response_rate_to_pb, user_model_to_pb
from couchers.sql import to_bool, users_visible, where_moderated_content_visible, where_users_column_visible
from couchers.utils import (
    Timestamp_from_datetime,
    date_to_api,
    get_coordinates,
    now,
    parse_date,
    today_in_timezone,
)

logger = logging.getLogger(__name__)

DEFAULT_PAGINATION_LENGTH = 10
MAX_PAGE_SIZE = 50


hostrequestquality2sql = {
    requests_pb2.HOST_REQUEST_QUALITY_UNSPECIFIED: HostRequestQuality.high_quality,
    requests_pb2.HOST_REQUEST_QUALITY_LOW: HostRequestQuality.okay_quality,
    requests_pb2.HOST_REQUEST_QUALITY_OKAY: HostRequestQuality.low_quality,
}


def host_request_to_pb(
    host_request: HostRequest, session: Session, context: CouchersContext
) -> requests_pb2.HostRequest:
    initial_message = session.execute(
        select(Message)
        .where(Message.conversation_id == host_request.conversation_id)
        .order_by(Message.id.asc())
        .limit(1)
    ).scalar_one()

    latest_message = session.execute(
        select(Message)
        .where(Message.conversation_id == host_request.conversation_id)
        .order_by(Message.id.desc())
        .limit(1)
    ).scalar_one()

    lat, lng = get_coordinates(host_request.hosting_location)

    need_feedback = False
    if context.user_id == host_request.recipient_user_id and host_request.status == HostRequestStatus.rejected:
        need_feedback = not session.execute(
            select(
                exists().where(
                    HostRequestFeedback.from_user_id == context.user_id,
                    HostRequestFeedback.host_request_id == host_request.conversation_id,
                )
            )
        ).scalar_one()

    return requests_pb2.HostRequest(
        host_request_id=host_request.conversation_id,
        surfer_user_id=host_request.initiator_user_id,
        host_user_id=host_request.recipient_user_id,
        status=hostrequeststatus2api[host_request.status],
        created=Timestamp_from_datetime(initial_message.time),
        from_date=date_to_api(host_request.from_date),
        to_date=date_to_api(host_request.to_date),
        last_seen_message_id=(
            host_request.initiator_last_seen_message_id
            if context.user_id == host_request.initiator_user_id
            else host_request.recipient_last_seen_message_id
        ),
        latest_message=message_to_pb(latest_message),
        hosting_city=host_request.hosting_city,
        hosting_lat=lat,
        hosting_lng=lng,
        hosting_radius=host_request.hosting_radius,
        need_host_request_feedback=need_feedback,
        is_archived=(
            host_request.is_recipient_archived
            if context.user_id == host_request.recipient_user_id
            else host_request.is_initiator_archived
        ),
        public_trip_id=host_request.public_trip_id,
    )


def _possibly_observe_first_response_time(
    session: Session, host_request: HostRequest, user_id: int, response_type: str
) -> None:
    # if this is the first response then there's nothing by this user yet
    assert host_request.recipient_user_id == user_id

    number_messages_by_host = session.execute(
        select(func.count())
        .where(Message.conversation_id == host_request.conversation_id)
        .where(Message.author_id == user_id)
    ).scalar_one_or_none()

    if number_messages_by_host == 0:
        host_gender = session.execute(select(User.gender).where(User.id == host_request.recipient_user_id)).scalar_one()
        surfer_gender = session.execute(
            select(User.gender).where(User.id == host_request.initiator_user_id)
        ).scalar_one()
        host_request_first_response_histogram.labels(host_gender, surfer_gender, response_type).observe(
            (now() - host_request.conversation.created).total_seconds()
        )


def _is_host_request_long_enough(text: str) -> bool:
    # Python's len(str) does not match Javascript's string.length.
    # e.g. len("é") == 2 but "é".length == 1.
    # To match the frontend's validation, measure the string in utf16 code units.
    text_length_utf16 = len(text.encode("utf-16-le")) // 2  # utf-16-le does not include a prefix BOM code unit.
    return text_length_utf16 >= HOST_REQUEST_MIN_LENGTH_UTF16


class Requests(requests_pb2_grpc.RequestsServicer):
    def CreateHostRequest(
        self, request: requests_pb2.CreateHostRequestReq, context: CouchersContext, session: Session
    ) -> requests_pb2.CreateHostRequestRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if not has_completed_profile(session, user):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "incomplete_profile_send_request")

        if request.host_user_id == context.user_id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "cant_request_self")

        # just to check recipient exists and is visible
        recipient = session.execute(
            select(User).where(users_visible(context, User)).where(User.id == request.host_user_id)
        ).scalar_one_or_none()
        if not recipient:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        from_date = parse_date(request.from_date)
        to_date = parse_date(request.to_date)

        if not from_date or not to_date:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_date")

        today = today_in_timezone(recipient.timezone)

        # request starts from the past
        if from_date < today:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_before_today")

        # from_date is not >= to_date
        if from_date >= to_date:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_after_to")

        # No need to check today > to_date

        if from_date - today > timedelta(days=365):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_from_after_one_year")

        if to_date - from_date > timedelta(days=365):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "date_to_after_one_year")

        # Check minimum length
        if not _is_host_request_long_enough(request.text):
            context.abort_with_error_code(
                grpc.StatusCode.INVALID_ARGUMENT,
                "host_request_too_short2",
                substitutions={"count": HOST_REQUEST_MIN_LENGTH_UTF16},
            )

        # Check if user has been sending host requests excessively
        if process_rate_limits_and_check_abort(
            session=session, user_id=context.user_id, action=RateLimitAction.host_request
        ):
            context.abort_with_error_code(
                grpc.StatusCode.RESOURCE_EXHAUSTED,
                "host_request_rate_limit2",
                substitutions={"count": RATE_LIMIT_HOURS},
            )

        # If this is an offer in response to a public trip, validate it
        public_trip_id = request.public_trip_id if request.HasField("public_trip_id") else None

        # Offers on public trips are deduplicated per trip further down instead
        if public_trip_id is None:
            recent_request = session.execute(
                select(HostRequest.conversation_id)
                .join(Conversation, HostRequest.conversation_id == Conversation.id)
                .where(HostRequest.initiator_user_id == context.user_id)
                .where(HostRequest.recipient_user_id == recipient.id)
                .where(HostRequest.public_trip_id == None)
                .where(Conversation.created >= now() - timedelta(hours=HOST_REQUEST_DUPLICATE_WINDOW_HOURS))
                # overlapping nights, so back-to-back stays are still allowed
                .where(HostRequest.from_date < to_date)
                .where(HostRequest.to_date > from_date)
                .limit(1)
            ).scalar_one_or_none()
            if recent_request is not None:
                context.abort_with_error_code(
                    grpc.StatusCode.FAILED_PRECONDITION,
                    "duplicate_host_request",
                    substitutions={"count": HOST_REQUEST_DUPLICATE_WINDOW_HOURS},
                )

        if public_trip_id is not None:
            public_trip = session.execute(
                where_moderated_content_visible(select(PublicTrip), context, PublicTrip, is_list_operation=False).where(
                    PublicTrip.id == public_trip_id
                )
            ).scalar_one_or_none()
            if not public_trip:
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "public_trip_not_found")
            # The trip's traveler must be the recipient of this host request (role reversal)
            if public_trip.user_id != recipient.id:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "public_trip_user_mismatch")
            # Trip must still be active
            if public_trip.status != PublicTripStatus.searching_for_host:
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "public_trip_not_active")
            # Offered dates must fall within the trip's window (host can shorten, not extend)
            if from_date < public_trip.from_date or to_date > public_trip.to_date:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "public_trip_dates_out_of_range")
            # Enforce same_gender_only restriction (community moderators bypass)
            if (
                public_trip.same_gender_only
                and not can_moderate_node(session, context.user_id, public_trip.node_id)
                and user.gender != recipient.gender
            ):
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "public_trip_same_gender_only")
            # Prevent duplicate offers on the same trip
            existing_offer = session.execute(
                select(HostRequest)
                .where(HostRequest.public_trip_id == public_trip_id)
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

        # Create moderation state for UMS (starts as SHADOWED)
        moderation_state = create_moderation(
            session=session,
            object_type=ModerationObjectType.host_request,
            object_id=conversation.id,
            creator_user_id=context.user_id,
        )

        host_request = HostRequest(
            conversation_id=conversation.id,
            initiator_user_id=context.user_id,
            recipient_user_id=recipient.id,
            moderation_state_id=moderation_state.id,
            from_date=from_date,
            to_date=to_date,
            status=HostRequestStatus.pending,
            initiator_last_seen_message_id=message.id,
            # TODO: tz
            # timezone=recipient.timezone,
            hosting_city=recipient.city,
            hosting_location=recipient.geom,
            hosting_radius=recipient.geom_radius,
            public_trip_id=public_trip_id,
        )
        session.add(host_request)
        session.flush()

        recipient_context = make_notification_user_context(user_id=host_request.recipient_user_id)
        notify(
            session,
            user_id=host_request.recipient_user_id,
            topic_action=NotificationTopicAction.host_request__create,
            key=str(host_request.conversation_id),
            data=notification_data_pb2.HostRequestCreate(
                host_request=host_request_to_pb(host_request, session, recipient_context),
                surfer=user_model_to_pb(host_request.initiator, session, recipient_context),
                text=request.text,
            ),
            moderation_state_id=moderation_state.id,
        )

        host_requests_sent_counter.labels(user.gender, recipient.gender).inc()
        sent_messages_counter.labels(user.gender, "host request send").inc()
        account_age_on_host_request_create_histogram.labels(user.gender, recipient.gender).observe(
            (now() - user.joined).total_seconds()
        )
        log_event(
            context,
            session,
            "host_request.created",
            {
                "host_request_id": host_request.conversation_id,
                "host_id": recipient.id,
                "surfer_gender": user.gender,
                "host_gender": recipient.gender,
                "city": recipient.city,
                "from_date": str(from_date),
                "to_date": str(to_date),
                "nights": (to_date - from_date).days,
            },
        )

        return requests_pb2.CreateHostRequestRes(host_request_id=host_request.conversation_id)

    def GetHostRequest(
        self, request: requests_pb2.GetHostRequestReq, context: CouchersContext, session: Session
    ) -> requests_pb2.HostRequest:
        host_request = session.execute(
            where_moderated_content_visible(
                where_users_column_visible(
                    where_users_column_visible(
                        select(HostRequest),
                        context,
                        HostRequest.initiator_user_id,
                    ),
                    context,
                    HostRequest.recipient_user_id,
                ),
                context,
                HostRequest,
                is_list_operation=False,
            )
            .where(HostRequest.conversation_id == request.host_request_id)
            .where(
                or_(HostRequest.initiator_user_id == context.user_id, HostRequest.recipient_user_id == context.user_id)
            )
        ).scalar_one_or_none()

        if not host_request:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        return host_request_to_pb(host_request, session, context)

    # TODO(#7722): remove after FE migrates to ListMessageThreads
    def ListHostRequests(
        self, request: requests_pb2.ListHostRequestsReq, context: CouchersContext, session: Session
    ) -> requests_pb2.ListHostRequestsRes:
        if request.only_sent and request.only_received:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "host_request_sent_or_received")

        pagination = request.number if request.number > 0 else DEFAULT_PAGINATION_LENGTH
        pagination = min(pagination, MAX_PAGE_SIZE)

        # By outer joining messages on itself where the second id is bigger, only the highest IDs will have
        # none as message_2.id. So just filter for these to get the highest messages only.
        # See https://stackoverflow.com/a/27802817/6115336
        message_2 = aliased(Message)
        statement = where_moderated_content_visible(
            where_users_column_visible(
                where_users_column_visible(
                    select(Message, HostRequest, Conversation)
                    .outerjoin(
                        message_2, and_(Message.conversation_id == message_2.conversation_id, Message.id < message_2.id)
                    )
                    .join(HostRequest, HostRequest.conversation_id == Message.conversation_id)
                    .join(Conversation, Conversation.id == HostRequest.conversation_id),
                    context,
                    HostRequest.initiator_user_id,
                ),
                context,
                HostRequest.recipient_user_id,
            ),
            context,
            HostRequest,
            is_list_operation=True,
        ).where(message_2.id == None)

        sort_by_from_date = request.sort_by == requests_pb2.HOST_REQUEST_SORT_BY_FROM_DATE

        if sort_by_from_date:
            if request.page_token:
                token_date_str, token_conv_id_str = request.page_token.split(":")
                token_date = parse_date(token_date_str)
                token_conv_id = int(token_conv_id_str)
                statement = statement.where(
                    or_(
                        HostRequest.from_date > token_date,
                        and_(
                            HostRequest.from_date == token_date,
                            HostRequest.conversation_id > token_conv_id,
                        ),
                    )
                )
        else:
            if request.page_token:
                statement = statement.where(Message.id < int(request.page_token))

        if request.only_sent:
            statement = statement.where(HostRequest.initiator_user_id == context.user_id)
        elif request.only_received:
            statement = statement.where(HostRequest.recipient_user_id == context.user_id)
        elif request.HasField("only_archived"):
            statement = statement.where(
                or_(
                    and_(
                        HostRequest.initiator_user_id == context.user_id,
                        HostRequest.is_initiator_archived == request.only_archived,
                    ),
                    and_(
                        HostRequest.recipient_user_id == context.user_id,
                        HostRequest.is_recipient_archived == request.only_archived,
                    ),
                )
            )
        else:
            statement = statement.where(
                or_(HostRequest.recipient_user_id == context.user_id, HostRequest.initiator_user_id == context.user_id)
            )

        # TODO: I considered having the latest control message be the single source of truth for
        #  the HostRequest.status, but decided against it because of this filter.
        #  Another possibility is to filter in the python instead of SQL, but that's slower
        if request.only_active:
            statement = statement.where(
                or_(
                    HostRequest.status == HostRequestStatus.pending,
                    HostRequest.status == HostRequestStatus.accepted,
                    HostRequest.status == HostRequestStatus.confirmed,
                )
            )
            statement = statement.where(HostRequest.end_time >= func.now())

        if request.status_in:
            statement = statement.where(HostRequest.status.in_([api2hostrequeststatus[s] for s in request.status_in]))

        if sort_by_from_date:
            statement = statement.order_by(HostRequest.from_date.asc(), HostRequest.conversation_id.asc())
        else:
            statement = statement.order_by(Message.id.desc())
        statement = statement.limit(pagination + 1)
        results = session.execute(statement).all()

        host_requests = []
        for result in results[:pagination]:
            lat, lng = get_coordinates(result.HostRequest.hosting_location)
            host_requests.append(
                requests_pb2.HostRequest(
                    host_request_id=result.HostRequest.conversation_id,
                    surfer_user_id=result.HostRequest.initiator_user_id,
                    host_user_id=result.HostRequest.recipient_user_id,
                    status=hostrequeststatus2api[result.HostRequest.status],
                    created=Timestamp_from_datetime(result.Conversation.created),
                    from_date=date_to_api(result.HostRequest.from_date),
                    to_date=date_to_api(result.HostRequest.to_date),
                    last_seen_message_id=(
                        result.HostRequest.initiator_last_seen_message_id
                        if context.user_id == result.HostRequest.initiator_user_id
                        else result.HostRequest.recipient_last_seen_message_id
                    ),
                    latest_message=message_to_pb(result.Message),
                    hosting_city=result.HostRequest.hosting_city,
                    hosting_lat=lat,
                    hosting_lng=lng,
                    hosting_radius=result.HostRequest.hosting_radius,
                )
            )

        no_more = len(results) <= pagination

        if len(results) > pagination:
            if sort_by_from_date:
                last = results[pagination - 1]
                next_page_token = f"{date_to_api(last.HostRequest.from_date)}:{last.HostRequest.conversation_id}"
            else:
                next_page_token = str(min(g.Message.id for g in results[:pagination]))
        else:
            next_page_token = None

        return requests_pb2.ListHostRequestsRes(
            next_page_token=next_page_token, no_more=no_more, host_requests=host_requests
        )

    def RespondHostRequest(
        self, request: requests_pb2.RespondHostRequestReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        def count_host_response(other_user_id: int, response_type: str) -> None:
            user_gender = session.execute(select(User.gender).where(User.id == context.user_id)).scalar_one()
            other_gender = session.execute(select(User.gender).where(User.id == other_user_id)).scalar_one()
            host_request_responses_counter.labels(user_gender, other_gender, response_type).inc()
            sent_messages_counter.labels(user_gender, "host request response").inc()

        host_request = session.execute(
            where_moderated_content_visible(
                where_users_column_visible(
                    where_users_column_visible(
                        select(HostRequest),
                        context,
                        HostRequest.initiator_user_id,
                    ),
                    context,
                    HostRequest.recipient_user_id,
                ),
                context,
                HostRequest,
                is_list_operation=False,
            ).where(HostRequest.conversation_id == request.host_request_id)
        ).scalar_one_or_none()

        if not host_request:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        if host_request.initiator_user_id != context.user_id and host_request.recipient_user_id != context.user_id:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        if request.status == messages_pb2.HOST_REQUEST_STATUS_PENDING:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "invalid_host_request_status")

        if host_request.end_time < now():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "host_request_in_past")

        control_message = Message(
            message_type=MessageType.host_request_status_changed,
            conversation_id=host_request.conversation_id,
            author_id=context.user_id,
        )

        if request.status == messages_pb2.HOST_REQUEST_STATUS_ACCEPTED:
            # only host can accept
            if context.user_id != host_request.recipient_user_id:
                context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "not_the_host")
            # can't accept a cancelled or confirmed request (only reject), or already accepted
            if (
                host_request.status == HostRequestStatus.cancelled
                or host_request.status == HostRequestStatus.confirmed
                or host_request.status == HostRequestStatus.accepted
            ):
                context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "invalid_host_request_status")
            _possibly_observe_first_response_time(session, host_request, context.user_id, "accepted")
            control_message.host_request_status_target = HostRequestStatus.accepted
            host_request.status = HostRequestStatus.accepted
            session.flush()

            recipient_context = make_notification_user_context(user_id=host_request.initiator_user_id)
            notify(
                session,
                user_id=host_request.initiator_user_id,
                topic_action=NotificationTopicAction.host_request__accept,
                key=str(host_request.conversation_id),
                data=notification_data_pb2.HostRequestAccept(
                    host_request=host_request_to_pb(host_request, session, recipient_context),
                    host=user_model_to_pb(host_request.recipient, session, recipient_context),
                ),
                moderation_state_id=host_request.moderation_state_id,
            )

            count_host_response(host_request.initiator_user_id, "accepted")
            log_event(
                context,
                session,
                "host_request.accepted",
                {
                    "host_request_id": host_request.conversation_id,
                    "surfer_id": host_request.initiator_user_id,
                    "host_id": host_request.recipient_user_id,
                    "surfer_gender": host_request.initiator.gender,
                    "host_gender": host_request.recipient.gender,
                    "from_date": str(host_request.from_date),
                    "to_date": str(host_request.to_date),
                    "host_city": host_request.hosting_city,
                },
            )

        if request.status == messages_pb2.HOST_REQUEST_STATUS_REJECTED:
            # only host can reject
            if context.user_id != host_request.recipient_user_id:
                context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "invalid_host_request_status")
            # can't reject a cancelled or already rejected request
            if host_request.status == HostRequestStatus.cancelled or host_request.status == HostRequestStatus.rejected:
                context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "invalid_host_request_status")
            _possibly_observe_first_response_time(session, host_request, context.user_id, "rejected")
            control_message.host_request_status_target = HostRequestStatus.rejected
            host_request.status = HostRequestStatus.rejected
            session.flush()

            recipient_context = make_notification_user_context(user_id=host_request.initiator_user_id)
            notify(
                session,
                user_id=host_request.initiator_user_id,
                topic_action=NotificationTopicAction.host_request__reject,
                key=str(host_request.conversation_id),
                data=notification_data_pb2.HostRequestReject(
                    host_request=host_request_to_pb(host_request, session, recipient_context),
                    host=user_model_to_pb(host_request.recipient, session, recipient_context),
                ),
                moderation_state_id=host_request.moderation_state_id,
            )

            count_host_response(host_request.initiator_user_id, "rejected")

            log_event(
                context,
                session,
                "host_request.rejected",
                {
                    "host_request_id": host_request.conversation_id,
                    "surfer_id": host_request.initiator_user_id,
                    "host_id": host_request.recipient_user_id,
                    "surfer_gender": host_request.initiator.gender,
                    "host_gender": host_request.recipient.gender,
                    "from_date": str(host_request.from_date),
                    "to_date": str(host_request.to_date),
                    "host_city": host_request.hosting_city,
                },
            )

        if request.status == messages_pb2.HOST_REQUEST_STATUS_CONFIRMED:
            # only surfer can confirm
            if context.user_id != host_request.initiator_user_id:
                context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "invalid_host_request_status")
            # can only confirm an accepted request
            if host_request.status != HostRequestStatus.accepted:
                context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "invalid_host_request_status")
            control_message.host_request_status_target = HostRequestStatus.confirmed
            host_request.status = HostRequestStatus.confirmed
            session.flush()

            recipient_context = make_notification_user_context(user_id=host_request.recipient_user_id)
            notify(
                session,
                user_id=host_request.recipient_user_id,
                topic_action=NotificationTopicAction.host_request__confirm,
                key=str(host_request.conversation_id),
                data=notification_data_pb2.HostRequestConfirm(
                    host_request=host_request_to_pb(host_request, session, recipient_context),
                    surfer=user_model_to_pb(host_request.initiator, session, recipient_context),
                ),
                moderation_state_id=host_request.moderation_state_id,
            )

            count_host_response(host_request.recipient_user_id, "confirmed")
            log_event(
                context,
                session,
                "host_request.confirmed",
                {
                    "host_request_id": host_request.conversation_id,
                    "surfer_id": host_request.initiator_user_id,
                    "host_id": host_request.recipient_user_id,
                    "surfer_gender": host_request.initiator.gender,
                    "host_gender": host_request.recipient.gender,
                    "from_date": str(host_request.from_date),
                    "to_date": str(host_request.to_date),
                    "host_city": host_request.hosting_city,
                },
            )

        if request.status == messages_pb2.HOST_REQUEST_STATUS_CANCELLED:
            # only surfer can cancel
            if context.user_id != host_request.initiator_user_id:
                context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "invalid_host_request_status")
            # can't' cancel an already cancelled or rejected request
            if host_request.status == HostRequestStatus.rejected or host_request.status == HostRequestStatus.cancelled:
                context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "invalid_host_request_status")
            control_message.host_request_status_target = HostRequestStatus.cancelled
            host_request.status = HostRequestStatus.cancelled
            session.flush()

            recipient_context = make_notification_user_context(user_id=host_request.recipient_user_id)
            notify(
                session,
                user_id=host_request.recipient_user_id,
                topic_action=NotificationTopicAction.host_request__cancel,
                key=str(host_request.conversation_id),
                data=notification_data_pb2.HostRequestCancel(
                    host_request=host_request_to_pb(host_request, session, recipient_context),
                    surfer=user_model_to_pb(host_request.initiator, session, recipient_context),
                ),
                moderation_state_id=host_request.moderation_state_id,
            )

            count_host_response(host_request.recipient_user_id, "cancelled")
            log_event(
                context,
                session,
                "host_request.cancelled",
                {
                    "host_request_id": host_request.conversation_id,
                    "surfer_id": host_request.initiator_user_id,
                    "host_id": host_request.recipient_user_id,
                    "surfer_gender": host_request.initiator.gender,
                    "host_gender": host_request.recipient.gender,
                    "from_date": str(host_request.from_date),
                    "to_date": str(host_request.to_date),
                    "host_city": host_request.hosting_city,
                },
            )

        session.add(control_message)

        if request.text:
            latest_message = Message(
                conversation_id=host_request.conversation_id,
                text=request.text,
                author_id=context.user_id,
                message_type=MessageType.text,
            )

            session.add(latest_message)
        else:
            latest_message = control_message

        session.flush()

        if host_request.initiator_user_id == context.user_id:
            host_request.initiator_last_seen_message_id = latest_message.id
        else:
            host_request.recipient_last_seen_message_id = latest_message.id
        session.commit()

        return empty_pb2.Empty()

    def GetHostRequestMessages(
        self, request: requests_pb2.GetHostRequestMessagesReq, context: CouchersContext, session: Session
    ) -> requests_pb2.GetHostRequestMessagesRes:
        host_request = session.execute(
            where_moderated_content_visible(select(HostRequest), context, HostRequest, is_list_operation=False).where(
                HostRequest.conversation_id == request.host_request_id
            )
        ).scalar_one_or_none()

        if not host_request:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        if host_request.initiator_user_id != context.user_id and host_request.recipient_user_id != context.user_id:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        pagination = request.number if request.number > 0 else DEFAULT_PAGINATION_LENGTH
        pagination = min(pagination, MAX_PAGE_SIZE)

        messages = (
            session.execute(
                select(Message)
                .where(Message.conversation_id == host_request.conversation_id)
                .where(or_(Message.id < request.last_message_id, to_bool(request.last_message_id == 0)))
                .order_by(Message.id.desc())
                .limit(pagination + 1)
            )
            .scalars()
            .all()
        )

        no_more = len(messages) <= pagination

        last_message_id = min(m.id if m else 1 for m in messages[:pagination]) if len(messages) > 0 else 0

        return requests_pb2.GetHostRequestMessagesRes(
            last_message_id=last_message_id,
            no_more=no_more,
            messages=[message_to_pb(message) for message in messages[:pagination]],
        )

    def SendHostRequestMessage(
        self, request: requests_pb2.SendHostRequestMessageReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if request.text == "":
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_message")
        host_request = session.execute(
            where_moderated_content_visible(select(HostRequest), context, HostRequest, is_list_operation=False).where(
                HostRequest.conversation_id == request.host_request_id
            )
        ).scalar_one_or_none()

        if not host_request:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        if host_request.initiator_user_id != context.user_id and host_request.recipient_user_id != context.user_id:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        if host_request.recipient_user_id == context.user_id:
            _possibly_observe_first_response_time(session, host_request, context.user_id, "message")

        message = Message(
            conversation_id=host_request.conversation_id,
            author_id=context.user_id,
            message_type=MessageType.text,
            text=request.text,
        )

        session.add(message)
        session.flush()

        if host_request.initiator_user_id == context.user_id:
            host_request.initiator_last_seen_message_id = message.id

            recipient_context = make_notification_user_context(user_id=host_request.recipient_user_id)
            notify(
                session,
                user_id=host_request.recipient_user_id,
                topic_action=NotificationTopicAction.host_request__message,
                key=str(host_request.conversation_id),
                data=notification_data_pb2.HostRequestMessage(
                    host_request=host_request_to_pb(host_request, session, recipient_context),
                    user=user_model_to_pb(host_request.initiator, session, recipient_context),
                    text=request.text,
                    am_host=True,
                ),
                moderation_state_id=host_request.moderation_state_id,
            )

        else:
            host_request.recipient_last_seen_message_id = message.id

            recipient_context = make_notification_user_context(user_id=host_request.initiator_user_id)
            notify(
                session,
                user_id=host_request.initiator_user_id,
                topic_action=NotificationTopicAction.host_request__message,
                key=str(host_request.conversation_id),
                data=notification_data_pb2.HostRequestMessage(
                    host_request=host_request_to_pb(host_request, session, recipient_context),
                    user=user_model_to_pb(host_request.recipient, session, recipient_context),
                    text=request.text,
                    am_host=False,
                ),
                moderation_state_id=host_request.moderation_state_id,
            )

        session.commit()

        user_gender = session.execute(select(User.gender).where(User.id == context.user_id)).scalar_one()
        sent_messages_counter.labels(user_gender, "host request").inc()
        log_event(
            context,
            session,
            "host_request.message_sent",
            {
                "host_request_id": host_request.conversation_id,
                "surfer_id": host_request.initiator_user_id,
                "host_id": host_request.recipient_user_id,
                "role": "host" if context.user_id == host_request.recipient_user_id else "surfer",
                "host_city": host_request.hosting_city,
            },
        )

        return empty_pb2.Empty()

    def GetHostRequestUpdates(
        self, request: requests_pb2.GetHostRequestUpdatesReq, context: CouchersContext, session: Session
    ) -> requests_pb2.GetHostRequestUpdatesRes:
        if request.only_sent and request.only_received:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "host_request_sent_or_received")

        if request.newest_message_id == 0:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_message")

        if not session.execute(select(Message).where(Message.id == request.newest_message_id)).scalar_one_or_none():
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_message")

        pagination = request.number if request.number > 0 else DEFAULT_PAGINATION_LENGTH
        pagination = min(pagination, MAX_PAGE_SIZE)

        statement = where_moderated_content_visible(
            select(
                Message,
                HostRequest.status.label("host_request_status"),
                HostRequest.conversation_id.label("host_request_id"),
            )
            .join(HostRequest, HostRequest.conversation_id == Message.conversation_id)
            .where(Message.id > request.newest_message_id),
            context,
            HostRequest,
            is_list_operation=False,
        )

        if request.only_sent:
            statement = statement.where(HostRequest.initiator_user_id == context.user_id)
        elif request.only_received:
            statement = statement.where(HostRequest.recipient_user_id == context.user_id)
        else:
            statement = statement.where(
                or_(HostRequest.recipient_user_id == context.user_id, HostRequest.initiator_user_id == context.user_id)
            )

        statement = statement.order_by(Message.id.asc()).limit(pagination + 1)
        res = session.execute(statement).all()

        no_more = len(res) <= pagination

        last_message_id = min(m.Message.id if m else 1 for m in res[:pagination]) if len(res) > 0 else 0  # TODO

        return requests_pb2.GetHostRequestUpdatesRes(
            no_more=no_more,
            updates=[
                requests_pb2.HostRequestUpdate(
                    host_request_id=result.host_request_id,
                    status=hostrequeststatus2api[result.host_request_status],
                    message=message_to_pb(result.Message),
                )
                for result in res[:pagination]
            ],
        )

    def MarkLastSeenHostRequest(
        self, request: requests_pb2.MarkLastSeenHostRequestReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        host_request = session.execute(
            where_moderated_content_visible(select(HostRequest), context, HostRequest, is_list_operation=False).where(
                HostRequest.conversation_id == request.host_request_id
            )
        ).scalar_one_or_none()

        if not host_request:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        if host_request.initiator_user_id != context.user_id and host_request.recipient_user_id != context.user_id:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        if host_request.initiator_user_id == context.user_id:
            if not host_request.initiator_last_seen_message_id <= request.last_seen_message_id:
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_unsee_messages")
            host_request.initiator_last_seen_message_id = request.last_seen_message_id
        else:
            if not host_request.recipient_last_seen_message_id <= request.last_seen_message_id:
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_unsee_messages")
            host_request.recipient_last_seen_message_id = request.last_seen_message_id

        mark_notifications_seen(
            session,
            user_id=context.user_id,
            topic_actions_and_keys=[
                (HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS, [str(host_request.conversation_id)]),
            ],
        )

        session.commit()
        return empty_pb2.Empty()

    def SetHostRequestArchiveStatus(
        self, request: requests_pb2.SetHostRequestArchiveStatusReq, context: CouchersContext, session: Session
    ) -> requests_pb2.SetHostRequestArchiveStatusRes:
        host_request = session.execute(
            where_moderated_content_visible(select(HostRequest), context, HostRequest, is_list_operation=False)
            .where(HostRequest.conversation_id == request.host_request_id)
            .where(
                or_(HostRequest.initiator_user_id == context.user_id, HostRequest.recipient_user_id == context.user_id)
            )
        ).scalar_one_or_none()

        if not host_request:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        if context.user_id == host_request.initiator_user_id:
            host_request.is_initiator_archived = request.is_archived
        else:
            host_request.is_recipient_archived = request.is_archived

        return requests_pb2.SetHostRequestArchiveStatusRes(
            host_request_id=host_request.conversation_id,
            is_archived=request.is_archived,
        )

    def GetResponseRate(
        self, request: requests_pb2.GetResponseRateReq, context: CouchersContext, session: Session
    ) -> requests_pb2.GetResponseRateRes:
        user_res = session.execute(
            select(User.id, UserResponseRate)
            .outerjoin(UserResponseRate, UserResponseRate.user_id == User.id)
            .where(users_visible(context, User))
            .where(User.id == request.user_id)
        ).one_or_none()

        # if user doesn't exist, return None
        if not user_res:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        user, response_rates = user_res
        return requests_pb2.GetResponseRateRes(**response_rate_to_pb(response_rates))  # type: ignore[arg-type]

    def SendHostRequestFeedback(
        self, request: requests_pb2.SendHostRequestFeedbackReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        host_request = session.execute(
            where_moderated_content_visible(select(HostRequest), context, HostRequest, is_list_operation=False)
            .where(HostRequest.conversation_id == request.host_request_id)
            .where(HostRequest.recipient_user_id == context.user_id)
        ).scalar_one_or_none()

        if not host_request:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "host_request_not_found")

        feedback = session.execute(
            select(HostRequestFeedback)
            .where(HostRequestFeedback.host_request_id == host_request.conversation_id)
            .where(HostRequestFeedback.from_user_id == context.user_id)
        ).scalar_one_or_none()

        if feedback:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "already_left_host_request_feedback")

        session.add(
            HostRequestFeedback(
                host_request_id=host_request.conversation_id,
                from_user_id=host_request.recipient_user_id,
                to_user_id=host_request.initiator_user_id,
                request_quality=hostrequestquality2sql.get(request.host_request_quality),
                decline_reason=request.decline_reason,
            )
        )
        quality = hostrequestquality2sql.get(request.host_request_quality)
        log_event(
            context,
            session,
            "host_request.feedback_submitted",
            {
                "host_request_id": host_request.conversation_id,
                "surfer_id": host_request.initiator_user_id,
                "host_id": host_request.recipient_user_id,
                "request_quality": quality.name if quality else None,
                "has_decline_reason": bool(request.decline_reason),
                "host_city": host_request.hosting_city,
            },
        )

        return empty_pb2.Empty()
