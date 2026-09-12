from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import sentry_sdk

from couchers.config import config


def report_error(exception: Exception) -> None:
    """Report an exception to Sentry."""
    sentry_sdk.capture_exception(exception)


def report_message(message: str) -> None:
    """Report an informational message to Sentry."""
    sentry_sdk.capture_message(message)


def _dashboard_timestamp(dt: datetime) -> str:
    return dt.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S")


def frontend_user_issues_link(*, user_id: int, reported_at: datetime) -> str:
    """Dashboard link to a user's web frontend errors around the time they reported a bug."""
    params = urlencode(
        {
            "project": config.SENTRY_FRONTEND_PROJECT_ID,
            "query": f"user.id:{user_id}",
            "start": _dashboard_timestamp(reported_at - timedelta(hours=24)),
            "end": _dashboard_timestamp(reported_at + timedelta(hours=1)),
            "utc": "true",
        }
    )
    return f"https://couchers.sentry.io/issues/?{params}"


def frontend_replay_link(*, replay_id: str) -> str:
    """Dashboard link to a session replay in the web frontend project."""
    return f"https://couchers.sentry.io/replays/{replay_id}/?project={config.SENTRY_FRONTEND_PROJECT_ID}"
