"""Mobile push notification API clients"""

import logging
from typing import Any

import requests
import sentry_sdk

logger = logging.getLogger(__name__)


def send_expo_push_notification(
    *,
    token: str,
    title: str,
    body: str,
    data: dict[str, Any] | None = None,
    collapse_key: str | None = None,
    thread_id: str | None = None,
) -> dict[str, Any]:
    """Send a push notification via the Expo Push API

    Args:
        token: Expo push token
        title: Notification title
        body: Notification body
        data: Custom data payload
        collapse_key: Android collapse key - replaces previous notifications with same key
        thread_id: iOS thread identifier - groups notifications visually in notification center
    """
    message: dict[str, Any] = {
        "to": token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data or {},
        "priority": "high",
        "channelId": "default",
    }

    if collapse_key:
        message["collapseKey"] = collapse_key

    if thread_id:
        message["threadId"] = thread_id

    try:
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=message,
            headers={
                "Accept": "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            timeout=10,
        )
        response.raise_for_status()
        result = response.json()
        if not isinstance(result, dict):
            raise ValueError(f"Expected a dict, but got {result}")
        return result
    except requests.exceptions.RequestException as exc:
        logger.error("Failed to send Expo push notification: %s", exc)
        sentry_sdk.set_tag("context", "expo_push_api")
        sentry_sdk.set_tag("token_prefix", token[:16])
        sentry_sdk.set_context(
            "expo_push",
            {
                "title": title,
                "body_preview": body[:120],
                "data": data,
                "collapse_key": collapse_key,
                "thread_id": thread_id,
            },
        )
        sentry_sdk.capture_exception(exc)
        raise


def get_expo_push_receipts(ticket_ids: list[str]) -> dict[str, Any]:
    """Fetch push receipts from Expo API.

    Expo push notifications are a two-phase delivery system:
    1. Send notification → get ticket ID (immediate)
    2. Check receipt → get actual delivery status (after ~15 minutes)

    Args:
        ticket_ids: List of ticket IDs to check (max 1000 per request)

    Returns:
        Dict mapping ticket_id -> receipt data, where receipt data contains:
        - status: "ok" or "error"
        - For errors: details.error (e.g., "DeviceNotRegistered", "MessageTooBig")
    """
    if not ticket_ids:
        return {}

    try:
        response = requests.post(
            "https://exp.host/--/api/v2/push/getReceipts",
            json={"ids": ticket_ids},
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            timeout=10,
        )
        response.raise_for_status()
        result = response.json().get("data", {})
        if not isinstance(result, dict):
            raise ValueError(f"Expected a dict, but got {result}")
        return result
    except requests.exceptions.RequestException as exc:
        logger.error("Failed to fetch Expo push receipts: %s", exc)
        sentry_sdk.set_tag("context", "expo_push_receipts")
        sentry_sdk.set_context("expo_receipts", {"ticket_count": len(ticket_ids)})
        sentry_sdk.capture_exception(exc)
        raise
