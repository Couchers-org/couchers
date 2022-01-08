import grpc
import pytest

from couchers.models import User
from couchers.sql import couchers_select as select
from proto import notifications_pb2
from tests.test_fixtures import db, generate_user, notifications_session, session_scope, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_GetNotificationSettings(db):
    _, token = generate_user()

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.new_notifications_enabled = False

    with notifications_session(token) as notifications:
        res = notifications.GetNotificationSettings(notifications_pb2.GetNotificationSettingsReq())
    assert not res.new_notifications_enabled

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.new_notifications_enabled = True

    with notifications_session(token) as notifications:
        res = notifications.GetNotificationSettings(notifications_pb2.GetNotificationSettingsReq())
    assert res.new_notifications_enabled


def test_SetNotificationSettings(db):
    _, token = generate_user()

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.new_notifications_enabled = False

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(enable_new_notifications=False)
        )

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert not user.new_notifications_enabled

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(enable_new_notifications=True)
        )

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert user.new_notifications_enabled

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(enable_new_notifications=False)
        )

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert not user.new_notifications_enabled
