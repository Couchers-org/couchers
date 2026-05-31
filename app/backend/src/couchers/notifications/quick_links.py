"""
Quick email actions, based on signed URLs that don't require login to submit, such as unsubscribe, quick decline

It is called "unsubscribe" in some places for historical reasons (it was the first use case).
"""

import logging

import grpc
from google.protobuf.message import Message

from couchers import urls
from couchers.context import CouchersContext
from couchers.crypto import UNSUBSCRIBE_KEY_NAME, b64encode, generate_hash_signature, get_secret, verify_hash_signature
from couchers.models import (
    Notification,
    NotificationTopicAction,
    User,
)
from couchers.proto import requests_pb2
from couchers.proto.internal import unsubscribe_pb2
from couchers.utils import now

logger = logging.getLogger(__name__)


def _generate_quick_link(payload: Message) -> str:
    payload.created.FromDatetime(now())  # type: ignore[attr-defined]
    msg = payload.SerializeToString()
    sig = generate_hash_signature(message=msg, key=get_secret(UNSUBSCRIBE_KEY_NAME))
    return urls.quick_link(payload=b64encode(msg), sig=b64encode(sig))


def decode_quick_link(*, payload: bytes, sig: bytes, context: CouchersContext) -> unsubscribe_pb2.UnsubscribePayload:
    if not verify_hash_signature(message=payload, key=get_secret(UNSUBSCRIBE_KEY_NAME), sig=sig):
        context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "wrong_signature")

    return unsubscribe_pb2.UnsubscribePayload.FromString(payload)


def generate_do_not_email(user: User) -> str:
    return _generate_quick_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=user.id,
            do_not_email=unsubscribe_pb2.DoNotEmail(),
        )
    )


def generate_unsub_topic_key(notification: Notification) -> str:
    if not notification.key:
        raise ValueError(
            f"Cannot generate topic_key unsubscribe link for notification with empty key "
            f"(topic_action={notification.topic_action})"
        )
    return _generate_quick_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=notification.user_id,
            topic_key=unsubscribe_pb2.UnsubscribeTopicKey(
                topic=notification.topic,
                key=notification.key,
            ),
        )
    )


def generate_unsub_topic_action(notification: Notification) -> str:
    return _generate_quick_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=notification.user_id,
            topic_action=unsubscribe_pb2.UnsubscribeTopicAction(
                topic=notification.topic,
                action=notification.action,
            ),
        )
    )


def generate_quick_decline_link(host_request: requests_pb2.HostRequest) -> str:
    return _generate_quick_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=host_request.host_user_id,
            host_request_quick_decline=unsubscribe_pb2.HostRequestQuickDecline(
                host_request_id=host_request.host_request_id,
            ),
        )
    )


def can_unsubscribe_topic_key(topic_action: NotificationTopicAction) -> bool:
    """
    Determines whether a user can unsubscribe from a specific topic key
    (e.g. muting a specific chat).
    """
    # Only chat__message has a meaningful key (the chat ID); chat__missed_messages is a summary with no specific chat
    return topic_action == NotificationTopicAction.chat__message
