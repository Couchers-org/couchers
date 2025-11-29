import json
import logging
from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy.sql import func

from couchers.config import config
from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.metrics import push_notification_counter
from couchers.models import (
    PushNotificationDeliveryAttempt,
    PushNotificationDeliveryOutcome,
    PushNotificationPlatform,
    PushNotificationSubscription,
)
from couchers.notifications.expo_api import send_expo_push_notification
from couchers.notifications.web_push_api import send_web_push
from couchers.proto.internal import jobs_pb2
from couchers.sql import couchers_select as select
from couchers.utils import now

EXPO_RECEIPT_CHECK_DELAY = timedelta(minutes=15)

logger = logging.getLogger(__name__)


class PushNotificationError(Exception):
    """Base exception for push notification errors.

    Transient errors should raise this base class - they will be retried.
    """

    def __init__(self, message: str, *, status_code: int | None = None, response: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


class PermanentSubscriptionFailure(PushNotificationError):
    """Subscription is permanently broken and should be disabled.

    Examples: device unregistered, invalid credentials, 404/410 Gone.
    """

    pass


class PermanentMessageFailure(PushNotificationError):
    """Message cannot be delivered, but the subscription is still valid.

    Don't disable the subscription, but don't retry this specific message.
    """

    pass


class MessageTooLong(PermanentMessageFailure):
    """Message exceeds the platform's size limits."""

    pass


@dataclass
class PushDeliveryResult:
    """Result of a successful push notification delivery."""

    status_code: int
    response: str | None = None
    expo_ticket_id: str | None = None


def _send_web_push(
    sub: PushNotificationSubscription, payload: jobs_pb2.SendRawPushNotificationPayload
) -> PushDeliveryResult:
    """Send via Web Push API. Raises appropriate exceptions on failure."""
    if len(payload.data) > 3072:
        raise MessageTooLong(f"Data too long for web push ({len(payload.data)} bytes, max 3072)")

    resp = send_web_push(
        payload.data,
        sub.endpoint,
        sub.auth_key,
        sub.p256dh_key,
        config["PUSH_NOTIFICATIONS_VAPID_SUBJECT"],
        config["PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY"],
        ttl=payload.ttl,
    )

    if resp.status_code in [200, 201, 202]:
        return PushDeliveryResult(status_code=resp.status_code, response=resp.text)

    if resp.status_code in [404, 410]:
        raise PermanentSubscriptionFailure(
            f"Subscription gone (HTTP {resp.status_code})",
            status_code=resp.status_code,
            response=resp.text,
        )

    # Other errors are transient - will retry
    raise PushNotificationError(
        f"Web push failed (HTTP {resp.status_code})",
        status_code=resp.status_code,
        response=resp.text,
    )


def _send_expo(
    sub: PushNotificationSubscription, payload: jobs_pb2.SendRawPushNotificationPayload
) -> PushDeliveryResult:
    """Send via Expo Push API. Raises appropriate exceptions on failure."""
    # Parse the JSON-encoded data from the payload
    data = json.loads(payload.data.decode("utf8"))

    title = data.get("title", "")
    body = data.get("body", "")
    url = data.get("url")
    topic_action = data.get("topic_action", "")
    key = data.get("key", "")

    collapse_key = None
    if topic_action and key:
        collapse_key = f"{topic_action}_{key}"

    result = send_expo_push_notification(
        token=sub.token,
        title=title,
        body=body,
        data={
            "url": url,
            "topic_action": topic_action,
            "key": key,
        },
        collapse_key=collapse_key,
    )

    # Parse the Expo response
    response_data = {}
    if isinstance(result.get("data"), list) and len(result.get("data", [])) > 0:
        response_data = result["data"][0]
    elif isinstance(result.get("data"), dict):
        response_data = result["data"]

    status = response_data.get("status", "unknown")
    response_str = str(result)

    if status == "ok":
        # Extract ticket ID for receipt checking
        ticket_id = response_data.get("id")
        return PushDeliveryResult(status_code=200, response=response_str, expo_ticket_id=ticket_id)

    # Handle error status
    error_code = response_data.get("details", {}).get("error")

    if error_code == "MessageTooBig":
        raise MessageTooLong(
            f"Expo message too big: {error_code}",
            status_code=400,
            response=response_str,
        )

    if error_code in {"DeviceNotRegistered", "InvalidCredentials"}:
        raise PermanentSubscriptionFailure(
            f"Expo subscription invalid: {error_code}",
            status_code=400,
            response=response_str,
        )

    # Other errors are transient - will retry
    raise PushNotificationError(
        f"Expo push failed: {error_code or status}",
        status_code=400,
        response=response_str,
    )


def send_raw_push_notification(payload: jobs_pb2.SendRawPushNotificationPayload) -> None:
    if not config["PUSH_NOTIFICATIONS_ENABLED"]:
        logger.info("Not sending push notification: push notifications disabled")
        return

    with session_scope() as session:
        sub = session.execute(
            select(PushNotificationSubscription).where(
                PushNotificationSubscription.id == payload.push_notification_subscription_id
            )
        ).scalar_one()

        if sub.disabled_at < now():
            logger.info(f"Skipping push to already-disabled subscription {sub.id}")
            return

        try:
            if sub.platform == PushNotificationPlatform.web_push:
                result = _send_web_push(sub, payload)
            elif sub.platform == PushNotificationPlatform.expo:
                result = _send_expo(sub, payload)
            else:
                raise ValueError(f"Unknown platform: {sub.platform}")

            # Success
            delivery_attempt = PushNotificationDeliveryAttempt(
                push_notification_subscription_id=sub.id,
                outcome=PushNotificationDeliveryOutcome.success,
                status_code=result.status_code,
                response=result.response,
                expo_ticket_id=result.expo_ticket_id,
            )
            session.add(delivery_attempt)
            session.flush()  # Get the ID for the receipt check job

            # Queue receipt check for Expo notifications
            if sub.platform == PushNotificationPlatform.expo and result.expo_ticket_id:
                queue_job(
                    session,
                    job_type="check_expo_push_receipt",
                    payload=jobs_pb2.CheckExpoPushReceiptPayload(
                        delivery_attempt_id=delivery_attempt.id,
                        ticket_id=result.expo_ticket_id,
                    ),
                    delay=EXPO_RECEIPT_CHECK_DELAY,
                )

            push_notification_counter.labels(platform=sub.platform.name, outcome="success").inc()
            logger.debug(f"Successfully sent push to sub {sub.id} for user {sub.user_id}")

        except PermanentSubscriptionFailure as e:
            logger.info(f"Disabling push sub {sub.id} for user {sub.user_id}: {e}")
            session.add(
                PushNotificationDeliveryAttempt(
                    push_notification_subscription_id=sub.id,
                    outcome=PushNotificationDeliveryOutcome.permanent_subscription_failure,
                    status_code=e.status_code,
                    response=e.response,
                )
            )
            sub.disabled_at = func.now()
            push_notification_counter.labels(platform=sub.platform.name, outcome="permanent_subscription_failure").inc()

        except PermanentMessageFailure as e:
            logger.warning(f"Permanent message failure for sub {sub.id}: {e}")
            session.add(
                PushNotificationDeliveryAttempt(
                    push_notification_subscription_id=sub.id,
                    outcome=PushNotificationDeliveryOutcome.permanent_message_failure,
                    status_code=e.status_code,
                    response=e.response,
                )
            )
            push_notification_counter.labels(platform=sub.platform.name, outcome="permanent_message_failure").inc()

        except PushNotificationError as e:
            # Transient error - log attempt and re-raise to trigger retry
            logger.warning(f"Transient push failure for sub {sub.id}: {e}")
            session.add(
                PushNotificationDeliveryAttempt(
                    push_notification_subscription_id=sub.id,
                    outcome=PushNotificationDeliveryOutcome.transient_failure,
                    status_code=e.status_code,
                    response=e.response,
                )
            )
            push_notification_counter.labels(platform=sub.platform.name, outcome="transient_failure").inc()
            session.commit()
            raise
