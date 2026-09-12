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
from tests.fixtures import query_log
from tests.fixtures.sessions import real_moderation_session


def process_jobs() -> None:
    # One span for the whole drain, not one per job type: Job is a frozen dataclass deriving its name and payload
    # type from the handler's __name__ and type hints, so wrapping handlers to name them breaks get_type_hints.
    # Splitting these out wants a span alongside the existing tracer span in worker.process_job.
    with query_log.span("job", "process_jobs"):
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

    def set_visibility(
        self,
        object_type: moderation_pb2.ModerationObjectType.ValueType,
        object_id: int,
        visibility: moderation_pb2.ModerationVisibility.ValueType,
        reason: str = "Test moderation",
    ) -> None:
        """Move a piece of moderated content to the given visibility through the moderation API."""
        raising = visibility in (
            moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
            moderation_pb2.MODERATION_VISIBILITY_UNLISTED,
        )
        with real_moderation_session(self.token) as api:
            state_res = api.GetModerationState(
                moderation_pb2.GetModerationStateReq(object_type=object_type, object_id=object_id)
            )
            api.ModerateContent(
                moderation_pb2.ModerateContentReq(
                    moderation_state_id=state_res.moderation_state.moderation_state_id,
                    action=(
                        moderation_pb2.MODERATION_ACTION_APPROVE if raising else moderation_pb2.MODERATION_ACTION_HIDE
                    ),
                    visibility=visibility,
                    reason=reason,
                    clear_flags=True,
                )
            )

    def approve_host_request(self, host_request_id: int, reason: str = "Test approval") -> None:
        """host_request_id is the conversation_id of the host request."""
        self.set_visibility(
            moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
            host_request_id,
            moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
            reason,
        )

    def hide_host_request(self, host_request_id: int, reason: str = "Test hide") -> None:
        """host_request_id is the conversation_id of the host request."""
        self.set_visibility(
            moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
            host_request_id,
            moderation_pb2.MODERATION_VISIBILITY_HIDDEN,
            reason,
        )

    def approve_group_chat(self, group_chat_id: int, reason: str = "Test approval") -> None:
        """group_chat_id is the conversation_id of the group chat."""
        self.set_visibility(
            moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT,
            group_chat_id,
            moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
            reason,
        )

    def set_group_chat_visibility(
        self,
        group_chat_id: int,
        visibility: moderation_pb2.ModerationVisibility.ValueType,
        reason: str = "Test moderation",
    ) -> None:
        self.set_visibility(moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT, group_chat_id, visibility, reason)

    def approve_friend_request(self, friend_request_id: int, reason: str = "Test approval") -> None:
        """friend_request_id is the FriendRelationship id."""
        self.set_visibility(
            moderation_pb2.MODERATION_OBJECT_TYPE_FRIEND_REQUEST,
            friend_request_id,
            moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
            reason,
        )

    def approve_event_occurrence(self, occurrence_id: int, reason: str = "Test approval") -> None:
        """occurrence_id is the EventOccurrence id, which is what the proto calls event_id."""
        self.set_visibility(
            moderation_pb2.MODERATION_OBJECT_TYPE_EVENT_OCCURRENCE,
            occurrence_id,
            moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
            reason,
        )

    def approve_comment(self, comment_id: int, reason: str = "Test approval") -> None:
        """comment_id is the database id of the Comment."""
        self.set_visibility(
            moderation_pb2.MODERATION_OBJECT_TYPE_COMMENT,
            comment_id,
            moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
            reason,
        )

    def approve_reply(self, reply_id: int, reason: str = "Test approval") -> None:
        """reply_id is the database id of the Reply."""
        self.set_visibility(
            moderation_pb2.MODERATION_OBJECT_TYPE_REPLY,
            reply_id,
            moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
            reason,
        )

    def approve_discussion(self, discussion_id: int, reason: str = "Test approval") -> None:
        """discussion_id is the database id of the Discussion."""
        self.set_visibility(
            moderation_pb2.MODERATION_OBJECT_TYPE_DISCUSSION,
            discussion_id,
            moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
            reason,
        )

    def approve_reference(self, reference_id: int, reason: str = "Test approval") -> None:
        self.set_visibility(
            moderation_pb2.MODERATION_OBJECT_TYPE_REFERENCE,
            reference_id,
            moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
            reason,
        )

    def approve_public_trip(self, public_trip_id: int, reason: str = "Test approval") -> None:
        self.set_visibility(
            moderation_pb2.MODERATION_OBJECT_TYPE_PUBLIC_TRIP,
            public_trip_id,
            moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
            reason,
        )

    def approve_thread_post(self, packed_thread_id: int, reason: str = "Test approval") -> None:
        """Approve whichever of Comment/Reply the packed thread_id refers to."""
        self.set_thread_post_visibility(packed_thread_id, moderation_pb2.MODERATION_VISIBILITY_VISIBLE, reason)

    def set_thread_post_visibility(
        self,
        packed_thread_id: int,
        visibility: moderation_pb2.ModerationVisibility.ValueType,
        reason: str = "Test moderation",
    ) -> None:
        """Moderate whichever of Comment/Reply the packed thread_id refers to."""
        database_id, depth = unpack_thread_id(packed_thread_id)
        if depth == 1:
            object_type = moderation_pb2.MODERATION_OBJECT_TYPE_COMMENT
        elif depth == 2:
            object_type = moderation_pb2.MODERATION_OBJECT_TYPE_REPLY
        else:
            raise ValueError(f"thread_id {packed_thread_id} has unsupported depth {depth}")
        self.set_visibility(object_type, database_id, visibility, reason)
