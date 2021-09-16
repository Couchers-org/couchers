import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import func, or_

from couchers import errors
from couchers.db import are_friends, session_scope
from couchers.models import Chat, ChatRole, ChatSubscription, Conversation, Message, MessageType, User
from couchers.sql import couchers_select as select
from couchers.utils import Timestamp_from_datetime
from proto import conversations_pb2, conversations_pb2_grpc

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
            chat_user_removed=conversations_pb2.MessageContentUserRemoved(target_user_id=message.target_id)
            if message.message_type == MessageType.user_removed
            else None,
        )


def _get_visible_members_for_subscription(subscription):
    """
    If a user leaves a group chat, they shouldn't be able to see who's added
    after they left
    """
    if not subscription.left:
        # still in the chat, we see everyone with a current subscription
        return [sub.user_id for sub in subscription.chat.subscriptions.where(ChatSubscription.left == None)]
    else:
        # not in chat anymore, see everyone who was in chat when we left
        return [
            sub.user_id
            for sub in subscription.chat.subscriptions.where(ChatSubscription.joined <= subscription.left).where(
                or_(ChatSubscription.left >= subscription.left, ChatSubscription.left == None)
            )
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
            for sub in subscription.chat.subscriptions.where(ChatSubscription.left == None).where(
                ChatSubscription.role == ChatRole.admin
            )
        ]
    else:
        # not in chat anymore, see everyone who was in chat when we left
        return [
            sub.user_id
            for sub in subscription.chat.subscriptions.where(ChatSubscription.role == ChatRole.admin)
            .where(ChatSubscription.joined <= subscription.left)
            .where(or_(ChatSubscription.left >= subscription.left, ChatSubscription.left == None))
        ]


def _add_message_to_subscription(session, subscription, **kwargs):
    """
    Creates a new message for a subscription, from the user whose subscription that is. Updates last seen message id

    Specify the keyword args for Message
    """
    message = Message(conversation=subscription.chat.conversation, author_id=subscription.user_id, **kwargs)

    session.add(message)
    session.flush()

    subscription.last_seen_message_id = message.id

    return message


def _unseen_message_count(session, subscription_id):
    return session.execute(
        select(func.count())
        .select_from(Message)
        .join(ChatSubscription, ChatSubscription.chat_id == Message.conversation_id)
        .where(ChatSubscription.id == subscription_id)
        .where(Message.id > ChatSubscription.last_seen_message_id)
    ).scalar_one()


