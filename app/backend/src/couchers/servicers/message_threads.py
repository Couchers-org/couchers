"""
The unified message thread list (Conversations.ListMessageThreads / MarkAllThreadsSeen): one
paginated list of all the viewer's conversations — group chats, DMs, host requests and public-trip
offers — ordered by latest message.

Each kind of conversation has its own select query, yielding one row per thread carrying only
(conversation_id, latest_message_id, kind). ListMessageThreads unions them, so a single cursor on
latest_message_id pages through all kinds as one list, then hydrates the page's worth of rows into
protobufs, batched per kind. MarkAllThreadsSeen consumes the same queries as UPDATE targets.
"""

import logging
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import ColumnElement, Select, select, union_all, update
from sqlalchemy.orm import Session, contains_eager
from sqlalchemy.sql import and_, func, literal, or_

from couchers.context import CouchersContext
from couchers.crypto import decrypt_page_token, encrypt_page_token
from couchers.helpers.group_chats import is_newest_subscription, is_unseen, mute_info, was_subscribed_at
from couchers.helpers.host_requests import (
    HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS,
    has_unseen_host_request_messages,
    is_hosting_party,
    is_public_trip_offer_recipient,
    is_surfing_party,
    viewer_last_seen_message_id,
)
from couchers.helpers.messages import hostrequeststatus2api, message_to_pb
from couchers.models import (
    Conversation,
    GroupChat,
    GroupChatRole,
    GroupChatSubscription,
    HostRequest,
    Message,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.notify import mark_notifications_seen
from couchers.proto import conversations_pb2, requests_pb2
from couchers.sql import to_bool, where_moderated_content_visible, where_users_column_visible
from couchers.utils import Timestamp_from_datetime, date_to_api, get_coordinates

logger = logging.getLogger(__name__)

DEFAULT_PAGINATION_LENGTH = 20
MAX_PAGE_SIZE = 50

# discriminator on the unioned rows, telling us which table a conversation_id came from
_KIND_GROUP_CHAT = "group_chat"
_KIND_HOST_REQUEST = "host_request"


@dataclass(frozen=True)
class _ThreadFilters:
    categories: frozenset[int]
    only_archived: bool | None
    only_unread: bool


def _resolve_thread_filters(
    context: CouchersContext,
    request: conversations_pb2.ListMessageThreadsReq | conversations_pb2.MarkAllThreadsSeenReq,
) -> _ThreadFilters:
    """
    An empty category list means all categories. MY_PUBLIC_TRIPS is dropped when the public-trips
    flag is off; those offers still show up under SURFING.
    """
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_UNSPECIFIED in request.categories:
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_thread_category")
    categories = frozenset(
        request.categories
        or {
            conversations_pb2.MESSAGE_THREAD_CATEGORY_CHATS,
            conversations_pb2.MESSAGE_THREAD_CATEGORY_HOSTING,
            conversations_pb2.MESSAGE_THREAD_CATEGORY_SURFING,
            conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS,
        }
    )
    if not context.get_boolean_value("public_trips_enabled", False):
        categories -= {conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS}
    return _ThreadFilters(
        categories=categories,
        only_archived=request.only_archived if request.HasField("only_archived") else None,
        only_unread=request.only_unread,
    )


def _latest_host_request_message_id() -> ColumnElement[int]:
    """
    The newest message on a request. Correlated, so it resolves per row of the enclosing query, and
    never NULL, because creating a request writes its first message.
    """
    return select(func.max(Message.id)).where(Message.conversation_id == HostRequest.conversation_id).scalar_subquery()


def _build_group_chat_select_query(
    context: CouchersContext, only_archived: bool | None, unread: bool
) -> Select[tuple[int, int, str]]:
    """
    The group chats (including DMs) the viewer should see, narrowed by the request's archived and
    unread filters, along with the id of the newest message each one shows them.

    The message join is windowed to the viewer's subscription, so a chat they were removed from ends
    at the last message they could read rather than at the chat's newest.
    """
    group_chats = where_moderated_content_visible(
        select(
            GroupChatSubscription.group_chat_id.label("conversation_id"),
            func.max(Message.id).label("latest_message_id"),
        )
        .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
        .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
        .where(GroupChatSubscription.user_id == context.user_id)
        .where(is_newest_subscription(context.user_id))
        .where(was_subscribed_at(GroupChatSubscription, Message.time))
        .where(or_(to_bool(only_archived is None), GroupChatSubscription.is_archived == only_archived))
        .where(or_(to_bool(not unread), is_unseen(Message, GroupChatSubscription)))
        .group_by(GroupChatSubscription.group_chat_id),
        context,
        GroupChat,
        is_list_operation=True,
    ).subquery()
    return select(
        group_chats.c.conversation_id,
        group_chats.c.latest_message_id,
        literal(_KIND_GROUP_CHAT).label("kind"),
    )


def _build_host_request_select_query(
    context: CouchersContext, role_filter: ColumnElement[bool], only_archived: bool | None, unread: bool
) -> Select[tuple[int, int, str]]:
    """
    The host requests and public-trip offers the viewer should see, narrowed by the request's
    archived and unread filters, along with the id of each one's newest message.

    role_filter picks which side of the request the viewer is on: hosting, surfing, or offers on
    their own public trips.
    """
    query = (
        select(
            HostRequest.conversation_id.label("conversation_id"),
            _latest_host_request_message_id().label("latest_message_id"),
            literal(_KIND_HOST_REQUEST).label("kind"),
        )
        .where(
            or_(
                HostRequest.initiator_user_id == context.user_id,
                HostRequest.recipient_user_id == context.user_id,
            )
        )
        .where(role_filter)
        .where(
            or_(
                to_bool(only_archived is None),
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
        .where(or_(to_bool(not unread), has_unseen_host_request_messages(context.user_id)))
    )
    query = where_users_column_visible(query, context, HostRequest.initiator_user_id)
    query = where_users_column_visible(query, context, HostRequest.recipient_user_id)
    query = where_moderated_content_visible(query, context, HostRequest, is_list_operation=True)
    return query


def _build_host_request_role_filter(user_id: int, categories: frozenset[int]) -> ColumnElement[bool] | None:
    """
    The stay-roles the selected categories cover, or None if none of them is a host request category.
    MY_PUBLIC_TRIPS is a subset of SURFING, so asking for both is redundant but harmless.
    """
    clauses = []
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_HOSTING in categories:
        clauses.append(is_hosting_party(user_id))
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_SURFING in categories:
        clauses.append(is_surfing_party(user_id))
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS in categories:
        clauses.append(is_public_trip_offer_recipient(user_id))
    return or_(*clauses) if clauses else None


def _member_visible_to_viewer(subscription: GroupChatSubscription, viewer_left: datetime | None) -> bool:
    """
    Whether `subscription`'s user is visible to a viewer whose own subscription left the chat at
    `viewer_left` (None if the viewer is still in the chat). Same rule as
    _get_visible_members_for_subscription / _get_visible_admins_for_subscription in the conversations
    servicer, expressed as a pure predicate so a list of preloaded subscriptions can be filtered
    without a per-chat query.
    """
    if viewer_left is None:
        # still in the chat: see everyone with a current subscription
        return subscription.left is None
    # left the chat: see everyone who was in it at the moment the viewer left
    return subscription.joined <= viewer_left and (subscription.left is None or subscription.left >= viewer_left)


def _host_request_thread_to_pb(
    host_request: HostRequest,
    conversation: Conversation,
    message: Message | None,
    user_id: int,
    unseen_message_count: int,
) -> requests_pb2.HostRequest:
    """
    Build the HostRequest protobuf for the unified thread list. Mirrors ListHostRequests (batched, so
    no per-request queries like host_request_to_pb), with the same semantics: surfer = initiator,
    host = recipient, even for public-trip offers.
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
        latest_message=message_to_pb(message) if message else None,
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


def _build_group_chats_pb(
    session: Session,
    context: CouchersContext,
    group_chat_ids: list[int],
    latest_message_id_by_conversation: dict[int, int],
) -> dict[int, conversations_pb2.GroupChat]:
    """
    Build GroupChat protobufs (with unseen counts) for a page of group-chat ids.

    Latest-message ids come from the caller's paging pass, so they're reused rather than recomputed
    here (mirrors _build_host_request_threads_pb).
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
            .where(is_unseen(Message, GroupChatSubscription))
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
            latest_message=message_to_pb(row.Message) if row.Message else None,
            mute_info=mute_info(viewer_subscription),
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

    unseen_count_by_conversation: dict[int, int] = dict(
        session.execute(  # type: ignore[arg-type]
            select(HostRequest.conversation_id, func.count(Message.id))
            .join(Message, Message.conversation_id == HostRequest.conversation_id)
            .where(HostRequest.conversation_id.in_(host_request_ids))
            .where(Message.id > viewer_last_seen_message_id(context.user_id))
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


def list_message_threads(
    request: conversations_pb2.ListMessageThreadsReq, context: CouchersContext, session: Session
) -> conversations_pb2.ListMessageThreadsRes:
    filters = _resolve_thread_filters(context, request)

    queries = []
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_CHATS in filters.categories:
        queries.append(_build_group_chat_select_query(context, filters.only_archived, filters.only_unread))
    role_filter = _build_host_request_role_filter(context.user_id, filters.categories)
    if role_filter is not None:
        queries.append(
            _build_host_request_select_query(context, role_filter, filters.only_archived, filters.only_unread)
        )

    # nothing to include: only reachable when MY_PUBLIC_TRIPS is requested alone and the
    # public-trips flag is off. TODO: remove once public trips is live (flag always on)
    if not queries:
        return conversations_pb2.ListMessageThreadsRes()

    page_size = min(request.page_size or DEFAULT_PAGINATION_LENGTH, MAX_PAGE_SIZE)

    # unioned, so one cursor on latest_message_id pages through both kinds as a single list
    threads = (queries[0] if len(queries) == 1 else union_all(*queries)).subquery()
    page_query = select(threads.c.conversation_id, threads.c.latest_message_id, threads.c.kind)
    if request.page_token:
        page_query = page_query.where(threads.c.latest_message_id < int(decrypt_page_token(request.page_token)))
    page_query = page_query.order_by(threads.c.latest_message_id.desc()).limit(page_size + 1)
    rows = session.execute(page_query).all()

    page_rows = rows[:page_size]
    has_more = len(rows) > page_size
    # rows are ordered by latest_message_id desc, so the last one on the page is the cursor
    next_page_token = encrypt_page_token(str(page_rows[-1].latest_message_id)) if has_more else ""

    latest_message_id_by_conversation = {row.conversation_id: row.latest_message_id for row in page_rows}
    group_chat_ids = [row.conversation_id for row in page_rows if row.kind == _KIND_GROUP_CHAT]
    host_request_ids = [row.conversation_id for row in page_rows if row.kind == _KIND_HOST_REQUEST]

    # hydrate each kind in a batch, then re-assemble in the paginated order
    group_chats_by_id = _build_group_chats_pb(session, context, group_chat_ids, latest_message_id_by_conversation)
    host_request_threads_by_id = _build_host_request_threads_pb(
        session, context, host_request_ids, latest_message_id_by_conversation
    )

    message_threads = []
    for row in page_rows:
        if row.kind == _KIND_GROUP_CHAT:
            group_chat = group_chats_by_id.get(row.conversation_id)
            if group_chat is not None:
                message_threads.append(conversations_pb2.MessageThread(group_chat=group_chat))
        else:
            host_request_thread = host_request_threads_by_id.get(row.conversation_id)
            if host_request_thread is not None:
                message_threads.append(conversations_pb2.MessageThread(host_request=host_request_thread))

    return conversations_pb2.ListMessageThreadsRes(threads=message_threads, next_page_token=next_page_token)


def mark_all_threads_seen(
    request: conversations_pb2.MarkAllThreadsSeenReq, context: CouchersContext, session: Session
) -> empty_pb2.Empty:
    filters = _resolve_thread_filters(context, request)

    # (topic actions, keys) groups for the notifications owned by the threads we mark seen
    notification_groups: list[tuple[Sequence[NotificationTopicAction], Sequence[str]]] = []

    if conversations_pb2.MESSAGE_THREAD_CATEGORY_CHATS in filters.categories:
        chat_query = _build_group_chat_select_query(context, filters.only_archived, filters.only_unread)
        # correlated, so it resolves per row of the update: every subscription advances to its own
        # chat's newest message without listing them out. windowed, so a subscription the viewer
        # has left advances only to the last message they could read, matching its unseen count
        latest_reachable_message_id = (
            select(func.max(Message.id))
            .where(Message.conversation_id == GroupChatSubscription.group_chat_id)
            .where(was_subscribed_at(GroupChatSubscription, Message.time))
            .scalar_subquery()
        )
        marked_group_chat_ids = (
            session.execute(
                update(GroupChatSubscription)
                .where(GroupChatSubscription.user_id == context.user_id)
                .where(is_newest_subscription(context.user_id))
                .where(GroupChatSubscription.group_chat_id.in_(select(chat_query.subquery().c.conversation_id)))
                .where(GroupChatSubscription.last_seen_message_id < latest_reachable_message_id)
                .values(last_seen_message_id=latest_reachable_message_id)
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

    role_filter = _build_host_request_role_filter(context.user_id, filters.categories)
    if role_filter is not None:
        host_request_query = _build_host_request_select_query(
            context, role_filter, filters.only_archived, filters.only_unread
        )
        # the viewer's last-seen column depends on their role, so one update per role
        # (a user is never both initiator and recipient of the same request, so these are disjoint)
        matching_ids = select(host_request_query.subquery().c.conversation_id)
        latest_message_id = _latest_host_request_message_id()
        marked_conversation_ids: list[int] = []
        for user_id_column, last_seen_column in (
            (HostRequest.initiator_user_id, HostRequest.initiator_last_seen_message_id),
            (HostRequest.recipient_user_id, HostRequest.recipient_last_seen_message_id),
        ):
            marked_conversation_ids += (
                session.execute(
                    update(HostRequest)
                    .where(user_id_column == context.user_id)
                    .where(HostRequest.conversation_id.in_(matching_ids))
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
                    HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS,
                    [str(conversation_id) for conversation_id in marked_conversation_ids],
                )
            )

    mark_notifications_seen(session, user_id=context.user_id, topic_actions_and_keys=notification_groups)

    return empty_pb2.Empty()
