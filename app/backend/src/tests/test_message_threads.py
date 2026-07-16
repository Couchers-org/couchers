from datetime import timedelta

import grpc
import pytest

from couchers.db import session_scope
from couchers.models import Cluster, Node, NodeType
from couchers.models.public_trips import PublicTrip, PublicTripStatus
from couchers.proto import api_pb2, conversations_pb2, requests_pb2
from couchers.utils import create_polygon_lat_lng, to_multi, today
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import conversations_session, real_api_session, requests_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


HOST_REQUEST_TEXT = "a" * 300


def _make_trip(user_id: int) -> tuple[int, int]:
    """Create a community node + an active public trip for the given traveller."""
    with session_scope() as session:
        node = Node(
            geom=to_multi(create_polygon_lat_lng([[60, 24], [60, 26], [62, 26], [62, 24], [60, 24]])),
            node_type=NodeType.locality,
        )
        session.add(node)
        session.flush()
        session.add(
            Cluster(
                name="Test community",
                description="Test",
                parent_node_id=node.id,
                is_official_cluster=True,
                small_community_features_enabled=True,
            )
        )
        session.flush()
        trip = PublicTrip(
            user_id=user_id,
            node_id=node.id,
            from_date=today() + timedelta(days=5),
            to_date=today() + timedelta(days=10),
            description="x" * 200,
            status=PublicTripStatus.searching_for_host,
        )
        session.add(trip)
        session.flush()
        return node.id, trip.id


def _create_group_chat(token: str, recipient_ids: list[int], moderator, text: str = "hi") -> int:
    with conversations_session(token) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=recipient_ids))
        c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=res.group_chat_id, text=text))
    moderator.approve_group_chat(res.group_chat_id)
    return int(res.group_chat_id)


def _create_host_request(surfer_token: str, host_id: int, moderator, public_trip_id: int | None = None) -> int:
    with requests_session(surfer_token) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host_id,
                from_date=(today() + timedelta(days=5)).isoformat(),
                to_date=(today() + timedelta(days=10)).isoformat(),
                text=HOST_REQUEST_TEXT,
                public_trip_id=public_trip_id,
            )
        )
    moderator.approve_host_request(res.host_request_id)
    return int(res.host_request_id)


def test_list_message_threads_latest_status_change_message(db, moderator):
    # Regression: a thread whose latest message is a host-request status change
    # must serialize with its content set (not an empty control message).
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    request_id = _create_host_request(token2, user1.id, moderator)

    # user1 (the host) accepts, so the latest message becomes a status change
    with requests_session(token1) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="",
            )
        )

    with conversations_session(token1) as c:
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_ALL)
        )
    thread = next(t for t in res.threads if t.WhichOneof("thread") == "host_request")
    assert thread.host_request.latest_message.WhichOneof("content") == "host_request_status_changed"
    assert (
        thread.host_request.latest_message.host_request_status_changed.status
        == conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
    )


def test_list_message_threads_interleaves_chats_and_requests(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    chat_id = _create_group_chat(token1, [user2.id], moderator)
    # user2 sends a host request to user1 (user1 is the host)
    request_id = _create_host_request(token2, user1.id, moderator)

    with conversations_session(token1) as c:
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_ALL)
        )

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
    user1, token1 = generate_user()
    others = [generate_user() for _ in range(6)]

    expected_ids = set()
    # interleave creating group chats and host requests so both kinds straddle page boundaries
    for i, (other, other_token) in enumerate(others):
        expected_ids.add(_create_group_chat(token1, [other.id], moderator))
        expected_ids.add(_create_host_request(other_token, user1.id, moderator))

    collected: list[int] = []
    latest_ids: list[int] = []
    page_token = ""
    while True:
        with conversations_session(token1) as c:
            res = c.ListMessageThreads(
                conversations_pb2.ListMessageThreadsReq(
                    filter=conversations_pb2.MESSAGE_THREAD_FILTER_ALL, page_size=3, page_token=page_token
                )
            )
        for t in res.threads:
            if t.WhichOneof("thread") == "group_chat":
                collected.append(t.group_chat.group_chat_id)
                latest_ids.append(t.group_chat.latest_message.message_id)
            else:
                collected.append(t.host_request.host_request_id)
                latest_ids.append(t.host_request.latest_message.message_id)
        if res.no_more:
            break
        page_token = res.next_page_token

    # every thread appears exactly once, none missing or duplicated
    assert sorted(collected) == sorted(expected_ids)
    assert len(collected) == len(set(collected))
    # globally ordered by latest message id, descending, with no straddling across pages
    assert latest_ids == sorted(latest_ids, reverse=True)


