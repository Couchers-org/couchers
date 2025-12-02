# Couchers Mobile App

React Native mobile app built with [Expo](https://expo.dev).

## Prerequisites

### For Local Development Builds

**iOS (macOS only):**

Local iOS builds compile native code on your machine, which requires Apple's development tools.

1. Install **Xcode** from the Mac App Store — Apple's IDE that includes the iOS SDK and simulator
2. Install **CocoaPods** — dependency manager for iOS native libraries:
   ```bash
   brew install cocoapods
   ```

**Android:**

Local Android builds compile native code on your machine, which requires Google's development tools.

1. Install **[Android Studio](https://developer.android.com/studio)** — Google's IDE that includes the Android SDK and emulator
2. Add environment variables to `~/.zshrc` — tells your system where to find the SDK tools:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### For Production Builds (TestFlight / Play Store)

No local native tools required—builds run in the cloud via EAS.

```bash
npm install -g eas-cli
eas login
eas credentials  # configure app signing
```

## First Time Setup

1. Install dependencies and generate gRPC stubs:

   ```bash
   npm install
   npm run build:protos
   ```

2. Create a local development build (required for native features like push notifications):

   ```bash
   npm run ios      # requires Xcode + CocoaPods
   npm run android  # requires Android Studio
   ```

   We use local builds for development because they're free and faster to iterate on. They compile the native app directly on your machine. Pods are installed automatically on first build.

   > **Physical device?** Connect mobile phone to computer via USB cable, enable developer mode, and be in the Apple Developer team. Run `npx expo run:ios --device`. After the initial install, you can disconnect and run wirelessly.

## Development

Start the Metro bundler:

```bash
npx expo start
```

Scan the barcode with your phone's camera.

## TestFlight / Play Store Builds

Use [EAS Build](https://expo.dev/eas) for production builds. These build in the cloud so no local native tools are required, but there's a small charge per build.

```bash
eas build --platform ios
eas build --platform android
```

## Learn More

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
