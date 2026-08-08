"""
Message serialization shared by the conversations and requests APIs: both surface messages from the
same table, so they must render every message type identically.
"""

from couchers.models import HostRequestStatus, Message, MessageType
from couchers.proto import messages_pb2
from couchers.utils import Timestamp_from_datetime

hostrequeststatus2api = {
    HostRequestStatus.pending: messages_pb2.HOST_REQUEST_STATUS_PENDING,
    HostRequestStatus.accepted: messages_pb2.HOST_REQUEST_STATUS_ACCEPTED,
    HostRequestStatus.rejected: messages_pb2.HOST_REQUEST_STATUS_REJECTED,
    HostRequestStatus.confirmed: messages_pb2.HOST_REQUEST_STATUS_CONFIRMED,
    HostRequestStatus.cancelled: messages_pb2.HOST_REQUEST_STATUS_CANCELLED,
}

api2hostrequeststatus = {
    messages_pb2.HOST_REQUEST_STATUS_PENDING: HostRequestStatus.pending,
    messages_pb2.HOST_REQUEST_STATUS_ACCEPTED: HostRequestStatus.accepted,
    messages_pb2.HOST_REQUEST_STATUS_REJECTED: HostRequestStatus.rejected,
    messages_pb2.HOST_REQUEST_STATUS_CONFIRMED: HostRequestStatus.confirmed,
    messages_pb2.HOST_REQUEST_STATUS_CANCELLED: HostRequestStatus.cancelled,
}


def message_to_pb(message: Message) -> messages_pb2.Message:
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
