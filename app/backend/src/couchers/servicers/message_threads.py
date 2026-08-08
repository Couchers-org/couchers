"""
Bulk operations over the viewer's message threads — group chats, DMs, host requests and public-trip
offers — selected by category (Conversations.MarkAllThreadsSeen).
"""

import logging
from collections.abc import Sequence
from dataclasses import dataclass

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import ColumnElement, Select, select, update
from sqlalchemy.orm import Session
from sqlalchemy.sql import and_, func, or_

from couchers.context import CouchersContext
from couchers.helpers.group_chats import is_newest_subscription, is_unseen, was_subscribed_at
from couchers.helpers.host_requests import (
    HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS,
    has_unseen_host_request_messages,
    is_hosting_party,
    is_public_trip_offer_recipient,
    is_surfing_party,
)
from couchers.models import (
    GroupChat,
    GroupChatSubscription,
    HostRequest,
    Message,
)
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.notify import mark_notifications_seen
from couchers.proto import conversations_pb2
from couchers.sql import to_bool, where_moderated_content_visible, where_users_column_visible

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class _ThreadFilters:
    categories: frozenset[int]
    only_archived: bool | None
    only_unread: bool


def _resolve_thread_filters(
    context: CouchersContext, request: conversations_pb2.MarkAllThreadsSeenReq
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
) -> Select[tuple[int]]:
    """
    The ids of the group chats (including DMs) the viewer should see, narrowed by the request's
    archived and unread filters.
    """
    return where_moderated_content_visible(
        select(GroupChatSubscription.group_chat_id.label("conversation_id"))
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
) -> Select[tuple[int]]:
    """
    The ids of the host requests and public-trip offers the viewer should see, narrowed by the
    request's archived and unread filters.

    role_filter picks which side of the request the viewer is on: hosting, surfing, or offers on
    their own public trips.
    """
    query = (
        select(HostRequest.conversation_id.label("conversation_id"))
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
        latest_message_id = (
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

    role_filter = _build_host_request_role_filter(context.user_id, filters.categories)
    if role_filter is not None:
        host_request_query = _build_host_request_select_query(
            context, role_filter, filters.only_archived, filters.only_unread
        )
        # the viewer's last-seen column depends on their role, so one update per role
        # (a user is never both initiator and recipient of the same request, so these are disjoint)
        matching_ids = select(host_request_query.subquery().c.conversation_id)
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
