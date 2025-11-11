import json
import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.orm import Session
from sqlalchemy.sql import or_

from couchers.config import config
from couchers.context import CouchersContext
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
from couchers.notifications.render import render_notification
from couchers.notifications.settings import (
    PreferenceNotUserEditableError,
    get_topic_actions_by_delivery_type,
    get_user_setting_groups,
    set_preference,
)
from couchers.notifications.utils import enum_from_topic_action
from couchers.proto import notifications_pb2, notifications_pb2_grpc
from couchers.sql import couchers_select as select
from couchers.utils import Timestamp_from_datetime

logger = logging.getLogger(__name__)
MAX_PAGINATION_LENGTH = 100


def notification_to_pb(user: User, notification: Notification) -> notifications_pb2.Notification:
    rendered = render_notification(user, notification)
    return notifications_pb2.Notification(
        notification_id=notification.id,
        created=Timestamp_from_datetime(notification.created),
        topic=notification.topic_action.topic,
        action=notification.topic_action.action,
        key=notification.key,
        title=rendered.push_title,
        body=rendered.push_body,
        icon=rendered.push_icon,
        url=rendered.push_url,
        is_seen=notification.is_seen,
    )


class Notifications(notifications_pb2_grpc.NotificationsServicer):
    def GetNotificationSettings(
        self, request: notifications_pb2.GetNotificationSettingsReq, context: CouchersContext, session: Session
    ) -> notifications_pb2.GetNotificationSettingsRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        return notifications_pb2.GetNotificationSettingsRes(
            do_not_email_enabled=user.do_not_email,
            groups=get_user_setting_groups(user.id),
        )

    def SetNotificationSettings(
        self, request: notifications_pb2.SetNotificationSettingsReq, context: CouchersContext, session: Session
    ) -> notifications_pb2.GetNotificationSettingsRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        user.do_not_email = request.enable_do_not_email
        if request.enable_do_not_email:
            user.hosting_status = HostingStatus.cant_host
            user.meetup_status = MeetupStatus.does_not_want_to_meetup
        for preference in request.preferences:
            topic_action = enum_from_topic_action.get((preference.topic, preference.action), None)
            if not topic_action:
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "invalid_notification_preference")
            delivery_types = {t.name for t in NotificationDeliveryType}
            if preference.delivery_method not in delivery_types:
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "invalid_delivery_method")
            delivery_type = NotificationDeliveryType[preference.delivery_method]
            try:
                set_preference(session, user.id, topic_action, delivery_type, preference.enabled)
            except PreferenceNotUserEditableError:
                context.abort_with_error_code(
                    grpc.StatusCode.FAILED_PRECONDITION, "cannot_edit_that_notification_preference"
                )
        return notifications_pb2.GetNotificationSettingsRes(
            do_not_email_enabled=user.do_not_email,
            groups=get_user_setting_groups(user.id),
        )

    def ListNotifications(
        self, request: notifications_pb2.ListNotificationsReq, context: CouchersContext, session: Session
    ) -> notifications_pb2.ListNotificationsRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_notification_id = int(request.page_token) if request.page_token else 2**50
        notifications = (
            session.execute(
                select(Notification)
                .where(Notification.user_id == context.user_id)
                .where(Notification.id <= next_notification_id)
                .where(or_(request.only_unread == False, Notification.is_seen == False))
                .where(
                    Notification.topic_action.in_(
                        get_topic_actions_by_delivery_type(session, user.id, NotificationDeliveryType.push)
                    )
                )
                .order_by(Notification.id.desc())
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )
        return notifications_pb2.ListNotificationsRes(
            notifications=[notification_to_pb(user, notification) for notification in notifications[:page_size]],
            next_page_token=str(notifications[-1].id) if len(notifications) > page_size else None,
        )

    def MarkNotificationSeen(
        self, request: notifications_pb2.MarkNotificationSeenReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        notification = (
            session.execute(
                select(Notification)
                .where(Notification.user_id == context.user_id)
                .where(Notification.id == request.notification_id)
            )
            .scalars()
            .one_or_none()
        )
        if not notification:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "notification_not_found")
        notification.is_seen = request.set_seen
        return empty_pb2.Empty()

    def MarkAllNotificationsSeen(
        self, request: notifications_pb2.MarkAllNotificationsSeenReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        session.execute(
            Notification.__table__.update()
            .values(is_seen=True)
            .where(Notification.user_id == context.user_id)
            .where(Notification.id <= request.latest_notification_id)
        )
        return empty_pb2.Empty()

    def GetVapidPublicKey(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> notifications_pb2.GetVapidPublicKeyRes:
        if not config["PUSH_NOTIFICATIONS_ENABLED"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "push_notifications_disabled")

        return notifications_pb2.GetVapidPublicKeyRes(vapid_public_key=get_vapid_public_key())

    def RegisterPushNotificationSubscription(
        self,
        request: notifications_pb2.RegisterPushNotificationSubscriptionReq,
        context: CouchersContext,
        session: Session,
    ) -> empty_pb2.Empty:
        if not config["PUSH_NOTIFICATIONS_ENABLED"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "push_notifications_disabled")

        data = json.loads(request.full_subscription_json)
        subscription = PushNotificationSubscription(
            user_id=context.user_id,
            endpoint=data["endpoint"],
            p256dh_key=decode_key(data["keys"]["p256dh"]),
            auth_key=decode_key(data["keys"]["auth"]),
            full_subscription_info=request.full_subscription_json,
            user_agent=request.user_agent,
        )
        session.add(subscription)
        session.flush()
        push_to_subscription(
            session,
            push_notification_subscription_id=subscription.id,
            user_id=context.user_id,
            topic_action="adhoc:setup",
            title="Checking push notifications work!",
            body="Hi, thanks for enabling push notifications!",
        )

        return empty_pb2.Empty()

    def SendTestPushNotification(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if not config["PUSH_NOTIFICATIONS_ENABLED"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "push_notifications_disabled")

        push_to_user(
            session,
            user_id=context.user_id,
            topic_action="adhoc:testing",
            title="Checking push notifications work!",
            body="If you see this, then it's working :)",
        )

        return empty_pb2.Empty()