class Conversations(conversations_pb2_grpc.ConversationsServicer):
    def ListChats(self, request, context):
        with session_scope() as session:
            page_size = request.page_size if request.page_size != 0 else DEFAULT_PAGINATION_LENGTH
            page_size = min(page_size, MAX_PAGE_SIZE)
            last_message_id = int(request.page_token or 0)

            # select group chats where you have a subscription, and for each of
            # these, the latest message from them

            t = (
                select(
                    ChatSubscription.chat_id.label("chat_id"),
                    func.max(ChatSubscription.id).label("chat_subscriptions_id"),
                    func.max(Message.id).label("message_id"),
                )
                .join(Message, Message.conversation_id == ChatSubscription.chat_id)
                .where(ChatSubscription.user_id == context.user_id)
                .where(Message.time >= ChatSubscription.joined)
                .where(or_(Message.time <= ChatSubscription.left, ChatSubscription.left == None))
                .group_by(ChatSubscription.chat_id)
                .order_by(func.max(Message.id).desc())
                .subquery()
            )

            results = session.execute(
                select(t, Chat, ChatSubscription, Message)
                .join(Message, Message.id == t.c.message_id)
                .join(ChatSubscription, ChatSubscription.id == t.c.chat_subscriptions_id)
                .join(Chat, Chat.conversation_id == t.c.chat_id)
                .where(or_(t.c.message_id < last_message_id, last_message_id == 0))
                .order_by(t.c.message_id.desc())
                .limit(page_size + 1)
            ).all()

            next_page_token = None
            if page_size < len(results) and len(results) > 0:
                # there were some results left, so not last page
                next_page_token = str(min(map(lambda g: g.Message.id if g.Message else 1, results[:page_size])))

            return conversations_pb2.ListChatsRes(
                chats=[
                    conversations_pb2.Chat(
                        chat_id=result.Chat.conversation_id,
                        title=result.Chat.title,  # TODO: proper title for DMs, etc
                        member_user_ids=_get_visible_members_for_subscription(result.ChatSubscription),
                        admin_user_ids=_get_visible_admins_for_subscription(result.ChatSubscription),
                        only_admins_invite=result.Chat.only_admins_invite,
                        is_dm=result.Chat.is_dm,
                        created=Timestamp_from_datetime(result.Chat.conversation.created),
                        unseen_message_count=_unseen_message_count(session, result.ChatSubscription.id),
                        last_seen_message_id=result.ChatSubscription.last_seen_message_id,
                        latest_message=_message_to_pb(result.Message) if result.Message else None,
                    )
                    for result in results[:page_size]
                ],
                next_page_token=next_page_token,
            )

    def GetChat(self, request, context):
        with session_scope() as session:
            result = session.execute(
                select(Chat, ChatSubscription, Message)
                .join(Message, Message.conversation_id == ChatSubscription.chat_id)
                .join(Chat, Chat.conversation_id == ChatSubscription.chat_id)
                .where(ChatSubscription.user_id == context.user_id)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(Message.time >= ChatSubscription.joined)
                .where(or_(Message.time <= ChatSubscription.left, ChatSubscription.left == None))
                .order_by(Message.id.desc())
            ).first()

            if not result:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            return conversations_pb2.Chat(
                chat_id=result.Chat.conversation_id,
                title=result.Chat.title,
                member_user_ids=_get_visible_members_for_subscription(result.ChatSubscription),
                admin_user_ids=_get_visible_admins_for_subscription(result.ChatSubscription),
                only_admins_invite=result.Chat.only_admins_invite,
                is_dm=result.Chat.is_dm,
                created=Timestamp_from_datetime(result.Chat.conversation.created),
                unseen_message_count=_unseen_message_count(session, result.ChatSubscription.id),
                last_seen_message_id=result.ChatSubscription.last_seen_message_id,
                latest_message=_message_to_pb(result.Message) if result.Message else None,
            )

    def GetDirectMessage(self, request, context):
        with session_scope() as session:
            count = func.count(ChatSubscription.id).label("count")
            subquery = (
                select(ChatSubscription.chat_id)
                .where(
                    or_(
                        ChatSubscription.user_id == context.user_id,
                        ChatSubscription.user_id == request.user_id,
                    )
                )
                .where(ChatSubscription.left == None)
                .join(Chat, Chat.conversation_id == ChatSubscription.chat_id)
                .where(Chat.is_dm == True)
                .group_by(ChatSubscription.chat_id)
                .having(count == 2)
                .subquery()
            )

            result = session.execute(
                select(subquery, Chat, ChatSubscription, Message)
                .join(subquery, subquery.c.chat_id == Chat.conversation_id)
                .join(Message, Message.conversation_id == Chat.conversation_id)
                .where(ChatSubscription.user_id == context.user_id)
                .where(ChatSubscription.chat_id == Chat.conversation_id)
                .where(Message.time >= ChatSubscription.joined)
                .where(or_(Message.time <= ChatSubscription.left, ChatSubscription.left == None))
                .order_by(Message.id.desc())
            ).first()

            if not result:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that chat.")

            return conversations_pb2.Chat(
                chat_id=result.Chat.conversation_id,
                title=result.Chat.title,
                member_user_ids=_get_visible_members_for_subscription(result.ChatSubscription),
                admin_user_ids=_get_visible_admins_for_subscription(result.ChatSubscription),
                only_admins_invite=result.Chat.only_admins_invite,
                is_dm=result.Chat.is_dm,
                created=Timestamp_from_datetime(result.Chat.conversation.created),
                unseen_message_count=_unseen_message_count(session, result.ChatSubscription.id),
                last_seen_message_id=result.ChatSubscription.last_seen_message_id,
                latest_message=_message_to_pb(result.Message) if result.Message else None,
            )

    def GetChatMessages(self, request, context):
        with session_scope() as session:
            page_size = request.page_size if request.page_size != 0 else DEFAULT_PAGINATION_LENGTH
            page_size = min(page_size, MAX_PAGE_SIZE)
            last_message_id = int(request.page_token or 0)

            results = (
                session.execute(
                    select(Message)
                    .join(ChatSubscription, ChatSubscription.chat_id == Message.conversation_id)
                    .where(ChatSubscription.user_id == context.user_id)
                    .where(ChatSubscription.chat_id == request.chat_id)
                    .where(Message.time >= ChatSubscription.joined)
                    .where(or_(Message.time <= ChatSubscription.left, ChatSubscription.left == None))
                    .where(or_(Message.id < last_message_id, last_message_id == 0))
                    .order_by(Message.id.desc())
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )

            next_page_token = None
            if page_size < len(results) and len(results) > 1:
                next_page_token = str(results[-2].id)

            return conversations_pb2.GetChatMessagesRes(
                messages=[_message_to_pb(message) for message in results[:page_size]],
                next_page_token=next_page_token,
            )

    def MarkLastSeenChat(self, request, context):
        with session_scope() as session:
            subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == context.user_id)
                .where(ChatSubscription.left == None)
            ).scalar_one_or_none()

            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if not subscription.last_seen_message_id <= request.last_seen_message_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_UNSEE_MESSAGES)

            subscription.last_seen_message_id = request.last_seen_message_id

        return empty_pb2.Empty()

    def SearchMessages(self, request, context):
        with session_scope() as session:
            page_size = request.page_size if request.page_size != 0 else DEFAULT_PAGINATION_LENGTH
            page_size = min(page_size, MAX_PAGE_SIZE)
            last_message_id = int(request.page_token or 0)

            results = (
                session.execute(
                    select(Message)
                    .join(ChatSubscription, ChatSubscription.chat_id == Message.conversation_id)
                    .where(ChatSubscription.user_id == context.user_id)
                    .where(Message.time >= ChatSubscription.joined)
                    .where(or_(Message.time <= ChatSubscription.left, ChatSubscription.left == None))
                    .where(or_(Message.id < last_message_id, last_message_id == 0))
                    .where(Message.text.ilike(f"%{request.query}%"))
                    .order_by(Message.id.desc())
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )

            return conversations_pb2.SearchMessagesRes(
                results=[
                    conversations_pb2.MessageSearchResult(
                        chat_id=message.conversation_id,
                        message=_message_to_pb(message),
                    )
                    for message in results[:page_size]
                ],
                next_page_token=str(results[-2].id if len(results) > 1 else ""),
            )

    def CreateChat(self, request, context):
        with session_scope() as session:
            recipient_user_ids = [
                user_id
                for user_id in (
                    session.execute(
                        select(User.id).where_users_visible(context).where(User.id.in_(request.recipient_user_ids))
                    )
                    .scalars()
                    .all()
                )
            ]

            # make sure all requested users are visible
            if len(recipient_user_ids) != len(request.recipient_user_ids):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.USER_NOT_FOUND)

            if not recipient_user_ids:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NO_RECIPIENTS)

            if len(recipient_user_ids) != len(set(recipient_user_ids)):
                # make sure there's no duplicate users
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_RECIPIENTS)

            if context.user_id in recipient_user_ids:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_ADD_SELF)

            if len(recipient_user_ids) == 1:
                # can only have one DM at a time between any two users
                other_user_id = recipient_user_ids[0]

                # the following sql statement selects subscriptions that are DMs and have the same chat_id, and have
                # user_id either this user or the recipient user. If you find two subscriptions to the same DM group
                # chat, you know they already have a shared group chat
                count = func.count(ChatSubscription.id).label("count")
                if session.execute(
                    select(count)
                    .where(
                        or_(
                            ChatSubscription.user_id == context.user_id,
                            ChatSubscription.user_id == other_user_id,
                        )
                    )
                    .where(ChatSubscription.left == None)
                    .join(Chat, Chat.conversation_id == ChatSubscription.chat_id)
                    .where(Chat.is_dm == True)
                    .group_by(ChatSubscription.chat_id)
                    .having(count == 2)
                ).scalar_one_or_none():
                    context.abort(
                        grpc.StatusCode.FAILED_PRECONDITION, "You already have a direct message chat with this user."
                    )

            conversation = Conversation()
            session.add(conversation)

            chat = Chat(
                conversation=conversation,
                title=request.title.value,
                creator_id=context.user_id,
                is_dm=True if len(recipient_user_ids) == 1 else False,  # TODO
            )
            session.add(chat)

            your_subscription = ChatSubscription(
                user_id=context.user_id,
                chat=chat,
                role=ChatRole.admin,
            )
            session.add(your_subscription)

            for recipient in request.recipient_user_ids:
                if not are_friends(session, context, recipient):
                    if len(request.recipient_user_ids) > 1:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CHAT_ONLY_ADD_FRIENDS)
                    else:
                        context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.DIRECT_MESSAGE_ONLY_FRIENDS)

                subscription = ChatSubscription(
                    user_id=recipient,
                    chat=chat,
                    role=ChatRole.participant,
                )
                session.add(subscription)

            _add_message_to_subscription(session, your_subscription, message_type=MessageType.chat_created)

            session.flush()

            return conversations_pb2.Chat(
                chat_id=chat.conversation_id,
                title=chat.title,
                member_user_ids=_get_visible_members_for_subscription(your_subscription),
                admin_user_ids=_get_visible_admins_for_subscription(your_subscription),
                only_admins_invite=chat.only_admins_invite,
                is_dm=chat.is_dm,
                created=Timestamp_from_datetime(chat.conversation.created),
            )

    def SendMessage(self, request, context):
        if request.text == "":
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_MESSAGE)

        with session_scope() as session:
            subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == context.user_id)
                .where(ChatSubscription.left == None)
            ).scalar_one_or_none()
            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            _add_message_to_subscription(session, subscription, message_type=MessageType.text, text=request.text)

        return empty_pb2.Empty()

    def EditChat(self, request, context):
        with session_scope() as session:
            subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.user_id == context.user_id)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.left == None)
            ).scalar_one_or_none()

            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if subscription.role != ChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.ONLY_ADMIN_CAN_EDIT)

            if request.HasField("title"):
                subscription.chat.title = request.title.value

            if request.HasField("only_admins_invite"):
                subscription.chat.only_admins_invite = request.only_admins_invite.value

            _add_message_to_subscription(session, subscription, message_type=MessageType.chat_edited)

        return empty_pb2.Empty()

    def MakeChatAdmin(self, request, context):
        with session_scope() as session:
            if not session.execute(
                select(User).where_users_visible(context).where(User.id == request.user_id)
            ).scalar_one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            your_subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == context.user_id)
                .where(ChatSubscription.left == None)
            ).scalar_one_or_none()

            if not your_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if your_subscription.role != ChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.ONLY_ADMIN_CAN_MAKE_ADMIN)

            if request.user_id == context.user_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_MAKE_SELF_ADMIN)

            their_subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == request.user_id)
                .where(ChatSubscription.left == None)
            ).scalar_one_or_none()

            if not their_subscription:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.USER_NOT_IN_CHAT)

            if their_subscription.role != ChatRole.participant:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.ALREADY_ADMIN)

            their_subscription.role = ChatRole.admin

            _add_message_to_subscription(
                session, your_subscription, message_type=MessageType.user_made_admin, target_id=request.user_id
            )

        return empty_pb2.Empty()

    def RemoveChatAdmin(self, request, context):
        with session_scope() as session:
            if not session.execute(
                select(User).where_users_visible(context).where(User.id == request.user_id)
            ).scalar_one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            your_subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == context.user_id)
                .where(ChatSubscription.left == None)
            ).scalar_one_or_none()

            if not your_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if request.user_id == context.user_id:
                # Race condition!
                other_admins_count = session.execute(
                    select(func.count())
                    .select_from(ChatSubscription)
                    .where(ChatSubscription.chat_id == request.chat_id)
                    .where(ChatSubscription.user_id != context.user_id)
                    .where(ChatSubscription.role == ChatRole.admin)
                    .where(ChatSubscription.left == None)
                ).scalar_one()
                if not other_admins_count > 0:
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_REMOVE_LAST_ADMIN)

            if your_subscription.role != ChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.ONLY_ADMIN_CAN_REMOVE_ADMIN)

            their_subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == request.user_id)
                .where(ChatSubscription.left == None)
                .where(ChatSubscription.role == ChatRole.admin)
            ).scalar_one_or_none()

            if not their_subscription:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.USER_NOT_ADMIN)

            their_subscription.role = ChatRole.participant

            _add_message_to_subscription(
                session, your_subscription, message_type=MessageType.user_removed_admin, target_id=request.user_id
            )

        return empty_pb2.Empty()

    def InviteToChat(self, request, context):
        with session_scope() as session:
            if not session.execute(
                select(User).where_users_visible(context).where(User.id == request.user_id)
            ).scalar_one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            result = session.execute(
                select(ChatSubscription, Chat)
                .join(Chat, Chat.conversation_id == ChatSubscription.chat_id)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == context.user_id)
                .where(ChatSubscription.left == None)
            ).one_or_none()

            if not result:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            your_subscription, chat = result

            if not your_subscription or not chat:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if request.user_id == context.user_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_INVITE_SELF)

            if your_subscription.role != ChatRole.admin and your_subscription.chat.only_admins_invite:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.INVITE_PERMISSION_DENIED)

            if chat.is_dm:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_INVITE_TO_DM)

            their_subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == request.user_id)
                .where(ChatSubscription.left == None)
            ).scalar_one_or_none()

            if their_subscription:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.ALREADY_IN_CHAT)

            # TODO: race condition!

            if not are_friends(session, context, request.user_id):
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CHAT_ONLY_INVITE_FRIENDS)

            subscription = ChatSubscription(
                user_id=request.user_id,
                chat=your_subscription.chat,
                role=ChatRole.participant,
            )
            session.add(subscription)

            _add_message_to_subscription(
                session, your_subscription, message_type=MessageType.user_invited, target_id=request.user_id
            )

        return empty_pb2.Empty()

    def RemoveChatUser(self, request, context):
        """
        1. Get admin info and check it's correct
        2. Get user data, check it's correct and remove user
        """
        with session_scope() as session:
            # Admin info
            your_subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == context.user_id)
                .where(ChatSubscription.left == None)
            ).scalar_one_or_none()

            # if user info is missing
            if not your_subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            # if user not admin
            if your_subscription.role != ChatRole.admin:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.ONLY_ADMIN_CAN_REMOVE_USER)

            # if user wants to remove themselves
            if request.user_id == context.user_id:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_REMOVE_SELF)

            # get user info
            their_subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == request.user_id)
                .where(ChatSubscription.left == None)
            ).scalar_one_or_none()

            # user not found
            if not their_subscription:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.USER_NOT_IN_CHAT)

            _add_message_to_subscription(
                session, your_subscription, message_type=MessageType.user_removed, target_id=request.user_id
            )

            their_subscription.left = func.now()

        return empty_pb2.Empty()

    def LeaveChat(self, request, context):
        with session_scope() as session:
            subscription = session.execute(
                select(ChatSubscription)
                .where(ChatSubscription.chat_id == request.chat_id)
                .where(ChatSubscription.user_id == context.user_id)
                .where(ChatSubscription.left == None)
            ).scalar_one_or_none()

            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

            if subscription.role == ChatRole.admin:
                other_admins_count = session.execute(
                    select(func.count())
                    .select_from(ChatSubscription)
                    .where(ChatSubscription.chat_id == request.chat_id)
                    .where(ChatSubscription.user_id != context.user_id)
                    .where(ChatSubscription.role == ChatRole.admin)
                    .where(ChatSubscription.left == None)
                ).scalar_one()
                participants_count = session.execute(
                    select(func.count())
                    .select_from(ChatSubscription)
                    .where(ChatSubscription.chat_id == request.chat_id)
                    .where(ChatSubscription.user_id != context.user_id)
                    .where(ChatSubscription.role == ChatRole.participant)
                    .where(ChatSubscription.left == None)
                ).scalar_one()
                if not (other_admins_count > 0 or participants_count == 0):
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.LAST_ADMIN_CANT_LEAVE)

            _add_message_to_subscription(session, subscription, message_type=MessageType.user_left)

            subscription.left = func.now()

        return empty_pb2.Empty()
