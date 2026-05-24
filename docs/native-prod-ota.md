# Native production OTA — backend-served Expo Updates with per-user rollouts

How we ship over-the-air JS updates to the **production** (and staging) mobile
apps from our own infrastructure, replacing EAS Update (`u.expo.dev`). The
mobile client checks for updates against our **backend**, which serves the Expo
Updates protocol from a gRPC servicer, picks the right update **per user** via
GrowthBook feature flags, and points the client at JS bundles hosted on our
existing S3 + CloudFront. Expo's native crash-rollback safety net is preserved,
and a backend outage degrades to "run the embedded/last-good bundle".

**Status:** design / not yet implemented. This is the production counterpart to
the per-branch Dev Tool OTA (`docs/mobile-dev-tool-ota.md`). The Dev Tool is a
dev client and loads branches through the dev launcher's deep-link path; the
production app is a release build and uses `expo-updates` proper, which is a
different mechanism (see §2). This doc reuses the Dev Tool's static publish
pipeline (`ota-stage.mjs`, the S3 layout, the CloudFront/Lambda infra) and adds
the three things production needs: a **backend manifest endpoint**, **per-user
rollouts**, and **code signing**.

---

## 1. Goals

1. **Self-hosted OTA.** No dependency on EAS Update for delivering JS updates;
   bundles live in the S3 + CloudFront we already run.
2. **Per-user staged rollouts.** Roll an update out to 1% → 10% → 100%, or to a
   named beta track, using the GrowthBook experimentation framework we already
   have (`couchers/experimentation.py`).
