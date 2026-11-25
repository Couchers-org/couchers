import time
from collections.abc import Generator
from concurrent import futures
from typing import Any

import grpc
import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy import func, select, update

from couchers import bfc
from couchers.config import config
from couchers.db import session_scope
from couchers.materialized_views import refresh_materialized_views, refresh_materialized_views_rapid
from couchers.models import User
from couchers.models.logging import EventLog
from couchers.proto import api_pb2, search_pb2
from couchers.proto.bfc import bfc_pb2, bfc_pb2_grpc
from couchers.servicers import search
from tests.fixtures.db import generate_user, make_user_block
from tests.fixtures.feature_flags import Flags
from tests.fixtures.rpc_errors import expect_rpc_error
from tests.fixtures.sessions import search_session


class FakeBfc(bfc_pb2_grpc.BFCServicer):
    def __init__(self) -> None:
        self.requests: list[bfc_pb2.UserSearchReq] = []
        self.response = bfc_pb2.UserSearchRes()
        self.fail_with: grpc.StatusCode | None = None
        self.delay_seconds = 0.0

    def UserSearch(self, request: bfc_pb2.UserSearchReq, context: grpc.ServicerContext) -> bfc_pb2.UserSearchRes:
        self.requests.append(request)
        time.sleep(self.delay_seconds)
        if self.fail_with:
            context.abort(self.fail_with, "bfc is down")
        return self.response


@pytest.fixture
def fake_bfc(monkeypatch, flags: Flags) -> Generator[FakeBfc]:
    fake = FakeBfc()
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor)
        bfc_pb2_grpc.add_BFCServicer_to_server(fake, server)
        port = server.add_insecure_port("localhost:0")
        server.start()
        monkeypatch.setitem(config, "BFC_ADDRESS", f"localhost:{port}")
        flags.set_boolean("bfc_user_search_enabled", True)
        try:
            yield fake
        finally:
            server.stop(None).wait()


@pytest.fixture
def reported_errors(monkeypatch) -> list[Exception]:
    errors: list[Exception] = []
    monkeypatch.setattr(search, "report_error", errors.append)
    return errors


def _refresh() -> None:
    refresh_materialized_views_rapid(empty_pb2.Empty())
    refresh_materialized_views(empty_pb2.Empty())


def _search_event() -> dict[str, Any]:
    with session_scope() as session:
        [event] = session.execute(select(EventLog).where(EventLog.event_type == "search.performed")).scalars().all()
        return dict(event.properties)


def test_request(db, fake_bfc: FakeBfc):
    user, token = generate_user(strong_verification=True)
    blocked, _ = generate_user()
    blocker, _ = generate_user()
    make_user_block(user, blocked)
    make_user_block(blocker, user)

    with search_session(token) as api:
        api.UserSearchV2(
            search_pb2.UserSearchReq(
                search_in_rectangle=search_pb2.RectArea(lat_min=1, lat_max=2, lng_min=3, lng_max=4),
                hosting_status_filter=[api_pb2.HOSTING_STATUS_CAN_HOST, api_pb2.HOSTING_STATUS_MAYBE],
                language_ability_filter=[
                    api_pb2.LanguageAbility(code="fin", fluency=api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT)
                ],
                age_max=wrappers_pb2.UInt32Value(value=40),
                has_pets=wrappers_pb2.BoolValue(value=False),
                only_with_references=True,
                same_gender_only=True,
                page_size=10,
                page_token="token",
            )
        )

    [req] = fake_bfc.requests
    assert req.viewer_id == user.id
    assert sorted(req.blocked_user_ids) == sorted([blocked.id, blocker.id])
    assert req.rectangle == bfc_pb2.Rectangle(lat_min=1, lng_min=3, lat_max=2, lng_max=4)
    assert req.page_size == 10
    assert req.page_token == "token"
    assert list(req.filters.hosting_status) == [api_pb2.HOSTING_STATUS_CAN_HOST, api_pb2.HOSTING_STATUS_MAYBE]
    assert [(a.code, a.fluency) for a in req.filters.language_ability] == [
        ("fin", api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT)
    ]
    assert req.filters.age_min.value == 18
    assert req.filters.age_max.value == 40
    assert req.filters.HasField("has_pets") and not req.filters.has_pets.value
    assert not req.filters.HasField("accepts_pets")
    assert not req.filters.HasField("last_active")
    assert req.filters.only_with_references
    assert list(req.filters.genders) == [user.gender]


