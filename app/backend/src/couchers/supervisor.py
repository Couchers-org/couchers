"""
Parent-process supervision for the child processes (API workers, background workers, scheduler, compactor).

We don't respawn individual children: if any child exits on its own the parent tears the rest down and
returns the dead child, so the caller can exit non-zero and let the container be restarted from scratch.
On SIGTERM/SIGINT the parent instead shuts down gracefully, forwarding SIGTERM so children drain.

Every child and parent-local gRPC server is told to stop before any of them is waited on, so they drain
concurrently. Children still alive after SHUTDOWN_DEADLINE are killed.
"""

import logging
import signal
import threading
import time
from collections.abc import Sequence
from multiprocessing import Process

import grpc

from couchers.constants import GRACEFUL_SHUTDOWN_TIMEOUT, SHUTDOWN_DEADLINE
from couchers.metrics import supervised_children_alive_gauge

logger = logging.getLogger(__name__)

_POLL_INTERVAL = 1.0


def catch_shutdown_signals() -> threading.Event:
    """
    Returns an event that is set on SIGTERM or SIGINT.

    Poll it with is_set() rather than calling wait() on the main thread: the handler runs on the main thread, and
    Event.set() deadlocks if the signal arrives while wait() holds the event's lock.
    """
    event = threading.Event()
    signal.signal(signal.SIGTERM, lambda *_: event.set())
    signal.signal(signal.SIGINT, lambda *_: event.set())
    return event


def supervise(children: list[Process], parent_servers: Sequence[grpc.Server] = ()) -> Process | None:
    """Block until a shutdown signal or until a child dies, then drain everything. Returns the dead child."""
    shutting_down = catch_shutdown_signals()

    crashed: Process | None = None
    while not shutting_down.is_set():
        supervised_children_alive_gauge.set(sum(child.is_alive() for child in children))
        crashed = next((child for child in children if not child.is_alive()), None)
        if crashed is not None:
            logger.critical(f"Child {crashed.name} (pid {crashed.pid}) exited with code {crashed.exitcode}")
            break
        time.sleep(_POLL_INTERVAL)
    else:
        logger.info("Received shutdown signal, shutting down")

    for child in children:
        if child.is_alive():
            child.terminate()
    server_stopped = [server.stop(GRACEFUL_SHUTDOWN_TIMEOUT) for server in parent_servers]
    deadline = time.monotonic() + SHUTDOWN_DEADLINE
    for child in children:
        child.join(timeout=max(0.0, deadline - time.monotonic()))
    for stopped in server_stopped:
        stopped.wait(timeout=max(0.0, deadline - time.monotonic()))

    # multiprocessing joins every remaining child when the parent exits, so a stuck one would hang us until docker
    # sends SIGKILL
    for child in children:
        if child.is_alive():
            logger.error(f"Child {child.name} (pid {child.pid}) did not exit within {SHUTDOWN_DEADLINE}s, killing it")
            child.kill()
            child.join()

    return crashed
