import pyroscope
import pytest

from couchers import profiling
from couchers.config import config

TAGS = {"role": "api", "instance": "api-1761"}


@pytest.fixture
def fake_agent(monkeypatch):
    """Replace the native pyroscope agent with recorders and reset the per-process agent state."""
    configure_calls: list[dict[str, object]] = []
    shutdown_calls: list[None] = []
    monkeypatch.setattr(pyroscope, "configure", lambda **kw: configure_calls.append(kw))
    monkeypatch.setattr(pyroscope, "shutdown", lambda: shutdown_calls.append(None))
    monkeypatch.setattr(profiling, "_tags", TAGS)
    monkeypatch.setattr(profiling, "_running", False)
    monkeypatch.setattr(profiling, "_sample_rate", None)
    monkeypatch.setattr(profiling, "_oncpu", None)
    monkeypatch.setitem(config, "PYROSCOPE_SERVER", "https://localhost")
    monkeypatch.setitem(config, "PYROSCOPE_AUTH_TOKEN", "token")
    return configure_calls, shutdown_calls


def _enable(feature_flags, *, rate=20, mode="wall"):
    feature_flags.set("profiling_enabled", True)
    feature_flags.set("profiling_sample_rate", rate)
    feature_flags.set("profiling_mode", mode)


def test_disabled_does_nothing(feature_flags, fake_agent):
    configure_calls, shutdown_calls = fake_agent
    feature_flags.set("profiling_enabled", False)
    profiling._reconcile()
    assert configure_calls == []
    assert shutdown_calls == []
    assert profiling._running is False


def test_enables_with_flag_driven_params(feature_flags, fake_agent, monkeypatch):
    monkeypatch.setitem(config, "PYROSCOPE_SERVER", "https://pyroscope.couchershq.org")
    monkeypatch.setitem(config, "PYROSCOPE_AUTH_TOKEN", "secret-token")
    configure_calls, _ = fake_agent
    _enable(feature_flags, rate=50, mode="cpu")
    profiling._reconcile()

    assert len(configure_calls) == 1
    kw = configure_calls[0]
    assert kw["sample_rate"] == 50
    assert kw["oncpu"] is True
    assert kw["server_address"] == "https://pyroscope.couchershq.org"
    assert kw["http_headers"] == {"Authorization": "Bearer secret-token"}
    assert kw["tags"] == TAGS
    # enable_logging must never be True on a reconfigure (re-init aborts the process)
    assert kw["enable_logging"] is False
    assert (profiling._running, profiling._sample_rate, profiling._oncpu) == (True, 50, True)


def test_idempotent_when_unchanged(feature_flags, fake_agent):
    configure_calls, shutdown_calls = fake_agent
    _enable(feature_flags)
    profiling._reconcile()
    profiling._reconcile()
    assert len(configure_calls) == 1
    assert shutdown_calls == []


def test_rate_change_restarts_agent(feature_flags, fake_agent):
    configure_calls, shutdown_calls = fake_agent
    _enable(feature_flags, rate=20)
    profiling._reconcile()
    feature_flags.set("profiling_sample_rate", 73)
    profiling._reconcile()
    assert len(configure_calls) == 2
    assert len(shutdown_calls) == 1
    assert configure_calls[-1]["sample_rate"] == 73
    assert profiling._sample_rate == 73


def test_mode_change_restarts_agent(feature_flags, fake_agent):
    configure_calls, shutdown_calls = fake_agent
    _enable(feature_flags, mode="wall")
    profiling._reconcile()
    feature_flags.set("profiling_mode", "cpu")
    profiling._reconcile()
    assert len(shutdown_calls) == 1
    assert configure_calls[-1]["oncpu"] is True
    assert profiling._oncpu is True


def test_disable_after_running_shuts_down(feature_flags, fake_agent):
    _, shutdown_calls = fake_agent
    _enable(feature_flags)
    profiling._reconcile()
    feature_flags.set("profiling_enabled", False)
    profiling._reconcile()
    assert len(shutdown_calls) == 1
    assert profiling._running is False


def test_sample_rate_is_clamped(feature_flags, fake_agent):
    configure_calls, _ = fake_agent
    _enable(feature_flags, rate=100000)
    profiling._reconcile()
    assert configure_calls[0]["sample_rate"] == 250
