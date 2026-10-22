import * as Application from "expo-application";
import Constants from "expo-constants";
import { Platform } from "react-native";

// From the binary, not Constants.expoConfig: after an OTA, expoConfig reports the
// running bundle's idea of the store version, which the binary may not be.
const appVersion = Application.nativeApplicationVersion ?? "unknown";
const nativeBuildVersion = Application.nativeBuildVersion ?? "unknown";
// Re-baked per OTA, so it identifies the bundle actually serving the request.
const debugVersion = Constants.expoConfig?.extra?.debugVersion ?? "unknown";

export const applicationNameForUserAgent = `CouchersNative/${appVersion} (${Platform.OS}; build ${nativeBuildVersion}; ${debugVersion})`;
