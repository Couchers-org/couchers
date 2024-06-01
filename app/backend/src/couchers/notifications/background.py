import logging
from datetime import timedelta

from google.protobuf import empty_pb2
from sqlalchemy.sql import and_, func

from couchers import urls
from couchers.config import config
from couchers.db import session_scope
from couchers.models import (
    Notification,
    NotificationDelivery,
    NotificationDeliveryType,
    PushNotificationDeliveryAttempt,
    PushNotificationSubscription,
    User,
)
from couchers.notifications.push import push_to_user
from couchers.notifications.push_api import send_push
from couchers.notifications.render import render_notification
from couchers.notifications.settings import get_preference
from couchers.notifications.unsubscribe import (
    generate_do_not_email,
    generate_unsub,
    generate_unsub_topic_action,
    generate_unsub_topic_key,
)
from couchers.sql import couchers_select as select
from couchers.tasks import send_digest_email
from couchers.templates.v2 import email_user
from couchers.utils import now
from proto.internal import jobs_pb2

logger = logging.getLogger(__name__)


def fan_notifications(payload: jobs_pb2.FanNotificationsPayload):
    raise Exception("nothing here")
    # fan_func = getattr(fan_funcs, payload.fan_func)
    # user_ids = fan_func(payload.fan_func_data)
    # for user_id in user_ids:
    #     notify_v2(
    #         user_id=user_id,
    #         topic_action=payload.topic_action,
    #         key=payload.key,
    #         data=payload.data,
    #     )


def _send_email_notification(user: User, notification: Notification):
    def _generate_unsub(type, one_click=False):
        return generate_unsub(user, notification, type, one_click)

    data = notification.topic_action.data_type.FromString(notification.data)
    rendered = render_notification(user, notification, data)
    default_args = {
        "user": user,
        "time": notification.created,
        "_unsub": _generate_unsub,
        "_unsub_do_not_email": generate_do_not_email(notification.user_id),
        "_unsub_topic_key": generate_unsub_topic_key(notification),
        "_unsub_topic_action": generate_unsub_topic_action(notification),
        "_manage_notification_settings": urls.feature_preview_link(),
    }

    frontmatter = {
        "is_critical": rendered.is_critical,
        "subject": rendered.email_subject,
        "preview": rendered.email_preview,
    }

    email_user(
        user,
        rendered.email_template_name,
        {**default_args, **rendered.email_template_args},
        frontmatter=frontmatter,
    )


def _send_push_notification(user: User, notification: Notification):
    logger.debug(f"Formatting push notification for {user}")

    data = notification.topic_action.data_type.FromString(notification.data)
    rendered = render_notification(user, notification, data)

    if not rendered.push_title:
        raise Exception(f"Tried to send push notification to {user} but didn't have ")

    push_to_user(
        user.id,
        title=rendered.push_title,
        body=rendered.push_body,
        icon=rendered.push_icon,
        # url=rendered.push_url,
    )


def handle_notification(payload: jobs_pb2.HandleNotificationPayload):
    with session_scope() as session:
        notification = session.execute(
            select(Notification).where(Notification.id == payload.notification_id)
        ).scalar_one()

        # ignore this notification if the user hasn't enabled new notifications
        user = session.execute(select(User).where(User.id == notification.user_id)).scalar_one()
        if not user.new_notifications_enabled:
            logger.info(f"Skipping notification delivery for {user} due to new notifications being disabled")
            return

        topic, action = notification.topic_action.unpack()
        delivery_types = get_preference(session, notification.user.id, notification.topic_action)
        for delivery_type in delivery_types:
            logger.info(f"Should notify by {delivery_type}")
            if delivery_type == NotificationDeliveryType.email:
                # for emails we don't deliver straight up, wait until the email background worker gets around to it and handles deduplication
                session.add(
                    NotificationDelivery(
                        notification_id=notification.id,
                        delivered=None,
                        delivery_type=NotificationDeliveryType.email,
                    )
                )
            elif delivery_type == NotificationDeliveryType.digest:
                # for digest notifications, add to digest queue
                session.add(
                    NotificationDelivery(
                        notification_id=notification.id,
                        delivered=None,
                        delivery_type=NotificationDeliveryType.digest,
                    )
                )
            elif delivery_type == NotificationDeliveryType.push:
                # for push notifications, we send them straight away
                session.add(
                    NotificationDelivery(
                        notification_id=notification.id,
                        delivered=func.now(),
                        delivery_type=NotificationDeliveryType.push,
                    )
                )
                _send_push_notification(user, notification)


def send_raw_push_notification(payload: jobs_pb2.SendRawPushNotificationPayload):
    with session_scope() as session:
        if len(payload.data) > 3072:
            raise Exception(f"Data too long for push notification to sub {payload.push_notification_subscription_id}")
        sub = session.execute(
            select(PushNotificationSubscription).where(
                PushNotificationSubscription.id == payload.push_notification_subscription_id
            )
        ).scalar_one()
        if sub.disabled_at < now():
            logger.error(f"Tried to send push to disabled subscription: {sub.id}. Disabled at {sub.disabled_at}.")
            return
        # this of requests.response
        resp = send_push(
            payload.data,
            sub.endpoint,
            sub.auth_key,
            sub.p256dh_key,
            config["PUSH_NOTIFICATIONS_VAPID_SUBJECT"],
            config["PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY"],
            ttl=payload.ttl,
        )
        session.add(
            PushNotificationDeliveryAttempt(
                push_notification_subscription_id=sub.id,
                success=resp.status_code == 201,
                status_code=resp.status_code,
                response=resp.text,
            )
        )
        if resp.status_code == 201:
            # success
            logger.debug(f"Successfully sent push to sub {sub.id} for user {sub.user}")
        elif resp.status_code == 410:
            # gone
            logger.error(f"Push sub {sub.id} for user {sub.user} is gone! Disabling.")
            sub.disabled_at = func.now()
        else:
            raise Exception(f"Failed to deliver push to {sub.id}, code: {resp.status_code}. Response: {resp.text}")


