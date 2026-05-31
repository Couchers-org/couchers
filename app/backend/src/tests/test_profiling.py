from typing import Any

import pyroscope
import pytest

from couchers import profiling
from couchers.config import config

TAGS = {"role": "api", "instance": "api-1761"}


class AgentCalls:
    def __init__(self) -> None:
        self.configure: list[dict[str, Any]] = []
        self.shutdown = 0


@pytest.fixture
def fake_agent(monkeypatch):
    """Replace the native pyroscope agent with recorders so we can assert configure/shutdown calls."""
    calls = AgentCalls()
    monkeypatch.setattr(pyroscope, "configure", lambda **kw: calls.configure.append(kw))

    def _shutdown():
        calls.shutdown += 1

    monkeypatch.setattr(pyroscope, "shutdown", _shutdown)
    return calls


def _fresh_state():
    return {"running": False, "sample_rate": None, "oncpu": None}


def _enable(feature_flags, *, rate=20, mode="wall"):
    feature_flags.set("profiling_enabled", True)
    feature_flags.set("profiling_sample_rate", rate)
    feature_flags.set("profiling_mode", mode)


def test_disabled_does_nothing(feature_flags, fake_agent):
    feature_flags.set("profiling_enabled", False)
    state = _fresh_state()
    profiling._reconcile_once(state, TAGS)
    assert fake_agent.configure == []
    assert fake_agent.shutdown == 0
    assert state["running"] is False


def test_enables_with_flag_driven_params(feature_flags, fake_agent, monkeypatch):
    monkeypatch.setitem(config, "PYROSCOPE_SERVER", "https://pyroscope.couchershq.org")
    monkeypatch.setitem(config, "PYROSCOPE_AUTH_TOKEN", "secret-token")
    _enable(feature_flags, rate=50, mode="cpu")
    state = _fresh_state()
    profiling._reconcile_once(state, TAGS)

    assert len(fake_agent.configure) == 1
    kw = fake_agent.configure[0]
    assert kw["sample_rate"] == 50
    assert kw["oncpu"] is True
    assert kw["server_address"] == "https://pyroscope.couchershq.org"
    assert kw["http_headers"] == {"Authorization": "Bearer secret-token"}
    # enable_logging must never be True on reconfigure (re-init aborts the process), so it's always False
    assert kw["enable_logging"] is False
    assert kw["tags"] == TAGS
    assert state == {"running": True, "sample_rate": 50, "oncpu": True}


def test_idempotent_when_unchanged(feature_flags, fake_agent):
    _enable(feature_flags)
    state = _fresh_state()
    profiling._reconcile_once(state, TAGS)
    profiling._reconcile_once(state, TAGS)
    assert len(fake_agent.configure) == 1
    assert fake_agent.shutdown == 0


def test_rate_change_cycles_agent(feature_flags, fake_agent):
    _enable(feature_flags, rate=20)
    state = _fresh_state()
    profiling._reconcile_once(state, TAGS)
    feature_flags.set("profiling_sample_rate", 73)
    profiling._reconcile_once(state, TAGS)
    assert len(fake_agent.configure) == 2
    assert fake_agent.shutdown == 1
    assert fake_agent.configure[-1]["sample_rate"] == 73
    assert state["sample_rate"] == 73


def test_mode_change_cycles_agent(feature_flags, fake_agent):
    _enable(feature_flags, mode="wall")
    state = _fresh_state()
    profiling._reconcile_once(state, TAGS)
    feature_flags.set("profiling_mode", "cpu")
    profiling._reconcile_once(state, TAGS)
    assert fake_agent.shutdown == 1
    assert fake_agent.configure[-1]["oncpu"] is True
    assert state["oncpu"] is True


def test_disable_after_running_shuts_down(feature_flags, fake_agent):
    _enable(feature_flags)
    state = _fresh_state()
    profiling._reconcile_once(state, TAGS)
    feature_flags.set("profiling_enabled", False)
    profiling._reconcile_once(state, TAGS)
    assert fake_agent.shutdown == 1
    assert state["running"] is False


def test_sample_rate_is_clamped(feature_flags, fake_agent):
    _enable(feature_flags, rate=100000)
    state = _fresh_state()
    profiling._reconcile_once(state, TAGS)
    assert fake_agent.configure[0]["sample_rate"] == profiling._MAX_SAMPLE_RATE
