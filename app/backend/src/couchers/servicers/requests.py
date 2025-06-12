import logging
from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, func, or_

from couchers import errors
from couchers.materialized_views import user_response_rates
from couchers.metrics import (
    account_age_on_host_request_create_histogram,
    host_request_first_response_histogram,
    host_request_responses_counter,
    host_requests_sent_counter,
    sent_messages_counter,
)
from couchers.models import Conversation, HostRequest, HostRequestStatus, Message, MessageType, User
from couchers.notifications.notify import notify
from couchers.servicers.api import response_rate_to_pb, user_model_to_pb
from couchers.sql import couchers_select as select
from couchers.utils import (
    Timestamp_from_datetime,
    date_to_api,
    now,
    parse_date,
    today_in_timezone,
)
from proto import conversations_pb2, notification_data_pb2, requests_pb2, requests_pb2_grpc

logger = logging.getLogger(__name__)

DEFAULT_PAGINATION_LENGTH = 10
MAX_PAGE_SIZE = 50


hostrequeststatus2api = {
    HostRequestStatus.pending: conversations_pb2.HOST_REQUEST_STATUS_PENDING,
    HostRequestStatus.accepted: conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
    HostRequestStatus.rejected: conversations_pb2.HOST_REQUEST_STATUS_REJECTED,
    HostRequestStatus.confirmed: conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED,
    HostRequestStatus.cancelled: conversations_pb2.HOST_REQUEST_STATUS_CANCELLED,
}


def message_to_pb(message: Message):
    """
    Turns the given message to a protocol buffer
    """
    if message.is_normal_message:
        return conversations_pb2.Message(
            message_id=message.id,
            author_user_id=message.author_id,
            time=Timestamp_from_datetime(message.time),
            text=conversations_pb2.MessageContentText(text=message.text),
        )
    else:
        return conversations_pb2.Message(
            message_id=message.id,
            author_user_id=message.author_id,
            time=Timestamp_from_datetime(message.time),
            chat_created=(
                conversations_pb2.MessageContentChatCreated()
                if message.message_type == MessageType.chat_created
                else None
            ),
            host_request_status_changed=(
                conversations_pb2.MessageContentHostRequestStatusChanged(
                    status=hostrequeststatus2api[message.host_request_status_target]
                )
                if message.message_type == MessageType.host_request_status_changed
                else None
            ),
        )


def host_request_to_pb(host_request: HostRequest, session, context):
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

    return requests_pb2.HostRequest(
        host_request_id=host_request.conversation_id,
        surfer_user_id=host_request.surfer_user_id,
        host_user_id=host_request.host_user_id,
        status=hostrequeststatus2api[host_request.status],
        created=Timestamp_from_datetime(initial_message.time),
        from_date=date_to_api(host_request.from_date),
        to_date=date_to_api(host_request.to_date),
        last_seen_message_id=(
            host_request.surfer_last_seen_message_id
            if context.user_id == host_request.surfer_user_id
            else host_request.host_last_seen_message_id
        ),
        latest_message=message_to_pb(latest_message),
    )


def _possibly_observe_first_response_time(session, host_request, user_id, response_type):
    # if this is the first response then there's nothing by this user yet
    assert host_request.host_user_id == user_id

    number_messages_by_host = session.execute(
        select(func.count())
        .where(Message.conversation_id == host_request.conversation_id)
        .where(Message.author_id == user_id)
    ).scalar_one_or_none()

    if number_messages_by_host == 0:
        host_gender = session.execute(select(User.gender).where(User.id == host_request.host_user_id)).scalar_one()
        surfer_gender = session.execute(select(User.gender).where(User.id == host_request.surfer_user_id)).scalar_one()
        host_request_first_response_histogram.labels(host_gender, surfer_gender, response_type).observe(
            (now() - host_request.conversation.created).total_seconds()
        )


