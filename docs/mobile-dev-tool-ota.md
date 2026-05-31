# Mobile Dev Tool — per-branch OTA previews

How anyone opens a specific mobile branch on a phone by scanning a QR in the PR — no per-branch App Store / TestFlight build, and no EAS Update. The Dev Tool is one installed **dev-client** app (`devtool` variant in `app/mobile/app.config.js`); a branch's prebuilt JS shell is served as a static Expo Updates manifest off our existing S3 + CloudFront.

This is a different mechanism from production/staging OTA (`docs/native-prod-ota.md`), which uses `expo-updates` proper against the backend and is code-signed. The Dev Tool loads through the dev launcher and is unsigned.

## How OTA reaches a dev client

A dev client **hard-disables the programmatic Updates API** — `fetchUpdateAsync`, `checkForUpdateAsync`, and the override setters all throw `NotAvailableInDevClientException`. So we can't swap branches by calling those at runtime. Instead, branches load through the **dev launcher's own load path** (the same machinery that loads a Metro server), handed a URL via a deep link:

```
couchers-devtool://expo-development-client/?url=<url-encoded manifest url>
```

The launcher probes the URL (a `HEAD` to classify, then a `GET` to fetch) sending `expo-platform`, `expo-runtime-version` (the installed build's fingerprint), `Expo-Updates-Environment: DEVELOPMENT`, and `Expo-Dev-Client-ID`. It does **not** send `expo-channel-name` and does **not** forward the `updates.requestHeaders` from app config — so the branch must be fully identified by the URL itself. That's why a static per-URL serve fits: every branch is a distinct, immutable URL.

## Why static and unsigned

- **The wire format is frozen.** The Expo Updates protocol is a published, versioned spec (`expo-protocol-version: 1`); the manifest shape and `multipart/mixed` framing don't drift with SDK upgrades, so generating the manifest ourselves isn't a moving target.
- **What's SDK-coupled isn't ours to write.** The fingerprint and JS bundle come from `expo export` / `@expo/fingerprint`, invoked from the same repo+lockfile that built the app, so both sides agree by construction.
- **Signing is unnecessary here.** Code signing only kicks in when app config sets `codeSigningCertificate`; its job is to stop a compromised server injecting JS into a production-signed app. For an internally distributed dev tool over HTTPS, TLS already covers that, so the Dev Tool drops signing. (Production/staging OTA do sign — see `docs/native-prod-ota.md`.)

## Manifest & fingerprint

The manifest is protocol-v1 `multipart/mixed` (a `manifest` part + an `extensions` part) with content-addressed `launchAsset` / `assets` URLs pointing back at the per-branch host. Full shape: see the protocol spec, or `docs/native-prod-ota.md` (same shape, minus the signature).

The safety net is the fingerprint: if the manifest's `runtimeVersion` doesn't match the installed build's fingerprint, the client **silently ignores** the update. A JS-only branch built from the same native config matches; a branch that changed native deps doesn't, and needs a fresh native build. The update is also content-addressed by `id`, so the client no-ops if it already runs that `id`.

## Infra: S3 + CloudFront

Branches are served as static files from the existing `couchers-dev-assets` S3 + CloudFront we already use for web previews — no OTA server. The per-branch host `<sha>--ota.preview.couchershq.org` maps to the `/ota/<sha>/` prefix in the bucket, and the edge adds the `expo-protocol-version: 1` (and `expo-sfv-version: 0`) response header the client requires on the manifest (S3 can't emit it, and the client rejects the manifest without it — confirmed on-device).

`<sha>` is the CI short commit SHA (URL-safe; branch names with slashes aren't). Per-SHA content is immutable, so CloudFront caches forever and no invalidation is ever needed. Layout:

```
ota/<sha>/<platform>/
  manifest        # multipart/mixed body, unsigned
  bundle.hbc
  assets/<hash>
```

## CI publish jobs (`app/.gitlab-ci.yml`)

Gated on `app/proto/**`, `app/mobile/**`, `app/scripts/**` changes (and always on `develop`):

- **`build:mobile-ota`** (`node:22`) — per platform: `APP_VARIANT=devtool expo export`, `expo-updates fingerprint:generate` for the `runtimeVersion`, `scripts/ota-stage.mjs` to build the manifest + multipart body (URLs rewritten to `<sha>--ota.preview.couchershq.org/<platform>/…`) + `open.html`, and `npx qrcode` for the deep-link QR (via `npx`, so it stays out of the fingerprint sources). SDK 54's export doesn't emit `expoConfig.json`, so `extra.expoClient` comes from `expo config --type public --json`.
- **`preview:mobile-ota`** (`aws-base`) — `aws s3 cp` the manifest (with its multipart content-type), `bundle.hbc`, `assets/`, `qr.png`, and `open.html` to `s3://couchers-dev-assets/ota/<sha>/<platform>/`.
- **`preview:pr-comment`** (`python:3.12-slim`) — `needs:` the upload job so links are live, then `app/scripts/pr_preview_comment.py` posts/updates the sticky PR comment. No-ops if there's no token or open PR.

## App config — `devtool` variant only

- **Keep** `runtimeVersion: { policy: "fingerprint" }` and `updates.enabled: true`.
- **A `url` is baked in** (`https://dev-api.couchershq.org/native/ota/manifest`). It's a formality — branches load via the deep link, which overrides it, and `developmentClient: true` boots to the launcher anyway — but `expo-updates` only produces a valid embedded config (exposing a `runtimeVersion`) when a URL is present; without it the launcher's published-update load path fails to parse the multipart manifest.
- **`app/mobile/.fingerprintignore`** excludes `google-services.json`, `**/eas-environment-secrets/**`, and `build-version.json` — these are present on EAS builds but absent in CI/local, and would otherwise make the EAS client's fingerprint diverge from the OTA bundles' so updates never match.
- **No `codeSigningCertificate`** (unsigned — see above).
- **Stays a dev client** (`developmentClient: true`).

## PR comment + QR

`preview:pr-comment` posts one sticky comment per PR (`<!-- couchers-preview-bot -->`), assembled from sections. The RN-shell OTA section has, per platform: a **QR** encoding the dev-launcher deep link (scan to open the branch in the installed Dev Tool); an **Open in Dev Tool** link that targets the hosted `open.html` (GitHub strips custom-scheme hrefs, so `open.html` `location.replace`s to the deep link on the device); and the raw deep link in a `<details>` block.

The web/API axis (repointing the in-app WebView via `couchers-devtool://dev-settings?api=…&web=…`) is orthogonal and can be added as another section.

## Native rebuilds — the fingerprint-change case

OTA only covers changes that don't move the fingerprint. Native deps, `app.config.js`, or an SDK bump change it, and the dev client then ignores every branch bundle — those need a fresh native Dev Tool client, automated and gated on the fingerprint actually changing:

**`build:devtool-native`** (`node:22`) runs on `DEVTOOL_BUILD_BRANCH` (`develop`). Per platform via `scripts/devtool-build.sh`: compute the fingerprint, compare to the last-built marker at `s3://$AWS_PREVIEW_BUCKET/devtool-builds/<platform>.fingerprint`, and on a change build on EAS — **iOS** → `eas build --profile devtool --auto-submit` → TestFlight; **Android** → `eas build --profile devtool-apk` → a sideloadable APK CI publishes to `s3://$AWS_PREVIEW_BUCKET/devtool-builds/android/` (Play has no TestFlight equivalent for a dev-client APK). The marker is written **only after** a successful build (and Android publish), so a failure retries next pipeline. Needs the `EXPO_TOKEN` CI variable; no Play credentials (Android is self-hosted). See `app/mobile/README.md` → *Releasing a new Dev Tool build*.

## References

- Expo Updates protocol v1: https://docs.expo.dev/technical-specs/expo-updates-1/
- Production/staging counterpart: `docs/native-prod-ota.md`
- App config / variants: `app/mobile/app.config.js`, `app/mobile/eas.json`, `app/mobile/.fingerprintignore`
- Staging script + PR comment: `app/mobile/scripts/ota-stage.mjs`, `app/scripts/pr_preview_comment.py`
- CI jobs: `app/.gitlab-ci.yml` (`build:mobile-ota`, `preview:mobile-ota`, `preview:pr-comment`, `build:devtool-native`)
