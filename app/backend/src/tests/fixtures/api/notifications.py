from collections.abc import Sequence
from contextlib import contextmanager
from typing import cast

import grpc
from google.protobuf import empty_pb2

from couchers.proto import notifications_pb2, notifications_pb2_grpc
from couchers.servicers.notifications import Notifications
from tests.fixtures.sessions import FakeChannel


@contextmanager
def _notifications_session(token: str):
    channel = FakeChannel(token)
    notifications_pb2_grpc.add_NotificationsServicer_to_server(Notifications(), cast(grpc.Server, channel))
    yield notifications_pb2_grpc.NotificationsStub(cast(grpc.Channel, channel))


def get_notification_settings(*, token: str) -> notifications_pb2.GetNotificationSettingsRes:
    with _notifications_session(token) as session:
        res: notifications_pb2.GetNotificationSettingsRes = session.GetNotificationSettings(
            notifications_pb2.GetNotificationSettingsReq()
        )
    return res


def set_notification_settings(
    *,
    token: str,
    enable_do_not_email: bool = False,
    preferences: Sequence[notifications_pb2.SingleNotificationPreference] = (),
) -> notifications_pb2.GetNotificationSettingsRes:
    with _notifications_session(token) as session:
        res: notifications_pb2.GetNotificationSettingsRes = session.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                enable_do_not_email=enable_do_not_email,
                preferences=preferences,
            )
        )
    return res


def list_notifications(
    *,
    token: str,
    only_unread: bool = False,
    page_size: int | None = None,
    page_token: str | None = None,
) -> notifications_pb2.ListNotificationsRes:
    with _notifications_session(token) as session:
        res: notifications_pb2.ListNotificationsRes = session.ListNotifications(
            notifications_pb2.ListNotificationsReq(only_unread=only_unread, page_size=page_size, page_token=page_token)
        )
    return res


def mark_notification_seen(*, token: str, notification_id: int, set_seen: bool = True) -> None:
    with _notifications_session(token) as session:
        session.MarkNotificationSeen(
            notifications_pb2.MarkNotificationSeenReq(notification_id=notification_id, set_seen=set_seen)
        )


def mark_all_notifications_seen(*, token: str, latest_notification_id: int) -> None:
    with _notifications_session(token) as session:
        session.MarkAllNotificationsSeen(
            notifications_pb2.MarkAllNotificationsSeenReq(latest_notification_id=latest_notification_id)
        )


def get_vapid_public_key(*, token: str) -> notifications_pb2.GetVapidPublicKeyRes:
    with _notifications_session(token) as session:
        res: notifications_pb2.GetVapidPublicKeyRes = session.GetVapidPublicKey(empty_pb2.Empty())
    return res


def register_push_notification_subscription(
    *, token: str, full_subscription_json: str, user_agent: str | None = None
) -> None:
    with _notifications_session(token) as session:
        session.RegisterPushNotificationSubscription(
            notifications_pb2.RegisterPushNotificationSubscriptionReq(
                full_subscription_json=full_subscription_json,
                user_agent=user_agent,
            )
        )


def send_test_push_notification(*, token: str) -> None:
    with _notifications_session(token) as session:
        session.SendTestPushNotification(empty_pb2.Empty())


def register_mobile_push_notification_subscription(
    *,
    token: str,
    push_token: str,
    device_name: str | None = None,
    device_type: str | None = None,
) -> None:
    with _notifications_session(token) as session:
        session.RegisterMobilePushNotificationSubscription(
            notifications_pb2.RegisterMobilePushNotificationSubscriptionReq(
                token=push_token,
                device_name=device_name,
                device_type=device_type,
            )
        )


def send_test_mobile_push_notification(*, token: str) -> None:
    with _notifications_session(token) as session:
        session.SendTestMobilePushNotification(empty_pb2.Empty())


def send_dev_push_notification(
    *,
    token: str,
    title: str | None = "Dummy title",
    body: str | None = "Dummy body.",
    icon: str | None = None,
    url: str | None = None,
    key: str | None = None,
    ttl: int | None = None,
) -> None:
    with _notifications_session(token) as session:
        session.SendDevPushNotification(
            notifications_pb2.SendDevPushNotificationReq(
                title=title,
                body=body,
                icon=icon,
                url=url,
                key=key,
                ttl=ttl,
            )
        )


def debug_redeliver_push_notification(*, token: str, notification_id: int) -> None:
    with _notifications_session(token) as session:
        session.DebugRedeliverPushNotification(
            notifications_pb2.DebugRedeliverPushNotificationReq(notification_id=notification_id)
        )
