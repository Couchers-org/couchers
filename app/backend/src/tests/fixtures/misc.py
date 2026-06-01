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
from couchers.proto.internal import jobs_pb2
from couchers.servicers.threads import unpack_thread_id
from tests.fixtures.sessions import real_moderation_session


def process_jobs() -> None:
    while process_job():
        pass


@contextmanager
def mock_notification_email() -> Generator[Mock]:
    with patch("couchers.email.queuing._queue_email") as mock:
        yield mock
        process_jobs()


def email_fields(mock: Mock, call_ix: int = 0) -> jobs_pb2.SendEmailPayload:
    args, _ = mock.call_args_list[call_ix]
    return args[1]


@dataclass(frozen=True, slots=True, kw_only=True)
class Push:
    topic_action: str
    content: PushNotificationContent
    key: str | None = None
    ttl: int | None = None


class PushCollector:
    def __init__(self):
        self.by_user: dict[int, list[Push]] = {}
        """Collected notifications by user id, chronologically."""

    def push_to_user(self, session: Session, user_id: int, **kwargs: Any) -> None:
        if user_id not in self.by_user:
            self.by_user[user_id] = []
        self.by_user[user_id].append(Push(**kwargs))

    def count_for_user(self, user_id: int) -> int:
        return len(self.by_user.get(user_id, []))

    def pop_for_user(self, user_id: int, last: bool = False) -> Push:
        """
        Removes and returns the oldest push notification received by the given user,
        optionally asserting that it is the last one.
        """
        pushes = self.by_user.get(user_id)
        assert pushes, f"No notifications to pop for user {user_id}."
        if last:
            assert len(pushes) == 1, f"Expected a single notification for user {user_id}."
        return pushes.pop(0)


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

    def approve_friend_request(self, friend_request_id: int, reason: str = "Test approval") -> None:
        """
        Approve a friend request using the moderation API.

        Args:
            friend_request_id: The ID of the friend request (FriendRelationship.id)
            reason: Optional reason for approval
        """
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_FRIEND_REQUEST,
                    object_id=friend_request_id,
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

    def approve_event_occurrence(self, occurrence_id: int, reason: str = "Test approval") -> None:
        """
        Approve an event occurrence using the moderation API.

        Args:
            occurrence_id: The ID of the EventOccurrence (what the proto calls event_id)
            reason: Optional reason for approval
        """
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_EVENT_OCCURRENCE,
                    object_id=occurrence_id,
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

    def approve_comment(self, comment_id: int, reason: str = "Test approval") -> None:
        """Approve a Comment using the moderation API. comment_id is the database id of the Comment."""
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_COMMENT,
                    object_id=comment_id,
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

    def approve_reply(self, reply_id: int, reason: str = "Test approval") -> None:
        """Approve a Reply using the moderation API. reply_id is the database id of the Reply."""
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_REPLY,
                    object_id=reply_id,
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

    def approve_discussion(self, discussion_id: int, reason: str = "Test approval") -> None:
        """Approve a Discussion using the moderation API. discussion_id is the database id of the Discussion."""
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_DISCUSSION,
                    object_id=discussion_id,
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

    def approve_thread_post(self, packed_thread_id: int, reason: str = "Test approval") -> None:
        """Approve whichever of Comment/Reply the packed thread_id refers to."""
        database_id, depth = unpack_thread_id(packed_thread_id)
        if depth == 1:
            self.approve_comment(database_id, reason=reason)
        elif depth == 2:
            self.approve_reply(database_id, reason=reason)
        else:
            raise ValueError(f"approve_thread_post: thread_id {packed_thread_id} has unsupported depth {depth}")
