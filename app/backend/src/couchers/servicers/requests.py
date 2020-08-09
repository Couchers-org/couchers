import logging
import grpc
import datetime
from pb import requests_pb2, requests_pb2_grpc, api_pb2
from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp

from sqlalchemy.sql import or_

from couchers import errors
from couchers.db import is_valid_date, session_scope
from couchers.models import Conversation, HostRequest, HostRequestStatus, Message, User
from couchers.utils import Timestamp_from_datetime

logger = logging.getLogger(__name__)

# TODO: check custom pagination length
PAGINATION_LENGTH = 10


hostingrequeststatus2api = {
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
            
            if request.to_date < datetime.datetime.now().strftime("%Y-%M-%d"):
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
            return empty_pb2.Empty()

    def ListHostRequests(self, request, context):
        with session_scope(self._Session) as session:
            pagination = (request.number if request.number > 0 else PAGINATION_LENGTH)
            query = (session.query(HostRequest, Message, Conversation)
                .join(Message, Message.conversation_id == HostRequest.conversation_id)
                .join(Conversation, Conversation.id == HostRequest.conversation_id)
                .filter(HostRequest.to_user_id == context.user_id)
                .filter(_or(HostRequest.id > request.last_request_id,
                            request.last_request_id == 0))
                .order_by(Message.id.desc())
                .group_by(GroupChatSubscription.group_chat_id)
                .limit(pagination+1))
            
            if request.only_active:
                query = query.filter(_or(HostRequest.status == HostRequestStatus.pending,
                                         HostRequest.status == HostRequestStatus.accepted,
                                         HostRequest.status == HostRequestStatus.confirmed))
                # TODO: This uses the server timezone, how to use users?
                today = datetime.now().strftime("%Y-%M-%d")
                # Is this string comparison a bad idea?
                query = query.filter(HostRequest.to_date <= today)
            
            results = query.all()

            return requests_pb2.ListHostRequestsRes(
                next_request_id=min(map(lambda g: g.HostRequest.id if g.HostRequest else 1, results))-1 if len(results) > 0 else 0, # TODO
                no_more=len(results) <= pagination,
                host_requests=[
                    requests_pb2.HostRequest(
                        host_request_id=result.HostRequest.id,
                        from_user_id=result.HostRequest.from_user_id,
                        to_user_id=result.HostRequest.to_user_id,
                        status=hostrequeststatus2api[result.HostRequest.status],
                        created=Timestamp_from_datetime(result.Conversation.created),
                        from_date=result.HostRequest.from_date,
                        to_date=result.HostRequest.to_date,
                        latest_message=api_pb2.Message(
                            message_id=result.Message.id,
                            author_user_id=result.Message.author_user_id,
                            time=Timestamp_from_datetime(result.Message.time),
                            text=result.Message.text
                        ),
                        conversation_id=result.HostRequest.conversation_id
                    ) for result in results[:pagination]
                ]
            )
