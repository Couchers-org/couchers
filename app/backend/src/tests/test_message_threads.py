from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select

from couchers.constants import MISSED_MESSAGES_DELAY
from couchers.db import session_scope
from couchers.helpers.host_requests import has_unseen_host_request_messages
from couchers.jobs.handlers import send_message_notifications
from couchers.models import HostRequest, NotificationTopicAction, User
from couchers.proto import api_pb2, conversations_pb2, messages_pb2, notifications_pb2, requests_pb2
from couchers.utils import today
from tests.fixtures.api import conversations as conversations_api
from tests.fixtures.api import requests as requests_api
from tests.fixtures.db import generate_user, make_user_block
from tests.fixtures.feature_flags import FeatureFlags
from tests.fixtures.misc import process_jobs
from tests.fixtures.rpc_errors import expect_rpc_error
from tests.fixtures.sessions import (
    notifications_session,
    real_api_session,
)
from tests.fixtures.timewarp import Timewarp
from tests.test_communities import create_community
from tests.test_public_trips import _create_trip_directly


def _make_trip(user: User) -> tuple[int, int]:
    """Create a community + an active public trip for the given traveller."""
    with session_scope() as session:
        node_id = create_community(session, 0, 2, "Test community", [user], [], None).id
    trip_id = _create_trip_directly(user.id, node_id, today() + timedelta(days=5), today() + timedelta(days=10))
    return node_id, trip_id


def _create_group_chat(token: str, recipient_ids: list[int], moderator, text: str = "hi") -> int:
    res = conversations_api.create_group_chat(token=token, recipient_user_ids=recipient_ids, approve_by=moderator)
    conversations_api.send_message(token=token, group_chat_id=res.group_chat_id, text=text)
    return int(res.group_chat_id)


def test_has_unseen_host_request_messages_is_false_for_a_non_party(db, moderator):
    host_user, _host_token = generate_user()
    _surfer_user, surfer_token = generate_user()
    outsider, _outsider_token = generate_user()

    conversation_id = requests_api.create_host_request(
        token=surfer_token, host_user_id=host_user.id, approve_by=moderator
    )

    with session_scope() as session:
        unseen_for = {
            user_id: session.execute(
                select(HostRequest.conversation_id)
                .where(HostRequest.conversation_id == conversation_id)
                .where(has_unseen_host_request_messages(user_id))
            ).scalar_one_or_none()
            for user_id in (host_user.id, outsider.id)
        }

    assert unseen_for[host_user.id] == conversation_id
    assert unseen_for[outsider.id] is None


def test_list_message_threads_latest_status_change_message(db, moderator):
    # Regression: a thread whose latest message is a host-request status change
    # must serialize with its content set (not an empty control message).
    host_user, host_token = generate_user()
    surfer_user, surfer_token = generate_user()

    request_id = requests_api.create_host_request(token=surfer_token, host_user_id=host_user.id, approve_by=moderator)

    # the host accepts, so the latest message becomes a status change
    requests_api.respond_host_request(
        token=host_token, host_request_id=request_id, status=messages_pb2.HOST_REQUEST_STATUS_ACCEPTED
    )

    res = conversations_api.list_message_threads(token=host_token)
    thread = next(t for t in res.threads if t.WhichOneof("thread") == "host_request")
    assert thread.host_request.latest_message.WhichOneof("content") == "host_request_status_changed"
    assert (
        thread.host_request.latest_message.host_request_status_changed.status
        == messages_pb2.HOST_REQUEST_STATUS_ACCEPTED
    )


def test_list_message_threads_need_host_request_feedback(db, moderator):
    host_user, host_token = generate_user()
    surfer_user, surfer_token = generate_user()

    request_id = requests_api.create_host_request(token=surfer_token, host_user_id=host_user.id, approve_by=moderator)

    def host_request_thread(token: str) -> requests_pb2.HostRequest:
        res = conversations_api.list_message_threads(token=token)
        thread: requests_pb2.HostRequest = next(
            t.host_request for t in res.threads if t.host_request.host_request_id == request_id
        )
        return thread

    assert not host_request_thread(host_token).need_host_request_feedback

    requests_api.respond_host_request(
        token=host_token, host_request_id=request_id, status=messages_pb2.HOST_REQUEST_STATUS_REJECTED
    )

    assert host_request_thread(host_token).need_host_request_feedback
    # only the host is asked for feedback
    assert not host_request_thread(surfer_token).need_host_request_feedback

    requests_api.send_host_request_feedback(
        token=host_token, host_request_id=request_id, host_request_quality=requests_pb2.HOST_REQUEST_QUALITY_LOW
    )

    assert not host_request_thread(host_token).need_host_request_feedback


