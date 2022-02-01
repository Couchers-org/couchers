from couchers import urls
from couchers.crypto import UNSUBSCRIBE_KEY, generate_hash_signature, verify_hash_signature
from proto.internal import unsubscribe_pb2


def _generate_unsubscribe_link(payload):
    sig = generate_hash_signature(payload=payload, key=UNSUBSCRIBE_KEY)
    return urls.unsubscribe_link(payload=urlsafe_b64encode(payload), sig=urlsafe_b64encode(sig))


def generate_mute_all(notification):
    return _generate_unsubscribe_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=notification.user_id,
            all=unsubscribe_pb2.MuteAll(),
        )
    )


def generate_unsub_topic_key(notification):
    return _generate_unsubscribe_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=notification.user_id,
            all=unsubscribe_pb2.UnsubscribeTopicKey(
                topic=notification.topic,
                key=notification.key,
            ),
        )
    )


def generate_unsub_topic_action(notification):
    return _generate_unsubscribe_link(
        unsubscribe_pb2.UnsubscribePayload(
            user_id=notification.user_id,
            all=unsubscribe_pb2.UnsubscribeTopicAction(
                topic=notification.topic,
                action=notification.action,
            ),
        )
    )


def unsubscribe(request, context):
    if not verify_hash_signature(payload=request.payload, key=UNSUBSCRIBE_KEY, sig=request.sig):
        context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.WRONG_SIGNATURE)
    payload = unsubscribe_pb2.UnsubscribePayload.FromString(request.payload)
    user = 
    if payload.HasField("all"):
        all
        topic_key
        topic_action
