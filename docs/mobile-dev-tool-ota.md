# Mobile Dev Tool — per-branch OTA previews

How we let anyone open a specific mobile branch on a phone by scanning a QR in
the PR, **without** an App Store / TestFlight build per branch, and without
paying for EAS Update.

**Status:** design decided, implementation in progress. Scope is the **Dev Tool
build only** — never production.

This supersedes the earlier exploration in `tools/lambdas/expo-ota.md` (which
weighed a hand-rolled edge function vs. the `expo-open-ota` server). We evaluated
deploying `expo-open-ota` at `ota.couchershq.org`, then concluded a **static**
serve off our existing S3 + CloudFront is simpler for a dev-only tool. The
reasoning and the source-level findings that justify it are recorded below.

---

## 1. What the Dev Tool has to do

The Dev Tool (`devtool` variant in `app/mobile/app.config.js`, `devtool` profile
in `app/mobile/eas.json`) is one installed app that must do **all** of the
following at once, because that's how it earns its keep across the whole team:

| Workflow | Share of work | How it's served |
| --- | --- | --- |
| **Local Metro live-reload** — point the installed app at a dev's `expo start` for instant reload, no per-device native build | ~95% of dev work | dev launcher loads a Metro URL |
| **Web preview** — repoint the in-app WebView at a Vercel branch URL | ~65% of PRs | in-app dev settings (`config/urls.ts` override) |
| **RN-shell OTA** — load a branch's prebuilt JS shell (Expo Router screens, `WebEmbed`, nav) | ~30% of PRs | dev launcher loads our manifest URL ← **this doc** |
| **Native change** — new native module / dep | ~5% | full native build by senior staff (they build anyway) |

Two consequences drive the whole design:

1. **It must stay a dev client** (`developmentClient: true`). The live-reload
   workflow is the Dev Tool's main reason to exist; that requires the dev
   launcher. So the OTA mechanism has to work *inside a dev client*, not assume a
   release build.
2. **The web axis and the RN-shell axis are orthogonal.** The RN shell is the
   native-JS bundle (delivered OTA); the web/API target the WebView loads is set
   separately at runtime via the existing dev-settings override. A QR can carry
   one, the other, or both.

---

## 2. Key finding: how OTA reaches a dev client

A dev client **hard-disables the programmatic Updates API**. In
`expo-updates`, `UpdatesDevLauncherController` throws
`NotAvailableInDevClientException` for `fetchUpdateAsync`, `checkForUpdateAsync`,
`setUpdateURLAndRequestHeadersOverride`, and `setUpdateRequestHeadersOverride`.
So we **cannot** swap branches by calling those at runtime.

Instead, branches load through the **dev launcher's own load path**
(`EXDevLauncherController.loadApp`) — the *same* machinery that loads a Metro
server. You hand it a URL via the deep link:

```
couchers-devtool://expo-development-client/?url=<url-encoded target>
```

where the target is **either** a Metro URL (live reload) **or** one of our
manifest URLs (branch OTA). The launcher probes the URL
(`EXDevLauncherManifestParser`): a `HEAD` to classify it, then a `GET` to read
the manifest, then it loads the update via `fetchUpdateWithConfiguration`.

**What the launcher sends on those requests** (from
`EXDevLauncherUpdatesHelper.m` / `DevLauncherUpdatesHelper.kt` /
`EXDevLauncherManifestParser.m`):

- `expo-platform: ios|android`
- `Expo-Updates-Environment: DEVELOPMENT`
- `Expo-Dev-Client-ID: <installation id>`
- `expo-runtime-version: <the installed build's fingerprint>`
- `accept: application/expo+json,application/json`

**What it does NOT send:** `expo-channel-name`. It also does **not** forward the
`updates.requestHeaders` configured in `app.config.js`. Therefore **the branch
must be fully identified by the URL itself** — we cannot rely on a channel
header or on channel→branch resolution. This is *why* a static per-URL serve fits
the dev-client model perfectly: every branch is just a distinct, immutable URL.

