import logging
from collections.abc import Sequence
from datetime import timedelta
from typing import Any, cast

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import func, not_, or_

from couchers.constants import DATETIME_INFINITY, DATETIME_MINUS_INFINITY
from couchers.context import CouchersContext, make_background_user_context
from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.metrics import sent_messages_counter
from couchers.models import (
    Conversation,
    GroupChat,
    GroupChatRole,
    GroupChatSubscription,
    Message,
    MessageType,
    ModerationObjectType,
    RateLimitAction,
    User,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.moderation.utils import create_moderation
from couchers.notifications.notify import notify
from couchers.proto import conversations_pb2, conversations_pb2_grpc, notification_data_pb2
from couchers.proto.internal import jobs_pb2
from couchers.rate_limits.check import process_rate_limits_and_check_abort
from couchers.rate_limits.definitions import RATE_LIMIT_HOURS
from couchers.servicers.api import user_model_to_pb
from couchers.sql import to_bool, users_visible, where_moderated_content_visible, where_users_column_visible
from couchers.utils import Timestamp_from_datetime, now

logger = logging.getLogger(__name__)

# TODO: Still needs custom pagination: GetUpdates
DEFAULT_PAGINATION_LENGTH = 20
MAX_PAGE_SIZE = 50


def _message_to_pb(message: Message) -> conversations_pb2.Message:
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
            chat_created=(
                conversations_pb2.MessageContentChatCreated()
                if message.message_type == MessageType.chat_created
                else None
            ),
            chat_edited=(
                conversations_pb2.MessageContentChatEdited()
                if message.message_type == MessageType.chat_edited
                else None
            ),
            user_invited=(
                conversations_pb2.MessageContentUserInvited(target_user_id=message.target_id)
                if message.message_type == MessageType.user_invited
                else None
            ),
            user_left=(
                conversations_pb2.MessageContentUserLeft() if message.message_type == MessageType.user_left else None
            ),
            user_made_admin=(
                conversations_pb2.MessageContentUserMadeAdmin(target_user_id=message.target_id)
                if message.message_type == MessageType.user_made_admin
                else None
            ),
            user_removed_admin=(
                conversations_pb2.MessageContentUserRemovedAdmin(target_user_id=message.target_id)
                if message.message_type == MessageType.user_removed_admin
                else None
            ),
            group_chat_user_removed=(
                conversations_pb2.MessageContentUserRemoved(target_user_id=message.target_id)
                if message.message_type == MessageType.user_removed
                else None
            ),
        )


def _get_visible_members_for_subscription(subscription: GroupChatSubscription) -> list[int]:
    """
    If a user leaves a group chat, they shouldn't be able to see who's added
    after they left
    """
    if not subscription.left:
        # still in the chat, we see everyone with a current subscription
        return [sub.user_id for sub in subscription.group_chat.subscriptions.where(GroupChatSubscription.left == None)]
    else:
        # not in chat anymore, see everyone who was in chat when we left
        return [
            sub.user_id
            for sub in subscription.group_chat.subscriptions.where(
                GroupChatSubscription.joined <= subscription.left
            ).where(or_(GroupChatSubscription.left >= subscription.left, GroupChatSubscription.left == None))
        ]


def _get_visible_admins_for_subscription(subscription: GroupChatSubscription) -> list[int]:
    """
    If a user leaves a group chat, they shouldn't be able to see who's added
    after they left
    """
    if not subscription.left:
        # still in the chat, we see everyone with a current subscription
        return [
            sub.user_id
            for sub in subscription.group_chat.subscriptions.where(GroupChatSubscription.left == None).where(
                GroupChatSubscription.role == GroupChatRole.admin
            )
        ]
    else:
        # not in chat anymore, see everyone who was in chat when we left
        return [
            sub.user_id
            for sub in subscription.group_chat.subscriptions.where(GroupChatSubscription.role == GroupChatRole.admin)
            .where(GroupChatSubscription.joined <= subscription.left)
            .where(or_(GroupChatSubscription.left >= subscription.left, GroupChatSubscription.left == None))
        ]


