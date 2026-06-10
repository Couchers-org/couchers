# Mobile Dev Tool — per-branch OTA previews

How we let anyone open a specific mobile branch on a phone by scanning a QR in
the PR, **without** an App Store / TestFlight build per branch, and without
paying for EAS Update.

**Status:** implemented. iOS validated end-to-end on a real device against the
real S3 + CloudFront (2026-05-24); the Android publish pipeline is live, with
on-device Android validation still pending. Scope is the **Dev Tool build only** —
never production.

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
  "extra": { "expoClient": { "...": "from `npx expo config --type public --json`" } }
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

- **No Lambda change (implemented):** publish both platforms and use
  platform-specific URLs — `/ios/manifest` and `/android/manifest`. The PR
  comment renders an iOS section and an Android section, each with its own QR.
- **One-URL nicety (optional):** extend the viewer-request Lambda so that when
  `db2 === "ota"` it reads the `expo-platform` request header and rewrites to
  `/ota/<sha>/<platform>/manifest`. Then a single QR works on both. Small, isolated
  change (gated on the `ota` host), but requires CloudFront to forward
  `expo-platform` to the function.

### Manifest response headers / framing

**CONFIRMED on-device** (SDK 54 / `expo-updates ~29`, iOS dev client, 2026-05-23,
served from a local static-mimicking server over plain HTTP):

The dev launcher load is a two-step request to the manifest URL:

1. `HEAD <url>` — classification probe. Sends `accept: application/expo+json,application/json`,
   `expo-platform`, `Expo-Dev-Client-ID`. We answer non-2xx (`405`) so it's treated
   as a published-manifest URL, not a Metro dev server.
2. `GET <url>` — the actual update fetch. Sends
   `accept: multipart/mixed,application/expo+json,application/json`,
   `expo-protocol-version: 1`, `expo-platform`, `expo-runtime-version: <fingerprint>`,
   `Expo-Updates-Environment: DEVELOPMENT`, `Expo-Dev-Client-ID`, `eas-client-id`.
   No `expo-channel-name`. No `expo-expect-signature`.

So the client wants **protocol v1 `multipart/mixed`** (a `manifest` part + an
`extensions` part) — *not* plain JSON. We serve it with
`content-type: multipart/mixed; boundary=<b>`, `expo-protocol-version: 1`,
`expo-sfv-version: 0`. The fingerprint in `expo-runtime-version` must equal the
manifest's `runtimeVersion` or the update is silently ignored. No signature is
requested, so unsigned manifests load. Cleartext HTTP is accepted by the dev
client (no ATS block) — production uses HTTPS via CloudFront anyway.

For S3: the multipart body is a static file uploaded with
`--content-type "multipart/mixed; boundary=<b>"` (boundary baked in CI, matching
the body). S3 cannot emit the `expo-protocol-version: 1` *response header* on its
own, and **that header is required** — CONFIRMED on-device: serving the exact same
multipart body with only the content-type (no `expo-protocol-version` /
`expo-sfv-version`) makes the client reject the manifest before fetching anything
("failed to load app from …"); it does not infer the protocol from the content-type.

So the manifest response needs the header injected at the edge. The existing
`tools/lambdas/preview-origin-response.js` Lambda@Edge now adds
`expo-protocol-version: 1` (and `expo-sfv-version: 0`) on responses whose key is
the OTA manifest (`/ota/<sha>/<platform>/manifest`) — scoped by path, mirroring its
`/web/` branch, so web previews are unaffected. This reuses infra we already
deploy; no new function. (A CloudFront response-headers policy also works but
attaches per cache behavior, so it can't scope by path/host as cleanly given the
host→prefix routing lives in the viewer-request Lambda.)

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

## 7. CI publish jobs

Implemented as three GitLab CI jobs in `app/.gitlab-ci.yml`, gated on
`app/proto/**`, `app/mobile/**`, `app/scripts/**` changes (and always on the
`develop` release branch). The GitHub Action option was dropped in favour of
keeping everything in the existing GitLab pipeline, so the comment job can `needs:`
the upload job and only post once the links are live.

**`build:mobile-ota-devtool`** (`node:22`) — for each platform in `OTA_PLATFORMS`
(`ios android`):

