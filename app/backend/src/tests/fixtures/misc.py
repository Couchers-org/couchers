from dataclasses import dataclass
from typing import Any
from unittest.mock import patch

from sqlalchemy.orm import Session

from couchers.config import config
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


class EmailCollector:
    """Intercepts emails so they can be verified by tests."""

    def __init__(self) -> None:
        # Collected emails by recipient address, chronologically.
        self.by_recipient: dict[str, list[jobs_pb2.SendEmailPayload]] = {}
        self._patch = patch("couchers.email.queuing._queue_email", self._mock_queue_email)

    def _mock_queue_email(self, session: Session, payload: jobs_pb2.SendEmailPayload) -> None:
        if payload.recipient not in self.by_recipient:
            self.by_recipient[payload.recipient] = []
        self.by_recipient[payload.recipient].append(payload)

    def __enter__(self):
        process_jobs()  # Flush any emails prior to this point
        self.by_recipient.clear()
        self._patch.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._patch.stop()
        return False  # Let any exception propagate

    def count(self) -> int:
        process_jobs()
        return sum(len(v) for v in self.by_recipient.values())

    def count_for_recipient(self, recipient: str) -> int:
        process_jobs()
        return len(self.by_recipient.get(recipient, []))

    def count_for_mods(self) -> int:
        return self.count_for_recipient(config.MODS_EMAIL_RECIPIENT)

    def count_for_reports(self) -> int:
        return self.count_for_recipient(config.REPORTS_EMAIL_RECIPIENT)

    def pop_for_recipient(self, recipient: str, *, last: bool = False) -> jobs_pb2.SendEmailPayload:
        """
        Removes and returns the oldest email queued to a given recipient,
        optionally asserting that it is the last one.
        """
        process_jobs()
        emails = self.by_recipient.get(recipient)
        assert emails, f"No emails to pop for recipient {recipient}."
        if last:
            assert len(emails) == 1, f"Expected a single email for recipient {recipient}."
        return emails.pop(0)

    def pop_for_mods(self, *, last: bool = False) -> jobs_pb2.SendEmailPayload:
        return self.pop_for_recipient(config.MODS_EMAIL_RECIPIENT, last=last)

    def pop_for_reports(self, *, last: bool = False) -> jobs_pb2.SendEmailPayload:
        return self.pop_for_recipient(config.REPORTS_EMAIL_RECIPIENT, last=last)


@dataclass(frozen=True, slots=True, kw_only=True)
class Push:
    topic_action: str
    content: PushNotificationContent
    key: str | None = None
    ttl: int | None = None


class PushCollector:
    """Captures push notifications and allows inspecting them."""

    def __init__(self) -> None:
        # Collected notifications by user id, chronologically.
        self.by_user: dict[int, list[Push]] = {}
        self._patch = patch("couchers.notifications.push._push_to_user", self._mock_push_to_user)

    def _mock_push_to_user(self, session: Session, user_id: int, **kwargs: Any) -> None:
        if user_id not in self.by_user:
            self.by_user[user_id] = []
        self.by_user[user_id].append(Push(**kwargs))

    def __enter__(self):
        process_jobs()  # Flush any push notifications prior to this point
        self.by_user.clear()
        self._patch.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._patch.stop()
        return False  # Let any exception propagate

    def count_for_user(self, user_id: int) -> int:
        process_jobs()
        return len(self.by_user.get(user_id, []))

    def pop_for_user(self, user_id: int, *, last: bool = False) -> Push:
        """
        Removes and returns the oldest push notification received by the given user,
        optionally asserting that it is the last one.
        """
        process_jobs()
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
                    clear_flags=True,
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
                    clear_flags=True,
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
                    clear_flags=True,
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
                    clear_flags=True,
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
                    clear_flags=True,
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
                    clear_flags=True,
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
                    clear_flags=True,
                )
            )

    def approve_reference(self, reference_id: int, reason: str = "Test approval") -> None:
        """Approve a Reference using the moderation API."""
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_REFERENCE,
                    object_id=reference_id,
                )
            )
            api.ModerateContent(
                moderation_pb2.ModerateContentReq(
                    moderation_state_id=state_res.moderation_state.moderation_state_id,
                    action=moderation_pb2.MODERATION_ACTION_APPROVE,
                    visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                    reason=reason,
                    clear_flags=True,
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
