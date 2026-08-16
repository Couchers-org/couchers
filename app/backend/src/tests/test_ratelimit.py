import os
from uuid import uuid4

import grpc
import pytest
import valkey

from couchers import metrics, ratelimit
from couchers.proto import api_pb2, auth_pb2
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import auth_api_session, real_api_session

AUTHENTICATE = "/org.couchers.auth.Auth/Authenticate"
USERNAME_VALID = "/org.couchers.auth.Auth/UsernameValid"

# Where the Valkey integration tests look for a server; docker-compose.test.yml publishes one on 6545.
VALKEY_TEST_HOST = os.environ.get("VALKEY_TEST_HOST", "localhost")
VALKEY_TEST_PORT = int(os.environ.get("VALKEY_TEST_PORT", "6545"))


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


def _use_store(monkeypatch, store):
    """Point the rate limiter at this counter store (None meaning none configured)."""
    monkeypatch.setattr(ratelimit, "_get_store", lambda: store)


@pytest.fixture
def store(monkeypatch):
    """Inject an in-memory counter store, bypassing Valkey."""
    s = InMemoryCounterStore()
    _use_store(monkeypatch, s)
    return s


@pytest.fixture
def valkey_client():
    """A raw client against the test Valkey, skipping the test if there isn't one running."""
    client = valkey.Valkey(host=VALKEY_TEST_HOST, port=VALKEY_TEST_PORT, socket_connect_timeout=1, socket_timeout=1)
    try:
        client.ping()
    except valkey.ConnectionError as e:
        pytest.skip(
            f"no Valkey at {VALKEY_TEST_HOST}:{VALKEY_TEST_PORT} ({e}); "
            f"start one with `docker compose -f docker-compose.test.yml up -d valkey_tests`"
        )
    return client


@pytest.fixture
def valkey_store(valkey_client):
    """The real Valkey-backed store, so the Lua script itself is exercised rather than a stand-in."""
    return ratelimit.ValkeyCounterStore(VALKEY_TEST_HOST, VALKEY_TEST_PORT)


@pytest.fixture
def key_prefix():
    """A prefix unique to this test run, so counters can't collide with a previous run's leftovers."""
    return f"test:{uuid4().hex}"


def _check(method, ip, user_id):
    """check_rate_limits asserting a store was configured (non-None result)."""
    result = ratelimit.check_rate_limits(method, ip, user_id)
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


def test_resolve_method_rate_limits_method_override():
    limits = ratelimit.resolve_method_rate_limits(AUTHENTICATE)
    # Authenticate annotates per_ip = 10; the other dimensions fall through to the global rpc defaults
    assert limits.rpc == {"per_ip": 10, "per_user": 120, "global": 6000}


def test_resolve_method_rate_limits_defaults():
    limits = ratelimit.resolve_method_rate_limits(USERNAME_VALID)
    # no annotation anywhere: every scope/dimension uses its global default
    assert limits.rpc == {"per_ip": 60, "per_user": 120, "global": 6000}
    assert limits.svc == {"per_ip": 300, "per_user": 600, "global": 20000}
    assert limits.api == {"per_ip": 600, "per_user": 1200, "global": 60000}


def test_check_rate_limits_disabled_when_no_store():
    # this is the one test that goes through the real accessor, so it can't reuse another test's store
    ratelimit._get_store.cache_clear()
    # default config has no VALKEY_HOST, so no check runs at all
    assert ratelimit.check_rate_limits(AUTHENTICATE, "1.2.3.4", None) is None


def test_check_rate_limits_trips_per_ip(store):
    # Authenticate per_ip = 10: first 10 calls pass, the 11th trips the per-IP RPC limit
    for _ in range(10):
        assert _check(AUTHENTICATE, "1.2.3.4", None).tripped == []
    tripped = _check(AUTHENTICATE, "1.2.3.4", None).tripped
    assert any(t.scope == "rpc" and t.dimension == "per_ip" for t in tripped)


def test_check_rate_limits_per_ip_skipped_without_ip(store):
    # no IP → the per_ip dimension is not counted, so the per_ip=10 limit can never trip
    for _ in range(20):
        tripped = _check(AUTHENTICATE, None, None).tripped
        assert not any(t.dimension == "per_ip" for t in tripped)


def test_check_rate_limits_separate_subnets(store):
    # two different /64s get independent counters
    for _ in range(11):
        ratelimit.check_rate_limits(AUTHENTICATE, "2001:db8:1::1", None)
    assert _check(AUTHENTICATE, "2001:db8:2::1", None).tripped == []


def test_check_rate_limits_store_error(monkeypatch):
    _use_store(monkeypatch, BrokenStore())
    captured = []
    monkeypatch.setattr("couchers.ratelimit.sentry_sdk.capture_exception", lambda e: captured.append(e))
    monkeypatch.setattr("couchers.ratelimit.sentry_sdk.set_tag", lambda *a, **k: None)

    # store blows up → store_error is flagged (nothing tripped) and the error is reported
    result = _check(AUTHENTICATE, "1.2.3.4", None)
    assert result.store_error
    assert result.tripped == []
    assert len(captured) == 1


