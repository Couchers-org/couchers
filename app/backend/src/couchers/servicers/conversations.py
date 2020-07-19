import logging
from datetime import datetime

from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp

import grpc
from couchers.db import get_friends_status, get_user_by_field, session_scope
from couchers.models import (Conversation, GroupChat, GroupChatRole,
                             GroupChatSubscription, Message, User)
from couchers.utils import Timestamp_from_datetime
from pb import api_pb2, conversations_pb2, conversations_pb2_grpc
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, func, or_

logging.basicConfig(format="%(asctime)s.%(msecs)03d: %(process)d: %(message)s",
                    datefmt="%F %T", level=logging.DEBUG)


# TODO: custom pagination length
PAGINATION_LENGTH = 20


class Conversations(conversations_pb2_grpc.ConversationsServicer):
    def __init__(self, Session):
        self._Session = Session

    def ListGroupChats(self, request, context):
        with session_scope(self._Session) as session:
            results = (session.query(GroupChat, GroupChatSubscription, Message)
                .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == GroupChat.conversation_id)
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(
                    or_(Message.time <= GroupChatSubscription.left,
                        GroupChatSubscription.left == None))
                .filter(
                    or_(Message.id < request.last_message_id,
                        request.last_message_id == 0))
                .order_by(Message.id.desc())
                .group_by(Message.conversation_id)
                .limit(PAGINATION_LENGTH+1)
                .all())

            return conversations_pb2.ListGroupChatsRes(
                group_chats=[
                    conversations_pb2.GroupChat(
                        group_chat_id=result.GroupChat.conversation_id,
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
                next_message_id=min(map(lambda g: g.Message.id, results))-1 if len(results) > 0 else 0, # TODO
                no_more=len(results) <= PAGINATION_LENGTH,
            )

    def GetGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            result = (session.query(Message, GroupChat)
                .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(
                    or_(Message.time <= GroupChatSubscription.left,
                        GroupChatSubscription.left == None))
                .order_by(Message.id.desc())
                .limit(1)
                .one_or_none())

            if not result:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that chat.")

            return conversations_pb2.GroupChat(
                group_chat_id=result.GroupChat.conversation_id,
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
            )

    def GetGroupChatMessages(self, request, context):
        with session_scope(self._Session) as session:
            results = (session.query(Message)
                .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(
                    or_(Message.time <= GroupChatSubscription.left,
                        GroupChatSubscription.left == None))
                .filter(
                    or_(Message.id < request.last_message_id,
                        request.last_message_id == 0))
                .order_by(Message.id.desc())
                .limit(PAGINATION_LENGTH+1)
                .all())

            return conversations_pb2.GetGroupChatMessagesRes(
                messages=[
                    conversations_pb2.Message(
                        message_id=message.id,
                        author_user_id=message.author_id,
                        time=Timestamp_from_datetime(message.time),
                        text=message.text,
                    ) for message in results
                ],
                next_message_id=results[-1].id if len(results) > 0 else 0, # TODO
                no_more=len(results) <= PAGINATION_LENGTH,
            )

    def SearchMessages(self, request, context):
        with session_scope(self._Session) as session:
            results = (session.query(Message)
                .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(
                    or_(Message.time <= GroupChatSubscription.left,
                        GroupChatSubscription.left == None))
                .filter(
                    or_(Message.id < request.last_message_id,
                        request.last_message_id == 0))
                .filter(Message.text.ilike(f"%{request.query}%"))
                .order_by(Message.id.desc())
                .limit(PAGINATION_LENGTH+1)
                .all())

            return conversations_pb2.SearchMessagesRes(
                results=[
                    conversations_pb2.MessageSearchResult(
                        group_chat_id=message.conversation_id,
                        message=conversations_pb2.Message(
                            message_id=message.id,
                            author_user_id=message.author_id,
                            time=Timestamp_from_datetime(message.time),
                            text=message.text,
                        ),
                    ) for message in results
                ],
                next_message_id=results[-1].id if len(results) > 0 else 0, # TODO
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
                group_chat_id=group_chat.conversation_id,
                title=group_chat.title,
                member_user_ids=[sub.user_id for sub in group_chat.subscriptions],
                admin_user_ids=[sub.user_id for sub in group_chat.subscriptions if sub.role == GroupChatRole.admin],
                only_admins_invite=group_chat.only_admins_invite,
                is_dm=group_chat.is_dm,
                created=Timestamp_from_datetime(group_chat.conversation.created),
            )

    def SendMessage(self, request, context):
        if request.text == "":
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Invalid message")

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
        if not request.group_chat_id or not request.status:
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
                and_(GroupChatSubscription.group_chat_id == request.group_chat_id,
                     GroupChatSubscription.user_id == context.user_id)
            ).one_or_none()
            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")
            if subscription.status != GroupChatSubscriptionStatus.pending:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Can only set a pending thread status.")
            subscription.status = status
            session.commit()
            return empty_pb2.Empty()

    def EditGroupChat(self, request, context):
        if not request.group_chat_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        with session_scope(self._Session) as session:
            thread_subscription = session.query(GroupChatSubscription).filter(
                and_(GroupChatSubscription.user_id == context.user_id,
                     GroupChatSubscription.group_chat_id == request.group_chat_id)
            ).one_or_none()
            if not thread_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")
            if thread_subscription.role != GroupChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, "Not an admin for that thread.")
            
            thread = session.query(GroupChat).get(request.group_chat_id)
            if request.HasField("title"):
                thread.title = request.title.value
            if request.HasField("only_admins_invite"):
                thread.only_admins_invite = request.only_admins_invite.value
            session.commit()

            return empty_pb2.Empty()
