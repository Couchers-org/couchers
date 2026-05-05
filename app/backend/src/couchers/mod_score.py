"""
Each user has a `mod_score` (default 1.0) that admins can adjust. A low score
indicates that we have less trust in the user; this module centralises the
business rules that flow from a user's score.
"""

# Below this threshold, we don't include the user's message text in email
# notifications about host requests and conversations.
MOD_SCORE_HIDE_MESSAGE_CONTENT_THRESHOLD = 1.5


def should_hide_message_content_in_email(mod_score: float) -> bool:
    """Whether a user's message text should be hidden in email notifications
    about host requests and conversations they take part in. The recipient
    still gets the email (so they know they have a message), but they need to
    log in to read the actual text."""
    return mod_score < MOD_SCORE_HIDE_MESSAGE_CONTENT_THRESHOLD
