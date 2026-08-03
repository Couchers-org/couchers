import logging
from collections.abc import Sequence
from datetime import datetime, timedelta
from typing import Any, cast

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import ColumnElement, Select, select, union_all, update
from sqlalchemy.orm import Session, contains_eager
from sqlalchemy.sql import and_, case, func, literal, not_, or_

from couchers.constants import DATETIME_INFINITY, DATETIME_MINUS_INFINITY
from couchers.context import CouchersContext, make_background_user_context, make_notification_user_context
from couchers.crypto import decrypt_page_token, encrypt_page_token
from couchers.db import session_scope
from couchers.event_log import log_event
from couchers.helpers.completed_profile import has_completed_profile
from couchers.helpers.host_requests import is_hosting_party, is_public_trip_offer_party, is_surfing_party
from couchers.jobs.enqueue import queue_job
from couchers.metrics import sent_messages_counter
from couchers.models import (
    Conversation,
    GroupChat,
    GroupChatRole,
    GroupChatSubscription,
    HostRequest,
    Message,
    MessageType,
    ModerationObjectType,
    RateLimitAction,
    User,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.moderation.utils import create_moderation
from couchers.notifications.notify import mark_notifications_seen, notify
from couchers.proto import conversations_pb2, conversations_pb2_grpc, messages_pb2, notification_data_pb2, requests_pb2
from couchers.proto.internal import jobs_pb2
from couchers.rate_limits.check import process_rate_limits_and_check_abort
from couchers.rate_limits.definitions import RATE_LIMIT_HOURS
from couchers.servicers.api import user_model_to_pb
from couchers.servicers.requests import hostrequeststatus2api
from couchers.sql import to_bool, users_visible, where_moderated_content_visible, where_users_column_visible
from couchers.utils import Timestamp_from_datetime, date_to_api, get_coordinates, now

# topic actions whose notifications are marked seen alongside a host request being read
_HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS = [
    NotificationTopicAction.host_request__create,
    NotificationTopicAction.host_request__accept,
    NotificationTopicAction.host_request__reject,
    NotificationTopicAction.host_request__confirm,
    NotificationTopicAction.host_request__cancel,
    NotificationTopicAction.host_request__message,
    NotificationTopicAction.host_request__missed_messages,
    NotificationTopicAction.host_request__reminder,
]

logger = logging.getLogger(__name__)

# TODO: Still needs custom pagination: GetUpdates
DEFAULT_PAGINATION_LENGTH = 20
MAX_PAGE_SIZE = 50

# host-request thread categories (the roles); the rest is CHATS
_HOST_REQUEST_THREAD_CATEGORIES = frozenset(
    {
        conversations_pb2.MESSAGE_THREAD_CATEGORY_HOSTING,
        conversations_pb2.MESSAGE_THREAD_CATEGORY_SURFING,
        conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS,
    }
)
_ALL_THREAD_CATEGORIES = _HOST_REQUEST_THREAD_CATEGORIES | {conversations_pb2.MESSAGE_THREAD_CATEGORY_CHATS}

# discriminator on the unioned candidate rows, telling us which table a conversation_id came from
_KIND_GROUP_CHAT = "group_chat"
_KIND_HOST_REQUEST = "host_request"


def _message_to_pb(message: Message) -> messages_pb2.Message:
    """
    Turns the given message to a protocol buffer
    """
    if message.is_normal_message:
        return messages_pb2.Message(
            message_id=message.id,
            author_user_id=message.author_id,
            time=Timestamp_from_datetime(message.time),
            text=messages_pb2.MessageContentText(text=message.text),
        )
    else:
        return messages_pb2.Message(
            message_id=message.id,
            author_user_id=message.author_id,
            time=Timestamp_from_datetime(message.time),
            chat_created=(
                messages_pb2.MessageContentChatCreated() if message.message_type == MessageType.chat_created else None
            ),
            chat_edited=(
                messages_pb2.MessageContentChatEdited() if message.message_type == MessageType.chat_edited else None
            ),
            user_invited=(
                messages_pb2.MessageContentUserInvited(target_user_id=message.target_id)
                if message.message_type == MessageType.user_invited
                else None
            ),
            user_left=(
                messages_pb2.MessageContentUserLeft() if message.message_type == MessageType.user_left else None
            ),
            user_made_admin=(
                messages_pb2.MessageContentUserMadeAdmin(target_user_id=message.target_id)
                if message.message_type == MessageType.user_made_admin
                else None
            ),
            user_removed_admin=(
                messages_pb2.MessageContentUserRemovedAdmin(target_user_id=message.target_id)
                if message.message_type == MessageType.user_removed_admin
                else None
            ),
            group_chat_user_removed=(
                messages_pb2.MessageContentUserRemoved(target_user_id=message.target_id)
                if message.message_type == MessageType.user_removed
                else None
            ),
            host_request_status_changed=(
                messages_pb2.MessageContentHostRequestStatusChanged(
                    status=hostrequeststatus2api[message.host_request_status_target]  # type: ignore[index]
                )
                if message.message_type == MessageType.host_request_status_changed
                else None
            ),
        )


# TODO(#7722): remove with the legacy conversations endpoints; the ListMessageThreads path filters
# preloaded subscriptions with _member_visible_to_viewer instead
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


def _member_visible_to_viewer(subscription: GroupChatSubscription, viewer_left: datetime | None) -> bool:
    """
    Whether `subscription`'s user is visible to a viewer whose own subscription left the chat at
    `viewer_left` (None if the viewer is still in the chat). Same rule as
    _get_visible_members_for_subscription / _get_visible_admins_for_subscription, expressed as a pure
    predicate so a list of preloaded subscriptions can be filtered without a per-chat query.
    """
    if viewer_left is None:
        # still in the chat: see everyone with a current subscription
        return subscription.left is None
    # left the chat: see everyone who was in it at the moment the viewer left
    return subscription.joined <= viewer_left and (subscription.left is None or subscription.left >= viewer_left)


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
                        make_notification_user_context(user_id=user_id),
                    ),
                    text=message.text,
                    group_chat_id=message.conversation_id,
                    group_chat_title=group_chat.title or None,
                    # unseen_count irrelevant for this notification
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
        object_type=ModerationObjectType.group_chat,
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