def _user_can_message(session: Session, context: CouchersContext, group_chat: GroupChat) -> bool:
    """
    If it is a true group chat (not a DM), user can always message. For a DM, user can message if the other participant
    - Is not deleted/banned
    - Has not been blocked by the user or is blocking the user
    - Has not left the chat
    """
    if not group_chat.is_dm:
        return True

    query = select(
        where_users_column_visible(
            select(GroupChatSubscription)
            .where(GroupChatSubscription.user_id != context.user_id)
            .where(GroupChatSubscription.group_chat_id == group_chat.conversation_id)
            .where(GroupChatSubscription.left == None),
            context=context,
            column=GroupChatSubscription.user_id,
        ).exists()
    )
    return session.execute(query).scalar_one()


def generate_message_notifications(payload: jobs_pb2.GenerateMessageNotificationsPayload) -> None:
    """
    Background job to generate notifications for a message sent to a group chat
    """
    logger.info(f"Fanning notifications for message_id = {payload.message_id}")

    with session_scope() as session:
        message, group_chat = session.execute(
            select(Message, GroupChat)
            .join(GroupChat, GroupChat.conversation_id == Message.conversation_id)
            .where(Message.id == payload.message_id)
        ).one()

        if message.message_type != MessageType.text:
            logger.info(f"Not a text message, not notifying. message_id = {payload.message_id}")
            return

        context = make_background_user_context(user_id=message.author_id)
        user_ids_to_notify = (
            session.execute(
                where_users_column_visible(
                    select(GroupChatSubscription.user_id)
                    .where(GroupChatSubscription.group_chat_id == message.conversation_id)
                    .where(GroupChatSubscription.user_id != message.author_id)
                    .where(GroupChatSubscription.joined <= message.time)
                    .where(or_(GroupChatSubscription.left == None, GroupChatSubscription.left >= message.time))
                    .where(not_(GroupChatSubscription.is_muted)),
                    context=context,
                    column=GroupChatSubscription.user_id,
                )
            )
            .scalars()
            .all()
        )

        if group_chat.is_dm:
            msg = f"{message.author.name} sent you a message"
        else:
            msg = f"{message.author.name} sent a message in {group_chat.title}"

        for user_id in user_ids_to_notify:
            notify(
                session,
                user_id=user_id,
                topic_action=NotificationTopicAction.chat__message,
                key=str(message.conversation_id),
                data=notification_data_pb2.ChatMessage(
                    author=user_model_to_pb(
                        message.author,
                        session,
                        make_background_user_context(user_id=user_id),
                    ),
                    message=msg,
                    text=message.text,
                    group_chat_id=message.conversation_id,
                ),
                moderation_state_id=group_chat.moderation_state_id,
            )


def _add_message_to_subscription(session: Session, subscription: GroupChatSubscription, **kwargs: Any) -> Message:
    """
    Creates a new message for a subscription, from the user whose subscription that is. Updates last seen message id

    Specify the keyword args for Message
    """
    message = Message(conversation_id=subscription.group_chat.conversation.id, author_id=subscription.user_id, **kwargs)

    session.add(message)
    session.flush()

    subscription.last_seen_message_id = message.id

    queue_job(
        session,
        job=generate_message_notifications,
        payload=jobs_pb2.GenerateMessageNotificationsPayload(
            message_id=message.id,
        ),
    )

    return message


def _create_chat(
    session: Session,
    creator_id: int,
    recipient_ids: Sequence[int],
    title: str | None = None,
    only_admins_invite: bool = True,
) -> GroupChat:
    conversation = Conversation()
    session.add(conversation)
    session.flush()

    # Create moderation state for UMS (starts as SHADOWED)
    moderation_state = create_moderation(
        session=session,
        object_type=ModerationObjectType.GROUP_CHAT,
        object_id=conversation.id,
        creator_user_id=creator_id,
    )

    chat = GroupChat(
        conversation_id=conversation.id,
        title=title,
        creator_id=creator_id,
        is_dm=True if len(recipient_ids) == 1 else False,
        only_admins_invite=only_admins_invite,
        moderation_state_id=moderation_state.id,
    )
    session.add(chat)
    session.flush()

    creator_subscription = GroupChatSubscription(
        user_id=creator_id,
        group_chat_id=chat.conversation_id,
        role=GroupChatRole.admin,
    )
    session.add(creator_subscription)

    for uid in recipient_ids:
        session.add(
            GroupChatSubscription(
                user_id=uid,
                group_chat_id=chat.conversation_id,
                role=GroupChatRole.participant,
            )
        )

    return chat


