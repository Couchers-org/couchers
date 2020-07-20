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
                .outerjoin(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(
                    or_(Message.time >= GroupChatSubscription.joined,
                        Message.time == None)) # outer join
                .filter(
                    or_(Message.time <= GroupChatSubscription.left,
                        GroupChatSubscription.left == None,
                        Message.time == None)) # outer join
                .filter(
                    or_(Message.id < request.last_message_id,
                        request.last_message_id == 0,
                        Message.id == None)) # outer join
                .order_by(Message.id.desc())
                .group_by(GroupChatSubscription.group_chat_id)
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
                        unseen_message_count=result.GroupChatSubscription.unseen_message_count,
                        latest_message=conversations_pb2.Message(
                            message_id=result.Message.id,
                            author_user_id=result.Message.author_id,
                            time=Timestamp_from_datetime(result.Message.time),
                            text=result.Message.text,
                        ) if result.Message else None,
                    ) for result in results[:PAGINATION_LENGTH]
                ],
                next_message_id=min(map(lambda g: g.Message.id if g.Message else 1, results))-1 if len(results) > 0 else 0, # TODO
                no_more=len(results) <= PAGINATION_LENGTH,
            )

    def GetGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            result = (session.query(GroupChat, GroupChatSubscription, Message)
                .outerjoin(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(
                    or_(Message.time >= GroupChatSubscription.joined,
                        Message.time == None)) # in case outer join and no messages
                .filter(
                    or_(Message.time <= GroupChatSubscription.left,
                        GroupChatSubscription.left == None,
                        Message.time == None)) # in case outer join and no messages
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
                unseen_message_count=result.GroupChatSubscription.unseen_message_count,
                latest_message=conversations_pb2.Message(
                    message_id=result.Message.id,
                    author_user_id=result.Message.author_id,
                    time=Timestamp_from_datetime(result.Message.time),
                    text=result.Message.text,
                ) if result.Message else None,
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
                .filter(
                    or_(Message.id > GroupChatSubscription.last_seen_message_id,
                        request.only_unseen == 0))
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

    def MarkLastReadGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            subscription = (session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none())

            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that chat.")

            if not subscription.last_seen_message_id <= request.last_seen_message_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Can't unsee messages!")

            subscription.last_seen_message_id = request.last_seen_message_id
            session.commit()

            return empty_pb2.Empty()

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
                if get_friends_status(session, context.user_id, recipient) != api_pb2.User.FriendshipStatus.FRIENDS:
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, "You must be friends with each person you add to a group chat.")

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

    def EditGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            subscription = (session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none())

            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that chat for this user.")

            if subscription.role != GroupChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, "Not an admin for that chat.")

            if request.HasField("title"):
                subscription.group_chat.title = request.title.value

            if request.HasField("only_admins_invite"):
                subscription.group_chat.only_admins_invite = request.only_admins_invite.value

            session.commit()

            return empty_pb2.Empty()

    def MakeGroupChatAdmin(self, request, context):
        with session_scope(self._Session) as session:
            your_subscription = (session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none())

            if not your_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that chat.")

            if request.user_id == context.user_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "You can't do that.")

            if your_subscription.role != GroupChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, "You're not allowed to do that.")

            their_subscription = (session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == request.user_id)
                .filter(GroupChatSubscription.left == None)
                .filter(GroupChatSubscription.role == GroupChatRole.participant)
                .one_or_none())

            if not their_subscription:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "That user isn't a participant in this chat.")

            their_subscription.role = GroupChatRole.admin
            session.commit()

            return empty_pb2.Empty()

    def RemoveGroupChatAdmin(self, request, context):
        with session_scope(self._Session) as session:
            your_subscription = (session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none())

            if not your_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that chat.")

            if request.user_id == context.user_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "You can't do that.")

            if your_subscription.group_chat.creator_id != context.user_id:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, "You're not allowed to do that.")

            their_subscription = (session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == request.user_id)
                .filter(GroupChatSubscription.left == None)
                .filter(GroupChatSubscription.role == GroupChatRole.admin)
                .one_or_none())

            if not their_subscription:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "That user isn't an admin in this chat.")

            their_subscription.role = GroupChatRole.participant
            session.commit()

            return empty_pb2.Empty()

    def InviteToGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            your_subscription = (session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none())

            if not your_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that chat.")

            if request.user_id == context.user_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "You can't do that.")

            if your_subscription.role != GroupChatRole.admin and your_subscription.group_chat.only_admins_invite:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, "You're not allowed to invite users.")

            their_subscription = (session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == request.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none())

            if their_subscription:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "That user is already in the chat.")

            # TODO: race condition!

            if get_friends_status(session, context.user_id, request.user_id) != api_pb2.User.FriendshipStatus.FRIENDS:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "You must be friends with each person you add to a group chat.")

            subscription = GroupChatSubscription(
                user_id=request.user_id,
                group_chat=your_subscription.group_chat,
                role=GroupChatRole.participant,
            )
            session.add(subscription)
            session.commit()

            return empty_pb2.Empty()

    def LeaveGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            subscription = (session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none())

            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that chat.")

            subscription.left = datetime.utcnow()
            session.commit()

            return empty_pb2.Empty()