def _host_request_thread_to_pb(
    host_request: HostRequest,
    conversation: Conversation,
    message: Message | None,
    user_id: int,
    unseen_message_count: int,
) -> requests_pb2.HostRequest:
    """
    Build the HostRequest protobuf for the unified thread list. Mirrors
    ListHostRequests (batched, so no per-request queries like host_request_to_pb),
    with the same semantics: surfer = initiator, host = recipient, even for
    public-trip offers.
    """
    # need_host_request_feedback is omitted: only the detail view (GetHostRequest) reads it.
    # TODO(#9347): its recipient-based logic is wrong for public-trip offers, where the recipient is
    # the traveller rather than the host — same for the response-rate observation.
    lat, lng = get_coordinates(host_request.hosting_location)
    return requests_pb2.HostRequest(
        host_request_id=host_request.conversation_id,
        surfer_user_id=host_request.initiator_user_id,
        host_user_id=host_request.recipient_user_id,
        status=hostrequeststatus2api[host_request.status],
        created=Timestamp_from_datetime(conversation.created),
        from_date=date_to_api(host_request.from_date),
        to_date=date_to_api(host_request.to_date),
        last_seen_message_id=(
            host_request.initiator_last_seen_message_id
            if host_request.initiator_user_id == user_id
            else host_request.recipient_last_seen_message_id
        ),
        latest_message=_message_to_pb(message) if message else None,
        hosting_city=host_request.hosting_city,
        hosting_lat=lat,
        hosting_lng=lng,
        hosting_radius=host_request.hosting_radius,
        is_archived=(
            host_request.is_initiator_archived
            if host_request.initiator_user_id == user_id
            else host_request.is_recipient_archived
        ),
        public_trip_id=host_request.public_trip_id,
        unseen_message_count=unseen_message_count,
    )


