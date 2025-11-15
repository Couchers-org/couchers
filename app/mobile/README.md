# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies (and native modules used by the app)

   ```bash
   npm install
   npx expo install expo-notifications expo-device
   ```

2. Generate the gRPC-Web stubs to extract the latest protos (needed any time `/proto` changes)

   ```bash
   npm run build:protos
   ```

3. If you haven't created a local development build yet (required for native modules such as `expo-notifications`/`expo-device`), build once per platform:

   ```bash
   # For iOS
   npx expo run:ios

   # For Android
   npx expo run:android
   ```

4. Start the app (this will reuse the dev build/emulator or Expo Go, depending on what you choose in the Metro UI)

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **mobile** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).


## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
