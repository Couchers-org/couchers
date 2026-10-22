from datetime import time, timedelta

from couchers.db import session_scope
from couchers.proto import discussions_pb2, events_pb2, messages_pb2, requests_pb2, screens_pb2
from couchers.utils import today
from tests.fixtures.api import account as account_api
from tests.fixtures.api import events as events_api
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import (
    discussions_session,
    requests_session,
    screens_session,
)
from tests.test_communities import create_community
from tests.test_requests import valid_request_text

UPCOMING_STATUSES = [
    messages_pb2.HOST_REQUEST_STATUS_ACCEPTED,
    messages_pb2.HOST_REQUEST_STATUS_CONFIRMED,
]


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


def test_GetDashboard_matches_individual_rpcs(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    host_request_id = _setup_accepted_host_request(token1, user2.id, moderator)
    with requests_session(token2) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=messages_pb2.HOST_REQUEST_STATUS_ACCEPTED,
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
                number=10,
            )
        )
        hosting = api.ListHostRequests(
            requests_pb2.ListHostRequestsReq(
                only_received=True,
                only_active=True,
                status_in=UPCOMING_STATUSES,
                sort_by=requests_pb2.HOST_REQUEST_SORT_BY_FROM_DATE,
                number=10,
            )
        )

    my_events = events_api.list_my_events(token=token1, page_size=9)
    community_events = events_api.list_my_events(
        token=token1,
        page_size=9,
        my_communities=True,
        my_communities_exclude_global=True,
        exclude_attending=True,
    )

    with discussions_session(token1) as api:
        discussions = api.ListMyCommunitiesDiscussions(discussions_pb2.ListMyCommunitiesDiscussionsReq(page_size=9))
    reminders = account_api.get_reminders(token=token1)

    with screens_session(token1) as api:
        res = api.GetDashboard(screens_pb2.GetDashboardReq())

    assert res.reminders == reminders
    assert res.surfing == surfing
    assert res.hosting == hosting
    assert res.my_events == my_events
    assert res.community_events == community_events
    assert res.discussions == discussions

    # the surfer sees their upcoming trip under surfing, nothing under hosting
    assert len(res.surfing.host_requests) == 1
    assert res.surfing.host_requests[0].host_request_id == host_request_id
    assert res.surfing.host_requests[0].status == messages_pb2.HOST_REQUEST_STATUS_ACCEPTED
    assert len(res.hosting.host_requests) == 0


def test_GetDashboard_buckets_by_role(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    host_request_id = _setup_accepted_host_request(token1, user2.id, moderator)
    with requests_session(token2) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=messages_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                text="Sure, come on over!",
            )
        )

    # the host sees the upcoming stay under hosting, nothing under surfing
    with screens_session(token2) as api:
        res = api.GetDashboard(screens_pb2.GetDashboardReq())
    assert len(res.hosting.host_requests) == 1
    assert res.hosting.host_requests[0].host_request_id == host_request_id
    assert len(res.surfing.host_requests) == 0


def test_GetDashboard_community_events_excludes_attending(db, moderator):
    # Pins the exclude_attending parameter the web frontend sends: an event the user is
    # attending shows under my_events and must not also duplicate into community_events.
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with session_scope() as session:
        # community_events excludes global-level communities, so nest down to a subregion
        world = create_community(session, 0, 100, "World", [user1, user2], [], None)
        macroregion = create_community(session, 0, 100, "Macroregion", [user1, user2], [], world)
        region = create_community(session, 0, 100, "Region", [user1, user2], [], macroregion)
        subregion = create_community(session, 0, 100, "Subregion", [user1, user2], [], region)
        community_id = subregion.id

    e_attending = events_api.create_event(token=token2, parent_community_id=community_id, approve_by=moderator).event_id
    e_community_only = events_api.create_event(
        token=token2, parent_community_id=community_id, approve_by=moderator
    ).event_id

    events_api.set_event_attendance(
        token=token1, event_id=e_attending, attendance_state=events_pb2.ATTENDANCE_STATE_GOING
    )

    with screens_session(token1) as api:
        res = api.GetDashboard(screens_pb2.GetDashboardReq())

    # the attended event shows under my_events (which with no flags includes all relationships)...
    assert e_attending in {e.event_id for e in res.my_events.events}
    # ...while community_events must exclude it (exclude_attending), showing only the rest
    assert [e.event_id for e in res.community_events.events] == [e_community_only]


def test_GetDashboard_returns_several_pages_per_section(db, moderator):
    # the client pages through each section locally, so a section returns a batch of items and a
    # token for that section's own RPC when there are more
    page_size = 9  # GetDashboard's my_events page size
    user, token = generate_user()

    with session_scope() as session:
        community_id = create_community(session, 0, 100, "Community", [user], [], None).id

    tomorrow = today() + timedelta(days=1)
    event_ids = [
        events_api.create_event(
            token=token,
            parent_community_id=community_id,
            start_date_time=(tomorrow, time(i, 0)),
            approve_by=moderator,
        ).event_id
        for i in range(page_size + 1)
    ]

    with screens_session(token) as api:
        res = api.GetDashboard(screens_pb2.GetDashboardReq())

    assert [e.event_id for e in res.my_events.events] == event_ids[:page_size]
    assert res.my_events.next_page_token


def test_GetDashboard_empty(db):
    user, token = generate_user()
    with screens_session(token) as api:
        res = api.GetDashboard(screens_pb2.GetDashboardReq())
    assert len(res.surfing.host_requests) == 0
    assert len(res.hosting.host_requests) == 0
    assert len(res.my_events.events) == 0
    assert len(res.community_events.events) == 0
    assert len(res.discussions.discussions) == 0
    assert len(res.reminders.reminders) == 0