def _group_chat_candidate_query(
    context: CouchersContext, only_archived: bool | None, unread: bool
) -> Select[tuple[int, int, str]]:
    """
    One row per group chat (including DMs) the viewer should see, carrying only what paging needs: the
    conversation id, the id of its newest message, and a tag marking the row as a group chat.

    ListMessageThreads unions these rows with the host-request ones and orders the result by newest
    message — that's what lets one cursor page through both kinds as a single list. Only ids come back
    here; the full protobufs are built afterwards, for one page's worth of rows.
    """
    latest_by_group_chat = (
        select(
            GroupChatSubscription.group_chat_id.label("conversation_id"),
            func.max(Message.id).label("latest_message_id"),
        )
        .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
        .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
        .where(GroupChatSubscription.user_id == context.user_id)
        .where(Message.time >= GroupChatSubscription.joined)
        .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
        .group_by(GroupChatSubscription.group_chat_id)
    )
    if only_archived is not None:
        latest_by_group_chat = latest_by_group_chat.where(GroupChatSubscription.is_archived == only_archived)
    if unread:
        # restrict to chats with at least one message newer than the user's last-seen
        latest_by_group_chat = latest_by_group_chat.where(Message.id > GroupChatSubscription.last_seen_message_id)
    visible_group_chats = where_moderated_content_visible(
        latest_by_group_chat, context, GroupChat, is_list_operation=True
    ).subquery()

    return select(
        visible_group_chats.c.conversation_id.label("conversation_id"),
        visible_group_chats.c.latest_message_id.label("latest_message_id"),
        literal(_KIND_GROUP_CHAT).label("kind"),
    )


def _host_request_candidate_query(
    context: CouchersContext, role_filter: ColumnElement[bool], only_archived: bool | None, unread: bool
) -> Select[tuple[int, int, str]]:
    """
    The host-request half of the same idea as _group_chat_candidate_query: the same three columns for
    host requests and public-trip offers, so the two can be unioned and paged together.

    role_filter decides which requests belong in this view — the ones the viewer is hosting, the ones
    they're surfing, or offers on their public trips (see _host_request_role_filter). Requests the
    viewer shouldn't see are dropped here too: ones involving deleted or blocked users, ones hidden by
    moderation, and — when the caller asks for it — archived or already-read ones.
    """
    viewer_last_seen_message_id = case(
        (HostRequest.initiator_user_id == context.user_id, HostRequest.initiator_last_seen_message_id),
        else_=HostRequest.recipient_last_seen_message_id,
    )
    candidate_query = (
        select(
            HostRequest.conversation_id.label("conversation_id"),
            func.max(Message.id).label("latest_message_id"),
            literal(_KIND_HOST_REQUEST).label("kind"),
        )
        .join(Message, Message.conversation_id == HostRequest.conversation_id)
        .where(role_filter)
        .group_by(HostRequest.conversation_id)
    )
    if only_archived is not None:
        candidate_query = candidate_query.where(
            or_(
                and_(
                    HostRequest.initiator_user_id == context.user_id,
                    HostRequest.is_initiator_archived == only_archived,
                ),
                and_(
                    HostRequest.recipient_user_id == context.user_id,
                    HostRequest.is_recipient_archived == only_archived,
                ),
            )
        )
    if unread:
        candidate_query = candidate_query.having(func.max(Message.id) > viewer_last_seen_message_id)
    candidate_query = where_users_column_visible(candidate_query, context, HostRequest.initiator_user_id)
    candidate_query = where_users_column_visible(candidate_query, context, HostRequest.recipient_user_id)
    candidate_query = where_moderated_content_visible(candidate_query, context, HostRequest, is_list_operation=True)
    return candidate_query


