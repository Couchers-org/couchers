"""
Experimentation framework for feature flags and experiments.

Uses GrowthBook under the hood, but abstracts the implementation details.
"""

import logging
from typing import TYPE_CHECKING

from growthbook import GrowthBook

from couchers.config import config

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

    gb = GrowthBook(
        api_host=config["GROWTHBOOK_API_HOST"],
        client_key=config["GROWTHBOOK_CLIENT_KEY"],
    )
    gb.load_features()
    test_gate_result = gb.is_on("test_growthbook_integration")
    gb.destroy()

    _initialized = True
    logger.info(f"Experimentation integration test: gate 'test_growthbook_integration' = {test_gate_result}")


def _check_initialized() -> None:
    if config["EXPERIMENTATION_ENABLED"] and not _initialized:
        raise ExperimentationNotInitializedError(
            "Experimentation is not initialized - call setup_experimentation() first"
        )


def _get_growthbook(context: CouchersContext) -> GrowthBook:
    """
    Get or create a cached GrowthBook instance for the given context.

    Features come from the shared feature_repo cache, so load_features() is cheap.
    """
    if not hasattr(context, "_growthbook"):
        gb = GrowthBook(
            api_host=config["GROWTHBOOK_API_HOST"],
            client_key=config["GROWTHBOOK_CLIENT_KEY"],
            attributes={"id": str(context.user_id)},
        )
        gb.load_features()
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