> This is also why deploying `expo-open-ota` as-is did not work for the dev
> client: its `/manifest` handler reads the channel **only** from the
> `expo-channel-name` header (no path/query fallback) and 400s without it, and
> the launcher never sends that header. We'd have had to patch the server.

---

## 3. Why static — no OTA server, no code signing

- **The wire format is frozen.** The Expo Updates protocol is a published,
  versioned spec ("v1", pinned by the `expo-protocol-version` header). The
  manifest shape, the `multipart/mixed` framing, the request headers, and the
  signing scheme don't drift with Expo SDK upgrades. Multiple independent servers
  (`expo-open-ota`, `xavia-ota`, Expo's own `custom-expo-updates-server` example)
  interoperate with shipping apps precisely because it's stable. So generating
  the manifest ourselves is not a moving-target maintenance burden.
- **What *is* SDK-coupled isn't ours to write.** The fingerprint
  (`runtimeVersion`) and the JS bundle are produced by `expo export` /
  `@expo/fingerprint`, which we invoke from the same repo+lockfile that built the
  app — so both sides agree by construction. We call a CLI; we don't reimplement
  it.
- **Signing is the easy part, and unnecessary here.** Code signing only kicks in
  when `app.config.js` sets `codeSigningCertificate`. Its job is to stop a
  compromised server injecting malicious JS into a *production-signed* app. For an
  internally distributed dev/QA tool fetching branch bundles over HTTPS, TLS
  already covers that threat. So we **drop signing for the Dev Tool** and serve
  plain manifests. (Signing comes back if/when prod OTA is on the table — see §10.)

Net: the OTA server's value was convenience (`eoas publish`, channel mapping,
dashboard, rollback), not protocol correctness. For one dev-only flow, a small CI
script + the S3/CloudFront we already run is fewer moving parts.

---

## 4. The Expo Updates protocol, minimally

**Request:** `GET <url>` with the headers in §2.

**Response — the manifest** (protocol v1, served as one `multipart/mixed` part;
the JSON body shape):

```json
{
  "id": "<uuid for this update>",
  "createdAt": "2026-05-23T12:00:00.000Z",
  "runtimeVersion": "<fingerprint — must match the request>",
  "launchAsset": {
    "key": "bundle-<hash>",
    "contentType": "application/javascript",
    "url": "https://<sha>--ota.preview.couchershq.org/ios/bundle.hbc"
  },
  "assets": [
    { "key": "<hash>", "contentType": "image/png",
      "url": "https://<sha>--ota.preview.couchershq.org/ios/assets/<hash>" }
  ],
  "metadata": {},
  "extra": { "expoClient": { "...": "from dist/expoConfig.json" } }
}
```

The update is **content-addressed**: the client compares the manifest `id`
against what it's running and no-ops if equal. Crucially, if
`runtimeVersion` does **not** match the installed build's fingerprint, the client
**ignores the update**. That is our safety net — a branch that changed native
deps has a different fingerprint and simply won't load OTA (it needs a native
build, the 5% case).

---

## 5. Reusing the dev-assets infra

We already serve web previews from S3 + CloudFront via two Lambda@Edge functions
(must stay in `us-east-1`, where the bucket and functions already live):

- `tools/lambdas/preview-viewer-request.js` — **host → S3 key prefix.**
  `resolvePath(host)` maps `next.couchershq.org → /web/develop`, and
  `<a>--<b>.preview.couchershq.org → /<b>/<a>`, then prepends that folder to the
  request URI.
- `tools/lambdas/preview-origin-response.js` — SPA 404 → `index.html` fallback.

**OTA slots into the existing viewer-request with zero changes.** Pick the host
pattern `<sha>--ota.preview.couchershq.org`:

- `resolvePath("<sha>--ota.preview.couchershq.org")` → `db1=<sha>`, `db2=ota` →
  `/ota/<sha>`.
- A request for `/ios/manifest` becomes S3 key `/ota/<sha>/ios/manifest`.
- The web-SPA special-case (`folder.startsWith("/web/")`) doesn't fire for
  `/ota/...`, and root→`preview.txt` doesn't apply. So it just works.

