import { theme } from "theme";
import { getNativePlatform } from "utils/nativeLink";

export type ClientPlatform =
  | "web_desktop"
  | "web_mobile"
  | "app_ios"
  | "app_android";

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
  if (nativePlatform === "ios") return "app_ios";
  if (nativePlatform === "android") return "app_android";
  if (typeof window === "undefined" || !window.matchMedia) return null;
  return isMobileViewport() ? "web_mobile" : "web_desktop";
}
