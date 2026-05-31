"""
Continuous profiling via Grafana Pyroscope, using the pyroscope-io in-process agent (py-spy under
the hood).

Controlled entirely by GrowthBook flags so profiling can be turned on/off and retuned in prod
without a redeploy:
  - profiling_enabled      (bool)   master on/off
  - profiling_sample_rate  (int)    samples per second
  - profiling_mode         (string) "wall" or "cpu"

Each profiled process (API workers, background-job workers) calls setup_profiling() once during its
own per-process init - the agent is per-process, so this can't be inherited across the forkserver
boundary. A daemon reconcile thread then polls the flags every RECONCILE_INTERVAL_SECONDS and
(re)configures or shuts the agent down to match the desired state.

Two hard requirements learned the hard way from the agent's internals:
  - The container needs CAP_SYS_PTRACE (see docker-compose.prod.yml). Without it the agent silently
    samples nothing.
  - enable_logging must NEVER be passed True on a re-configure: the agent's Rust global logger can
    only be initialised once per process, and a second attempt is a non-unwinding panic that aborts
    the whole process. We pass enable_logging=False unconditionally.
"""

import logging
import threading

import pyroscope

from couchers import experimentation
from couchers.config import config

logger = logging.getLogger(__name__)

RECONCILE_INTERVAL_SECONDS = 30

FLAG_ENABLED = "profiling_enabled"
FLAG_SAMPLE_RATE = "profiling_sample_rate"
FLAG_MODE = "profiling_mode"

_DEFAULT_ENABLED = False
_DEFAULT_SAMPLE_RATE = 20
_DEFAULT_MODE = "wall"

# Guard rails on the remotely-controlled sample rate.
_MIN_SAMPLE_RATE = 1
_MAX_SAMPLE_RATE = 250

_APPLICATION_NAME = "couchers-backend"

_started = False
_stop_event = threading.Event()


def _clamp_rate(rate: int) -> int:
    return max(_MIN_SAMPLE_RATE, min(_MAX_SAMPLE_RATE, rate))


def _start_agent(sample_rate: int, oncpu: bool, tags: dict[str, str]) -> None:
    logger.info("Starting profiler: sample_rate=%d mode=%s", sample_rate, "cpu" if oncpu else "wall")
    token = config["PYROSCOPE_AUTH_TOKEN"]
    pyroscope.configure(
        application_name=_APPLICATION_NAME,
        server_address=config["PYROSCOPE_SERVER"],
        sample_rate=sample_rate,
        oncpu=oncpu,
        tags=tags,
        # The agent has no bearer-token option; the auth header is how our nginx ingest gate authenticates.
        http_headers={"Authorization": f"Bearer {token}"} if token else None,
        # Must stay False forever: re-initialising the agent's global logger panics and aborts the process.
        enable_logging=False,
    )


def _reconcile_once(state: dict[str, object], tags: dict[str, str]) -> None:
    enabled = experimentation.get_global_boolean_value(FLAG_ENABLED, _DEFAULT_ENABLED)
    sample_rate = _clamp_rate(experimentation.get_global_integer_value(FLAG_SAMPLE_RATE, _DEFAULT_SAMPLE_RATE))
    oncpu = experimentation.get_global_string_value(FLAG_MODE, _DEFAULT_MODE) == "cpu"

    if not enabled:
        if state["running"]:
            logger.info("Stopping profiler")
            pyroscope.shutdown()
            state.update(running=False, sample_rate=None, oncpu=None)
        return

    if state["running"] and state["sample_rate"] == sample_rate and state["oncpu"] == oncpu:
        return

    if state["running"]:
        # sample_rate/oncpu are baked in at agent creation, so a change means a full stop + restart
        logger.info(
            "Reconfiguring profiler: sample_rate %s->%d, mode %s->%s",
            state["sample_rate"],
            sample_rate,
            "cpu" if state["oncpu"] else "wall",
            "cpu" if oncpu else "wall",
        )
        pyroscope.shutdown()

    _start_agent(sample_rate, oncpu, tags)
    state.update(running=True, sample_rate=sample_rate, oncpu=oncpu)


def _reconcile_loop(tags: dict[str, str]) -> None:
    state: dict[str, object] = {"running": False, "sample_rate": None, "oncpu": None}
    # Poll immediately, then every interval. A failed reconcile must not kill the thread.
    while True:
        try:
            _reconcile_once(state, tags)
        except Exception:
            logger.exception("Profiling reconcile failed")
        if _stop_event.wait(RECONCILE_INTERVAL_SECONDS):
            return


def setup_profiling(role: str, instance: str) -> None:
    """
    Start the per-process profiling reconcile thread. Call once per process, after
    setup_experimentation(). No-op unless a Pyroscope server is configured.
    """
    global _started

    if not config["PYROSCOPE_SERVER"]:
        return

    if _started:
        logger.warning("setup_profiling() called more than once in a process; ignoring")
        return
    _started = True

    tags = {
        "role": role,
        "instance": instance,
        "environment": config["COOKIE_DOMAIN"],
        "version": config["VERSION"],
    }
    thread = threading.Thread(target=_reconcile_loop, args=(tags,), name="profiling-reconcile", daemon=True)
    thread.start()
    logger.info("Profiling reconcile thread started (instance=%s)", instance)
