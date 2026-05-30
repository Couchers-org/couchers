"""
Guards the multiprocess API server deployment config, which is spread across files that must agree:
the API worker ports live in couchers.constants but are repeated in proxy/envoy.yaml and the compose
files, and the per-process connection pools must stay under postgres max_connections.

These files live outside app/backend, so they're only present in a full repo checkout — the backend CI
image only ships app/backend, so the checks skip there. They run for anyone editing API_WORKER_COUNT
against the full repo (the case that actually drifts).
"""

import re
from pathlib import Path

import pytest
import yaml

from couchers.config import CONFIG_OPTIONS
from couchers.constants import API_BASE_PORT, API_WORKER_COUNT, MEDIA_PORT, SERVER_THREADS

APP_DIR = Path(__file__).resolve().parents[3]
ENVOY_YAML = APP_DIR / "proxy" / "envoy.yaml"
COMPOSE_PROD = APP_DIR / "docker-compose.prod.yml"
COMPOSE_DEV = APP_DIR / "docker-compose.yml"
POSTGRESQL_CONF = APP_DIR / "postgis" / "postgresql.conf"

EXPECTED_API_PORTS = list(range(API_BASE_PORT, API_BASE_PORT + API_WORKER_COUNT))

pytestmark = pytest.mark.skipif(
    not ENVOY_YAML.exists(), reason="deployment files (proxy/compose/postgis) not present outside a full repo checkout"
)


def _config_default(name: str) -> int:
    (opt,) = [o for o in CONFIG_OPTIONS if o[0] == name]
    assert len(opt) == 3, f"{name} has no default"
    default = opt[2]
    assert isinstance(default, int)
    return default


def test_envoy_endpoints_match_api_worker_ports():
    config = yaml.safe_load(ENVOY_YAML.read_text())
    (cluster,) = [c for c in config["static_resources"]["clusters"] if c["name"] == "couchers_service"]
    ports = [
        ep["endpoint"]["address"]["socket_address"]["port_value"]
        for lb in cluster["load_assignment"]["endpoints"]
        for ep in lb["lb_endpoints"]
    ]
    assert sorted(ports) == EXPECTED_API_PORTS


def test_compose_prod_exposes_api_worker_ports():
    config = yaml.safe_load(COMPOSE_PROD.read_text())
    exposed = [int(p) for p in config["services"]["backend"]["expose"]]
    assert sorted(p for p in exposed if p != MEDIA_PORT) == EXPECTED_API_PORTS
    assert MEDIA_PORT in exposed


def test_compose_dev_publishes_api_worker_ports():
    config = yaml.safe_load(COMPOSE_DEV.read_text())
    published: set[int] = set()
    for mapping in config["services"]["backend"]["ports"]:
        # mappings look like "1761-1764:1761-1764" or "1753:1753"
        container_side = str(mapping).split(":")[-1]
        if "-" in container_side:
            lo, hi = (int(x) for x in container_side.split("-"))
            published.update(range(lo, hi + 1))
        else:
            published.add(int(container_side))
    assert set(EXPECTED_API_PORTS) <= published


def test_connection_budget_fits_under_max_connections():
    match = re.search(r"^\s*max_connections\s*=\s*(\d+)", POSTGRESQL_CONF.read_text(), re.MULTILINE)
    assert match, "max_connections not found in postgresql.conf"
    max_connections = int(match.group(1))

    pool_size = 2 * SERVER_THREADS + 4
    # worst case for a single ROLE=all container: parent + scheduler + background workers + api workers,
    # each holding a full pool
    processes = 1 + 1 + _config_default("BACKGROUND_WORKER_COUNT") + API_WORKER_COUNT
    assert processes * pool_size <= max_connections
