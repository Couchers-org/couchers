import Constants from "expo-constants";
import { Platform } from "react-native";

// Mirrors WKAppBoundDomains in the Info.plist (see app.config.js).
const appBoundDomains: string[] =
  (Constants.expoConfig?.extra?.appBoundDomains as string[] | undefined) ?? [];

// WKWebView only runs service workers (used for offline support) on app-bound domains.
// Opting in when the web URL isn't listed would block every navigation, so only do it for listed hosts.
export function shouldLimitToAppBoundDomains(webBaseUrl: string): boolean {
  if (Platform.OS !== "ios") {
    return false;
  }
  const host = webBaseUrl.match(/^https?:\/\/([^/:?#]+)/i)?.[1]?.toLowerCase();
  return !!host && appBoundDomains.includes(host);
}
