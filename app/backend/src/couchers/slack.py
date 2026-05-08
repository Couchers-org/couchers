import logging

import requests

from couchers.config import Config

logger = logging.getLogger(__name__)


def send_slack_message(channel: str, markdown: str) -> None:
    if not Config.current.slack_enabled:
        logger.info(f"Slack disabled, would have sent to {channel}: {markdown}")
        return

    response = requests.post(
        "https://slack.com/api/chat.postMessage",
        headers={"Authorization": f"Bearer {Config.current.slack_bot_token}"},
        json={"channel": channel, "markdown_text": markdown},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()
    if not data.get("ok"):
        raise Exception(f"Slack API error: {data.get('error')}")
