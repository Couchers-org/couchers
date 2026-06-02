"""
Feature flag and experimentation framework.

The flag source is picked by config:
  - FEATURE_FLAGS_ENABLED=False: all evaluations return the in-code default.
  - FEATURE_FLAGS_ENABLED=True, FEATURE_FLAGS_USE_LOCAL_FILE=True: values are read from a JSON file
    at FEATURE_FLAGS_LOCAL_FILE_PATH, loaded once at startup. Keys missing from the file fall
    through to the in-code default. No GrowthBook contact - intended for local dev and tests.
  - FEATURE_FLAGS_ENABLED=True, FEATURE_FLAGS_USE_LOCAL_FILE=False: values come from GrowthBook, with
    a background-refreshed in-memory snapshot and a disk cache fallback at startup.

Two ways to evaluate a flag:
  - Per-user/request: use the CouchersContext methods (context.get_boolean_value, get_string_value,
    etc.), which evaluate for the context's user and own the per-request evaluator cache.
  - Global (no user/request): use the module-level get_global_boolean_value / get_global_string_value
    / ... below. Use these ONLY when there is genuinely no user to evaluate for and no way to thread
    one through - per-user evaluation is impossible here, not merely that you don't expect the value
    to vary per user. Whenever a user is (or could reasonably be) available, use the context: only the
    per-user path can do percentage rollouts, experiments, and feature-usage tracking.

setup_experimentation() is called once at process startup.
"""

import json
import logging
import threading
import time
from collections.abc import Callable
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

import urllib3
from growthbook import GrowthBook
from growthbook.common_types import Experiment, FeatureResult, Result
from sqlalchemy.dialects.postgresql import insert

from couchers import metrics
from couchers.config import config
from couchers.db import session_scope
from couchers.models.logging import ExperimentExposure, ExposureSource, FeatureUsage

logger = logging.getLogger(__name__)

_REFRESH_INTERVAL_SECONDS = 60
_HTTP_CONNECT_TIMEOUT_SECONDS = 1
_HTTP_READ_TIMEOUT_SECONDS = 2

_initialized = False
_state: dict[str, Any] = {"features": {}, "savedGroups": {}}
_state_lock = threading.Lock()
_refresh_stop = threading.Event()
_refresh_thread: threading.Thread | None = None
# Unix time of the last successful pull from GrowthBook (None until the first success). Set when we
# load from the API or seed from the disk cache; drives the staleness metric.
_last_fetch_time: float | None = None

# Flag values loaded from FEATURE_FLAGS_LOCAL_FILE_PATH when FEATURE_FLAGS_USE_LOCAL_FILE is on.
# Missing keys fall through to the in-code default; this dict is the entire source of flag values
# in local-file mode.
_local_flags: dict[str, Any] = {}


class ExperimentationNotInitializedError(Exception):
    """Raised when experimentation functions are called before initialization."""


class GrowthBookUnavailableError(Exception):
    """Raised at startup when features can't be fetched and there's no usable disk cache to fall back on."""


def _fetch_features() -> dict[str, Any] | None:
    """Fetch the GrowthBook feature payload over HTTP. Returns None on failure."""
    api_host = config["GROWTHBOOK_API_HOST"].rstrip("/")
    client_key = config["GROWTHBOOK_CLIENT_KEY"]
    url = f"{api_host}/api/features/{client_key}"
    try:
        http = urllib3.PoolManager(
            timeout=urllib3.Timeout(connect=_HTTP_CONNECT_TIMEOUT_SECONDS, read=_HTTP_READ_TIMEOUT_SECONDS)
        )
        r = http.request("GET", url, headers={"Accept-Encoding": "gzip, deflate"})
        if r.status >= 400:
            logger.warning("GrowthBook fetch returned status %d", r.status)
            return None
        return json.loads(r.data.decode("utf-8"))  # type: ignore[no-any-return]
    except Exception:
        logger.exception("GrowthBook fetch failed")
        return None


def _apply_response(response: dict[str, Any]) -> None:
    """Atomically replace the current snapshot with a freshly fetched response."""
    with _state_lock:
        _state["features"] = response.get("features", {})
        _state["savedGroups"] = response.get("savedGroups", {})


def _set_last_fetch_time(when: float) -> None:
    global _last_fetch_time
    _last_fetch_time = when


def seconds_since_last_fetch() -> float | None:
    """Seconds since the last successful pull, or None if never pulled. Drives the staleness metric."""
    when = _last_fetch_time
    if when is None:
        return None
    return max(0.0, time.time() - when)


