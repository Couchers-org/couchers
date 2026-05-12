import Constants from "expo-constants";
import { Platform } from "react-native";

const appVersion = Constants.expoConfig?.version ?? "unknown";
const gitHash = Constants.expoConfig?.extra?.gitHash ?? "unknown";
const nativeVersion = Constants.nativeBuildVersion ?? "unknown";

export const applicationNameForUserAgent = `CouchersNative/${appVersion} (${Platform.OS}; build ${nativeVersion}; ${gitHash})`;
