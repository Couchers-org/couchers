import time
from collections.abc import Callable
from multiprocessing import Process
from typing import cast

import pytest

from couchers import supervisor
from couchers.server import create_main_server, create_media_server


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_create_servers():
    server = create_main_server(port=1751)
    media_server = create_media_server(port=1753)
    server.start()
    media_server.start()
    server.stop(None).wait()
    media_server.stop(None).wait()


class FakeProcess:
    """Stands in for multiprocessing.Process so the supervisor can be tested without spawning."""

    def __init__(self):
        self._alive = True
        self.exitcode = 0
        self.terminated = False

    def is_alive(self):
        return self._alive

    def terminate(self):
        self.terminated = True
        self._alive = False


def _factory_recording(procs: list[FakeProcess]) -> Callable[[], Process]:
    def factory() -> Process:
        proc = FakeProcess()
        procs.append(proc)
        return cast(Process, proc)

    return factory


def test_dead_child_respawns_after_backoff(monkeypatch):
    procs: list[FakeProcess] = []
    clock = [0.0]
    monkeypatch.setattr(time, "monotonic", lambda: clock[0])

    child = supervisor.Child("api-1", _factory_recording(procs))
    assert len(procs) == 1

    procs[-1]._alive = False
    clock[0] = 5.0
    child.reap_if_dead()  # schedules a respawn after the backoff, doesn't respawn yet
    assert len(procs) == 1

    child.reap_if_dead()  # backoff hasn't elapsed
    assert len(procs) == 1

    clock[0] = 5.0 + supervisor._BACKOFF_BASE
    child.reap_if_dead()
    assert len(procs) == 2
    assert procs[-1].is_alive()


def test_backoff_grows_on_repeated_fast_failures(monkeypatch):
    procs: list[FakeProcess] = []
    clock = [0.0]
    monkeypatch.setattr(time, "monotonic", lambda: clock[0])

    child = supervisor.Child("api-1", _factory_recording(procs))

    delays = []
    for _ in range(4):
        procs[-1]._alive = False
        clock[0] += 1.0  # dies well within _FLAP_WINDOW => counts as a fast failure
        scheduled_at = clock[0]
        child.reap_if_dead()
        assert child._restart_at is not None
        delays.append(child._restart_at - scheduled_at)
        clock[0] = child._restart_at
        child.reap_if_dead()  # respawn

    assert delays == [1.0, 2.0, 4.0, 8.0]


def test_backoff_resets_after_healthy_run(monkeypatch):
    procs: list[FakeProcess] = []
    clock = [0.0]
    monkeypatch.setattr(time, "monotonic", lambda: clock[0])

    child = supervisor.Child("api-1", _factory_recording(procs))

    # rack up a few fast failures so the backoff has grown
    for _ in range(3):
        procs[-1]._alive = False
        clock[0] += 1.0
        child.reap_if_dead()
        assert child._restart_at is not None
        clock[0] = child._restart_at
        child.reap_if_dead()
    assert child._failures == 3

    # now the process runs healthily past _FLAP_WINDOW before dying
    procs[-1]._alive = False
    clock[0] += supervisor._FLAP_WINDOW + 1
    scheduled_at = clock[0]
    child.reap_if_dead()
    assert child._failures == 1
    assert child._restart_at is not None
    assert child._restart_at - scheduled_at == supervisor._BACKOFF_BASE


def test_backoff_capped(monkeypatch):
    procs: list[FakeProcess] = []
    clock = [0.0]
    monkeypatch.setattr(time, "monotonic", lambda: clock[0])

    child = supervisor.Child("api-1", _factory_recording(procs))

    delay = 0.0
    for _ in range(20):
        procs[-1]._alive = False
        clock[0] += 1.0
        child.reap_if_dead()
        assert child._restart_at is not None
        delay = child._restart_at - clock[0]
        clock[0] = child._restart_at
        child.reap_if_dead()

    assert delay == supervisor._BACKOFF_CAP


def test_terminate_only_signals_live_children():
    procs: list[FakeProcess] = []
    child = supervisor.Child("api-1", _factory_recording(procs))
    proc = procs[-1]
    child.terminate()
    assert proc.terminated

    proc.terminated = False
    proc._alive = False
    child.terminate()
    assert not proc.terminated
