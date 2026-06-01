import typing

import pytest

from couchers.config import Config


def _complete_config(dev: bool) -> Config:
    """Build a config object attribute populated with a valid, truthy value.

    This mirrors what Config.load_from_env() produces when every env var is set,
    so Config.check() should succeed against it.
    """
    cfg = Config()
    for attr_name, attr_type in Config.__annotations__.items():
        if attr_type is bool:
            setattr(cfg, attr_name, True)
        elif attr_type is int:
            setattr(cfg, attr_name, 1)
        elif attr_type is bytes:
            setattr(cfg, attr_name, b"x")
        elif typing.get_origin(attr_type) is typing.Literal:
            setattr(cfg, attr_name, typing.get_args(attr_type)[0])
        else:
            setattr(cfg, attr_name, "x")

    cfg.dev = dev
    if not dev:
        # production invariants that aren't satisfiable by a generic truthy value
        cfg.base_url = "https://example.com"
        cfg.enable_email = True
        cfg.in_test = False
    return cfg


def test_load_from_env() -> None:
    cfg = Config()
    assert not hasattr(cfg, "base_url")
    cfg.load_from_env({"BASE_URL": "https://example.com"})
    assert cfg.base_url == "https://example.com"


def test_load_from_env_types() -> None:
    cfg = Config()

    cfg.load_from_env({"IN_TEST": "1"})
    assert cfg.in_test is True
    with pytest.raises(ValueError):
        cfg.load_from_env({"IN_TEST": "not a bool"})

    cfg.load_from_env({"BACKGROUND_WORKER_COUNT": "42"})
    assert cfg.background_worker_count == 42
    with pytest.raises(ValueError):
        cfg.load_from_env({"BACKGROUND_WORKER_COUNT": "not an int"})

    cfg.load_from_env({"SECRET": bytes.hex(b"abc")})
    assert cfg.secret == b"abc"
    with pytest.raises(ValueError):
        cfg.load_from_env({"SECRET": "not hex"})

    cfg.load_from_env({"ROLE": "worker"})
    assert cfg.role == "worker"
    with pytest.raises(ValueError):
        cfg.load_from_env({"ROLE": "not a valid role"})


def test_indexer_access() -> None:
    cfg = Config()
    cfg.base_url = "https://example.com"
    assert cfg.base_url == "https://example.com"
    assert cfg["BASE_URL"] == "https://example.com"


def test_instances_state_are_independent() -> None:
    """"""
    # Default values are declared at the class level, but should be copied to each instance.
    assert Config.in_test is False

    cfg1 = Config()
    cfg2 = Config()

    assert cfg1.in_test is False
    assert cfg2.in_test is False

    cfg1.in_test = True

    assert cfg1.in_test is True
    assert cfg2.in_test is False


def test_copy() -> None:
    cfg = Config()

    cfg.background_worker_count = 1
    copy1 = cfg.copy()
    cfg.background_worker_count = 2
    copy2 = cfg.copy()

    assert copy1.background_worker_count == 1
    assert copy2.background_worker_count == 2


@pytest.mark.parametrize("dev", [True, False])
def test_check_config_only_references_known_keys(dev):
    """Config.check() must only access config keys that are declared as attributes.

    A reference to a key that was removed from attributes (e.g. a toggle migrated to a feature
    flag) would raise KeyError at app boot but is invisible to the rest of the test suite, since
    Config.check() only runs in app.py's startup path. Exercising it here catches that.
    """
    _complete_config(dev=dev).check()
