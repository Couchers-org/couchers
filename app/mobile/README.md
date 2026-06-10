# Couchers Mobile App

React Native mobile app built with [Expo](https://expo.dev). We maintain three separate apps (staging, production, and a development tool) that can coexist on the same device with different bundle IDs and API endpoints.

You don't need to build the app locally: the prebuilt **Couchers Dev Tool** app covers almost all mobile dev work.

_Readme last updated: 2026/06/10._

## Quick Start

First, get the Dev Tool on your phone:

- **iOS**: via TestFlight — ask a mobile dev lead to invite you.
- **Android**: download the APK from the [dev tool builds page](https://android--devtool-builds.preview.couchershq.org/).

You need `nodejs` v22. We recommend using `nvm` (the [node version manager](https://github.com/nvm-sh/nvm)) — see the [web frontend readme](../web/README.md) for installing it.

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

# start the dev server
npm run start:devtool
```

Open the Dev Tool app and scan the QR code (your phone and computer must be on the same network). JavaScript/TypeScript changes hot-reload automatically. That's it — this covers ~95% of mobile development.

To review a PR you don't even need the above: every PR gets a bot comment with QR codes that open that branch directly in your Dev Tool, with the branch's web preview wired in. See [docs/native-dev-tool.md](../../docs/native-dev-tool.md) for how it all works.

## Developing

### Checks

Run these before pushing (CI runs them too):

```sh
npm run format    # auto-fix lint errors + format code
npm run lint      # check for remaining lint errors
npm test          # run tests
```

### Testing against a local backend/web frontend

To point the app at a local backend and web frontend on your machine, run the setup script — it auto-detects your IP and updates all config files at once:

```sh
npm run setup:local
```

Then start the backend (`docker compose up --build` from the repo root), the web frontend (`yarn start` in `app/web`), and the dev server (`npm run start:devtool` here), each in its own terminal. Restore with `npm run setup:local:restore`. See [docs/run-local-app-on-mobile.md](../../docs/run-local-app-on-mobile.md) for details.

### When you need a native build

The Dev Tool only loads JavaScript compatible with the native code it was built with (enforced by the [Expo fingerprint](../../docs/native-ota-updates.md)). You only need a native build when changing **native dependencies**, **`app.config.js`**, or the **Expo SDK** — pure JS/TS changes never do.

When such a change lands on `develop`, CI automatically builds a fresh Dev Tool and ships it to TestFlight / the APK page — so even then, you usually just update your installed Dev Tool. You only need a *local* native build (below) while actively working on native code.

## Local native builds

Only needed when developing native changes. Prerequisites:

**iOS (macOS only):**

- Install [Xcode](https://apps.apple.com/us/app/xcode/id497799835) and CocoaPods (`brew install cocoapods`)
- For a physical device: follow [Expo's Xcode signing guide](https://github.com/expo/fyi/blob/main/setup-xcode-signing.md)

**Android:**

- Follow [Expo's Android Studio guide](https://docs.expo.dev/workflow/android-studio-emulator/) to install Android Studio, Java, and environment variables
- Get `google-services.json` from the [Firebase Console](https://console.firebase.google.com/) (ask a team member for access) and place it at `app/mobile/google-services.json`

Then build and run:

```sh
# iOS simulator, or --device for a USB-connected iPhone (enable Developer Mode in Settings)
npx expo run:ios [--device]

# Android emulator (launch one from Android Studio first), or --device for a USB-connected phone
npx expo run:android [--device]
```

Local builds default to the `devtool` variant, so they stay isolated from the production and staging apps on your device. If you hit iOS signing issues, open `app/mobile/ios` in Xcode and set up signing there.

## Releases

All builds are made by CI ([`app/.gitlab-ci.yml`](../.gitlab-ci.yml)) on every push to `develop`, for both staging and production:

- **Native fingerprint changed** → CI builds a fresh store build on EAS and submits it: iOS to TestFlight, Android to the Play internal testing track. (Set `FORCE_NATIVE_BUILD_AND_SUBMIT=true` on a pipeline to force a build when the fingerprint is unchanged.)
- **Fingerprint unchanged** (JS/TS-only changes) → CI ships the changes as a signed [over-the-air update](../../docs/native-ota-updates.md) instead — no store build needed.
- The Dev Tool is rebuilt on fingerprint changes the same way.

Releasing to users is then a manual process:

**Staging** builds are for internal testing and are available as soon as CI submits them (TestFlight after Apple's automated processing; Play internal testing immediately). Optionally add release notes in [App Store Connect](https://appstoreconnect.apple.com) (Couchers (Staging) → TestFlight → build → "What to Test") or the [Google Play Console](https://play.google.com/console) (Couchers (Staging) → Testing → Internal testing → release notes).

**Production** releases should be coordinated with the team, after the changes have been tested in staging:

- **iOS**: [App Store Connect](https://appstoreconnect.apple.com) → Couchers → TestFlight tab → select the build → add "What to Test" notes → App Store tab → submit for App Store review.
- **Android**: [Google Play Console](https://play.google.com/console) → Couchers → Testing → Internal testing → select the release → add release notes → promote from Internal testing to the Production track.

As a last-resort fallback, the `npm run release:*` scripts in `package.json` run the same EAS builds locally (requires `eas-cli` and EAS access).

## App variants

We maintain **three separate apps** that can coexist on the same device:

| Variant        | App Name           | iOS Bundle ID              | Android Package                | API Server                |
| -------------- | ------------------ | -------------------------- | ------------------------------ | ------------------------- |
| **Dev Tool**   | Couchers Dev Tool  | `org.couchers.devtool.ios` | `org.couchers.devtool.android` | `dev-api.couchershq.org`  |
| **Staging**    | Couchers (Staging) | `org.couchers.staging.ios` | `org.couchers.staging.android` | `dev-api.couchershq.org`  |
| **Production** | Couchers           | `org.couchers.ios`         | `org.couchers.android`         | `api.couchers.org`        |

Build profiles in `eas.json` set an `APP_VARIANT` environment variable, which `app.config.js` reads to configure bundle IDs, app names, and API endpoints. The Dev Tool is a [development build](https://docs.expo.dev/develop/development-builds/introduction/) — a developer utility, not a release flavor — see [docs/native-dev-tool.md](../../docs/native-dev-tool.md).

## Updating dependencies

Mobile dependencies are **not** managed by Dependabot. Expo requires specific compatible versions of packages tied to each SDK version, so update through Expo's tooling:

```sh
npx expo install --check   # check for outdated or incompatible packages
npx expo install --fix     # auto-fix to Expo-compatible versions
```

When upgrading the Expo SDK itself, follow the [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).

## Learn more

- [ARCHITECTURE.md](./ARCHITECTURE.md): how the app wraps the web app, routing synchronization, authentication, and common pitfalls
- [docs/native-dev-tool.md](../../docs/native-dev-tool.md): the Dev Tool, PR branch previews, and how they work
- [docs/native-ota-updates.md](../../docs/native-ota-updates.md): over-the-air updates, fingerprints, and the release pipeline
- [docs/run-local-app-on-mobile.md](../../docs/run-local-app-on-mobile.md): running the full local dev environment on your phone
- [Expo documentation](https://docs.expo.dev/)
