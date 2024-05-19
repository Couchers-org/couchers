from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors, urls
from couchers.crypto import b64decode
from couchers.jobs.enqueue import queue_job
from couchers.jobs.worker import process_job
from couchers.models import Notification, NotificationDelivery, NotificationDeliveryType, NotificationTopicAction, User
from couchers.notifications.notify import notify
from couchers.sql import couchers_select as select
from proto import auth_pb2, notifications_pb2
from tests.test_fixtures import (  # noqa
    auth_api_session,
    db,
    generate_user,
    notifications_session,
    session_scope,
    testconfig,
)


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


def test_unsubscribe(db):
    # this is the ugliest test i've written

    user, token = generate_user()

    topic_action = NotificationTopicAction.friend_request__accept

    # first enable email notifs
    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                enable_new_notifications=True,
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method=method,
                        enabled=enabled,
                    )
                    for method, enabled in [("email", True), ("digest", False), ("push", False)]
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
    queue_job("handle_email_notifications", empty_pb2.Empty())

    with patch("couchers.email.queue_email") as mock:
        while process_job():
            pass

    assert mock.call_count == 1
    (_, _, recipient, _, plain, html), _ = mock.call_args
    assert recipient == user.email
    # very ugly
    start = "To unsubscribe from these types of notifications click on this link: <"
    ix_s = plain.find(start) + len(start)
    ix_e = plain.find(">", ix_s)
    # should look something like
    # http://localhost:3000/unsubscribe?payload=CAEiGAoOZnJpZW5kX3JlcXVlc3QSBmFjY2VwdA==&sig=BQdk024NTATm8zlR0krSXTBhP5U9TlFv7VhJeIHZtUg=
    topic_action_unsub_url = plain[ix_s:ix_e]
    url_parts = urlparse(topic_action_unsub_url)
    params = parse_qs(url_parts.query)

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.Unsubscribe(
            auth_pb2.UnsubscribeReq(
                payload=b64decode(params["payload"][0]),
                sig=b64decode(params["sig"][0]),
            )
        )

    with notifications_session(token) as notifications:
        res = notifications.GetNotificationSettings(notifications_pb2.GetNotificationSettingsReq())
    assert res.new_notifications_enabled
    for group in res.groups:
        for topic in group.topics:
            for item in topic.items:
                if topic == topic_action.topic and item == topic_action.action:
                    assert not item.email

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
    queue_job("handle_email_notifications", empty_pb2.Empty())

    with patch("couchers.email.queue_email") as mock:
        while process_job():
            pass

    assert mock.call_count == 0
