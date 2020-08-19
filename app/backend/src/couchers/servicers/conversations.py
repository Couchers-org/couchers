import logging
from datetime import datetime

import grpc
from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, func, or_

from couchers import errors
from couchers.db import get_friends_status, get_user_by_field, session_scope
from couchers.models import Conversation, GroupChat, GroupChatRole, GroupChatSubscription, Message, User
from couchers.utils import Timestamp_from_datetime
from pb import api_pb2, conversations_pb2, conversations_pb2_grpc

# TODO: custom pagination length
PAGINATION_LENGTH = 20


class Conversations(conversations_pb2_grpc.ConversationsServicer):
    def __init__(self, Session):
        self._Session = Session

    def ListGroupChats(self, request, context):
        with session_scope(self._Session) as session:
            # select group chats where you have a subscription, and for each of
            # these, the latest message from them

            t = (session.query(
                    GroupChatSubscription.group_chat_id.label("group_chat_id"),
                    func.max(GroupChatSubscription.id).label("group_chat_subscriptions_id"),
                    func.max(Message.id).label("message_id"))
                .outerjoin(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(or_(Message.time >= GroupChatSubscription.joined, Message.time == None))  # outer join
                .filter(
                    or_(
                        Message.time <= GroupChatSubscription.left,
                        GroupChatSubscription.left == None,
                        Message.time == None,
                    )
                )  # outer join
                .filter(
                    or_(Message.id < request.last_message_id, request.last_message_id == 0, Message.id == None)
                )  # outer join
                .group_by(GroupChatSubscription.group_chat_id)
                .order_by(func.max(Message.id).desc())
                .limit(PAGINATION_LENGTH+1)
                .subquery())

            results = (session.query(t, GroupChat, GroupChatSubscription, Message)
                .outerjoin(Message, Message.id == t.c.message_id)
                .join(GroupChatSubscription, GroupChatSubscription.id == t.c.group_chat_subscriptions_id)
                .join(GroupChat, GroupChat.conversation_id == t.c.group_chat_id)
                .all())

            return conversations_pb2.ListGroupChatsRes(
                group_chats=[
                    conversations_pb2.GroupChat(
                        group_chat_id=result.GroupChat.conversation_id,
                        title=result.GroupChat.title,  # TODO: proper title for DMs, etc
                        member_user_ids=[sub.user_id for sub in result.GroupChat.subscriptions],
                        admin_user_ids=[
                            sub.user_id for sub in result.GroupChat.subscriptions if sub.role == GroupChatRole.admin
                        ],
                        only_admins_invite=result.GroupChat.only_admins_invite,
                        is_dm=result.GroupChat.is_dm,
                        created=Timestamp_from_datetime(result.GroupChat.conversation.created),
                        unseen_message_count=result.GroupChatSubscription.unseen_message_count,
                        last_seen_message_id=result.GroupChatSubscription.last_seen_message_id,
                        latest_message=conversations_pb2.Message(
                            message_id=result.Message.id,
                            author_user_id=result.Message.author_id,
                            time=Timestamp_from_datetime(result.Message.time),
                            text=result.Message.text,
                        )
                        if result.Message
                        else None,
                    )
                    for result in results[:PAGINATION_LENGTH]
                ],
                next_message_id=min(map(lambda g: g.Message.id if g.Message else 1, results)) - 1
                if len(results) > 0
                else 0,  # TODO
                no_more=len(results) <= PAGINATION_LENGTH,
            )

    def GetGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            result = (
                session.query(GroupChat, GroupChatSubscription, Message)
                .outerjoin(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(
                    or_(Message.time >= GroupChatSubscription.joined, Message.time == None)
                )  # in case outer join and no messages
                .filter(
                    or_(
                        Message.time <= GroupChatSubscription.left,
                        GroupChatSubscription.left == None,
                        Message.time == None,
                    )
                )  # in case outer join and no messages
                .order_by(Message.id.desc())
                .limit(1)
                .one_or_none()
            )

            if not result:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            return conversations_pb2.GroupChat(
                group_chat_id=result.GroupChat.conversation_id,
                title=result.GroupChat.title,
                member_user_ids=[sub.user_id for sub in result.GroupChat.subscriptions],
                admin_user_ids=[
                    sub.user_id for sub in result.GroupChat.subscriptions if sub.role == GroupChatRole.admin
                ],
                only_admins_invite=result.GroupChat.only_admins_invite,
                is_dm=result.GroupChat.is_dm,
                created=Timestamp_from_datetime(result.GroupChat.conversation.created),
                unseen_message_count=result.GroupChatSubscription.unseen_message_count,
                last_seen_message_id=result.GroupChatSubscription.last_seen_message_id,
                latest_message=conversations_pb2.Message(
                    message_id=result.Message.id,
                    author_user_id=result.Message.author_id,
                    time=Timestamp_from_datetime(result.Message.time),
                    text=result.Message.text,
                )
                if result.Message
                else None,
            )

    def GetDirectMessage(self, request, context):
        with session_scope(self._Session) as session:
            count = func.count(GroupChatSubscription.id).label("count")
            subquery = (
                session.query(GroupChatSubscription.group_chat_id)
                .filter(
                    or_(
                        GroupChatSubscription.user_id == context.user_id,
                        GroupChatSubscription.user_id == request.user_id,
                    )
                )
                .filter(GroupChatSubscription.left == None)
                .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChat.is_dm == True)
                .group_by(GroupChatSubscription.group_chat_id)
                .having(count == 2)
                .subquery()
            )

            result = (
                session.query(subquery, GroupChat, GroupChatSubscription, Message)
                .join(subquery, subquery.c.group_chat_id == GroupChat.conversation_id)
                .outerjoin(Message, Message.conversation_id == GroupChat.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.group_chat_id == GroupChat.conversation_id)
                .filter(
                    or_(Message.time >= GroupChatSubscription.joined, Message.time == None)
                )  # in case outer join and no messages
                .filter(
                    or_(
                        Message.time <= GroupChatSubscription.left,
                        GroupChatSubscription.left == None,
                        Message.time == None,
                    )
                )  # in case outer join and no messages
                .order_by(Message.id.desc())
                .limit(1)
                .one_or_none()
            )

            if not result:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that chat.")

            return conversations_pb2.GroupChat(
                group_chat_id=result.GroupChat.conversation_id,
                title=result.GroupChat.title,
                member_user_ids=[sub.user_id for sub in result.GroupChat.subscriptions],
                admin_user_ids=[
                    sub.user_id for sub in result.GroupChat.subscriptions if sub.role == GroupChatRole.admin
                ],
                only_admins_invite=result.GroupChat.only_admins_invite,
                is_dm=result.GroupChat.is_dm,
                created=Timestamp_from_datetime(result.GroupChat.conversation.created),
                unseen_message_count=result.GroupChatSubscription.unseen_message_count,
                last_seen_message_id=result.GroupChatSubscription.last_seen_message_id,
                latest_message=conversations_pb2.Message(
                    message_id=result.Message.id,
                    author_user_id=result.Message.author_id,
                    time=Timestamp_from_datetime(result.Message.time),
                    text=result.Message.text,
                )
                if result.Message
                else None,
            )

    def GetUpdates(self, request, context):
        with session_scope(self._Session) as session:
            results = (
                session.query(Message)
                .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .filter(Message.id > request.newest_message_id)
                .order_by(Message.id.asc())
                .limit(PAGINATION_LENGTH + 1)
                .all()
            )

            return conversations_pb2.GetUpdatesRes(
                updates=[
                    conversations_pb2.Update(
                        group_chat_id=message.conversation_id,
                        message=conversations_pb2.Message(
                            message_id=message.id,
                            author_user_id=message.author_id,
                            time=Timestamp_from_datetime(message.time),
                            text=message.text,
                        ),
                    )
                    for message in sorted(results, key=lambda message: message.id)[:PAGINATION_LENGTH]
                ],
                no_more=len(results) <= PAGINATION_LENGTH,
            )

    def GetGroupChatMessages(self, request, context):
        with session_scope(self._Session) as session:
            results = (
                session.query(Message)
                .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .filter(or_(Message.id < request.last_message_id, request.last_message_id == 0))
                .filter(or_(Message.id > GroupChatSubscription.last_seen_message_id, request.only_unseen == 0))
                .order_by(Message.id.desc())
                .limit(PAGINATION_LENGTH + 1)
                .all()
            )

            return conversations_pb2.GetGroupChatMessagesRes(
                messages=[
                    conversations_pb2.Message(
                        message_id=message.id,
                        author_user_id=message.author_id,
                        time=Timestamp_from_datetime(message.time),
                        text=message.text,
                    )
                    for message in results[:PAGINATION_LENGTH]
                ],
                next_message_id=results[-1].id if len(results) > 0 else 0,  # TODO
                no_more=len(results) <= PAGINATION_LENGTH,
            )

    def MarkLastSeenGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            subscription = (
                session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none()
            )

            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if not subscription.last_seen_message_id <= request.last_seen_message_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_UNSEE_MESSAGES)

            subscription.last_seen_message_id = request.last_seen_message_id
            session.commit()

            return empty_pb2.Empty()

    def SearchMessages(self, request, context):
        with session_scope(self._Session) as session:
            results = (
                session.query(Message)
                .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .filter(or_(Message.id < request.last_message_id, request.last_message_id == 0))
                .filter(Message.text.ilike(f"%{request.query}%"))
                .order_by(Message.id.desc())
                .limit(PAGINATION_LENGTH + 1)
                .all()
            )

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
                    )
                    for message in results[:PAGINATION_LENGTH]
                ],
                next_message_id=results[-1].id if len(results) > 0 else 0,  # TODO
                no_more=len(results) <= PAGINATION_LENGTH,
            )

    def CreateGroupChat(self, request, context):
        if len(request.recipient_user_ids) < 1:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NO_RECIPIENTS)

        if len(request.recipient_user_ids) != len(set(request.recipient_user_ids)):
            # make sure there's no duplicate users
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_RECIPIENTS)

        if context.user_id in request.recipient_user_ids:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_ADD_SELF)

        with session_scope(self._Session) as session:
            if len(request.recipient_user_ids) == 1:
                # can only have one DM at a time between any two users
                other_user_id = request.recipient_user_ids[0]

                # the following query selects subscriptions that are DMs and have the same group_chat_id, and have
                # user_id either this user or the recipient user. If you find two subscriptions to the same DM group
                # chat, you know they already have a shared group chat
                count = func.count(GroupChatSubscription.id).label("count")
                if (
                    session.query(count)
                    .filter(
                        or_(
                            GroupChatSubscription.user_id == context.user_id,
                            GroupChatSubscription.user_id == other_user_id,
                        )
                    )
                    .filter(GroupChatSubscription.left == None)
                    .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                    .filter(GroupChat.is_dm == True)
                    .group_by(GroupChatSubscription.group_chat_id)
                    .having(count == 2)
                    .one_or_none()
                ):
                    context.abort(
                        grpc.StatusCode.FAILED_PRECONDITION, "You already have a direct message chat with this user."
                    )

            conversation = Conversation()
            session.add(conversation)

            group_chat = GroupChat(
                conversation=conversation,
                title=request.title.value,
                creator_id=context.user_id,
                is_dm=True if len(request.recipient_user_ids) == 1 else False,  # TODO
            )
            session.add(group_chat)

            subscription = GroupChatSubscription(
                user_id=context.user_id, group_chat=group_chat, role=GroupChatRole.admin,
            )
            session.add(subscription)

            for recipient in request.recipient_user_ids:
                if get_friends_status(session, context.user_id, recipient) != api_pb2.User.FriendshipStatus.FRIENDS:
                    if len(request.recipient_user_ids) > 1:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.GROUP_CHAT_ONLY_ADD_FRIENDS)
                    else:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.DIRECT_MESSAGE_ONLY_FRIENDS)

                subscription = GroupChatSubscription(
                    user_id=recipient, group_chat=group_chat, role=GroupChatRole.participant,
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
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_MESSAGE)

        with session_scope(self._Session) as session:
            subscription = (
                session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none()
            )
            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)
            message = Message(
                conversation=subscription.group_chat.conversation, author_id=context.user_id, text=request.text,
            )
            session.add(message)
            session.commit()
            subscription.last_seen_message_id = message.id
            session.commit()
            return empty_pb2.Empty()

    def EditGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            subscription = (
                session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none()
            )

            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if subscription.role != GroupChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.ONLY_ADMIN_CAN_EDIT)

            if request.HasField("title"):
                subscription.group_chat.title = request.title.value

            if request.HasField("only_admins_invite"):
                subscription.group_chat.only_admins_invite = request.only_admins_invite.value

            session.commit()

            return empty_pb2.Empty()

    def MakeGroupChatAdmin(self, request, context):
        with session_scope(self._Session) as session:
            your_subscription = (
                session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none()
            )

            if not your_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if your_subscription.role != GroupChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.ONLY_ADMIN_CAN_MAKE_ADMIN)

            if request.user_id == context.user_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_MAKE_SELF_ADMIN)

            their_subscription = (
                session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == request.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none()
            )

            if not their_subscription:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.USER_NOT_IN_CHAT)

            if their_subscription.role != GroupChatRole.participant:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.ALREADY_ADMIN)

            their_subscription.role = GroupChatRole.admin
            session.commit()

            return empty_pb2.Empty()

    def RemoveGroupChatAdmin(self, request, context):
        with session_scope(self._Session) as session:
            your_subscription = (
                session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none()
            )

            if not your_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if request.user_id == context.user_id:
                # Race condition!
                other_admins_count = (
                    session.query(GroupChatSubscription.id)
                    .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                    .filter(GroupChatSubscription.user_id != context.user_id)
                    .filter(GroupChatSubscription.role == GroupChatRole.admin)
                    .filter(GroupChatSubscription.left == None)
                    .count()
                )
                if not other_admins_count > 0:
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_REMOVE_LAST_ADMIN)

            if your_subscription.role != GroupChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.ONLY_ADMIN_CAN_REMOVE_ADMIN)

            their_subscription = (
                session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == request.user_id)
                .filter(GroupChatSubscription.left == None)
                .filter(GroupChatSubscription.role == GroupChatRole.admin)
                .one_or_none()
            )

            if not their_subscription:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.USER_NOT_ADMIN)

            their_subscription.role = GroupChatRole.participant
            session.commit()

            return empty_pb2.Empty()

    def InviteToGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            result = (
                session.query(GroupChatSubscription, GroupChat)
                .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none()
            )

            if not result:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            your_subscription, group_chat = result

            if not your_subscription or not group_chat:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if request.user_id == context.user_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_INVITE_SELF)

            if your_subscription.role != GroupChatRole.admin and your_subscription.group_chat.only_admins_invite:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVITE_PERMISSION_DENIED)

            if group_chat.is_dm:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_INVITE_TO_DM)

            their_subscription = (
                session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == request.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none()
            )

            if their_subscription:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.ALREADY_IN_CHAT)

            # TODO: race condition!

            if get_friends_status(session, context.user_id, request.user_id) != api_pb2.User.FriendshipStatus.FRIENDS:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.GROUP_CHAT_ONLY_INVITE_FRIENDS)

            subscription = GroupChatSubscription(
                user_id=request.user_id, group_chat=your_subscription.group_chat, role=GroupChatRole.participant,
            )
            session.add(subscription)
            session.commit()

            return empty_pb2.Empty()

    def LeaveGroupChat(self, request, context):
        with session_scope(self._Session) as session:
            subscription = (
                session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none()
            )

            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if subscription.role == GroupChatRole.admin:
                other_admins_count = (
                    session.query(GroupChatSubscription.id)
                    .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                    .filter(GroupChatSubscription.user_id != context.user_id)
                    .filter(GroupChatSubscription.role == GroupChatRole.admin)
                    .filter(GroupChatSubscription.left == None)
                    .count()
                )
                participants_count = (
                    session.query(GroupChatSubscription.id)
                    .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                    .filter(GroupChatSubscription.user_id != context.user_id)
                    .filter(GroupChatSubscription.role == GroupChatRole.participant)
                    .filter(GroupChatSubscription.left == None)
                    .count()
                )
                if not (other_admins_count > 0 or participants_count == 0):
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.LAST_ADMIN_CANT_LEAVE)

            subscription.left = datetime.utcnow()
            session.commit()

            return empty_pb2.Empty()
