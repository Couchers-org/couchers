from unittest.mock import patch

import pytest

from couchers.config import Config
from couchers.slack import send_slack_message


@pytest.fixture(autouse=True)
def _(testconfig):
    # testconfig saves/restores the global config dict, so any mutations
    # (e.g. setting SLACK_ENABLED=True) are automatically reverted after each test
    pass


def test_send_slack_message_disabled():
    with patch("couchers.slack.requests.post") as mock_post:
        send_slack_message("test-channel", "Test message")
        mock_post.assert_not_called()


def test_send_slack_message_enabled():
    Config.current.slack_enabled = True
    Config.current.slack_bot_token = "xoxb-test-token"

    with patch("couchers.slack.requests.post") as mock_post:
        mock_post.return_value.raise_for_status.return_value = None
        mock_post.return_value.json.return_value = {"ok": True}
        send_slack_message("test-channel", "Test message")
        mock_post.assert_called_once_with(
            "https://slack.com/api/chat.postMessage",
            headers={"Authorization": "Bearer xoxb-test-token"},
            json={"channel": "test-channel", "markdown_text": "Test message"},
            timeout=10,
        )
