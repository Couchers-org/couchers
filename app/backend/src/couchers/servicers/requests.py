import logging
from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, func, or_

from couchers import errors
from couchers.db import session_scope
from couchers.models import Conversation, HostRequest, HostRequestStatus, Message, MessageType, User
from couchers.tasks import (
    send_host_request_accepted_email_to_guest,
    send_host_request_cancelled_email_to_host,
    send_host_request_confirmed_email_to_host,
    send_host_request_rejected_email_to_guest,
    send_new_host_request_email,
)
from couchers.utils import Timestamp_from_datetime, date_to_api, now, parse_date, today_in_timezone
from proto import conversations_pb2, requests_pb2, requests_pb2_grpc

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
            chat_created=conversations_pb2.MessageContentChatCreated()
            if message.message_type == MessageType.chat_created
            else None,
            host_request_status_changed=conversations_pb2.MessageContentHostRequestStatusChanged(
                status=hostrequeststatus2api[message.host_request_status_target]
            )
            if message.message_type == MessageType.host_request_status_changed
            else None,
        )


class Requests(requests_pb2_grpc.RequestsServicer):
    def CreateHostRequest(self, request, context):
        with session_scope() as session:
            if request.to_user_id == context.user_id:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_REQUEST_SELF)

            # just to check host exists and is visible
            host = session.query(User).filter_users(context).filter(User.id == request.to_user_id).one_or_none()
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
                from_user_id=context.user_id,
                to_user_id=host.id,
                from_date=from_date,
                to_date=to_date,
                status=HostRequestStatus.pending,
                from_last_seen_message_id=message.id,
                # TODO: tz
                # timezone=host.timezone,
            )
            session.add(host_request)
            session.flush()

            send_new_host_request_email(host_request)

            return requests_pb2.CreateHostRequestRes(host_request_id=host_request.conversation_id)

    def GetHostRequest(self, request, context):
        with session_scope() as session:
            host_request = (
                session.query(HostRequest)
                .filter_users_column(context, HostRequest.from_user_id)
                .filter_users_column(context, HostRequest.to_user_id)
                .filter(HostRequest.conversation_id == request.host_request_id)
                .filter(or_(HostRequest.from_user_id == context.user_id, HostRequest.to_user_id == context.user_id))
                .one_or_none()
            )

            if not host_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

            initial_message = (
                session.query(Message.time)
                .filter(Message.conversation_id == host_request.conversation_id)
                .order_by(Message.id.asc())
                .limit(1)
                .one()
            )

            latest_message = (
                session.query(Message)
                .filter(Message.conversation_id == host_request.conversation_id)
                .order_by(Message.id.desc())
                .limit(1)
                .one()
            )

            return requests_pb2.HostRequest(
                host_request_id=host_request.conversation_id,
                from_user_id=host_request.from_user_id,
                to_user_id=host_request.to_user_id,
                status=hostrequeststatus2api[host_request.status],
                created=Timestamp_from_datetime(initial_message.time),
                from_date=date_to_api(host_request.from_date),
                to_date=date_to_api(host_request.to_date),
                last_seen_message_id=host_request.from_last_seen_message_id
                if context.user_id == host_request.from_user_id
                else host_request.to_last_seen_message_id,
                latest_message=message_to_pb(latest_message),
            )

    def ListHostRequests(self, request, context):
        if request.only_sent and request.only_received:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.HOST_REQUEST_SENT_OR_RECEIVED)

        with session_scope() as session:
            pagination = request.number if request.number > 0 else DEFAULT_PAGINATION_LENGTH
            pagination = min(pagination, MAX_PAGE_SIZE)

            # By outer joining messages on itself where the second id is bigger, only the highest IDs will have
            # none as message_2.id. So just filter for these ones to get highest messages only.
            # See https://stackoverflow.com/a/27802817/6115336
            message_2 = aliased(Message)
            query = (
                session.query(Message, HostRequest, Conversation)
                .outerjoin(
                    message_2, and_(Message.conversation_id == message_2.conversation_id, Message.id < message_2.id)
                )
                .join(HostRequest, HostRequest.conversation_id == Message.conversation_id)
                .join(Conversation, Conversation.id == HostRequest.conversation_id)
                .filter_users_column(context, HostRequest.from_user_id)
                .filter_users_column(context, HostRequest.to_user_id)
                .filter(message_2.id == None)
                .filter(or_(Message.id < request.last_request_id, request.last_request_id == 0))
            )

            if request.only_sent:
                query = query.filter(HostRequest.from_user_id == context.user_id)
            elif request.only_received:
                query = query.filter(HostRequest.to_user_id == context.user_id)
            else:
                query = query.filter(
                    or_(HostRequest.to_user_id == context.user_id, HostRequest.from_user_id == context.user_id)
                )

            # TODO: I considered having the latest control message be the single source of truth for
            # the HostRequest.status, but decided against it because of this filter.
            # Another possibility is to filter in the python instead of SQL, but that's slower
            if request.only_active:
                query = query.filter(
                    or_(
                        HostRequest.status == HostRequestStatus.pending,
                        HostRequest.status == HostRequestStatus.accepted,
                        HostRequest.status == HostRequestStatus.confirmed,
                    )
                )
                query = query.filter(HostRequest.end_time <= func.now())

            query = query.order_by(Message.id.desc()).limit(pagination + 1)

            results = query.all()

            host_requests = [
                requests_pb2.HostRequest(
                    host_request_id=result.HostRequest.conversation_id,
                    from_user_id=result.HostRequest.from_user_id,
                    to_user_id=result.HostRequest.to_user_id,
                    status=hostrequeststatus2api[result.HostRequest.status],
                    created=Timestamp_from_datetime(result.Conversation.created),
                    from_date=date_to_api(result.HostRequest.from_date),
                    to_date=date_to_api(result.HostRequest.to_date),
                    last_seen_message_id=result.HostRequest.from_last_seen_message_id
                    if context.user_id == result.HostRequest.from_user_id
                    else result.HostRequest.to_last_seen_message_id,
                    latest_message=message_to_pb(result.Message),
                )
                for result in results[:pagination]
            ]
            last_request_id = (
                min(g.Message.id for g in results[:pagination]) if len(results) > pagination else 0
            )  # TODO
            no_more = len(results) <= pagination

            return requests_pb2.ListHostRequestsRes(
                last_request_id=last_request_id, no_more=no_more, host_requests=host_requests
            )

    def RespondHostRequest(self, request, context):
        with session_scope() as session:
            host_request = (
                session.query(HostRequest)
                .filter_users_column(context, HostRequest.from_user_id)
                .filter_users_column(context, HostRequest.to_user_id)
                .filter(HostRequest.conversation_id == request.host_request_id)
                .one_or_none()
            )

            if not host_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

            if host_request.from_user_id != context.user_id and host_request.to_user_id != context.user_id:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

            if request.status == conversations_pb2.HOST_REQUEST_STATUS_PENDING:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)

            if host_request.end_time < now():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.HOST_REQUEST_IN_PAST)

            control_message = Message()

            if request.status == conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED:
                # only host can accept
                if context.user_id != host_request.to_user_id:
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.NOT_THE_HOST)
                # can't accept a cancelled or confirmed request (only reject), or already accepted
                if (
                    host_request.status == HostRequestStatus.cancelled
                    or host_request.status == HostRequestStatus.confirmed
                    or host_request.status == HostRequestStatus.accepted
                ):
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                control_message.host_request_status_target = HostRequestStatus.accepted
                host_request.status = HostRequestStatus.accepted
                send_host_request_accepted_email_to_guest(host_request)

            if request.status == conversations_pb2.HOST_REQUEST_STATUS_REJECTED:
                # only host can reject
                if context.user_id != host_request.to_user_id:
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                # can't reject a cancelled or already rejected request
                if (
                    host_request.status == HostRequestStatus.cancelled
                    or host_request.status == HostRequestStatus.rejected
                ):
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                control_message.host_request_status_target = HostRequestStatus.rejected
                host_request.status = HostRequestStatus.rejected
                send_host_request_rejected_email_to_guest(host_request)

            if request.status == conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED:
                # only hostee can confirm
                if context.user_id != host_request.from_user_id:
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                # can only confirm an accepted request
                if host_request.status != HostRequestStatus.accepted:
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                control_message.host_request_status_target = HostRequestStatus.confirmed
                host_request.status = HostRequestStatus.confirmed
                send_host_request_confirmed_email_to_host(host_request)

            if request.status == conversations_pb2.HOST_REQUEST_STATUS_CANCELLED:
                # only hostee can cancel
                if context.user_id != host_request.from_user_id:
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                # can't' cancel an already cancelled or rejected request
                if (
                    host_request.status == HostRequestStatus.rejected
                    or host_request.status == HostRequestStatus.cancelled
                ):
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                control_message.host_request_status_target = HostRequestStatus.cancelled
                host_request.status = HostRequestStatus.cancelled
                send_host_request_cancelled_email_to_host(host_request)

            control_message.message_type = MessageType.host_request_status_changed
            control_message.conversation_id = host_request.conversation_id
            control_message.author_id = context.user_id
            session.add(control_message)

            if request.text:
                latest_message = Message()
                latest_message.conversation_id = host_request.conversation_id
                latest_message.text = request.text
                latest_message.author_id = context.user_id
                latest_message.message_type = MessageType.text
                session.add(latest_message)
            else:
                latest_message = control_message

            session.flush()

            if host_request.from_user_id == context.user_id:
                host_request.from_last_seen_message_id = latest_message.id
            else:
                host_request.to_last_seen_message_id = latest_message.id
            session.commit()

            return empty_pb2.Empty()

    def GetHostRequestMessages(self, request, context):
        with session_scope() as session:
            host_request = (
                session.query(HostRequest).filter(HostRequest.conversation_id == request.host_request_id).one_or_none()
            )

            if not host_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

            if host_request.from_user_id != context.user_id and host_request.to_user_id != context.user_id:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

            pagination = request.number if request.number > 0 else DEFAULT_PAGINATION_LENGTH
            pagination = min(pagination, MAX_PAGE_SIZE)

            messages = (
                session.query(Message)
                .filter(Message.conversation_id == host_request.conversation_id)
                .filter(or_(Message.id < request.last_message_id, request.last_message_id == 0))
                .order_by(Message.id.desc())
                .limit(pagination + 1)
                .all()
            )

            no_more = len(messages) <= pagination

            last_message_id = min(map(lambda m: m.id if m else 1, messages[:pagination])) if len(messages) > 0 else 0

            return requests_pb2.GetHostRequestMessagesRes(
                last_message_id=last_message_id,
                no_more=no_more,
                messages=[message_to_pb(message) for message in messages[:pagination]],
            )

    def SendHostRequestMessage(self, request, context):
        if request.text == "":
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_MESSAGE)
        with session_scope() as session:
            host_request = (
                session.query(HostRequest).filter(HostRequest.conversation_id == request.host_request_id).one_or_none()
            )

            if not host_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

            if host_request.from_user_id != context.user_id and host_request.to_user_id != context.user_id:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

            if host_request.status == HostRequestStatus.rejected or host_request.status == HostRequestStatus.cancelled:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.HOST_REQUEST_CLOSED)

            if host_request.end_time < now():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.HOST_REQUEST_IN_PAST)

            message = Message()
            message.conversation_id = host_request.conversation_id
            message.author_id = context.user_id
            message.message_type = MessageType.text
            message.text = request.text
            session.add(message)
            session.flush()

            if host_request.from_user_id == context.user_id:
                host_request.from_last_seen_message_id = message.id
            else:
                host_request.to_last_seen_message_id = message.id
            session.commit()

            return empty_pb2.Empty()

    def GetHostRequestUpdates(self, request, context):
        if request.only_sent and request.only_received:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.HOST_REQUEST_SENT_OR_RECEIVED)

        with session_scope() as session:
            if request.newest_message_id == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_MESSAGE)

            newest_message = session.query(Message).filter(Message.id == request.newest_message_id).one_or_none()

            pagination = request.number if request.number > 0 else DEFAULT_PAGINATION_LENGTH
            pagination = min(pagination, MAX_PAGE_SIZE)

            query = (
                session.query(
                    Message,
                    HostRequest.status.label("host_request_status"),
                    HostRequest.conversation_id.label("host_request_id"),
                )
                .join(HostRequest, HostRequest.conversation_id == Message.conversation_id)
                .filter(Message.id > request.newest_message_id)
            )

            if request.only_sent:
                query = query.filter(HostRequest.from_user_id == context.user_id)
            elif request.only_received:
                query = query.filter(HostRequest.to_user_id == context.user_id)
            else:
                query = query.filter(
                    or_(HostRequest.to_user_id == context.user_id, HostRequest.from_user_id == context.user_id)
                )

            query = query.order_by(Message.id.asc()).limit(pagination + 1).all()

            no_more = len(query) <= pagination

            last_message_id = (
                min(map(lambda m: m.Message.id if m else 1, query[:pagination])) if len(query) > 0 else 0
            )  # TODO

            return requests_pb2.GetHostRequestUpdatesRes(
                no_more=no_more,
                updates=[
                    requests_pb2.HostRequestUpdate(
                        host_request_id=result.host_request_id,
                        status=hostrequeststatus2api[result.host_request_status],
                        message=message_to_pb(result.Message),
                    )
                    for result in query[:pagination]
                ],
            )

    def MarkLastSeenHostRequest(self, request, context):
        with session_scope() as session:
            host_request = (
                session.query(HostRequest).filter(HostRequest.conversation_id == request.host_request_id).one_or_none()
            )

            if not host_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

            if host_request.from_user_id != context.user_id and host_request.to_user_id != context.user_id:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

            if host_request.from_user_id == context.user_id:
                if not host_request.from_last_seen_message_id <= request.last_seen_message_id:
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_UNSEE_MESSAGES)
                host_request.from_last_seen_message_id = request.last_seen_message_id
            else:
                if not host_request.to_last_seen_message_id <= request.last_seen_message_id:
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_UNSEE_MESSAGES)
                host_request.to_last_seen_message_id = request.last_seen_message_id

            session.commit()
            return empty_pb2.Empty()
