# Couchers Mobile App

React Native mobile app built with [Expo](https://expo.dev).

## Table of Contents

- [Quick start](#quick-start)
- [First Time Setup](#first-time-setup)
- [Local Development](#local-development)
- [Seeing web or backend changes on the mobile app](#seeing-web-or-backend-changes-on-the-local-mobile-app)
- [Before Opening a PR](#before-opening-a-pr)
- [Publish Your Changes - TestFlight / Play Store Builds](#publish-your-changes---testflight--play-store-builds)
- [Submitting Builds for Testing](#submitting-builds-for-testing)
- [Learn More](#learn-more)

## Quick Start

If you already have a development build and haven't changed any native dependencies, app.json, app icons, or updated the Expo SDK:

```bash
npm install
npm run build:protos
npx expo start
```

Then scan the QR code with your phone's camera. Your changes will automatically reload on your device as you code.

For JavaScript/TypeScript changes (most development), just run Metro and your changes hot-reload automatically.


## First Time Setup

### Install Development Tools

**iOS (macOS only):**
- Install **Xcode** from the Mac App Store
- Install **CocoaPods**: `brew install cocoapods`

**iOS Physical Device Setup:**

Follow instructions here to set up XCode and connect your certificates and signing info:
https://github.com/expo/fyi/blob/main/setup-xcode-signing.md

Connect your iPhone via USB, enable developer mode in Settings > Privacy > Enable Developer Mode (it might ask to restart device)

**Android:**
- Follow the **[Expo Android Studio Emulator guide](https://docs.expo.dev/workflow/android-studio-emulator/)** to install Android Studio, Java, and configure environment variables
- **Firebase setup** (required for push notifications):
  1. Get `google-services.json` from [Firebase Console](https://console.firebase.google.com/) → Project Settings → Your apps → Android app → Download
  2. Place it in `app/mobile/google-services.json`
  3. This file is gitignored - ask a team member if you don't have Firebase access

**EAS CLI (for cloud builds):**
```bash
npm install -g eas-cli
eas login  # log in with your Expo account
```
Or use `npx eas-cli` without installing globally.

## Local Development

**First time?** You need a development build installed on your device before you can develop. Run one of these. It will take awhile and ask you to enter your password many times. That's normal.

**When do you need a new build?** Only when you:
- Add/remove native dependencies (`npm install` of native modules)
- Change `app.config.js` configuration
- Update Expo SDK version

```bash
npm install

npm run build:protos

# iOS (requires Xcode setup above)
npx expo run:ios --device # and plug your device in to computer via USB
   # OR #
eas build --platform ios --profile staging # leave out "--profile staging" for prod build

# Android (requires Android Studio setup above, and running emulator)
npx expo run:android --device # and plug your device in to computer via USB
```

**Android Emulator users:** Use localhost mode if you get connection errors:
```bash
npm run start:localhost
```

## Seeing web or backend changes on the local mobile app

If you're adjusting web or backend code and want to see it on the app, you need to run everything locally and switch out the env vars to your computer's IP address.

[Follow these instructions to run local app on mobile.](./../../docs/run-local-app-on-mobile.md)

## Before Opening a PR

Run these checks before submitting:

```bash
npm run format   # auto-fix lint errors + format code
npm run lint     # check for remaining lint errors
npm test         # run tests
npx expo start   # make sure app starts and click around
npx expo-doctor  # make sure no errors get flagged for a build
```

## Publish your changes - TestFlight / Play Store Builds

Use [EAS Build](https://expo.dev/eas) for production builds. These build in the cloud so no local native tools are required, but there's a small charge per build.

```bash
eas build --platform ios
eas build --platform android
```

## Submitting Builds for Testing

### iOS (TestFlight)

To build and submit your iOS app to TestFlight:

```bash
# Staging
npm run release:ios:staging

# Production
npm run release:ios:production
```

Once submitted, the build will be available in TestFlight after automated review (usually within a few hours).

**Adding Release Notes:** iOS requires release notes ("What to Test") to be added manually in App Store Connect:
1. Go to [App Store Connect](https://appstoreconnect.apple.com) → TestFlight → Builds
2. Select your newly submitted build
3. Add "What to Test" notes describing the changes
4. Submit for testing

You can then add testers:
- Go to TestFlight → Internal Testing
- Add tester email addresses (no Apple Developer account needed for testers)
- Testers receive an email, download the TestFlight app, and install your app

**Note:** TestFlight builds are private and NOT released to the public App Store unless you manually submit for App Store review. Each one incurs a small charge to Couchers.org.

### Android (Google Play Internal Testing)

To build and submit your Android app to Google Play Internal Testing:

```bash
# Staging
npm run release:android:staging

# Production
npm run release:android:production
```

**Adding Release Notes:** Edit the release notes in Google Play Console after submission:
1. Go to [Google Play Console](https://play.google.com/console) → Your App → Testing → Internal testing
2. Select the new release
3. Edit "Release notes" to describe what changed
4. Save changes

Once submitted, the build will be immediately available for internal testing (no review required). You can then add testers in the same section:
- Add tester email addresses (up to 100 testers)
- Testers receive a link to install from the Play Store

**Note:** Internal Testing builds are private and NOT released to the public Play Store unless you manually promote them to a production track.

## Learn More

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