def test_list_message_threads_no_feedback_for_declined_public_trip_offer(db, moderator):
    traveller, traveller_token = generate_user()
    _host, host_token = generate_user()
    _, trip_id = _make_trip(traveller)

    request_id = requests_api.create_host_request(
        token=host_token,
        host_user_id=traveller.id,
        from_date=today() + timedelta(days=5),
        to_date=today() + timedelta(days=10),
        public_trip_id=trip_id,
        approve_by=moderator,
    )

    # the traveller is the recipient of an offer, so they're the one who declines
    requests_api.respond_host_request(
        token=traveller_token, host_request_id=request_id, status=messages_pb2.HOST_REQUEST_STATUS_REJECTED
    )

    for token in (traveller_token, host_token):
        res = conversations_api.list_message_threads(token=token)
        thread = next(t.host_request for t in res.threads if t.host_request.host_request_id == request_id)
        assert not thread.need_host_request_feedback


def test_list_message_threads_can_message(db, moderator):
    viewer_user, viewer_token = generate_user()
    blocker_user, blocker_token = generate_user()
    departed_user, departed_token = generate_user()

    blocked_dm_id = _create_group_chat(viewer_token, [blocker_user.id], moderator)
    departed_dm_id = _create_group_chat(viewer_token, [departed_user.id], moderator)
    chat_id = _create_group_chat(viewer_token, [blocker_user.id, departed_user.id], moderator)

    def can_message_by_chat(token: str) -> dict[int, bool]:
        res = conversations_api.list_message_threads(token=token)
        return {t.group_chat.group_chat_id: t.group_chat.can_message for t in res.threads}

    assert can_message_by_chat(viewer_token) == {blocked_dm_id: True, departed_dm_id: True, chat_id: True}

    make_user_block(blocker_user, viewer_user)
    conversations_api.leave_group_chat(token=departed_token, group_chat_id=departed_dm_id)

    # a DM whose other party is blocked or gone can't be messaged; a true group chat always can
    assert can_message_by_chat(viewer_token) == {blocked_dm_id: False, departed_dm_id: False, chat_id: True}


def test_list_message_threads_interleaves_chats_and_requests(db, moderator):
    host_user, host_token = generate_user()
    surfer_user, surfer_token = generate_user()

    chat_id = _create_group_chat(host_token, [surfer_user.id], moderator)
    # the surfer sends a host request to the host
    request_id = requests_api.create_host_request(token=surfer_token, host_user_id=host_user.id, approve_by=moderator)

    res = conversations_api.list_message_threads(token=host_token)

    kinds = [t.WhichOneof("thread") for t in res.threads]
    assert "group_chat" in kinds
    assert "host_request" in kinds
    ids = {
        (t.group_chat.group_chat_id if t.WhichOneof("thread") == "group_chat" else t.host_request.host_request_id)
        for t in res.threads
    }
    assert ids == {chat_id, request_id}
    # The host request was created after the group chat, so it sorts first (latest message).
    assert res.threads[0].WhichOneof("thread") == "host_request"


def test_list_message_threads_single_cursor_pagination_across_kinds(db, moderator):
    user, token = generate_user()
    others = [generate_user() for _ in range(6)]

    # track the two kinds separately so we verify each id comes back as the right kind
    expected_chat_ids = set()
    expected_request_ids = set()
    # interleave creating group chats and host requests so both kinds straddle page boundaries
    for other, other_token in others:
        expected_chat_ids.add(_create_group_chat(token, [other.id], moderator))
        expected_request_ids.add(
            requests_api.create_host_request(token=other_token, host_user_id=user.id, approve_by=moderator)
        )

    collected_chat_ids: list[int] = []
    collected_request_ids: list[int] = []
    latest_ids: list[int] = []
    page_token = ""
    while True:
        res = conversations_api.list_message_threads(token=token, page_size=3, page_token=page_token)
        for t in res.threads:
            if t.WhichOneof("thread") == "group_chat":
                collected_chat_ids.append(t.group_chat.group_chat_id)
                latest_ids.append(t.group_chat.latest_message.message_id)
            else:
                collected_request_ids.append(t.host_request.host_request_id)
                latest_ids.append(t.host_request.latest_message.message_id)
        if not res.next_page_token:
            break
        page_token = res.next_page_token

    # every thread appears exactly once as its correct kind, none missing or duplicated
    assert sorted(collected_chat_ids) == sorted(expected_chat_ids)
    assert sorted(collected_request_ids) == sorted(expected_request_ids)
    assert len(collected_chat_ids) == len(set(collected_chat_ids))
    assert len(collected_request_ids) == len(set(collected_request_ids))
    # globally ordered by latest message id, descending, with no straddling across pages
    assert latest_ids == sorted(latest_ids, reverse=True)


