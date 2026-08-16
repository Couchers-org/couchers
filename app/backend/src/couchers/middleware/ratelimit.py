"""
API rate limiting. See docs/rate-limit-design.md.

Limits are a pair of (scope, dimension). Scopes nest: per-RPC ⊂ per-servicer ⊂ all-API; a single request
increments a counter at every level. Dimensions are per-IP (keyed by subnet), per-user, and global. A
request is rejected if any applicable limit is exceeded.

This is independent of couchers.rate_limits, which is the per-user 24h action limiter.
"""

import logging
import time
from dataclasses import dataclass
from functools import cache
from ipaddress import ip_network
from typing import TYPE_CHECKING

import sentry_sdk
import valkey

from couchers.config import config
from couchers.constants import RATE_LIMIT_WINDOW_SECONDS
from couchers.experimentation import get_global_boolean_value
from couchers.metrics import (
    observe_rate_limit_check,
    observe_rate_limit_duration,
    observe_rate_limit_store_error,
    observe_rate_limit_trip,
)
from couchers.middleware.descriptor_pool import get_descriptor_pool
from couchers.middleware.proto_annotations import method_extension, optional_field, service_extension, split_method
from couchers.proto import annotations_pb2

if TYPE_CHECKING:
    from couchers.middleware.interceptors import CouchersHeaders, UserAuthInfo

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class ResolvedLimits:
    """The fully-resolved per-minute limits for one method, per scope and dimension."""

    service_name: str
    rpc: dict[str, int]
    svc: dict[str, int]
    api: dict[str, int]


@cache
def resolve_method_rate_limits(method: str) -> ResolvedLimits:
    """
    Resolve the limits for a method from its proto annotations, falling back to global defaults.

    per-RPC:      method rate_limit.<dim> → service rate_limit_default.<dim> → global rpc default
    per-servicer: service rate_limit_aggregate.<dim> → global svc default
    all-API:      global api default
    """
    dimensions = ("per_ip", "per_user", "global")
    defaults = {
        "rpc": {"per_ip": 60, "per_user": 120, "global": 6000},
        "svc": {"per_ip": 300, "per_user": 600, "global": 20000},
        "api": {"per_ip": 600, "per_user": 1200, "global": 60000},
    }

    def resolve(*values: int | None) -> int:
        # the last value is always a global default, so there is always one to find
        return next(value for value in values if value is not None)

    pool = get_descriptor_pool()
    service_name, _ = split_method(method)
    method_rl = method_extension(pool, method, annotations_pb2.rate_limit)
    service_default = service_extension(pool, service_name, annotations_pb2.rate_limit_default)
    service_aggregate = service_extension(pool, service_name, annotations_pb2.rate_limit_aggregate)

    return ResolvedLimits(
        service_name=service_name,
        rpc={
            dim: resolve(optional_field(method_rl, dim), optional_field(service_default, dim), defaults["rpc"][dim])
            for dim in dimensions
        },
        svc={dim: resolve(optional_field(service_aggregate, dim), defaults["svc"][dim]) for dim in dimensions},
        api=dict(defaults["api"]),
    )


def ip_to_key(ip: str, ipv6_prefix: int) -> str:
    """
    Mask an IP to its subnet and return a canonical string key.

    IPv4 is keyed at /32 (the exact address); IPv6 is masked to ipv6_prefix bits (default /64).
    """
    network = ip_network(ip, strict=False)
    prefix = 32 if network.version == 4 else ipv6_prefix
    return str(ip_network(f"{network.network_address}/{prefix}", strict=False))


_LUA_SCRIPT = """
local tripped = {}
local ttl = tonumber(ARGV[1])
for i, key in ipairs(KEYS) do
  local count = redis.call('INCR', key)
  if count == 1 then
    redis.call('EXPIRE', key, ttl)
  end
  if count > tonumber(ARGV[i + 1]) then
    tripped[#tripped + 1] = i
  end
end
return tripped
"""


