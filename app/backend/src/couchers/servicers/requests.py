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
from couchers.models import Conversation, HostRequest, HostRequestStatus, Message, User
from couchers.utils import Timestamp_from_datetime

logger = logging.getLogger(__name__)

# TODO: check custom pagination length
PAGINATION_LENGTH = 10


hostrequeststatus2api = {
    HostRequestStatus.pending: requests_pb2.HOST_REQUEST_STATUS_PENDING,
    HostRequestStatus.accepted: requests_pb2.HOST_REQUEST_STATUS_ACCEPTED,
    HostRequestStatus.rejected: requests_pb2.HOST_REQUEST_STATUS_REJECTED,
    HostRequestStatus.confirmed: requests_pb2.HOST_REQUEST_STATUS_CONFIRMED,
    HostRequestStatus.cancelled: requests_pb2.HOST_REQUEST_STATUS_CANCELLED,
}

class Requests(requests_pb2_grpc.RequestsServicer):
    def __init__(self, Session):
        self._Session = Session

    def CreateHostRequest(self, request, context):
        with session_scope(self._Session) as session:
            if request.user_id == context.user_id:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_REQUEST_SELF)
            #just to check the host exists
            host = session.query(User).filter(User.id == request.user_id).one_or_none()
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
            session.commit()
            return requests_pb2.CreateHostRequestRes(
                host_request=requests_pb2.HostRequest(
                    host_request_id=host_request.id,
                    from_user_id=host_request.from_user_id,
                    to_user_id=host_request.to_user_id,
                    status=hostrequeststatus2api[host_request.status],
                    created=Timestamp_from_datetime(host_request.conversation.created),
                    from_date=host_request.from_date,
                    to_date=host_request.to_date,
                    latest_message=conversations_pb2.Message(
                        message_id=message.id,
                        author_user_id=message.author_id,
                        time=Timestamp_from_datetime(message.time),
                        text=message.text
                    ),
                    conversation_id=host_request.conversation_id
                )
            )
    def ListHostRequests(self, request, context):
        return self.list_host_requests(False, request, context)

    def ListSentHostRequests(self, request, context):
        return self.list_host_requests(True, request, context)

    def list_host_requests(self, is_sent, request, context):
        with session_scope(self._Session) as session:
            pagination = (request.number if request.number > 0 else PAGINATION_LENGTH)

            # this was translated from conversations.py but it didn't work...?
            query = (session.query(HostRequest, Message, Conversation)
                .join(Conversation, Conversation.id == HostRequest.conversation_id)
                .outerjoin(Message, Message.conversation_id == HostRequest.conversation_id)
                .filter(or_(HostRequest.id > request.last_request_id,
                            request.last_request_id == 0)))
            
            if is_sent:
                query = query.filter(HostRequest.from_user_id == context.user_id)
            else:
                query = query.filter(HostRequest.to_user_id == context.user_id)
            
            query = (query
                .order_by(Message.id.desc())
                .group_by(Conversation.id)
                .limit(pagination + 1))


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
            
            query = (query
                .order_by(Message.id.desc())
                .group_by(Conversation.id)
                .limit(pagination + 1))
            
            if request.only_active:
                query = query.filter(or_(HostRequest.status == HostRequestStatus.pending,
                                         HostRequest.status == HostRequestStatus.accepted,
                                         HostRequest.status == HostRequestStatus.confirmed))
                # TODO: This uses the server timezone, how to use users?
                today = datetime.now().strftime("%Y-%m-%d")
                # Is this string comparison a bad idea?
                query = query.filter(HostRequest.to_date <= today)
            
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
                    ),
                    conversation_id=result.HostRequest.conversation_id
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
