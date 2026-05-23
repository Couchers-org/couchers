"""
Experimentation framework for feature flags and experiments.

Uses GrowthBook under the hood, but abstracts the implementation details.
"""

import json
import logging
import threading
from typing import TYPE_CHECKING, Any

import urllib3
from growthbook import GrowthBook
from growthbook.common_types import Experiment, Result
from sqlalchemy.dialects.postgresql import insert

from couchers.config import config
from couchers.db import session_scope
from couchers.models.logging import ExperimentExposure

if TYPE_CHECKING:
    from couchers.context import CouchersContext

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


def _check_initialized() -> None:
    if config["EXPERIMENTATION_ENABLED"] and not _initialized:
        raise ExperimentationNotInitializedError(
            "Experimentation is not initialized - call setup_experimentation() first"
        )


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


def _get_growthbook(context: CouchersContext) -> GrowthBook:
    """
    Get or create a cached GrowthBook instance for the given context.

    Reads the in-memory feature snapshot maintained by the background refresh
    thread - never does HTTP from the request path. Constructing without
    `client_key` keeps the GrowthBook a pure evaluator: no callback
    registration on the library's process-wide singleton.
    """
    gb = context._growthbook
    if gb is None:
        with _state_lock:
            features = _state["features"]
            saved_groups = _state["savedGroups"]

        user_id = context.user_id

        def on_experiment_viewed(experiment: Experiment, result: Result, **kwargs: Any) -> None:
            _record_exposure(user_id, experiment, result)

        gb = GrowthBook(
            attributes={"id": str(user_id)},
            features=features,
            savedGroups=saved_groups,
            on_experiment_viewed=on_experiment_viewed,
        )
        context._growthbook = gb
    return gb


def evaluate_boolean(context: CouchersContext, flag_key: str, default: bool) -> bool:
    """
    Evaluate a boolean feature gate for the user in this context.

    Mirrors OpenFeature's get_boolean_value. Returns True if EXPERIMENTATION_PASS_ALL_GATES
    is set, the in-code default if experimentation is disabled or the flag isn't set up in
    GrowthBook, otherwise the gate's value. Goes through get_feature_value (not is_on) so the
    default is honored for not-yet-created flags.
    """
    _check_initialized()
    if config["EXPERIMENTATION_PASS_ALL_GATES"]:
        return True
    if not config["EXPERIMENTATION_ENABLED"]:
        return default
    return bool(_get_growthbook(context).get_feature_value(flag_key, default))


def evaluate_value[T](context: CouchersContext, flag_key: str, default: T) -> T:
    """
    Evaluate a non-boolean feature value for the user in this context.

    Mirrors OpenFeature's get_string_value/get_integer_value/get_float_value/get_object_value.
    The default's type determines the return type; it's returned verbatim when experimentation
    is disabled or the flag isn't set up in GrowthBook.
    """
    _check_initialized()
    if not config["EXPERIMENTATION_ENABLED"]:
        return default
    return _get_growthbook(context).get_feature_value(flag_key, default)  # type: ignore[no-any-return]