def test_list_message_threads_chats_filter_excludes_host_requests(db, moderator):
    host_user, host_token = generate_user()
    surfer_user, surfer_token = generate_user()

    chat_id = _create_group_chat(host_token, [surfer_user.id], moderator)
    requests_api.create_host_request(token=surfer_token, host_user_id=host_user.id, approve_by=moderator)

    res = conversations_api.list_message_threads(
        token=host_token, categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_CHATS]
    )

    assert [t.WhichOneof("thread") for t in res.threads] == ["group_chat"]
    assert res.threads[0].group_chat.group_chat_id == chat_id


def test_list_message_threads_roster_is_frozen_for_a_departed_viewer(db, moderator):
    """
    A viewer who was removed from a chat sees its roster as it was when they left, so anyone added
    afterwards is invisible to them.
    """
    admin, admin_token = generate_user()
    viewer, viewer_token = generate_user()
    member, _member_token = generate_user()
    latecomer, _latecomer_token = generate_user()

    chat_id = _create_group_chat(admin_token, [viewer.id, member.id], moderator)

    conversations_api.remove_group_chat_user(token=admin_token, group_chat_id=chat_id, user_id=viewer.id)
    conversations_api.invite_to_group_chat(token=admin_token, group_chat_id=chat_id, user_id=latecomer.id)

    res = conversations_api.list_message_threads(token=viewer_token)
    departed_view = res.threads[0].group_chat
    assert set(departed_view.member_user_ids) == {admin.id, viewer.id, member.id}
    assert list(departed_view.admin_user_ids) == [admin.id]
    # chat created, "hi" and the removal notice; the invite notice is out of reach
    assert departed_view.unseen_message_count == 3

    res = conversations_api.list_message_threads(token=admin_token)
    admin_view = res.threads[0].group_chat
    assert set(admin_view.member_user_ids) == {admin.id, member.id, latecomer.id}


def test_list_message_threads_rejects_unspecified_category(db):
    _user, token = generate_user()

    with expect_rpc_error(grpc.StatusCode.INVALID_ARGUMENT):
        conversations_api.list_message_threads(
            token=token, categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_UNSPECIFIED]
        )


def test_list_message_threads_unread_filter(db, moderator):
    host_user, host_token = generate_user()
    surfer_user, surfer_token = generate_user()

    # the surfer sends a request to the host -> the host has unseen messages
    request_id = requests_api.create_host_request(token=surfer_token, host_user_id=host_user.id, approve_by=moderator)

    res = conversations_api.list_message_threads(token=host_token, only_unread=True)
    assert [t.host_request.host_request_id for t in res.threads] == [request_id]

    # after marking everything seen, the unread filter is empty
    conversations_api.mark_all_threads_seen(token=host_token)
    res = conversations_api.list_message_threads(token=host_token, only_unread=True)
    assert len(res.threads) == 0


def test_list_message_threads_archived_is_orthogonal(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    chat_id = _create_group_chat(token1, [user2.id], moderator)

    # archive the chat
    conversations_api.set_group_chat_archive_status(token=token1, group_chat_id=chat_id, is_archived=True)

    # default (non-archived) excludes it
    res = conversations_api.list_message_threads(token=token1, only_archived=False)
    assert len(res.threads) == 0

    # only_archived=True includes it
    res = conversations_api.list_message_threads(token=token1, only_archived=True)
    assert [t.group_chat.group_chat_id for t in res.threads] == [chat_id]


def test_list_message_threads_public_trip_offer_role_based(db, moderator):
    traveler, traveler_token = generate_user()
    host, host_token = generate_user()
    _, trip_id = _make_trip(traveler)

    # host offers to host the traveller's public trip (role reversal)
    request_id = requests_api.create_host_request(
        token=host_token,
        host_user_id=traveler.id,
        from_date=today() + timedelta(days=5),
        to_date=today() + timedelta(days=10),
        public_trip_id=trip_id,
        approve_by=moderator,
    )

    # From the offering host's view: appears under HOSTING (role-based filter)
    res = conversations_api.list_message_threads(
        token=host_token, categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_HOSTING]
    )
    assert len(res.threads) == 1
    hr = res.threads[0].host_request
    assert hr.host_request_id == request_id
    assert hr.HasField("public_trip_id")
    assert hr.public_trip_id == trip_id
    # payload keeps the Requests API semantics: surfer/host are the stay roles, which an
    # offer reverses — the offering host is the host, the trip's traveller is the surfer
    assert hr.surfer_user_id == traveler.id
    assert hr.host_user_id == host.id

    # not under SURFING for the host
    res = conversations_api.list_message_threads(
        token=host_token, categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_SURFING]
    )
    assert len(res.threads) == 0

    # the same request served by the Requests API has to agree on who's who
    from_requests_api = requests_api.get_host_request(token=host_token, host_request_id=request_id)
    assert (from_requests_api.surfer_user_id, from_requests_api.host_user_id) == (hr.surfer_user_id, hr.host_user_id)

    # From the traveller's view: appears under SURFING and MY_PUBLIC_TRIPS (role-based filters)
    res = conversations_api.list_message_threads(
        token=traveler_token, categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_SURFING]
    )
    assert [t.host_request.host_request_id for t in res.threads] == [request_id]
    # same payload regardless of viewer
    assert res.threads[0].host_request.surfer_user_id == traveler.id
    assert res.threads[0].host_request.host_user_id == host.id

    res = conversations_api.list_message_threads(
        token=traveler_token, categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS]
    )
    assert [t.host_request.host_request_id for t in res.threads] == [request_id]

    # also present in ALL
    res = conversations_api.list_message_threads(token=traveler_token)
    assert request_id in {t.host_request.host_request_id for t in res.threads}


