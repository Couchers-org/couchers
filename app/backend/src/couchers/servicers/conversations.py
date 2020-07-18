import logging

from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp

import grpc
from couchers.db import get_friends_status, get_user_by_field, session_scope
from couchers.models import (Message, MessageThread, MessageThreadRole,
                             MessageThreadSubscription,
                             ThreadSubscriptionStatus, User)
from couchers.utils import Timestamp_from_datetime
from pb import api_pb2, conversations_pb2, conversations_pb2_grpc
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, func

logging.basicConfig(format="%(asctime)s.%(msecs)03d: %(process)d: %(message)s",
                    datefmt="%F %T", level=logging.DEBUG)


class Conversations(conversations_pb2_grpc.ConversationsServicer):
    def __init__(self, Session):
        self._Session = Session

    def ListMessageThreads(self, request, context):
        start_index = request.start_index if request.start_index else 0
        with session_scope(self._Session) as session:
            subq1 = session.query(
                                  func.max(Message.timestamp).label("latest_message_timestamp")
                            ).group_by(
                                Message.thread_id
                            ).subquery()
            subq2 = session.query(Message.thread_id, Message.author_id, Message.text, Message.timestamp
                                 ).join(
                                     subq1, Message.timestamp==subq1.c.latest_message_timestamp
                                 ).subquery()
            message_subq = aliased(Message, subq2)
            query = session.query(MessageThread).join(
                MessageThread.messages.of_type(message_subq)
            ).join(
                MessageThread.recipient_subscriptions
            ).filter(
            # TODO: Decide if user-rejected threads should appear or not
                MessageThreadSubscription.user_id==context.user_id
            ).order_by(subq2.c.timestamp.desc())

            query = query.offset(start_index)
            #order is not important for count
            count_query = session.query(MessageThreadSubscription).filter(
                MessageThreadSubscription.user_id==context.user_id
            ).offset(start_index)
            has_more = False if not request.max or count_query.count() <= request.max else True
            if request.max:
                query = query.limit(request.max)
            threads = []
            for thread in query.all():
                subscription_status = None
                for subscription in thread.recipient_subscriptions:
                    if subscription.user_id == context.user_id:
                        if subscription.status == ThreadSubscriptionStatus.accepted:
                            subscription_status = conversations_pb2.MessageThreadStatus.ACCEPTED
                        elif subscription.status == ThreadSubscriptionStatus.pending:
                            subscription_status = conversations_pb2.MessageThreadStatus.PENDING
                        elif subscription.status == ThreadSubscriptionStatus.rejected:
                            subscription_status = conversations_pb2.MessageThreadStatus.REJECTED
                threads.append(conversations_pb2.MessageThreadPreview(
                    thread_id=thread.id,
                    title=thread.title,
                    # TODO: Should recipients actually be a username/photo/displayname combo?
                    recipients=map(lambda e: str(e.user_id),
                                   thread.recipient_subscriptions),
                    is_dm=thread.is_dm,
                    creation_time=Timestamp_from_datetime(thread.creation_time),
                    status=subscription_status,
                    latest_message_preview=thread.messages[0].text,
                    latest_message_sender=thread.messages[0].author.username,
                    latest_message_time=Timestamp_from_datetime(
                        thread.messages[0].timestamp),
                ))
            return conversations_pb2.ListMessageThreadsRes(
                start_index=start_index,
                threads=threads,
                has_more=has_more
            )

    def CreateMessageThread(self, request, context):
        if len(request.recipients) < 1:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "No recipients")
        with session_scope(self._Session) as session:
            thread = MessageThread(
                title=request.title.value,
                creator_id=context.user_id,
                is_dm=True if len(request.recipients) == 1 else False
            )
            session.add(thread)
            session.flush()
            sub = MessageThreadSubscription(
                user_id=context.user_id,
                thread_id=thread.id,
                role=MessageThreadRole.admin,
                status=ThreadSubscriptionStatus.accepted,
                added_by_id=context.user_id
            )
            session.add(sub)
            for recipient in request.recipients:
                r_user = get_user_by_field(session, recipient)
                if not r_user:
                    context.abort(grpc.StatusCode.NOT_FOUND, "No such user.")
                r_id = r_user.id
                sub = MessageThreadSubscription(
                    user_id=r_id,
                    thread_id=thread.id,
                    role=MessageThreadRole.participant,
                    status=(ThreadSubscriptionStatus.accepted
                            if get_friends_status(session, context.user_id, r_id)
                            == api_pb2.User.FriendshipStatus.FRIENDS
                            else ThreadSubscriptionStatus.pending),
                    added_by_id=context.user_id
                )
                session.add(sub)
            session.commit()
            return conversations_pb2.CreateMessageThreadRes(thread_id=thread.id)

    def SendMessage(self, request, context):
        if not request.thread_id or not request.message:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        with session_scope(self._Session) as session:
            if session.query(MessageThread).filter_by(id=request.thread_id).count() < 1:
                context.abort(grpc.StatusCode.NOT_FOUND,
                              "No matching message thread found.")
            session.add(Message(
                thread_id=request.thread_id,
                author_id=context.user_id,
                text=request.message
            ))
            session.commit()
            return empty_pb2.Empty()


    def EditMessageThreadStatus(self, request, context):
        if not request.thread_id or not request.status:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        status = None
        # TODO: Is this the behaviour we want?
        if request.status == conversations_pb2.MessageThreadStatus.PENDING:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Can't set a thread to pending status.")
        elif request.status == conversations_pb2.MessageThreadStatus.ACCEPTED:
            status = ThreadSubscriptionStatus.accepted
        elif request.status == conversations_pb2.MessageThreadStatus.REJECTED:
            status = ThreadSubscriptionStatus.rejected
        else:
            context.abort(grpc.StatusCode.UNIMPLEMENTED, "Unknown thread status.")
        with session_scope(self._Session) as session:
            subscription = session.query(MessageThreadSubscription).filter(
                and_(MessageThreadSubscription.thread_id == request.thread_id,
                     MessageThreadSubscription.user_id == context.user_id)
            ).one_or_none()
            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")
            if subscription.status != ThreadSubscriptionStatus.pending:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Can only set a pending thread status.")
            subscription.status = status
            session.commit()
            return empty_pb2.Empty()
    
    def GetMessageThreadInfo(self, request, context):
        if not request.thread_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        with session_scope(self._Session) as session:
            thread = session.query(MessageThread).join(
                MessageThreadSubscription
            ).filter(
                and_(MessageThread.id == request.thread_id,
                     MessageThread.recipient_subscriptions.any(user_id=context.user_id))
            ).one_or_none()
            if not thread:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")

            status = None
            for sub in thread.recipient_subscriptions:
                if sub.user_id == context.user_id:
                    if sub.status == ThreadSubscriptionStatus.pending:
                        status = conversations_pb2.MessageThreadStatus.PENDING
                    elif sub.status == ThreadSubscriptionStatus.accepted:
                        status = conversations_pb2.MessageThreadStatus.ACCEPTED
                    elif sub.status == ThreadSubscriptionStatus.rejected:
                        status = conversations_pb2.MessageThreadStatus.REJECTED
                    else:
                        context.abort(grpc.StatusCode.UNIMPLEMENTED, "Unknown thread status.")
                    break

            return conversations_pb2.GetMessageThreadInfoRes(
                title=thread.title,
                recipients=map(lambda r: str(r.user_id), thread.recipient_subscriptions),
                admins=[ str(r.user_id) for r in thread.recipient_subscriptions if r is not None ],
                creation_time=Timestamp_from_datetime(thread.creation_time),
                only_admins_invite=thread.only_admins_invite,
                status=status,
                is_dm=thread.is_dm
            )

  
    def GetMessageThread(self, request, context):
        if not request.thread_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        with session_scope(self._Session) as session:
            start_index = 0 if not request.start_index else request.start_index
            thread_subscription = session.query(MessageThreadSubscription).filter(
                MessageThreadSubscription.thread_id==request.thread_id,
                MessageThreadSubscription.user_id==context.user_id
            ).one_or_none()
            if not thread_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")
            # TODO: Is this query efficient? Can it be more efficient?
            query = session.query(Message).join(
                MessageThread
            ).filter(
                Message.thread_id==request.thread_id
            ).order_by(Message.timestamp.desc())
            query = query.offset(start_index)
            count_query = session.query(Message).filter(
                Message.thread_id==request.thread_id
            ).offset(start_index)
            has_more = False if not request.max or count_query.count() <= request.max else True
            if request.max:
                query = query.limit(request.max)
            return conversations_pb2.GetMessageThreadRes(
                start_index=start_index,
                has_more=has_more,
                messages=[
                    conversations_pb2.Message(
                        id=message.id,
                        sender=str(message.author_id),
                        timestamp=Timestamp_from_datetime(message.timestamp),
                        text=message.text
                    ) for message in query.all()
                ]
            )

    def EditMessageThread(self, request, context):
        if not request.thread_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        with session_scope(self._Session) as session:
            thread_subscription = session.query(MessageThreadSubscription).filter(
                and_(MessageThreadSubscription.user_id == context.user_id,
                     MessageThreadSubscription.thread_id == request.thread_id)
            ).one_or_none()
            if not thread_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")
            if thread_subscription.role != MessageThreadRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, "Not an admin for that thread.")
            
            thread = session.query(MessageThread).get(request.thread_id)
            if request.HasField("title"):
                thread.title = request.title.value
            if request.HasField("only_admins_invite"):
                thread.only_admins_invite = request.only_admins_invite.value
            session.commit()

            return empty_pb2.Empty()
  
"""  def MakeMessageThreadAdmin(self, request, context):
    with session_scope(self._Session) as session:
  
  def RemoveMessageThreadAdmin(self, request, context):
    with session_scope(self._Session) as session:
  
  def LeaveMessageThread(self, request, context):
    with session_scope(self._Session) as session:
  
  def InviteToMessageThread(self, request, context):
    with session_scope(self._Session) as session:
  
  def SearchMessages(self, request, context):
    with session_scope(self._Session) as session:"""
