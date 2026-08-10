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

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import ColumnElement, Row, Select, exists, select, union_all, update
from sqlalchemy.dialects.postgresql import aggregate_order_by
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import and_, case, func, literal, or_

from couchers.context import CouchersContext
from couchers.crypto import decrypt_page_token, encrypt_page_token
from couchers.helpers.group_chats import is_newest_subscription, is_unseen, mute_info, was_subscribed_at
from couchers.helpers.host_requests import (
    HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS,
    has_unseen_host_request_messages,
    is_hosting_party,
    is_public_trip_offer_recipient,
    is_surfing_party,
    unseen_host_request_message_count,
)
from couchers.helpers.messages import hostrequeststatus2api, message_to_pb
from couchers.models import (
    Conversation,
    GroupChat,
    GroupChatRole,
    GroupChatSubscription,
    HostRequest,
    HostRequestFeedback,
    HostRequestStatus,
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

# one thread as the select queries yield it: (conversation_id, latest_message_id, kind)
_ThreadRow = Row[tuple[int, int, str]]


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


def _build_group_chat_select_query(
    context: CouchersContext, only_archived: bool | None, unread: bool
) -> Select[tuple[int, int, str]]:
    """
    The group chats (including DMs) the viewer should see, narrowed by the request's archived and
    unread filters, along with the id of the newest message each one shows them.

    The message join is windowed to the viewer's subscription, so a chat they were removed from ends
    at the last message they could read rather than at the chat's newest.
    """
    return where_moderated_content_visible(
        select(
            GroupChatSubscription.group_chat_id.label("conversation_id"),
            func.max(Message.id).label("latest_message_id"),
            literal(_KIND_GROUP_CHAT).label("kind"),
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
            # correlated, so it resolves per row, and never NULL: creating a request writes its
            # first message
            select(func.max(Message.id))
            .where(Message.conversation_id == HostRequest.conversation_id)
            .scalar_subquery()
            .label("latest_message_id"),
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


def _host_request_thread_to_pb(
    host_request: HostRequest,
    conversation: Conversation,
    message: Message,
    user_id: int,
    unseen_message_count: int,
    need_host_request_feedback: bool,
) -> requests_pb2.HostRequest:
    """
    Build the HostRequest protobuf for the unified thread list. Mirrors ListHostRequests (batched, so
    no per-request queries like host_request_to_pb), with the same semantics: surfer = initiator,
    host = recipient, even for public-trip offers.
    """
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
        latest_message=message_to_pb(message),
        hosting_city=host_request.hosting_city,
        hosting_lat=lat,
        hosting_lng=lng,
        hosting_radius=host_request.hosting_radius,
        need_host_request_feedback=need_host_request_feedback,
        is_archived=(
            host_request.is_initiator_archived
            if host_request.initiator_user_id == user_id
            else host_request.is_recipient_archived
        ),
        public_trip_id=host_request.public_trip_id,
        unseen_message_count=unseen_message_count,
    )


def _build_group_chats_pb(
    session: Session, context: CouchersContext, threads: Sequence[_ThreadRow]
) -> dict[int, conversations_pb2.GroupChat]:
    """
    Build GroupChat protobufs (with unseen counts) for the group chats on a page.

    Each row already carries the id of the chat's latest message, windowed to the viewer's
    subscription, so that rule doesn't have to be restated here.
    """
    if not threads:
        return {}
    group_chat_ids = [thread.conversation_id for thread in threads]
    latest_message_ids = [thread.latest_message_id for thread in threads]

    unseen_count_by_group_chat: dict[int, int] = dict(
        session.execute(  # type: ignore[arg-type]
            select(GroupChatSubscription.group_chat_id, func.count(Message.id))
            .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
            .where(GroupChatSubscription.group_chat_id.in_(group_chat_ids))
            .where(GroupChatSubscription.user_id == context.user_id)
            .where(is_newest_subscription(context.user_id))
            .where(is_unseen(Message, GroupChatSubscription))
            .group_by(GroupChatSubscription.group_chat_id)
        ).all()
    )

    # the chat, its conversation, the viewer's own subscription, its latest message (id already
    # known), its visible roster and whether the viewer can message it, in one query
    member = aliased(GroupChatSubscription)
    member_user_ids = func.array_agg(aggregate_order_by(member.user_id, member.user_id))
    # same roster rule as _get_visible_members_for_subscription / _get_visible_admins_for_subscription
    # in the conversations servicer: a viewer still in the chat sees everyone currently in it, and one
    # who has left sees the roster frozen at the moment they left
    member_visible = case(
        (GroupChatSubscription.left.is_(None), member.left.is_(None)),
        # the else_ branch only runs where left is non-NULL, which the annotation can't express
        else_=was_subscribed_at(member, GroupChatSubscription.left),  # type: ignore[arg-type]
    )
    # same rule as _user_can_message in the conversations servicer: a true group chat can always be
    # messaged, a DM only while the other party is still in it and visible to the viewer
    other_party = aliased(GroupChatSubscription)
    can_message = or_(
        ~GroupChat.is_dm,
        where_users_column_visible(
            select(1)
            .select_from(other_party)
            .where(other_party.group_chat_id == GroupChat.conversation_id)
            .where(other_party.user_id != context.user_id)
            .where(other_party.left.is_(None)),
            context,
            other_party.user_id,
        )
        .exists()
        .correlate(GroupChat),
    )
    rows = session.execute(
        select(
            GroupChat,
            Conversation,
            GroupChatSubscription,
            Message,
            member_user_ids,
            member_user_ids.filter(member.role == GroupChatRole.admin),
            can_message,
        )
        .join(Conversation, Conversation.id == GroupChat.conversation_id)
        .join(GroupChatSubscription, GroupChatSubscription.group_chat_id == GroupChat.conversation_id)
        .join(Message, and_(Message.conversation_id == GroupChat.conversation_id, Message.id.in_(latest_message_ids)))
        .join(member, and_(member.group_chat_id == GroupChat.conversation_id, member_visible))
        .where(GroupChat.conversation_id.in_(group_chat_ids))
        .where(GroupChatSubscription.user_id == context.user_id)
        .where(is_newest_subscription(context.user_id))
        .group_by(GroupChat.conversation_id, Conversation.id, GroupChatSubscription.id, Message.id)
    ).all()

    return {
        group_chat.conversation_id: conversations_pb2.GroupChat(
            group_chat_id=group_chat.conversation_id,
            title=group_chat.title,  # TODO: proper title for DMs, etc
            member_user_ids=members,
            # array_agg over an empty filter is NULL rather than an empty array
            admin_user_ids=admins or [],
            only_admins_invite=group_chat.only_admins_invite,
            is_dm=group_chat.is_dm,
            created=Timestamp_from_datetime(conversation.created),
            unseen_message_count=unseen_count_by_group_chat.get(group_chat.conversation_id, 0),
            last_seen_message_id=subscription.last_seen_message_id,
            latest_message=message_to_pb(message),
            mute_info=mute_info(subscription),
            can_message=can_message,
            is_archived=subscription.is_archived,
        )
        for group_chat, conversation, subscription, message, members, admins, can_message in rows
    }


def _build_host_request_threads_pb(
    session: Session, context: CouchersContext, threads: Sequence[_ThreadRow]
) -> dict[int, requests_pb2.HostRequest]:
    """Build HostRequest protobufs (with unseen counts) for the host requests on a page."""
    if not threads:
        return {}
    host_request_ids = [thread.conversation_id for thread in threads]
    latest_message_ids = [thread.latest_message_id for thread in threads]

    # same rule as host_request_to_pb: the host is asked for feedback once they've rejected a request
    # and haven't given any yet.
    # TODO(#9347): the recipient-based logic is wrong for public-trip offers, where the recipient is
    # the traveller rather than the host — same for the response-rate observation.
    need_host_request_feedback = and_(
        HostRequest.recipient_user_id == context.user_id,
        HostRequest.status == HostRequestStatus.rejected,
        ~exists()
        .where(HostRequestFeedback.from_user_id == context.user_id)
        .where(HostRequestFeedback.host_request_id == HostRequest.conversation_id)
        .correlate(HostRequest),
    )

    # the request, its conversation, its latest message (id already known), its unseen count and
    # whether it's owed feedback, in one query
    rows = session.execute(
        select(
            HostRequest,
            Conversation,
            Message,
            unseen_host_request_message_count(context.user_id),
            need_host_request_feedback,
        )
        .join(Conversation, Conversation.id == HostRequest.conversation_id)
        .join(Message, and_(Message.conversation_id == HostRequest.conversation_id, Message.id.in_(latest_message_ids)))
        .where(HostRequest.conversation_id.in_(host_request_ids))
    ).all()
    return {
        host_request.conversation_id: _host_request_thread_to_pb(
            host_request, conversation, message, context.user_id, unseen_message_count, needs_feedback
        )
        for host_request, conversation, message, unseen_message_count, needs_feedback in rows
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

    # hydrate each kind in a batch, then re-assemble in the paginated order
    group_chats_by_id = _build_group_chats_pb(
        session, context, [row for row in page_rows if row.kind == _KIND_GROUP_CHAT]
    )
    host_request_threads_by_id = _build_host_request_threads_pb(
        session, context, [row for row in page_rows if row.kind == _KIND_HOST_REQUEST]
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
        # correlated, so it resolves per row of the update: every request advances to its own newest
        # message without listing them out
        latest_message_id = (
            select(func.max(Message.id)).where(Message.conversation_id == HostRequest.conversation_id).scalar_subquery()
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
