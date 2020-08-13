import logging
import grpc
import datetime
from pb import requests_pb2, requests_pb2_grpc, conversations_pb2
from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp

from sqlalchemy.orm import aliased
from sqlalchemy.sql import or_, and_

from couchers import errors
from couchers.db import is_valid_date, session_scope
from couchers.models import (Conversation, HostRequest, HostRequestEvent, HostRequestEventType,
                             HostRequestStatus, Message, User)
from couchers.utils import Timestamp_from_datetime

logger = logging.getLogger(__name__)

# TODO: check custom pagination length
PAGINATION_LENGTH = 10


hostrequeststatus2api = {
    HostRequestStatus.pending: requests_pb2.HOST_REQUEST_STATUS_PENDING,
    HostRequestStatus.accepted: requests_pb2.HOST_REQUEST_STATUS_ACCEPTED,
    HostRequestStatus.rejected: requests_pb2.HOST_REQUEST_STATUS_REJECTED,
    HostRequestStatus.confirmed: requests_pb2.HOST_REQUEST_STATUS_CONFIRMED,
    HostRequestStatus.cancelled: requests_pb2.HOST_REQUEST_STATUS_CANCELLED
}

hostrequesteventtype2api = {
    HostRequestEventType.created: requests_pb2.HostRequestEvent.HOST_REQUEST_EVENT_TYPE_CREATED,
    HostRequestEventType.status_change_accepted: requests_pb2.HostRequestEvent.HOST_REQUEST_EVENT_TYPE_ACCEPTED,
    HostRequestEventType.status_change_rejected: requests_pb2.HostRequestEvent.HOST_REQUEST_EVENT_TYPE_REJECTED,
    HostRequestEventType.status_change_confirmed: requests_pb2.HostRequestEvent.HOST_REQUEST_EVENT_TYPE_CONFIRMED,
    HostRequestEventType.status_change_cancelled: requests_pb2.HostRequestEvent.HOST_REQUEST_EVENT_TYPE_CANCELLED
}

