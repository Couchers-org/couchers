"""
Slack posting for the GitHub LLM bots.

Standalone rather than reusing couchers.slack: the bots run in GitHub Actions and
can't import backend code. This posts via an incoming webhook, which has the
channel baked into the URL and takes mrkdwn (so links are `<url|text>`).
"""

import os

import requests


def send_slack_message(text: str) -> None:
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
    if not webhook_url:
        # Forks and misconfigured setups have no webhook; don't fail the job over it
        print(f"No Slack webhook set, would have sent: {text}")
        return

    # Webhooks answer with a plain-text "ok" body, so there's no JSON status to check
    response = requests.post(webhook_url, json={"text": text}, timeout=10)
    response.raise_for_status()
    print(f"Posted to Slack: {text}")