3. **Keep Expo's safety net.** A bad update that crashes on launch must still
   auto-roll-back to the embedded bundle (Expo's anti-bricking). This rules out
   the URL-override API (§2) and shapes the identity design (§5).
4. **Fail open.** If the backend is unreachable, the update check fails and the
   app keeps running its current bundle. No hard dependency on the backend for
   the app to start.
5. **Reuse, don't rebuild.** Lean on the Dev Tool publish pipeline, the
   `HttpBody`-over-gRPC pattern (already used by GIS and Stripe), and the
   `tools/` promote flow used for the Next.js release.

### How production differs from the Dev Tool

| | Dev Tool | Production (this doc) |
| --- | --- | --- |
| Build type | dev client (`developmentClient: true`) | release build |
| Programmatic Updates API | **hard-disabled** in dev clients | **available** |
| How an update loads | dev-launcher deep link (`?url=`) | `expo-updates` fetches `updates.url` |
| Who picks the update | a human scans a per-branch QR | the **backend**, per user |
| Identity | none | opaque install id → user (§5) |
| Signing | dropped (TLS suffices for a dev tool) | **required** (§7) |
| Channels | n/a | n/a — we key on runtime version + platform + track |

---

## 2. Key finding: use the request-header override, not the URL override

`expo-updates@29.0.17` (SDK 54) exposes two runtime override APIs
(`node_modules/expo-updates/src/Updates.ts`):

- **`setUpdateRequestHeadersOverride(headers)`** — overrides the request headers
  sent on the update check. Persisted by `expo-updates` across launches.
  **No special config required.**
- **`setUpdateURLAndRequestHeadersOverride({updateUrl, requestHeaders})`** —
  overrides the whole URL. Its docstring states it **requires
  `disableAntiBrickingMeasures: true`** in app config and is `@experimental`.

`disableAntiBrickingMeasures` turns off Expo's automatic rollback-to-embedded
when an update crashes on launch — unacceptable in production. **We therefore do
NOT use the URL override.** The baked-in `updates.url` stays fixed (our backend
endpoint), and we carry per-user identity by injecting a request **header** via
`setUpdateRequestHeadersOverride`. This keeps anti-bricking fully intact.

(The Dev Tool can't use either API at all — dev clients throw
`NotAvailableInDevClientException`. That's why it loads via the dev launcher.
Production release builds have these APIs available.)

---

## 3. Key finding: the backend can serve the Expo Updates protocol directly

The backend already serves plain HTTP from gRPC servicers using
`google.api.HttpBody` return types plus `google.api.http` annotations,
transcoded by **Envoy** (`app/proxy/envoy.yaml`, the
`envoy.filters.http.grpc_json_transcoder` filter with `auto_mapping: true`).
Two existing precedents:

- **`GIS`** (`app/proto/gis.proto`, `src/couchers/servicers/gis.py`) —
  `rpc GetUsers(Empty) returns (google.api.HttpBody)` annotated
  `get: "/geojson/users"`, returns
  `HttpBody(content_type="application/json", data=<bytes>)`.
- **`Stripe`** (`app/proto/stripe.proto`,
  `src/couchers/servicers/donations.py`) — `rpc Webhook(HttpBody) returns
  (HttpBody)` annotated `post: "/stripe/webhook"`. It takes a **raw** request
  body and reads an arbitrary request header:
  `context.headers.get("stripe-signature")`.

So a gRPC servicer can: (a) be reached as a real HTTP `GET`, (b) read arbitrary
request headers via `context.headers` (`src/couchers/context.py:146` —
`dict(self._grpc_context.invocation_metadata())`), and (c) return an arbitrary
body + content type. That is exactly the surface the Expo Updates protocol
needs. **The manifest endpoint is just another `HttpBody` method — not a new
service, not an edge function, not a separate process.**

**Envoy specifics (verified):**

- The transcoder has an explicit `services:` allowlist (`envoy.yaml:125-131`)
  and **`org.couchers.bugs.Bugs` is already listed.** Adding a method to the
  `Bugs` service needs **no `envoy.yaml` services change.**
- Routes are discovered from a compiled descriptor `proto_descriptor:
  /etc/envoy/descriptors.pb`. It is generated by `app/generate_protos.sh`
  (`protoc --descriptor_set_out proto/gen/descriptors.pb`) and copied to
  `proxy/descriptors.pb` (baked into the proxy image,
  `app/proxy/Dockerfile`) and `backend/src/couchers/proto/descriptors.pb`. After
  adding the method, **regenerate protos (`make protos`) and redeploy the proxy
  image** so Envoy loads the new route.
- `auto_mapping: true` means any method on an allowlisted service with a
  `google.api.http` annotation is auto-exposed.

### Response headers (`expo-protocol-version`)

The Dev Tool work established (confirmed on-device) that the client **requires
the `expo-protocol-version: 1` response header**, plus `expo-sfv-version: 0`;
without it the client rejects the manifest before fetching.

**Resolved (implemented + verified locally): set it from the servicer via initial
metadata.** `CouchersContext.set_response_headers([...])` queues the headers and
`_send_cookies()` emits them alongside cookies in the single
`send_initial_metadata` call (`context.py`). Envoy forwards this initial metadata
downstream as HTTP response headers — confirmed by curling
`/mobile/ota/manifest` through the local proxy: the response carries
`expo-protocol-version: 1` and `expo-sfv-version: 0` (same mechanism that already
delivers `set-cookie`).

> **Note — the route-scoped Envoy approach does NOT work here.** A `match: { path:
> "/mobile/ota/manifest" }` route with `response_headers_to_add` never matches,
> because `grpc_json_transcoder` rewrites the request `:path` to the gRPC method
> path (`/org.couchers.bugs.Bugs/GetMobileUpdateManifest`) *before* route
> selection, so the request falls through to the catch-all `prefix: "/"` route.
> The servicer-metadata path sidesteps this entirely and needs no `envoy.yaml`
> change — only the regenerated `descriptors.pb` (so the route transcodes at all).

---

## 4. Architecture

```
                 cold start / periodic
  ┌───────────┐  GET /mobile/ota/manifest        ┌──────────────────────────┐
  │  prod app │ ───────────────────────────────► │ Envoy (grpc_json_         │
  │ expo-     │   headers:                        │ transcoder, auto_mapping) │
  │ updates   │     expo-runtime-version          └────────────┬─────────────┘
  │           │     expo-platform                              │ gRPC
  │           │     expo-current-update-id                     ▼
  │           │     expo-expect-signature         ┌──────────────────────────┐
  │           │     x-couchers-ota-id  ◄──set via  │ Bugs.GetMobileUpdate     │
  │           │       setUpdateRequest             │ Manifest (AUTH_LEVEL_    │
  │           │       HeadersOverride              │ OPEN)                    │
  │           │                                    │  1. ota-id → user_id     │
  │           │                                    │     (mapping table)      │
  │           │                                    │  2. build user context;  │
  │           │                                    │     check_gate /          │
  │           │                                    │     get_feature_value     │
  │           │                                    │  3. registry: track →     │
  │           │                                    │     update_id             │
  │           │ ◄──────────────────────────────── │  4. sign + frame manifest │
  │           │   multipart/mixed manifest         │     (or directive)        │
  │           │   (launchAsset/asset URLs →        └────────────┬─────────────┘
  │           │    CloudFront)                                  │ fetch manifest.json
  │           │                                                 ▼  (cached by update_id)
  │           │   GET bundle.hbc + assets        ┌──────────────────────────┐
  │           │ ───────────────────────────────► │ S3 + CloudFront           │
  └───────────┘                                   │ ota/prod/<update_id>/...  │
                                                  └──────────────────────────┘
                                                       ▲ uploaded by tools/ promote
```

The backend only ever emits the small **manifest** (a few KB). The heavy
**bundle + assets** are served by CloudFront; the manifest's content-addressed
URLs point there. The backend never proxies bundle bytes.

---

## 5. Identity: opaque install id → user

The production app's automatic update check runs in **native code at cold
start, before the JS layer (and thus the user's auth session) is available**. So
the check cannot carry the normal Couchers auth cookie, and `context.user_id`
would be `None`. The experimentation evaluator only sets
`attributes={"id": str(user_id)}` (`experimentation.py:167`), so an unidentified
check would bucket every install on `id="None"` — no per-user rollout split.

**Solution — a DB mapping table from an opaque per-install id to a user:**

1. On first run the app generates a random opaque id (`ota_id`, a UUIDv4) and
   persists it in secure storage.
2. While authenticated (on login and/or app open), the app calls an
   **authenticated** RPC `RegisterOtaInstall(ota_id)` that upserts
   `(ota_id → context.user_id)` into the mapping table. Idempotent; account
   switch on the same device re-points the row to the new user.
3. The app sets the header once via
   `setUpdateRequestHeadersOverride({ "x-couchers-ota-id": ota_id })`.
   `expo-updates` persists this, so subsequent native cold-start checks send it.
4. The **open** manifest endpoint reads `x-couchers-ota-id` from
   `context.headers`, looks up the user, and evaluates rollouts for that user.

**Important properties:**

- `ota_id` is **not an auth credential** — it only selects a rollout bucket. It
  grants no account access. Treat it as an opaque random value; it rotates on
  reinstall.
- Unknown / missing header → no row → treat as **anonymous → `stable` track**.
  This is also the logged-out fallback, so the `id="None"` problem never bites:
  anonymous users always get the safe stable release.
- Registration is authenticated and separate from the open manifest endpoint, so
  the manifest endpoint never needs a session and the mapping can only be written
  by the logged-in user it belongs to.

> Put `RegisterOtaInstall` on an authenticated servicer (e.g. alongside existing
> device/push registration, or on `Account`). Do **not** put it on `Bugs` — only
> the read-only, open manifest method goes there (§3, §6).

---

## 6. The manifest endpoint (`Bugs.GetMobileUpdateManifest`)

Add to `app/proto/bugs.proto` (the `Bugs` service is already `AUTH_LEVEL_OPEN`
and already Envoy-allowlisted):

```proto
import "google/api/httpbody.proto";

rpc GetMobileUpdateManifest(google.api.HttpBody) returns (google.api.HttpBody) {
  option (google.api.http) = { get : "/mobile/ota/manifest" };
}
```

Servicer logic (`src/couchers/servicers/bugs.py`):

1. **Read request headers** from `context.headers`:
   `expo-runtime-version` (the build's fingerprint), `expo-platform`
   (`ios|android`), `expo-current-update-id` (currently-running update, may be
   absent), `expo-expect-signature` (present iff code signing is configured),
   and `x-couchers-ota-id`.
2. **Resolve the user:** `ota_id → user_id` via the mapping table. Build a
   context for evaluation with `make_background_user_context(user_id)`
   (`context.py:224`); if no row, evaluate as anonymous (`stable`).
   `check_gate` / `get_feature_value` only need `context.user_id` + the
   per-context GrowthBook cache, so a background context is sufficient.
   *(Confirm a background context carries the `_growthbook` cache slot;
   all contexts do.)*
3. **Pick the track** via the experimentation API (`experimentation.py`):
   - `track = get_feature_value(user_ctx, "mobile_ota_track", "stable")`, and/or
   - a boolean canary gate `check_gate(user_ctx, "mobile_ota_canary")`.
   These are evaluated against the resolved user, so GrowthBook does the
   percentage bucketing / beta-track assignment. Exposure logging dedups per
   user/experiment/variation (`_record_exposure`, `on_conflict_do_nothing`), so
   frequent cold-start checks are fine.
4. **Resolve the update id** from the **release registry** for
   `(runtime_version, platform, track)` (§8). If none, return a
   `noUpdateAvailable` directive (the app keeps its embedded/current bundle).
5. **No-op check:** if the resolved `update_id == expo-current-update-id`,
   return a `noUpdateAvailable` directive.
6. **Build the response:** fetch the (unsigned) `manifest.json` object for that
   `update_id`/platform from the CDN (cache by `update_id`, immutable), sign it
   (§7), and frame it as protocol-v1 `multipart/mixed`
   (`manifest` part + `extensions` part), exactly as `ota-stage.mjs` already
   does for the Dev Tool. Return
   `HttpBody(content_type="multipart/mixed; boundary=…", data=<framed bytes>)`
   and ensure the `expo-protocol-version: 1` response header is set (§3).

**Directives (protocol v1)** are returned instead of a manifest part when there
is nothing new:

- `{"type":"noUpdateAvailable"}` — steps 4 & 5.
- `{"type":"rollBackToEmbedded","parameters":{"commitTime":"<iso>"}}` — to pull
  users back to the store-shipped bundle (e.g. a bad release; §9).

When signing is enabled the client expects directives to be signed too, so the
directive path also runs through the signer (§7). This is why the signing key
lives in the backend, not the publish pipeline.

---

## 7. Code signing

Production OTA **must** be signed. The signed manifest commits to the
content-addressed hashes of the bundle and every asset, so even though those
bytes are served from CloudFront, a tampered bundle on the CDN (or a MITM)
produces a hash mismatch and the client rejects it. TLS alone does not cover CDN
compromise; signing does. (The Dev Tool deliberately dropped signing because for
an internal dev tool over HTTPS the threat model didn't justify it — see
`docs/mobile-dev-tool-ota.md` §3. Production reverses that call.)

**Mechanism (Expo code signing, `rsa-v1_5-sha256`):**

- Generate an RSA keypair. The **public certificate** is embedded in the build
  via `updates.codeSigningCertificate` (a committed PEM) +
  `updates.codeSigningMetadata: { keyid: "main", alg: "rsa-v1_5-sha256" }` in
  `app.config.js` (production variant). (Note: the Dev Tool work *removed* a
  committed `certs/certificate.pem` and a `.gitignore` exception; production
  re-introduces a committed **public** cert. The private key is never
  committed.)
- The client sends `expo-expect-signature` on the update request. The backend
  signs the manifest body (and any directive) with the **private key** and
  returns the signature as the `expo-signature` header on the relevant
  multipart part: `expo-signature: sig="<b64>", keyid="main",
  alg="rsa-v1_5-sha256"`.
- **The private key lives only in the backend** (config/secret, e.g.
  `OTA_SIGNING_PRIVATE_KEY`). The `tools/` publish pipeline uploads **unsigned**
  manifests + bundles to the CDN; the backend signs on the fly. This keeps the
  key in one place and is what forces signing to be a backend (not publish-time)
  concern, since directives are generated dynamically.

Follow Expo's reference `custom-expo-updates-server` `codeSigning` helper and
the spec (links in References) for the exact signing-string construction; treat
the exact wire details as **confirm-on-device** (mirroring the Dev Tool's
empirical discipline — it had to verify the multipart framing and the
`expo-protocol-version` response header on a real device).

---

## 8. Release registry

A small mapping from a track to the update id it currently points at, per
runtime version and platform:

```
(runtime_version, platform, track)  →  update_id
```

- `runtime_version` is the build fingerprint (`runtimeVersion: { policy:
  "fingerprint" }` in `app.config.js`). An OTA only ever reaches store builds
  whose fingerprint matches — the same safety net as the Dev Tool. A native
  change bumps the fingerprint, so it needs a new store build, not an OTA. Keying
  the registry on `runtime_version` enforces this for free.
- `track` is what GrowthBook assigns the user (`stable`, `canary`, a beta track…).
- Updating the registry **is** the "release" action; pointing a track at an older
  `update_id` is the rollback lever (alongside the `rollBackToEmbedded` directive
  for pulling users to the embedded bundle).

**Storage — recommended: a `releases.json` on the CDN**, written by the `tools/`
promote (§9) and fetched + short-TTL-cached by the backend. This keeps `tools/`
decoupled from the backend DB — it already has CDN write access for the Next.js
release, and writing one more JSON object is trivial. The backend reads it on
the manifest path (cached). *(Alternative: a DB table the backend owns, updated
via an authenticated admin RPC at the end of the promote. More coupling; only
worth it if we want the registry queryable in SQL.)*

The percentage / cohort logic itself is **not** in the registry — it's in
GrowthBook flags (`mobile_ota_track` / `mobile_ota_canary`). The registry only
resolves a track name to a concrete immutable `update_id`. So a ramp (1% → 100%)
is a GrowthBook change with no redeploy; cutting a new release is a registry
flip; both are independent.

---

## 9. Publish & promote (via `tools/`)

Reuse the Dev Tool export/stage pipeline, promoted through the `tools/` deploy
flow that already ships the Next.js release (build artifact → preview CDN →
`aws s3 sync` to the production path).

Per platform (`ios`, `android`) for a release:

1. **Export** the production JS: `APP_VARIANT=production npx expo export
   --platform <p>` → `dist/`.
2. **Fingerprint:** `npx expo-updates fingerprint:generate --platform <p>` →
   the `runtime_version` (must match the store build; mind the same
   `.fingerprintignore` / `google-services.json` trap the Dev Tool hit —
   `docs/mobile-dev-tool-ota.md` §8).
3. **Stage** with `app/mobile/scripts/ota-stage.mjs` — content-addressed asset
   keys, `manifest.json`, asset/bundle files. Point `--base-url` at the
   production OTA CDN host. (The Dev Tool's multipart framing / `open.html` / QR
   bits aren't needed here; the backend does the framing + signing.)
4. **Upload** bundle + assets + `manifest.json` to the production CDN path
   `ota/prod/<update_id>/<platform>/` (immutable per `update_id`, so cache
   forever, no invalidation). `update_id` is the content-addressed manifest id
   `ota-stage.mjs` already derives.
5. **Flip the registry:** write/patch `releases.json` so the desired track(s)
   point at the new `update_id` for this `(runtime_version, platform)`.

The promote runs in `tools/` so it sits alongside the Next.js release and uses
the same AWS credentials / CDN. No signing happens here (the backend signs).

> **CDN routing:** the Dev Tool already serves `/ota/<sha>/…` from
> `couchers-dev-assets` via the `preview-viewer-request.js` host→prefix Lambda.
> Production bundles need a stable production host/prefix (e.g. a
> `ota.couchers.org` distribution, or a `prod` prefix on the existing bucket).
> Decide whether prod OTA assets share `couchers-dev-assets` or get their own
> bucket/distribution; either works, the manifest just bakes the chosen base URL
> into the asset URLs. The backend fetch of `manifest.json` (step 6 in §6) reads
> from the same place.

---

## 10. App-config changes (`app/mobile/`)

In `app.config.js`, **production (and staging) variants** — currently
`updates = { url: "https://u.expo.dev/fb4fc9aa-…" }`:

- Set `updates.url` to the backend endpoint, e.g.
  `https://api.couchers.org/mobile/ota/manifest` (staging →
  `https://dev-api.couchershq.org/mobile/ota/manifest`).
- Add `updates.codeSigningCertificate` (committed public PEM) +
  `updates.codeSigningMetadata` (§7).
- **Do NOT** set `disableAntiBrickingMeasures` — we keep anti-bricking (§2).
- Keep `runtimeVersion: { policy: "fingerprint" }`.
- The Dev Tool variant is untouched (it stays on the dev-launcher path).

In the app's JS startup (once, while authenticated): generate/persist `ota_id`,
call `RegisterOtaInstall(ota_id)`, and call
`setUpdateRequestHeadersOverride({ "x-couchers-ota-id": ota_id })` (§5).

`eas.json`: the `channel` fields (`production`, `staging`) are EAS-Update
concepts and become vestigial for self-hosted updates, like the Dev Tool's
`channel: "development"`. Harmless to leave; the backend keys on
`runtime_version` + `platform` + `track`, not channel.

---

## 11. Backend-down & safety behavior

- **Backend unreachable / errors:** the native update check fails; `expo-updates`
  keeps the currently-installed bundle (embedded or last good). Fail-open by
  construction — no backend dependency to *start* the app. (If the backend is
  down the app's API calls fail anyway, but at least it launches.)
- **Bad update that crashes on launch:** anti-bricking is **on** (we never set
  `disableAntiBrickingMeasures`), so `expo-updates` auto-rolls-back to the
  embedded bundle. We can also push a `rollBackToEmbedded` directive (§6) and/or
  flip the registry to a known-good `update_id`.
- **Fingerprint mismatch:** an update for a different `runtime_version` than the
  installed build is simply never served (registry is keyed by
  `runtime_version`), so a native-dependency change can't be shipped as JS-only.
- **CDN tamper / MITM:** the signed manifest commits to content hashes; tampered
  bundles/assets fail verification (§7).

---

## 12. Migration from EAS Update

`updates.url` is baked into each build. Existing installed production apps keep
checking `u.expo.dev` until users install a **new store build** that points at
our backend. So:

- The cutover is gradual and only affects builds shipped after this change.
- The first build pointing at our backend has some `runtime_version`; until a
  `stable` update is published for it, the backend returns `noUpdateAvailable`
  and the app runs its embedded bundle — fine.
- Keep the EAS Update project around until the old builds age out, or publish a
  final EAS update telling stragglers to update from the store.

---

## 13. Risks, gotchas & open items

- **Response-header path (§3) — RESOLVED.** Set via servicer initial metadata
  (`context.set_response_headers`); confirmed locally that Envoy forwards it as an
  HTTP response header. The route-scoped Envoy approach does not work (transcoder
  rewrites `:path` before routing).
- **Confirm the signing handshake on-device (§7).** Exact signing-string
  construction, the `expo-signature` part header format, and that signed
  directives are accepted. Follow `custom-expo-updates-server`; verify on a real
  iOS and Android release build (the Dev Tool only validated *unsigned*
  manifests).
- **Confirm `setUpdateRequestHeadersOverride` persistence (§5)** across cold
  starts on `expo-updates@29` — it's the documented use case, but verify the
  header actually rides the native auto-check after a kill/relaunch.
- **Background context for gating (§6).** Verify `make_background_user_context`
  is an acceptable input to `check_gate` / `get_feature_value` (it sets
  `user_id`; all contexts carry the `_growthbook` cache slot).
- **CDN host/bucket decision for prod assets (§9).** Shared `couchers-dev-assets`
  vs a dedicated production bucket/distribution.
- **Descriptor + proxy redeploy (§3).** The new route only appears after
  `make protos` regenerates `descriptors.pb` *and* the proxy image is rebuilt
  and redeployed.
- **Frequency / load.** Cold-start checks hit the backend; the manifest is tiny
  and `manifest.json` is cached by immutable `update_id`, but the `ota_id`
  lookup + GrowthBook eval run per check. Both are cheap; keep an eye on it.
- **`ota_id` privacy.** It's an opaque, non-credential rollout key sent on every
  check; document that it carries no account access and is rotated on reinstall.

---

## References

- Dev Tool counterpart (publish pipeline, protocol findings, fingerprint trap):
  `docs/mobile-dev-tool-ota.md`
- Expo Updates protocol v1 spec:
  https://docs.expo.dev/technical-specs/expo-updates-1/
- Custom updates server guide (signing, directives):
  https://docs.expo.dev/distribution/custom-updates-server/
- EAS Update override APIs (the override we use / the one we avoid):
  https://docs.expo.dev/eas-update/override/
- `HttpBody`-over-gRPC precedents: `app/proto/gis.proto` +
  `src/couchers/servicers/gis.py`; `app/proto/stripe.proto` +
  `src/couchers/servicers/donations.py` (`Stripe.Webhook`, header read)
- Request/response header access: `src/couchers/context.py` (`headers`,
  `_send_cookies`)
- Experimentation API: `src/couchers/experimentation.py` (`check_gate`,
  `get_feature_value`); background context: `make_background_user_context`
- Envoy transcoding + `Bugs` allowlist + descriptor build:
  `app/proxy/envoy.yaml`, `app/proxy/Dockerfile`, `app/generate_protos.sh`
- Bugs servicer (open, catch-all): `app/proto/bugs.proto`,
  `src/couchers/servicers/bugs.py`
- Publish/stage script: `app/mobile/scripts/ota-stage.mjs`
- App config / variants / current EAS Update URL: `app/mobile/app.config.js`,
  `app/mobile/eas.json`
- Override API source: `app/mobile/node_modules/expo-updates/src/Updates.ts`
</content>
</invoke>