def _host_request_role_filter(context: CouchersContext, categories: set[int]) -> ColumnElement[bool]:
    """
    A WHERE condition matching the host requests in the given categories, OR'd together — so asking
    for hosting and surfing returns both.

    MY_PUBLIC_TRIPS is a subset of SURFING, so requesting both is redundant but harmless; grouping by
    conversation dedupes.
    """
    viewer_id = context.user_id
    clauses = []
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_HOSTING in categories:
        clauses.append(is_hosting_party(viewer_id))
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_SURFING in categories:
        clauses.append(is_surfing_party(viewer_id))
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS in categories:
        clauses.append(is_public_trip_offer_party(viewer_id))
    return or_(*clauses)


def _resolve_thread_categories(context: CouchersContext, requested_categories: Sequence[int]) -> set[int]:
    """
    Resolve a request's category list into a concrete set: an empty list means all categories,
    UNSPECIFIED is rejected, and MY_PUBLIC_TRIPS is dropped when the public-trips flag is off (offers
    still show under SURFING / all, as before).
    """
    categories = set(requested_categories)
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_UNSPECIFIED in categories:
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_thread_category")
    if not categories:
        categories = set(_ALL_THREAD_CATEGORIES)
    if not context.get_boolean_value("public_trips_enabled", False):
        categories.discard(conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS)
    return categories


def _thread_candidate_queries(
    context: CouchersContext,
    request: conversations_pb2.ListMessageThreadsReq | conversations_pb2.MarkAllThreadsSeenReq,
) -> tuple[Select[tuple[int, int, str]] | None, Select[tuple[int, int, str]] | None]:
    """
    Resolve a ListMessageThreads / MarkAllThreadsSeen request into its candidate (conversation_id,
    latest_message_id, kind) subqueries — one for group chats, one for host requests, each None if
    that kind isn't included. Callers consume them differently (union for pagination vs per-kind
    updates), but the parsing and query building is shared here.
    """
    categories = _resolve_thread_categories(context, request.categories)
    only_archived = request.only_archived if request.HasField("only_archived") else None
    only_unread = request.only_unread
    chat_query = (
        _group_chat_candidate_query(context, only_archived, only_unread)
        if conversations_pb2.MESSAGE_THREAD_CATEGORY_CHATS in categories
        else None
    )
    host_request_categories = categories & _HOST_REQUEST_THREAD_CATEGORIES
    host_request_query = (
        _host_request_candidate_query(
            context, _host_request_role_filter(context, host_request_categories), only_archived, only_unread
        )
        if host_request_categories
        else None
    )
    return chat_query, host_request_query


