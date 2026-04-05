import json
import logging
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.sql import func

from couchers.config import config
from couchers.db import session_scope
from couchers.metrics import push_notification_counter
from couchers.models import (
    PushNotificationDeliveryAttempt,
    PushNotificationDeliveryOutcome,
    PushNotificationPlatform,
    PushNotificationSubscription,
)
from couchers.models.notifications import DeviceType
from couchers.notifications.expo_api import send_expo_push_notification
from couchers.notifications.web_push_api import send_web_push
from couchers.proto.internal import jobs_pb2
from couchers.utils import not_none, now

logger = logging.getLogger(__name__)


def is_known_invalid_endpoint(endpoint: str) -> bool:
    # Edge on Android can generate this bad endpoint URL
    return endpoint.startswith("https://permanently-removed.invalid/")


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
    sub: PushNotificationSubscription, payload: jobs_pb2.SendRawPushNotificationPayloadV2
) -> PushDeliveryResult:
    """Send via Web Push API. Raises appropriate exceptions on failure."""
    if is_known_invalid_endpoint(not_none(sub.endpoint)):
        raise PermanentSubscriptionFailure("Endpoint is https://permanently-removed.invalid/")

    data = json.dumps(
        {
            "title": payload.title,
            "body": payload.body,
            "icon": payload.icon,
            "url": payload.url,
            "user_id": payload.user_id,
            "topic_action": payload.topic_action,
            "key": payload.key,
        }
    ).encode("utf8")

    if len(data) > 3072:
        raise MessageTooLong(f"Data too long for web push ({len(data)} bytes, max 3072)")

    resp = send_web_push(
        data,
        not_none(sub.endpoint),
        not_none(sub.auth_key),
        not_none(sub.p256dh_key),
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
    sub: PushNotificationSubscription, payload: jobs_pb2.SendRawPushNotificationPayloadV2
) -> PushDeliveryResult:
    """Send via Expo Push API. Raises appropriate exceptions on failure."""
    collapse_key = None
    if payload.topic_action and payload.key:
        collapse_key = f"{payload.topic_action}_{payload.key}"

    title: str
    ios_subtitle: str | None = None
    if sub.device_type == DeviceType.ios and payload.ios_title:
        # Prefer the iOS-specific title/subtitle pair if available.
        title = payload.ios_title
        ios_subtitle = payload.ios_subtitle
    else:
        title = payload.title

    result = send_expo_push_notification(
        token=not_none(sub.token),
        title=title,
        ios_subtitle=ios_subtitle,
        body=payload.body,
        data={
            "url": payload.url,
            "topic_action": payload.topic_action,
            "key": payload.key,
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


def send_raw_push_notification_v2(payload: jobs_pb2.SendRawPushNotificationPayloadV2) -> None:
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

            # Success - receipt will be checked by the batch job check_expo_push_receipts
            session.add(
                PushNotificationDeliveryAttempt(
                    push_notification_subscription_id=sub.id,
                    outcome=PushNotificationDeliveryOutcome.success,
                    status_code=result.status_code,
                    response=result.response,
                    expo_ticket_id=result.expo_ticket_id,
                )
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
