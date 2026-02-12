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
 * Extracts the navigation path from a notification URL.
 * Used by push notification handlers to navigate to the correct screen.
 *
 * External URLs (like Stripe receipts) are opened in the browser instead.
 *
 * @param url - Full URL (e.g., "https://couchers.org/messages/123") or path
 * @returns The path to navigate to (e.g., "/messages/123"), or null if invalid/external
 */
export function getNotificationPath(url: string | undefined): string | null {
  if (typeof url !== "string") {
    return null;
  }

  try {
    const urlObj = new URL(url);

    // Check if this is a Couchers URL (should navigate in-app)
    if (COUCHERS_HOSTS.includes(urlObj.host)) {
      return urlObj.pathname + urlObj.search;
    }

    // External URL (Stripe, etc.) - open in browser instead
    Linking.openURL(url).catch((err) => {
      if (__DEV__) {
        console.error("Failed to open external notification URL:", err);
      }
    });
    return null;
  } catch {
    // If URL parsing fails, assume it's already a path
    return url;
  }
}
