/**
 * Extracts the navigation path from a notification URL.
 * Used by push notification handlers to navigate to the correct screen.
 *
 * @param url - Full URL (e.g., "https://couchers.org/messages/123") or path
 * @returns The path to navigate to (e.g., "/messages/123"), or null if invalid
 */
export function getNotificationPath(url: string | undefined): string | null {
  if (typeof url !== "string") {
    return null;
  }

  try {
    // Extract path from full URL (e.g., "https://couchers.org/messages/123" -> "/messages/123")
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    // If URL parsing fails, assume it's already a path
    return url;
  }
}
