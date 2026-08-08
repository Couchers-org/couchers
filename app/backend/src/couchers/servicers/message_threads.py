"""
Bulk operations over the viewer's message threads — group chats, DMs, host requests and public-trip
offers — selected by category (Conversations.MarkAllThreadsSeen).

A request's categories resolve into candidate queries, one per kind of conversation, each yielding
the ids of the conversations of that kind the request covers. MarkAllThreadsSeen consumes them as
UPDATE targets.
"""

import logging
from collections.abc import Sequence

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import ColumnElement, Select, select, update
from sqlalchemy.orm import Session
from sqlalchemy.sql import and_, case, func, or_

from couchers.context import CouchersContext
from couchers.helpers.group_chats import is_newest_subscription, was_subscribed_at
from couchers.helpers.host_requests import (
    HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS,
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
from couchers.sql import where_moderated_content_visible, where_users_column_visible

logger = logging.getLogger(__name__)


def _group_chat_candidate_query(
    context: CouchersContext, only_archived: bool | None, unread: bool
) -> Select[tuple[int]]:
    """
    The ids of the group chats (including DMs) the viewer should see, narrowed by the request's
    archived and unread filters.
    """
    group_chat_ids = (
        select(GroupChatSubscription.group_chat_id.label("conversation_id"))
        .join(Message, Message.conversation_id == GroupChatSubscription.group_chat_id)
        .join(GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id)
        .where(GroupChatSubscription.user_id == context.user_id)
        .where(is_newest_subscription(context.user_id))
        .where(was_subscribed_at(GroupChatSubscription, Message.time))
        .group_by(GroupChatSubscription.group_chat_id)
    )
    if only_archived is not None:
        group_chat_ids = group_chat_ids.where(GroupChatSubscription.is_archived == only_archived)
    if unread:
        # restrict to chats with at least one message newer than the user's last-seen
        group_chat_ids = group_chat_ids.where(Message.id > GroupChatSubscription.last_seen_message_id)
    return where_moderated_content_visible(group_chat_ids, context, GroupChat, is_list_operation=True)


def _host_request_candidate_query(
    context: CouchersContext, role_filter: ColumnElement[bool], only_archived: bool | None, unread: bool
) -> Select[tuple[int]]:
    """
    The host-request half of the same idea as _group_chat_candidate_query: the ids of the host
    requests and public-trip offers the request covers.

    role_filter decides which requests belong in this view — the ones the viewer is hosting, the ones
    they're surfing, or offers on their public trips. Requests the viewer shouldn't see are dropped
    here too: ones involving deleted or blocked users, ones hidden by moderation, and — when the
    caller asks for it — archived or already-read ones.
    """
    viewer_last_seen_message_id = case(
        (HostRequest.initiator_user_id == context.user_id, HostRequest.initiator_last_seen_message_id),
        else_=HostRequest.recipient_last_seen_message_id,
    )
    candidate_query = (
        select(HostRequest.conversation_id.label("conversation_id"))
        .join(Message, Message.conversation_id == HostRequest.conversation_id)
        .where(
            or_(
                HostRequest.initiator_user_id == context.user_id,
                HostRequest.recipient_user_id == context.user_id,
            )
        )
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


def _thread_candidate_queries(
    context: CouchersContext, request: conversations_pb2.MarkAllThreadsSeenReq
) -> tuple[Select[tuple[int]] | None, Select[tuple[int]] | None]:
    """
    Resolve a request into its candidate conversation-id subqueries — one for group chats, one for
    host requests, each None if that kind isn't included.

    An empty category list means all categories, and MY_PUBLIC_TRIPS is dropped when the public-trips
    flag is off (offers still show under SURFING / all, as before). The host-request categories are
    role-based and OR'd together; MY_PUBLIC_TRIPS is a subset of SURFING, so requesting both is
    redundant but harmless — grouping by conversation dedupes.
    """
    categories = set(request.categories)
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_UNSPECIFIED in categories:
        context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_thread_category")
    if not categories:
        categories = {
            conversations_pb2.MESSAGE_THREAD_CATEGORY_CHATS,
            conversations_pb2.MESSAGE_THREAD_CATEGORY_HOSTING,
            conversations_pb2.MESSAGE_THREAD_CATEGORY_SURFING,
            conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS,
        }
    if not context.get_boolean_value("public_trips_enabled", False):
        categories.discard(conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS)

    only_archived = request.only_archived if request.HasField("only_archived") else None
    only_unread = request.only_unread

    chat_query = (
        _group_chat_candidate_query(context, only_archived, only_unread)
        if conversations_pb2.MESSAGE_THREAD_CATEGORY_CHATS in categories
        else None
    )

    role_clauses = []
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_HOSTING in categories:
        role_clauses.append(is_hosting_party(context.user_id))
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_SURFING in categories:
        role_clauses.append(is_surfing_party(context.user_id))
    if conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS in categories:
        role_clauses.append(is_public_trip_offer_recipient(context.user_id))
    host_request_query = (
        _host_request_candidate_query(context, or_(*role_clauses), only_archived, only_unread) if role_clauses else None
    )
    return chat_query, host_request_query


def mark_all_threads_seen(
    request: conversations_pb2.MarkAllThreadsSeenReq, context: CouchersContext, session: Session
) -> empty_pb2.Empty:
    chat_query, host_request_query = _thread_candidate_queries(context, request)

    # (topic actions, keys) groups for the notifications owned by the threads we mark seen
    notification_groups: list[tuple[Sequence[NotificationTopicAction], Sequence[str]]] = []

    if chat_query is not None:
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

    if host_request_query is not None:
        # the viewer's last-seen column depends on their role, so one update per role
        # (a user is never both initiator and recipient of the same request, so these are disjoint)
        candidate_ids = select(host_request_query.subquery().c.conversation_id)
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
                    HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS,
                    [str(conversation_id) for conversation_id in marked_conversation_ids],
                )
            )

    mark_notifications_seen(session, user_id=context.user_id, topic_actions_and_keys=notification_groups)

    return empty_pb2.Empty()