1. `APP_VARIANT=devtool npx expo export --platform <p>` → `dist/` (bundle, assets,
   and `dist/metadata.json` listing the bundle + each asset's `{path, ext}`). SDK
   54's export does **not** emit `dist/expoConfig.json`, so the public config comes
   from `npx expo config --type public --json` (`ota-expo-config.json`) for
   `extra.expoClient`.
2. `npx expo-updates fingerprint:generate --platform <p>` → `.hash` for
   `runtimeVersion`. Must equal the installed Dev Tool build's fingerprint — see §8
   on `.fingerprintignore`.
3. `node scripts/ota-bundle.mjs` builds the manifest from `metadata.json` +
   `ota-expo-config.json`: content-addressed asset keys (base64url SHA-256),
   rewrites every URL to `<sha>--ota.preview.couchershq.org/<platform>/…`, and
   writes both the `manifest.json` object and the protocol-v1 `multipart/mixed`
   `manifest` body (+ its `manifest.content-type`). On non-`develop` branches the
   branch's Vercel preview URL (resolved by `scripts/vercel-preview-url.mjs`) is
   injected as `extra.expoClient.extra.otaWebBaseUrl` (§9).
4. `node scripts/ota-open-page.mjs` writes `open.html`, an https redirect to the
   dev-launcher deep link (see §9).
5. `npx --yes qrcode` renders `qr.png` encoding the deep link. Using `npx` (not a
   `package.json` dep) keeps `qrcode` out of the fingerprint sources.

**`preview:mobile-ota-devtool`** (`aws-base`) — `aws s3 cp` the `manifest` (with its
multipart content-type), `bundle.hbc`, `assets/`, `qr.png`, and `open.html` to
`s3://couchers-dev-assets/ota/<sha>/<platform>/`. No CloudFront invalidation
(immutable keys).

**`preview:pr-comment-stub`** (`python:3.14-slim`, `needs: []`) — runs at the
very start of every non-`develop` branch pipeline and posts the sticky comment
as a "previews are building" placeholder within seconds of the push.

**`preview:pr-comment`** (`python:3.14-slim`) — `needs:` the stub job plus the
upload job (the latter `optional:`, since the job runs for every branch
pipeline, not just mobile ones), then runs `app/scripts/pr_preview_comment.py`
to replace the placeholder with the real sections (§9). Sections are included
only when their preview exists (the web link is the commit's per-deployment
URL and may still be building when posted); when nothing exists, the comment
says so. No-ops if `GITHUB_PREVIEW_TOKEN` is unset or there's no open PR, so
it never reds the pipeline.

---

## 8. App-config (launcher) changes

In `app/mobile/app.config.js`, **devtool variant only**:

- **Keep** `runtimeVersion: { policy: "fingerprint" }` and `updates.enabled: true`
  (the launcher uses the fingerprint to gate updates).
- **Add `app/mobile/.fingerprintignore`** excluding `google-services.json` and
  `**/eas-environment-secrets/**`. The devtool build receives `google-services.json`
  only as an EAS file env secret (`GOOGLE_SERVICES_JSON`, preview environment), so
  it's present on EAS builds but absent locally and in CI. Expo hashes it into the
  fingerprint by **contents** (`@expo/fingerprint` tags it
  `expoConfigExternalFile:contentsOnly`), which made the runtime version diverge
  between the EAS-built client and our local/CI computation — the client would then
  ignore every OTA. The ignore drops it everywhere (ignored sources get a null hash
  and are skipped entirely), so the fingerprint is reproducible without the secret.
  The native build still uses the file normally; a Firebase/FCM config change needs
  a fresh native build regardless. The secret is write-only on EAS, so it can't be
  pulled to reproduce locally — exclusion is the only no-secret-distribution fix.
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

Staging and production have since moved off EAS Update onto the same self-hosted
static pipeline (`build:mobile-ota-staging` / `build:mobile-ota-prod` in
`app/.gitlab-ci.yml`; see `docs/native-prod-ota.md`).

---

## 9. PR comment + QR

`preview:pr-comment` posts one **sticky** comment per PR (marked with the HTML
comment `<!-- couchers-preview-bot -->`; `app/scripts/pr_preview_comment.py`
resolves the PR from the commit SHA via the GitHub API, then upserts the comment).
It's assembled from **sections**, so more previews (web, coverage, …) can be
appended as the pipeline grows.

**Implemented today — the RN-shell OTA section**, one block per platform with:

- a **QR** (`qr.png`) encoding the dev-launcher deep link
  `couchers-devtool://expo-development-client/?url=<encoded manifest url>`
  (`https://<sha>--ota.preview.couchershq.org/<platform>/manifest`) — scan with the
  phone camera to open the branch directly in the installed Dev Tool;
- a clickable **Open in Dev Tool** link. GitHub's comment sanitiser strips
  custom-scheme (`couchers-devtool://`) hrefs, so the link targets the hosted
  `open.html` (https), which `location.replace`s to the deep link on the device;
- the raw deep link in a `<details>` block for copy/paste.

**The web axis — wired through the manifest.** The OTA build job resolves the
commit's Vercel preview URL via the Vercel API
(`app/mobile/scripts/vercel-preview-url.mjs`: the commit's own immutable
per-deployment URL, assigned within seconds of the push while the build still
runs, falling back to the branch's latest READY deployment; needs
`VERCEL_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID` in CI, and skips
cleanly without them)
and injects it into the manifest as `extra.expoClient.extra.otaWebBaseUrl`
(`ota-bundle.mjs --web-base-url`; only the devtool branch-preview job passes the
flag, never staging/prod/develop). When the Dev Tool loads such a bundle,
`config/urls.ts` treats it as the effective default web URL, so the WebView
points at the branch's web preview with no extra taps. Precedence: explicit
dev-settings override → manifest `otaWebBaseUrl` → build env default; manual
repointing via `couchers-devtool://dev-settings?api=<url>&web=<url>`
(`app/mobile/app/dev-settings.tsx`, persisted in AsyncStorage) still works and
wins over the manifest.

The PR comment gains a **Web preview** section with the same link, resolved
Python-side in `pr_preview_comment.py` (mirror of the `.mjs` resolver). Each
section is included only when its preview is actually live (HEAD on the OTA
manifest / Vercel API lookup), and the job runs for every branch pipeline —
backend-only PRs get an honest "no previews" comment. Vercel's own PR comments
are silenced in the Vercel dashboard (project → Settings → Git → Connected
Git Repository toggles); the `github.silent` vercel.json property is
deprecated and doesn't work, so the repo carries no vercel.json.

---

## 10. Constraints, gotchas, open items

- **Fingerprint match is the #1 failure cause.** The exported `runtimeVersion`
  must equal the installed Dev Tool build's, or the client silently ignores the
  update. JS-only branches built from the same native config match
  deterministically; native changes don't (by design — the safety net). One real
  trap hit in practice: config files supplied only as EAS file env secrets (e.g.
  `google-services.json`) are hashed into the fingerprint on EAS but absent
  locally/in CI — handled by `.fingerprintignore` (§8).
- **CloudFront must forward the `expo-*` headers** to origin/function as needed,
  and not cache the manifest keyed in a way that ignores platform. Per-SHA keys
  are immutable, so caching is otherwise free.
- **Empirical checks — mostly resolved (2026-05-23, on a real iOS dev client):**
  (a) framing is v1 `multipart/mixed` — see §5 (resolved); (b) end-to-end load
  confirmed against a static-mimicking local server: manifest → bundle → all assets
  downloaded, the JS bundle ran and rendered, and a JS edit re-exported with a new
  manifest `id` hot-reloaded onto the device (only `bundle.hbc` re-downloaded,
  unchanged assets stayed cached) (resolved); (c) fingerprint command is
  `npx expo-updates fingerprint:generate --platform <p>` → `.hash`; the device's
  `expo-runtime-version` matched the value computed from the tree (resolved).
  The `expo-protocol-version: 1` *response header* is **required** (§5 — confirmed:
  without it the client rejects the manifest before fetching). The full iOS
  end-to-end run against the real S3 bucket + CloudFront, with the header injected
  by the deployed `preview-origin-response.js`, also succeeded (2026-05-24).
  **Remaining:** the same on-device validation for **Android** — the publish
  pipeline is live, but no Android Dev Tool client has loaded a branch OTA yet.
- **Open: `otaWebBaseUrl` end-to-end on device.** `config/urls.ts` reads the
  loaded update's `extra.expoClient.extra.otaWebBaseUrl` via
  `Constants.expoConfig`. That assumes expo-constants reflects the
  dev-client-loaded manifest's `extra.expoClient` (the path EAS Update uses to
  deliver config changes) rather than the embedded build config. Verify once on
  a real device: load a branch bundle whose PR has a Vercel deployment and check
  the dev settings screen shows the Vercel URL as the web default.