def test_list_message_threads_public_trips_filter_gated_by_flag(db, moderator, feature_flags: FeatureFlags):
    feature_flags.set("public_trips_enabled", False)

    traveler, traveler_token = generate_user()

    res = conversations_api.list_message_threads(
        token=traveler_token, categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS]
    )
    assert len(res.threads) == 0
    assert not res.next_page_token


def test_mark_all_threads_seen_rejects_unspecified_category(db):
    _user, token = generate_user()

    with expect_rpc_error(grpc.StatusCode.INVALID_ARGUMENT):
        conversations_api.mark_all_threads_seen(
            token=token, categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_UNSPECIFIED]
        )


def test_mark_all_threads_seen_respects_categories(db, moderator):
    recipient_user, recipient_token = generate_user()
    _sender_user, sender_token = generate_user()

    # an unread group chat and an unread host request, both from the sender
    _create_group_chat(sender_token, [recipient_user.id], moderator, text="hello there")
    requests_api.create_host_request(token=sender_token, host_user_id=recipient_user.id, approve_by=moderator)

    def unseen() -> tuple[int, int]:
        with real_api_session(recipient_token) as api:
            res = api.Ping(api_pb2.PingReq())
        return res.unseen_message_count, res.unseen_received_host_request_count

    assert unseen() == (2, 1)

    conversations_api.mark_all_threads_seen(
        token=recipient_token, categories=[conversations_pb2.MESSAGE_THREAD_CATEGORY_CHATS]
    )
    # the chat is now read; the host request is untouched
    assert unseen() == (0, 1)

    conversations_api.mark_all_threads_seen(token=recipient_token)
    assert unseen() == (0, 0)


def test_mark_all_threads_seen_respects_unread_and_archived_filters(db, moderator):
    recipient_user, recipient_token = generate_user()
    _user2, token2 = generate_user()
    _user3, token3 = generate_user()

    archived_chat_id = _create_group_chat(token2, [recipient_user.id], moderator, text="archived")
    _create_group_chat(token3, [recipient_user.id], moderator, text="not archived")

    conversations_api.set_group_chat_archive_status(
        token=recipient_token, group_chat_id=archived_chat_id, is_archived=True
    )

    def unseen_chat_messages() -> int:
        with real_api_session(recipient_token) as api:
            return int(api.Ping(api_pb2.PingReq()).unseen_message_count)

    # two messages in each chat: the creation notice and the text
    assert unseen_chat_messages() == 4

    conversations_api.mark_all_threads_seen(token=recipient_token, only_archived=True)
    assert unseen_chat_messages() == 2

    conversations_api.mark_all_threads_seen(token=recipient_token, only_unread=True)
    assert unseen_chat_messages() == 0