def _build_group_chats_pb(
    session: Session,
    context: CouchersContext,
    group_chat_ids: list[int],
    latest_message_id_by_conversation: dict[int, int],
) -> dict[int, conversations_pb2.GroupChat]:
    """Build GroupChat protobufs (with unseen counts) for a page of group-chat ids.

    Latest-message ids come from the caller's candidate pass, so they're reused rather than
    recomputed here (mirrors _build_host_request_threads_pb).
    """
    if not group_chat_ids:
        return {}

    # all subscriptions for the page's chats in one query: members/admins are computed in Python
    # (instead of two lazy queries per chat), and it also gives us the viewer's own subscription
    # without a group-wise-max subquery
    subscriptions_by_group_chat: dict[int, list[GroupChatSubscription]] = {}
    for subscription in (
        session.execute(
            select(GroupChatSubscription)
            .where(GroupChatSubscription.group_chat_id.in_(group_chat_ids))
            .order_by(GroupChatSubscription.id)
        )
        .scalars()
        .all()
    ):
        subscriptions_by_group_chat.setdefault(subscription.group_chat_id, []).append(subscription)

    # the viewer's current subscription per chat = their highest-id subscription (handles rejoin)
    viewer_subscription_by_group_chat: dict[int, GroupChatSubscription] = {}
    for group_chat_id, subscriptions in subscriptions_by_group_chat.items():
        viewer_subscriptions = [s for s in subscriptions if s.user_id == context.user_id]
        if viewer_subscriptions:
            viewer_subscription_by_group_chat[group_chat_id] = viewer_subscriptions[-1]

    # the group chat + its latest message (id already known) + conversation, in one query
    latest_message_ids = [latest_message_id_by_conversation[group_chat_id] for group_chat_id in group_chat_ids]
    row_by_group_chat = {
        row.GroupChat.conversation_id: row
        for row in session.execute(
            select(GroupChat, Message)
            .join(Message, Message.conversation_id == GroupChat.conversation_id)
            .join(Conversation, Conversation.id == GroupChat.conversation_id)
            .where(GroupChat.conversation_id.in_(group_chat_ids))
            .where(Message.id.in_(latest_message_ids))
            .options(contains_eager(GroupChat.conversation))
        ).all()
    }

    viewer_subscription_ids = [subscription.id for subscription in viewer_subscription_by_group_chat.values()]
    unseen_count_by_subscription: dict[int, int] = dict(
        session.execute(  # type: ignore[arg-type]
            select(GroupChatSubscription.id, func.count(Message.id))
            .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
            .where(GroupChatSubscription.id.in_(viewer_subscription_ids))
            .where(Message.id > GroupChatSubscription.last_seen_message_id)
            .group_by(GroupChatSubscription.id)
        ).all()
    )

    result: dict[int, conversations_pb2.GroupChat] = {}
    for group_chat_id in group_chat_ids:
        row = row_by_group_chat.get(group_chat_id)
        viewer_subscription = viewer_subscription_by_group_chat.get(group_chat_id)
        if row is None or viewer_subscription is None:
            continue
        group_chat = row.GroupChat
        visible_members = [
            subscription
            for subscription in subscriptions_by_group_chat.get(group_chat_id, [])
            if _member_visible_to_viewer(subscription, viewer_subscription.left)
        ]
        result[group_chat_id] = conversations_pb2.GroupChat(
            group_chat_id=group_chat_id,
            title=group_chat.title,  # TODO: proper title for DMs, etc
            member_user_ids=[subscription.user_id for subscription in visible_members],
            admin_user_ids=[
                subscription.user_id for subscription in visible_members if subscription.role == GroupChatRole.admin
            ],
            only_admins_invite=group_chat.only_admins_invite,
            is_dm=group_chat.is_dm,
            created=Timestamp_from_datetime(group_chat.conversation.created),
            unseen_message_count=unseen_count_by_subscription.get(viewer_subscription.id, 0),
            last_seen_message_id=viewer_subscription.last_seen_message_id,
            latest_message=_message_to_pb(row.Message) if row.Message else None,
            mute_info=_mute_info(viewer_subscription),
            # can_message omitted: list view doesn't use it, and it's a DM-only extra query
            is_archived=viewer_subscription.is_archived,
        )
    return result


def _build_host_request_threads_pb(
    session: Session,
    context: CouchersContext,
    host_request_ids: list[int],
    latest_message_id_by_conversation: dict[int, int],
) -> dict[int, requests_pb2.HostRequest]:
    """Build HostRequest protobufs (with unseen counts) for a page of host-request threads."""
    if not host_request_ids:
        return {}
    host_request_rows = session.execute(
        select(HostRequest, Conversation)
        .join(Conversation, Conversation.id == HostRequest.conversation_id)
        .where(HostRequest.conversation_id.in_(host_request_ids))
    ).all()

    latest_message_ids = [latest_message_id_by_conversation[conversation_id] for conversation_id in host_request_ids]
    message_by_id = {
        message.id: message
        for message in session.execute(select(Message).where(Message.id.in_(latest_message_ids))).scalars().all()
    }

    viewer_last_seen_message_id = case(
        (HostRequest.initiator_user_id == context.user_id, HostRequest.initiator_last_seen_message_id),
        else_=HostRequest.recipient_last_seen_message_id,
    )
    unseen_count_by_conversation: dict[int, int] = dict(
        session.execute(  # type: ignore[arg-type]
            select(HostRequest.conversation_id, func.count(Message.id))
            .join(Message, Message.conversation_id == HostRequest.conversation_id)
            .where(HostRequest.conversation_id.in_(host_request_ids))
            .where(Message.id > viewer_last_seen_message_id)
            .group_by(HostRequest.conversation_id)
        ).all()
    )
    return {
        row.HostRequest.conversation_id: _host_request_thread_to_pb(
            row.HostRequest,
            row.Conversation,
            message_by_id.get(latest_message_id_by_conversation[row.HostRequest.conversation_id]),
            context.user_id,
            unseen_count_by_conversation.get(row.HostRequest.conversation_id, 0),
        )
        for row in host_request_rows
    }