def test_serves_bfc_results(db, fake_bfc: FakeBfc):
    user, token = generate_user()
    others = [generate_user()[0] for _ in range(4)]
    _refresh()

    fake_bfc.response = bfc_pb2.UserSearchRes(
        search_id="search",
        results=[bfc_pb2.UserSearchResult(user_id=other.id) for other in reversed(others)],
        page_size=3,
        next_page_token="next",
        total=17,
        unfiltered_total=42,
    )
    with search_session(token) as api:
        res = api.UserSearchV2(search_pb2.UserSearchReq())

    assert [result.user_id for result in res.results] == [other.id for other in reversed(others)][:3]
    assert res.next_page_token == "next"
    assert res.total_items == 17
    assert res.total_unfiltered_items == 42
    event = _search_event()
    assert event["source"] == "bfc"
    assert event["bfc_search_id"] == "search"


def test_falls_back_when_bfc_fails(db, fake_bfc: FakeBfc, reported_errors: list[Exception]):
    fake_bfc.fail_with = grpc.StatusCode.UNAVAILABLE
    user, token = generate_user()
    _refresh()

    with search_session(token) as api:
        res = api.UserSearchV2(search_pb2.UserSearchReq())

    assert user.id in [result.user_id for result in res.results]
    assert res.total_unfiltered_items == 0
    assert len(fake_bfc.requests) == 1
    assert len(reported_errors) == 1
    event = _search_event()
    assert event["source"] == "fallback"
    assert event["bfc_search_id"] is None


def test_falls_back_when_bfc_is_too_slow(db, fake_bfc: FakeBfc, reported_errors: list[Exception], monkeypatch):
    monkeypatch.setattr(bfc, "TIMEOUT_SECONDS", 0.1)
    fake_bfc.delay_seconds = 0.5
    user, token = generate_user()
    _refresh()

    with search_session(token) as api:
        res = api.UserSearchV2(search_pb2.UserSearchReq())

    assert user.id in [result.user_id for result in res.results]
    assert len(reported_errors) == 1
    assert _search_event()["source"] == "fallback"


def test_same_gender_needs_strong_verification(db, fake_bfc: FakeBfc):
    user, token = generate_user()

    with search_session(token) as api:
        with expect_rpc_error(grpc.StatusCode.FAILED_PRECONDITION):
            api.UserSearchV2(search_pb2.UserSearchReq(same_gender_only=True))

    assert fake_bfc.requests == []


def test_keywords_and_selections_stay_in_the_backend(db, fake_bfc: FakeBfc):
    user, token = generate_user()

    with search_session(token) as api:
        api.UserSearchV2(search_pb2.UserSearchReq(query=wrappers_pb2.StringValue(value="anything")))
        api.UserSearchV2(search_pb2.UserSearchReq(exactly_user_ids=[user.id]))

    assert fake_bfc.requests == []


def test_flag_off(db, fake_bfc: FakeBfc, flags: Flags):
    flags.set_boolean("bfc_user_search_enabled", False)
    user, token = generate_user()

    with search_session(token) as api:
        res = api.UserSearchV2(search_pb2.UserSearchReq())

    assert res.total_unfiltered_items == 0
    assert fake_bfc.requests == []
    assert _search_event()["source"] == "backend"


def test_skips_users_the_viewer_cannot_see(db, fake_bfc: FakeBfc):
    user, token = generate_user()
    visible, _ = generate_user()
    deleted, _ = generate_user()
    blocked, _ = generate_user()
    _refresh()
    make_user_block(user, blocked)
    with session_scope() as session:
        session.execute(update(User).where(User.id == deleted.id).values(deleted_at=func.now()))

    fake_bfc.response = bfc_pb2.UserSearchRes(
        results=[bfc_pb2.UserSearchResult(user_id=u.id) for u in [deleted, visible, blocked]],
        page_size=3,
        total=3,
    )
    with search_session(token) as api:
        res = api.UserSearchV2(search_pb2.UserSearchReq())

    assert [result.user_id for result in res.results] == [visible.id]
