"""
Parent-process supervision for the forked child processes (API workers, background workers, scheduler).

We don't respawn individual children: if any child exits on its own the parent tears the rest down and
returns the dead child, so the caller can exit non-zero and let the container be restarted from scratch.
On SIGTERM/SIGINT the parent instead shuts down gracefully, forwarding SIGTERM so children drain and
joining them within GRACEFUL_SHUTDOWN_TIMEOUT.
"""

import logging
import signal
import threading
import time
from multiprocessing import Process

from couchers.constants import GRACEFUL_SHUTDOWN_TIMEOUT

logger = logging.getLogger(__name__)

_POLL_INTERVAL = 1.0


def supervise(children: list[Process]) -> Process | None:
    """Block until a shutdown signal or until a child dies, then drain the children. Returns the dead child."""
    shutting_down = threading.Event()

    def handle_signal(signum: int, frame: object) -> None:
        logger.info(f"Received signal {signum}, shutting down")
        shutting_down.set()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    crashed: Process | None = None
    while not shutting_down.is_set():
        crashed = next((child for child in children if not child.is_alive()), None)
        if crashed is not None:
            logger.critical(f"Child {crashed.name} (pid {crashed.pid}) exited with code {crashed.exitcode}")
            break
        shutting_down.wait(_POLL_INTERVAL)

    for child in children:
        if child.is_alive():
            child.terminate()
    deadline = time.monotonic() + GRACEFUL_SHUTDOWN_TIMEOUT
    for child in children:
        child.join(timeout=max(0.0, deadline - time.monotonic()))

    return crashed