def _get_message_subscription(session: Session, user_id: int, conversation_id: int) -> GroupChatSubscription:
    subscription = session.execute(
        select(GroupChatSubscription)
        .where(GroupChatSubscription.group_chat_id == conversation_id)
        .where(GroupChatSubscription.user_id == user_id)
        .where(GroupChatSubscription.left == None)
    ).scalar_one_or_none()

    return cast(GroupChatSubscription, subscription)


def _get_visible_message_subscription(
    session: Session, context: CouchersContext, conversation_id: int
) -> GroupChatSubscription:
    """Get subscription with visibility filtering"""
    subscription = session.execute(
        where_moderated_content_visible(
            select(GroupChatSubscription)
            .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
            .where(GroupChatSubscription.group_chat_id == conversation_id)
            .where(GroupChatSubscription.user_id == context.user_id)
            .where(GroupChatSubscription.left == None),
            context,
            GroupChat,
            is_list_operation=False,
        )
    ).scalar_one_or_none()

    return cast(GroupChatSubscription, subscription)


def _unseen_message_count(session: Session, subscription_id: int) -> int:
    query = (
        select(func.count())
        .select_from(Message)
        .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
        .where(GroupChatSubscription.id == subscription_id)
        .where(Message.id > GroupChatSubscription.last_seen_message_id)
    )
    return session.execute(query).scalar_one()


def _mute_info(subscription: GroupChatSubscription) -> conversations_pb2.MuteInfo:
    (muted, muted_until) = subscription.muted_display()
    return conversations_pb2.MuteInfo(
        muted=muted,
        muted_until=Timestamp_from_datetime(muted_until) if muted_until else None,
    )


