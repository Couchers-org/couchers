# Native OTA (production & staging)

How we ship JS-only over-the-air updates to the production and staging mobile apps from our own S3 + CloudFront, using the Expo Updates protocol. Only JS/asset changes ship this way; a native change (new dep, SDK bump, config change) bumps the build fingerprint and needs a new store build.

The per-branch **Dev Tool** previews are a separate mechanism (dev-launcher deep links, unsigned) — see `docs/mobile-dev-tool-ota.md`.

## How it works, end to end

1. **Build & sign (CI).** Per platform, CI runs `expo export`, computes the Expo fingerprint (the `runtimeVersion`), and stages the bundle + manifest with `ota-stage.mjs`. The manifest is code-signed (RSA-SHA256, PKCS#1 v1.5):
   - **Production** — signed by the `tools/` publish lambda; the private key never touches CI.
   - **Staging** — signed in CI on `develop` (`ota-sign.mjs`, key in `STAGING_OTA_PRIVATE_KEY`).
2. **Upload (CDN).** The signed manifest, `bundle.hbc`, and content-addressed assets go to `<cdn_root>/<version>/<platform>/`:
   - Production: `https://cdn.couchers.org/native/ota`
   - Staging: `https://next-static.couchershq.org/native/ota`

   `<version>` is an immutable per-release path segment (the release version, e.g. `v1.3.18355.fc38c23d`), so the CDN caches it forever.
3. **Roll out (flag).** A bundle goes live by setting the `native_ota_bundles` feature flag to `{ "ios"|"android": { "version", "runtime_version" } }`. Until then the uploaded bundle just sits on the CDN, unused. (Production sets this on publish; staging is manual for now.)
4. **Device check.** The app's `updates.url` is `<api>/native/ota/manifest` (prod `api.couchers.org`, staging `dev-api.couchershq.org`). On cold start `expo-updates` calls it, sending its platform and its own build's fingerprint.
5. **Apply.** If the endpoint returns a manifest, the device verifies the signature against the certificate embedded in the build, downloads the bundle and any new assets from the CDN, checks their hashes, and launches the update on next start. Anything that fails verification — or whose `runtimeVersion` doesn't match — is ignored.

## What `GET /native/ota/manifest` returns

The response is always protocol-v1 `multipart/mixed`, with the required `expo-protocol-version: 1` and `expo-sfv-version: 0` headers. The device's request carries `expo-platform` and `expo-runtime-version` (its build's fingerprint). There are two outcomes:

**1. A signed update manifest** — when `native_ota_bundles` has an entry for the device's platform whose `runtime_version` equals the request fingerprint. The endpoint returns the signed manifest stored on the CDN **byte-for-byte** (signature intact). The `manifest` part is:

```json
{
  "id": "<uuid>",
  "createdAt": "2026-05-31T03:33:07.673Z",
  "runtimeVersion": "<fingerprint>",
  "launchAsset": {
    "key": "...", "contentType": "application/javascript",
    "url": "https://cdn.couchers.org/native/ota/<version>/ios/bundle.hbc"
  },
  "assets": [
    { "key": "<md5>", "contentType": "image/png",
      "url": "https://cdn.couchers.org/native/ota/<version>/ios/assets/<md5>" }
  ],
  "metadata": {},
  "extra": { "expoClient": { "...": "public Expo config" } }
}
```

with an `expo-signature: sig="…", keyid="…", alg="rsa-v1_5-sha256"` header on that part (`keyid` is `main` for prod, `staging` for staging). The device no-ops if the manifest `id` matches the update it's already running.

**2. A `noUpdateAvailable` directive** — `{"type":"noUpdateAvailable"}` — when there's no published bundle for the platform, or its `runtime_version` doesn't match the device's fingerprint. The device keeps its current (or store-embedded) bundle.

## Safety properties

- **Fingerprint gating** — an OTA only reaches builds whose fingerprint matches the bundle's `runtime_version`, so a native change can never ship as JS-only.
- **Anti-bricking stays on** (we never set `disableAntiBrickingMeasures`): an update that crashes on launch auto-rolls-back to the store-embedded bundle.
- **Fail-open** — if the endpoint is unreachable, the check fails and the app keeps its current bundle.
- **Signing** — the signed manifest commits to the hashes of the bundle and every asset, so a tampered CDN object or MITM is rejected; the app trusts only its embedded certificate.

## See also

- Signing/publish: `tools/lambdas/deploy/common/native_ota.py` (prod), `app/mobile/scripts/ota-sign.mjs` (staging)
- Staging CDN root: set the backend's `native_ota_cdn_root` flag to `https://next-static.couchershq.org/native/ota`
- CI jobs: `app/.gitlab-ci.yml` (`build:mobile-ota-prod`, `build:mobile-ota-staging`, `deploy:mobile-ota-staging`)
- Manifest staging script: `app/mobile/scripts/ota-stage.mjs`
- Expo Updates protocol v1: https://docs.expo.dev/technical-specs/expo-updates-1/