def _write_cache(response: dict[str, Any]) -> None:
    path = Path(config["GROWTHBOOK_CACHE_PATH"])
    data = json.dumps({"fetched_at": time.time(), "response": response})
    # Temp file alongside the target then rename: rename is atomic within a filesystem, so a reader
    # never sees a half-written cache.
    with NamedTemporaryFile("w", dir=path.parent, prefix=".growthbook-cache-", suffix=".tmp", delete=False) as f:
        f.write(data)
        tmp = Path(f.name)
    tmp.replace(path)


def _read_cache() -> tuple[dict[str, Any], float] | None:
    """(response, fetched_at), or None if no cache file exists yet. A corrupt file raises."""
    path = Path(config["GROWTHBOOK_CACHE_PATH"])
    if not path.exists():
        return None
    payload = json.loads(path.read_text())
    return payload["response"], payload["fetched_at"]


def _refresh_loop() -> None:
    while not _refresh_stop.wait(_REFRESH_INTERVAL_SECONDS):
        response = _fetch_features()
        if response is not None:
            _apply_response(response)
            _write_cache(response)
            _set_last_fetch_time(time.time())
            logger.debug("GrowthBook features refreshed")
        # On a failed fetch, keep last-known-good state and retry next tick; the staleness metric climbs.


def _load_local_flags() -> None:
    """Load flag values from FEATURE_FLAGS_LOCAL_FILE_PATH into the in-memory snapshot."""
    global _local_flags
    path_str = config["FEATURE_FLAGS_LOCAL_FILE_PATH"]
    if not path_str:
        raise ValueError("FEATURE_FLAGS_USE_LOCAL_FILE is on but FEATURE_FLAGS_LOCAL_FILE_PATH is empty")
    loaded = json.loads(Path(path_str).read_text())
    if not isinstance(loaded, dict):
        raise ValueError(f"Feature flag local file {path_str} must contain a JSON object")
    _local_flags = loaded
    logger.info("Loaded %d feature flag(s) from local file %s", len(_local_flags), path_str)


def setup_experimentation() -> None:
    """
    Initialize the feature flag framework.

    Safe to call multiple times - subsequent calls are no-ops. In GrowthBook mode this fetches the
    feature payload once synchronously, then starts a background thread that refreshes every minute;
    request threads only ever read the in-memory snapshot. In local-file mode it loads the JSON file
    once. When feature flags are disabled, evaluations short-circuit to in-code defaults.
    """
    global _initialized, _refresh_thread

    if _initialized:
        return

    if not config["FEATURE_FLAGS_ENABLED"]:
        logger.info("Feature flags disabled, all evaluations return in-code defaults")
        _initialized = True
        return

    if config["FEATURE_FLAGS_USE_LOCAL_FILE"]:
        _load_local_flags()
        _initialized = True
        return

    logger.info("Initializing experimentation framework")

    response = _fetch_features()
    if response is not None:
        _apply_response(response)
        _write_cache(response)
        _set_last_fetch_time(time.time())
        logger.info("GrowthBook features loaded from API")
    else:
        # Unreachable at startup: fall back to the disk cache rather than booting on in-code defaults.
        cached = _read_cache()
        if cached is None:
            raise GrowthBookUnavailableError(
                "Could not fetch features from GrowthBook and no disk cache is available - refusing to "
                "start on in-code feature-flag defaults"
            )
        cached_response, fetched_at = cached
        _apply_response(cached_response)
        _set_last_fetch_time(fetched_at)
        logger.warning(
            "GrowthBook unavailable at startup; loaded features from disk cache (%.0fs old)",
            max(0.0, time.time() - fetched_at),
        )

    with _state_lock:
        smoke_gb = GrowthBook(features=_state["features"], savedGroups=_state["savedGroups"])
    test_gate_result = smoke_gb.is_on("test_growthbook_integration")

    _refresh_stop.clear()
    _refresh_thread = threading.Thread(target=_refresh_loop, name="growthbook-refresh", daemon=True)
    _refresh_thread.start()

    _initialized = True
    logger.info(f"Experimentation integration test: gate 'test_growthbook_integration' = {test_gate_result}")


