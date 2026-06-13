import grpc
import pytest

from couchers import metrics, ratelimit
from couchers.descriptor_pool import get_descriptor_pool
from couchers.proto import auth_pb2
from tests.fixtures.sessions import auth_api_session

AUTHENTICATE = "/org.couchers.auth.Auth/Authenticate"
USERNAME_VALID = "/org.couchers.auth.Auth/UsernameValid"


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


class InMemoryCounterStore:
    """A pure-Python fixed-window store mirroring the Valkey one, for hermetic tests."""

    def __init__(self) -> None:
        self.counts: dict[str, int] = {}

    def incr_and_check(self, entries: list[tuple[str, int]], ttl: int) -> list[int]:
        tripped = []
        for i, (key, limit) in enumerate(entries):
            self.counts[key] = self.counts.get(key, 0) + 1
            if self.counts[key] > limit:
                tripped.append(i)
        return tripped


class AlwaysTripStore:
    def incr_and_check(self, entries: list[tuple[str, int]], ttl: int) -> list[int]:
        return list(range(len(entries)))


class BrokenStore:
    def incr_and_check(self, entries: list[tuple[str, int]], ttl: int) -> list[int]:
        raise RuntimeError("valkey down")


@pytest.fixture
def store(monkeypatch):
    """Inject an in-memory counter store, bypassing Valkey."""
    s = InMemoryCounterStore()
    monkeypatch.setattr(ratelimit, "_store", s)
    return s


def _check(pool, method, ip, user_id):
    """check_rate_limits asserting a store was configured (non-None result)."""
    result = ratelimit.check_rate_limits(pool, method, ip, user_id)
    assert result is not None
    return result


def test_ip_to_key_ipv4():
    # IPv4 is always keyed at the exact /32 address
    assert ratelimit.ip_to_key("1.2.3.4", 64) == "1.2.3.4/32"


def test_ip_to_key_ipv6_masks_to_prefix():
    # a whole /64 collapses to one key, regardless of the host bits or textual form
    assert ratelimit.ip_to_key("2001:db8::1", 64) == "2001:db8::/64"
    assert ratelimit.ip_to_key("2001:0db8:0000:0000:dead:beef:0:1", 64) == "2001:db8::/64"
    assert ratelimit.ip_to_key("2001:db8::1", 64) == ratelimit.ip_to_key("2001:db8::ffff", 64)


def test_ip_to_key_ipv6_prefix_configurable():
    assert ratelimit.ip_to_key("2001:db8:abcd:1234::1", 48) == "2001:db8:abcd::/48"


def test_find_rate_limits_method_override():
    pool = get_descriptor_pool()
    limits = ratelimit.find_rate_limits(pool, AUTHENTICATE)
    # Authenticate annotates per_ip = 10; the other dimensions fall through to global rpc defaults
    assert limits.rpc["per_ip"] == 10
    assert limits.rpc["per_user"] == ratelimit._DEFAULTS["rpc"]["per_user"]
    assert limits.rpc["global"] == ratelimit._DEFAULTS["rpc"]["global"]


def test_find_rate_limits_defaults():
    pool = get_descriptor_pool()
    limits = ratelimit.find_rate_limits(pool, USERNAME_VALID)
    # no annotation anywhere: every scope/dimension uses its global default
    assert limits.rpc == ratelimit._DEFAULTS["rpc"]
    assert limits.svc == ratelimit._DEFAULTS["svc"]
    assert limits.api == ratelimit._DEFAULTS["api"]


def test_check_rate_limits_disabled_when_no_store():
    # default config has no store, so no check runs at all
    pool = get_descriptor_pool()
    assert ratelimit.check_rate_limits(pool, AUTHENTICATE, "1.2.3.4", None) is None


def test_check_rate_limits_trips_per_ip(store):
    pool = get_descriptor_pool()
    # Authenticate per_ip = 10: first 10 calls pass, the 11th trips the per-IP RPC limit
    for _ in range(10):
        assert _check(pool, AUTHENTICATE, "1.2.3.4", None).tripped == []
    tripped = _check(pool, AUTHENTICATE, "1.2.3.4", None).tripped
    assert any(t.scope == "rpc" and t.dimension == "per_ip" for t in tripped)


