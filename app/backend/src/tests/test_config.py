from typing import Any

import pytest

from couchers.config import CONFIG_OPTIONS, check_config


def _complete_config(dev: bool) -> dict[str, Any]:
    """Build a config dict with every CONFIG_OPTIONS key populated with a valid, truthy value.

    This mirrors what make_config() produces when every env var is set, so check_config() must be
    able to run against it without touching any key outside CONFIG_OPTIONS.
    """
    cfg: dict[str, Any] = {}
    for name, type_, *_ in CONFIG_OPTIONS:
        if type_ is bool:
            cfg[name] = True
        elif type_ is int:
            cfg[name] = 1
        elif type_ is bytes:
            cfg[name] = b"x"
        elif isinstance(type_, list):
            cfg[name] = type_[0]
        else:
            cfg[name] = "x"

    cfg["DEV"] = dev
    if not dev:
        # production invariants that aren't satisfiable by a generic truthy value
        cfg["BASE_URL"] = "https://example.com"
        cfg["ENABLE_EMAIL"] = True
        cfg["IN_TEST"] = False
    return cfg


@pytest.mark.parametrize("dev", [True, False])
def test_check_config_only_references_known_keys(dev):
    """check_config() must only access config keys that are declared in CONFIG_OPTIONS.

    A reference to a key that was removed from CONFIG_OPTIONS (e.g. a toggle migrated to a feature
    flag) would raise KeyError at app boot but is invisible to the rest of the test suite, since
    check_config() only runs in app.py's startup path. Exercising it here catches that.
    """
    check_config(_complete_config(dev=dev))
