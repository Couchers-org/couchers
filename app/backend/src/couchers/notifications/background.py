import logging
from pathlib import Path

import sentry_sdk
from google.protobuf import empty_pb2
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from couchers import urls
from couchers.config import config
from couchers.db import session_scope
from couchers.email import queue_email
from couchers.metrics import push_notification_counter, push_notification_disabled_counter
from couchers.models import (
    MobilePushNotificationDeliveryAttempt,
    MobilePushNotificationSubscription,
    Notification,
    NotificationDelivery,
    NotificationDeliveryType,
    PushNotificationDeliveryAttempt,
    PushNotificationSubscription,
    User,
)
from couchers.notifications.mobile_push import push_to_mobile_user
from couchers.notifications.mobile_push_api import send_expo_push_notification
from couchers.notifications.push import push_to_user
from couchers.notifications.push_api import send_push
from couchers.notifications.quick_links import (
    generate_do_not_email,
    generate_unsub_topic_action,
    generate_unsub_topic_key,
)
from couchers.notifications.render import render_notification
from couchers.notifications.settings import get_preference
from couchers.sql import couchers_select as select
from couchers.templates.v2 import add_filters
from couchers.utils import get_tz_as_text, now
from proto.internal import jobs_pb2

logger = logging.getLogger(__name__)

template_folder = Path(__file__).parent / ".." / ".." / ".." / "templates" / "v2"

loader = FileSystemLoader(template_folder)
env = Environment(loader=loader, trim_blocks=True)

add_filters(env)


def _send_email_notification(session: Session, user: User, notification: Notification) -> None:
    rendered = render_notification(user, notification)
    template_args = {
        "user": user,
        "time": notification.created,
        "_year": now().year,
        "_timezone_display": get_tz_as_text(user.timezone or "Etc/UTC"),
        **rendered.email_template_args,
    }

    plain_unsub_section = "\n\n---\n\n"
    if rendered.is_critical:
        plain_unsub_section += "This is a security email, you cannot unsubscribe from it."
        html_unsub_section = "This is a security email, you cannot unsubscribe from it."
    else:
        manage_link = urls.notification_settings_link()
        plain_unsub_section += f"Edit your notification settings at <{manage_link}>"
        html_unsub_section = f'<a href="{manage_link}">Manage notification preferences</a>.'
        unsub_options = []
        ta = rendered.email_topic_action_unsubscribe_text
        tk = rendered.email_topic_key_unsubscribe_text
        ta_link = generate_unsub_topic_action(notification)
        tk_link = generate_unsub_topic_key(notification)
        if ta:
            plain_unsub_section += f"\n\nTurn off emails for {ta}: <{ta_link}>"
            unsub_options.append(f'<a href="{ta_link}">{ta}</a>')
        if tk:
            plain_unsub_section += f"\n\nTurn off emails for {tk}: <{tk_link}>"
            unsub_options.append(f'<a href="{tk_link}">{tk}</a>')
        if unsub_options:
            html_unsub_section += f"<br />Turn off emails for: {' / '.join(unsub_options)}."
        dne_link = generate_do_not_email(user)
        plain_unsub_section += f"\n\nDo not email me (disables hosting): <{dne_link}>"
        html_unsub_section += f'<br /><a href="{dne_link}">Do not email me (disables hosting)</a>.'

    plain_tmplt = (template_folder / f"{rendered.email_template_name}.txt").read_text()
    plain = env.from_string(plain_tmplt + plain_unsub_section).render(template_args)
    html_tmplt = (template_folder / "generated_html" / f"{rendered.email_template_name}.html").read_text()
    html = env.from_string(html_tmplt.replace("___UNSUB_SECTION___", html_unsub_section)).render(template_args)

    if user.do_not_email and not rendered.is_critical:
        logger.info(f"Not emailing {user} based on template {rendered.email_template_name} due to emails turned off")
        return

    if user.is_banned:
        logger.info(f"Tried emailing {user} based on template {rendered.email_template_name} but user is banned")
        return

    if user.is_deleted and not rendered.allow_deleted:
        logger.info(f"Tried emailing {user} based on template {rendered.email_template_name} but user is deleted")
        return

    list_unsubscribe_header = None
    if rendered.email_list_unsubscribe_url:
        list_unsubscribe_header = f"<{rendered.email_list_unsubscribe_url}>"

    queue_email(
        session,
        sender_name=config["NOTIFICATION_EMAIL_SENDER"],
        sender_email=config["NOTIFICATION_EMAIL_ADDRESS"],
        recipient=user.email,
        subject=config["NOTIFICATION_PREFIX"] + rendered.email_subject,
        plain=plain,
        html=html,
        source_data=config["VERSION"] + f"/{rendered.email_template_name}",
        list_unsubscribe_header=list_unsubscribe_header,
    )


def _send_push_notification(session: Session, user: User, notification: Notification) -> None:
    logger.debug(f"Formatting push notification for {user}")

    rendered = render_notification(user, notification)

    if not rendered.push_title:
        raise Exception(f"Tried to send push notification to {user} but didn't have push info")

    push_to_user(
        session,
        user_id=user.id,
        title=rendered.push_title,
        body=rendered.push_body,
        icon=rendered.push_icon,
        url=rendered.push_url,
        topic_action=notification.topic_action.display,
        key=notification.key,
        # keep on server for at most an hour if the client is not around
        ttl=3600,
    )


def _send_mobile_push_notification(session: Session, user: User, notification: Notification) -> None:
    logger.debug(f"Formatting mobile push notification for {user}")

    rendered = render_notification(user, notification)

    if not rendered.push_title:
        raise Exception(f"Tried to send mobile push notification to {user} but didn't have push info")

    push_to_mobile_user(
        session,
        user_id=user.id,
        title=rendered.push_title,
        body=rendered.push_body,
        url=rendered.push_url,
        topic_action=notification.topic_action.display,
        key=notification.key,
    )


