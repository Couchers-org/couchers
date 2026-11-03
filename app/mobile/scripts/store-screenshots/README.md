# Store screenshots

Generates the App Store and Google Play screenshots for the mobile app.

You need a Mac for the iOS screenshots, because Apple's iOS Simulator only runs on macOS. The Android ones should also work on Linux.

## How it works

1. Seeds made-up people, stays, messages and events into your local database.
2. Drives the app on an iPhone simulator, iPad simulator and Android emulator with [Maestro](https://maestro.dev), taking a screenshot of each screen.
3. Puts each screenshot in a device frame under a caption, at the sizes each store requires.

Everything runs locally. App builds use Xcode and Gradle on your machine, not EAS.

## Where to change things

- **Captions:** `captions/en.json` (add `captions/<locale>.json` for other languages)
- **Which screens, in what order:** `SCREENS` in `run.mts` and the steps in `flow.yaml` (at most 8)
- **People, stays, messages:** `app/backend/src/data/store_screenshots.json`
- **Avatars and event images:** `avatars.mts` and `covers.mts`
- **Real photos:** `photos/`, listed in `photos/manifest.json` (see `manifest.example.json`)

Only use photos of volunteers who have agreed to appear in the store listing. `photos/` is gitignored.

## Setup (once)

Most of these things are needed to develop the mobile app, so if you have that setup you probably have most below already.

- **Docker** with Compose, e.g. [Docker Desktop](https://www.docker.com/products/docker-desktop/), OrbStack or Colima: runs the local backend
- **Node 22.18+** (`nvm install 22`) and **Yarn** (`npm install -g yarn`): run the script and build the web app
- **[Xcode](https://apps.apple.com/app/xcode/id497799835)** and **CocoaPods** (`brew install cocoapods`): build the iOS app and run the simulators
- **[Android Studio](https://developer.android.com/studio)** and **JDK 17** (`brew install --cask zulu@17`): build the Android app and run the emulator. Maestro uses the same JDK.
- **[Maestro](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli)** (`brew tap mobile-dev-inc/tap`, `brew trust --formula mobile-dev-inc/tap/maestro`, then `brew install mobile-dev-inc/tap/maestro`): taps through the app and takes the screenshots. Needs Java 17 or 21.

Then:

1. Start the backend once so it loads the dummy data: `cd app && docker compose up -d`
2. Install the app dependencies: `npm ci` in `app/mobile` and `yarn install` in `app/web`
3. In Xcode (**Window → Devices and Simulators**), add an **iPhone 17 Pro Max** and an **iPad Pro 13-inch (M5)** simulator
4. In Android Studio, install **Android SDK Platform 36** (**Settings → Languages & Frameworks → Android SDK**) and create a phone emulator (**Device Manager**). Then add these to your shell profile (e.g. `~/.zshrc`):

   ```bash
   export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
   ```

Only need one platform? Skip Xcode or Android Studio and pass `--platform android` or `--platform ios`.

## Usage

1. Start the local backend (`docker compose up` in `app/`) and **stop your web dev server**. The script serves its own build on port 3000.
2. From `app/mobile`, run:

   ```bash
   npm run store-screenshots                    # everything
   npm run store-screenshots -- --platform ios  # just iPhone and iPad
   npm run store-screenshots -- --build         # rebuild the apps after app changes
   npm run store-screenshots -- --compose-only  # just redo the frames, e.g. after editing captions
   ```

3. Upload the images from `output/en/<store>/<size>/`.

The first run builds the apps, which takes a while. While it runs, the script restarts your local backend with a tweaked cookie setting that iOS needs, and puts it back when it's done. To look around the seeded app yourself, log in as `maya_r` / `store-screenshots`.
