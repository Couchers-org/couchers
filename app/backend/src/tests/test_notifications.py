import re
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.crypto import b64decode
from couchers.jobs.enqueue import queue_job
from couchers.jobs.worker import process_job
from couchers.models import (
    HostingStatus,
    MeetupStatus,
    Notification,
    NotificationDelivery,
    NotificationDeliveryType,
    NotificationTopicAction,
    User,
)
from couchers.notifications.notify import notify_v2
from couchers.sql import couchers_select as select
from proto import auth_pb2, notification_data_pb2, notifications_pb2
from proto.internal import unsubscribe_pb2
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
    topic_action = NotificationTopicAction.badge__add

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

    notify_v2(
        user_id=user.id,
        topic_action=topic_action.display,
        data=notification_data_pb2.BadgeAdd(
            badge_id="volunteer",
            badge_name="Active Volunteer",
            badge_description="This user is an active volunteer for Couchers.org",
        ),
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
    topic_action = NotificationTopicAction.password_reset__start

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

    topic_action = NotificationTopicAction.badge__add

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

    notify_v2(
        user_id=user.id,
        topic_action=topic_action.display,
        data=notification_data_pb2.BadgeAdd(
            badge_id="volunteer",
            badge_name="Active Volunteer",
            badge_description="This user is an active volunteer for Couchers.org",
        ),
    )

    queue_job("handle_email_notifications", empty_pb2.Empty())

    with patch("couchers.templates.v2.queue_email") as mock:
        while process_job():
            pass

    assert mock.call_count == 1
    _, kwargs = mock.call_args
    assert kwargs["recipient"] == user.email
    # very ugly
    # http://localhost:3000/unsubscribe?payload=CAEiGAoOZnJpZW5kX3JlcXVlc3QSBmFjY2VwdA==&sig=BQdk024NTATm8zlR0krSXTBhP5U9TlFv7VhJeIHZtUg=
    for link in re.findall(r'<a href="(.*?)"', kwargs["html"]):
        if "payload" not in link:
            continue
        print(link)
        url_parts = urlparse(link)
        params = parse_qs(url_parts.query)
        print(params["payload"][0])
        payload = unsubscribe_pb2.UnsubscribePayload.FromString(b64decode(params["payload"][0]))
        if payload.HasField("topic_action"):
            with auth_api_session() as (auth_api, metadata_interceptor):
                res = auth_api.Unsubscribe(
                    auth_pb2.UnsubscribeReq(
                        payload=b64decode(params["payload"][0]),
                        sig=b64decode(params["sig"][0]),
                    )
                )
            break
    else:
        raise Exception("Didn't find link")

    with notifications_session(token) as notifications:
        res = notifications.GetNotificationSettings(notifications_pb2.GetNotificationSettingsReq())
    assert res.new_notifications_enabled
    for group in res.groups:
        for topic in group.topics:
            for item in topic.items:
                if topic == topic_action.topic and item == topic_action.action:
                    assert not item.email

    notify_v2(
        user_id=user.id,
        topic_action=topic_action.display,
        data=notification_data_pb2.BadgeAdd(
            badge_id="volunteer",
            badge_name="Active Volunteer",
            badge_description="This user is an active volunteer for Couchers.org",
        ),
    )

    queue_job("handle_email_notifications", empty_pb2.Empty())

    with patch("couchers.templates.v2.queue_email") as mock:
        while process_job():
            pass

    assert mock.call_count == 0


def test_notifications_do_not_email(db):
    _, token = generate_user()

    with notifications_session(token) as notifications:
        notifications.SetDoNotEmail(notifications_pb2.SetDoNotEmailReq(enable_do_not_email=True))

        with pytest.raises(grpc.RpcError) as e:
            notifications.SetNotificationSettings(
                notifications_pb2.SetNotificationSettingsReq(enable_new_notifications=True)
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.DO_NOT_EMAIL_CANNOT_ENABLE_NEW_NOTIFICATIONS


def test_GetDoNotEmail(db):
    _, token = generate_user()

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.do_not_email = False

    with notifications_session(token) as notifications:
        res = notifications.GetDoNotEmail(notifications_pb2.GetDoNotEmailReq())
    assert not res.do_not_email_enabled

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.do_not_email = True
        user.hosting_status = HostingStatus.cant_host
        user.meetup_status = MeetupStatus.does_not_want_to_meetup
        user.new_notifications_enabled = False

    with notifications_session(token) as notifications:
        res = notifications.GetDoNotEmail(notifications_pb2.GetDoNotEmailReq())
    assert res.do_not_email_enabled


def test_SetDoNotEmail(db):
    _, token = generate_user()

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.do_not_email = False
        user.hosting_status = HostingStatus.can_host
        user.meetup_status = MeetupStatus.wants_to_meetup
        user.new_notifications_enabled = True

    with notifications_session(token) as notifications:
        notifications.SetDoNotEmail(notifications_pb2.SetDoNotEmailReq(enable_do_not_email=False))

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert not user.do_not_email

    with notifications_session(token) as notifications:
        notifications.SetDoNotEmail(notifications_pb2.SetDoNotEmailReq(enable_do_not_email=True))

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert user.do_not_email
        assert user.hosting_status == HostingStatus.cant_host
        assert user.meetup_status == MeetupStatus.does_not_want_to_meetup
        assert user.new_notifications_enabled == False

    with notifications_session(token) as notifications:
        notifications.SetDoNotEmail(notifications_pb2.SetDoNotEmailReq(enable_do_not_email=False))

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert not user.do_not_email
