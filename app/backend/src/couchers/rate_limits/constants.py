from dataclasses import dataclass
from datetime import timedelta

from couchers.models import RateLimitAction


@dataclass
class RateLimit:
    warning_limit: int
    hard_limit: int


# request rate limits
RATE_LIMIT_INTERVAL = timedelta(hours=24)
RATE_LIMIT_INTERVAL_STRING = "24 hours"
RATE_LIMIT_DEFINITIONS = {
    RateLimitAction.host_request: RateLimit(warning_limit=20, hard_limit=80),
    RateLimitAction.friend_request: RateLimit(warning_limit=10, hard_limit=40),
    RateLimitAction.chat_initiation: RateLimit(warning_limit=15, hard_limit=150),
}
