from contextlib import contextmanager
from dataclasses import dataclass
from unittest.mock import patch

from couchers.jobs.worker import process_job
from couchers.models import User
from couchers.proto import moderation_pb2
from tests.fixtures.sessions import real_moderation_session


def process_jobs():
    while process_job():
        pass


@contextmanager
def mock_notification_email():
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


def email_fields(mock, call_ix=0):
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


class Push:
    """
    This allows nice access to the push info via e.g. push.title instead of push["title"]
    """

    def __init__(self, kwargs):
        self.kwargs = kwargs

    def __getattr__(self, attr):
        try:
            return self.kwargs[attr]
        except KeyError:
            raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{attr}'") from None

    def __repr__(self):
        kwargs_disp = ", ".join(f"'{key}'='{val}'" for key, val in self.kwargs.items())
        return f"Push({kwargs_disp})"


class PushCollector:
    def __init__(self):
        # pairs of (user_id, push)
        self.pushes = []

    def by_user(self, user_id):
        return [kwargs for uid, kwargs in self.pushes if uid == user_id]

    def push_to_user(self, session, user_id, **kwargs):
        self.pushes.append((user_id, Push(kwargs=kwargs)))

    def assert_user_has_count(self, user_id, count):
        assert len(self.by_user(user_id)) == count

    def assert_user_push_matches_fields(self, user_id, ix=0, **kwargs):
        push = self.by_user(user_id)[ix]
        for kwarg in kwargs:
            assert kwarg in push.kwargs, f"Push notification {user_id=}, {ix=} missing field '{kwarg}'"
            assert push.kwargs[kwarg] == kwargs[kwarg], (
                f"Push notification {user_id=}, {ix=} mismatch in field '{kwarg}', expected '{kwargs[kwarg]}' but got '{push.kwargs[kwarg]}'"
            )

    def assert_user_has_single_matching(self, user_id, **kwargs):
        self.assert_user_has_count(user_id, 1)
        self.assert_user_push_matches_fields(user_id, ix=0, **kwargs)


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
