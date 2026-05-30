"""
Parent-process supervision for the forked child processes (API workers, background workers, scheduler).

A child that exits is respawned with exponential backoff so a crash loop doesn't hammer the database;
a child that survives _FLAP_WINDOW is treated as healthy and its failure count resets. On SIGTERM/SIGINT
the supervisor stops respawning, forwards SIGTERM to the children so they drain, then joins them within
GRACEFUL_SHUTDOWN_TIMEOUT.
"""

import logging
import signal
import threading
import time
from collections.abc import Callable
from multiprocessing import Process

from couchers.constants import GRACEFUL_SHUTDOWN_TIMEOUT

logger = logging.getLogger(__name__)

_POLL_INTERVAL = 1.0
_FLAP_WINDOW = 60.0
_BACKOFF_BASE = 1.0
_BACKOFF_CAP = 30.0


class Child:
    """A supervised child process that is respawned (with backoff) if it exits unexpectedly."""

    def __init__(self, name: str, start: Callable[[], Process]) -> None:
        self.name = name
        self._start = start
        self.process = start()
        self._failures = 0
        self._started_at = time.monotonic()
        self._restart_at: float | None = None

    def reap_if_dead(self) -> None:
        if self.process.is_alive():
            return
        if self._restart_at is not None:
            if time.monotonic() >= self._restart_at:
                self.process = self._start()
                self._started_at = time.monotonic()
                self._restart_at = None
            return
        if time.monotonic() - self._started_at >= _FLAP_WINDOW:
            self._failures = 0
        self._failures += 1
        backoff = min(_BACKOFF_CAP, _BACKOFF_BASE * 2 ** (self._failures - 1))
        logger.critical(
            f"Child {self.name} exited (code {self.process.exitcode}); respawning in {backoff:.0f}s "
            f"(consecutive fast failures: {self._failures})"
        )
        self._restart_at = time.monotonic() + backoff

    def terminate(self) -> None:
        if self.process.is_alive():
            self.process.terminate()


def supervise(children: list[Child]) -> None:
    """Block in the parent, respawning dead children, until SIGTERM/SIGINT — then drain children and return."""
    shutting_down = threading.Event()

    def handle_signal(signum: int, frame: object) -> None:
        logger.info(f"Received signal {signum}, shutting down")
        shutting_down.set()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    while not shutting_down.is_set():
        for child in children:
            child.reap_if_dead()
        shutting_down.wait(_POLL_INTERVAL)

    for child in children:
        child.terminate()
    deadline = time.monotonic() + GRACEFUL_SHUTDOWN_TIMEOUT
    for child in children:
        child.process.join(timeout=max(0.0, deadline - time.monotonic()))
