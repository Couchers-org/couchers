import { theme } from "theme";

export type ClientPlatform =
  | "web_desktop"
  | "web_mobile"
  | "app_ios"
  | "app_android";

// The native app's web views append this token to the browser user agent
// (app/mobile/utils/userAgent.ts); it's the only in-app signal every shipped app
// build already sends.
const NATIVE_USER_AGENT = /\bCouchersNative\/\S+\s+\((ios|android);/;

function getNativePlatform(): ClientPlatform | null {
  if (typeof navigator === "undefined") return null;
  const os = NATIVE_USER_AGENT.exec(navigator.userAgent)?.[1];
  if (os === "ios") return "app_ios";
  if (os === "android") return "app_android";
  return null;
}

// Matches the app's own "mobile" breakpoint (theme.breakpoints.down("md")).
function isMobileViewport(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  const query = theme.breakpoints.down("md").replace("@media ", "");
  return window.matchMedia(query).matches;
}

// The client platform a request is coming from, or null when it can't be
// determined (e.g. during server-side rendering).
export function getClientPlatform(): ClientPlatform | null {
  const nativePlatform = getNativePlatform();
  if (nativePlatform) return nativePlatform;
  if (typeof window === "undefined" || !window.matchMedia) return null;
  return isMobileViewport() ? "web_mobile" : "web_desktop";
}
