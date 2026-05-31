"""
Continuous profiling via Grafana Pyroscope.

Each API and background-worker process runs an in-process pyroscope-io agent (py-spy under the
hood). Profiling is controlled at runtime by GrowthBook flags, so it can be turned on, off, and
retuned in production without a redeploy:

    profiling_enabled      whether to profile at all
    profiling_sample_rate  samples per second
    profiling_mode         "wall" or "cpu"

A per-process reconcile thread polls these and (re)starts or stops the agent to match. The agent is
per-process (it can't survive the forkserver boundary), needs CAP_SYS_PTRACE in the container, and
its logging may only be initialised once per process - a second attempt aborts the process, so we
never enable it.
"""

import logging
import threading

import pyroscope

from couchers import experimentation
from couchers.config import config

logger = logging.getLogger(__name__)

_RECONCILE_INTERVAL_SECONDS = 30
_MIN_SAMPLE_RATE = 1
_MAX_SAMPLE_RATE = 250

_initialized = False
_stop = threading.Event()

# Owned exclusively by the single reconcile thread, so no locking.
_tags: dict[str, str] = {}
_running = False
_sample_rate: int | None = None
_oncpu: bool | None = None


def _reconcile() -> None:
    global _running, _sample_rate, _oncpu

    if not experimentation.get_global_boolean_value("profiling_enabled", False):
        if _running:
            logger.info("Stopping profiler")
            pyroscope.shutdown()
            _running, _sample_rate, _oncpu = False, None, None
        return

    sample_rate = max(
        _MIN_SAMPLE_RATE,
        min(_MAX_SAMPLE_RATE, experimentation.get_global_integer_value("profiling_sample_rate", 20)),
    )
    oncpu = experimentation.get_global_string_value("profiling_mode", "wall") == "cpu"

    if _running and (sample_rate, oncpu) == (_sample_rate, _oncpu):
        return

    # The sample rate and mode are fixed when the agent starts, so a change means a full restart.
    if _running:
        pyroscope.shutdown()

    logger.info("Starting profiler at %d Hz (%s)", sample_rate, "cpu" if oncpu else "wall")
    pyroscope.configure(
        application_name="couchers-backend",
        server_address=config["PYROSCOPE_SERVER"],
        sample_rate=sample_rate,
        oncpu=oncpu,
        tags=_tags,
        # The agent has no bearer-token option; this is what our nginx ingest gate authenticates against.
        http_headers={"Authorization": f"Bearer {config['PYROSCOPE_AUTH_TOKEN']}"},
        enable_logging=False,
    )
    _running, _sample_rate, _oncpu = True, sample_rate, oncpu


def _reconcile_loop() -> None:
    _reconcile()
    while not _stop.wait(_RECONCILE_INTERVAL_SECONDS):
        _reconcile()


def setup_profiling(role: str, instance: str) -> None:
    """Start the per-process profiling reconcile thread. Call once per process, after
    setup_experimentation(). No-op unless profiling is enabled for this deployment."""
    global _initialized, _tags

    if not config["PYROSCOPE_ENABLED"] or _initialized:
        return
    _initialized = True

    _tags = {
        "role": role,
        "instance": instance,
        "environment": config["COOKIE_DOMAIN"],
        "version": config["VERSION"],
    }
    threading.Thread(target=_reconcile_loop, name="profiling-reconcile", daemon=True).start()
