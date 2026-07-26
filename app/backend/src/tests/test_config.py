import typing

import pytest

from couchers.config import Config
from couchers.constants import DB_POOL_SIZE


def _complete_config(dev: bool) -> Config:
    """Build a config object attribute populated with a valid, truthy value.

    This mirrors what Config.load_from_env() produces when every env var is set,
    so Config.check() should succeed against it.
    """
    cfg = Config()
    for var_name, var_type in Config.__annotations__.items():
        if var_type is bool:
            setattr(cfg, var_name, True)
        elif var_type is int:
            setattr(cfg, var_name, 1)
        elif var_type is bytes:
            setattr(cfg, var_name, b"x")
        elif typing.get_origin(var_type) is typing.Literal:  # type: ignore[comparison-overlap]
            setattr(cfg, var_name, typing.get_args(var_type)[0])
        else:
            setattr(cfg, var_name, "x")

    cfg.DEV = dev
    if not dev:
        # production invariants that aren't satisfiable by a generic truthy value
        cfg.BASE_URL = "https://example.com"
        cfg.ENABLE_EMAIL = True
        cfg.IN_TEST = False
        cfg.FEATURE_FLAGS_FILE_OVERRIDE_PATH = ""
    return cfg


def test_load_from_env() -> None:
    cfg = Config()
    assert not hasattr(cfg, "BASE_URL")
    cfg.load_from_env({"BASE_URL": "https://example.com"})
    assert cfg.BASE_URL == "https://example.com"


def test_load_from_env_types() -> None:
    cfg = Config()

    cfg.load_from_env({"IN_TEST": "1"})
    assert cfg.IN_TEST is True
    with pytest.raises(ValueError):
        cfg.load_from_env({"IN_TEST": "not a bool"})

    cfg.load_from_env({"BACKGROUND_WORKER_PROCESSES": "42"})
    assert cfg.BACKGROUND_WORKER_PROCESSES == 42
    with pytest.raises(ValueError):
        cfg.load_from_env({"BACKGROUND_WORKER_PROCESSES": "not an int"})

    cfg.load_from_env({"SECRET": bytes.hex(b"abc")})
    assert cfg.SECRET == b"abc"
    with pytest.raises(ValueError):
        cfg.load_from_env({"SECRET": "not hex"})

    cfg.load_from_env({"ROLE": "worker"})
    assert cfg.ROLE == "worker"
    with pytest.raises(ValueError):
        cfg.load_from_env({"ROLE": "not a valid role"})


def test_getitem() -> None:
    cfg = Config()
    cfg.BASE_URL = "https://example.com"
    assert cfg.BASE_URL == "https://example.com"
    assert cfg["BASE_URL"] == "https://example.com"


def test_setitem() -> None:
    cfg = Config()

    cfg["BASE_URL"] = "https://example.com"
    assert cfg.BASE_URL == "https://example.com"
    assert cfg["BASE_URL"] == "https://example.com"

    with pytest.raises(KeyError):
        cfg["NOT_A_KEY"] = "value"

    with pytest.raises(TypeError):
        cfg["BASE_URL"] = 123


def test_instances_state_are_independent() -> None:
    # Default values are declared at the class level, but should be copied to each instance.
    assert Config.IN_TEST is False

    cfg1 = Config()
    cfg2 = Config()

    assert cfg1.IN_TEST is False
    assert cfg2.IN_TEST is False

    cfg1.IN_TEST = True

    assert cfg1.IN_TEST is True
    assert cfg2.IN_TEST is False


def test_copy() -> None:
    cfg = Config()

    cfg.BACKGROUND_WORKER_PROCESSES = 1
    copy1 = cfg.copy()
    cfg.BACKGROUND_WORKER_PROCESSES = 2
    copy2 = cfg.copy()

    assert copy1.BACKGROUND_WORKER_PROCESSES == 1
    assert copy2.BACKGROUND_WORKER_PROCESSES == 2


@pytest.mark.parametrize("dev", [True, False])
def test_check_config_only_references_known_keys(dev):
    """Config.check() must only access config keys that are declared as attributes.

    A reference to a key that was removed from attributes (e.g. a toggle migrated to a feature
    flag) would raise KeyError at app boot but is invisible to the rest of the test suite, since
    Config.check() only runs in app.py's startup path. Exercising it here catches that.
    """
    _complete_config(dev=dev).check()


def test_check_rejects_too_many_worker_threads() -> None:
    cfg = _complete_config(dev=True)
    cfg.BACKGROUND_WORKER_THREADS_PER_PROCESS = DB_POOL_SIZE // 2
    cfg.check()

    cfg.BACKGROUND_WORKER_THREADS_PER_PROCESS = DB_POOL_SIZE // 2 + 1
    with pytest.raises(Exception, match="BACKGROUND_WORKER_THREADS_PER_PROCESS"):
        cfg.check()


@pytest.mark.parametrize("option", ["BACKGROUND_WORKER_PROCESSES", "BACKGROUND_WORKER_THREADS_PER_PROCESS"])
def test_check_rejects_no_workers(option) -> None:
    cfg = _complete_config(dev=True)
    cfg[option] = 0
    with pytest.raises(Exception, match=option):
        cfg.check()
