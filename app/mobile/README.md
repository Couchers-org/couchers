# Couchers Mobile App

React Native mobile app built with [Expo](https://expo.dev). We maintain two separate apps (staging and production) that can coexist on the same device with different bundle IDs and API endpoints.

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

If you need to test local web or backend changes on your phone, run everything locally and configure environment variables to point to your computer's IP address.

**[Follow the local development guide](../../docs/run-local-app-on-mobile.md)** for detailed instructions.

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

We maintain **two separate apps** that can coexist on the same device:

| Variant | App Name | iOS Bundle ID | Android Package | API Server |
|---------|----------|---------------|-----------------|------------|
| **Staging** | Couchers (Staging) | `org.couchers.staging.ios` | `org.couchers.staging.android` | `dev-api.couchershq.org` |
| **Production** | Couchers | `org.couchers.ios` | `org.couchers.android` | `api.couchers.org` |

**Benefits:** Both apps can be installed simultaneously, separate push notification channels, test staging changes without affecting production users.

**How it works:** Build profiles in `eas.json` set an `APP_VARIANT` environment variable, which `app.config.js` reads to configure bundle IDs, app names, and API endpoints dynamically.

## Learn More

- **[Mobile App Architecture Guide](./ARCHITECTURE.md)**: Understand how the mobile app wraps the web app, routing synchronization, authentication, and common pitfalls
- [Expo documentation](https://docs.expo.dev/): Learn fundamentals and advanced topics
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Step-by-step tutorial for creating cross-platform apps
