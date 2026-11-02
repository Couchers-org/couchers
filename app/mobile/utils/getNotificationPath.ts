import { Linking } from "react-native";

// Couchers domains that should be handled in-app
const COUCHERS_HOSTS = [
  "couchers.org",
  "www.couchers.org",
  "next.couchers.org",
  "couchershq.org",
  "next.couchershq.org",
];

/**
 * Extracts the in-app path from a notification URL, without side effects.
 *
 * @param url - Full URL (e.g., "https://couchers.org/messages/123") or path
 * @returns The path (e.g., "/messages/123"), or null if invalid or external
 */
export function getInAppNotificationPath(
  url: string | undefined,
): string | null {
  if (typeof url !== "string") {
    return null;
  }

  try {
    const urlObj = new URL(url);
    return COUCHERS_HOSTS.includes(urlObj.host)
      ? urlObj.pathname + urlObj.search
      : null;
  } catch {
    // If URL parsing fails, assume it's already a path
    return url;
  }
}

/**
 * Extracts the navigation path from a notification URL.
 * Used by push notification handlers to navigate to the correct screen.
 *
 * External URLs (like Stripe receipts) are opened in the browser instead.
 *
 * @param url - Full URL (e.g., "https://couchers.org/messages/123") or path
 * @returns The path to navigate to (e.g., "/messages/123"), or null if invalid/external
 */
export function getNotificationPath(url: string | undefined): string | null {
  const path = getInAppNotificationPath(url);

  if (path === null && typeof url === "string") {
    // External URL (Stripe, etc.) - open in browser instead
    Linking.openURL(url).catch((err) => {
      if (__DEV__) {
        console.error("Failed to open external notification URL:", err);
      }
    });
  }
  return path;
}