`<sha>` is the **git commit SHA** the CI job published (URL-safe; branch names
with slashes are not). Humans never type it — the PR comment encodes the full URL
in a QR.

**Per-SHA content is immutable** → CloudFront can cache forever and **no
invalidation is ever needed**. (This is the big simplification over a mutable
`latest.json` pointer.)

### Platform: one URL or two?

A manifest is per-platform (one `launchAsset`). Two options:

- **No Lambda change (start here):** publish both platforms and use
  platform-specific URLs — `/ios/manifest` and `/android/manifest`. The PR
  comment renders an iOS QR and an Android QR.
- **One-URL nicety (optional):** extend the viewer-request Lambda so that when
  `db2 === "ota"` it reads the `expo-platform` request header and rewrites to
  `/ota/<sha>/<platform>/manifest`. Then a single QR works on both. Small, isolated
  change (gated on the `ota` host), but requires CloudFront to forward
  `expo-platform` to the function.

### Manifest response headers / framing

Target protocol v1: store the manifest object as a `multipart/mixed` body with
`Content-Type: multipart/mixed; boundary=<b>` (set at upload via
`aws s3 cp --content-type`). S3 cannot emit a real `expo-protocol-version: 1`
response header on its own — if the client requires it, add a tiny
**origin-response Lambda@Edge** that injects it, mirroring
`preview-origin-response.js`.

> ⚠️ **Empirical check (do this on-device before finalizing):** confirm what
> `expo-updates ~29` (SDK 54) actually requires from the dev-launcher load path.
> If it accepts a protocol-0 `application/expo+json` JSON manifest, we can skip
> the origin-response Lambda entirely. If it demands v1 multipart + the response
> header, add the one-function origin-response Lambda. The failure mode is a
> generic "Couldn't parse the manifest" alert with no detail, so test early.

---

## 6. S3 layout (in the existing `couchers-dev-assets` bucket)

```
ota/
  <sha>/                      # git commit SHA — immutable
    ios/
      manifest                # multipart/mixed body, no signature
      bundle.hbc
      assets/<hash>
    android/
      manifest
      bundle.hbc
      assets/<hash>
```

All asset/bundle URLs baked into the manifest point back at
`https://<sha>--ota.preview.couchershq.org/<platform>/...`, served as plain files.

---

## 7. CI publish job

A job (GitLab CI, gated on `app/mobile/**` changes; or a GitHub Action under
`tools/.github/workflows/` reusing the existing Lambda-deploy AWS creds pattern)
that, per mobile PR:

1. For each platform: `APP_VARIANT=devtool npx expo export --platform <p>` →
   `dist/` (bundle at `dist/_expo/static/js/<p>/index-<hash>.hbc`,
   `dist/assets/<hash>`, `dist/metadata.json`, `dist/expoConfig.json`).
2. Compute the fingerprint `runtimeVersion` (`npx @expo/fingerprint` /
   `npx expo-updates fingerprint:generate --platform <p>` — verify the exact
   invocation for our toolchain). It must equal the installed Dev Tool build's
   fingerprint.
3. Generate the manifest from `metadata.json` + `expoConfig.json`: mint a UUID
   `id`, set `runtimeVersion`, compute each asset's base64url SHA-256, and rewrite
   every path to its `<sha>--ota.preview.couchershq.org` URL. Wrap as
   `multipart/mixed`.
4. `aws s3 cp` the bundle, assets, and manifest under `ota/<sha>/<platform>/`,
   with correct `--content-type` on each.
5. No CloudFront invalidation needed (immutable keys).
6. Post / update the PR comment with the QR(s) — see §9.

---

## 8. App-config (launcher) changes

In `app/mobile/app.config.js`, **devtool variant only**:

- **Keep** `runtimeVersion: { policy: "fingerprint" }` and `updates.enabled: true`
  (the launcher uses the fingerprint to gate updates).