class Requests(requests_pb2_grpc.RequestsServicer):
    def CreateHostRequest(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if not user.has_completed_profile:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.INCOMPLETE_PROFILE_SEND_REQUEST)

        if request.host_user_id == context.user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_REQUEST_SELF)

        # just to check host exists and is visible
        host = session.execute(
            select(User).where_users_visible(context).where(User.id == request.host_user_id)
        ).scalar_one_or_none()
        if not host:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        from_date = parse_date(request.from_date)
        to_date = parse_date(request.to_date)

        if not from_date or not to_date:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_DATE)

        today = today_in_timezone(host.timezone)

        # request starts from the past
        if from_date < today:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.DATE_FROM_BEFORE_TODAY)

        # from_date is not >= to_date
        if from_date >= to_date:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.DATE_FROM_AFTER_TO)

        # No need to check today > to_date

        if from_date - today > timedelta(days=365):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.DATE_FROM_AFTER_ONE_YEAR)

        if to_date - from_date > timedelta(days=365):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.DATE_TO_AFTER_ONE_YEAR)

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

        host_request = HostRequest(
            conversation_id=conversation.id,
            surfer_user_id=context.user_id,
            host_user_id=host.id,
            from_date=from_date,
            to_date=to_date,
            status=HostRequestStatus.pending,
            surfer_last_seen_message_id=message.id,
            # TODO: tz
            # timezone=host.timezone,
        )
        session.add(host_request)
        session.commit()

        notify(
            session,
            user_id=host_request.host_user_id,
            topic_action="host_request:create",
            key=host_request.conversation_id,
            data=notification_data_pb2.HostRequestCreate(
                host_request=host_request_to_pb(host_request, session, context),
                surfer=user_model_to_pb(host_request.surfer, session, context),
                text=request.text,
            ),
        )

        host_requests_sent_counter.labels(user.gender, host.gender).inc()
        sent_messages_counter.labels(user.gender, "host request send").inc()
        account_age_on_host_request_create_histogram.labels(user.gender, host.gender).observe(
            (now() - user.joined).total_seconds()
        )

        return requests_pb2.CreateHostRequestRes(host_request_id=host_request.conversation_id)

    def GetHostRequest(self, request, context, session):
        host_request = session.execute(
            select(HostRequest)
            .where_users_column_visible(context, HostRequest.surfer_user_id)
            .where_users_column_visible(context, HostRequest.host_user_id)
            .where(HostRequest.conversation_id == request.host_request_id)
            .where(or_(HostRequest.surfer_user_id == context.user_id, HostRequest.host_user_id == context.user_id))
        ).scalar_one_or_none()

        if not host_request:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

        return host_request_to_pb(host_request, session, context)

    def ListHostRequests(self, request, context, session):
        if request.only_sent and request.only_received:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.HOST_REQUEST_SENT_OR_RECEIVED)

        pagination = request.number if request.number > 0 else DEFAULT_PAGINATION_LENGTH
        pagination = min(pagination, MAX_PAGE_SIZE)

        message_2 = aliased(Message)
        statement = (
            select(Message, HostRequest, Conversation)
            .outerjoin(message_2, and_(Message.conversation_id == message_2.conversation_id, Message.id < message_2.id))
            .join(HostRequest, HostRequest.conversation_id == Message.conversation_id)
            .join(Conversation, Conversation.id == HostRequest.conversation_id)
            .where_users_column_visible(context, HostRequest.surfer_user_id)
            .where_users_column_visible(context, HostRequest.host_user_id)
            .where(message_2.id == None)
            .where(or_(Message.id < request.last_request_id, request.last_request_id == 0))
        )

        if request.only_sent:
            statement = statement.where(HostRequest.surfer_user_id == context.user_id)
        elif request.only_received:
            statement = statement.where(HostRequest.host_user_id == context.user_id)
        elif request.HasField("only_archived"):
            statement = statement.where(
                or_(
                    and_(
                        HostRequest.surfer_user_id == context.user_id,
                        HostRequest.is_user_archived == True,
                    ),
                    and_(
                        HostRequest.host_user_id == context.user_id,
                        HostRequest.is_host_archived == True,
                    ),
                )
            )

        results = session.execute(statement).scalars().all()
        print(f"Query results: {results}")
        return results

    def RespondHostRequest(self, request, context, session):
        def count_host_response(other_user_id, response_type):
