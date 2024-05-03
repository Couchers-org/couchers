import logging

import grpc

from couchers import errors, urls
from couchers.constants import DATETIME_INFINITY
from couchers.crypto import UNSUBSCRIBE_KEY_NAME, b64encode, generate_hash_signature, get_secret, verify_hash_signature
from couchers.db import session_scope
from couchers.models import GroupChatSubscription, HostingStatus, NotificationDeliveryType, User
from couchers.notifications import settings
from couchers.notifications.utils import enum_from_topic_action
from couchers.sql import couchers_select as select
from proto.internal import unsubscribe_pb2

logger = logging.getLogger(__name__)


def _generate_unsubscribe_link(payload):
    msg = payload.SerializeToString()
    sig = generate_hash_signature(message=msg, key=get_secret(UNSUBSCRIBE_KEY_NAME))
    return urls.unsubscribe_link(payload=b64encode(msg), sig=b64encode(sig))


def generate_mute_all(user_id):
    return _generate_unsubscribe_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=user_id,
            all=unsubscribe_pb2.MuteAll(),
        )
    )


def generate_do_not_email(user_id):
    return _generate_unsubscribe_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=user_id,
            do_not_email=unsubscribe_pb2.DoNotEmail(),
        )
    )


def generate_unsub_topic_key(notification):
    return _generate_unsubscribe_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=notification.user_id,
            topic_key=unsubscribe_pb2.UnsubscribeTopicKey(
                topic=notification.topic,
                key=notification.key,
            ),
        )
    )


def generate_unsub_topic_action(notification):
    return _generate_unsubscribe_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=notification.user_id,
            topic_action=unsubscribe_pb2.UnsubscribeTopicAction(
                topic=notification.topic,
                action=notification.action,
            ),
        )
    )


def unsubscribe(request, context):
    """
    Returns a response string or uses context.abort upon error
    """
    if not verify_hash_signature(message=request.payload, key=get_secret(UNSUBSCRIBE_KEY_NAME), sig=request.sig):
        context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.WRONG_SIGNATURE)
    payload = unsubscribe_pb2.UnsubscribePayload.FromString(request.payload)
    with session_scope() as session:
        user = session.execute(select(User).where(User.id == payload.user_id)).scalar_one()
        if payload.HasField("all"):
            logger.info(f"User {user.name} unsubscribing from all")
            # todo: some other system when out of preview
            user.new_notifications_enabled = False
            return "You've been unsubscribed from all non-security notifications"
        if payload.HasField("do_not_email"):
            logger.info(f"User {user.name} turning of emails")
            user.do_not_email = True
            user.new_notifications_enabled = False
            user.hosting_status = HostingStatus.cant_host
            user.meetup_status = HostingStatus.does_not_want_to_meetup
            return "You will not receive any non-security emails. You may still receive the newsletter, and need to unsubscribe separately there, sorry!"
        if payload.HasField("topic_action"):
            logger.info(f"User {user.name} unsubscribing from topic_action")
            topic = payload.topic_action.topic
            action = payload.topic_action.action
            topic_action = enum_from_topic_action[topic, action]
            # disable emails for this type
            settings.set_preference(session, user.id, topic_action, NotificationDeliveryType.email, False)
            return "You've been unsubscribed from all email notifications of that type"
        if payload.HasField("topic_key"):
            logger.info(f"User {user.name} unsubscribing from topic_key")
            topic = payload.topic_key.topic
            key = payload.topic_key.key
            # a bunch of manual stuff
            if topic == "chat":
                group_chat_id = int(key)
                subscription = session.execute(
                    select(GroupChatSubscription)
                    .where(GroupChatSubscription.group_chat_id == group_chat_id)
                    .where(GroupChatSubscription.user_id == user.id)
                    .where(GroupChatSubscription.left == None)
                ).scalar_one_or_none()

                if not subscription:
                    context.abort(grpc.StatusCode.NOT_FOUND, errors.CHAT_NOT_FOUND)

                subscription.muted_until = DATETIME_INFINITY
                return "That group chat has been muted."
            else:
                context.abort(grpc.StatusCode.UNIMPLEMENTED, errors.CANT_UNSUB_TOPIC)
