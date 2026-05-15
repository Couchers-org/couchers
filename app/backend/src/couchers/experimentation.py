"""
Experimentation framework for feature flags and experiments.

Uses GrowthBook under the hood, but abstracts the implementation details.
"""

import hashlib
import json
import logging
from typing import TYPE_CHECKING, Any

from growthbook import GrowthBook, feature_repo
from growthbook.common_types import Experiment, Result
from sqlalchemy.dialects.postgresql import insert

from couchers.config import config
from couchers.db import session_scope
from couchers.models.logging import ExperimentExposure

if TYPE_CHECKING:
    from couchers.context import CouchersContext

logger = logging.getLogger(__name__)

_initialized = False


class ExperimentationNotInitializedError(Exception):
    """Raised when experimentation functions are called before initialization."""


def setup_experimentation() -> None:
    """
    Initialize the experimentation framework.

    Safe to call multiple times - subsequent calls are no-ops. Pre-warms the
    shared feature_repo cache so the first request doesn't pay the API fetch.
    """
    global _initialized

    if _initialized:
        return

    if not config["EXPERIMENTATION_ENABLED"]:
        logger.info("Experimentation is disabled, skipping initialization")
        _initialized = True
        return

    logger.info("Initializing experimentation framework")

    # These settings get baked into feature_repo's PoolManager on first HTTP
    # call, so configure them before any fetches happen.
    feature_repo.http_connect_timeout = 1
    feature_repo.http_read_timeout = 2

    response = feature_repo.load_features(config["GROWTHBOOK_API_HOST"], config["GROWTHBOOK_CLIENT_KEY"])
    features = response.get("features", {}) if response else {}
    saved_groups = response.get("savedGroups", {}) if response else {}

    smoke_gb = GrowthBook(features=features, savedGroups=saved_groups)
    test_gate_result = smoke_gb.is_on("test_growthbook_integration")

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
    # Fingerprint covers the assignment-relevant fields. Display-only fields
    # (experiment_name, variation_name) are excluded so renames don't create
    # spurious new rows.
    fingerprint_payload = {
        "variation_id": result.variationId,
        "variation_key": result.key,
        "hash_attribute": result.hashAttribute,
        "hash_value": result.hashValue,
        "bucket": result.bucket,
        "in_experiment": result.inExperiment,
        "hash_used": result.hashUsed,
        "sticky_bucket_used": result.stickyBucketUsed,
        "feature_id": result.featureId,
    }
    fingerprint = hashlib.sha256(
        json.dumps(fingerprint_payload, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    stmt = (
        insert(ExperimentExposure)
        .values(
            user_id=user_id,
            experiment_key=experiment.key,
            variation_id=result.variationId,
            fingerprint=fingerprint,
            data=data,
        )
        .on_conflict_do_nothing(constraint="uq_experiment_exposures_user_exp_fp")
    )
    with session_scope() as session:
        session.execute(stmt)


def _get_growthbook(context: CouchersContext) -> GrowthBook:
    """
    Get or create a cached GrowthBook instance for the given context.

    Features are fetched via the process-wide feature_repo cache (one HTTP
    fetch per cache TTL, shared across all users) and handed to the per-request
    instance directly. We deliberately construct without `client_key` so
    GrowthBook.__init__ doesn't register a bound callback on feature_repo's
    callback list - those callbacks would pin every per-request instance for
    the lifetime of the worker.
    """
    if not hasattr(context, "_growthbook"):
        response = feature_repo.load_features(config["GROWTHBOOK_API_HOST"], config["GROWTHBOOK_CLIENT_KEY"])
        features = response.get("features", {}) if response else {}
        saved_groups = response.get("savedGroups", {}) if response else {}

        user_id = context.user_id

        def on_experiment_viewed(experiment: Experiment, result: Result, **kwargs: Any) -> None:
            _record_exposure(user_id, experiment, result)

        gb = GrowthBook(
            attributes={"id": str(user_id)},
            features=features,
            savedGroups=saved_groups,
            on_experiment_viewed=on_experiment_viewed,
        )
        context._growthbook = gb  # type: ignore[attr-defined]
    return context._growthbook  # type: ignore[attr-defined, no-any-return]


def check_gate(context: CouchersContext, gate_name: str) -> bool:
    """
    Check if a feature gate is enabled for the user in this context.

    Returns False if experimentation is disabled, True if EXPERIMENTATION_PASS_ALL_GATES is set.
    """
    _check_initialized()
    if config["EXPERIMENTATION_PASS_ALL_GATES"]:
        return True
    if not config["EXPERIMENTATION_ENABLED"]:
        return False
    return _get_growthbook(context).is_on(gate_name)


def get_feature_value[T](context: CouchersContext, feature_name: str, default: T) -> T:
    """
    Get the value of a feature for the user in this context.

    Use this for non-boolean features: strings, numbers, dicts, experiment variations,
    dynamic configs - anything other than a simple on/off gate. The default's type
    determines the return type and is returned verbatim when experimentation is disabled.
    """
    _check_initialized()
    if not config["EXPERIMENTATION_ENABLED"]:
        return default
    return _get_growthbook(context).get_feature_value(feature_name, default)  # type: ignore[no-any-return]
