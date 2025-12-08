# Couchers Mobile App

React Native mobile app built with [Expo](https://expo.dev).

Are you trying to download and test the app? [See mobile app tester instructions here](./mobileAppTesterInstructions.md).

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

If you are testing on a device where you don't have the phone, you can set up a simulator first:

   * [Instructions to set up the iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
   * [Instructions to set up the Android Studio Emulator](https://docs.expo.dev/workflow/android-studio-emulator/)

   **Important for Android Emulator:** Make sure the emulator is running before building. Open Android Studio → Device Manager → Start an emulator.

   ```bash
   npm run ios      # requires Xcode + CocoaPods
   npm run android  # requires Android Studio + running emulator
   ```

   We use local builds for development because they're free and faster to iterate on. They compile the native app directly on your machine. Pods are installed automatically on first build.

   > **Physical device?** You'll need to be added to the Apple Developer team (contact @aapeli) and configure code signing in Xcode:
   >
   > 1. Open the workspace in Xcode:
   >    ```bash
   >    open ios/Couchers.xcworkspace  # ⚠️ Use .xcworkspace, NOT .xcodeproj
   >    ```
   > 2. Select the **Couchers** project (blue icon) → **Couchers** target → **Signing & Capabilities** tab
   > 3. Check **"Automatically manage signing"** and select your **Team** (sign in with your Apple ID if needed)
   > 4. Verify Bundle Identifier is `com.couchersorg.mobile` (or use a unique ID like `com.yourname.couchers` for personal testing)
   > 5. Connect your device via USB, enable developer mode, then run:
   >    ```bash
   >    npx expo run:ios --device
   >    ```
   >    After initial install, you can disconnect and develop wirelessly. Note: You may be prompted for your password up to 3 times during the build.

## Development

Start the Metro bundler:

```bash
npx expo start
```

**For Android Emulator users:** If you're developing on an Android emulator and getting connection errors, use the localhost mode:

```bash
npm run start:localhost
# or
npx expo start --localhost
```

Then press `a` to open on the emulator. This uses the special `10.0.2.2` address that Android emulators use to access the host machine.

**For physical devices:** Scan the QR code with your phone's camera (works with the regular `npx expo start` command).

## Before Opening a PR

Run these checks before submitting:

```bash
npm run format   # auto-fix lint errors + format code
npm run lint     # check for remaining lint errors
npm test         # run tests
npx expo start   # make sure app starts and click around
```

## TestFlight / Play Store Builds

Use [EAS Build](https://expo.dev/eas) for production builds. These build in the cloud so no local native tools are required, but there's a small charge per build.

```bash
eas build --platform ios
eas build --platform android
```

## Submitting Builds for Testing

**Note:** Delete any local `ios/` and `android/` folders before building. We use Continuous Native Generation (CNG), so EAS Build automatically generates them during cloud builds.

### iOS (TestFlight)

To submit your iOS app to TestFlight for QA testing:

```bash
# Verify project setup (optional but recommended)
npx expo-doctor

# Build and submit to TestFlight
npx testflight
```

The `testflight` command will:
1. Build your iOS app using EAS
2. Handle Apple credentials and code signing automatically
3. Submit the build to TestFlight

Once submitted, the build will be available in TestFlight after automated review (usually within a few hours). You can then add testers in App Store Connect:
- Go to App Store Connect → TestFlight → Internal Testing
- Add tester email addresses (no Apple Developer account needed for testers)
- Testers receive an email, download the TestFlight app, and install your app

**Note:** TestFlight builds are private and NOT released to the public App Store unless you manually submit for App Store review.

### Android (Google Play Internal Testing)

To submit your Android app to Google Play Internal Testing for QA testing:

```bash
# Verify project setup (optional but recommended)
npx expo-doctor

# Build and submit to Google Play Internal Testing
eas build --platform android --auto-submit
```

The `--auto-submit` flag will:
1. Build your Android app using EAS
2. Handle Google Play credentials automatically
3. Submit the build to Internal Testing track

Once submitted, the build will be immediately available for internal testing (no review required). You can then add testers in Google Play Console:
- Go to Google Play Console → Your App → Testing → Internal testing
- Add tester email addresses (up to 100 testers)
- Testers receive a link to install from the Play Store

**Note:** Internal Testing builds are private and NOT released to the public Play Store unless you manually promote them to a production track.

## Learn More

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
