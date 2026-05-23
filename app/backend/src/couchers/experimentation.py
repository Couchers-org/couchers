"""
Experimentation framework for feature flags and experiments.

Uses GrowthBook under the hood, but abstracts the implementation details.

Two ways to evaluate a flag:
  - Per-user/request: use the CouchersContext methods (context.get_boolean_value, get_string_value,
    etc.), which evaluate for the context's user and own the per-request evaluator cache.
  - Global (no user/request): use the module-level get_boolean_value / get_string_value / ... below.
    These evaluate anonymously and are for background jobs and other code with no CouchersContext.

Both paths share the enabled / pass-all-gates gating helpers here. setup_experimentation() is called
once at process startup.
"""

import json
import logging
import threading
from collections.abc import Callable
from typing import Any

import urllib3
from growthbook import GrowthBook
from growthbook.common_types import Experiment, FeatureResult, Result
from sqlalchemy.dialects.postgresql import insert

from couchers.config import config
from couchers.db import session_scope
from couchers.models.logging import ExperimentExposure, FeatureUsage

logger = logging.getLogger(__name__)

_REFRESH_INTERVAL_SECONDS = 60
_HTTP_CONNECT_TIMEOUT_SECONDS = 1
_HTTP_READ_TIMEOUT_SECONDS = 2

_initialized = False
_state: dict[str, Any] = {"features": {}, "savedGroups": {}}
_state_lock = threading.Lock()
_refresh_stop = threading.Event()
_refresh_thread: threading.Thread | None = None


class ExperimentationNotInitializedError(Exception):
    """Raised when experimentation functions are called before initialization."""


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


def _refresh_loop() -> None:
    while not _refresh_stop.wait(_REFRESH_INTERVAL_SECONDS):
        response = _fetch_features()
        if response is not None:
            _apply_response(response)
            logger.debug("GrowthBook features refreshed")
        # On failure, keep last-known-good state and try again next tick.


def setup_experimentation() -> None:
    """
    Initialize the experimentation framework.

    Safe to call multiple times - subsequent calls are no-ops. Fetches the
    feature payload once synchronously, then starts a background thread that
    refreshes every minute. Request threads only ever read the in-memory
    snapshot - they never block on the GrowthBook CDN.
    """
    global _initialized, _refresh_thread

    if _initialized:
        return

    if not config["EXPERIMENTATION_ENABLED"]:
        logger.info("Experimentation is disabled, skipping initialization")
        _initialized = True
        return

    logger.info("Initializing experimentation framework")

    response = _fetch_features()
    if response is not None:
        _apply_response(response)

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


# These two helpers are the single home of the gating logic, shared by the global functions below
# and by CouchersContext (which passes its own cached per-request evaluator). get_evaluator is only
# invoked once gating passes, so it stays lazy.
def _feature_value[T](flag_key: str, default: T, get_evaluator: Callable[[], GrowthBook]) -> T:
    if not config["EXPERIMENTATION_ENABLED"]:
        return default
    return get_evaluator().get_feature_value(flag_key, default)  # type: ignore[no-any-return]


def _boolean_value(flag_key: str, default: bool, get_evaluator: Callable[[], GrowthBook]) -> bool:
    if config["EXPERIMENTATION_PASS_ALL_GATES"]:
        return True
    return _feature_value(flag_key, default, get_evaluator)


# Global (no user/request) flag evaluation. Mirrors the CouchersContext.get_*_value API but
# evaluates anonymously: experiments and percentage rollouts are skipped (no user to bucket), so
# flags fall through to their in-code defaults unless a rule forces a value globally.
def get_boolean_value(flag_key: str, default: bool) -> bool:
    return _boolean_value(flag_key, default, _global_evaluator)


def get_string_value(flag_key: str, default: str) -> str:
    return _feature_value(flag_key, default, _global_evaluator)


def get_integer_value(flag_key: str, default: int) -> int:
    return _feature_value(flag_key, default, _global_evaluator)


def get_float_value(flag_key: str, default: float) -> float:
    return _feature_value(flag_key, default, _global_evaluator)


def get_object_value[T](flag_key: str, default: T) -> T:
    return _feature_value(flag_key, default, _global_evaluator)
