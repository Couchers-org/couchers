import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import func, or_

from couchers import errors
from couchers.db import are_friends, session_scope
from couchers.models import Conversation, GroupChat, GroupChatRole, GroupChatSubscription, Message, MessageType
from couchers.utils import Timestamp_from_datetime
from pb import api_pb2, conversations_pb2, conversations_pb2_grpc

# TODO: Still needs custom pagination: GetUpdates
DEFAULT_PAGINATION_LENGTH = 20
MAX_PAGE_SIZE = 50


def _message_to_pb(message: Message):
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
            chat_edited=conversations_pb2.MessageContentChatEdited()
            if message.message_type == MessageType.chat_edited
            else None,
            user_invited=conversations_pb2.MessageContentUserInvited(target_user_id=message.target_id)
            if message.message_type == MessageType.user_invited
            else None,
            user_left=conversations_pb2.MessageContentUserLeft()
            if message.message_type == MessageType.user_left
            else None,
            user_made_admin=conversations_pb2.MessageContentUserMadeAdmin(target_user_id=message.target_id)
            if message.message_type == MessageType.user_made_admin
            else None,
            user_removed_admin=conversations_pb2.MessageContentUserRemovedAdmin(target_user_id=message.target_id)
            if message.message_type == MessageType.user_removed_admin
            else None,
        )


def _get_visible_members_for_subscription(subscription):
    """
    If a user leaves a group chat, they shouldn't be able to see who's added
    after they left
    """
    if not subscription.left:
        # still in the chat, we see everyone with a current subscription
        return [sub.user_id for sub in subscription.group_chat.subscriptions.filter(GroupChatSubscription.left == None)]
    else:
        # not in chat anymore, see everyone who was in chat when we left
        return [
            sub.user_id
            for sub in subscription.group_chat.subscriptions.filter(
                GroupChatSubscription.joined <= subscription.left
            ).filter(or_(GroupChatSubscription.left >= subscription.left, GroupChatSubscription.left == None))
        ]


def _get_visible_admins_for_subscription(subscription):
    """
    If a user leaves a group chat, they shouldn't be able to see who's added
    after they left
    """
    if not subscription.left:
        # still in the chat, we see everyone with a current subscription
        return [
            sub.user_id
            for sub in subscription.group_chat.subscriptions.filter(GroupChatSubscription.left == None).filter(
                GroupChatSubscription.role == GroupChatRole.admin
            )
        ]
    else:
        # not in chat anymore, see everyone who was in chat when we left
        return [
            sub.user_id
            for sub in subscription.group_chat.subscriptions.filter(GroupChatSubscription.role == GroupChatRole.admin)
            .filter(GroupChatSubscription.joined <= subscription.left)
            .filter(or_(GroupChatSubscription.left >= subscription.left, GroupChatSubscription.left == None))
        ]


def _add_message_to_subscription(session, subscription, **kwargs):
    """
    Creates a new message for a subscription, from the user whose subscription that is. Updates last seen message id

    Specify the keyword args for Message
    """
    message = Message(conversation=subscription.group_chat.conversation, author_id=subscription.user_id, **kwargs)

    session.add(message)
    session.flush()

    subscription.last_seen_message_id = message.id

    return message


