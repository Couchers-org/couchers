"""
Implements the "quick links" that are included in emails, for unsubscribing without logging in.
"""

import logging

import grpc
from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.constants import DATETIME_INFINITY
from couchers.context import CouchersContext, make_one_off_interactive_user_context
from couchers.models import (
    GroupChat,
    GroupChatSubscription,
    HostingStatus,
    MeetupStatus,
    NotificationDeliveryType,
    User,
)
from couchers.notifications import settings
from couchers.notifications.utils import enum_from_topic_action
from couchers.proto import conversations_types_pb2, requests_pb2
from couchers.proto.internal import unsubscribe_pb2
from couchers.servicers.requests import Requests
from couchers.sql import where_moderated_content_visible

logger = logging.getLogger(__name__)


def handle_unsubscribe(payload: unsubscribe_pb2.UnsubscribePayload, context: CouchersContext, session: Session) -> str:
    """
    Returns a response string or uses context.abort upon error
    """
    user = session.execute(select(User).where(User.id == payload.user_id)).scalar_one()

    if payload.HasField("do_not_email"):
        logger.info(f"User {user.name} turning of emails")
        user.do_not_email = True
        user.hosting_status = HostingStatus.cant_host
        user.meetup_status = MeetupStatus.does_not_want_to_meetup
        return context.localization.localize_string("quick_links.do_not_email")

    if payload.HasField("topic_action"):
        logger.info(f"User {user.name} unsubscribing from topic_action")
        topic = payload.topic_action.topic
        action = payload.topic_action.action
        topic_action = enum_from_topic_action[topic, action]
        # disable emails for this type
        settings.set_preference(session, user.id, topic_action, NotificationDeliveryType.email, False)
        return context.localization.localize_string("quick_links.topic_action")

    if payload.HasField("topic_key"):
        logger.info(f"User {user.name} unsubscribing from topic_key")
        topic = payload.topic_key.topic
        key = payload.topic_key.key
        # a bunch of manual stuff
        if topic == "chat":
            group_chat_id = int(key)
            subscription = session.execute(
                where_moderated_content_visible(
                    select(GroupChatSubscription).join(
                        GroupChat, GroupChat.conversation_id == GroupChatSubscription.group_chat_id
                    ),
                    context,
                    GroupChat,
                    is_list_operation=False,
                )
                .where(GroupChatSubscription.group_chat_id == group_chat_id)
                .where(GroupChatSubscription.user_id == user.id)
                .where(GroupChatSubscription.left == None)
            ).scalar_one_or_none()

            if subscription is None:
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

            subscription.muted_until = DATETIME_INFINITY
            return context.localization.localize_string("quick_links.chat_unsub")
        else:
            context.abort_with_error_code(grpc.StatusCode.UNIMPLEMENTED, "cant_unsub_topic")

    if payload.HasField("host_request_quick_decline"):
        Requests().RespondHostRequest(
            request=requests_pb2.RespondHostRequestReq(
                host_request_id=payload.host_request_quick_decline.host_request_id,
                status=conversations_types_pb2.HOST_REQUEST_STATUS_REJECTED,
            ),
            context=make_one_off_interactive_user_context(couchers_context=context, user_id=payload.user_id),
            session=session,
        )
        return context.localization.localize_string("quick_links.host_request_quick_decline")

    raise Exception("Unhandled quick link type")
