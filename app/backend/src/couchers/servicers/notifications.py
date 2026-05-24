import functools
import json
import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from sqlalchemy.sql import or_

from couchers.base_url_override import BASE_URL_OVERRIDE_TTL
from couchers.config import config
from couchers.constants import DATETIME_INFINITY
from couchers.context import CouchersContext, make_background_user_context
from couchers.i18n import LocalizationContext
from couchers.models import (
    BaseUrlOverride,
    DeviceType,
    HostingStatus,
    MeetupStatus,
    Notification,
    NotificationDeliveryType,
    PushNotificationPlatform,
    PushNotificationSubscription,
    User,
)
from couchers.notifications.push import PushNotificationContent, push_to_subscription, push_to_user
from couchers.notifications.render_push import render_adhoc_push_notification, render_push_notification
from couchers.notifications.send_raw_push_notification import is_known_invalid_endpoint
from couchers.notifications.settings import (
    PreferenceNotUserEditableError,
    get_topic_actions_by_delivery_type,
    get_user_setting_groups,
    set_preference,
)
from couchers.notifications.utils import enum_from_topic_action
from couchers.notifications.web_push_api import decode_key, get_vapid_public_key_from_private_key
from couchers.proto import notifications_pb2, notifications_pb2_grpc
from couchers.sql import moderation_state_column_visible, to_bool
from couchers.utils import Timestamp_from_datetime, now

logger = logging.getLogger(__name__)
MAX_PAGINATION_LENGTH = 100


@functools.cache
def get_vapid_public_key() -> str:
    return get_vapid_public_key_from_private_key(config["PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY"])


def notification_to_pb(user: User, notification: Notification) -> notifications_pb2.Notification:
    context = make_background_user_context(user.id, LocalizationContext.from_user(user))
    content = render_push_notification(notification, context)
    return notifications_pb2.Notification(
        notification_id=notification.id,
        created=Timestamp_from_datetime(notification.created),
        topic=notification.topic_action.topic,
        action=notification.topic_action.action,
        key=notification.key,
        title=content.title,
        body=content.body,
        icon=content.icon_url,
        url=content.action_url,
        is_seen=notification.is_seen,
    )


