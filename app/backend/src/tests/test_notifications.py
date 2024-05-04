import grpc
import pytest

from couchers import errors, urls
from couchers.jobs.worker import process_job
from couchers.models import Notification, NotificationDelivery, NotificationDeliveryType, NotificationTopicAction, User
from couchers.notifications.notify import notify
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


@pytest.mark.parametrize("enabled", [True, False])
def test_SetNotificationSettings_preferences_respected_editable(db, enabled):
    user, token = generate_user()

    # enable a notification type and check it gets delivered
    topic_action = NotificationTopicAction.friend_request__accept

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                enable_new_notifications=True,
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="push",
                        enabled=enabled,
                    )
                ],
            )
        )

    notify(
        user_id=user.id,
        topic=topic_action.topic,
        key="1",
        action=topic_action.action,
        avatar_key=None,
        icon="person",
        title=f"**Dummy** accepted your friend request",
        link=urls.user_link(username="dummy"),
    )

    process_job()

    with session_scope() as session:
        deliv = session.execute(
            select(NotificationDelivery)
            .join(Notification, Notification.id == NotificationDelivery.notification_id)
            .where(Notification.user_id == user.id)
            .where(Notification.topic_action == topic_action)
            .where(NotificationDelivery.delivery_type == NotificationDeliveryType.push)
        ).scalar_one_or_none()

        if enabled:
            assert deliv is not None
        else:
            assert deliv is None


def test_SetNotificationSettings_preferences_not_editable(db):
    user, token = generate_user()

    # enable a notification type and check it gets delivered
    topic_action = NotificationTopicAction.account_recovery__start

    with notifications_session(token) as notifications:
        with pytest.raises(grpc.RpcError) as e:
            notifications.SetNotificationSettings(
                notifications_pb2.SetNotificationSettingsReq(
                    enable_new_notifications=True,
                    preferences=[
                        notifications_pb2.SingleNotificationPreference(
                            topic=topic_action.topic,
                            action=topic_action.action,
                            delivery_method="push",
                            enabled=False,
                        )
                    ],
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANNOT_EDIT_THAT_NOTIFICATION_PREFERENCE
