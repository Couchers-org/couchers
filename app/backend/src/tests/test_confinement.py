"""
Per-user data must reach its own user and nobody else.

Tests usually assert that a user who has something gets it, and the bug that survives that is the one where somebody
else gets it too: the `lite_users` strong verification bug matched attempts to users by birthdate and gender, which no
"the verified user has the badge" assertion can tell apart from matching by identity. So these build a population that
collides on everything that isn't an identity, give each user a different fact, and assert each fact reaches exactly
one of them.
"""

import json
from datetime import timedelta
from types import SimpleNamespace
from typing import Any

import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy_utils import refresh_materialized_view

from couchers.db import session_scope
from couchers.helpers.badges import user_add_badge
from couchers.materialized_views import LiteUser, refresh_materialized_views_rapid
from couchers.models import Message, MessageType
from couchers.models.uploads import get_avatar_upload
from couchers.proto import api_pb2, messages_pb2, requests_pb2
from couchers.utils import now, today
from tests.fixtures.db import backdate_conversations, generate_user
from tests.fixtures.sessions import api_session, gis_session, requests_session
from tests.test_requests import valid_request_text


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


# everything a user could be confused by: the fixture seed collides birthdate, gender and location
COLLIDING: dict[str, Any] = dict(fixture_seed="collision", name="Same Name", city="Same City", hometown="Same Hometown")


@pytest.fixture
def population(db):
    """Users indistinguishable except by identity, each holding one per-user fact the others don't"""
    verified, _ = generate_user(**COLLIDING, strong_verification=True)
    badged, _ = generate_user(**COLLIDING)
    incomplete, _ = generate_user(**COLLIDING, complete_profile=False)
    _, token = generate_user()

    with session_scope() as session:
        user_add_badge(session, badged.id, "volunteer", do_notify=False)

    with session_scope() as session:
        avatar_urls = {
            user.username: (upload.full_url if (upload := get_avatar_upload(session, user)) else "")
            for user in (verified, badged, incomplete)
        }

    return SimpleNamespace(
        verified=verified,
        badged=badged,
        incomplete=incomplete,
        users=[verified, badged, incomplete],
        avatar_urls=avatar_urls,
        token=token,
    )


def test_GetUser_confines_per_user_facts(population):
    with api_session(population.token) as api:
        responses = {user.username: api.GetUser(api_pb2.GetUserReq(user=user.username)) for user in population.users}

    assert [username for username, res in responses.items() if res.has_strong_verification] == [
        population.verified.username
    ]
    assert [username for username, res in responses.items() if res.badges] == [population.badged.username]

    for username, res in responses.items():
        assert res.username == username
        assert res.avatar_url == population.avatar_urls[username]


def test_GetLiteUser_confines_per_user_facts(population):
    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(population.token) as api:
        responses = {
            user.username: api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)) for user in population.users
        }

    assert [username for username, res in responses.items() if res.has_strong_verification] == [
        population.verified.username
    ]

    for user in population.users:
        res = responses[user.username]
        assert res.user_id == user.id
        assert res.avatar_url == population.avatar_urls[user.username]


def test_GetLiteUsers_confines_per_user_facts(population):
    refresh_materialized_views_rapid(empty_pb2.Empty())

    # mixing usernames and ids, since the batch is assembled from a lookup by each
    queries = [population.verified.username, str(population.badged.id), population.incomplete.username]

    with api_session(population.token) as api:
        res = api.GetLiteUsers(api_pb2.GetLiteUsersReq(users=queries))

    assert [response.query for response in res.responses] == queries
    assert [response.user.user_id for response in res.responses] == [user.id for user in population.users]
    assert [response.user.has_strong_verification for response in res.responses] == [True, False, False]


def test_GetUsers_geojson_confines_per_user_facts(population):
    refresh_materialized_views_rapid(empty_pb2.Empty())

    with gis_session(population.token) as gis:
        data = json.loads(gis.GetUsers(empty_pb2.Empty()).data)

    completeness = {
        feature["properties"]["id"]: feature["properties"]["has_completed_profile"] for feature in data["features"]
    }

    assert completeness[population.verified.id]
    assert completeness[population.badged.id]
    assert not completeness[population.incomplete.id]


def test_lite_users_confines_strong_verification(population):
    refresh_materialized_views_rapid(empty_pb2.Empty())

    with session_scope() as session:
        verified_ids = session.execute(select(LiteUser.id).where(LiteUser.has_strong_verification)).scalars().all()

    assert set(verified_ids) == {population.verified.id}


# a host needs this many requests older than the response window before a rate is reported at all
_REQUESTS_FOR_A_RATE = 3


def _request_hosting(surfer_token: str, host_id: int, moderator) -> int:
    """Send a host request and age it past the window the response rate is measured over"""
    with requests_session(surfer_token) as api:
        host_request_id: int = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host_id,
                from_date=(today() + timedelta(days=2)).isoformat(),
                to_date=(today() + timedelta(days=3)).isoformat(),
                text=valid_request_text(),
            )
        ).host_request_id

    moderator.approve_host_request(host_request_id)
    backdate_conversations()

    with session_scope() as session:
        session.execute(
            select(Message)
            .where(Message.conversation_id == host_request_id)
            .where(Message.message_type == MessageType.chat_created)
        ).scalar_one().time = now() - timedelta(hours=34)

    return host_request_id


def test_GetResponseRate_confines_rates_to_their_own_host(db, moderator):
    """The response rates view unions message subqueries across hosts, so each host must get their own"""
    responsive, responsive_token = generate_user()
    unresponsive, _ = generate_user()
    quiet, _ = generate_user()
    _, surfer_token = generate_user()

    answered = [_request_hosting(surfer_token, responsive.id, moderator) for _ in range(_REQUESTS_FOR_A_RATE)]
    for _ in range(_REQUESTS_FOR_A_RATE):
        _request_hosting(surfer_token, unresponsive.id, moderator)

    with requests_session(responsive_token) as api:
        for host_request_id in answered:
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=host_request_id,
                    status=messages_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                    text="Accepting host request",
                )
            )

    with session_scope() as session:
        refresh_materialized_view(session, "user_response_rates")

    with requests_session(surfer_token) as api:
        rates = {
            host.username: api.GetResponseRate(requests_pb2.GetResponseRateReq(user_id=host.id))
            for host in (responsive, unresponsive, quiet)
        }

    assert rates[quiet.username].HasField("insufficient_data")
    assert rates[unresponsive.username].HasField("low")
    assert rates[responsive.username].HasField("almost_all")