class Conversations(conversations_pb2_grpc.ConversationsServicer):
    # TODO(#7722): remove after FE migrates to ListMessageThreads
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
                .join(Conversation, Conversation.id == GroupChat.conversation_id)
                .options(contains_eager(GroupChat.conversation))
                .where(or_(t.c.message_id < request.last_message_id, to_bool(request.last_message_id == 0)))
                .order_by(t.c.message_id.desc())
                .limit(page_size + 1),
                context,
                GroupChat,
                is_list_operation=True,
            )
        ).all()

        # Batch: unseen message counts in one query instead of N individual queries
        subscription_ids = [r.GroupChatSubscription.id for r in results[:page_size]]
        unseen_counts: dict[int, int] = dict(
            session.execute(  # type: ignore[arg-type]
                select(GroupChatSubscription.id, func.count(Message.id))
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .where(GroupChatSubscription.id.in_(subscription_ids))
                .where(Message.id > GroupChatSubscription.last_seen_message_id)
                .group_by(GroupChatSubscription.id)
            ).all()
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
                    unseen_message_count=unseen_counts.get(result.GroupChatSubscription.id, 0),
                    last_seen_message_id=result.GroupChatSubscription.last_seen_message_id,
                    latest_message=_message_to_pb(result.Message) if result.Message else None,
                    mute_info=_mute_info(result.GroupChatSubscription),
                    can_message=_user_can_message(session, context, result.GroupChat),
                    is_archived=result.GroupChatSubscription.is_archived,
                )
                for result in results[:page_size]
            ],
            last_message_id=(
                min(g.Message.id if g.Message else 1 for g in results[:page_size]) if len(results) > 0 else 0
            ),  # TODO
            no_more=len(results) <= page_size,
        )

    def ListMessageThreads(
        self, request: conversations_pb2.ListMessageThreadsReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.ListMessageThreadsRes:
        chat_query, host_request_query = _thread_candidate_queries(context, request)
        candidate_queries = [query for query in (chat_query, host_request_query) if query is not None]

        # nothing to include: only reachable when MY_PUBLIC_TRIPS is requested alone and the
        # public-trips flag is off. TODO: remove once public trips is live (flag always on)
        if not candidate_queries:
            return conversations_pb2.ListMessageThreadsRes()

        page_size = request.page_size if request.page_size != 0 else DEFAULT_PAGINATION_LENGTH
        page_size = min(page_size, MAX_PAGE_SIZE)

        # Union the candidate subqueries (each yielding conversation_id, latest_message_id, kind) so a
        # single global cursor (Message.id) can paginate across all kinds.
        combined_candidates = (
            candidate_queries[0] if len(candidate_queries) == 1 else union_all(*candidate_queries)
        ).subquery()
        page_query = select(
            combined_candidates.c.conversation_id,
            combined_candidates.c.latest_message_id,
            combined_candidates.c.kind,
        )
        if request.page_token:
            page_query = page_query.where(
                combined_candidates.c.latest_message_id < int(decrypt_page_token(request.page_token))
            )
        page_query = page_query.order_by(combined_candidates.c.latest_message_id.desc()).limit(page_size + 1)
        candidate_rows = session.execute(page_query).all()

        page_rows = candidate_rows[:page_size]
        has_more = len(candidate_rows) > page_size
        # rows are ordered by latest_message_id desc, so the last one on the page is the cursor
        next_page_token = encrypt_page_token(str(page_rows[-1].latest_message_id)) if has_more else ""

        latest_message_id_by_conversation = {row.conversation_id: row.latest_message_id for row in page_rows}
        group_chat_ids = [row.conversation_id for row in page_rows if row.kind == _KIND_GROUP_CHAT]
        host_request_ids = [row.conversation_id for row in page_rows if row.kind == _KIND_HOST_REQUEST]

        # Hydrate each kind in a batch, then re-assemble in the paginated order.
        group_chats_by_id = _build_group_chats_pb(session, context, group_chat_ids, latest_message_id_by_conversation)
        host_request_threads_by_id = _build_host_request_threads_pb(
            session, context, host_request_ids, latest_message_id_by_conversation
        )

        threads = []
        for row in page_rows:
            if row.kind == _KIND_GROUP_CHAT:
                group_chat = group_chats_by_id.get(row.conversation_id)
                if group_chat is not None:
                    threads.append(conversations_pb2.MessageThread(group_chat=group_chat))
            else:
                host_request_thread = host_request_threads_by_id.get(row.conversation_id)
                if host_request_thread is not None:
                    threads.append(conversations_pb2.MessageThread(host_request=host_request_thread))

        return conversations_pb2.ListMessageThreadsRes(threads=threads, next_page_token=next_page_token)

    def MarkAllThreadsSeen(
        self, request: conversations_pb2.MarkAllThreadsSeenReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        chat_query, host_request_query = _thread_candidate_queries(context, request)

        # (topic actions, keys) groups for the notifications owned by the threads we mark seen
        notification_groups: list[tuple[Sequence[NotificationTopicAction], Sequence[str]]] = []

        if chat_query is not None:
            # correlated, so it resolves per row of the update: every subscription advances to its own
            # chat's newest message without listing them out
            latest_message_id = (
                select(func.max(Message.id))
                .where(Message.conversation_id == GroupChatSubscription.group_chat_id)
                .scalar_subquery()
            )
            marked_group_chat_ids = (
                session.execute(
                    update(GroupChatSubscription)
                    .where(GroupChatSubscription.user_id == context.user_id)
                    # candidates can include chats the viewer has left (with historical messages); only
                    # chats the viewer is still in get advanced / marked seen, as before
                    .where(GroupChatSubscription.left == None)
                    .where(GroupChatSubscription.group_chat_id.in_(select(chat_query.subquery().c.conversation_id)))
                    .where(GroupChatSubscription.last_seen_message_id < latest_message_id)
                    .values(last_seen_message_id=latest_message_id)
                    .returning(GroupChatSubscription.group_chat_id)
                    .execution_options(synchronize_session=False)
                )
                .scalars()
                .all()
            )
            if marked_group_chat_ids:
                notification_groups.append(
                    (
                        [NotificationTopicAction.chat__message],
                        [str(group_chat_id) for group_chat_id in marked_group_chat_ids],
                    )
                )
                # chat__missed_messages is a summary across all chats, so it's keyed with an empty
                # string rather than a chat id (same as MarkLastSeenGroupChat)
                notification_groups.append(([NotificationTopicAction.chat__missed_messages], [""]))

        if host_request_query is not None:
            # the viewer's last-seen column depends on their role, so one update per role
            # (a user is never both initiator and recipient of the same request, so these are disjoint)
            candidate_ids = select(host_request_query.subquery().c.conversation_id)
            latest_message_id = (
                select(func.max(Message.id))
                .where(Message.conversation_id == HostRequest.conversation_id)
                .scalar_subquery()
            )
            marked_conversation_ids: list[int] = []
            for user_id_column, last_seen_column in (
                (HostRequest.initiator_user_id, HostRequest.initiator_last_seen_message_id),
                (HostRequest.recipient_user_id, HostRequest.recipient_last_seen_message_id),
            ):
                marked_conversation_ids += (
                    session.execute(
                        update(HostRequest)
                        .where(user_id_column == context.user_id)
                        .where(HostRequest.conversation_id.in_(candidate_ids))
                        .where(last_seen_column < latest_message_id)
                        .values({last_seen_column: latest_message_id})
                        .returning(HostRequest.conversation_id)
                        .execution_options(synchronize_session=False)
                    )
                    .scalars()
                    .all()
                )
            if marked_conversation_ids:
                notification_groups.append(
                    (
                        _HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS,
                        [str(conversation_id) for conversation_id in marked_conversation_ids],
                    )
                )

        mark_notifications_seen(session, user_id=context.user_id, topic_actions_and_keys=notification_groups)

        return empty_pb2.Empty()

    def GetGroupChat(
        self, request: conversations_pb2.GetGroupChatReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.GroupChat:
        result = session.execute(
            where_moderated_content_visible(
                select(GroupChat, GroupChatSubscription, Message)
                .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
                .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
                .join(Conversation, Conversation.id == GroupChat.conversation_id)
                .options(contains_eager(GroupChat.conversation))
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
                .join(Conversation, Conversation.id == GroupChat.conversation_id)
                .options(contains_eager(GroupChat.conversation))
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

        mark_notifications_seen(
            session,
            user_id=context.user_id,
            topic_actions_and_keys=[
                ([NotificationTopicAction.chat__message], [str(request.group_chat_id)]),
                # chat__missed_messages is a summary across all chats, so it's keyed with an empty string
                # rather than a chat id: reading any chat counts as acting on it, and it gets marked seen
                ([NotificationTopicAction.chat__missed_messages], [""]),
            ],
        )

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

    def SetGroupChatArchiveStatus(
        self, request: conversations_pb2.SetGroupChatArchiveStatusReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.SetGroupChatArchiveStatusRes:
        subscription = _get_visible_message_subscription(session, context, request.group_chat_id)

        if not subscription:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

        subscription.is_archived = request.is_archived

        return conversations_pb2.SetGroupChatArchiveStatusRes(
            group_chat_id=request.group_chat_id,
            is_archived=request.is_archived,
        )

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
        if not has_completed_profile(session, user):
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
                "chat_initiation_rate_limit2",
                substitutions={"count": RATE_LIMIT_HOURS},
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

        log_event(
            context,
            session,
            "group_chat.created",
            {
                "group_chat_id": group_chat.conversation_id,
                "is_dm": group_chat.is_dm,
                "recipient_count": len(request.recipient_user_ids),
            },
        )

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
        log_event(
            context,
            session,
            "message.sent",
            {"group_chat_id": request.group_chat_id, "is_dm": subscription.group_chat.is_dm},
        )

        return empty_pb2.Empty()

    def SendDirectMessage(
        self, request: conversations_pb2.SendDirectMessageReq, context: CouchersContext, session: Session
    ) -> conversations_pb2.SendDirectMessageRes:
        user_id = context.user_id
        user = session.execute(select(User).where(User.id == user_id)).scalar_one()

        recipient_id = request.recipient_user_id

        if not has_completed_profile(session, user):
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
            if process_rate_limits_and_check_abort(
                session=session, user_id=user_id, action=RateLimitAction.chat_initiation
            ):
                context.abort_with_error_code(
                    grpc.StatusCode.RESOURCE_EXHAUSTED,
                    "chat_initiation_rate_limit2",
                    substitutions={"count": RATE_LIMIT_HOURS},
                )
            chat = _create_chat(session, user_id, [recipient_id])

        # Retrieve the sender's active subscription to the chat
        subscription = _get_message_subscription(session, user_id, chat.conversation_id)

        # Add the message to the conversation
        _add_message_to_subscription(session, subscription, message_type=MessageType.text, text=request.text)

        user_gender = session.execute(select(User.gender).where(User.id == user_id)).scalar_one()
        sent_messages_counter.labels(user_gender, "direct message").inc()
        log_event(
            context,
            session,
            "message.sent",
            {"group_chat_id": chat.conversation_id, "is_dm": True, "recipient_id": recipient_id},
        )

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
