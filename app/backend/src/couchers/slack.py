import logging

import requests

from couchers.config import config

logger = logging.getLogger(__name__)


def send_slack_message(channel: str, markdown: str) -> None:
    if not config.SLACK_ENABLED:
        logger.info(f"Slack disabled, would have sent to {channel}: {markdown}")
        return

    response = requests.post(
        "https://slack.com/api/chat.postMessage",
        headers={"Authorization": f"Bearer {config.SLACK_BOT_TOKEN}"},
        json={"channel": channel, "markdown_text": markdown},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()
    if not data.get("ok"):
        raise Exception(f"Slack API error: {data.get('error')}")
