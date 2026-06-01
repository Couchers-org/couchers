"""
Parent-process supervision for the forked child processes (API workers, background workers, scheduler).

We don't respawn individual children: if any child exits on its own the parent tears the rest down and
returns the dead child, so the caller can exit non-zero and let the container be restarted from scratch.
On SIGTERM/SIGINT the parent instead shuts down gracefully, forwarding SIGTERM so children drain.

All teardown happens within a single GRACEFUL_SHUTDOWN_TIMEOUT window: the children and any parent-local
gRPC servers (e.g. the media server) are all told to stop first, then waited on concurrently, so their
drain budgets overlap instead of stacking — total shutdown stays under the container's stop_grace_period.
"""

import logging
import signal
import threading
import time
from collections.abc import Sequence
from multiprocessing import Process

import grpc

from couchers.constants import GRACEFUL_SHUTDOWN_TIMEOUT
from couchers.metrics import supervised_children_alive_gauge

logger = logging.getLogger(__name__)

_POLL_INTERVAL = 1.0


def supervise(children: list[Process], parent_servers: Sequence[grpc.Server] = ()) -> Process | None:
    """Block until a shutdown signal or until a child dies, then drain everything. Returns the dead child."""
    shutting_down = threading.Event()

    def handle_signal(signum: int, frame: object) -> None:
        logger.info(f"Received signal {signum}, shutting down")
        shutting_down.set()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    crashed: Process | None = None
    while not shutting_down.is_set():
        supervised_children_alive_gauge.set(sum(child.is_alive() for child in children))
        crashed = next((child for child in children if not child.is_alive()), None)
        if crashed is not None:
            logger.critical(f"Child {crashed.name} (pid {crashed.pid}) exited with code {crashed.exitcode}")
            break
        shutting_down.wait(_POLL_INTERVAL)

    # initiate every drain (all non-blocking) before waiting on any, so child and parent-server draining
    # overlap under one shared deadline rather than running back-to-back
    for child in children:
        if child.is_alive():
            child.terminate()
    server_stopped = [server.stop(GRACEFUL_SHUTDOWN_TIMEOUT) for server in parent_servers]
    deadline = time.monotonic() + GRACEFUL_SHUTDOWN_TIMEOUT
    for child in children:
        child.join(timeout=max(0.0, deadline - time.monotonic()))
    for stopped in server_stopped:
        stopped.wait(timeout=max(0.0, deadline - time.monotonic()))

    return crashed