- **Going to production (out of scope now):** would add code signing (private key
  signs manifests, build embeds the public cert), staged rollouts, and instant
  rollback (protocol v1 directives). At that point reconsider `expo-open-ota`
  rather than growing the edge functions — it provides channels, rollouts,
  rollback, and signing out of the box and can use the same bucket.

---

## 11. Native rebuilds — the 5% fingerprint-change case

OTA covers everything that *doesn't* change the fingerprint. The complement —
native deps, `app.config.js`, an Expo SDK bump — changes the fingerprint, and the
dev client then **silently ignores** every branch bundle (§4 safety net). Those
need a fresh native Dev Tool client. That rebuild is automated, gated on the
fingerprint actually changing so it doesn't fire on JS-only commits:

- **`build:mobile-native-devtool`** (`app/.gitlab-ci.yml`, `node:22`) runs on
  `$DEVTOOL_BUILD_BRANCH` (`mobile/v1.1.20` while validating; point at `develop`
  once trusted). For each platform it calls **`scripts/devtool-build.sh`**, which:
  1. computes the fingerprint with `npx expo-updates fingerprint:generate`
     (`APP_VARIANT=devtool`, so it matches the EAS build — same `.fingerprintignore`
     as §8);
  2. compares it to the last-built fingerprint stored at
     `s3://$AWS_PREVIEW_BUCKET/devtool-builds/<platform>.fingerprint`;
  3. on a change, builds on EAS (GitLab only triggers it; no macOS/Android runners):
     - **iOS** → `eas build --profile devtool --auto-submit` → **TestFlight**.
     - **Android** → `eas build --profile devtool-apk` → a sideloadable **APK**,
       which CI downloads and publishes to `s3://$AWS_PREVIEW_BUCKET/devtool-builds/android/`
       (an immutable `couchers-devtool-<sha>.apk` plus a stable `index.html` devs
       bookmark at `https://android--devtool-builds.$PREVIEW_DOMAIN/`). Google Play
       has **no TestFlight-equivalent** for a dev-client APK — Play distributes AABs
       through release tracks, not installers — so we host the APK ourselves.
  4. writes the new fingerprint to the marker **only after** the build (and, for
     Android, the publish) succeeds, so a failed build retries on the next pipeline
     rather than being marked done.
