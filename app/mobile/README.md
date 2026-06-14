# Couchers Mobile App

React Native mobile app built with [Expo](https://expo.dev). We maintain three separate app variants (staging, production, and a development tool) that can coexist on the same device with different bundle IDs and API endpoints.

You don't need to build the app locally: the prebuilt **Couchers Dev Tool** variant covers almost all mobile dev work.

_Readme last updated: 2026/06/13._


## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Full local development setup](#2-full-local-development-setup)
3. [Local native builds](#3-local-native-builds)
4. [Releases](#4-releases)
5. [App variants](#5-app-variants)
6. [Updating dependencies](#6-updating-dependencies)
7. [Learn more](#7-learn-more)

## 1. Quick Start

You can do local development without having to build the mobile app from scratch using the Couchers Dev Tool. Download it for Android or the iOS simulator from the [dev tool builds page](https://develop--devtool-builds.preview.couchershq.org/). To get it on your physical iPhone, ask a mobile dev lead to invite you via TestFlight.

On your dev machine, you need `nodejs` v22. We recommend using `nvm` (the [node version manager](https://github.com/nvm-sh/nvm)) to do this. You can install it with:

```sh
curl -sL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

**You will need to restart your terminal before `nvm` becomes available.** (See the [web frontend readme](../web/readme.md) for a deeper discussion on `nvm` and deps).

Now run the following commands to get up and running:

```sh
## Check out the repo and navigate to app/mobile
git clone https://github.com/Couchers-org/couchers.git
cd couchers/app/mobile

# install and use the right node version
nvm install
# install dependencies
npm install
# generate the proto stubs
npm run build:protos

# start the dev server through the dev tool
npm run start:devtool
```

**Open the Dev Tool app and scan the QR code** (your phone and computer must be on the same network). TypeScript changes hot-reload automatically.

You should now see the mobile app on your phone.

This setup will point at your local version of the React Native app, but it will point at the staging web app and backend. You probably want to follow the instructions on local dev below to run the full stack locally.

## 2. Full local development setup

To actually do full local development, you will want to run the entire stack on your dev machine, and point the dev tool at that instead of the staging environment.

First, run the following script which patches environment variables to point the app at your local running versions of the frontend and backend. It auto-detects your IP and updates all config files at once:

```bash
npm run setup:local
```

On a first run: run each of the quick starts in the `backend/` and `web/` folders to get your machine set up.

Now run everything from the repo root, each in a separate terminal:

```bash
# Terminal 1: backend (requires Docker)
docker compose up --build

# Terminal 2: web frontend
cd app/web && yarn start

# Terminal 3: Expo
cd app/mobile && npm run start:devtool
```

You can now point your phone's camera at the QR code and the Dev Tool should be running against your local dev machine.

When done, restore environment config with:

```bash
npm run setup:local:restore
```

### Checks

Run these before pushing (CI runs them too):

```sh
npm run format    # auto-fix lint errors + format code
npm run lint      # check for remaining lint errors
npm test          # run tests
```

To review a PR: every PR gets a bot comment with QR codes that open that branch directly in the Dev Tool, with the branch's web preview wired in. See [docs/native-dev-tool.md](../../docs/native-dev-tool.md) for how it all works.

## 3. Local native builds

Only needed when developing native changes (when Expo fingerprints would change).

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

**After the initial build is installed:**
```bash
npx expo start
```

Scan the QR code with your phone's camera. Your JavaScript/TypeScript changes will hot-reload automatically.

**When to rebuild vs when to use `npx expo start`:**
- **Rebuild** (`npx expo run:ios` or `npx expo run:android`): When adding/removing native dependencies, changing `app.config.js`, or updating Expo SDK
- **Just start Metro** (`npx expo start`): For all JavaScript/TypeScript code changes (most development)

Local builds default to the `devtool` variant, so set it explicitly if you want staging/prod versions.

If you hit iOS signing issues, open `app/mobile/ios` in Xcode and set up signing there.

### Testing on Emulators

#### iOS Simulator (macOS only)
```bash
npx expo run:ios
```

The iOS Simulator will launch automatically. See [Expo iOS Simulator docs](https://docs.expo.dev/workflow/ios-simulator/) for more.

#### Android Emulator

1. Launch an emulator from Android Studio (AVD Manager)
2. Run:
```bash
npx expo run:android
```

See [Expo Android emulator docs](https://docs.expo.dev/workflow/android-studio-emulator/) for troubleshooting.

## 4. Releases

All release builds (Dev Tool, Stage, Prod) are done in CI ([`app/.gitlab-ci.yml`](../.gitlab-ci.yml)) on every push to `develop`, for both staging and production:

- **Native fingerprint changed** → CI builds a fresh store build on EAS and submits it: iOS to TestFlight, Android to the Play internal testing track. (Set `FORCE_NATIVE_BUILD_AND_SUBMIT=true` on a pipeline to force a build when the fingerprint is unchanged.)
- **Fingerprint unchanged** (JS/TS-only changes) → CI ships the changes as a signed [over-the-air update](../../docs/native-ota-updates.md) instead — no store build needed.
- The Dev Tool is rebuilt on fingerprint changes the same way.

Releasing to users is then a manual process:

**Staging** builds are for internal testing and are available as soon as CI submits them (TestFlight after Apple's automated processing; Play internal testing immediately). Optionally add release notes in [App Store Connect](https://appstoreconnect.apple.com) (Couchers (Staging) → TestFlight → build → "What to Test") or the [Google Play Console](https://play.google.com/console) (Couchers (Staging) → Testing → Internal testing → release notes).

**Production** releases should be coordinated with the team, after the changes have been tested in staging:

- **iOS**: [App Store Connect](https://appstoreconnect.apple.com) → Couchers → TestFlight tab → select the build → add "What to Test" notes → App Store tab → submit for App Store review.
- **Android**: [Google Play Console](https://play.google.com/console) → Couchers → Testing → Internal testing → select the release → add release notes → promote from Internal testing to the Production track.

As a last-resort fallback, the `npm run release:*` scripts in `package.json` run the same EAS builds locally (requires `eas-cli` and EAS access).

## 5. App variants

We maintain **three separate apps** that can coexist on the same device:

| Variant        | App Name           | iOS Bundle ID              | Android Package                | API Server                |
| -------------- | ------------------ | -------------------------- | ------------------------------ | ------------------------- |
| **Dev Tool**   | Couchers Dev Tool  | `org.couchers.devtool.ios` | `org.couchers.devtool.android` | `dev-api.couchershq.org`  |
| **Staging**    | Couchers (Staging) | `org.couchers.staging.ios` | `org.couchers.staging.android` | `dev-api.couchershq.org`  |
| **Production** | Couchers           | `org.couchers.ios`         | `org.couchers.android`         | `api.couchers.org`        |

Build profiles in `eas.json` set an `APP_VARIANT` environment variable, which `app.config.js` reads to configure bundle IDs, app names, and API endpoints. The Dev Tool is a [development build](https://docs.expo.dev/develop/development-builds/introduction/) — a developer utility, not a release flavor — see [docs/native-dev-tool.md](../../docs/native-dev-tool.md).

## 6. Updating dependencies

Mobile dependencies are **not** managed by Dependabot. Expo requires specific compatible versions of packages tied to each SDK version, so update through Expo's tooling:

```sh
# Check for outdated or incompatible packages
npx expo install --check

# Auto-fix to Expo-compatible versions
npx expo install --fix
```

When upgrading the Expo SDK itself, follow the [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/). Note that an Expo upgrade breaks OTA forwards compatibility and requires everyone to re-download a new app version from the app stores.

## 7. Learn more

- **[Mobile App Architecture Guide](./ARCHITECTURE.md)**: Understand how the mobile app wraps the web app, routing synchronization, authentication, and common pitfalls
- [Dev Tool documentation](../../docs/native-dev-tool.md): explains how it works, PR branch previews, etc
- [OTA update docs](../../docs/native-ota-updates.md): over-the-air updates, fingerprints, and the release pipeline
- [Expo documentation](https://docs.expo.dev/): Learn fundamentals and advanced topics
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Step-by-step tutorial for creating cross-platform apps
