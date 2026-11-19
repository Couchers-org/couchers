from datetime import timedelta
from typing import Any

import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select, update

from couchers.db import session_scope
from couchers.materialized_views import refresh_materialized_views
from couchers.models import HostingStatus, HostRequestStatus, Message, MessageType, User
from couchers.proto import account_pb2, api_pb2
from couchers.utils import now
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import account_session
from tests.test_references import create_friend_reference, create_host_request

LONG_ABOUT_PLACE = "My home is a cosy flat with a spare room and a very comfy couch."


def _generate_host(**kwargs: Any) -> tuple[Any, str]:
    fields: dict[str, Any] = dict(hosting_status=HostingStatus.can_host, about_place=LONG_ABOUT_PLACE)
    fields.update(kwargs)
    return generate_user(**fields)


def _get_account_info(token: str) -> account_pb2.GetAccountInfoRes:
    refresh_materialized_views(empty_pb2.Empty())
    with account_session(token) as account:
        res: account_pb2.GetAccountInfoRes = account.GetAccountInfo(empty_pb2.Empty())
    return res


def _assert_account_info(token: str, host_pool: int, newbie_pool_eligible: bool, host_profile_ready: bool) -> None:
    res = _get_account_info(token)
    assert (res.host_pool, res.newbie_pool_eligible, res.host_profile_ready) == (
        host_pool,
        newbie_pool_eligible,
        host_profile_ready,
    )


def _add_references(host_id: int, count: int) -> list[int]:
    author_ids = []
    for _ in range(count):
        author, _ = generate_user()
        with session_scope() as session:
            create_friend_reference(session, author.id, host_id, timedelta(days=10))
        author_ids.append(author.id)
    return author_ids


def _add_host_requests(
    host_id: int,
    count: int,
    response_time: timedelta | None,
    *,
    accepted: bool = False,
    status: HostRequestStatus = HostRequestStatus.confirmed,
    host_request_age: timedelta = timedelta(days=15),
    is_offer: bool = False,
) -> None:
    for _ in range(count):
        surfer, _ = generate_user()
        with session_scope() as session:
            conversation_id = create_host_request(
                session, surfer.id, host_id, host_request_age=host_request_age, status=status, is_offer=is_offer
            )
            if response_time is not None:
                created = session.execute(
                    select(Message.time)
                    .where(Message.conversation_id == conversation_id)
                    .where(Message.message_type == MessageType.chat_created)
                ).scalar_one()
                if accepted:
                    response = Message(
                        conversation_id=conversation_id,
                        author_id=host_id,
                        message_type=MessageType.host_request_status_changed,
                        host_request_status_target=HostRequestStatus.accepted,
                    )
                else:
                    response = Message(
                        conversation_id=conversation_id,
                        author_id=host_id,
                        text="Thanks for your request!",
                        message_type=MessageType.text,
                    )
                response.time = created + response_time
                session.add(response)


def test_host_pool_newbie_without_requests(db):
    _, token = _generate_host()
    _assert_account_info(token, api_pb2.HOST_POOL_NEWBIE, True, True)


@pytest.mark.parametrize(
    "kwargs",
    [
        {"hosting_status": HostingStatus.maybe},
        {"hosting_status": HostingStatus.cant_host},
        {"about_place": None},
        {"about_place": "x" * 50},
        {"complete_profile": False},
    ],
)
def test_host_pool_host_profile_not_ready(db, kwargs):
    _, token = _generate_host(**kwargs)
    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, True, False)


def test_host_pool_about_place_just_long_enough(db):
    _, token = _generate_host(about_place="x" * 51)
    _assert_account_info(token, api_pb2.HOST_POOL_NEWBIE, True, True)


def test_host_pool_newbie_with_a_reference(db):
    host, token = _generate_host()
    _add_references(host.id, 1)
    _assert_account_info(token, api_pb2.HOST_POOL_NEWBIE, True, True)


def test_host_pool_normal_with_two_references(db):
    host, token = _generate_host()
    _add_references(host.id, 2)
    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, False, True)


def test_host_pool_ignores_references_hidden_from_profile(db):
    host, token = _generate_host()
    author_ids = _add_references(host.id, 2)
    with session_scope() as session:
        session.execute(update(User).where(User.id == author_ids[0]).values(banned_at=now()))
    _assert_account_info(token, api_pb2.HOST_POOL_NEWBIE, True, True)


def test_host_pool_ineligible_and_not_ready(db):
    host, token = _generate_host(hosting_status=HostingStatus.cant_host)
    _add_references(host.id, 2)
    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, False, False)


def test_host_pool_newbie_with_prompt_responses(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 1, timedelta(hours=95), accepted=True)
    _add_host_requests(host.id, 4, timedelta(hours=95))
    _assert_account_info(token, api_pb2.HOST_POOL_NEWBIE, True, True)


def test_host_pool_normal_with_too_many_requests(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 1, timedelta(hours=1), accepted=True)
    _add_host_requests(host.id, 5, timedelta(hours=1))
    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, False, True)


def test_host_pool_normal_with_slow_responses(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 1, timedelta(hours=97), accepted=True)
    _add_host_requests(host.id, 2, timedelta(hours=97))
    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, False, True)


def test_host_pool_normal_with_unanswered_requests(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 1, timedelta(hours=1), accepted=True)
    _add_host_requests(host.id, 1, timedelta(hours=1))
    _add_host_requests(host.id, 2, None)
    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, False, True)


def test_host_pool_newbie_with_two_unaccepted_requests(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 2, timedelta(hours=1))
    _assert_account_info(token, api_pb2.HOST_POOL_NEWBIE, True, True)


def test_host_pool_normal_without_acceptance_in_first_requests(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 3, timedelta(hours=1))
    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, False, True)


def test_host_pool_late_acceptance_does_not_count(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 3, timedelta(hours=1))
    _add_host_requests(host.id, 1, timedelta(hours=1), accepted=True)
    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, False, True)


def test_host_pool_acceptance_counts_after_cancellation(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 1, timedelta(hours=1), accepted=True, status=HostRequestStatus.cancelled)
    _add_host_requests(host.id, 2, timedelta(hours=1))
    _assert_account_info(token, api_pb2.HOST_POOL_NEWBIE, True, True)


def test_host_pool_pending_first_request_keeps_eligibility(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 2, timedelta(hours=1))
    _add_host_requests(host.id, 1, None, status=HostRequestStatus.pending, host_request_age=timedelta(days=-10))
    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, True, True)


def test_host_pool_pending_first_request_in_the_past_loses_eligibility(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 2, timedelta(hours=1))
    _add_host_requests(host.id, 1, None, status=HostRequestStatus.pending)
    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, False, True)


def test_host_pool_ignores_offers_on_public_trips(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 3, timedelta(hours=1), is_offer=True)
    _assert_account_info(token, api_pb2.HOST_POOL_NEWBIE, True, True)


def test_host_pool_in_account_info_is_live(db):
    host, token = _generate_host()
    _assert_account_info(token, api_pb2.HOST_POOL_NEWBIE, True, True)

    with session_scope() as session:
        session.execute(update(User).where(User.id == host.id).values(hosting_status=HostingStatus.cant_host))

    _assert_account_info(token, api_pb2.HOST_POOL_NORMAL, True, False)

