# Couchers Mobile App

React Native mobile app built with [Expo](https://expo.dev). We maintain three separate apps (staging, production, and a development tool) that can coexist on the same device with different bundle IDs and API endpoints.

## Table of Contents

1. [First Time Setup](#1-first-time-setup)
2. [Testing on Local Device](#2-testing-on-local-device)
3. [Testing on Emulators](#3-testing-on-emulators)
4. [Releasing Staging Build](#4-releasing-staging-build)
5. [Releasing Production Build](#5-releasing-production-build)
6. [App Variants](#app-variants)
7. [Dev Tool (TestFlight)](#dev-tool-testflight)
8. [Updating Dependencies](#updating-dependencies)
9. [Learn More](#learn-more)

## 1. First Time Setup

### Prerequisites

**All developers:**
```bash
npm install -g eas-cli
eas login  # log in with your Expo account (or use npx eas-cli)
```

**iOS developers (macOS only):**
- Install [Xcode](https://apps.apple.com/us/app/xcode/id497799835) from Mac App Store
- Install CocoaPods: `brew install cocoapods`
- For physical device: Follow [Expo's Xcode signing guide](https://github.com/expo/fyi/blob/main/setup-xcode-signing.md)

**Android developers:**
- Follow [Expo's Android Studio emulator guide](https://docs.expo.dev/workflow/android-studio-emulator/) to install Android Studio, Java, and configure environment variables
- Get `google-services.json` from [Firebase Console](https://console.firebase.google.com/) → Project Settings → Android app → Download, and place it in `app/mobile/google-services.json` (ask a team member for Firebase access)

### Initial Build

Install dependencies and generate protocol buffers:
```bash
npm install
npm run build:protos
```

**You must create a development build first** to install on your device:

```bash
# iOS (connect iPhone via USB, enable Developer Mode in Settings)
npx expo run:ios --device

# Android (connect Android device via USB or launch emulator first)
npx expo run:android --device
```

> **Note:** Local builds default to the `devtool` variant (`org.couchers.devtool.ios` / `org.couchers.devtool.android`), keeping them isolated from the production and staging apps. Production notifications won't open your local build.

On iOS: if you get issues about signing, try opening `app/mobile/ios` in Xcode and setting up app signing there.

> **Tip:** If you only work on JavaScript/TypeScript, you can skip the local
> native build (and Xcode/Android Studio) entirely — install the prebuilt
> **Couchers Dev Tool** app from TestFlight and run `npx expo start` against it.
> See [Dev Tool (TestFlight)](#dev-tool-testflight). You only
> need a local native build when changing native dependencies or `app.config.js`.

**After the initial build is installed, use this for daily development:**
```bash
npx expo start
```

Scan the QR code with your phone's camera. Your JavaScript/TypeScript changes will hot-reload automatically.

**When to rebuild vs when to use `npx expo start`:**
- **Rebuild** (`npx expo run:ios` or `npx expo run:android`): When adding/removing native dependencies, changing `app.config.js`, or updating Expo SDK
- **Just start Metro** (`npx expo start`): For all JavaScript/TypeScript code changes (most development)

## 2. Testing on Local Device

### Testing Web App Changes on Mobile

If you need to test local web or backend changes on your phone, run the setup script — it auto-detects your IP and updates all config files at once:

```bash
npm run setup:local
```

Then restart everything from the repo root, each in a separate terminal:

```bash
# Terminal 1 — backend (requires Docker)
docker compose up --build

# Terminal 2 — web frontend
cd app/web && yarn start

# Terminal 3 — Expo
cd app/mobile && npx expo start
```

When done, restore with:

```bash
npm run setup:local:restore
```

### Quick Development (Mobile Code Only)

For JavaScript/TypeScript changes to the mobile app, just run Metro:
```bash
npx expo start
```

## 3. Testing on Emulators

### iOS Simulator (macOS only)
```bash
npx expo run:ios
```

The iOS Simulator will launch automatically. See [Expo iOS Simulator docs](https://docs.expo.dev/workflow/ios-simulator/) for more.

### Android Emulator

1. Launch an emulator from Android Studio (AVD Manager)
2. Run:
```bash
npx expo run:android
```

See [Expo Android emulator docs](https://docs.expo.dev/workflow/android-studio-emulator/) for troubleshooting.

## 4. Releasing Staging Build

Staging builds point to `dev-api.couchershq.org` and are for internal testing only. The staging app (`Couchers (Staging)`) can be installed alongside the production app.

### Before Building

Run these checks:
```bash
npm run format    # auto-fix lint errors + format code
npm run lint      # check for remaining lint errors
npm test          # run tests
npx expo-doctor   # verify build configuration
```

### iOS Staging Build

```bash
npm run release:ios:staging
```

Once submitted, the build will be available in [TestFlight](https://appstoreconnect.apple.com) after automated review (usually within a few hours).

**To add release notes:** Go to [App Store Connect](https://appstoreconnect.apple.com) → Select "Couchers (Staging)" app → TestFlight tab → Select your build → Add "What to Test" notes describing the changes.

### Android Staging Build

```bash
npm run release:android:staging
```

The build will be immediately available for internal testing (no review required).

**To add release notes:** Go to [Google Play Console](https://play.google.com/console) → Select "Couchers (Staging)" app → Testing → Internal testing → Select the release → Edit "Release notes" describing the changes.

## 5. Releasing Production Build

**When to release production:**
- After features have been thoroughly tested in staging
- When releasing a new version to the public App Store and Google Play
- Coordinate with team before releasing

Production builds point to `api.couchers.org` and are released to the public.

### Before Building

Ensure staging has been tested, then run pre-flight checks:
```bash
npm run format
npm run lint
npm test
npx expo-doctor
```

### iOS Production Build

```bash
npm run release:ios:production
```

**To add release notes and submit for review:** Go to [App Store Connect](https://appstoreconnect.apple.com) → Select "Couchers" app → TestFlight tab → Select your build → Add "What to Test" notes → Then go to App Store tab → Submit for App Store review.

### Android Production Build

```bash
npm run release:android:production
```

**To add release notes and publish:** Go to [Google Play Console](https://play.google.com/console) → Select "Couchers" app → Testing → Internal testing → Select the release → Edit "Release notes" → Then promote the build from Internal Testing to the Production track.

---

## App Variants

We maintain **three separate apps** that can coexist on the same device:

| Variant | App Name | iOS Bundle ID | Android Package | API Server |
|---------|----------|---------------|-----------------|------------|
| **Dev Tool** | Couchers Dev Tool | `org.couchers.devtool.ios` | `org.couchers.devtool.android` | `dev-api.couchershq.org` |
| **Staging** | Couchers (Staging) | `org.couchers.staging.ios` | `org.couchers.staging.android` | `dev-api.couchershq.org` |
| **Production** | Couchers | `org.couchers.ios` | `org.couchers.android` | `api.couchers.org` |

**Benefits:** All apps can be installed simultaneously, separate push notification channels, test staging changes without affecting production users.

**How it works:** Build profiles in `eas.json` set an `APP_VARIANT` environment variable, which `app.config.js` reads to configure bundle IDs, app names, and API endpoints dynamically.

The **Dev Tool** variant is a [development build](#dev-tool-testflight) (it reuses the staging icons and backend). The **Dev Tool** and **Staging** apps both point at `dev-api.couchershq.org` but are distinct apps with separate bundle IDs.

## Dev Tool (TestFlight)

The **Couchers Dev Tool** variant is a [development build](https://docs.expo.dev/develop/development-builds/introduction/) — essentially "Expo Go, but with our own native modules." It bundles every native dependency in the project plus the Expo dev launcher, and points at the staging backend. Devs install it once from TestFlight and load JavaScript over the air, so they never need Xcode, CocoaPods, or a local native build for day-to-day JS/TS work. The "Dev Tool" name signals it's a developer utility, not another release flavor like staging or production.

**Daily workflow (no Xcode needed):**

```bash
npx expo start
```

Open the **Couchers Dev Tool** app and connect to the Metro server (same network), or scan the QR code. JS/TS changes hot-reload exactly as they do with a locally built development build.

**When a new Dev Tool build is required:** only when the set of native dependencies changes (adding/removing a native package, changing `app.config.js`, or bumping the Expo SDK). Pure JS/TS changes never need a rebuild — they load over the air.

### Releasing a new Dev Tool build

**Automatic (CI).** Every push to develop runs `build:devtool-native`, which recomputes the Expo fingerprint and, **only if it changed since the last-built client**, builds a fresh client on EAS. JS/TS-only changes don't change the fingerprint, so they're skipped — those load over the air (see [`docs/mobile-dev-tool-ota.md`](../../docs/mobile-dev-tool-ota.md)). The last-built fingerprint is recorded per platform under `s3://<dev-assets>/devtool-builds/` and only updated after a successful build, so a failed build is retried next pipeline.

- **iOS** → EAS build + auto-submit to **TestFlight**; invited devs update from the TestFlight app.
- **Android** → EAS builds a sideloadable **APK** (the `devtool-apk` profile), which CI downloads and publishes to the dev-assets bucket at a stable URL: **`https://android--devtool-builds.preview.couchershq.org/`**. Devs bookmark that page and re-download to update. Google Play has no TestFlight-style channel for a dev-client APK (Play distributes AABs through release tracks, not installers), so we host it ourselves.

**Manual** (same EAS builds, run locally):

```bash
npm run release:ios:devtool       # iOS → TestFlight (auto-submit)
npm run release:android:devtool   # Android → APK (EAS gives a download link/QR)
```

Once submitted, the iOS build appears in TestFlight after Apple's automated processing (no full App Review for internal testers).

### One-time setup (maintainers)

Before the first release:

1. Create the app in [App Store Connect](https://appstoreconnect.apple.com) with bundle ID `org.couchers.devtool.ios`. (No Google Play Console app is needed — the Android Dev Tool is a self-hosted APK, not a Play release.)
2. Set `submit.devtool.ios.ascAppId` in `eas.json` to the App Store Connect app ID.
3. Invite developers as internal TestFlight testers — no per-device UDID registration is required (unlike EAS internal/ad-hoc distribution).

For the **automatic CI rebuild** (`build:devtool-native`), additionally:

4. Add an Expo robot token (build + submit scope) as the masked, protected GitLab CI/CD variable **`EXPO_TOKEN`**. The Android APK is signed with the keystore EAS already holds for the `devtool` builds, so no extra Android credentials are required.

Per-PR JavaScript previews (the OTA QR posted on PRs) are already wired up; see [`docs/mobile-dev-tool-ota.md`](../../docs/mobile-dev-tool-ota.md).

## Updating Dependencies

Mobile dependencies are **not** managed by Dependabot. Expo requires specific compatible versions of packages tied to each SDK version, so dependencies should be updated through Expo's tooling:

```bash
# Check for outdated or incompatible packages
npx expo install --check

# Auto-fix to Expo-compatible versions
npx expo install --fix
```

When upgrading the Expo SDK itself, follow the [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).

## Learn More

- **[Mobile App Architecture Guide](./ARCHITECTURE.md)**: Understand how the mobile app wraps the web app, routing synchronization, authentication, and common pitfalls
- [Expo documentation](https://docs.expo.dev/): Learn fundamentals and advanced topics
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Step-by-step tutorial for creating cross-platform apps
