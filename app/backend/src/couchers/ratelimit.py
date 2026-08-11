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
from typing import Protocol

import sentry_sdk
import valkey
from google.protobuf.descriptor_pool import DescriptorPool

from couchers.config import config
from couchers.experimentation import get_global_boolean_value
from couchers.metrics import observe_rate_limit_store_error, observe_rate_limit_store_latency
from couchers.proto import annotations_pb2

logger = logging.getLogger(__name__)

# Window length for the fixed-window counters, in seconds.
_WINDOW_SECONDS = 60
# Counter keys carry their window bucket, so a stale key is only ever read within its own window; we let
# Valkey expire them a window later as housekeeping.
_KEY_TTL_SECONDS = 2 * _WINDOW_SECONDS

# Dimensions, in a fixed order.
DIMENSIONS = ("per_ip", "per_user", "global")

# Global default limits (requests per minute) per dimension, one set per scope. These apply wherever an
# annotation leaves a dimension unset; tune them in shadow mode before enforcing.
_DEFAULTS: dict[str, dict[str, int]] = {
    "rpc": {"per_ip": 60, "per_user": 120, "global": 6000},
    "svc": {"per_ip": 300, "per_user": 600, "global": 20000},
    "api": {"per_ip": 600, "per_user": 1200, "global": 60000},
}


@dataclass(frozen=True, slots=True)
class ResolvedLimits:
    """The fully-resolved per-minute limits for one method, per scope and dimension."""

    service_name: str
    rpc: dict[str, int]
    svc: dict[str, int]
    api: dict[str, int]


def _resolve_dim(annotation_value: int | None, default: int) -> int:
    return annotation_value if annotation_value is not None else default


def _opt(message: annotations_pb2.RateLimit, dim: str) -> int | None:
    """Read a dimension off a RateLimit message, honouring proto field presence."""
    return getattr(message, dim) if message.HasField(dim) else None  # type: ignore[arg-type]


@cache
def find_rate_limits(pool: DescriptorPool, method: str) -> ResolvedLimits:
    """
    Resolve the limits for a method from its proto annotations, falling back to global defaults.

    per-RPC:      method rate_limit.<dim> → service rate_limit_default.<dim> → global rpc default
    per-servicer: service rate_limit_aggregate.<dim> → global svc default
    all-API:      global api default
    """
    # method is of the form "/org.couchers.api.core.API/GetUser"
    _, service_name, method_name = method.split("/")

    service = pool.FindServiceByName(service_name)  # type: ignore[no-untyped-call]
    method_desc = service.FindMethodByName(method_name)

    service_options = service.GetOptions()
    method_rl = method_desc.GetOptions().Extensions[annotations_pb2.rate_limit]
    service_default = service_options.Extensions[annotations_pb2.rate_limit_default]
    service_aggregate = service_options.Extensions[annotations_pb2.rate_limit_aggregate]

    rpc = {
        dim: _resolve_dim(_opt(method_rl, dim), _resolve_dim(_opt(service_default, dim), _DEFAULTS["rpc"][dim]))
        for dim in DIMENSIONS
    }
    svc = {dim: _resolve_dim(_opt(service_aggregate, dim), _DEFAULTS["svc"][dim]) for dim in DIMENSIONS}
    api = dict(_DEFAULTS["api"])

    return ResolvedLimits(service_name=service_name, rpc=rpc, svc=svc, api=api)


def ip_to_key(ip: str, ipv6_prefix: int) -> str:
    """
    Mask an IP to its subnet and return a canonical string key.

    IPv4 is keyed at /32 (the exact address); IPv6 is masked to ipv6_prefix bits (default /64).
    """
    network = ip_network(ip, strict=False)
    prefix = 32 if network.version == 4 else ipv6_prefix
    return str(ip_network(f"{network.network_address}/{prefix}", strict=False))


class CounterStore(Protocol):
    def incr_and_check(self, entries: list[tuple[str, int]], ttl: int) -> list[int]:
        """Increment each key's counter; return the indices of entries whose count now exceeds its limit."""
        ...


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
        keys = [key for key, _ in entries]
        limits = [str(limit) for _, limit in entries]
        result = self._script(keys=keys, args=[str(ttl), *limits])
        # Lua returns 1-based indices.
        return [i - 1 for i in result]


# Sentinel distinguishing "not yet built" from "built but disabled (None)".
class _Unset:
    pass


_store: CounterStore | None | type[_Unset] = _Unset


def _build_store() -> CounterStore | None:
    if not config.VALKEY_HOST:
        return None
    return ValkeyCounterStore(config.VALKEY_HOST, config.VALKEY_PORT)


def _get_store() -> CounterStore | None:
    global _store
    if _store is _Unset:
        _store = _build_store()
    return _store  # type: ignore[return-value]


def rate_limiting_enabled() -> bool:
    """Whether over-limit requests are actually rejected; when false (default) limits only shadow-log."""
    return get_global_boolean_value("rate_limiting_enabled", False)


def rate_limiting_fail_closed() -> bool:
    """When enforcing, whether a counter-store outage rejects requests instead of allowing them (default false)."""
    return get_global_boolean_value("rate_limiting_fail_closed", False)


@dataclass(frozen=True, slots=True)
class TrippedLimit:
    scope: str
    dimension: str


@dataclass(frozen=True, slots=True)
class RateLimitResult:
    """The outcome of a check that actually ran (i.e. a store was configured)."""

    tripped: list[TrippedLimit]
    # the counter store was unreachable, so nothing could be counted; the caller decides open vs closed
    store_error: bool = False


def _build_entries(
    limits: ResolvedLimits, method: str, ip_address: str | None, user_id: int | None, bucket: int
) -> list[tuple[str, str, str, int]]:
    """The applicable (scope, dimension, key, limit) tuples for one request, across all scopes and dimensions."""
    # The identity each dimension is keyed by; None means the dimension doesn't apply to this request.
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
        for dim in DIMENSIONS:
            dim_id = dim_ids[dim]
            if dim_id is None:
                continue
            key = f"rl:{scope}:{scope_id}:{dim}:{dim_id}:{bucket}"
            entries.append((scope, dim, key, scope_limits[dim]))
    return entries


def check_rate_limits(
    pool: DescriptorPool,
    method: str,
    ip_address: str | None,
    user_id: int | None,
    is_superuser: bool = False,
) -> RateLimitResult | None:
    """
    Check every applicable limit for this request.

    Returns None if no check ran — either no counter store is configured (rate limiting off) or the caller is
    exempt — otherwise a RateLimitResult listing the limits that tripped. If the store is unreachable the
    result has store_error set and the error is reported; the caller decides whether to fail open or closed.
    """
    # superusers are exempt entirely, so a mistuned limit can never lock admins out mid-incident
    if is_superuser:
        return None

    store = _get_store()
    if store is None:
        return None

    limits = find_rate_limits(pool, method)
    bucket = int(time.time() // _WINDOW_SECONDS)
    entries = _build_entries(limits, method, ip_address, user_id, bucket)

    start = time.perf_counter_ns()
    try:
        tripped_idx = store.incr_and_check([(key, limit) for _, _, key, limit in entries], _KEY_TTL_SECONDS)
    except Exception as e:
        observe_rate_limit_store_error(type(e).__name__)
        sentry_sdk.set_tag("context", "rate_limiting")
        sentry_sdk.capture_exception(e)
        return RateLimitResult(tripped=[], store_error=True)
    observe_rate_limit_store_latency((time.perf_counter_ns() - start) / 1e9)

    return RateLimitResult(tripped=[TrippedLimit(entries[i][0], entries[i][1]) for i in tripped_idx])