class Requests(requests_pb2_grpc.RequestsServicer):
    def __init__(self, Session):
        self._Session = Session

    def CreateHostRequest(self, request, context):
        with session_scope(self._Session) as session:
            if request.to_user_id == context.user_id:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_REQUEST_SELF)
            #just to check the host exists
            host = session.query(User).filter(User.id == request.to_user_id).one_or_none()
            if not host:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            
            if not is_valid_date(request.from_date) or not is_valid_date(request.to_date):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_DATE)
            
            if request.from_date > request.to_date:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.DATE_FROM_AFTER_TO)
            
            if request.to_date < datetime.datetime.now().strftime("%Y-%m-%d"):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.DATE_TO_BEFORE_TODAY)
            
            conversation = Conversation()
            session.add(conversation)
            session.flush()

            message = Message()
            message.conversation_id = conversation.id
            message.author_id = context.user_id
            message.text = request.text
            session.add(message)
            session.flush()

            host_request = HostRequest()
            host_request.from_user_id = context.user_id
            host_request.to_user_id = host.id
            host_request.from_date = request.from_date
            host_request.to_date = request.to_date
            host_request.status = HostRequestStatus.pending
            host_request.conversation_id = conversation.id
            host_request.initial_message_id = message.id
            session.add(host_request)
            session.flush()

            host_request_event = HostRequestEvent()
            host_request_event.user_id = context.user_id
            host_request_event.host_request_id = host_request.id
            host_request_event.after_message_id = 0
            host_request_event.event_type = HostRequestEventType.created
            session.add(host_request_event)
            session.commit()

            return requests_pb2.CreateHostRequestRes(
                host_request_id=host_request.id
            )

    def ListHostRequests(self, request, context):
        return self.list_host_requests(False, request, context)

    def ListSentHostRequests(self, request, context):
        return self.list_host_requests(True, request, context)

    def list_host_requests(self, is_sent, request, context):
        with session_scope(self._Session) as session:
            pagination = (request.number if request.number > 0 else PAGINATION_LENGTH)
            
            # By outer joining messages on itself where the second id is bigger, only the highest IDs will have
            # none as message_2.id. So just filter for these ones to get highest messages only.
            # See https://stackoverflow.com/a/27802817/6115336
            message_2 = aliased(Message)
            query = (session.query(Message, HostRequest, Conversation)
                .outerjoin(message_2, and_(Message.conversation_id == message_2.conversation_id, Message.id < message_2.id))
                .join(HostRequest, HostRequest.conversation_id == Message.conversation_id)
                .join(Conversation, Conversation.id == HostRequest.conversation_id)
                .filter(message_2.id == None)
                .filter(or_(HostRequest.id > request.last_request_id,
                            request.last_request_id == 0)))
                
            if is_sent:
                query = query.filter(HostRequest.from_user_id == context.user_id)
            else:
                query = query.filter(HostRequest.to_user_id == context.user_id)
            
            # TODO: I considered having HosTRequestEvent be the single source of truth for
            # the HostRequest.status, but decided agains it because of this filter.
            # Another possibility is to filter in the python instead of SQL, but that's slower
            if request.only_active:
                query = query.filter(or_(HostRequest.status == HostRequestStatus.pending,
                                         HostRequest.status == HostRequestStatus.accepted,
                                         HostRequest.status == HostRequestStatus.confirmed))
                # TODO: This uses the server timezone, how to use users?
                today = datetime.datetime.now().strftime("%Y-%m-%d")
                # Is this string comparison a bad idea?
                query = query.filter(HostRequest.to_date <= today)
            
            
            
            query = (query
                .order_by(Message.id.desc())
                .group_by(Conversation.id)
                .limit(pagination + 1))

            results = query.all()

            host_requests = [
                requests_pb2.HostRequest(
                    host_request_id=result.HostRequest.id,
                    from_user_id=result.HostRequest.from_user_id,
                    to_user_id=result.HostRequest.to_user_id,
                    status=hostrequeststatus2api[result.HostRequest.status],
                    created=Timestamp_from_datetime(result.Conversation.created),
                    from_date=result.HostRequest.from_date,
                    to_date=result.HostRequest.to_date,
                    latest_message=conversations_pb2.Message(
                        message_id=result.Message.id,
                        author_user_id=result.Message.author_id,
                        time=Timestamp_from_datetime(result.Message.time),
                        text=result.Message.text
                    )
                ) for result in results[:pagination]
            ]
            next_request_id = min(map(lambda g: g.HostRequest.id if g.HostRequest else 1, results))-1 if len(results) > 0 else 0 # TODO
            no_more = len(results) <= pagination

            return requests_pb2.ListSentHostRequestsRes(
                next_request_id=next_request_id,
                no_more=no_more,
                host_requests=host_requests
            ) if is_sent else requests_pb2.ListHostRequestsRes(
                next_request_id=next_request_id,
                no_more=no_more,
                host_requests=host_requests
            )

    def RespondHostRequest(self, request, context):
        with session_scope(self._Session) as session:
            host_request = (session.query(HostRequest)
                            .filter(HostRequest.id == request.host_request_id)
                            .one_or_none())
            
            if not host_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)
            
            if (host_request.from_user_id != context.user_id
                        and host_request.to_user_id != context.user_id):
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)
            
            if request.status == requests_pb2.HOST_REQUEST_STATUS_PENDING:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
            
            # TODO: user local time
            today = datetime.datetime.now().strftime("%Y-%m-%d")
            if host_request.to_date < today:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.HOST_REQUEST_IN_PAST)
            
            host_request_event = HostRequestEvent()
            
            if request.status == requests_pb2.HOST_REQUEST_STATUS_ACCEPTED:
                # only host can accept
                if context.user_id != host_request.to_user_id:
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                # can't accept a cancelled or confirmed request (only reject), or already accepted
                if (host_request.status == HostRequestStatus.cancelled or
                            host_request.status == HostRequestStatus.confirmed or 
                            host_request.status == HostRequestStatus.accepted):
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                host_request_event.event_type = HostRequestEventType.status_change_accepted
                host_request.status = HostRequestStatus.accepted
            
            if request.status == requests_pb2.HOST_REQUEST_STATUS_REJECTED:
                # only host can reject
                if context.user_id != host_request.to_user_id:
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                # can't reject a cancelled or already rejected request
                if (host_request.status == HostRequestStatus.cancelled
                        or host_request.status == HostRequestStatus.rejected):
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                host_request_event.event_type = HostRequestEventType.status_change_rejected
                host_request.status = HostRequestStatus.rejected
            
            if request.status == requests_pb2.HOST_REQUEST_STATUS_CONFIRMED:
                # only hostee can confirm
                if context.user_id != host_request.from_user_id:
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                # can only confirm an accepted request
                if host_request.status != HostRequestStatus.accepted:
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                host_request_event.event_type = HostRequestEventType.status_change_confirmed
                host_request.status = HostRequestStatus.confirmed
            
            if request.status == requests_pb2.HOST_REQUEST_STATUS_CANCELLED:
                # only hostee can cancel
                if context.user_id != host_request.from_user_id:
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                # can't' cancel an already cancelled or rejected request
                if (host_request.status == HostRequestStatus.rejected or 
                        host_request.status == HostRequestStatus.cancelled):
                    context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVALID_HOST_REQUEST_STATUS)
                host_request_event.event_type = HostRequestEventType.status_change_cancelled
                host_request.status = HostRequestStatus.cancelled
            
            if request.text:
                latest_message = Message()
                latest_message.conversation_id = host_request.conversation_id
                latest_message.text = request.text
                latest_message.author_id = context.user_id
                session.add(latest_message)
                session.flush()
            else:
                latest_message = (session.query(Message)
                                .filter(Message.conversation_id == host_request.conversation_id)
                                .order_by(Message.id.desc())
                                .limit(1)
                                .one_or_none())
            host_request_event.after_message_id = latest_message.id if latest_message else 0
            host_request_event.host_request_id = host_request.id
            host_request_event.user_id = context.user_id

            session.add(host_request_event)
            session.commit()

            return empty_pb2.Empty()

    def GetHostRequestMessages(self, request, context):
        with session_scope(self._Session) as session:
            host_request = (session.query(HostRequest)
                            .filter(HostRequest.id == request.host_request_id)
                            .one_or_none())
            
            if not host_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)
            
            if (host_request.from_user_id != context.user_id
                        and host_request.to_user_id != context.user_id):
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)
            
            pagination = (request.number if request.number > 0 else PAGINATION_LENGTH)

            messages = (session.query(Message)
                       .filter(Message.conversation_id == host_request.conversation_id)
                       .filter(or_(Message.id < request.last_message_id,
                                   request.last_message_id == 0))
                       .order_by(Message.id.desc())
                       .limit(pagination + 1).all())

            events_query = (session.query(HostRequestEvent)
                      .filter(HostRequestEvent.host_request_id == host_request.id)
                      .filter(HostRequestEvent.after_message_id <= messages[0].id))
            
            no_more = len(messages) <= pagination

            # if there are no more messages, you're at the start so don't exclude after_message_id = 0
            if not no_more:
                # use second last message for lowest index, because we add one for pagination tests
                events_query = events_query.filter(HostRequestEvent.after_message_id >= messages[-2].id)
            
            events = events_query.order_by(HostRequestEvent.id.desc()).all()

            next_message_id = min(
                                  map(lambda m: m.id if m else 1, messages)
                              )-1 if len(messages) > 0 else 0 # TODO
            
            return requests_pb2.GetHostRequestMessagesRes(
                next_message_id=next_message_id,
                no_more=no_more,
                messages=[
                    conversations_pb2.Message(
                        message_id=message.id,
                        author_user_id=message.author_id,
                        time=Timestamp_from_datetime(message.time),
                        text=message.text
                    ) for message in messages[:pagination]
                ],
                events=[
                    requests_pb2.HostRequestEvent(
                        event_type=hostrequesteventtype2api[event.event_type],
                        user_id=event.user_id,
                        after_message_id=event.after_message_id,
                        time=Timestamp_from_datetime(event.time)
                    ) for event in events
                ]
            )
    
    def SendHostRequestMessage(self, request, context):
        with session_scope(self._Session) as session:
            host_request = (session.query(HostRequest)
                            .filter(HostRequest.id == request.host_request_id)
                            .one_or_none())
            
            if not host_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)
            
            if (host_request.from_user_id != context.user_id
                        and host_request.to_user_id != context.user_id):
                context.abort(grpc.StatusCode.NOT_FOUND, errors.HOST_REQUEST_NOT_FOUND)

            # TODO: It is not very user-friendly to prevent messages for confirmed requests
            # but we also don't want people to use requests as normal messages...

            if (host_request.status == HostRequestStatus.rejected or
                        host_request.status == HostRequestStatus.confirmed or
                        host_request.status == HostRequestStatus.cancelled):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.HOST_REQUEST_CLOSED)
            
            message = Message()
            message.conversation_id = host_request.conversation_id
            message.author_id = context.user_id
            message.text = request.text
            session.add(message)
            session.commit()

            return empty_pb2.Empty()