def handle_email_notifications(payload: empty_pb2.Empty):
    """
    Sends out emails for notifications
    """
    logger.info(f"Sending out email notifications")

    with session_scope() as session:
        # delivered email notifications: we don't want to send emails for these
        subquery = (
            select(Notification.user_id, Notification.topic_action, Notification.key)
            .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
            .where(NotificationDelivery.delivery_type == NotificationDeliveryType.email)
            .where(NotificationDelivery.delivered != None)
            .where(Notification.created > func.now() - timedelta(hours=24))
            .group_by(Notification.user_id, Notification.topic_action, Notification.key)
            .subquery()
        )

        email_notifications_to_send = session.execute(
            (
                select(
                    User,
                    Notification.topic_action,
                    Notification.key,
                    func.min(Notification.id).label("notification_id"),
                    func.min(NotificationDelivery.id).label("notification_delivery_id"),
                )
                .join(User, User.id == Notification.user_id)
                .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
                .where(NotificationDelivery.delivery_type == NotificationDeliveryType.email)
                .where(Notification.created > func.now() - timedelta(hours=1))
                .group_by(User, Notification.user_id, Notification.topic_action, Notification.key)
                # pick the notifications that haven't been delivered
                .outerjoin(
                    subquery,
                    and_(
                        and_(
                            subquery.c.user_id == Notification.user_id,
                            subquery.c.topic_action == Notification.topic_action,
                        ),
                        subquery.c.key == Notification.key,
                    ),
                )
                .where(subquery.c.key == None)
            )
        ).all()

        for user, topic_action, key, notification_id, notification_delivery_id in email_notifications_to_send:
            topic, action = topic_action.unpack()
            logger.info(f"Sending notification id {notification_id} to {user.id} ({topic}/{action}/{key})")
            notification_delivery = session.execute(
                select(NotificationDelivery).where(NotificationDelivery.id == notification_delivery_id)
            ).scalar_one()
            assert notification_delivery.delivery_type == NotificationDeliveryType.email
            assert not notification_delivery.delivered
            assert notification_delivery.notification_id == notification_id
            _send_email_notification(user, notification_delivery.notification)
            notification_delivery.delivered = func.now()
            session.commit()


def handle_email_digests(payload: empty_pb2.Empty):
    """
    Sends out email digests

    The email digest is sent if the user has "digest" type notifications that have not had an individual email sent about them already.

    If a digest is sent, then we send out every notification that has type digest, regardless of if they already got another type of notification about it.

    That is, we don't send out an email unless there's something new, but if we do send one out, we send new and old stuff.
    """
    logger.info(f"Sending out email digests")

    with session_scope() as session:
        # already sent email notifications
        delivered_email_notifications = (
            select(
                Notification.id.label("notification_id"),
                # min is superfluous but needed for group_by
                func.min(NotificationDelivery.id).label("notification_delivery_id"),
            )
            .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
            .where(NotificationDelivery.delivery_type == NotificationDeliveryType.email)
            .where(NotificationDelivery.delivered != None)
            .group_by(Notification)
            .subquery()
        )

        # users who have unsent "digest" type notifications but not sent email notifications
        users_to_send_digests_to = (
            session.execute(
                (
                    select(User)
                    .where(User.digest_frequency != None)
                    .where(User.last_digest_sent < func.now() - User.digest_frequency)
                    # todo: tz
                    .join(Notification, Notification.user_id == User.id)
                    .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
                    .where(NotificationDelivery.delivery_type == NotificationDeliveryType.digest)
                    .where(NotificationDelivery.delivered == None)
                    .outerjoin(
                        delivered_email_notifications,
                        delivered_email_notifications.c.notification_id == Notification.id,
                    )
                    .where(delivered_email_notifications.c.notification_delivery_id == None)
                    .group_by(User)
                )
            )
            .scalars()
            .all()
        )

        logger.info(f"{users_to_send_digests_to=}")

        for user in users_to_send_digests_to:
            # digest notifications that haven't been delivered yet
            notifications_and_deliveries = session.execute(
                (
                    select(Notification, NotificationDelivery)
                    .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
                    .where(NotificationDelivery.delivery_type == NotificationDeliveryType.digest)
                    .where(NotificationDelivery.delivered == None)
                    .where(Notification.user_id == user.id)
                    .order_by(Notification.created)
                )
            ).all()

            if notifications_and_deliveries:
                notifications, deliveries = zip(*notifications_and_deliveries)
                logger.info(f"Sending {user.id=} a digest with {len(notifications)} notifications")
                send_digest_email(user, notifications)
                for delivery in deliveries:
                    delivery.delivered = func.now()
                user.last_digest_sent = func.now()
            session.commit()
