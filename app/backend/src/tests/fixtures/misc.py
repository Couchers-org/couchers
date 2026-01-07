from collections.abc import Generator
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any
from unittest.mock import Mock, patch

from sqlalchemy.orm import Session

from couchers.jobs.worker import process_job
from couchers.models import User
from couchers.notifications.push import PushNotificationContent
from couchers.proto import moderation_pb2
from tests.fixtures.sessions import real_moderation_session


def process_jobs() -> None:
    while process_job():
        pass


@contextmanager
def mock_notification_email() -> Generator[Mock]:
    with patch("couchers.email._queue_email") as mock:
        yield mock
        process_jobs()


@dataclass
class EmailData:
    sender_name: str
    sender_email: str
    recipient: str
    subject: str
    plain: str
    html: str
    source_data: str
    list_unsubscribe_header: str


def email_fields(mock: Mock, call_ix: int = 0) -> EmailData:
    _, kw = mock.call_args_list[call_ix]
    return EmailData(
        sender_name=kw.get("sender_name"),
        sender_email=kw.get("sender_email"),
        recipient=kw.get("recipient"),
        subject=kw.get("subject"),
        plain=kw.get("plain"),
        html=kw.get("html"),
        source_data=kw.get("source_data"),
        list_unsubscribe_header=kw.get("list_unsubscribe_header"),
    )


@dataclass(frozen=True, slots=True, kw_only=True)
class Push:
    topic_action: str
    content: PushNotificationContent
    key: str | None = None
    ttl: int | None = None


class PushCollector:
    def __init__(self):
        # pairs of (user_id, push)
        self.pushes: list[tuple[int, Push]] = []

    def by_user(self, user_id: int) -> list[Push]:
        return [push for uid, push in self.pushes if uid == user_id]

    def push_to_user(self, session: Session, user_id: int, **kwargs: Any) -> None:
        self.pushes.append((user_id, Push(**kwargs)))

    def count_for_user(self, user_id: int) -> int:
        return len(self.by_user(user_id))

    def get_for_user(
        self,
        user_id: int,
        index: int | None = None,
    ) -> Push:
        pushes = self.by_user(user_id)
        if index is None:
            assert len(pushes) == 1, "Expected a single user notification"
            return pushes[0]
        return pushes[index]


class Moderator:
    """
    A test fixture that provides a moderator user and methods to exercise the moderation API.

    Usage:
        def test_example(db, moderator):
            user, token = generate_user()
            # ... create a host request ...
            moderator.approve_host_request(host_request_id)
    """

    def __init__(self, user: User, token: str):
        self.user = user
        self.token = token

    def approve_host_request(self, host_request_id: int, reason: str = "Test approval") -> None:
        """
        Approve a host request using the moderation API.

        Args:
            host_request_id: The conversation_id of the host request
            reason: Optional reason for approval
        """
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
                    object_id=host_request_id,
                )
            )
            api.ModerateContent(
                moderation_pb2.ModerateContentReq(
                    moderation_state_id=state_res.moderation_state.moderation_state_id,
                    action=moderation_pb2.MODERATION_ACTION_APPROVE,
                    visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                    reason=reason,
                )
            )

    def approve_group_chat(self, group_chat_id: int, reason: str = "Test approval") -> None:
        """
        Approve a group chat using the moderation API.

        Args:
            group_chat_id: The conversation_id of the group chat
            reason: Optional reason for approval
        """
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT,
                    object_id=group_chat_id,
                )
            )
            api.ModerateContent(
                moderation_pb2.ModerateContentReq(
                    moderation_state_id=state_res.moderation_state.moderation_state_id,
                    action=moderation_pb2.MODERATION_ACTION_APPROVE,
                    visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                    reason=reason,
                )
            )