def test_list_message_threads_chats_filter_excludes_host_requests(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    chat_id = _create_group_chat(token1, [user2.id], moderator)
    _create_host_request(token2, user1.id, moderator)

    with conversations_session(token1) as c:
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_CHATS)
        )

    assert [t.WhichOneof("thread") for t in res.threads] == ["group_chat"]
    assert res.threads[0].group_chat.group_chat_id == chat_id


def test_message_threads_reject_unspecified_filter(db):
    user1, token1 = generate_user()

    with conversations_session(token1) as c:
        with pytest.raises(grpc.RpcError) as e:
            c.ListMessageThreads(
                conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_UNSPECIFIED)
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        with pytest.raises(grpc.RpcError) as e:
            c.MarkAllThreadsSeen(
                conversations_pb2.MarkAllThreadsSeenReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_UNSPECIFIED)
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT


def test_list_message_threads_unread_filter(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # user2 sends a request to user1 -> user1 has unseen messages
    request_id = _create_host_request(token2, user1.id, moderator)

    with conversations_session(token1) as c:
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_UNREAD)
        )
        assert [t.host_request.host_request_id for t in res.threads] == [request_id]

        # after marking everything seen, the unread filter is empty
        c.MarkAllThreadsSeen(
            conversations_pb2.MarkAllThreadsSeenReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_ALL)
        )
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_UNREAD)
        )
        assert len(res.threads) == 0


def test_list_message_threads_archived_is_orthogonal(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    chat_id = _create_group_chat(token1, [user2.id], moderator)

    with conversations_session(token1) as c:
        # archive the chat
        c.SetGroupChatArchiveStatus(
            conversations_pb2.SetGroupChatArchiveStatusReq(group_chat_id=chat_id, is_archived=True)
        )

        # default (non-archived) excludes it
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(
                filter=conversations_pb2.MESSAGE_THREAD_FILTER_ALL, only_archived=False
            )
        )
        assert len(res.threads) == 0

        # only_archived=True includes it
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(
                filter=conversations_pb2.MESSAGE_THREAD_FILTER_ALL, only_archived=True
            )
        )
        assert [t.group_chat.group_chat_id for t in res.threads] == [chat_id]


def test_list_message_threads_public_trip_offer_role_based(db, moderator):
    traveler, traveler_token = generate_user()
    host, host_token = generate_user()
    _, trip_id = _make_trip(traveler.id)

    # host offers to host the traveller's public trip (role reversal)
    request_id = _create_host_request(host_token, traveler.id, moderator, public_trip_id=trip_id)

    # From the offering host's view: appears under HOSTING, with correct roles
    with conversations_session(host_token) as c:
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_HOSTING)
        )
        assert len(res.threads) == 1
        hr = res.threads[0].host_request
        assert hr.host_request_id == request_id
        assert hr.HasField("public_trip_id")
        assert hr.public_trip_id == trip_id
        # viewer is the offering host: host_user_id == own id (viewer_is_host derived client-side)
        assert hr.host_user_id == host.id
        assert hr.surfer_user_id == traveler.id

        # not under SURFING for the host
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_SURFING)
        )
        assert len(res.threads) == 0

    # From the traveller's view: appears under SURFING and PUBLIC_TRIPS, never as the surfer being the host
    with conversations_session(traveler_token) as c:
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_SURFING)
        )
        assert [t.host_request.host_request_id for t in res.threads] == [request_id]
        assert res.threads[0].host_request.surfer_user_id == traveler.id
        # viewer is the traveller, not the host: host_user_id != own id
        assert res.threads[0].host_request.host_user_id == host.id
        assert res.threads[0].host_request.host_user_id != traveler.id

        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_PUBLIC_TRIPS)
        )
        assert [t.host_request.host_request_id for t in res.threads] == [request_id]

        # also present in ALL
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_ALL)
        )
        assert request_id in {t.host_request.host_request_id for t in res.threads}