- The build waits to completion (these are rare) so the marker is only advanced on
  success. Per-platform markers because iOS and Android fingerprints differ.
- **Prerequisites:** the `EXPO_TOKEN` CI variable (build + submit scope). No Play
  credentials are needed — Android is self-hosted. See `app/mobile/README.md` →
  *Releasing a new Dev Tool build*.

This is the missing half of the loop: OTA serves JS branches against an installed
client; this keeps that installed client's native layer current so OTA stays
loadable.

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
- CI publish jobs: `app/.gitlab-ci.yml` (`build:mobile-ota-devtool`, `preview:mobile-ota-devtool`, `preview:pr-comment`)
- Manifest/bundle layout: `app/mobile/scripts/ota-bundle.mjs`; `open.html`
  redirect: `app/mobile/scripts/ota-open-page.mjs` (QR is rendered in CI)
- PR comment generator: `app/scripts/pr_preview_comment.py`
- Fingerprint exclusion: `app/mobile/.fingerprintignore`
- Dev-launcher load path (source): `app/mobile/node_modules/expo-dev-launcher/ios/EXDevLauncherController.m`, `.../EXDevLauncherUpdatesHelper.m`, `.../Manifest/EXDevLauncherManifestParser.m`, `.../android/.../helpers/DevLauncherUpdatesHelper.kt`
- Dev-client API disablement (source): `app/mobile/node_modules/expo-updates/.../UpdatesDevLauncherController.kt`