def handle_notification(payload: jobs_pb2.HandleNotificationPayload) -> None:
    with session_scope() as session:
        notification = session.execute(
            select(Notification).where(Notification.id == payload.notification_id)
        ).scalar_one()

        # ignore this notification if the user hasn't enabled new notifications
        user = session.execute(select(User).where(User.id == notification.user_id)).scalar_one()

        topic, action = notification.topic_action.unpack()
        delivery_types = get_preference(session, notification.user.id, notification.topic_action)
        for delivery_type in delivery_types:
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
                _send_push_notification(session, user, notification)
                _send_mobile_push_notification(session, user, notification)


def send_raw_push_notification(payload: jobs_pb2.SendRawPushNotificationPayload) -> None:
    if not config["PUSH_NOTIFICATIONS_ENABLED"]:
        logger.info("Not sending push notification due to push notifications disabled")

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
        success = resp.status_code in [200, 201, 202]
        session.add(
            PushNotificationDeliveryAttempt(
                push_notification_subscription_id=sub.id,
                success=success,
                status_code=resp.status_code,
                response=resp.text,
            )
        )
        session.commit()
        if success:
            logger.debug(f"Successfully sent push to sub {sub.id} for user {sub.user}")
            push_notification_counter.inc()
        elif resp.status_code == 404 or resp.status_code == 410:
            # gone
            logger.info(f"Push sub {sub.id} for user {sub.user} is gone! Disabling.")
            sub.disabled_at = func.now()
            push_notification_disabled_counter.inc()
        else:
            raise Exception(f"Failed to deliver push to {sub.id}, code: {resp.status_code}. Response: {resp.text}")


def send_mobile_push_notification(payload: jobs_pb2.SendMobilePushNotificationPayload) -> None:
    if not config["PUSH_NOTIFICATIONS_ENABLED"]:
        logger.info("Not sending mobile push notification due to push notifications disabled")
        return

    with session_scope() as session:
        sub = session.execute(
            select(MobilePushNotificationSubscription).where(
                MobilePushNotificationSubscription.id == payload.mobile_push_notification_subscription_id
            )
        ).scalar_one()

        if sub.disabled_at < now():
            logger.error(
                f"Tried to send mobile push to disabled subscription: {sub.id}. Disabled at {sub.disabled_at}."
            )
            return

        try:
            if sub.platform == "expo":
                collapse_key = None
                if payload.topic_action and payload.key:
                    collapse_key = f"{payload.topic_action}_{payload.key}"

                result = send_expo_push_notification(
                    token=sub.token,
                    title=payload.title,
                    body=payload.body,
                    data={
                        "url": payload.url,
                        "topic_action": payload.topic_action,
                        "key": payload.key,
                    },
                    collapse_key=collapse_key,
                )

                response_data = result.get("data", [{}])[0] if result.get("data") else {}
                status = response_data.get("status", "unknown")

                if status == "error":
                    error_code = response_data.get("details", {}).get("error")
                    if error_code in {"DeviceNotRegistered", "InvalidCredentials", "MessageTooBig"}:
                        logger.warning(f"Disabling mobile push sub {sub.id}: {error_code}")
                        sub.disabled_at = func.now()
                        push_notification_disabled_counter.inc()

                    sentry_sdk.set_tag("context", "mobile_push_notification")
                    sentry_sdk.set_tag("error_code", error_code)
                    sentry_sdk.set_tag("subscription_id", sub.id)
                    sentry_sdk.set_context(
                        "mobile_push",
                        {
                            "user_id": sub.user_id,
                            "platform": sub.platform,
                            "device_type": sub.device_type,
                            "title": payload.title,
                            "expo_response": result,
                        },
                    )

                    session.add(
                        MobilePushNotificationDeliveryAttempt(
                            mobile_push_notification_subscription_id=sub.id,
                            success=False,
                            status_code=400,
                            response=str(result),
                        )
                    )
                    session.commit()

                    raise Exception(f"Failed to deliver mobile push to {sub.id}: {error_code}")

                session.add(
                    MobilePushNotificationDeliveryAttempt(
                        mobile_push_notification_subscription_id=sub.id,
                        success=True,
                        status_code=200,
                        response=str(result),
                    )
                )
                session.commit()
                logger.debug(f"Successfully sent mobile push to sub {sub.id} for user {sub.user}")
                push_notification_counter.inc()
            else:
                logger.warning(f"Platform {sub.platform} not yet supported for mobile push; skipping sub {sub.id}")

        except Exception as exc:
            logger.error(f"Failed to send mobile push to sub {sub.id}: {exc}")
            sentry_sdk.set_tag("context", "mobile_push_notification")
            sentry_sdk.set_tag("subscription_id", sub.id)
            sentry_sdk.set_context(
                "mobile_push",
                {
                    "user_id": sub.user_id,
                    "platform": sub.platform,
                    "device_type": sub.device_type,
                    "title": payload.title,
                    "error_type": type(exc).__name__,
                },
            )
            sentry_sdk.capture_exception(exc)

            session.add(
                MobilePushNotificationDeliveryAttempt(
                    mobile_push_notification_subscription_id=sub.id,
                    success=False,
                    status_code=500,
                    response=str(exc),
                )
            )
            session.commit()
            raise


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
            notifications_and_deliveries = session.execute(
                select(Notification, NotificationDelivery)
                .join(NotificationDelivery, NotificationDelivery.notification_id == Notification.id)
                .where(NotificationDelivery.delivery_type == NotificationDeliveryType.digest)
                .where(NotificationDelivery.delivered == None)
                .where(Notification.user_id == user.id)
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
