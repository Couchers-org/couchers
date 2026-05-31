import * as Application from "expo-application";
import Constants from "expo-constants";
import { Platform } from "react-native";

const appVersion = Constants.expoConfig?.version ?? "unknown";
const gitHash = Constants.expoConfig?.extra?.gitHash ?? "unknown";
// Constants.nativeBuildVersion was removed in recent Expo SDKs; expo-application
// reads the build number from the native build at runtime, so it works even
// with EAS remote/auto-incremented version codes.
const nativeBuildVersion = Application.nativeBuildVersion ?? "unknown";

export const applicationNameForUserAgent = `CouchersNative/${appVersion} (${Platform.OS}; build ${nativeBuildVersion}; ${gitHash})`;
