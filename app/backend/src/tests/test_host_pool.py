from datetime import timedelta
from typing import Any

import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select, update

from couchers.db import session_scope
from couchers.materialized_views import LiteUser, refresh_materialized_views, refresh_materialized_views_rapid
from couchers.models import HostingStatus, HostPool, Message, MessageType, User
from couchers.proto import account_pb2, api_pb2
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


def _add_host_requests(host_id: int, count: int, response_time: timedelta | None) -> None:
    for _ in range(count):
        surfer, _ = generate_user()
        with session_scope() as session:
            conversation_id = create_host_request(session, surfer.id, host_id)
            if response_time is not None:
                created = session.execute(
                    select(Message.time)
                    .where(Message.conversation_id == conversation_id)
                    .where(Message.message_type == MessageType.chat_created)
                ).scalar_one()
                response = Message(
                    conversation_id=conversation_id,
                    author_id=host_id,
                    text="Sure, come stay!",
                    message_type=MessageType.text,
                )
                response.time = created + response_time
                session.add(response)


def test_host_pool_newbie_without_requests(db):
    _, token = _generate_host()
    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_NEWBIE


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
def test_host_pool_incomplete_profile_requirements(db, kwargs):
    _, token = _generate_host(**kwargs)
    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_INCOMPLETE


def test_host_pool_about_place_just_long_enough(db):
    _, token = _generate_host(about_place="x" * 51)
    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_NEWBIE


def test_host_pool_normal_with_a_reference(db):
    host, token = _generate_host()
    other, _ = generate_user()
    with session_scope() as session:
        create_friend_reference(session, other.id, host.id, timedelta(days=10))
    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_NORMAL


def test_host_pool_normal_takes_precedence_over_incomplete(db):
    host, token = _generate_host(hosting_status=HostingStatus.cant_host)
    other, _ = generate_user()
    with session_scope() as session:
        create_friend_reference(session, other.id, host.id, timedelta(days=10))
    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_NORMAL


def test_host_pool_newbie_with_prompt_responses(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 5, timedelta(hours=95))
    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_NEWBIE


def test_host_pool_normal_with_too_many_requests(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 6, timedelta(hours=1))
    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_NORMAL


def test_host_pool_normal_with_slow_responses(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 3, timedelta(hours=97))
    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_NORMAL


def test_host_pool_normal_with_unanswered_requests(db):
    host, token = _generate_host()
    _add_host_requests(host.id, 2, timedelta(hours=1))
    _add_host_requests(host.id, 2, None)
    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_NORMAL


def test_host_pool_in_account_info_is_live(db):
    host, token = _generate_host()
    refresh_materialized_views_rapid(empty_pb2.Empty())
    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_NEWBIE

    with session_scope() as session:
        session.execute(update(User).where(User.id == host.id).values(hosting_status=HostingStatus.cant_host))

    assert _get_account_info(token).host_pool == api_pb2.HOST_POOL_INCOMPLETE


def test_host_pool_in_lite_users(db):
    newbie, _ = _generate_host()
    incomplete, _ = _generate_host(about_place=None)
    normal, _ = _generate_host()
    other, _ = generate_user()
    with session_scope() as session:
        create_friend_reference(session, other.id, normal.id, timedelta(days=10))

    refresh_materialized_views(empty_pb2.Empty())
    refresh_materialized_views_rapid(empty_pb2.Empty())

    with session_scope() as session:
        host_pools = {
            row.id: row.host_pool
            for row in session.execute(
                select(LiteUser.id, LiteUser.host_pool).where(LiteUser.id.in_([newbie.id, incomplete.id, normal.id]))
            ).all()
        }
    assert host_pools == {newbie.id: HostPool.newbie, incomplete.id: HostPool.incomplete, normal.id: HostPool.normal}
