import grpc
import pytest

from couchers.models import User
from couchers.sql import couchers_select as select
from proto import notifications_pb2
from tests.test_fixtures import db, generate_user, notifications_session, session_scope, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_GetNewNotificationsEnabled(db):
    _, token = generate_user()

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.new_notifications_enabled = False

    with notifications_session(token) as notifications:
        res = notifications.GetNewNotificationsEnabled(notifications_pb2.GetNewNotificationsEnabledReq())
    assert not res.new_notifications_enabled

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.new_notifications_enabled = True

    with notifications_session(token) as notifications:
        res = notifications.GetNewNotificationsEnabled(notifications_pb2.GetNewNotificationsEnabledReq())
    assert res.new_notifications_enabled


def test_SetNewNotificationsEnabled(db):
    _, token = generate_user()

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.new_notifications_enabled = False

    with notifications_session(token) as notifications:
        res = notifications.SetNewNotificationsEnabled(
            notifications_pb2.SetNewNotificationsEnabledReq(enable_new_notifications=False)
        )
    assert not res.new_notifications_enabled

    with notifications_session(token) as notifications:
        res = notifications.SetNewNotificationsEnabled(
            notifications_pb2.SetNewNotificationsEnabledReq(enable_new_notifications=True)
        )
    assert res.new_notifications_enabled

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert user.new_notifications_enabled

    with notifications_session(token) as notifications:
        res = notifications.SetNewNotificationsEnabled(
            notifications_pb2.SetNewNotificationsEnabledReq(enable_new_notifications=False)
        )
    assert not res.new_notifications_enabled

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert not user.new_notifications_enabled
