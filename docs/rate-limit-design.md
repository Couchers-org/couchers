# Rate limiting

Limits are declared as proto annotations with sane defaults, so you only configure the few endpoints that need special treatment.

## Two axes

Every limit is a pair of (**scope**, **dimension**).

**Scopes** are nested — a single request increments a counter at each level:

| Scope         | Name  | Counts traffic across | Configured by |
|---------------|-------|-----------------------|---------------|
| per-RPC       | `rpc` | one method            | method annotation → service default → global constant |
| per-servicer  | `svc` | all methods in a service | service annotation → global constant |
| all-API       | `api` | the entire backend    | global constants |

The short names in that column are what appear in counter keys and in the `scope` label on the metrics below.

**Dimensions** — each scope carries one limit per dimension:

- **per-IP** — applied only when the `x-couchers-real-ip` header is present. The address is first masked to a network prefix (IPv4 `/32`, IPv6 a configurable prefix defaulting to `/64`) and then normalized to its canonical form, and that string is the key — so every address in a subnet maps to one counter regardless of textual representation.
- **per-user** — applied only to authenticated calls.
- **global** — everyone combined.

A request is rejected (`RESOURCE_EXHAUSTED`) if **any** applicable limit is exceeded.

## Annotations

A `RateLimit` message (in `annotations.proto`) holds one optional count per dimension. It attaches at two levels:

```proto
message RateLimit {
  optional uint32 per_ip   = 1;  // requests per minute
  optional uint32 per_user = 2;
  optional uint32 global   = 3;
}

extend google.protobuf.MethodOptions {
  RateLimit rate_limit = 50002;            // this method's per-RPC limit
}

extend google.protobuf.ServiceOptions {
  RateLimit rate_limit_default   = 50003;  // default per-RPC limit for the service's methods
  RateLimit rate_limit_aggregate = 50004;  // per-servicer aggregate limit
}
```

Fields are `optional`, so presence is tracked per-field and resolution happens **per dimension**:

- **per-RPC scope:** method `rate_limit.<dim>` → service `rate_limit_default.<dim>` → global per-RPC default constant.
- **per-servicer scope:** service `rate_limit_aggregate.<dim>` → global per-servicer default constant.
- **all-API scope:** global constants.

So you can set a per-method default for a whole service, override one expensive method below it, and independently cap the servicer as a whole — three non-overlapping knobs. Everything left unset falls through to defaults.

## Enforcement

Enforcement lives in the gRPC middleware interceptor's call admission (`admit_call`), the same setup phase that already resolves `auth_level` (from the proto descriptor pool), parses headers and checks permissions. By the time we check, we have the method name, the client IP, and the authenticated `user_id` (if any).

Counters are kept in **Valkey** (shared across all API worker processes; no distributed-state problem). A single Lua script does a fixed-window `INCR` + `EXPIRE` over all applicable keys in one round trip and returns which, if any, tripped.

Keys are `rl:<scope>:<scope id>:<dimension>:<identity>:<window>`, where the scope id is the full method path for `rpc`, the service name for `svc`, and `*` for `api`; the identity is the masked subnet, the user id, or `*`; and the window is `unix time // RATE_LIMIT_WINDOW_SECONDS`. One authenticated IPv6 call to `GetUser` increments nine counters, three of which are:

```
rl:rpc:/org.couchers.api.core.API/GetUser:per_ip:2001:db8::/64:29876543
rl:svc:org.couchers.api.core.API:per_user:42:29876543
rl:api:*:global:*:29876543
```

**Fail-open:** if Valkey is unreachable the error is reported to Sentry and the request is allowed. Losing the counters is not a reason to take the API down with them, and the alternative — rejecting everything while the store is down — turns a Valkey outage into a full outage. If a flood ever coincides with a store outage, the lever is to fix or restart the store, not to shed every request in the meantime.

A rejected call aborts before the handler body runs, so — like every other rejected-in-setup call, such as a failed auth — it emits none of the ordinary servicer metrics and writes no `APICall` row. Blocked traffic is visible only through the rate-limit metrics above, and is not attributable to a user or IP from the database.

## Enabling

Counting happens whenever a counter store is configured; leaving the store unconfigured turns the whole system off. When counting, a single global boolean feature flag `rate_limiting_enabled` (evaluated via the experimentation framework's global evaluator, flippable without a deploy) decides whether limits actually bite:

- **false (default)** — *shadow*: count what *would* be blocked, but allow everything.
- **true** — *enforce*: actually reject over-limit requests.

Shadow versus enforce is the only switch; there is deliberately no second flag for outage behaviour.

The default is fail-safe: shadow. Tuning is driven off the `couchers_rate_limit_trips_total{method,scope,dimension,enforced}` metric, which names the exact counter that tripped. Shadow mode deliberately emits no log line — a flood is precisely when the log would be least affordable and the metric already carries the signal.

## Exemptions

Superusers skip the check entirely, so a mistuned limit can't lock admins out during an incident.