def test_interceptor_superuser_exempt_when_enforcing(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", True)
    _use_store(monkeypatch, AlwaysTripStore())
    superuser, token = generate_user(is_superuser=True)

    # real_api_session, not api_session: only the real server runs the interceptor the limiter lives in
    with real_api_session(token) as api:
        # every limit trips, but superusers bypass the check entirely
        assert api.Ping(api_pb2.PingReq()).user.user_id == superuser.id


def test_interceptor_non_superuser_still_blocked_when_enforcing(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", True)
    _use_store(monkeypatch, AlwaysTripStore())
    _, token = generate_user()

    with real_api_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.Ping(api_pb2.PingReq())
        assert e.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED


def test_interceptor_no_store_allows(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", True)
    _use_store(monkeypatch, None)
    with auth_api_session() as (auth_api, _):
        # no counter store configured → rate limiting is off entirely, even when enabled
        assert auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test")).valid


def test_interceptor_shadow_allows(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", False)
    _use_store(monkeypatch, AlwaysTripStore())
    with auth_api_session() as (auth_api, _):
        # disabled (default) → counted and would-block logged, but the request still succeeds
        assert auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test")).valid


def test_interceptor_enforce_rejects(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", True)
    _use_store(monkeypatch, AlwaysTripStore())
    with auth_api_session() as (auth_api, _):
        with pytest.raises(grpc.RpcError) as e:
            auth_api.UsernameValid(auth_pb2.UsernameValidReq(username="test"))
        assert e.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED


def test_interceptor_fails_open_when_enforcing(db, feature_flags, monkeypatch):
    feature_flags.set("rate_limiting_enabled", True)
    _use_store(monkeypatch, BrokenStore())
    with auth_api_session() as (auth_api, _):
        # a store outage always allows, even while enforcing: it must not become an API outage
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
    _use_store(monkeypatch, AlwaysTripStore())

    blocked_before = _metric_value(
        metrics.rate_limit_checks_counter,
        "couchers_rate_limit_checks_total",
        method=USERNAME_VALID,
        decision="blocked",
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
        _metric_value(
            metrics.rate_limit_checks_counter,
            "couchers_rate_limit_checks_total",
            method=USERNAME_VALID,
            decision="blocked",
        )
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


# The tests below run the real Lua script against a real Valkey; everything above uses a stand-in store.


def test_valkey_store_counts_and_trips(valkey_store, key_prefix):
    key = f"{key_prefix}:counted"
    # a limit of 3 means the first three calls pass and the fourth is over
    for _ in range(3):
        assert valkey_store.incr_and_check([(key, 3)], 120) == []
    assert valkey_store.incr_and_check([(key, 3)], 120) == [0]
    # and it stays tripped for the rest of the window
    assert valkey_store.incr_and_check([(key, 3)], 120) == [0]


def test_valkey_store_returns_indices_of_tripped_entries(valkey_store, key_prefix):
    # a limit of 0 trips on the first increment, a high limit never does; this pins the Lua script's
    # 1-based indices being translated back to the 0-based positions of the entries passed in
    entries = [
        (f"{key_prefix}:high:0", 100),
        (f"{key_prefix}:zero:1", 0),
        (f"{key_prefix}:high:2", 100),
        (f"{key_prefix}:zero:3", 0),
    ]
    assert valkey_store.incr_and_check(entries, 120) == [1, 3]


def test_valkey_store_counts_keys_independently(valkey_store, key_prefix):
    a, b = f"{key_prefix}:a", f"{key_prefix}:b"
    for _ in range(5):
        valkey_store.incr_and_check([(a, 5)], 120)
    # a is now at its limit, but b has its own counter
    assert valkey_store.incr_and_check([(a, 5), (b, 5)], 120) == [0]


def test_valkey_store_sets_ttl_on_first_increment(valkey_store, valkey_client, key_prefix):
    key = f"{key_prefix}:ttl"
    valkey_store.incr_and_check([(key, 100)], 120)
    # without a TTL the counter would never reset and the key would leak
    assert 0 < valkey_client.ttl(key) <= 120


def test_valkey_store_does_not_extend_ttl_on_later_increments(valkey_store, valkey_client, key_prefix):
    key = f"{key_prefix}:ttl-once"
    valkey_store.incr_and_check([(key, 100)], 120)
    # pull the expiry in, then increment again: the window must not slide, or a sustained flood would keep
    # renewing its own counter and the fixed window would never roll over
    valkey_client.expire(key, 5)
    valkey_store.incr_and_check([(key, 100)], 120)
    assert 0 < valkey_client.ttl(key) <= 5


def test_check_rate_limits_end_to_end_against_valkey(valkey_store, monkeypatch):
    _use_store(monkeypatch, valkey_store)
    # a /64 unique to this run, so the per-IP counters start clean
    ip = f"2001:db8:{uuid4().hex[:4]}:{uuid4().hex[:4]}::1"

    # Authenticate annotates per_ip = 10
    for _ in range(10):
        assert _check(AUTHENTICATE, ip, None).tripped == []
    tripped = _check(AUTHENTICATE, ip, None).tripped
    assert any(t.scope == "rpc" and t.dimension == "per_ip" for t in tripped)

    # a different /64 is unaffected
    other_ip = f"2001:db8:{uuid4().hex[:4]}:{uuid4().hex[:4]}::1"
    assert _check(AUTHENTICATE, other_ip, None).tripped == []
