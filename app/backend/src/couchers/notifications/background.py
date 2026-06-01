import logging

from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import exists, func

from couchers.config import config
from couchers.context import make_background_user_context
from couchers.db import session_scope
from couchers.email.queuing import queue_email
from couchers.i18n import LocalizationContext
from couchers.models import (
    Notification,
    NotificationDelivery,
    NotificationDeliveryType,
    User,
)
from couchers.notifications.push import push_to_user
from couchers.notifications.render_email import render_email_notification
from couchers.notifications.render_push import render_push_notification
from couchers.notifications.settings import get_preference
from couchers.notifications.utils import can_notify_deleted_user
from couchers.proto.internal import jobs_pb2
from couchers.sql import moderation_state_column_visible

logger = logging.getLogger(__name__)


def _send_email_notification(session: Session, user: User, notification: Notification) -> None:
    if user.do_not_email and not notification.topic_action.is_critical:
        logger.info(f"Not emailing {user} based on notification {notification.topic_action} due to emails turned off")
        return

    if user.banned_at is not None:
        logger.info(f"Tried emailing {user} based on notification {notification.topic_action} but user is banned")
        return

    if user.deleted_at is not None and not can_notify_deleted_user(notification.topic_action):
        logger.info(f"Tried emailing {user} based on notification {notification.topic_action} but user is deleted")
        return

    context = make_background_user_context(user.id)

    loc_context = LocalizationContext.from_user(user)
    if not context.get_boolean_value("notification_translations_enabled", default=False):
        loc_context = LocalizationContext(locale="en", timezone=loc_context.timezone)

    rendered = render_email_notification(
        user,
        notification,
        loc_context,
        include_ics_attachments=context.get_boolean_value("email_ics_attachments_enabled", default=False),
    )

    queue_email(
        session,
        jobs_pb2.SendEmailPayload(
            sender_name=config["NOTIFICATION_EMAIL_SENDER"],
            sender_email=config["NOTIFICATION_EMAIL_ADDRESS"],
            recipient=user.email,
            subject=config["NOTIFICATION_PREFIX"] + rendered.subject,
            plain=rendered.body_plaintext,
            html=rendered.body_html,
            source_data=rendered.source_data,
            list_unsubscribe_header=rendered.list_unsubscribe_header,
            attachments=rendered.attachments,
        ),
    )


def _send_push_notification(session: Session, user: User, notification: Notification) -> None:
    logger.debug(f"Formatting push notification for {user}")

    content = render_push_notification(notification, LocalizationContext.from_user(user))
    push_to_user(
        session,
        user_id=user.id,
        topic_action=notification.topic_action.display,
        content=content,
        key=notification.key,
        # keep on server for at most an hour if the client is not around
        ttl=3600,
    )


def handle_notification(payload: jobs_pb2.HandleNotificationPayload) -> None:
    with session_scope() as session:
        # Select and lock the row.
        notification = session.execute(
            select(Notification).where(Notification.id == payload.notification_id).with_for_update()
        ).scalar_one()

        # Check moderation visibility if this notification is linked to moderated content
        if notification.moderation_state_id:
            context = make_background_user_context(notification.user_id)
            content_visible = session.execute(
                select(
                    exists(
                        select(Notification)
                        .where(Notification.id == notification.id)
                        .where(moderation_state_column_visible(context, Notification.moderation_state_id))
                    )
                )
            ).scalar_one()

            if not content_visible:
                # Content is not visible to recipient, leave notification for later processing
                logger.info(
                    f"Deferring notification {notification.id}: content not visible to user {notification.user_id}"
                )
                return

        # ignore this notification if the user hasn't enabled new notifications
        user = session.execute(select(User).where(User.id == notification.user_id)).scalar_one()

        delivery_types = get_preference(session, notification.user.id, notification.topic_action)
        for delivery_type in delivery_types:
            # Check if delivery already exists for this notification and delivery type
            # (this can happen if the job was queued multiple times)
            existing_delivery = session.execute(
                select(NotificationDelivery)
                .where(NotificationDelivery.notification_id == notification.id)
                .where(NotificationDelivery.delivery_type == delivery_type)
            ).scalar_one_or_none()
            if existing_delivery:
                logger.info(f"Skipping {delivery_type} delivery for notification {notification.id}: already delivered")
                continue

            logger.info(f"Should notify by {delivery_type}")
            if delivery_type == NotificationDeliveryType.email:
                # for emails we don't deliver straight up, wait until the email background worker gets around to it and handles deduplication
                session.add(
                    NotificationDelivery(
                        notification_id=notification.id,
                        delivered=func.now(),
                        delivery_type=NotificationDeliveryType.email,
                    )
                )
                session.flush()
                _send_email_notification(session, user, notification)
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
                # for push notifications, we send them straight away (web + mobile)
                session.add(
                    NotificationDelivery(
                        notification_id=notification.id,
                        delivered=func.now(),
                        delivery_type=NotificationDeliveryType.push,
                    )
                )
                session.flush()
                _send_push_notification(session, user, notification)


def handle_email_digests(payload: empty_pb2.Empty) -> None:
    """
    Sends out email digests

    The email digest is sent if the user has "digest" type notifications that have not had an individual email sent about them already.

    If a digest is sent, then we send out every notification that has type digest, regardless of if they already got another type of notification about it.

    That is, we don't send out an email unless there's something new, but if we do send one out, we send new and old stuff.
    """
    logger.info("Sending out email digests")

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
            .group_by(Notification.id)
            .subquery()
        )

        # users who have unsent "digest" type notifications but not sent email notifications
        users_to_send_digests_to = (
            session.execute(
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
                .group_by(User.id)
            )
            .scalars()
            .all()
        )

        logger.info(f"{users_to_send_digests_to=}")

        for user in users_to_send_digests_to:
            # digest notifications that haven't been delivered yet
            # Exclude notifications linked to non-visible moderated content
            context = make_background_user_context(user.id)
            notifications_and_deliveries = session.execute(
                select(Notification, NotificationDelivery)
                .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
                .where(NotificationDelivery.delivery_type == NotificationDeliveryType.digest)
                .where(NotificationDelivery.delivered == None)
                .where(Notification.user_id == user.id)
                .where(moderation_state_column_visible(context, Notification.moderation_state_id))
                .order_by(Notification.created)
            ).all()

            if notifications_and_deliveries:
                notifications, deliveries = zip(*notifications_and_deliveries)
                logger.info(f"Sending {user.id=} a digest with {len(notifications)} notifications")
                logger.info("TODO: supposed to send digest email")
                for delivery in deliveries:
                    delivery.delivered = func.now()
                user.last_digest_sent = func.now()
            session.commit()
