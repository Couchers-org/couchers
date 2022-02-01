import logging
from base64 import urlsafe_b64encode

import grpc

from couchers import errors, urls
from couchers.crypto import UNSUBSCRIBE_KEY, generate_hash_signature, verify_hash_signature
from couchers.db import session_scope
from couchers.models import User
from couchers.sql import couchers_select as select
from proto.internal import unsubscribe_pb2

logger = logging.getLogger(__name__)


def _generate_unsubscribe_link(payload):
    msg = payload.SerializeToString()
    sig = generate_hash_signature(message=msg, key=UNSUBSCRIBE_KEY)
    return urls.unsubscribe_link(
        payload=urlsafe_b64encode(msg).decode("utf8"), sig=urlsafe_b64encode(sig).decode("utf8")
    )


def generate_mute_all(user_id):
    return _generate_unsubscribe_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=user_id,
            all=unsubscribe_pb2.MuteAll(),
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
    if not verify_hash_signature(message=request.payload, key=UNSUBSCRIBE_KEY, sig=request.sig):
        context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.WRONG_SIGNATURE)
    payload = unsubscribe_pb2.UnsubscribePayload.FromString(request.payload)
    with session_scope() as session:
        user = session.execute(select(User).where(User.id == payload.user_id)).scalar_one()
        if payload.HasField("all"):
            logger.info(f"User {user.name} unsubscribing from all")
        if payload.HasField("topic_key"):
            logger.info(f"User {user.name} unsubscribing from topic_key")
        if payload.HasField("topic_action"):
            logger.info(f"User {user.name} unsubscribing from topic_action")