class Conversations(conversations_pb2_grpc.ConversationsServicer):
    def ListGroupChats(self, request, context):
        with session_scope() as session:
            page_size = request.number if request.number != 0 else DEFAULT_PAGINATION_LENGTH
            page_size = min(page_size, MAX_PAGE_SIZE)

            # select group chats where you have a subscription, and for each of
            # these, the latest message from them

            t = (
                session.query(
                    GroupChatSubscription.group_chat_id.label("group_chat_id"),
                    func.max(GroupChatSubscription.id).label("group_chat_subscriptions_id"),
                    func.max(Message.id).label("message_id"),
                )
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .group_by(GroupChatSubscription.group_chat_id)
                .order_by(func.max(Message.id).desc())
                .subquery()
            )

            results = (
                session.query(t, GroupChat, GroupChatSubscription, Message)
                .join(Message, Message.id == t.c.message_id)
                .join(GroupChatSubscription, GroupChatSubscription.id == t.c.group_chat_subscriptions_id)
                .join(GroupChat, GroupChat.conversation_id == t.c.group_chat_id)
                .filter(or_(t.c.message_id < request.last_message_id, request.last_message_id == 0))
                .order_by(t.c.message_id.desc())
                .limit(page_size + 1)
                .all()
            )

            return conversations_pb2.ListGroupChatsRes(
                group_chats=[
                    conversations_pb2.GroupChat(
                        group_chat_id=result.GroupChat.conversation_id,
                        title=result.GroupChat.title,  # TODO: proper title for DMs, etc
                        member_user_ids=_get_visible_members_for_subscription(result.GroupChatSubscription),
                        admin_user_ids=_get_visible_admins_for_subscription(result.GroupChatSubscription),
                        only_admins_invite=result.GroupChat.only_admins_invite,
                        is_dm=result.GroupChat.is_dm,
                        created=Timestamp_from_datetime(result.GroupChat.conversation.created),
                        unseen_message_count=result.GroupChatSubscription.unseen_message_count,
                        last_seen_message_id=result.GroupChatSubscription.last_seen_message_id,
                        latest_message=_message_to_pb(result.Message) if result.Message else None,
                    )
                    for result in results[:page_size]
                ],
                last_message_id=min(map(lambda g: g.Message.id if g.Message else 1, results[:page_size]))
                if len(results) > 0
                else 0,  # TODO
                no_more=len(results) <= page_size,
            )

    def GetGroupChat(self, request, context):
        with session_scope() as session:
            result = (
                session.query(GroupChat, GroupChatSubscription, Message)
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .order_by(Message.id.desc())
                .first()
            )

            if not result:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            return conversations_pb2.GroupChat(
                group_chat_id=result.GroupChat.conversation_id,
                title=result.GroupChat.title,
                member_user_ids=_get_visible_members_for_subscription(result.GroupChatSubscription),
                admin_user_ids=_get_visible_admins_for_subscription(result.GroupChatSubscription),
                only_admins_invite=result.GroupChat.only_admins_invite,
                is_dm=result.GroupChat.is_dm,
                created=Timestamp_from_datetime(result.GroupChat.conversation.created),
                unseen_message_count=result.GroupChatSubscription.unseen_message_count,
                last_seen_message_id=result.GroupChatSubscription.last_seen_message_id,
                latest_message=_message_to_pb(result.Message) if result.Message else None,
            )

    def GetDirectMessage(self, request, context):
        with session_scope() as session:
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
                .join(Message, Message.conversation_id == GroupChat.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.group_chat_id == GroupChat.conversation_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .order_by(Message.id.desc())
                .first()
            )

            if not result:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that chat.")

            return conversations_pb2.GroupChat(
                group_chat_id=result.GroupChat.conversation_id,
                title=result.GroupChat.title,
                member_user_ids=_get_visible_members_for_subscription(result.GroupChatSubscription),
                admin_user_ids=_get_visible_admins_for_subscription(result.GroupChatSubscription),
                only_admins_invite=result.GroupChat.only_admins_invite,
                is_dm=result.GroupChat.is_dm,
                created=Timestamp_from_datetime(result.GroupChat.conversation.created),
                unseen_message_count=result.GroupChatSubscription.unseen_message_count,
                last_seen_message_id=result.GroupChatSubscription.last_seen_message_id,
                latest_message=_message_to_pb(result.Message) if result.Message else None,
            )

    def GetUpdates(self, request, context):
        with session_scope() as session:
            results = (
                session.query(Message)
                .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .filter(Message.id > request.newest_message_id)
                .order_by(Message.id.asc())
                .limit(DEFAULT_PAGINATION_LENGTH + 1)
                .all()
            )

            return conversations_pb2.GetUpdatesRes(
                updates=[
                    conversations_pb2.Update(
                        group_chat_id=message.conversation_id,
                        message=_message_to_pb(message),
                    )
                    for message in sorted(results, key=lambda message: message.id)[:DEFAULT_PAGINATION_LENGTH]
                ],
                no_more=len(results) <= DEFAULT_PAGINATION_LENGTH,
            )

    def GetGroupChatMessages(self, request, context):
        with session_scope() as session:
            page_size = request.number if request.number != 0 else DEFAULT_PAGINATION_LENGTH
            page_size = min(page_size, MAX_PAGE_SIZE)

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
                .limit(page_size + 1)
                .all()
            )

            return conversations_pb2.GetGroupChatMessagesRes(
                messages=[_message_to_pb(message) for message in results[:page_size]],
                last_message_id=results[-2].id if len(results) > 1 else 0,  # TODO
                no_more=len(results) <= page_size,
            )

    def MarkLastSeenGroupChat(self, request, context):
        with session_scope() as session:
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

        return empty_pb2.Empty()

    def SearchMessages(self, request, context):
        with session_scope() as session:
            page_size = request.number if request.number != 0 else DEFAULT_PAGINATION_LENGTH
            page_size = min(page_size, MAX_PAGE_SIZE)

            results = (
                session.query(Message)
                .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .filter(or_(Message.id < request.last_message_id, request.last_message_id == 0))
                .filter(Message.text.ilike(f"%{request.query}%"))
                .order_by(Message.id.desc())
                .limit(page_size + 1)
                .all()
            )

            return conversations_pb2.SearchMessagesRes(
                results=[
                    conversations_pb2.MessageSearchResult(
                        group_chat_id=message.conversation_id,
                        message=_message_to_pb(message),
                    )
                    for message in results[:page_size]
                ],
                last_message_id=results[-2].id if len(results) > 1 else 0,
                no_more=len(results) <= page_size,
            )

    def CreateGroupChat(self, request, context):
        if len(request.recipient_user_ids) < 1:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NO_RECIPIENTS)

        if len(request.recipient_user_ids) != len(set(request.recipient_user_ids)):
            # make sure there's no duplicate users
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_RECIPIENTS)

        if context.user_id in request.recipient_user_ids:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_ADD_SELF)

        with session_scope() as session:
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

            your_subscription = GroupChatSubscription(
                user_id=context.user_id,
                group_chat=group_chat,
                role=GroupChatRole.admin,
            )
            session.add(your_subscription)

            for recipient in request.recipient_user_ids:
                if not are_friends(session, context.user_id, recipient):
                    if len(request.recipient_user_ids) > 1:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.GROUP_CHAT_ONLY_ADD_FRIENDS)
                    else:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.DIRECT_MESSAGE_ONLY_FRIENDS)

                subscription = GroupChatSubscription(
                    user_id=recipient,
                    group_chat=group_chat,
                    role=GroupChatRole.participant,
                )
                session.add(subscription)

            _add_message_to_subscription(session, your_subscription, message_type=MessageType.chat_created)

            session.flush()

            return conversations_pb2.GroupChat(
                group_chat_id=group_chat.conversation_id,
                title=group_chat.title,
                member_user_ids=_get_visible_members_for_subscription(your_subscription),
                admin_user_ids=_get_visible_admins_for_subscription(your_subscription),
                only_admins_invite=group_chat.only_admins_invite,
                is_dm=group_chat.is_dm,
                created=Timestamp_from_datetime(group_chat.conversation.created),
            )

    def SendMessage(self, request, context):
        if request.text == "":
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_MESSAGE)

        with session_scope() as session:
            subscription = (
                session.query(GroupChatSubscription)
                .filter(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(GroupChatSubscription.left == None)
                .one_or_none()
            )
            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            _add_message_to_subscription(session, subscription, message_type=MessageType.text, text=request.text)

        return empty_pb2.Empty()

    def EditGroupChat(self, request, context):
        with session_scope() as session:
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

            _add_message_to_subscription(session, subscription, message_type=MessageType.chat_edited)

        return empty_pb2.Empty()

    def MakeGroupChatAdmin(self, request, context):
        with session_scope() as session:
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

            _add_message_to_subscription(
                session, your_subscription, message_type=MessageType.user_made_admin, target_id=request.user_id
            )

        return empty_pb2.Empty()

    def RemoveGroupChatAdmin(self, request, context):
        with session_scope() as session:
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

            _add_message_to_subscription(
                session, your_subscription, message_type=MessageType.user_removed_admin, target_id=request.user_id
            )

        return empty_pb2.Empty()

    def InviteToGroupChat(self, request, context):
        with session_scope() as session:
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

            if not are_friends(session, context.user_id, recipient):
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.GROUP_CHAT_ONLY_INVITE_FRIENDS)

            subscription = GroupChatSubscription(
                user_id=request.user_id,
                group_chat=your_subscription.group_chat,
                role=GroupChatRole.participant,
            )
            session.add(subscription)

            _add_message_to_subscription(
                session, your_subscription, message_type=MessageType.user_invited, target_id=request.user_id
            )

        return empty_pb2.Empty()

    def LeaveGroupChat(self, request, context):
        with session_scope() as session:
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

            _add_message_to_subscription(session, subscription, message_type=MessageType.user_left)

            subscription.left = func.now()

        return empty_pb2.Empty()
