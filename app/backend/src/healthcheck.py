"""
Container healthcheck: connect to every API worker port. Exits non-zero if any worker isn't listening, so a
dead or crash-looping worker surfaces as an unhealthy container even though the supervising parent is still up.

Run as `python src/healthcheck.py`. Ports are derived from constants so they can't drift from what's served.
"""

import socket

from couchers.constants import API_BASE_PORT, API_WORKER_COUNT

for port in range(API_BASE_PORT, API_BASE_PORT + API_WORKER_COUNT):
    with socket.create_connection(("localhost", port), timeout=2):
        pass
