import { theme } from "theme";

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
// determined (e.g. during server-side rendering). Requests from web views inside
// the native app are reported as web_desktop/web_mobile based on viewport.
export function getClientPlatform(): ClientPlatform | null {
  if (typeof window === "undefined" || !window.matchMedia) return null;
  return isMobileViewport() ? "web_mobile" : "web_desktop";
}