def _record_exposure(user_id: int, experiment: Experiment, result: Result, **_: Any) -> None:
    data = {
        "experiment_name": experiment.name,
        "variation_key": result.key,
        "variation_name": result.name,
        "hash_attribute": result.hashAttribute,
        "hash_value": result.hashValue,
        "bucket": result.bucket,
        "in_experiment": result.inExperiment,
        "hash_used": result.hashUsed,
        "sticky_bucket_used": result.stickyBucketUsed,
        "feature_id": result.featureId,
    }
    stmt = (
        insert(ExperimentExposure)
        .values(
            user_id=user_id,
            experiment_key=experiment.key,
            variation_id=result.variationId,
            source=ExposureSource.backend,
            data=data,
        )
        .on_conflict_do_nothing(constraint="uq_experiment_exposures_user_exp_var")
    )
    with session_scope() as session:
        session.execute(stmt)


def _record_feature_usage(user_id: int, key: str, result: FeatureResult, **_: Any) -> None:
    with session_scope() as session:
        session.add(FeatureUsage(user_id=user_id, feature_key=key, value=result.value))


def _create_evaluator(user_id: int | None) -> GrowthBook:
    """
    Build a per-request GrowthBook evaluator over the current feature snapshot.

    Pass user_id=None for an anonymous (logged-out) evaluation: with no `id` attribute GrowthBook
    can't bucket the user, so experiments and percentage rollouts are skipped and flags fall
    through to their defaults. No exposure or usage is recorded without a user.

    Reads the in-memory snapshot maintained by the background refresh thread - never does HTTP
    from the request path. Constructing without `client_key` keeps the GrowthBook a pure
    evaluator: no callback registration on the library's process-wide singleton. The caller is
    responsible for caching this for the lifetime of a request.
    """
    if not _initialized:
        raise ExperimentationNotInitializedError(
            "Experimentation is not initialized - call setup_experimentation() first"
        )
    with _state_lock:
        features = _state["features"]
        saved_groups = _state["savedGroups"]

    def on_experiment_viewed(experiment: Experiment, result: Result, **kwargs: Any) -> None:
        if user_id is not None:
            _record_exposure(user_id, experiment, result)

    def on_feature_usage(key: str, result: FeatureResult, *args: Any, **kwargs: Any) -> None:
        if user_id is not None:
            _record_feature_usage(user_id, key, result)

    return GrowthBook(
        attributes={"id": str(user_id)} if user_id is not None else {},
        features=features,
        savedGroups=saved_groups,
        on_experiment_viewed=on_experiment_viewed,
        on_feature_usage=on_feature_usage,
    )


def _global_evaluator() -> GrowthBook:
    """Build an anonymous evaluator for flag evaluation with no user/request context."""
    return _create_evaluator(None)


# Single home of the gating logic, shared by the global functions below and by CouchersContext (which
# passes its own cached per-request evaluator). get_evaluator is only invoked on the GrowthBook path,
# so it stays lazy in the disabled and local-file paths.
def _feature_value[T](flag_key: str, default: T, get_evaluator: Callable[[], GrowthBook]) -> T:
    if not config["FEATURE_FLAGS_ENABLED"]:
        return default
    if config["FEATURE_FLAGS_USE_LOCAL_FILE"]:
        if flag_key in _local_flags:
            value = _local_flags[flag_key]
            metrics.observe_feature_flag_evaluation(flag_key, "local_file", value)
            return value  # type: ignore[no-any-return]
        metrics.observe_feature_flag_evaluation(flag_key, "local_file_missing", default)
        return default
    result = get_evaluator().eval_feature(flag_key)
    value = default if result.value is None else result.value
    metrics.observe_feature_flag_evaluation(flag_key, result.source, value)
    return value


# Global (no-user) flag evaluation. Use these ONLY when there is genuinely no user to evaluate for and
# no way to thread one through - per-user evaluation is impossible here, not merely that you don't
# expect the value to vary per user. If a user is (or could reasonably be) available, use the
# CouchersContext methods instead: only the per-user path does percentage rollouts, experiments, and
# feature-usage tracking. With no user to bucket, rollouts and experiments are skipped and flags fall
# through to their in-code defaults unless a rule forces a value globally.
def get_global_boolean_value(flag_key: str, default: bool) -> bool:
    return _feature_value(flag_key, default, _global_evaluator)


def get_global_string_value(flag_key: str, default: str) -> str:
    return _feature_value(flag_key, default, _global_evaluator)


def get_global_integer_value(flag_key: str, default: int) -> int:
    return _feature_value(flag_key, default, _global_evaluator)


def get_global_float_value(flag_key: str, default: float) -> float:
    return _feature_value(flag_key, default, _global_evaluator)


def get_global_object_value[T](flag_key: str, default: T) -> T:
    return _feature_value(flag_key, default, _global_evaluator)