class Conversations(conversations_pb2_grpc.ConversationsServicer):
    def ListGroupChats(
        self, request: conversations_pb2.ListGroupChatsReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.ListGroupChatsRes:
        page_size = request.number if request.number != 0 else DEFAULT_PAGINATION_LENGTH
        page_size = min(page_size, MAX_PAGE_SIZE)

        # select group chats where you have a subscription, and for each of
        # these, the latest message from them

        t = (
            select(
                GroupChatSubscription.group_chat_id.label("group_chat_id"),
                func.max(GroupChatSubscription.id).label("group_chat_subscriptions_id"),
                func.max(Message.id).label("message_id"),
            )
            .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
            .where(GroupChatSubscription.user_id == context.user_id)
            .where(Message.time >= GroupChatSubscription.joined)
            .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
            .where(
                or_(
                    to_bool(request.HasField("only_archived") == False),
                    GroupChatSubscription.is_archived == request.only_archived,
                )
            )
            .group_by(GroupChatSubscription.group_chat_id)
            .order_by(func.max(Message.id).desc())
            .subquery()
        )

        results = session.execute(
            where_moderated_content_visible(
                select(t, GroupChat, GroupChatSubscription, Message)
                .join(Message, Message.id == t.c.message_id)
                .join(GroupChatSubscription, GroupChatSubscription.id == t.c.group_chat_subscriptions_id)
                .join(GroupChat, GroupChat.conversation_id == t.c.group_chat_id)
                .where(or_(t.c.message_id < request.last_message_id, to_bool(request.last_message_id == 0)))
                .order_by(t.c.message_id.desc())
                .limit(page_size + 1),
                context,
                GroupChat,
                is_list_operation=True,
            )
        ).all()

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
                    unseen_message_count=_unseen_message_count(session, result.GroupChatSubscription.id),
                    last_seen_message_id=result.GroupChatSubscription.last_seen_message_id,
                    latest_message=_message_to_pb(result.Message) if result.Message else None,
                    mute_info=_mute_info(result.GroupChatSubscription),
                    can_message=_user_can_message(session, context, result.GroupChat),
                )
                for result in results[:page_size]
            ],
            last_message_id=(
                min(g.Message.id if g.Message else 1 for g in results[:page_size]) if len(results) > 0 else 0
            ),  # TODO
            no_more=len(results) <= page_size,
        )

    def GetGroupChat(
        self, request: conversations_pb2.GetGroupChatReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.GroupChat:
        result = session.execute(
            where_moderated_content_visible(
                select(GroupChat, GroupChatSubscription, Message)
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                .where(GroupChatSubscription.user_id == context.user_id)
                .where(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .where(Message.time >= GroupChatSubscription.joined)
                .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .order_by(Message.id.desc())
                .limit(1),
                context,
                GroupChat,
                is_list_operation=False,
            )
        ).one_or_none()

        if not result:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        return conversations_pb2.GroupChat(
            group_chat_id=result.GroupChat.conversation_id,
            title=result.GroupChat.title,
            member_user_ids=_get_visible_members_for_subscription(result.GroupChatSubscription),
            admin_user_ids=_get_visible_admins_for_subscription(result.GroupChatSubscription),
            only_admins_invite=result.GroupChat.only_admins_invite,
            is_dm=result.GroupChat.is_dm,
            created=Timestamp_from_datetime(result.GroupChat.conversation.created),
            unseen_message_count=_unseen_message_count(session, result.GroupChatSubscription.id),
            last_seen_message_id=result.GroupChatSubscription.last_seen_message_id,
            latest_message=_message_to_pb(result.Message) if result.Message else None,
            mute_info=_mute_info(result.GroupChatSubscription),
            can_message=_user_can_message(session, context, result.GroupChat),
            is_archived=result.GroupChatSubscription.is_archived,
        )

    def GetDirectMessage(
        self, request: conversations_pb2.GetDirectMessageReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.GroupChat:
        count = func.count(GroupChatSubscription.id).label("count")
        subquery = (
            select(GroupChatSubscription.group_chat_id)
            .where(
                or_(
                    GroupChatSubscription.user_id == context.user_id,
                    GroupChatSubscription.user_id == request.user_id,
                )
            )
            .where(GroupChatSubscription.left == None)
            .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
            .where(GroupChat.is_dm == True)
            .group_by(GroupChatSubscription.group_chat_id)
            .having(count == 2)
            .subquery()
        )

        result = session.execute(
            where_moderated_content_visible(
                select(subquery, GroupChat, GroupChatSubscription, Message)
                .join(subquery, subquery.c.group_chat_id == GroupChat.conversation_id)
                .join(Message, Message.conversation_id == GroupChat.conversation_id)
                .where(GroupChatSubscription.user_id == context.user_id)
                .where(GroupChatSubscription.group_chat_id == GroupChat.conversation_id)
                .where(Message.time >= GroupChatSubscription.joined)
                .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .order_by(Message.id.desc())
                .limit(1),
                context,
                GroupChat,
                is_list_operation=False,
            )
        ).one_or_none()

        if not result:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        return conversations_pb2.GroupChat(
            group_chat_id=result.GroupChat.conversation_id,
            title=result.GroupChat.title,
            member_user_ids=_get_visible_members_for_subscription(result.GroupChatSubscription),
            admin_user_ids=_get_visible_admins_for_subscription(result.GroupChatSubscription),
            only_admins_invite=result.GroupChat.only_admins_invite,
            is_dm=result.GroupChat.is_dm,
            created=Timestamp_from_datetime(result.GroupChat.conversation.created),
            unseen_message_count=_unseen_message_count(session, result.GroupChatSubscription.id),
            last_seen_message_id=result.GroupChatSubscription.last_seen_message_id,
            latest_message=_message_to_pb(result.Message) if result.Message else None,
            mute_info=_mute_info(result.GroupChatSubscription),
            can_message=_user_can_message(session, context, result.GroupChat),
            is_archived=result.GroupChatSubscription.is_archived,
        )

    def GetUpdates(
        self, request: conversations_pb2.GetUpdatesReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.GetUpdatesRes:
        results = (
            session.execute(
                where_moderated_content_visible(
                    select(Message)
                    .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                    .join(GroupChat, GroupChat.conversation_id == Message.conversation_id)
                    .where(GroupChatSubscription.user_id == context.user_id)
                    .where(Message.time >= GroupChatSubscription.joined)
                    .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                    .where(Message.id > request.newest_message_id)
                    .order_by(Message.id.asc())
                    .limit(DEFAULT_PAGINATION_LENGTH + 1),
                    context,
                    GroupChat,
                    is_list_operation=False,
                )
            )
            .scalars()
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

    def GetGroupChatMessages(
        self, request: conversations_pb2.GetGroupChatMessagesReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.GetGroupChatMessagesRes:
        page_size = request.number if request.number != 0 else DEFAULT_PAGINATION_LENGTH
        page_size = min(page_size, MAX_PAGE_SIZE)

        results = (
            session.execute(
                where_moderated_content_visible(
                    select(Message)
                    .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                    .join(GroupChat, GroupChat.conversation_id == Message.conversation_id)
                    .where(GroupChatSubscription.user_id == context.user_id)
                    .where(GroupChatSubscription.group_chat_id == request.group_chat_id)
                    .where(Message.time >= GroupChatSubscription.joined)
                    .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                    .where(or_(Message.id < request.last_message_id, to_bool(request.last_message_id == 0)))
                    .where(
                        or_(Message.id > GroupChatSubscription.last_seen_message_id, to_bool(request.only_unseen == 0))
                    )
                    .order_by(Message.id.desc())
                    .limit(page_size + 1),
                    context,
                    GroupChat,
                    is_list_operation=False,
                )
            )
            .scalars()
            .all()
        )

        return conversations_pb2.GetGroupChatMessagesRes(
            messages=[_message_to_pb(message) for message in results[:page_size]],
            last_message_id=results[-2].id if len(results) > 1 else 0,  # TODO
            no_more=len(results) <= page_size,
        )

    def MarkLastSeenGroupChat(
        self, request: conversations_pb2.MarkLastSeenGroupChatReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        subscription = _get_visible_message_subscription(session, context, request.group_chat_id)

        if not subscription:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        if not subscription.last_seen_message_id <= request.last_seen_message_id:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_unsee_messages")

        subscription.last_seen_message_id = request.last_seen_message_id

        return empty_pb2.Empty()

    def MuteGroupChat(
        self, request: conversations_pb2.MuteGroupChatReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        subscription = _get_visible_message_subscription(session, context, request.group_chat_id)

        if not subscription:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        if request.unmute:
            subscription.muted_until = DATETIME_MINUS_INFINITY
        elif request.forever:
            subscription.muted_until = DATETIME_INFINITY
        elif request.for_duration:
            duration = request.for_duration.ToTimedelta()
            if duration < timedelta(seconds=0):
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_mute_past")
            subscription.muted_until = now() + duration

        return empty_pb2.Empty()

    def SearchMessages(
        self, request: conversations_pb2.SearchMessagesReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.SearchMessagesRes:
        page_size = request.number if request.number != 0 else DEFAULT_PAGINATION_LENGTH
        page_size = min(page_size, MAX_PAGE_SIZE)

        results = (
            session.execute(
                where_moderated_content_visible(
                    select(Message)
                    .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                    .join(GroupChat, GroupChat.conversation_id == Message.conversation_id)
                    .where(GroupChatSubscription.user_id == context.user_id)
                    .where(Message.time >= GroupChatSubscription.joined)
                    .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                    .where(or_(Message.id < request.last_message_id, to_bool(request.last_message_id == 0)))
                    .where(Message.text.ilike(f"%{request.query}%"))
                    .order_by(Message.id.desc())
                    .limit(page_size + 1),
                    context,
                    GroupChat,
                    is_list_operation=True,
                )
            )
            .scalars()
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

    def CreateGroupChat(
        self, request: conversations_pb2.CreateGroupChatReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.GroupChat:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        if not user.has_completed_profile:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "incomplete_profile_send_message")

        recipient_user_ids = list(
            session.execute(
                select(User.id).where(users_visible(context)).where(User.id.in_(request.recipient_user_ids))
            )
            .scalars()
            .all()
        )

        # make sure all requested users are visible
        if len(recipient_user_ids) != len(request.recipient_user_ids):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "user_not_found")

        if not recipient_user_ids:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "no_recipients")

        if len(recipient_user_ids) != len(set(recipient_user_ids)):
            # make sure there's no duplicate users
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_recipients")

        if context.user_id in recipient_user_ids:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "cant_add_self")

        if len(recipient_user_ids) == 1:
            # can only have one DM at a time between any two users
            other_user_id = recipient_user_ids[0]

            # the following sql statement selects subscriptions that are DMs and have the same group_chat_id, and have
            # user_id either this user or the recipient user. If you find two subscriptions to the same DM group
            # chat, you know they already have a shared group chat
            count = func.count(GroupChatSubscription.id).label("count")
            if session.execute(
                where_moderated_content_visible(
                    select(count)
                    .where(
                        or_(
                            GroupChatSubscription.user_id == context.user_id,
                            GroupChatSubscription.user_id == other_user_id,
                        )
                    )
                    .where(GroupChatSubscription.left == None)
                    .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                    .where(GroupChat.is_dm == True)
                    .group_by(GroupChatSubscription.group_chat_id)
                    .having(count == 2),
                    context,
                    GroupChat,
                    is_list_operation=False,
                )
            ).scalar_one_or_none():
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "already_have_dm")

        # Check if user has been initiating chats excessively
        if process_rate_limits_and_check_abort(
            session=session, user_id=context.user_id, action=RateLimitAction.chat_initiation
        ):
            context.abort_with_error_code(
                grpc.StatusCode.RESOURCE_EXHAUSTED,
                "chat_initiation_rate_limit",
                substitutions={"hours": str(RATE_LIMIT_HOURS)},
            )

        group_chat = _create_chat(
            session,
            creator_id=context.user_id,
            recipient_ids=request.recipient_user_ids,
            title=request.title.value,
        )

        your_subscription = _get_message_subscription(session, context.user_id, group_chat.conversation_id)

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
            mute_info=_mute_info(your_subscription),
            can_message=True,
        )

    def SendMessage(
        self, request: conversations_pb2.SendMessageReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if request.text == "":
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_message")

        result = session.execute(
            where_moderated_content_visible(
                select(GroupChatSubscription, GroupChat)
                .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                .where(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .where(GroupChatSubscription.user_id == context.user_id)
                .where(GroupChatSubscription.left == None),
                context,
                GroupChat,
                is_list_operation=False,
            )
        ).one_or_none()
        if not result:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        subscription, group_chat = result._tuple()
        if not _user_can_message(session, context, group_chat):
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_message_in_chat")

        _add_message_to_subscription(session, subscription, message_type=MessageType.text, text=request.text)

        user_gender = session.execute(select(User.gender).where(User.id == context.user_id)).scalar_one()
        sent_messages_counter.labels(
            user_gender, "direct message" if subscription.group_chat.is_dm else "group chat"
        ).inc()

        return empty_pb2.Empty()

    def SendDirectMessage(
        self, request: conversations_pb2.SendDirectMessageReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.SendDirectMessageRes:
        user_id = context.user_id
        user = session.execute(select(User).where(User.id == user_id)).scalar_one()

        recipient_id = request.recipient_user_id

        if not user.has_completed_profile:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "incomplete_profile_send_message")

        if not recipient_id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "no_recipients")

        recipient_user_id = session.execute(
            select(User.id).where(users_visible(context)).where(User.id == recipient_id)
        ).scalar_one_or_none()

        if not recipient_user_id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "user_not_found")

        if user_id == recipient_id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "cant_add_self")

        if request.text == "":
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_message")

        # Look for an existing direct message (DM) chat between the two users
        dm_chat_ids = (
            select(GroupChatSubscription.group_chat_id)
            .where(GroupChatSubscription.user_id.in_([user_id, recipient_id]))
            .group_by(GroupChatSubscription.group_chat_id)
            .having(func.count(GroupChatSubscription.user_id) == 2)
        )

        chat = session.execute(
            where_moderated_content_visible(
                select(GroupChat)
                .where(GroupChat.is_dm == True)
                .where(GroupChat.conversation_id.in_(dm_chat_ids))
                .limit(1),
                context,
                GroupChat,
                is_list_operation=False,
            )
        ).scalar_one_or_none()

        if not chat:
            chat = _create_chat(session, user_id, [recipient_id])

        # Retrieve the sender's active subscription to the chat
        subscription = _get_message_subscription(session, user_id, chat.conversation_id)

        # Add the message to the conversation
        _add_message_to_subscription(session, subscription, message_type=MessageType.text, text=request.text)

        user_gender = session.execute(select(User.gender).where(User.id == user_id)).scalar_one()
        sent_messages_counter.labels(user_gender, "direct message").inc()

        session.flush()

        return conversations_pb2.SendDirectMessageRes(group_chat_id=chat.conversation_id)

    def EditGroupChat(
        self, request: conversations_pb2.EditGroupChatReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        subscription = _get_visible_message_subscription(session, context, request.group_chat_id)

        if not subscription:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        if subscription.role != GroupChatRole.admin:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "only_admin_can_edit")

        if request.HasField("title"):
            subscription.group_chat.title = request.title.value

        if request.HasField("only_admins_invite"):
            subscription.group_chat.only_admins_invite = request.only_admins_invite.value

        _add_message_to_subscription(session, subscription, message_type=MessageType.chat_edited)

        return empty_pb2.Empty()

    def MakeGroupChatAdmin(
        self, request: conversations_pb2.MakeGroupChatAdminReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if not session.execute(
            select(User).where(users_visible(context)).where(User.id == request.user_id)
        ).scalar_one_or_none():
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        your_subscription = _get_visible_message_subscription(session, context, request.group_chat_id)

        if not your_subscription:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        if your_subscription.role != GroupChatRole.admin:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "only_admin_can_make_admin")

        if request.user_id == context.user_id:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_make_self_admin")

        their_subscription = _get_message_subscription(session, request.user_id, request.group_chat_id)

        if not their_subscription:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_not_in_chat")

        if their_subscription.role != GroupChatRole.participant:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "already_admin")

        their_subscription.role = GroupChatRole.admin

        _add_message_to_subscription(
            session, your_subscription, message_type=MessageType.user_made_admin, target_id=request.user_id
        )

        return empty_pb2.Empty()

    def RemoveGroupChatAdmin(
        self, request: conversations_pb2.RemoveGroupChatAdminReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if not session.execute(
            select(User).where(users_visible(context)).where(User.id == request.user_id)
        ).scalar_one_or_none():
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        your_subscription = _get_visible_message_subscription(session, context, request.group_chat_id)

        if not your_subscription:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        if request.user_id == context.user_id:
            # Race condition!
            other_admins_count = session.execute(
                select(func.count())
                .select_from(GroupChatSubscription)
                .where(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .where(GroupChatSubscription.user_id != context.user_id)
                .where(GroupChatSubscription.role == GroupChatRole.admin)
                .where(GroupChatSubscription.left == None)
            ).scalar_one()
            if not other_admins_count > 0:
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_remove_last_admin")

        if your_subscription.role != GroupChatRole.admin:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "only_admin_can_remove_admin")

        their_subscription = session.execute(
            select(GroupChatSubscription)
            .where(GroupChatSubscription.group_chat_id == request.group_chat_id)
            .where(GroupChatSubscription.user_id == request.user_id)
            .where(GroupChatSubscription.left == None)
            .where(GroupChatSubscription.role == GroupChatRole.admin)
        ).scalar_one_or_none()

        if not their_subscription:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_not_admin")

        their_subscription.role = GroupChatRole.participant

        _add_message_to_subscription(
            session, your_subscription, message_type=MessageType.user_removed_admin, target_id=request.user_id
        )

        return empty_pb2.Empty()

    def InviteToGroupChat(
        self, request: conversations_pb2.InviteToGroupChatReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if not session.execute(
            select(User).where(users_visible(context)).where(User.id == request.user_id)
        ).scalar_one_or_none():
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

        result = session.execute(
            where_moderated_content_visible(
                select(GroupChatSubscription, GroupChat)
                .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                .where(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .where(GroupChatSubscription.user_id == context.user_id)
                .where(GroupChatSubscription.left == None),
                context,
                GroupChat,
                is_list_operation=False,
            )
        ).one_or_none()

        if not result:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        your_subscription, group_chat = result._tuple()

        if request.user_id == context.user_id:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_invite_self")

        if your_subscription.role != GroupChatRole.admin and your_subscription.group_chat.only_admins_invite:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "invite_permission_denied")

        if group_chat.is_dm:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_invite_to_dm")

        their_subscription = _get_message_subscription(session, request.user_id, request.group_chat_id)

        if their_subscription:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "already_in_chat")

        # TODO: race condition!

        subscription = GroupChatSubscription(
            user_id=request.user_id,
            group_chat_id=your_subscription.group_chat.conversation_id,
            role=GroupChatRole.participant,
        )
        session.add(subscription)

        _add_message_to_subscription(
            session, your_subscription, message_type=MessageType.user_invited, target_id=request.user_id
        )

        return empty_pb2.Empty()

    def RemoveGroupChatUser(
        self, request: conversations_pb2.RemoveGroupChatUserReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        """
        1. Get admin info and check it's correct
        2. Get user data, check it's correct and remove user
        """
        # Admin info
        your_subscription = _get_visible_message_subscription(session, context, request.group_chat_id)

        # if user info is missing
        if not your_subscription:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        # if user not admin
        if your_subscription.role != GroupChatRole.admin:
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "only_admin_can_remove_user")

        # if user wants to remove themselves
        if request.user_id == context.user_id:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_remove_self")

        # get user info
        their_subscription = _get_message_subscription(session, request.user_id, request.group_chat_id)

        # user not found
        if not their_subscription:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "user_not_in_chat")

        _add_message_to_subscription(
            session, your_subscription, message_type=MessageType.user_removed, target_id=request.user_id
        )

        their_subscription.left = func.now()

        return empty_pb2.Empty()

    def LeaveGroupChat(
        self, request: conversations_pb2.LeaveGroupChatReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        subscription = _get_visible_message_subscription(session, context, request.group_chat_id)

        if not subscription:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        if subscription.role == GroupChatRole.admin:
            other_admins_count = session.execute(
                select(func.count())
                .select_from(GroupChatSubscription)
                .where(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .where(GroupChatSubscription.user_id != context.user_id)
                .where(GroupChatSubscription.role == GroupChatRole.admin)
                .where(GroupChatSubscription.left == None)
            ).scalar_one()
            participants_count = session.execute(
                select(func.count())
                .select_from(GroupChatSubscription)
                .where(GroupChatSubscription.group_chat_id == request.group_chat_id)
                .where(GroupChatSubscription.user_id != context.user_id)
                .where(GroupChatSubscription.role == GroupChatRole.participant)
                .where(GroupChatSubscription.left == None)
            ).scalar_one()
            if not (other_admins_count > 0 or participants_count == 0):
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "last_admin_cant_leave")

        _add_message_to_subscription(session, subscription, message_type=MessageType.user_left)

        subscription.left = func.now()

        return empty_pb2.Empty()