class ValkeyCounterStore:
    def __init__(self, host: str, port: int) -> None:
        self._client = valkey.Valkey(
            host=host,
            port=port,
            socket_connect_timeout=0.1,
            socket_timeout=0.1,
        )
        self._script = self._client.register_script(_LUA_SCRIPT)

    def incr_and_check(self, entries: list[tuple[str, int]], ttl: int) -> list[int]:
        """Increment each key's counter; return the indices of entries whose count now exceeds its limit."""
        keys = [key for key, _ in entries]
        limits = [str(limit) for _, limit in entries]
        result = self._script(keys=keys, args=[str(ttl), *limits])
        # Lua returns 1-based indices.
        return [i - 1 for i in result]


@cache
def _get_store() -> ValkeyCounterStore | None:
    """The process-wide counter store, or None when no store is configured and rate limiting is off."""
    if not config.VALKEY_HOST:
        return None
    return ValkeyCounterStore(config.VALKEY_HOST, config.VALKEY_PORT)


def _build_entries(
    limits: ResolvedLimits, method: str, ip_address: str | None, user_id: int | None, bucket: int
) -> list[tuple[str, str, str, int]]:
    """The applicable (scope, dimension, key, limit) tuples for one request, across all scopes and dimensions."""
    dim_ids: dict[str, str | None] = {
        "per_ip": ip_to_key(ip_address, config.RATE_LIMIT_IPV6_PREFIX) if ip_address else None,
        "per_user": str(user_id) if user_id is not None else None,
        "global": "*",
    }
    scopes = (
        ("rpc", method, limits.rpc),
        ("svc", limits.service_name, limits.svc),
        ("api", "*", limits.api),
    )
    entries = []
    for scope, scope_id, scope_limits in scopes:
        for dim, limit in scope_limits.items():
            dim_id = dim_ids[dim]
            if dim_id is None:
                continue
            key = f"rl:{scope}:{scope_id}:{dim}:{dim_id}:{bucket}"
            entries.append((scope, dim, key, limit))
    return entries


def should_rate_limit(method: str, headers: CouchersHeaders, auth_info: UserAuthInfo | None) -> bool:
    """
    Count this request against every applicable limit and decide whether it should be rejected.

    True only when a limit tripped and enforcement is on; shadow mode (the default) allows the request, as
    does having no counter store configured at all, which turns rate limiting off entirely.
    """
    if auth_info and auth_info.is_superuser:
        return False

    store = _get_store()
    if store is None:
        return False

    start = time.perf_counter_ns()
    try:
        entries = _build_entries(
            resolve_method_rate_limits(method),
            method,
            headers.ip_address,
            auth_info.user_id if auth_info else None,
            int(time.time() // RATE_LIMIT_WINDOW_SECONDS),
        )

        try:
            # keys carry their window bucket, so a stale key is only ever read within its own window; we let
            # Valkey expire them a window later as housekeeping
            tripped_idx = store.incr_and_check(
                [(key, limit) for _, _, key, limit in entries], 2 * RATE_LIMIT_WINDOW_SECONDS
            )
        except Exception as e:
            # nothing could be counted, so fail open: going dark on the counters shouldn't take the API down
            observe_rate_limit_store_error(type(e).__name__)
            observe_rate_limit_check(method, "failed_open")
            sentry_sdk.set_tag("context", "rate_limiting")
            sentry_sdk.capture_exception(e)
            return False

        if not tripped_idx:
            observe_rate_limit_check(method, "allowed")
            return False

        enforced = get_global_boolean_value("rate_limiting_enabled", False)
        for i in tripped_idx:
            scope, dimension, _, _ = entries[i]
            observe_rate_limit_trip(method, scope, dimension, enforced)
        observe_rate_limit_check(method, "blocked" if enforced else "shadowed")
        return enforced
    finally:
        observe_rate_limit_duration((time.perf_counter_ns() - start) / 1e9)
