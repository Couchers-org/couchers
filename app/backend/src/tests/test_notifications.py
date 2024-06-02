import json
import re
from urllib.parse import parse_qs, urlparse

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.crypto import b64decode
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
from proto import api_pb2, auth_pb2, notification_data_pb2, notifications_pb2
from proto.internal import unsubscribe_pb2
from tests.test_fixtures import (  # noqa
    api_session,
    auth_api_session,
    db,
    email_fields,
    generate_user,
    mock_notification_email,
    notifications_session,
    push_collector,
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

    with mock_notification_email() as mock:
        notify_v2(
            user_id=user.id,
            topic_action=topic_action.display,
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer for Couchers.org",
            ),
        )

    assert mock.call_count == 1
    assert email_fields(mock).recipient == user.email
    # very ugly
    # http://localhost:3000/unsubscribe?payload=CAEiGAoOZnJpZW5kX3JlcXVlc3QSBmFjY2VwdA==&sig=BQdk024NTATm8zlR0krSXTBhP5U9TlFv7VhJeIHZtUg=
    for link in re.findall(r'<a href="(.*?)"', email_fields(mock).html):
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

    with mock_notification_email() as mock:
        notify_v2(
            user_id=user.id,
            topic_action=topic_action.display,
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer for Couchers.org",
            ),
        )

    assert mock.call_count == 0


def test_unsubscribe_do_not_email(db):
    user, token = generate_user()

    _, token2 = generate_user(complete_profile=True)
    with mock_notification_email() as mock:
        with api_session(token2) as api:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user.id))

    assert mock.call_count == 1
    assert email_fields(mock).recipient == user.email
    # very ugly
    # http://localhost:3000/unsubscribe?payload=CAEiGAoOZnJpZW5kX3JlcXVlc3QSBmFjY2VwdA==&sig=BQdk024NTATm8zlR0krSXTBhP5U9TlFv7VhJeIHZtUg=
    for link in re.findall(r'<a href="(.*?)"', email_fields(mock).html):
        if "payload" not in link:
            continue
        print(link)
        url_parts = urlparse(link)
        params = parse_qs(url_parts.query)
        print(params["payload"][0])
        payload = unsubscribe_pb2.UnsubscribePayload.FromString(b64decode(params["payload"][0]))
        if payload.HasField("do_not_email"):
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

    _, token3 = generate_user(complete_profile=True)
    with mock_notification_email() as mock:
        with api_session(token3) as api:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user.id))

    assert mock.call_count == 0

    with session_scope() as session:
        user_ = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user_.do_not_email


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


def test_GetVapidPublicKey(db):
    _, token = generate_user()

    with notifications_session(token) as notifications:
        assert (
            notifications.GetVapidPublicKey(empty_pb2.Empty()).vapid_public_key
            == "BApMo2tGuon07jv-pEaAKZmVo6E_d4HfcdDeV6wx2k9wV8EovJ0ve00bdLzZm9fizDrGZXRYJFqCcRJUfBcgA0A"
        )


def test_RegisterPushNotification(db):
    _, token = generate_user()

    subscription_info = {
        "endpoint": "https://updates.push.services.mozilla.com/wpush/v2/gAAAAABmW2_iYKVyZRJPhAhktbkXd6Bc8zjIUvtVi5diYL7ZYn8FHka94kIdF46Mp8DwCDWlACnbKOEo97ikaa7JYowGLiGz3qsWL7Vo19LaV4I71mUDUOIKxWIsfp_kM77MlRJQKDUddv-sYyiffOyg63d1lnc_BMIyLXt69T5SEpfnfWTNb6I",
        "expirationTime": None,
        "keys": {
            "auth": "TnuEJ1OdfEkf6HKcUovl0Q",
            "p256dh": "BK7Rp8og3eFJPqm0ofR8F-l2mtNCCCWYo6f_5kSs8jPEFiKetnZHNOglvC6IrgU9vHmgFHlG7gHGtB1HM599sy0",
        },
    }

    with notifications_session(token) as notifications:
        res = notifications.RegisterPushNotification(
            notifications_pb2.RegisterPushNotificationReq(
                endpoint=subscription_info["endpoint"],
                auth_key=subscription_info["keys"]["auth"],
                p256dh_key=subscription_info["keys"]["p256dh"],
                full_subscription_json=json.dumps(subscription_info),
            )
        )


def test_SendTestPushNotification(db, push_collector):
    user, token = generate_user()

    with notifications_session(token) as notifications:
        notifications.SendTestPushNotification(empty_pb2.Empty())

    push_collector.assert_user_has_count(user.id, 1)
    push_collector.assert_user_push_matches_fields(
        user.id,
        title="Checking push notifications work!",
        body="If you see this, then it's working :)",
    )

    # the above two are equivalent to this

    push_collector.assert_user_has_single_matching(
        user.id,
        title="Checking push notifications work!",
        body="If you see this, then it's working :)",
    )
