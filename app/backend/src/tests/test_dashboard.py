from datetime import timedelta

import pytest
from google.protobuf import empty_pb2

from couchers.constants import HOST_REQUEST_MIN_LENGTH_UTF16
from couchers.proto import conversations_pb2, dashboard_pb2, discussions_pb2, events_pb2, requests_pb2
from couchers.utils import today
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import (
    account_session,
    dashboard_session,
    discussions_session,
    events_session,
    requests_session,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


UPCOMING_STATUSES = [
    conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
    conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED,
]


def valid_request_text(text: str = "Test request") -> str:
    """Pads a request text to a valid length (measured in utf-16 code units, matching the frontend)."""
    utf16_length = len(text.encode("utf-16-le")) // 2
    if utf16_length >= HOST_REQUEST_MIN_LENGTH_UTF16:
        return text
    return text + ("_" * (HOST_REQUEST_MIN_LENGTH_UTF16 - utf16_length))


def _setup_accepted_host_request(token_surfer, host_user_id, moderator):
    from_date = today() + timedelta(days=2)
    to_date = today() + timedelta(days=3)
    with requests_session(token_surfer) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host_user_id,
                from_date=from_date.isoformat(),
                to_date=to_date.isoformat(),
                text=valid_request_text(),
            )
        ).host_request_id
    moderator.approve_host_request(host_request_id)
    return host_request_id


def test_GetDashboardV2_matches_individual_rpcs(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    host_request_id = _setup_accepted_host_request(token1, user2.id, moderator)
    with requests_session(token2) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Sure, come on over!",
            )
        )

    # the dashboard response must be identical to fanning out to the individual RPCs with the
    # same parameters the web frontend uses
    with requests_session(token1) as api:
        surfing = api.ListHostRequests(
            requests_pb2.ListHostRequestsReq(
                only_sent=True,
                only_active=True,
                status_in=UPCOMING_STATUSES,
                sort_by=requests_pb2.HOST_REQUEST_SORT_BY_FROM_DATE,
            )
        )
        hosting = api.ListHostRequests(
            requests_pb2.ListHostRequestsReq(
                only_received=True,
                only_active=True,
                status_in=UPCOMING_STATUSES,
                sort_by=requests_pb2.HOST_REQUEST_SORT_BY_FROM_DATE,
            )
        )
    with events_session(token1) as api:
        my_events = api.ListMyEvents(events_pb2.ListMyEventsReq(page_size=3))
        community_events = api.ListMyEvents(
            events_pb2.ListMyEventsReq(page_size=3, my_communities=True, my_communities_exclude_global=True)
        )
    with discussions_session(token1) as api:
        discussions = api.ListMyCommunitiesDiscussions(discussions_pb2.ListMyCommunitiesDiscussionsReq(page_size=3))
    with account_session(token1) as api:
        reminders = api.GetReminders(empty_pb2.Empty())

    with dashboard_session(token1) as api:
        res = api.GetDashboardV2(dashboard_pb2.GetDashboardV2Req())

    assert res.reminders == reminders
    assert res.surfing == surfing
    assert res.hosting == hosting
    assert res.my_events == my_events
    assert res.community_events == community_events
    assert res.discussions == discussions

    # the surfer sees their upcoming trip under surfing, nothing under hosting
    assert len(res.surfing.host_requests) == 1
    assert res.surfing.host_requests[0].host_request_id == host_request_id
    assert res.surfing.host_requests[0].status == conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED
    assert len(res.hosting.host_requests) == 0


def test_GetDashboardV2_buckets_by_role(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    host_request_id = _setup_accepted_host_request(token1, user2.id, moderator)
    with requests_session(token2) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Sure, come on over!",
            )
        )

    # the host sees the upcoming stay under hosting, nothing under surfing
    with dashboard_session(token2) as api:
        res = api.GetDashboardV2(dashboard_pb2.GetDashboardV2Req())
    assert len(res.hosting.host_requests) == 1
    assert res.hosting.host_requests[0].host_request_id == host_request_id
    assert len(res.surfing.host_requests) == 0


def test_GetDashboardV2_empty(db):
    user, token = generate_user()
    with dashboard_session(token) as api:
        res = api.GetDashboardV2(dashboard_pb2.GetDashboardV2Req())
    assert len(res.surfing.host_requests) == 0
    assert len(res.hosting.host_requests) == 0
    assert len(res.my_events.events) == 0
    assert len(res.community_events.events) == 0
    assert len(res.discussions.discussions) == 0
    assert len(res.reminders.reminders) == 0