def test_list_message_threads_public_trips_filter_gated_by_flag(db, moderator, feature_flags):
    feature_flags.set("public_trips_enabled", False)

    traveler, traveler_token = generate_user()

    with conversations_session(traveler_token) as c:
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_PUBLIC_TRIPS)
        )
        assert len(res.threads) == 0
        assert res.no_more


def test_mark_all_threads_seen_respects_filter(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # an unread group chat (user2 messages user1) and an unread host request
    chat_id = _create_group_chat(token2, [user1.id], moderator, text="hello there")
    _create_host_request(token2, user1.id, moderator)

    with conversations_session(token1) as c:
        # mark only chats seen
        c.MarkAllThreadsSeen(
            conversations_pb2.MarkAllThreadsSeenReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_CHATS)
        )
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_UNREAD)
        )
        # the chat is now read; the host request is still unread
        remaining = [t.WhichOneof("thread") for t in res.threads]
        assert remaining == ["host_request"]

        # marking the host request's group chat seen does nothing more for chats
        c.MarkAllThreadsSeen(
            conversations_pb2.MarkAllThreadsSeenReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_ALL)
        )
        res = c.ListMessageThreads(
            conversations_pb2.ListMessageThreadsReq(filter=conversations_pb2.MESSAGE_THREAD_FILTER_UNREAD)
        )
        assert len(res.threads) == 0
    assert chat_id  # referenced


def test_ping_role_aware_counts_match_direction_without_offers(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # user2 surfs to user1 -> user1 is the host of the stay
    _create_host_request(token2, user1.id, moderator)

    with real_api_session(token1) as api:
        res = api.Ping(api_pb2.PingReq())
        # with no public-trip offers, role-based counts equal the direction-based ones
        assert res.unseen_received_host_request_count == 1
        assert res.unseen_hosting_host_request_count == 1
        assert res.unseen_sent_host_request_count == 0
        assert res.unseen_surfing_host_request_count == 0
        assert res.unseen_public_trip_offer_count == 0


def test_ping_counts_public_trip_offer_by_role(db, moderator):
    traveler, traveler_token = generate_user()
    host, host_token = generate_user()
    _, trip_id = _make_trip(traveler.id)

    request_id = _create_host_request(host_token, traveler.id, moderator, public_trip_id=trip_id)

    # the traveller (recipient) has the offer's create message unseen: counts as SURFING + public-trip offer
    with real_api_session(traveler_token) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.unseen_surfing_host_request_count == 1
        assert res.unseen_public_trip_offer_count == 1
        assert res.unseen_hosting_host_request_count == 0

    # the traveller replies, so now the offering host has an unseen message under HOSTING
    with requests_session(traveler_token) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=request_id, text="thanks for the offer")
        )

    with real_api_session(host_token) as api:
        res = api.Ping(api_pb2.PingReq())
        assert res.unseen_hosting_host_request_count == 1
        assert res.unseen_surfing_host_request_count == 0
        assert res.unseen_public_trip_offer_count == 0


def test_ping_public_trip_offer_count_gated_by_flag(db, moderator, feature_flags):
    feature_flags.set("public_trips_enabled", False)

    traveler, traveler_token = generate_user()
    host, host_token = generate_user()
    _, trip_id = _make_trip(traveler.id)

    _create_host_request(host_token, traveler.id, moderator, public_trip_id=trip_id)

    with real_api_session(traveler_token) as api:
        res = api.Ping(api_pb2.PingReq())
        # the dedicated offer count is gated off...
        assert res.unseen_public_trip_offer_count == 0
        # ...but the offer is a real conversation and still surfaces under surfing
        assert res.unseen_surfing_host_request_count == 1
