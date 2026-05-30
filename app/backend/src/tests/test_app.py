import signal
from multiprocessing import Process
from typing import cast

import grpc
import pytest

from couchers import supervisor
from couchers.constants import GRACEFUL_SHUTDOWN_TIMEOUT
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

    def __init__(self, name="fake", alive=True):
        self.name = name
        self.pid = 123
        self.exitcode = 0
        self._alive = alive
        self.terminated = False
        self.joined = False

    def is_alive(self):
        return self._alive

    def terminate(self):
        self.terminated = True
        self._alive = False

    def join(self, timeout=None):
        self.joined = True


class FakeServer:
    """Stands in for a grpc.Server so parent-server draining can be tested without a real server."""

    def __init__(self):
        self.stop_grace = None
        self.waited = False

    def stop(self, grace):
        self.stop_grace = grace
        return self

    def wait(self, timeout=None):
        self.waited = True


def _as_children(*procs: FakeProcess) -> list[Process]:
    return [cast(Process, p) for p in procs]


def test_supervise_returns_crashed_child_and_drains_the_rest(monkeypatch):
    monkeypatch.setattr(signal, "signal", lambda *a: None)

    alive = FakeProcess("api-1761", alive=True)
    dead = FakeProcess("api-1762", alive=False)
    children = _as_children(alive, dead)

    crashed = supervisor.supervise(children)

    assert crashed is children[1]
    assert alive.terminated
    assert alive.joined


def test_supervise_returns_none_on_graceful_shutdown(monkeypatch):
    # fire the handler as soon as it's registered, so the loop exits without any child dying
    def fire_on_register(sig, handler):
        if sig == signal.SIGTERM:
            handler(sig, None)

    monkeypatch.setattr(signal, "signal", fire_on_register)

    a = FakeProcess("api-1761")
    b = FakeProcess("api-1762")

    crashed = supervisor.supervise(_as_children(a, b))

    assert crashed is None
    assert a.terminated and b.terminated
    assert a.joined and b.joined


def test_supervise_only_terminates_live_children(monkeypatch):
    monkeypatch.setattr(signal, "signal", lambda *a: None)

    already_dead = FakeProcess("api-1761", alive=False)
    live = FakeProcess("api-1762", alive=True)

    supervisor.supervise(_as_children(already_dead, live))

    assert not already_dead.terminated
    assert live.terminated


def test_supervise_drains_parent_servers_within_the_shutdown_window(monkeypatch):
    monkeypatch.setattr(signal, "signal", lambda *a: None)

    dead = FakeProcess("api-1761", alive=False)
    media = FakeServer()

    supervisor.supervise(_as_children(dead), parent_servers=[cast(grpc.Server, media)])

    assert media.stop_grace == GRACEFUL_SHUTDOWN_TIMEOUT
    assert media.waited