def test_check_rate_limits_per_ip_skipped_without_ip(store):
    pool = get_descriptor_pool()
    # no IP → the per_ip dimension is not counted, so the per_ip=10 limit can never trip
    for _ in range(20):
        tripped = _check(pool, AUTHENTICATE, None, None).tripped
        assert not any(t.dimension == "per_ip" for t in tripped)


def test_check_rate_limits_separate_subnets(store):
    pool = get_descriptor_pool()
    # two different /64s get independent counters
    for _ in range(11):
        ratelimit.check_rate_limits(pool, AUTHENTICATE, "2001:db8:1::1", None)
    assert _check(pool, AUTHENTICATE, "2001:db8:2::1", None).tripped == []


def test_check_rate_limits_store_error(monkeypatch):
    monkeypatch.setattr(ratelimit, "_store", BrokenStore())
    captured = []
    monkeypatch.setattr("couchers.ratelimit.sentry_sdk.capture_exception", lambda e: captured.append(e))
    monkeypatch.setattr("couchers.ratelimit.sentry_sdk.set_tag", lambda *a, **k: None)

    pool = get_descriptor_pool()
    # store blows up → store_error is flagged (nothing tripped) and the error is reported
    result = _check(pool, AUTHENTICATE, "1.2.3.4", None)
    assert result.store_error
    assert result.tripped == []
    assert len(captured) == 1


def test_interceptor_no_store_allows(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", True)
    monkeypatch.setattr(ratelimit, "_store", None)
    with auth_api_session() as (auth_api, _):
        # no counter store configured → rate limiting is off entirely, even when enabled
        assert auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test")).valid


def test_interceptor_shadow_allows(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", False)
    monkeypatch.setattr(ratelimit, "_store", AlwaysTripStore())
    with auth_api_session() as (auth_api, _):
        # disabled (default) → counted and would-block logged, but the request still succeeds
        assert auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test")).valid


def test_interceptor_enforce_rejects(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", True)
    monkeypatch.setattr(ratelimit, "_store", AlwaysTripStore())
    with auth_api_session() as (auth_api, _):
        with pytest.raises(grpc.RpcError) as e:
            auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test"))
        assert e.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED


def test_interceptor_fails_open_by_default(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", True)
    # rate_limiting_fail_closed defaults to false
    monkeypatch.setattr(ratelimit, "_store", BrokenStore())
    with auth_api_session() as (auth_api, _):
        # store unreachable + enforcing but fail-open → request allowed
        assert auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test")).valid


def test_interceptor_fails_closed_when_enforcing(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", True)
    feature_flags.set("rate_limiting_fail_closed", True)
    monkeypatch.setattr(ratelimit, "_store", BrokenStore())
    with auth_api_session() as (auth_api, _):
        with pytest.raises(grpc.RpcError) as e:
            auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test"))
        assert e.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED


def test_interceptor_shadow_ignores_fail_closed(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", False)
    feature_flags.set("rate_limiting_fail_closed", True)
    monkeypatch.setattr(ratelimit, "_store", BrokenStore())
    with auth_api_session() as (auth_api, _):
        # shadow never blocks, even with fail-closed set and the store down
        assert auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test")).valid


def _metric_value(counter, name: str, **labels: str) -> float:
    return float(
        sum(
            s.value
            for m in counter.collect()
            for s in m.samples
            if s.name == name and all(s.labels.get(k) == v for k, v in labels.items())
        )
    )


def test_interceptor_emits_metrics_on_enforce(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", True)
    monkeypatch.setattr(ratelimit, "_store", AlwaysTripStore())

    blocked_before = _metric_value(
        metrics.rate_limit_checks_counter, "couchers_rate_limit_checks_total", decision="blocked"
    )
    # no IP/user on this call, so the global dimension trips at every scope
    trip_before = _metric_value(
        metrics.rate_limit_trips_counter,
        "couchers_rate_limit_trips_total",
        method=USERNAME_VALID,
        scope="rpc",
        dimension="global",
        enforced="true",
    )

    with auth_api_session() as (auth_api, _):
        with pytest.raises(grpc.RpcError):
            auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test"))

    assert (
        _metric_value(metrics.rate_limit_checks_counter, "couchers_rate_limit_checks_total", decision="blocked")
        == blocked_before + 1
    )
    assert (
        _metric_value(
            metrics.rate_limit_trips_counter,
            "couchers_rate_limit_trips_total",
            method=USERNAME_VALID,
            scope="rpc",
            dimension="global",
            enforced="true",
        )
        == trip_before + 1
    )
