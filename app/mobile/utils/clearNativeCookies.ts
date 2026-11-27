import * as ReactNative from "react-native";

type NetworkingModule = {
  clearCookies(callback: (cleared: boolean) => void): void;
};

// React Native exports Networking at runtime but only types it from 0.87
// TODO(NA): with Expo SDK 58 (RN 0.88), drop this cast and import { Networking } from "react-native"
const { Networking } = ReactNative as unknown as {
  Networking: NetworkingModule;
};

/**
 * Clears the cookies the app's own requests use (NSHTTPCookieStorage on iOS,
 * CookieManager on Android). WebView cookies on iOS are separate and unaffected.
 */
export function clearNativeCookies(): void {
  Networking.clearCookies(() => {});
}