- **Remove** `codeSigningCertificate` + `codeSigningMetadata` (no signing — §3).
  Correspondingly revert the `.gitignore` exception and the committed
  `certs/certificate.pem`; they were for the server approach.
- The per-branch update URL is supplied **at load time** via the deep link, not
  baked into config. An embedded `updates.url` is only the launch-time default;
  for the Dev Tool we want it to boot to the launcher/menu, and branch loads come
  from the QR.
- **Stay a dev client** (`developmentClient: true`) — do not flip to a release
  build.

`eas.json`'s `channel: "development"` on the devtool profile is vestigial for the
static approach (channels only matter for EAS Update) but harmless.

Production and staging stay on EAS Update (`u.expo.dev`) untouched.

---

## 9. PR comment + QR

The phone camera opens a custom-scheme deep link; the existing
`app/mobile/dev-url-qr.html` already proves this pattern for the web/API axis.
Per PR, the comment renders QR(s) by change type:

- **Web-only PR** → set the WebView target, no OTA:
  `couchers-devtool://dev-settings?api=<dev-api>&web=<vercel preview url>`
  (handled by `app/mobile/app/dev-settings.tsx` → `config/urls.ts` override,
  persisted in AsyncStorage).
- **RN-shell PR** → load the branch bundle:
  `couchers-devtool://expo-development-client/?url=<encoded manifest url>`
  (`https://<sha>--ota.preview.couchershq.org/<platform>/manifest`), one QR per
  platform unless the one-URL Lambda nicety (§5) is in place.

The two axes compose: scanning the RN-shell QR loads the branch's native shell;
the WebView inside it uses whatever web/API override is persisted (or the
devtool's configured `EXPO_PUBLIC_WEB_BASE_URL`). To pin both, set the
dev-settings link first, then load the bundle.

---

## 10. Constraints, gotchas, open items

- **Fingerprint match is the #1 failure cause.** The exported `runtimeVersion`
  must equal the installed Dev Tool build's, or the client silently ignores the
  update. JS-only branches built from the same native config match
  deterministically; native changes don't (by design — the safety net).
- **CloudFront must forward the `expo-*` headers** to origin/function as needed,
  and not cache the manifest keyed in a way that ignores platform. Per-SHA keys
  are immutable, so caching is otherwise free.
- **Empirical checks remaining:** (a) the protocol/response-header question in §5;
  (b) confirm the launcher accepts our static manifest end-to-end on a real
  device against the bucket; (c) the exact `@expo/fingerprint` invocation for our
  toolchain.
- **Going to production (out of scope now):** would add code signing (private key
  signs manifests, build embeds the public cert), staged rollouts, and instant
  rollback (protocol v1 directives). At that point reconsider `expo-open-ota`
  rather than growing the edge functions — it provides channels, rollouts,
  rollback, and signing out of the box and can use the same bucket.

---

## References

- Expo Updates protocol spec: https://docs.expo.dev/technical-specs/expo-updates-1/
- Custom updates server guide: https://docs.expo.dev/distribution/custom-updates-server/
- `expo-open-ota` (evaluated, not adopted for the dev tool): https://github.com/axelmarciano/expo-open-ota
- Earlier exploration: `tools/lambdas/expo-ota.md`
- Existing edge functions: `tools/lambdas/preview-viewer-request.js`, `tools/lambdas/preview-origin-response.js`
- App config / channels: `app/mobile/app.config.js`, `app/mobile/eas.json`
- In-app web/API override: `app/mobile/config/urls.ts`, `app/mobile/app/dev-settings.tsx`
- QR pattern precedent: `app/mobile/dev-url-qr.html`
- Dev-launcher load path (source): `app/mobile/node_modules/expo-dev-launcher/ios/EXDevLauncherController.m`, `.../EXDevLauncherUpdatesHelper.m`, `.../Manifest/EXDevLauncherManifestParser.m`, `.../android/.../helpers/DevLauncherUpdatesHelper.kt`
- Dev-client API disablement (source): `app/mobile/node_modules/expo-updates/.../UpdatesDevLauncherController.kt`
