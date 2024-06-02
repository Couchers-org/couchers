import logging

import grpc
from google.protobuf import empty_pb2

from couchers import errors
from couchers.db import session_scope
from couchers.models import (
    HostingStatus,
    MeetupStatus,
    Notification,
    NotificationDeliveryType,
    PushNotificationSubscription,
    User,
)
from couchers.notifications.push import get_vapid_public_key, push_to_subscription, push_to_user
from couchers.notifications.push_api import decode_key
from couchers.notifications.settings import PreferenceNotUserEditableError, get_user_setting_groups, set_preference
from couchers.notifications.utils import enum_from_topic_action
from couchers.sql import couchers_select as select
from couchers.utils import Timestamp_from_datetime
from proto import notifications_pb2, notifications_pb2_grpc

logger = logging.getLogger(__name__)
MAX_PAGINATION_LENGTH = 100


def notification_to_pb(notification: Notification):
    return notifications_pb2.Notification(
        notification_id=notification.id,
        created=Timestamp_from_datetime(notification.created),
        topic=notification.topic_action.topic,
        action=notification.topic_action.action,
        key=notification.key,
        avatar_key=notification.avatar_key,
        icon=notification.icon,
        title=notification.title,
        content=notification.content,
        link=notification.link,
    )


class Notifications(notifications_pb2_grpc.NotificationsServicer):
    def GetNotificationSettings(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            return notifications_pb2.GetNotificationSettingsRes(
                do_not_email_enabled=user.do_not_email,
                groups=get_user_setting_groups(user.id),
            )

    def SetNotificationSettings(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            user.do_not_email = request.enable_do_not_email
            if request.enable_do_not_email:
                user.hosting_status = HostingStatus.cant_host
                user.meetup_status = MeetupStatus.does_not_want_to_meetup
            for preference in request.preferences:
                topic_action = enum_from_topic_action.get((preference.topic, preference.action), None)
                if not topic_action:
                    context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_NOTIFICATION_PREFERENCE)
                delivery_types = {t.name for t in NotificationDeliveryType}
                if preference.delivery_method not in delivery_types:
                    context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_DELIVERY_METHOD)
                delivery_type = NotificationDeliveryType[preference.delivery_method]
                try:
                    set_preference(session, user.id, topic_action, delivery_type, preference.enabled)
                except PreferenceNotUserEditableError as e:
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANNOT_EDIT_THAT_NOTIFICATION_PREFERENCE)
            return notifications_pb2.GetNotificationSettingsRes(
                do_not_email_enabled=user.do_not_email,
                groups=get_user_setting_groups(user.id),
            )

    def ListNotifications(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_notification_id = int(request.page_token) if request.page_token else 2**50
            notifications = (
                session.execute(
                    select(Notification)
                    .where(Notification.user_id == context.user_id)
                    .where(Notification.id <= next_notification_id)
                    .order_by(Notification.id.desc())
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )
            return notifications_pb2.ListNotificationsRes(
                notifications=[notification_to_pb(notification) for notification in notifications[:page_size]],
                next_page_token=str(notifications[-1].id) if len(notifications) > page_size else None,
            )

    def GetVapidPublicKey(self, request, context):
        return notifications_pb2.GetVapidPublicKeyRes(vapid_public_key=get_vapid_public_key())

    def RegisterPushNotification(self, request, context):
        with session_scope() as session:
            subscription = PushNotificationSubscription(
                user_id=context.user_id,
                endpoint=request.endpoint,
                p256dh_key=decode_key(request.p256dh_key),
                auth_key=decode_key(request.auth_key),
                full_subscription_info=request.full_subscription_json,
            )
            session.add(subscription)
            session.flush()
            sub_id = subscription.id
        push_to_subscription(
            sub_id,
            title="Checking push notifications work!",
            body="Hi, thanks for enabling push notifications!",
        )
        return empty_pb2.Empty()

    def SendTestPushNotification(self, request, context):
        push_to_user(
            context.user_id,
            title="Checking push notifications work!",
            body=f"If you see this, then it's working :)",
        )
        return empty_pb2.Empty()