def test_departed_group_chat_unseen_count_agrees_with_ping_and_clears(db, moderator):
    """
    Regression test: the per-thread unseen count used to include messages sent after the viewer left
    the chat, which the Ping badge never counted, and MarkAllThreadsSeen skipped departed chats
    entirely — so the list showed unread messages the viewer couldn't read and couldn't clear.

    The viewer is removed rather than leaving, because leaving posts a message of your own, which
    marks everything up to it seen.
    """
    viewer_user, viewer_token = generate_user()
    _creator_user, creator_token = generate_user()
    other_user, _other_token = generate_user()

    chat_id = _create_group_chat(creator_token, [viewer_user.id, other_user.id], moderator)

    conversations_api.remove_group_chat_user(token=creator_token, group_chat_id=chat_id, user_id=viewer_user.id)
    for _ in range(3):
        conversations_api.send_message(token=creator_token, group_chat_id=chat_id, text="after you left")

    def unseen_counts() -> tuple[int, int]:
        with real_api_session(viewer_token) as api:
            ping_count = api.Ping(api_pb2.PingReq()).unseen_message_count
        res = conversations_api.list_message_threads(token=viewer_token)
        thread = next(t for t in res.threads if t.group_chat.group_chat_id == chat_id)
        return thread.group_chat.unseen_message_count, ping_count

    # chat created, "hi", and the removal notice; the three messages sent afterwards are out of reach
    assert unseen_counts() == (3, 3)

    conversations_api.mark_all_threads_seen(token=viewer_token)
    assert unseen_counts() == (0, 0)


def test_rejoined_group_chat_reads_the_current_subscription(db, moderator):
    """
    Regression test: rejoining a chat leaves the earlier subscription behind, with its own last-seen
    state. The unread filter and the Ping badge used to match on any of the viewer's subscriptions,
    so the stale one held the chat unread and kept the badge up, while the count the list showed and
    the row MarkAllThreadsSeen advanced came from the current subscription and could never clear it.
    """
    viewer_user, viewer_token = generate_user()
    _creator_user, creator_token = generate_user()
    other_user, _other_token = generate_user()

    chat_id = _create_group_chat(creator_token, [viewer_user.id, other_user.id], moderator)

    # removed rather than leaving, so the viewer's first subscription is left behind with unread messages
    conversations_api.remove_group_chat_user(token=creator_token, group_chat_id=chat_id, user_id=viewer_user.id)
    conversations_api.send_message(token=creator_token, group_chat_id=chat_id, text="while you were away")
    conversations_api.invite_to_group_chat(token=creator_token, group_chat_id=chat_id, user_id=viewer_user.id)
    conversations_api.send_message(token=creator_token, group_chat_id=chat_id, text="welcome back")

    def unread_chat_ids() -> list[int]:
        res = conversations_api.list_message_threads(token=viewer_token, only_unread=True)
        return [t.group_chat.group_chat_id for t in res.threads]

    def unseen_counts() -> tuple[int, int]:
        with real_api_session(viewer_token) as api:
            ping_count = api.Ping(api_pb2.PingReq()).unseen_message_count
        res = conversations_api.list_message_threads(token=viewer_token)
        threads = [t for t in res.threads if t.group_chat.group_chat_id == chat_id]
        # the two subscriptions must not surface the chat twice
        assert len(threads) == 1
        return threads[0].group_chat.unseen_message_count, ping_count

    # only the invite notice and "welcome back" are in reach; the first stint's messages are not
    assert unseen_counts() == (2, 2)
    assert unread_chat_ids() == [chat_id]

    conversations_api.mark_all_threads_seen(token=viewer_token)
    assert unseen_counts() == (0, 0)
    assert unread_chat_ids() == []


def test_mark_all_threads_seen_clears_missed_messages_notification(db, moderator, timewarp: Timewarp):
    """
    Regression test: chat__missed_messages is a summary keyed with "" rather than a chat id, so it
    needs its own (topic actions, keys) group instead of being pooled with the per-chat keys.
    """
    sender_user, sender_token = generate_user()
    recipient_user, recipient_token = generate_user()

    # this notification is email-only by default, and the in-app feed only shows push-enabled ones
    with notifications_session(recipient_token) as n:
        n.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=NotificationTopicAction.chat__missed_messages.topic,
                        action=NotificationTopicAction.chat__missed_messages.action,
                        delivery_method="push",
                        enabled=True,
                    )
                ]
            )
        )

    _create_group_chat(sender_token, [recipient_user.id], moderator, text="hello there")

    # the job only picks up messages that have been unseen for five minutes
    timewarp.advance(MISSED_MESSAGES_DELAY)
    send_message_notifications(empty_pb2.Empty())
    process_jobs()

    def unseen_missed_messages():
        with notifications_session(recipient_token) as n:
            res = n.ListNotifications(notifications_pb2.ListNotificationsReq(only_unread=True))
        return [
            notification
            for notification in res.notifications
            if notification.topic == NotificationTopicAction.chat__missed_messages.topic
            and notification.action == NotificationTopicAction.chat__missed_messages.action
        ]

    assert len(unseen_missed_messages()) == 1

    conversations_api.mark_all_threads_seen(token=recipient_token)

    assert unseen_missed_messages() == []
