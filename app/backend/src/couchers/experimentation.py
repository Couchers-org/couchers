"""
Experimentation framework for feature flags and experiments.

Uses Statsig under the hood, but abstracts the implementation details.

IMPORTANT - FORKING SAFETY:
The underlying SDK uses internal threading and async runtime components that
do NOT work correctly when copied across process boundaries during fork().
Initializing before forking will cause deadlocks and unpredictable behavior.

This module provides fork-safe initialization:
- Call `setup_experimentation()` ONLY in child processes AFTER forking
- Call `setup_experimentation()` in the main process ONLY AFTER all child processes have been spawned
- NEVER call setup_experimentation() at module load time

The Couchers backend uses multiprocessing.Process for background workers, which forks.
The initialization flow is:
1. app.py starts, spawns worker processes via multiprocessing.Process (fork happens)
2. Each worker process calls `_run_forever()` which calls `setup_experimentation()` post-fork
3. The main process (API server) calls `setup_experimentation()` after spawning workers
"""

import atexit
import logging
from typing import TYPE_CHECKING

from statsig_python_core import Statsig, StatsigOptions, StatsigUser

from couchers.config import Config

if TYPE_CHECKING:
    from couchers.context import CouchersContext

logger = logging.getLogger(__name__)

# Track whether we've initialized in this process to prevent double-initialization
_initialized = False


class ExperimentationNotInitializedError(Exception):
    """Raised when experimentation functions are called before initialization."""


def setup_experimentation() -> None:
    """
    Initialize the experimentation framework. Must be called AFTER process forking.

    This function is safe to call multiple times - subsequent calls will be no-ops.

    Call this:
    - In worker processes: inside _run_forever() after db_post_fork()
    - In main process: after spawning all worker processes

    IMPORTANT: Importing this module is safe before forking. Only calling this
    function (which initializes internal threads) must happen after forking.
    """
    global _initialized

    if _initialized:
        logger.debug("Experimentation already initialized in this process, skipping")
        return

    if not Config.current.experimentation_enabled:
        logger.info("Experimentation is disabled, skipping initialization")
        _initialized = True
        return

    logger.info("Initializing experimentation framework")

    options = StatsigOptions()
    options.environment = Config.current.statsig_environment

    # Create the shared instance for global access
    statsig = Statsig.new_shared(Config.current.statsig_server_secret_key, options)

    # initialize() starts internal threads - this MUST happen after forking
    statsig.initialize().wait()

    _initialized = True
    logger.info("Experimentation framework initialized successfully")

    # Verify the integration works by checking a test gate
    test_user = StatsigUser(user_id="integration_test")
    test_gate_result = statsig.check_gate(test_user, "test_statsig_integration")
    logger.info(f"Experimentation integration test: gate 'test_statsig_integration' = {test_gate_result}")

    atexit.register(_shutdown_experimentation)


def _shutdown_experimentation() -> None:
    """
    Shutdown the experimentation framework, flushing any pending events.
    Called automatically via atexit when the process exits.
    """
    if not Config.current.experimentation_enabled:
        return

    if Statsig.has_shared_instance():
        logger.info("Shutting down experimentation framework")
        Statsig.shared().shutdown().wait()
        Statsig.remove_shared()


def _check_initialized() -> None:
    """
    Check that experimentation is initialized if enabled.

    Raises:
        ExperimentationNotInitializedError: If experimentation is enabled but not initialized.
    """
    if Config.current.experimentation_enabled and not _initialized:
        raise ExperimentationNotInitializedError(
            "Experimentation is not initialized - call setup_experimentation() first"
        )


def _get_statsig_user(context: CouchersContext) -> StatsigUser:
    """
    Get or create a cached StatsigUser for the given context.

    The StatsigUser is cached on the context to avoid recreating it for each call.
    """
    if not hasattr(context, "_statsig_user"):
        context._statsig_user = StatsigUser(user_id=str(context.user_id))  # type: ignore[attr-defined]
    return context._statsig_user  # type: ignore[attr-defined, no-any-return]


def check_gate(context: CouchersContext, gate_name: str) -> bool:
    """
    Check if a feature gate is enabled for the user in this context.

    Args:
        context: The CouchersContext for the current request
        gate_name: The name of the feature gate

    Returns:
        True if the gate is enabled for this user, False otherwise.
        Returns False if experimentation is disabled.
        Returns True if EXPERIMENTATION_PASS_ALL_GATES is enabled.

    Raises:
        ExperimentationNotInitializedError: If experimentation is enabled but not initialized.
    """
    _check_initialized()
    if Config.current.experimentation_pass_all_gates:
        return True
    if not Config.current.experimentation_enabled:
        return False
    return Statsig.shared().check_gate(_get_statsig_user(context), gate_name)


def get_experiment(context: CouchersContext, experiment_name: str) -> dict[str, object]:
    """
    Get experiment configuration for the user in this context.

    Args:
        context: The CouchersContext for the current request
        experiment_name: The name of the experiment

    Returns:
        A dictionary with experiment values.
        Returns empty dict if experimentation is disabled.

    Raises:
        ExperimentationNotInitializedError: If experimentation is enabled but not initialized.
    """
    _check_initialized()
    if not Config.current.experimentation_enabled:
        return {}
    # TODO: remove type: ignore when upstream fixes types, see https://github.com/statsig-io/statsig-server-core/issues/36
    experiment = Statsig.shared().get_experiment(_get_statsig_user(context), experiment_name)  # type: ignore[attr-defined]
    return experiment.value if experiment else {}


def get_dynamic_config(context: CouchersContext, config_name: str) -> dict[str, object]:
    """
    Get dynamic config for the user in this context.

    Args:
        context: The CouchersContext for the current request
        config_name: The name of the dynamic config

    Returns:
        A dictionary with config values.
        Returns empty dict if experimentation is disabled.

    Raises:
        ExperimentationNotInitializedError: If experimentation is enabled but not initialized.
    """
    _check_initialized()
    if not Config.current.experimentation_enabled:
        return {}
    # TODO: remove type: ignore when upstream fixes types, see https://github.com/statsig-io/statsig-server-core/issues/36
    dynamic_config = Statsig.shared().get_dynamic_config(_get_statsig_user(context), config_name)  # type: ignore[attr-defined]
    return dynamic_config.value if dynamic_config else {}


def log_event(
    context: CouchersContext,
    event_name: str,
    value: str | float | None = None,
    metadata: dict[str, str] | None = None,
) -> None:
    """
    Log a custom event for analytics.

    Args:
        context: The CouchersContext for the current request
        event_name: Name of the event
        value: Optional value associated with the event
        metadata: Optional metadata dictionary

    Raises:
        ExperimentationNotInitializedError: If experimentation is enabled but not initialized.
    """
    _check_initialized()
    if not Config.current.experimentation_enabled:
        return
    Statsig.shared().log_event(
        user=_get_statsig_user(context),
        event_name=event_name,
        value=value,
        metadata=metadata,
    )
