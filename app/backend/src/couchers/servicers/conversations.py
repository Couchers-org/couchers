import logging
from datetime import datetime

from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp

import grpc
from couchers.db import get_friends_status, get_user_by_field, session_scope
from couchers.models import (GroupChat, GroupChatRole, GroupChatSubscription,
                             Message, User, Conversation)
from couchers.utils import Timestamp_from_datetime
from pb import api_pb2, conversations_pb2, conversations_pb2_grpc
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, func

logging.basicConfig(format="%(asctime)s.%(msecs)03d: %(process)d: %(message)s",
                    datefmt="%F %T", level=logging.DEBUG)


PAGINATION_LENGTH = 20


class Conversations(conversations_pb2_grpc.ConversationsServicer):
    def __init__(self, Session):
        self._Session = Session

    def ListGroupChats(self, request, context):
        with session_scope(self._Session) as session:
            """
            SELECT t.group_chat_id, messages.*
            FROM (
                SELECT group_chat_subscriptions.group_chat_id as group_chat_id, max(messages.id) as id
                FROM group_chat_subscriptions
                JOIN messsages ON messages.group_chat_id = group_chat_subscriptions.group_chat_id
                WHERE group_chat_subscriptions.user_id = 'xxx'
                GROUP BY messages.group_chat_id
            ) as t
            JOIN messages ON messages.id = t.id;
            """
            # TODO: pagination length

            # TODO(aapeli): filter messages based on subscription times (this is hard)
            sub = (session.query(GroupChatSubscription, func.max(Message.id).label("max_message_id"))
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .group_by(Message.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id))

            if request.last_message_id > 0:
                sub = sub.filter(Message.id < request.last_message_id)

            subquery = sub.subquery()

            results = (session.query(subquery, Message, GroupChat)
                .join(Message, Message.id == subquery.c.max_message_id)
                .join(GroupChat, GroupChat.conversation_id == subquery.c.group_chat_id)
                .limit(PAGINATION_LENGTH+1)
                .all())

            return conversations_pb2.ListGroupChatsRes(
                group_chats=[
                    conversations_pb2.GroupChat(
                        group_chat_id=result.GroupChat.conversation.id,
                        title=result.GroupChat.title,
                        member_user_ids=[sub.user_id for sub in result.GroupChat.subscriptions],
                        admin_user_ids=[sub.user_id for sub in result.GroupChat.subscriptions if sub.role == GroupChatRole.admin],
                        only_admins_invite=result.GroupChat.only_admins_invite,
                        is_dm=result.GroupChat.is_dm,
                        created=Timestamp_from_datetime(result.GroupChat.conversation.created),
                        latest_message=conversations_pb2.Message(
                            message_id=result.Message.id,
                            author_user_id=result.Message.author_id,
                            time=Timestamp_from_datetime(result.Message.time),
                            text=result.Message.text,
                        ),
                    ) for result in results[:PAGINATION_LENGTH]
                ],
                next_message_id=min(map(lambda g: g.max_message_id, results))-1 if len(results) > 0 else 0,
                no_more=len(results) <= PAGINATION_LENGTH,
            )

    def CreateGroupChat(self, request, context):
        if len(request.recipient_ids) < 1:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "No recipients")

        with session_scope(self._Session) as session:
            conversation = Conversation()
            session.add(conversation)

            group_chat = GroupChat(
                conversation=conversation,
                title=request.title.value,
                creator_id=context.user_id,
                is_dm=True if len(request.recipient_ids) == 1 else False, # TODO
            )
            session.add(group_chat)

            subscription = GroupChatSubscription(
                user_id=context.user_id,
                group_chat=group_chat,
                role=GroupChatRole.admin,
            )
            session.add(subscription)

            for recipient in request.recipient_ids:
                subscription = GroupChatSubscription(
                    user_id=recipient,
                    group_chat=group_chat,
                    role=GroupChatRole.participant,
                )
                session.add(subscription)

            session.commit()

            return conversations_pb2.GroupChat(
                group_chat_id=group_chat.conversation.id,
                title=group_chat.title,
                member_user_ids=[sub.user_id for sub in group_chat.subscriptions],
                admin_user_ids=[sub.user_id for sub in group_chat.subscriptions if sub.role == GroupChatRole.admin],
                only_admins_invite=group_chat.only_admins_invite,
                is_dm=group_chat.is_dm,
                created=Timestamp_from_datetime(group_chat.conversation.created),
            )

    def SendMessage(self, request, context):
        if request.group_chat_id == 0 or request.text == "":
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Missing request argument")

        with session_scope(self._Session) as session:
            subscription = (session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none())
            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "No matching group chat found.")
            session.add(Message(
                conversation=subscription.group_chat.conversation,
                author_id=context.user_id,
                text=request.text,
            ))
            session.commit()
            return empty_pb2.Empty()


    def EditGroupChatStatus(self, request, context):
        if not request.thread_id or not request.status:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        status = None
        # TODO: Is this the behaviour we want?
        if request.status == conversations_pb2.GroupChatStatus.PENDING:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Can't set a thread to pending status.")
        elif request.status == conversations_pb2.GroupChatStatus.ACCEPTED:
            status = GroupChatSubscriptionStatus.accepted
        elif request.status == conversations_pb2.GroupChatStatus.REJECTED:
            status = GroupChatSubscriptionStatus.rejected
        else:
            context.abort(grpc.StatusCode.UNIMPLEMENTED, "Unknown thread status.")
        with session_scope(self._Session) as session:
            subscription = session.query(GroupChatSubscription).filter(
                and_(GroupChatSubscription.thread_id == request.thread_id,
                     GroupChatSubscription.user_id == context.user_id)
            ).one_or_none()
            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")
            if subscription.status != GroupChatSubscriptionStatus.pending:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Can only set a pending thread status.")
            subscription.status = status
            session.commit()
            return empty_pb2.Empty()
    
    def GetGroupChatInfo(self, request, context):
        if not request.thread_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        with session_scope(self._Session) as session:
            thread = session.query(GroupChat).join(
                GroupChatSubscription
            ).filter(
                and_(GroupChat.id == request.thread_id,
                     GroupChat.recipient_subscriptions.any(user_id=context.user_id))
            ).one_or_none()
            if not thread:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")

            status = None
            for sub in thread.recipient_subscriptions:
                if sub.user_id == context.user_id:
                    if sub.status == GroupChatSubscriptionStatus.pending:
                        status = conversations_pb2.GroupChatStatus.PENDING
                    elif sub.status == GroupChatSubscriptionStatus.accepted:
                        status = conversations_pb2.GroupChatStatus.ACCEPTED
                    elif sub.status == GroupChatSubscriptionStatus.rejected:
                        status = conversations_pb2.GroupChatStatus.REJECTED
                    else:
                        context.abort(grpc.StatusCode.UNIMPLEMENTED, "Unknown thread status.")
                    break

            return conversations_pb2.GetGroupChatInfoRes(
                title=thread.title,
                recipients=map(lambda r: str(r.user_id), thread.recipient_subscriptions),
                admins=[ str(r.user_id) for r in thread.recipient_subscriptions if r is not None ],
                creation_time=Timestamp_from_datetime(thread.creation_time),
                only_admins_invite=thread.only_admins_invite,
                status=status,
                is_dm=thread.is_dm
            )

  
    def GetGroupChat(self, request, context):
        if not request.thread_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        with session_scope(self._Session) as session:
            start_index = 0 if not request.start_index else request.start_index
            thread_subscription = session.query(GroupChatSubscription).filter(
                GroupChatSubscription.thread_id==request.thread_id,
                GroupChatSubscription.user_id==context.user_id
            ).one_or_none()
            if not thread_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")
            # TODO: Is this query efficient? Can it be more efficient?
            query = session.query(Message).join(
                GroupChat
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
            return conversations_pb2.GetGroupChatRes(
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

    def EditGroupChat(self, request, context):
        if not request.thread_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        with session_scope(self._Session) as session:
            thread_subscription = session.query(GroupChatSubscription).filter(
                and_(GroupChatSubscription.user_id == context.user_id,
                     GroupChatSubscription.thread_id == request.thread_id)
            ).one_or_none()
            if not thread_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")
            if thread_subscription.role != GroupChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, "Not an admin for that thread.")
            
            thread = session.query(GroupChat).get(request.thread_id)
            if request.HasField("title"):
                thread.title = request.title.value
            if request.HasField("only_admins_invite"):
                thread.only_admins_invite = request.only_admins_invite.value
            session.commit()

            return empty_pb2.Empty()
  
"""  def MakeGroupChatAdmin(self, request, context):
    with session_scope(self._Session) as session:
  
  def RemoveGroupChatAdmin(self, request, context):
    with session_scope(self._Session) as session:
  
  def LeaveGroupChat(self, request, context):
    with session_scope(self._Session) as session:
  
  def InviteToGroupChat(self, request, context):
    with session_scope(self._Session) as session:
  
  def SearchMessages(self, request, context):
    with session_scope(self._Session) as session:"""
