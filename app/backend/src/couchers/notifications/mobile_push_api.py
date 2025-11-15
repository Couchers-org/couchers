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
) -> dict[str, Any]:
    """Send a push notification via the Expo Push API"""
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
        return response.json()
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
            },
        )
        sentry_sdk.capture_exception(exc)
        raise