class Notifications(notifications_pb2_grpc.NotificationsServicer):
    def GetNotificationSettings(
        self, request: notifications_pb2.GetNotificationSettingsReq, context: CouchersContext, session: Session
    ) -> notifications_pb2.GetNotificationSettingsRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        return notifications_pb2.GetNotificationSettingsRes(
            do_not_email_enabled=user.do_not_email,
            groups=get_user_setting_groups(user.id, context.localization),
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
            groups=get_user_setting_groups(user.id, context.localization),
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
                .where(or_(to_bool(request.only_unread == False), Notification.is_seen == False))
                .where(
                    Notification.topic_action.in_(
                        get_topic_actions_by_delivery_type(session, user.id, NotificationDeliveryType.push)
                    )
                )
                .where(moderation_state_column_visible(context, Notification.moderation_state_id))
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
            update(Notification)
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
        if is_known_invalid_endpoint(data["endpoint"]):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_endpoint")

        subscription = PushNotificationSubscription(
            user_id=context.user_id,
            platform=PushNotificationPlatform.web_push,
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
            context=context,
            push_notification_subscription_id=subscription.id,
            user_id=context.user_id,
            topic_action="adhoc:setup",
            content=PushNotificationContent(
                title="Push notifications test",
                ios_title="Push Notifications Test",
                body="Hi, thanks for enabling push notifications!",
            ),
        )

        return empty_pb2.Empty()

    def SendTestPushNotification(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if not config["PUSH_NOTIFICATIONS_ENABLED"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "push_notifications_disabled")

        push_to_user(
            session,
            context=context,
            user_id=context.user_id,
            topic_action="adhoc:testing",
            content=PushNotificationContent(
                title="Push notifications test",
                ios_title="Push Notifications Test",
                body="If you see this, then it's working :)",
            ),
        )

        return empty_pb2.Empty()

    def RegisterMobilePushNotificationSubscription(
        self,
        request: notifications_pb2.RegisterMobilePushNotificationSubscriptionReq,
        context: CouchersContext,
        session: Session,
    ) -> empty_pb2.Empty:
        if not config["PUSH_NOTIFICATIONS_ENABLED"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "push_notifications_disabled")

        # Check for existing subscription with this token
        existing = session.execute(
            select(PushNotificationSubscription).where(PushNotificationSubscription.token == request.token)
        ).scalar_one_or_none()

        if existing:
            # Re-enable if disabled
            if existing.disabled_at < now():
                existing.disabled_at = DATETIME_INFINITY
                existing.device_name = request.device_name or existing.device_name
                if request.device_type:
                    existing.device_type = DeviceType[request.device_type]
                logger.info(f"Re-enabled mobile push sub {existing.id} for user {context.user_id}")
            return empty_pb2.Empty()

        # Parse device_type if provided
        device_type = DeviceType[request.device_type] if request.device_type else None

        subscription = PushNotificationSubscription(
            user_id=context.user_id,
            platform=PushNotificationPlatform.expo,
            token=request.token,
            device_name=request.device_name if request.device_name else None,
            device_type=device_type,
        )
        session.add(subscription)
        session.flush()

        push_content = render_adhoc_push_notification("push_enabled", context)
        push_to_subscription(
            session,
            context=context,
            push_notification_subscription_id=subscription.id,
            user_id=context.user_id,
            topic_action="adhoc:push_enabled",
            content=push_content,
        )

        return empty_pb2.Empty()

    def SendTestMobilePushNotification(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if not config["PUSH_NOTIFICATIONS_ENABLED"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "push_notifications_disabled")

        push_to_user(
            session,
            context=context,
            user_id=context.user_id,
            topic_action="adhoc:testing",
            content=PushNotificationContent(
                title="Mobile notifications test",
                ios_title="Mobile Notifications Test",
                body="If you see this on your phone, everything is wired up correctly 🎉",
            ),
        )

        return empty_pb2.Empty()

    def SendDevPushNotification(
        self, request: notifications_pb2.SendDevPushNotificationReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        if not config["ENABLE_DEV_APIS"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "dev_apis_disabled")

        if not config["PUSH_NOTIFICATIONS_ENABLED"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "push_notifications_disabled")

        push_to_user(
            session,
            context=context,
            user_id=context.user_id,
            topic_action="adhoc:testing",
            content=PushNotificationContent(
                title=request.title,
                ios_title=request.title,
                body=request.body,
                action_url=request.url or None,
                icon_url=request.icon or None,
            ),
            key=request.key or None,
            ttl=request.ttl,
        )

        return empty_pb2.Empty()

    def DebugRedeliverPushNotification(
        self,
        request: notifications_pb2.DebugRedeliverPushNotificationReq,
        context: CouchersContext,
        session: Session,
    ) -> empty_pb2.Empty:
        if not config["ENABLE_DEV_APIS"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "dev_apis_disabled")

        if not config["PUSH_NOTIFICATIONS_ENABLED"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "push_notifications_disabled")

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        notification = session.execute(
            select(Notification)
            .where(Notification.id == request.notification_id)
            .where(Notification.user_id == context.user_id)
        ).scalar_one_or_none()

        if not notification:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "notification_not_found")

        render_context = make_background_user_context(user.id, LocalizationContext.from_user(user))
        push_to_user(
            session,
            context=context,
            user_id=context.user_id,
            topic_action=notification.topic_action.display,
            content=render_push_notification(notification, render_context),
            key=notification.key,
        )

        return empty_pb2.Empty()

    def SetBaseUrlOverride(
        self,
        request: notifications_pb2.SetBaseUrlOverrideReq,
        context: CouchersContext,
        session: Session,
    ) -> empty_pb2.Empty:
        if not config["ENABLE_DEV_APIS"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "dev_apis_disabled")

        if not request.base_url:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "base_url must not be empty")

        session.add(BaseUrlOverride(user_id=context.user_id, base_url=request.base_url))
        return empty_pb2.Empty()

    def GetBaseUrlOverrides(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> notifications_pb2.GetBaseUrlOverridesRes:
        if not config["ENABLE_DEV_APIS"]:
            context.abort_with_error_code(grpc.StatusCode.UNAVAILABLE, "dev_apis_disabled")

        overrides = (
            session.execute(
                select(BaseUrlOverride)
                .where(BaseUrlOverride.user_id == context.user_id)
                .order_by(BaseUrlOverride.created.desc(), BaseUrlOverride.id.desc())
            )
            .scalars()
            .all()
        )

        # The active override is the most recent row within the TTL. Mirrors get_active_base_url_override.
        cutoff = now() - BASE_URL_OVERRIDE_TTL
        active_id = next((o.id for o in overrides if o.created > cutoff), None)

        return notifications_pb2.GetBaseUrlOverridesRes(
            overrides=[
                notifications_pb2.BaseUrlOverrideEntry(
                    base_url=override.base_url,
                    created=Timestamp_from_datetime(override.created),
                    active=override.id == active_id,
                )
                for override in overrides
            ]
        )
